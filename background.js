// Background Service Worker

// Listener for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("LinkedIn Basic Helper Extension Installed/Updated.");
  // You could potentially set default options here if needed
  // chrome.storage.sync.set({ userData: { firstName: "", ... } });
});

// Listener for messages from content scripts (optional for this basic setup,
// but useful for more complex interactions)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

// Example: Listening for a keyboard shortcut (defined in manifest.json -> commands)
// chrome.commands.onCommand.addListener((command) => {
//   console.log(`Command: ${command}`);
//   // Trigger actions based on the command
// });

console.log("Background service worker started.");