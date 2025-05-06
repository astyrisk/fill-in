
// console.log("Content script injected.");

// function interceptWindowOpen(callback) {
//   const originalOpen = window.open;
//   window.open = function(url, target, features) {
//     console.log("INTERCEPTED window.open URL:", url);
//     callback(url); // Call the provided callback with the URL
//     window.open = originalOpen; // Restore the original function
//     return originalOpen.apply(this, arguments); // Still open the window
//   };
//   console.log("window.open function replaced.");
// }

// function clickApplyButton() {
//   const applyButton = document.getElementById('jobs-apply-button-id');
//   if (applyButton) {
//     console.log("Apply button found. Clicking...");
//     applyButton.click(); // Programmatically trigger the click event
//     console.log("Apply button clicked programmatically.");
//   } else {
//     console.log("Apply button with ID 'jobs-apply-button-id' not found.");
//   }
// }

// document.addEventListener('DOMContentLoaded', async () => {
//   console.log("DOMContentLoaded event fired in content script.");

//   try {
//     await chrome.scripting.executeScript({
//       target: { tabId: chrome.runtime.id }, // This will be corrected by the background script
//       func: interceptWindowOpen,
//       args: [(url) => {
//         console.log("URL received in callback:", url);
//         chrome.runtime.sendMessage({ action: 'applyUrlFound', url: url });
//       }],
//     });
//     console.log("window.open interceptor injected.");
//     clickApplyButton();
//   } catch (error) {
//     console.error("Error injecting interceptor:", error);
//   }
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'applyUrlFound') {
//     const scrapedUrl = request.url;
//     console.log("CONTENT SCRIPT RECEIVED URL (via message):", scrapedUrl);
//     chrome.runtime.sendMessage({ action: 'processApplyUrl', url: scrapedUrl });
//   }
// });

// console.log("Content script finished executing.");


// console.log("SIMPLE CONTENT SCRIPT INJECTED");
// document.addEventListener('DOMContentLoaded', () => {
//   console.log("SIMPLE DOMContentLoaded");
//   const applyButton = document.getElementById('jobs-apply-button-id');
//   if (applyButton) {
//     console.log("SIMPLE BUTTON FOUND");
//     applyButton.click();
//     console.log("SIMPLE BUTTON CLICKED");
//   } else {
//     console.log("SIMPLE BUTTON NOT FOUND");
//   }
// });

// console.log("SIMPLE CONTENT SCRIPT INJECTED");


// const applyButton = document.getElementById('jobs-apply-button-id');
// if (applyButton) {
//     console.log("SIMPLE BUTTON FOUND");
//     applyButton.click();
//     console.log("SIMPLE BUTTON CLICKED");
// } else {
//     console.log("SIMPLE BUTTON NOT FOUND... trying again in 500ms");
//     setTimeout(tryClickButton, 500); // Try again after a delay
// }

// // function tryClickButton() {
// //   console.log("Trying to find and click button...");
// //   const applyButton = document.getElementById('jobs-apply-button-id');
// //   if (applyButton) {
// //     console.log("SIMPLE BUTTON FOUND");
// //     applyButton.click();
// //     console.log("SIMPLE BUTTON CLICKED");
// //   } else {
// //     console.log("SIMPLE BUTTON NOT FOUND... trying again in 500ms");
// //     setTimeout(tryClickButton, 500); // Try again after a delay
// //   }
// // }

// // document.addEventListener('DOMContentLoaded', () => {
// //   console.log("SIMPLE DOMContentLoaded");
// //   // Initial attempt with a small delay
// //   setTimeout(tryClickButton, 250);
// // });


// console.log("Content script finished executing.");



// console.log("Content script injected.");

// function interceptWindowOpen(callback) {
//   const originalOpen = window.open;
//   window.open = function(url, target, features) {
//     console.log("INTERCEPTED window.open URL:", url);
//     callback(url); // Call the provided callback with the URL
//     window.open = originalOpen; // Restore the original function
//     return originalOpen.apply(this, arguments); // Still open the window
//   };
//   console.log("window.open function replaced.");
// }

// function clickApplyButton() {
//   const applyButton = document.getElementById('jobs-apply-button-id');
//   if (applyButton) {
//     console.log("Apply button found. Clicking...");
//     applyButton.click(); // Programmatically trigger the click event
//     console.log("Apply button clicked programmatically.");
//   } else {
//     console.log("Apply button with ID 'jobs-apply-button-id' not found.");
//   }
// }

// (async () => {
//   console.log("Attempting to inject interceptor and click button immediately.");
//   try {
//     await chrome.scripting.executeScript({
//       target: { tabId: chrome.runtime.id }, // This will be corrected by the background script
//       func: interceptWindowOpen,
//       args: [(url) => {
//         console.log("URL received in callback:", url);
//         chrome.runtime.sendMessage({ action: 'applyUrlFound', url: url });
//       }],
//     });
//     console.log("window.open interceptor injected.");
//     clickApplyButton();
//   } catch (error) {
//     console.error("Error injecting interceptor:", error);
//   }
// })();

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'applyUrlFound') {
//     const scrapedUrl = request.url;
//     console.log("CONTENT SCRIPT RECEIVED URL (via message):", scrapedUrl);
//     chrome.runtime.sendMessage({ action: 'processApplyUrl', url: scrapedUrl });
//   }
// });

// console.log("Content script finished executing.");

// console.log("SIMPLE CONTENT SCRIPT INJECTED (immediate execution)");
// const applyButtonImmediate = document.getElementById('jobs-apply-button-id');
// if (applyButtonImmediate) {
//   console.log("SIMPLE BUTTON FOUND (immediate)");
//   applyButtonImmediate.click();
//   console.log("SIMPLE BUTTON CLICKED (immediate)");
// } else {
//   console.log("SIMPLE BUTTON NOT FOUND (immediate)");
// }


// console.log("Content script injected.");

// // Listen for messages from the background script
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'scrapeAndCloseNewTab') {
//     console.log("Content script received scrapeAndCloseNewTab command.");
//     const applyButtonImmediate = document.getElementById('jobs-apply-button-id');
//     if (applyButtonImmediate) {
//       console.log("SIMPLE BUTTON FOUND (immediate)");
//       applyButtonImmediate.click();
//       console.log("SIMPLE BUTTON CLICKED (immediate)");

//       // We need to listen for the new tab being created.
//       // This is best done in the background service worker.
//       // We'll send a message to the background to start monitoring.
//       chrome.runtime.sendMessage({ action: 'startMonitoringNewTab' });
//     } else {
//       console.log("SIMPLE BUTTON NOT FOUND (immediate)");
//     }
//   }
// });





console.log("Content script injected.");

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeAndCloseNewTab') {
    console.log("Content script received scrapeAndCloseNewTab command.");
    const applyButtonImmediate = document.getElementById('jobs-apply-button-id');
    if (applyButtonImmediate) {
      console.log("SIMPLE BUTTON FOUND (immediate)");
      applyButtonImmediate.click();
      console.log("SIMPLE BUTTON CLICKED (immediate)");

      // Send a message to the background to start monitoring.
      chrome.runtime.sendMessage({ action: 'startMonitoringNewTab' });
    } else {
      console.log("SIMPLE BUTTON NOT FOUND (immediate)");
    }
  } else if (request.action === 'urlScraped') {
    const finalScrapedUrl = request.url;
    console.log("CONTENT SCRIPT LOGGING SCRAPED URL:", finalScrapedUrl);
    // You can now use the finalScrapedUrl in your content script
  }
});