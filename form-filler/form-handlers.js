/**
 * Fill-In Extension - Form Handlers
 *
 * Specialized handlers for different types of forms.
 */

/**
 * Handles Angular-specific form filling
 */
function handleAngularForms() {
  // Get user data from storage
  chrome.storage.sync.get({ userData: {} }, (items) => {
    const userData = items.userData;

    if (!userData || !userData.email) {
      console.warn("User data not found or incomplete in storage.");
      return;
    }

    // Try to fill Angular form fields by their autocomplete attributes
    const firstNameField = document.querySelector('input[autocomplete="given-name"]');
    if (firstNameField && userData.firstName) {
      firstNameField.value = userData.firstName;
      triggerInputEvents(firstNameField);
      console.log("Filled Angular first name field");
    }

    const lastNameField = document.querySelector('input[autocomplete="family-name"]');
    if (lastNameField && userData.lastName) {
      lastNameField.value = userData.lastName;
      triggerInputEvents(lastNameField);
      console.log("Filled Angular last name field");
    }

    const emailField = document.querySelector('input[autocomplete="email"]');
    if (emailField && userData.email) {
      emailField.value = userData.email;
      triggerInputEvents(emailField);
      console.log("Filled Angular email field");
    }

    const phoneField = document.querySelector('input[autocomplete="tel"]');
    if (phoneField && userData.phone) {
      phoneField.value = userData.phone;
      triggerInputEvents(phoneField);
      console.log("Filled Angular phone field");
    }

    const cityField = document.querySelector('input[autocomplete="address-level2"]');
    if (cityField && userData.city) {
      cityField.value = userData.city;
      triggerInputEvents(cityField);
      console.log("Filled Angular city field");
    }

    const countryField = document.querySelector('select[autocomplete="country-name"]');
    if (countryField && userData.country) {
      // For select elements, we need to find the option with the matching text
      const options = Array.from(countryField.options);
      const matchingOption = options.find(option =>
        option.text.toLowerCase().includes(userData.country.toLowerCase()));

      if (matchingOption) {
        countryField.value = matchingOption.value;
        countryField.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("Filled Angular country field");
      }
    }
  });
}

/**
 * Handles citizenship and work authorization fields
 * @param {Object} userData - User data from storage
 * @returns {boolean} - True if any field was filled
 */
