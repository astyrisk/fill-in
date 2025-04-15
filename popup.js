// Popup script for form filling extension

document.addEventListener('DOMContentLoaded', () => {
    const triggerButton = document.getElementById('triggerFillButton');
    const statusDisplay = document.getElementById('status');
    console.log("popup.js loaded");

    if (triggerButton) {
        triggerButton.addEventListener('click', () => {
            console.log("triggerFillButton clicked");

            statusDisplay.textContent = 'Attempting to fill...';

            // First check if we're on a LinkedIn page
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];

                if (!activeTab || !activeTab.id) {
                    statusDisplay.textContent = 'Error: Could not find active tab.';
                    console.error("Popup Error: No active tab found.");
                    return;
                }

                // No need to check for specific websites anymore as we support all sites

                // Try to inject the content script if it's not already there
                chrome.scripting.executeScript({
                    target: { tabId: activeTab.id },
                    files: ['content.js']
                }).then(() => {
                    // Now try to send the message
                    chrome.tabs.sendMessage(
                        activeTab.id,
                        { action: "triggerAutofillFromPopup" },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                statusDisplay.textContent = 'Error: Cannot connect to page.';
                                console.error("Popup Error:", chrome.runtime.lastError.message);
                            } else if (response && response.status) {
                                statusDisplay.textContent = `Status: ${response.status}`;
                            } else {
                                statusDisplay.textContent = 'Action requested.';
                            }
                        }
                    );
                }).catch(err => {
                    statusDisplay.textContent = 'Error: Could not inject content script.';
                    console.error("Script injection error:", err);
                });
            });
        });
    }
});