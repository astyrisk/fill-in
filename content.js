console.log("LinkedIn Helper Content Script Loaded");

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

    // 2. Find and fill form fields (THE HARD PART - REQUIRES REAL SELECTORS)
    // These selectors are PLACEHOLDERS - you MUST find the correct ones by
    // inspecting the LinkedIn Easy Apply form HTML structure.
    // They WILL change over time. Look for stable attributes like 'id', 'name',
    // 'aria-label', or sometimes specific 'data-*' attributes. Avoid relying solely on CSS classes.

    // Example structure for Easy Apply (HIGHLY LIKELY TO BE INCORRECT/OUTDATED):
    fillInput('input[id*="firstName"]', userData.firstName); // Example: input with id containing "firstName"
    fillInput('input[id*="lastName"]', userData.lastName);
    fillInput('input[type="email"]', userData.email); // Might be prefilled by LinkedIn
    fillInput('input[type="tel"]', userData.phone); // Phone format might need checking

    // Example for a custom question (extremely difficult to generalize)
    // fillInput('textarea[aria-label*="experience"]', "My relevant experience is...");

    // Handling Radio Buttons/Checkboxes (Example)
    // try {
    //   const yesRadio = document.querySelector('input[type="radio"][value="Yes"][name*="workAuthorization"]'); // Placeholder selector
    //   if (yesRadio) {
    //     yesRadio.click();
    //     console.log("Clicked 'Yes' radio button");
    //   }
    // } catch (e) { console.error("Error clicking radio", e); }

    // Handling Dropdowns (Example)
    // try {
    //    const dropdown = document.querySelector('select[id*="country"]'); // Placeholder selector
    //    if(dropdown && userData.countryCode) {
    //        dropdown.value = userData.countryCode; // e.g., "US"
    //        dropdown.dispatchEvent(new Event('change', { bubbles: true }));
    //        console.log("Selected country dropdown");
    //    }
    // } catch(e) { console.error("Error selecting dropdown", e); }

    // 3. Find 'Next' or 'Submit' buttons (USE EXTREME CAUTION WITH AUTO-SUBMIT)
    // It's generally safer to just fill the fields and let the user click submit.
    // const nextButton = document.querySelector('button[aria-label*="Next"]'); // Placeholder
    // const submitButton = document.querySelector('button[aria-label*="Submit application"]'); // Placeholder

    // if (nextButton) {
    //    console.log("Found 'Next' button. Consider clicking it manually.");
    //    // nextButton.click(); // Uncomment cautiously
    // } else if (submitButton) {
    //     console.log("Found 'Submit' button. VERY CAREFUL! Review before submitting.");
    //    // submitButton.click(); // Uncomment VERY cautiously
    // } else {
    //    console.log("Could not find Next or Submit button with current selectors.");
    // }

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
    button.textContent = 'Autofill My Info';
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

// Add the button only on pages that look like job application forms
// This check is very basic - improve it for reliability
if (window.location.href.includes('/jobs/view/')) {
   // Wait a bit for the page elements to likely exist
   window.setTimeout(addButton, 1500);
}


// --- Optional: Find Job Links on Search Pages ---
// (This part would run on job search results pages, based on manifest `matches`)
function findAndMarkJobLinks() {
    // Placeholder selector for job links on a search results page
    const jobLinks = document.querySelectorAll('a[href*="/jobs/view/"]');
    console.log(`Found ${jobLinks.length} potential job links.`);

    jobLinks.forEach(link => {
        // Example: Add a button next to each link to open it via background script
        const openButton = document.createElement('button');
        openButton.textContent = 'Open';
        openButton.style.marginLeft = '10px';
        openButton.style.fontSize = '0.8em';
        openButton.onclick = (e) => {
            e.preventDefault(); // Prevent default link navigation
            e.stopPropagation(); // Stop event bubbling
            console.log(`Requesting to open: ${link.href}`);
            chrome.runtime.sendMessage(
                { action: "openJobTab", url: link.href },
                (response) => {
                    console.log("Background script response:", response);
                }
            );
        };
        // Try inserting the button nicely (might need specific selectors depending on page structure)
        link.parentNode.insertBefore(openButton, link.nextSibling);
    });
}

if (window.location.href.includes('/jobs/collections/')) {
   // Wait a bit before trying to find links
   window.setTimeout(findAndMarkJobLinks, 2000);
}