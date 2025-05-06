// console.log("Background service worker started.");

// let newTabId = null;
// let scrapedUrl = null;

// chrome.action.onClicked.addListener(async (tab) => {
//   console.log("Browser action clicked. Sending command to content script.");
//   await chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     files: ['content.js']
//   });
//   // Send a message to the content script to trigger the button click
//   chrome.tabs.sendMessage(tab.id, { action: 'scrapeAndCloseNewTab' });
// });

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'startMonitoringNewTab') {
//     console.log("Background script started monitoring for a new tab.");
//     chrome.tabs.onCreated.addListener(monitorNewTab);
//   }
// });

// function monitorNewTab(tab) {
//   console.log("New tab created:", tab);
//   newTabId = tab.id;
//   chrome.tabs.onUpdated.addListener(getNewTabUrl);
//   // Stop listening for new tab creation once we've found one
//   chrome.tabs.onCreated.removeListener(monitorNewTab);
// }

// function getNewTabUrl(tabId, changeInfo, tab) {
//   if (tabId === newTabId && changeInfo.status === 'complete' && tab.url) {
//     scrapedUrl = tab.url;
//     console.log("Scraped URL from new tab:", scrapedUrl);

//     // Now close the new tab
//     chrome.tabs.remove(newTabId);

//     // Optionally, do something with the scrapedUrl (e.g., send it to content script or store it)
//     // chrome.tabs.sendMessage(senderTabId, { action: 'urlScraped', url: scrapedUrl });

//     // Stop listening for updates on this tab
//     chrome.tabs.onUpdated.removeListener(getNewTabUrl);
//     newTabId = null;
//     scrapedUrl = null;
//   }
// }



console.log("Background service worker started.");

let newTabId = null;
let scrapedUrl = null;
let senderTabIdForUrl = null; // To track which tab initiated the process

chrome.action.onClicked.addListener(async (tab) => {
  console.log("Browser action clicked on tab:", tab);
  senderTabIdForUrl = tab.id; // Store the initiating tab ID
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
  // Send a message to the content script to trigger the button click
  chrome.tabs.sendMessage(tab.id, { action: 'scrapeAndCloseNewTab' });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startMonitoringNewTab') {
    console.log("Background script started monitoring for a new tab.");
    chrome.tabs.onCreated.addListener(monitorNewTab);
  }
});

function monitorNewTab(tab) {
  console.log("New tab created:", tab);
  newTabId = tab.id;
  chrome.tabs.onUpdated.addListener(getNewTabUrl);
  // Stop listening for new tab creation once we've found one
  chrome.tabs.onCreated.removeListener(monitorNewTab);
}

function getNewTabUrl(tabId, changeInfo, tab) {
  if (tabId === newTabId && changeInfo.status === 'complete' && tab.url) {
    scrapedUrl = tab.url;
    console.log("Background scraped URL:", scrapedUrl); // Log in background too (optional)

    // Send the scraped URL back to the content script
    if (senderTabIdForUrl) {
      chrome.tabs.sendMessage(senderTabIdForUrl, { action: 'urlScraped', url: scrapedUrl });
      senderTabIdForUrl = null; // Clear it after sending
    }

    // Now close the new tab
    chrome.tabs.remove(newTabId);

    // Stop listening for updates on this tab
    chrome.tabs.onUpdated.removeListener(getNewTabUrl);
    newTabId = null;
    scrapedUrl = null;
  }
}