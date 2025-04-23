// Popup script for form filling extension

// Function to send scrape message to the content script
function sendScrapeMessage(tabId, statusDisplay) {
    // Update status to inform user about the process
    statusDisplay.textContent = 'Status: Navigating to first page and preparing to scrape...';

    // Send message to trigger scraping
    chrome.tabs.sendMessage(
        tabId,
        { action: "scrapeLinkedInJobs" },
        (response) => {
            if (chrome.runtime.lastError) {
                statusDisplay.textContent = 'Error: Cannot connect to page.';
                console.error("Popup Error:", chrome.runtime.lastError.message);
            } else if (response && response.status) {
                statusDisplay.textContent = `Status: ${response.status}`;
            }
        }
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const triggerButton = document.getElementById('triggerFillButton');
    const scrapeButton = document.getElementById('scrapeLinkedInJobsButton');
    const viewJobsButton = document.getElementById('viewJobsButton');
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
        if (scrapeButton) {
        scrapeButton.addEventListener('click', () => {
            console.log("scrapeLinkedInJobsButton clicked");
            statusDisplay.textContent = 'Preparing to scrape LinkedIn jobs...';

            // Disable the button during scraping to prevent multiple clicks
            scrapeButton.disabled = true;
            scrapeButton.textContent = 'Scraping in progress...';

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];

                if (!activeTab || !activeTab.id) {
                    statusDisplay.textContent = 'Error: Could not find active tab.';
                    console.error("Popup Error: No active tab found.");
                    // Re-enable the button
                    scrapeButton.disabled = false;
                    scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                    return;
                }

                // Check if we're on a LinkedIn jobs page
                if (!activeTab.url.includes('linkedin.com/jobs')) {
                    statusDisplay.textContent = 'Error: Not on a LinkedIn jobs page.';
                    // Re-enable the button
                    scrapeButton.disabled = false;
                    scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                    return;
                }


                // First check if the script is already injected
                chrome.tabs.sendMessage(activeTab.id, { action: "checkScraperLoaded" }, (response) => {
                    if (chrome.runtime.lastError || !response) {
                        // Script not loaded, inject it
                        chrome.scripting.executeScript({
                            target: { tabId: activeTab.id },
                            files: ['linkedin-scraper.js']
                        }).then(() => {
                            sendScrapeMessage(activeTab.id, statusDisplay);
                            // Re-enable the button after a delay to allow scraping to complete
                            setTimeout(() => {
                                scrapeButton.disabled = false;
                                scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                            }, 3000);
                        }).catch(err => {
                            statusDisplay.textContent = 'Error: Could not inject scraper script.';
                            console.error("Script injection error:", err);
                            // Re-enable the button
                            scrapeButton.disabled = false;
                            scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                        });
                    } else {
                        // Script already loaded, just send the message
                        sendScrapeMessage(activeTab.id, statusDisplay);
                        // Re-enable the button after a delay to allow scraping to complete
                        setTimeout(() => {
                            scrapeButton.disabled = false;
                            scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                        }, 3000);
                    }
                });
            });
        });
    }

    if (viewJobsButton) {
        viewJobsButton.addEventListener('click', () => {
            console.log("viewJobsButton clicked");
            statusDisplay.textContent = 'Opening saved jobs...';

            // Open the job listings page in a new tab
            chrome.runtime.sendMessage({
                action: "openJobTab",
                url: chrome.runtime.getURL("job-listings.html")
            }, () => {
                if (chrome.runtime.lastError) {
                    statusDisplay.textContent = 'Error: Could not open job listings.';
                    console.error("Error opening job listings:", chrome.runtime.lastError.message);
                } else {
                    statusDisplay.textContent = 'Opened job listings page.';
                }
            });
        });
    }
});