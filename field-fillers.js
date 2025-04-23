/**
 * Fill-In Extension - Field Fillers
 *
 * Functions for filling different types of form fields.
 */

/**
 * Tries to find an element by selector and fill it with a value
 * @param {string} selector - CSS selector for the input element
 * @param {string} value - Value to fill in the element
 * @returns {boolean} - True if successful, false otherwise
 */
function fillInput(selector, value) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.log(`Element not found for selector: ${selector}`);
      return false;
    }

    if (!value) return false;

    // Handle React select components
    if (element.classList.contains('select__input')) {
      // For React select components, we need to handle them differently
      const selectContainer = element.closest('.select__container');
      if (selectContainer) {
        // Click on the select to open the dropdown
        const selectControl = selectContainer.querySelector('.select__control');
        if (selectControl) {
          selectControl.click();

          // Wait a bit for the dropdown to open
          setTimeout(() => {
            // Try to find and click the option that matches our value
            const options = document.querySelectorAll('.select__option');
            for (const option of options) {
              if (option.textContent.toLowerCase().includes(value.toLowerCase())) {
                option.click();
                console.log(`Selected option '${option.textContent}' in React select`);
                return;
              }
            }
          }, 300);

          return true;
        }
      }
    }

    // Standard input handling
    element.value = value;
    triggerInputEvents(element);
    console.log(`Filled field '${selector}'`);
    return true;
  } catch (error) {
    console.error(`Error filling field '${selector}':`, error);
    return false;
  }
}

/**
 * Fills an input field identified by its label text
 * @param {string} labelText - Text content of the label
 * @param {string} value - Value to fill in the field
 * @returns {boolean} - True if successful, false otherwise
 */
function fillInputByLabel(labelText, value) {
  try {
    const input = findInputByLabelText(labelText);
    if (!input || !value) {
      if (!input) console.warn(`Input not found for label text: ${labelText}`);
      return false;
    }

    // Handle React select components
    if (input.classList.contains('select__input')) {
      // For React select components, we need to handle them differently
      const selectContainer = input.closest('.select__container');
      if (selectContainer) {
        // Click on the select to open the dropdown
        const selectControl = selectContainer.querySelector('.select__control');
        if (selectControl) {
          selectControl.click();

          // Wait a bit for the dropdown to open
          setTimeout(() => {
            // Try to find and click the option that matches our value
            const options = document.querySelectorAll('.select__option');
            for (const option of options) {
              if (option.textContent.toLowerCase().includes(value.toLowerCase())) {
                option.click();
                console.log(`Selected option '${option.textContent}' in React select for label '${labelText}'`);
                return;
              }
            }
          }, 500); // Increased timeout for slower pages

          return true;
        }
      }

      // Special handling for the "How did you hear about" dropdown
      if (labelText.toLowerCase().includes('how did you hear')) {
        // Try to find the dropdown button and click it
        const dropdownButton = document.querySelector('.select__control .icon-button');
        if (dropdownButton) {
          dropdownButton.click();

          // Wait a bit for the dropdown to open
          setTimeout(() => {
            // Try to find and click the option that matches our value
            const options = document.querySelectorAll('.select__option');
            for (const option of options) {
              if (option.textContent.toLowerCase().includes(value.toLowerCase())) {
                option.click();
                console.log(`Selected option '${option.textContent}' in dropdown for '${labelText}'`);
                return;
              }
            }
          }, 500); // Increased timeout for slower pages

          return true;
        }
      }
    } else {
      // Standard input handling
      input.value = value;
      triggerInputEvents(input);
      console.log(`Filled field with label '${labelText}'`);
    }
    return true;
  } catch (error) {
    console.error(`Error filling field with label '${labelText}':`, error);
    return false;
  }
}

/**
 * Selects a radio button by its label text within a container
 * @param {string|Element} containerSelectorOrElement - Container of radio buttons
 * @param {string} optionText - Text of the option to select
 * @returns {boolean} - True if successful, false otherwise
 */
