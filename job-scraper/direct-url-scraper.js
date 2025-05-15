/**
 * LinkedIn Direct URL Scraper
 * Scrapes job listings from LinkedIn jobs search URLs without requiring LinkedIn to be open
 */

console.log("LinkedIn Direct URL Scraper loaded");

// Function to construct LinkedIn search URL from job filter parameters
function constructLinkedInSearchUrl(filter) {
    if (!filter) {
        console.error("No filter provided to construct URL");
        return null;
    }

    // Base URL for LinkedIn job search
    let url = "https://www.linkedin.com/jobs/search/?";

    // Add job type (keywords)
    if (filter.jobType) {
        url += `keywords=${encodeURIComponent(filter.jobType)}`;
    }

    // Add location
    if (filter.location) {
        // For simplicity, we're using the location as provided
        // In a more advanced implementation, you might want to map locations to LinkedIn geoIds
        url += `&location=${encodeURIComponent(filter.location)}`;
    }

    // Add distance (default to 25 miles)
    url += "&distance=25";

    // Add experience levels
    if (filter.experienceLevels && filter.experienceLevels.length > 0) {
        // LinkedIn uses f_E parameter for experience level
        // Values: 1 (Internship), 2 (Entry level), 3 (Associate), 4 (Mid-Senior), 5 (Director), 6 (Executive)
        url += `&f_E=${filter.experienceLevels.join("%2C")}`;
    }

    // Add posting date
    if (filter.postingDate) {
        // LinkedIn uses f_TPR parameter for time posted with format r[seconds]
        // Convert days directly to seconds for more precise time filtering
        const days = parseInt(filter.postingDate);
        // Calculate seconds: days * 24 hours * 60 minutes * 60 seconds
        const seconds = days * 24 * 60 * 60;
        const timePostedParam = `r${seconds}`;

        url += `&f_TPR=${timePostedParam}`;
    }

    // Add other common parameters
    url += "&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true";

    return url;
}

// Function to scrape jobs from a LinkedIn search URL
async function scrapeJobsFromUrl(url, filter) {
    try {
        console.log(`Starting to scrape jobs from URL: ${url}`);

        // Create a new tab with the URL
        return new Promise((resolve, reject) => {
            chrome.tabs.create({ url: url, active: false }, async (tab) => {
                const tabId = tab.id;

                // Function to handle the scraping once the page is loaded
                const handleScraping = async () => {
                    try {
                        // Inject the LinkedIn scraper script
                        await chrome.scripting.executeScript({
                            target: { tabId },
                            files: ['job-scraper/linkedin-scraper.js']
                        });

                        // Send a message to the content script to start scraping
                        chrome.tabs.sendMessage(tabId, {
                            action: "scrapeLinkedInJobs",
                            filter: filter
                        }, (response) => {
                            // Close the tab regardless of the result
                            setTimeout(() => {
                                chrome.tabs.remove(tabId, () => {
                                    if (chrome.runtime.lastError) {
                                        console.log("Tab may have already been closed");
                                    }
                                });
                            }, 2000);

                            if (chrome.runtime.lastError) {
                                console.error("Error scraping jobs:", chrome.runtime.lastError);
                                reject(chrome.runtime.lastError);
                            } else if (response && response.status) {
                                console.log(`Scraping completed: ${response.status}`);
                                resolve(response);
                            } else {
                                reject(new Error("Failed to scrape jobs"));
                            }
                        });
                    } catch (error) {
                        console.error("Error during scraping:", error);
                        chrome.tabs.remove(tabId);
                        reject(error);
                    }
                };

                // Wait for the page to load before scraping
                chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
                    if (updatedTabId === tabId && changeInfo.status === 'complete') {
                        // Remove the listener to avoid multiple calls
                        chrome.tabs.onUpdated.removeListener(listener);

                        // Wait a bit more for any dynamic content to load
                        setTimeout(handleScraping, 5000);
                    }
                });
            });
        });
    } catch (error) {
        console.error("Error creating tab for scraping:", error);
        throw error;
    }
}

// Function to update the status in the bridge page
function updateBridgeStatus(status) {
    // Send a message to update the status in the bridge page
    chrome.runtime.sendMessage({
        action: "updateScraperStatus",
        status: status
    });
}

// Function to process multiple job filters sequentially
async function processJobFilters(filters) {
    if (!filters || filters.length === 0) {
        console.error("No filters provided to process");
        updateBridgeStatus("No filters to process");
        return { status: "No filters to process", processedCount: 0 };
    }

    console.log(`Starting to process ${filters.length} job filters`);
    updateBridgeStatus(`Starting to process ${filters.length} job filters...`);

    let processedCount = 0;
    let errors = [];

    // Process each filter sequentially
    for (const filter of filters) {
        try {
            // Update status for this filter
            chrome.runtime.sendMessage({
                action: "updateFilterScrapingStatus",
                filterId: filter.id,
                status: "processing"
            });

            // Update bridge status
            updateBridgeStatus(`Processing filter: ${filter.jobType} in ${filter.location} (${processedCount + 1}/${filters.length})`);

            // Construct the search URL
            const url = constructLinkedInSearchUrl(filter);
            if (!url) {
                throw new Error(`Failed to construct URL for filter: ${filter.jobType} in ${filter.location}`);
            }

            // Log the URL being used
            console.log(`Using LinkedIn search URL: ${url}`);

            // Scrape jobs from the URL
            const result = await scrapeJobsFromUrl(url, filter);

            // Update status for this filter
            chrome.runtime.sendMessage({
                action: "updateFilterScrapingStatus",
                filterId: filter.id,
                status: "completed"
            });

            processedCount++;

            // Update bridge status
            updateBridgeStatus(`Completed ${processedCount}/${filters.length} filters. Processing next filter...`);

            // Wait a bit before processing the next filter to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`Error processing filter ${filter.id}:`, error);

            // Update status for this filter
            chrome.runtime.sendMessage({
                action: "updateFilterScrapingStatus",
                filterId: filter.id,
                status: "failed",
                error: error.message
            });

            // Update bridge status
            updateBridgeStatus(`Error processing filter: ${filter.jobType} in ${filter.location}: ${error.message}`);

            errors.push({
                filterId: filter.id,
                error: error.message
            });
        }
    }

    const finalStatus = `Processed ${processedCount} of ${filters.length} filters`;
    updateBridgeStatus(`${finalStatus}. ${errors.length > 0 ? `Encountered ${errors.length} errors.` : 'All filters processed successfully.'}`);

    return {
        status: finalStatus,
        processedCount,
        errors
    };
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processJobFilters") {
        console.log("Received request to process job filters");

        // Use async/await pattern with Promise to handle the async function
        processJobFilters(request.filters).then(result => {
            sendResponse(result);
        }).catch(error => {
            console.error("Error during filter processing:", error);
            sendResponse({ status: "Error during filter processing", error: error.message });
        });

        return true; // Keep the message channel open for async response
    }
});

console.log("LinkedIn Direct URL Scraper initialized");
