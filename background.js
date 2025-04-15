// Background Service Worker

// Listener for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Form Fill Helper Extension Installed/Updated.");
  // You could potentially set default options here if needed
  // chrome.storage.sync.set({ userData: { firstName: "", ... } });
});

// Listener for messages from content scripts (optional for this basic setup,
// but useful for more complex interactions)
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("Message received in background:", request);

  if (request.action === "openJobTab") {
    if (request.url) {
      chrome.tabs.create({ url: request.url });
      sendResponse({ status: "Tab opening requested", url: request.url });
    } else {
       sendResponse({ status: "Error: No URL provided" });
    }
    return true; // Keep message channel open for async response
  }

  // Example: If content script needed data directly from background
  if (request.action === "getUserDataFromBackground") {
     chrome.storage.sync.get({ userData: {} }, (items) => {
        sendResponse({ userData: items.userData });
     });
     return true; // Indicate async response
  }

  // Add more message handlers as needed

});

// Listening for keyboard shortcuts (defined in manifest.json -> commands)
chrome.commands.onCommand.addListener((command) => {
  console.log(`Command received: ${command}`);

  if (command === "trigger-autofill") {
    // Get the active tab and send a message to trigger autofill
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        // First try to inject the content script if it's not already there
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ['content.js']
        }).then(() => {
          // Now send the message to trigger autofill
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "triggerAutofillFromPopup" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
              } else {
                console.log("Autofill triggered via keyboard shortcut", response);
              }
            }
          );
        }).catch(err => {
          console.error("Error injecting content script:", err);
        });
      } else {
        console.error("No active tab found");
      }
    });
  }
});

console.log("Background service worker started.");