function handleCitizenshipFields(userData) {
  if (!userData.workAuth) return false;

  let citizenshipFilled = false;

  // First, try a direct approach for the specific radio button
  const nonEURadio = document.querySelector('input[type="radio"][value="I am a non-EU citizen and currently require a work permit to work in Hungary"]');
  if (nonEURadio && (userData.workAuth.includes('non-EU citizen') || userData.workAuth === 'I am a non-EU citizen and currently require a work permit to work in Hungary')) {
    nonEURadio.checked = true;
    triggerInputEvents(nonEURadio);
    nonEURadio.dispatchEvent(new Event('click', { bubbles: true }));
    console.log('Selected non-EU citizen radio button directly');
    citizenshipFilled = true;
  } else {
    // If direct approach didn't work, try to find the specific citizenship question container
    const citizenshipLabels = Array.from(document.querySelectorAll('.application-label'));
    let citizenshipContainer = null;

    // Look for the citizenship/work authorization question
    for (const label of citizenshipLabels) {
      if (label.textContent.toLowerCase().includes('citizenship') ||
          label.textContent.toLowerCase().includes('work authorization')) {
        // Found the label, now find the associated radio button group
        const parent = label.closest('div');
        if (parent && parent.nextElementSibling) {
          citizenshipContainer = parent.nextElementSibling.querySelector('ul[data-qa="multiple-choice"]');
          if (citizenshipContainer) break;
        }
      }
    }

    // If we found the container, try to select the appropriate radio button
    if (citizenshipContainer) {
      // First, try to directly match the exact radio button text
      const radioLabels = Array.from(citizenshipContainer.querySelectorAll('label'));
      let exactMatchFound = false;

      // Try to find an exact match for the non-EU citizen with work permit option
      for (const label of radioLabels) {
        if (label.textContent.includes('non-EU citizen') && label.textContent.includes('work permit')) {
          const radio = label.querySelector('input[type="radio"]');
          if (radio) {
            radio.checked = true;
            triggerInputEvents(radio);
            radio.dispatchEvent(new Event('click', { bubbles: true }));
            console.log(`Selected radio option (exact match): ${label.textContent.trim()}`);
            citizenshipFilled = true;
            exactMatchFound = true;
            break;
          }
        }
      }

      // If no exact match was found, use the mapping approach
      if (!exactMatchFound) {
        // Map the workAuth value to the appropriate radio option
        let optionToSelect = '';

        if (userData.workAuth.includes('EU Citizen') || userData.workAuth.includes('EU Blue Card')) {
          optionToSelect = 'I am an EU citizen';
        } else if (userData.workAuth.includes('Hungary')) {
          optionToSelect = 'I am a citizen of Hungary';
        } else if (userData.workAuth.includes('Work Permit') || userData.workAuth.includes('Visa') ||
                  userData.workAuth.includes('International') || userData.workAuth.includes('non-EU')) {
          optionToSelect = 'non-EU citizen'; // Partial match for the work permit option
        } else if (userData.workAuth.includes('family') || userData.workAuth.includes('refugee') ||
                  userData.workAuth.includes('asylum') || userData.workAuth.includes('special authorization')) {
          optionToSelect = 'special authorization';
        } else {
          optionToSelect = 'Other';
        }

        // Try to select the appropriate radio button
        citizenshipFilled = selectRadioByLabel(citizenshipContainer, optionToSelect);
      }
    } else {
      // If we couldn't find the specific container, try with the general selector
      const generalContainer = document.querySelector('.application-field.full-width.required-field ul[data-qa="multiple-choice"]');
      if (generalContainer) {
        // Try to find the non-EU citizen option directly
        const radioLabels = Array.from(generalContainer.querySelectorAll('label'));
        for (const label of radioLabels) {
          if (label.textContent.includes('non-EU citizen') && label.textContent.includes('work permit')) {
            const radio = label.querySelector('input[type="radio"]');
            if (radio) {
              radio.checked = true;
              triggerInputEvents(radio);
              radio.dispatchEvent(new Event('click', { bubbles: true }));
              console.log(`Selected radio option (general container): ${label.textContent.trim()}`);
              citizenshipFilled = true;
              break;
            }
          }
        }

        // If direct match didn't work, try with partial match
        if (!citizenshipFilled) {
          citizenshipFilled = selectRadioByLabel(generalContainer, 'non-EU citizen');
        }
      }
    }

    // If the specific selectors didn't work, try a more general approach
    if (!citizenshipFilled) {
      citizenshipFilled = fillInputByLabel('citizenship', userData.workAuth) ||
                        fillInputByLabel('work authorization', userData.workAuth);
    }
  }

  return citizenshipFilled;
}

/**
 * Handles English fluency fields
 * @param {Object} userData - User data from storage
 * @returns {boolean} - True if any field was filled
 */
function handleEnglishFluencyFields(userData) {
  if (!userData.englishFluency) return false;

  let englishFluencyFilled = false;

  // First try to find the specific English fluency container
  const englishFluencyContainer = Array.from(document.querySelectorAll('.application-label'));
  let englishFluencyUl = null;

  for (const label of englishFluencyContainer) {
    if (label.textContent.toLowerCase().includes('english fluency') ||
        label.textContent.toLowerCase().includes('fluency in english')) {
      // Found the label, now find the associated radio button group
      const parent = label.closest('div');
      if (parent && parent.nextElementSibling) {
        englishFluencyUl = parent.nextElementSibling.querySelector('ul[data-qa="multiple-choice"]');
        if (englishFluencyUl) break;
      }
    }
  }

  if (englishFluencyUl) {
    englishFluencyFilled = selectRadioByLabel(englishFluencyUl, userData.englishFluency);
  }

  // If the specific approach didn't work, try more general methods
  if (!englishFluencyFilled) {
    englishFluencyFilled =
      selectRadioByLabel('.application-field.full-width.required-field ul[data-qa="multiple-choice"]', userData.englishFluency) ||
      fillInputByLabel('English fluency', userData.englishFluency) ||
      fillInputByLabel('fluency in English', userData.englishFluency);
  }

  return englishFluencyFilled;
}