function selectRadioByLabel(containerSelectorOrElement, optionText) {
  try {
    // Find the container
    let container;
    if (typeof containerSelectorOrElement === 'string') {
      container = document.querySelector(containerSelectorOrElement);
    } else if (containerSelectorOrElement instanceof Element) {
      container = containerSelectorOrElement;
    }

    if (!container) {
      console.warn(`Radio button container not found: ${containerSelectorOrElement}`);
      return false;
    }

    const labels = Array.from(container.querySelectorAll('label'));

    // Try exact match first
    for (const label of labels) {
      if (label.textContent.trim() === optionText) {
        const radio = label.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          triggerInputEvents(radio);
          radio.dispatchEvent(new Event('click', { bubbles: true }));
          console.log(`Selected radio option (exact match): ${optionText}`);
          return true;
        }
      }
    }

    // Try partial match if exact match fails
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes(optionText.toLowerCase())) {
        const radio = label.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          triggerInputEvents(radio);
          radio.dispatchEvent(new Event('click', { bubbles: true }));
          console.log(`Selected radio option (partial match): ${optionText} in ${label.textContent.trim()}`);
          return true;
        }
      }
    }

    console.warn(`Radio option not found: ${optionText}`);
    return false;
  } catch (error) {
    console.error(`Error selecting radio option '${optionText}':`, error);
    return false;
  }
}

/**
 * Finds and fills a textarea by its label text
 * @param {string} labelText - Text content of the label
 * @param {string} value - Value to fill in the textarea
 * @returns {boolean} - True if successful, false otherwise
 */
function fillTextareaByLabel(labelText, value) {
  try {
    // Try application-specific labels first
    const labels = Array.from(document.querySelectorAll('.application-label'));
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
        const parent = label.closest('div');
        if (parent) {
          const textarea = parent.parentElement.querySelector('textarea');
          if (textarea && value) {
            textarea.value = value;
            triggerInputEvents(textarea);
            console.log(`Filled textarea with label '${labelText}'`);
            return true;
          }
        }
      }
    }

    // Fall back to general approach
    return fillInputByLabel(labelText, value);
  } catch (error) {
    console.error(`Error filling textarea with label '${labelText}':`, error);
    return false;
  }
}

/**
 * Checks a checkbox by its label text
 * @param {string} labelText - Text content of the label
 * @returns {boolean} - True if successful, false otherwise
 */
function checkCheckboxByLabel(labelText) {
  try {
    // First try to find the GDPR consent checkbox directly
    const gdprCheckbox = document.querySelector('#gdpr_processing_consent_given_1');
    if (gdprCheckbox && !gdprCheckbox.checked && !gdprCheckbox.disabled) {
      gdprCheckbox.checked = true;
      triggerInputEvents(gdprCheckbox);
      console.log(`Checked GDPR consent checkbox directly`);
      return true;
    }

    // Find all labels that might match
    const labels = Array.from(document.querySelectorAll('label'));
    for (const label of labels) {
      if (label.textContent.toLowerCase().includes(labelText.toLowerCase())) {
        // Find the associated checkbox
        let checkbox = null;

        // Check if the label has a 'for' attribute
        if (label.htmlFor) {
          checkbox = document.getElementById(label.htmlFor);
        }

        // If not found by 'for', check if it's inside the label
        if (!checkbox) {
          checkbox = label.querySelector('input[type="checkbox"]');
        }

        // If still not found, check if it's a sibling
        if (!checkbox) {
          const wrapper = label.closest('.checkbox__wrapper');
          if (wrapper) {
            checkbox = wrapper.querySelector('input[type="checkbox"]');
          }
        }

        // If still not found, try to find it in the parent container
        if (!checkbox) {
          const container = label.closest('.checkbox');
          if (container) {
            checkbox = container.querySelector('input[type="checkbox"]');
          }
        }

        if (checkbox && !checkbox.checked && !checkbox.disabled) {
          checkbox.checked = true;
          triggerInputEvents(checkbox);
          console.log(`Checked checkbox with label '${labelText}'`);
          return true;
        }
      }
    }

    console.warn(`Checkbox with label '${labelText}' not found or already checked`);
    return false;
  } catch (error) {
    console.error(`Error checking checkbox with label '${labelText}':`, error);
    return false;
  }
}
