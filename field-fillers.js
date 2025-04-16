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
    
    input.value = value;
    triggerInputEvents(input);
    console.log(`Filled field with label '${labelText}'`);
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
