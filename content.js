console.log("Content Script Loaded");

// --- Helper Function to Fill Input ---
// Tries to find an element and fill it, returns true if successful
function fillInput(selector, value) {
  try {
    const element = document.querySelector(selector);
    if (element && value) {
      element.value = value;
      // Dispatch events to make sure frameworks recognize the change
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`Filled field '${selector}'`);
      return true;
    } else if (!element) {
      console.warn(`Element not found for selector: ${selector}`);
    }
  } catch (error) {
    console.error(`Error filling field '${selector}':`, error);
  }
  return false;
}

// --- Main Logic ---
function tryAutoFill() {
  console.log("Attempting to autofill...");

  // 1. Get user data from storage
  chrome.storage.sync.get({ userData: {} }, (items) => {
    const userData = items.userData;

    if (!userData || !userData.email) { // Check if essential data exists
      console.warn("User data not found or incomplete in storage. Please set it in the extension options.");
      // Maybe add a visual indicator to the page here
      return;
    }

    console.log("Retrieved user data:", userData);

    // 2. Find and fill form fields using common selectors that work across most websites

    // Try multiple selector patterns for each field type
    // First name field - try various common selectors
    const firstNameFilled =
      fillInput('input[id*="first_name"]', userData.firstName) ||
      fillInput('input[id*="firstName"]', userData.firstName) ||
      fillInput('input[name*="first_name"]', userData.firstName) ||
      fillInput('input[name*="firstName"]', userData.firstName) ||
      fillInput('input[placeholder*="First name"]', userData.firstName) ||
      fillInput('input[placeholder*="first name"]', userData.firstName) ||
      fillInput('input[aria-label*="First name"]', userData.firstName);

    // Last name field - try various common selectors
    const lastNameFilled =
      fillInput('input[id*="last_name"]', userData.lastName) ||
      fillInput('input[id*="lastName"]', userData.lastName) ||
      fillInput('input[name*="last_name"]', userData.lastName) ||
      fillInput('input[name*="lastName"]', userData.lastName) ||
      fillInput('input[placeholder*="Last name"]', userData.lastName) ||
      fillInput('input[placeholder*="last name"]', userData.lastName) ||
      fillInput('input[aria-label*="Last name"]', userData.lastName);

    // Email field - try various common selectors
    const emailFilled =
      fillInput('input[type="email"]', userData.email) ||
      fillInput('input[id*="email"]', userData.email) ||
      fillInput('input[name*="email"]', userData.email) ||
      fillInput('input[placeholder*="Email"]', userData.email) ||
      fillInput('input[placeholder*="email"]', userData.email) ||
      fillInput('input[aria-label*="Email"]', userData.email);

    // Phone field - try various common selectors
    const phoneFilled =
      fillInput('input[type="tel"]', userData.phone) ||
      fillInput('input[id*="phone"]', userData.phone) ||
      fillInput('input[name*="phone"]', userData.phone) ||
      fillInput('input[placeholder*="Phone"]', userData.phone) ||
      fillInput('input[placeholder*="phone"]', userData.phone) ||
      fillInput('input[aria-label*="Phone"]', userData.phone);

    // Log results
    console.log("Fields filled - First name:", firstNameFilled, "Last name:", lastNameFilled,
               "Email:", emailFilled, "Phone:", phoneFilled);

    // Try to fill name field if first and last name weren't filled separately
    if (!firstNameFilled && !lastNameFilled) {
      const fullName = `${userData.firstName} ${userData.lastName}`.trim();
      if (fullName) {
        const nameFilled =
          fillInput('input[id*="name"]', fullName) ||
          fillInput('input[name*="name"]', fullName) ||
          fillInput('input[placeholder*="Name"]', fullName) ||
          fillInput('input[placeholder*="name"]', fullName) ||
          fillInput('input[aria-label*="Name"]', fullName);

        console.log("Full name field filled:", nameFilled);
      }
    }

    console.log("Autofill attempt finished.");
  });
}

// --- Triggering the Autofill ---
// How should the autofill start?
// Option 1: Run automatically after a delay (can be disruptive)
// window.setTimeout(tryAutoFill, 2000); // Wait 2 seconds for page load

// Option 2: Add a button to the page for the user to click
function addButton() {
    if(document.getElementById('autofill-trigger-button')) return; // Don't add multiple buttons

    const button = document.createElement('button');
    button.textContent = 'Fill Form';
    button.id = 'autofill-trigger-button';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '8px 15px';
    button.style.backgroundColor = '#0073b1';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    button.onclick = tryAutoFill;

    document.body.appendChild(button);
}

// Add the button on pages that might have forms
// Check if the page has any input fields that might be part of a form
function checkForFormFields() {
  const formElements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
  return formElements.length > 0;
}

// Wait for the page to load, then check if it has form fields
window.setTimeout(() => {
  if (checkForFormFields()) {
    addButton();
  } else {
    console.log("No form fields detected on this page.");
  }
}, 1500);


// This extension now focuses on general form filling across all websites


// Add this at the end of content.js
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "triggerAutofillFromPopup") {
    console.log("Autofill triggered from popup or keyboard shortcut.");

    // Show a temporary notification to the user
    showNotification("Auto-filling form fields...");

    // Call the autofill function
    tryAutoFill();

    sendResponse({ status: "Autofill initiated" });
  }
  return true; // Keep the message channel open for async response
});

// Function to show a temporary notification
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