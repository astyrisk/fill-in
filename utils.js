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
 * Converts LinkedIn relative time string to an actual date
 * @param {string} relativeTimeString - LinkedIn relative time string (e.g., "Posted 4 days ago", "Reposted 7 hours ago", "22 hours ago")
 * @returns {Object} - Object containing date information
 */
function convertRelativeTimeToDate(relativeTimeString) {
  if (!relativeTimeString) return null;

  // First try to match the standard format with "Posted" or "Reposted"
  let timeMatch = relativeTimeString.match(/(Posted|Reposted)\s+(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago/);
  let action = null;
  let amount = null;
  let unit = null;

  if (timeMatch) {
    // Standard format with action prefix
    [, action, amount, unit] = timeMatch;
  } else {
    // Try to match the format without "Posted" or "Reposted" prefix (e.g., "22 hours ago")
    timeMatch = relativeTimeString.match(/(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago/);

    if (timeMatch) {
      // Format without action prefix
      [, amount, unit] = timeMatch;
      action = 'Posted'; // Default to "Posted" when no action is specified
    } else {
      // If we can't parse the string, return the original string
      console.log('Could not parse relative time string:', relativeTimeString);
      return relativeTimeString;
    }
  }

  const numAmount = parseInt(amount, 10);

  // Create a new date object for the current time
  const date = new Date();

  // Subtract the appropriate amount of time based on the unit
  switch (unit) {
    case 'minute':
    case 'minutes':
      date.setMinutes(date.getMinutes() - numAmount);
      break;
    case 'hour':
    case 'hours':
      date.setHours(date.getHours() - numAmount);
      break;
    case 'day':
    case 'days':
      date.setDate(date.getDate() - numAmount);
      break;
    case 'week':
    case 'weeks':
      date.setDate(date.getDate() - (numAmount * 7));
      break;
    case 'month':
    case 'months':
      date.setMonth(date.getMonth() - numAmount);
      break;
    default:
      console.log('Unknown time unit:', unit);
      return relativeTimeString;
  }

  // Return the date in ISO format
  return {
    originalText: relativeTimeString,
    action: action, // 'Posted', 'Reposted', or null if not specified
    isoDate: date.toISOString(),
    formattedDate: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  };
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
