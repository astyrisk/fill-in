/**
 * Fill-In Extension - Form Element Finders
 *
 * Functions for finding form elements on the page.
 */

/**
 * Finds an input element by its associated label text
 * @param {string} labelText - Text content of the label to search for
 * @returns {HTMLElement|null} - The found input element or null
 */
function findInputByLabelText(labelText) {
  try {
    const normalizedLabelText = labelText.toLowerCase();

    // Method 1: Look for standard label elements
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes(normalizedLabelText)) {
        // Check for 'for' attribute
        if (label.htmlFor) {
          const input = document.getElementById(label.htmlFor);
          if (input) return input;
        }

        // Check for wrapped input
        const input = label.querySelector('input');
        if (input) return input;

        // Check for sibling input
        const nextInput = label.nextElementSibling;
        if (nextInput && (nextInput.tagName === 'INPUT' || nextInput.tagName === 'TEXTAREA')) {
          return nextInput;
        }

        // Check for nested input in sibling
        if (nextInput && nextInput.querySelector) {
          const nestedInput = nextInput.querySelector('input');
          if (nestedInput) return nestedInput;
        }

        // Check for Angular form structure
        const parentContainer = label.closest('.jv-form-field-input');
        if (parentContainer) {
          const controlDiv = parentContainer.querySelector('.jv-form-field-control');
          if (controlDiv) {
            const input = controlDiv.querySelector('input, select, textarea');
            if (input) return input;
          }
        }

        // Check for React form structure with input-wrapper
        const inputWrapper = label.closest('.input-wrapper');
        if (inputWrapper) {
          const input = inputWrapper.querySelector('input, select, textarea');
          if (input) return input;
        }

        // Check for React select component
        const selectContainer = label.closest('.select__container');
        if (selectContainer) {
          const selectInput = selectContainer.querySelector('.select__input');
          if (selectInput) return selectInput;
        }
      }
    }

    // Method 2: Look for div elements that might be acting as labels
    const divs = Array.from(document.querySelectorAll('div'));
    for (const div of divs) {
      if (div.textContent.toLowerCase().includes(normalizedLabelText)) {
        const parent = div.parentElement;
        if (parent) {
          // Check parent container
          const input = parent.querySelector('input');
          if (input) return input;

          // Check next sibling
          const nextSibling = div.nextElementSibling;
          if (nextSibling) {
            if (nextSibling.tagName === 'INPUT') return nextSibling;
            const nestedInput = nextSibling.querySelector('input');
            if (nestedInput) return nestedInput;
          }

          // Check for React select component
          const selectInput = parent.querySelector('.select__input');
          if (selectInput) return selectInput;
        }
      }
    }

    // Method 3: Handle specific field types with autocomplete attributes
    return findSpecificFieldByLabelType(normalizedLabelText);
  } catch (error) {
    console.error(`Error finding input by label text '${labelText}':`, error);
    return null;
  }
}

/**
 * Finds specific field types based on label text and autocomplete attributes
 * @param {string} normalizedLabelText - Lowercase label text
 * @returns {HTMLElement|null} - The found input element or null
 */
function findSpecificFieldByLabelType(normalizedLabelText) {
  // First name field
  if (normalizedLabelText.includes('first name') || normalizedLabelText === 'first') {
    const field = document.querySelector('.JVA_NAME input[autocomplete="given-name"]') ||
                  document.querySelector('input[autocomplete="given-name"]') ||
                  document.querySelector('input#first_name');
    if (field) return field;
  }

  // Last name field
  if (normalizedLabelText.includes('last name') || normalizedLabelText === 'last') {
    const field = document.querySelector('.JVA_NAME input[autocomplete="family-name"]') ||
                  document.querySelector('input[autocomplete="family-name"]') ||
                  document.querySelector('input#last_name');
    if (field) return field;
  }

  // Email field
  if (normalizedLabelText.includes('email')) {
    const field = document.querySelector('.JVA_EMAIL input[autocomplete="email"]') ||
                  document.querySelector('input[autocomplete="email"]') ||
                  document.querySelector('input#email');
    if (field) return field;
  }

  // Phone field
  if (normalizedLabelText.includes('phone')) {
    const field = document.querySelector('.JVA_PHONE input[autocomplete="tel"]') ||
                  document.querySelector('input[autocomplete="tel"]') ||
                  document.querySelector('input#phone');
    if (field) return field;
  }

  // City field
  if (normalizedLabelText.includes('city')) {
    const field = document.querySelector('input[autocomplete="address-level2"]');
    if (field) return field;
  }

  // Country field
  if (normalizedLabelText.includes('country')) {
    const field = document.querySelector('select[autocomplete="country-name"]') ||
                  document.querySelector('input[autocomplete="country-name"]');
    if (field) return field;
  }

  // LinkedIn profile field
  if (normalizedLabelText.includes('linkedin')) {
    // Try to find by ID first
    const field = document.querySelector('input#question_7483945005');
    if (field) return field;

    // If not found by ID, try to find by label
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes('linkedin profile')) {
        if (label.htmlFor) {
          const linkedinField = document.getElementById(label.htmlFor);
          if (linkedinField) return linkedinField;
        }
      }
    }
  }

  // Portfolio field
  if (normalizedLabelText.includes('portfolio') || normalizedLabelText.includes('website')) {
    // Try to find by ID first
    const field = document.querySelector('input#question_7483946005');
    if (field) return field;

    // If not found by ID, try to find by label
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes('portfolio') ||
          label.textContent.toLowerCase().includes('website')) {
        if (label.htmlFor) {
          const portfolioField = document.getElementById(label.htmlFor);
          if (portfolioField) return portfolioField;
        }
      }
    }
  }

  // How did you hear about field
  if (normalizedLabelText.includes('how did you hear')) {
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes('how did you hear')) {
        if (label.htmlFor) {
          const selectField = document.getElementById(label.htmlFor);
          if (selectField) return selectField;
        }
      }
    }
  }

  return null;
}
