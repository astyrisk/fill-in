document.addEventListener('DOMContentLoaded', () => {
    const triggerButton = document.getElementById('triggerFillButton');
    const statusDisplay = document.getElementById('status');
    // const optionsLink = document.getElementById('optionsLink'); // If needed

    if (triggerButton) {
        triggerButton.addEventListener('click', () => {
            statusDisplay.textContent = 'Attempting to fill...';

            // Find the active tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab && activeTab.id) {
                     // Send a message TO the content script running in that tab
                     // NOTE: The content script (content.js) needs a listener for this message!
                    chrome.tabs.sendMessage(
                        activeTab.id,
                        { action: "triggerAutofillFromPopup" }, // Define this action in content.js
                        (response) => {
                            // Handle response from content script (if it sends one)
                            if (chrome.runtime.lastError) {
                                // Handle errors like no content script listening
                                statusDisplay.textContent = 'Error: Cannot connect to page.';
                                console.error("Popup Error:", chrome.runtime.lastError.message);
                            } else if (response && response.status) {
                                statusDisplay.textContent = `Status: ${response.status}`;
                            } else {
                                statusDisplay.textContent = 'Action requested.'; // Default if no response
                            }
                        }
                    );
                } else {
                    statusDisplay.textContent = 'Error: Could not find active tab.';
                     console.error("Popup Error: No active tab found.");
                }
            });
        });
    }

    // Optional: Add any other initialization logic for the popup here
    // For example, checking if the user has saved settings yet.
});

// --- IMPORTANT ---
// You will need to ADD a message listener inside your `content.js` file
// to receive the "triggerAutofillFromPopup" message and call your
// `tryAutoFill()` function when it's received.
// Example to add in content.js:
/*
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "triggerAutofillFromPopup") {
    console.log("Autofill triggered from popup.");
    tryAutoFill(); // Call your existing function
    sendResponse({ status: "Autofill initiated" }); // Optional: send confirmation back
  }
});
*/