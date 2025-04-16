/**
 * Fill-In Extension - Utility Functions
 * 
 * Core utility functions for DOM manipulation and event handling.
 */

/**
 * Dispatches events to notify frameworks of input changes
 * @param {HTMLElement} element - The DOM element to trigger events on
 */
function triggerInputEvents(element) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Shows a temporary notification to the user
 * @param {string} message - Message to display in the notification
 */
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = '#4CAF50';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '10000';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

  // Add to page
  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

/**
 * Checks if the page has any input fields that might be part of a form
 * @returns {boolean} - True if form fields are detected
 */
function checkForFormFields() {
  const formElements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
  return formElements.length > 0;
}

/**
 * Detects if the page contains an Angular form
 * @returns {boolean} - True if Angular form is detected
 */
function isAngularForm() {
  return !!document.querySelector('[ng-model], [ng-form], [jv-form-field]');
}
