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
                    files: ['form-filler/content.js']
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

            // Get job filters from storage
            chrome.storage.sync.get({ jobFilters: [] }, (data) => {
                const jobFilters = data.jobFilters;

                if (!jobFilters || jobFilters.length === 0) {
                    statusDisplay.textContent = 'Error: No job filters found. Please add filters in the settings.';
                    // Re-enable the button
                    scrapeButton.disabled = false;
                    scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                    return;
                }

                statusDisplay.textContent = 'Starting to scrape LinkedIn jobs... LinkedIn will open in a new tab.';

                // Send message to background script to start scraping
                chrome.runtime.sendMessage({
                    action: 'scrapeJobFiltersDirectly',
                    filters: jobFilters
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        statusDisplay.textContent = `Error: ${chrome.runtime.lastError.message}`;
                        console.error('Error starting direct scraping:', chrome.runtime.lastError);
                        // Re-enable the button
                        scrapeButton.disabled = false;
                        scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                        return;
                    }

                    if (!response || !response.success) {
                        statusDisplay.textContent = `Error: ${response?.error || 'Unknown error'}`;
                        console.error('Failed to start direct scraping:', response?.error || 'Unknown error');
                        // Re-enable the button
                        scrapeButton.disabled = false;
                        scrapeButton.textContent = 'Scrape LinkedIn Jobs';
                        return;
                    }

                    // Success - update status
                    if (response.warning) {
                        statusDisplay.textContent = `Scraping completed with warnings: ${response.warning}`;
                    } else {
                        statusDisplay.textContent = 'Scraping completed. Check job listings for results.';
                    }
                    console.log('Direct scraping completed:', response.result);

                    // Re-enable the button
                    scrapeButton.disabled = false;
                    scrapeButton.textContent = 'Scrape LinkedIn Jobs';
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
                url: chrome.runtime.getURL("job-scraper/job-listings.html")
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