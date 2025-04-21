/**
 * LinkedIn Jobs Scraper
 * Scrapes job listings from LinkedIn jobs search results
 */

console.log("LinkedIn Scraper loaded");

// Function to scrape job listings from the current page
function scrapeLinkedInJobs() {
    console.log("Starting LinkedIn jobs scraping");

    // Check if we're on a LinkedIn jobs page
    if (!window.location.href.includes('linkedin.com/jobs')) {
        console.error("Not on a LinkedIn jobs page");
        return { status: "Error: Not on a LinkedIn jobs page" };
    }

    try {
        // Find all job cards on the page - updated selector to match current LinkedIn structure
        const jobCards = document.querySelectorAll('li.scaffold-layout__list-item');

        if (!jobCards || jobCards.length === 0) {
            console.warn("No job cards found on the page");
            return { status: "No job listings found" };
        }

        console.log(`Found ${jobCards.length} job listings`);

        // Extract data from each job card
        const jobListings = Array.from(jobCards).map(card => {
            // Get job title - updated selector
            const titleElement = card.querySelector('.job-card-list__title--link');
            let title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';

            // Fix for duplicated job titles (e.g., "System DeveloperSystem Developer")
            // Check if the title appears to be duplicated
            if (title.length >= 2) {
                const halfLength = Math.floor(title.length / 2);
                const firstHalf = title.substring(0, halfLength);
                const secondHalf = title.substring(halfLength);

                // If the first half equals the second half, it's duplicated
                if (firstHalf === secondHalf) {
                    title = firstHalf;
                } else {
                    // Check for other patterns of duplication
                    const words = title.split(' ');
                    const midPoint = Math.floor(words.length / 2);

                    if (words.length >= 2 && words.length % 2 === 0) {
                        const firstHalfWords = words.slice(0, midPoint).join(' ');
                        const secondHalfWords = words.slice(midPoint).join(' ');

                        if (firstHalfWords === secondHalfWords) {
                            title = firstHalfWords;
                        }
                    }
                }
            }

            // Get company name - updated selector
            const companyElement = card.querySelector('.artdeco-entity-lockup__subtitle span');
            const company = companyElement ? companyElement.textContent.trim() : 'Unknown Company';

            // Get location - updated selector
            const locationElement = card.querySelector('.job-card-container__metadata-wrapper li');
            const location = locationElement ? locationElement.textContent.trim() : 'Unknown Location';

            // Get job URL - use the same titleElement from above to get the URL
            const jobUrl = titleElement && titleElement.href ? titleElement.href : '';

            // Get job ID from data attribute
            const jobContainer = card.querySelector('.job-card-container');
            const jobId = jobContainer ? jobContainer.getAttribute('data-job-id') : '';

            // Check if job has Easy Apply
            const easyApplyElement = card.querySelector('.job-card-container__footer-item:not(.job-card-container__footer-job-state)');
            const isEasyApply = easyApplyElement && easyApplyElement.textContent.trim().includes('Easy Apply');

            // Check if job is promoted
            const promotedElement = card.querySelector('.job-card-container__footer-item span');
            const isPromoted = promotedElement && promotedElement.textContent.trim().includes('Promoted');

            // Get application insights if available
            const insightElement = card.querySelector('.job-card-container__job-insight-text');
            const applicationInsight = insightElement ? insightElement.textContent.trim() : '';

            return {
                title,
                company,
                location,
                jobUrl,
                jobId,
                isEasyApply,
                isPromoted,
                applicationInsight
            };
        });


        chrome.storage.local.set({
            linkedInJobs: jobListings,
            scrapeTimestamp: new Date().toISOString()
        }, () => {
            console.log("Job listings saved to storage");

            // Use a flag in storage to prevent multiple tabs
            chrome.storage.local.get('jobTabOpening', (data) => {
                if (!data.jobTabOpening) {
                    // Set flag to prevent multiple tabs
                    chrome.storage.local.set({ jobTabOpening: true }, () => {
                        // Open the results page
                        chrome.runtime.sendMessage({
                            action: "openJobTab",
                            url: chrome.runtime.getURL("job-listings.html")
                        });

                        // Reset the flag after a short delay
                        setTimeout(() => {
                            chrome.storage.local.set({ jobTabOpening: false });
                        }, 1000);
                    });
                }
            });
        });


        // Store the scraped data in chrome.storage
        // chrome.storage.local.set({
        //     linkedInJobs: jobListings,
        //     scrapeTimestamp: new Date().toISOString()
        // }, () => {
        //     console.log("Job listings saved to storage");

        //     // Open the results page
        //     chrome.runtime.sendMessage({
        //         action: "openJobTab",
        //         url: chrome.runtime.getURL("job-listings.html")
        //     });
        // });

        return { status: `Scraped ${jobListings.length} job listings` };
    } catch (error) {
        console.error("Error scraping LinkedIn jobs:", error);
        return { status: "Error scraping job listings" };
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "scrapeLinkedInJobs") {
        console.log("Received scrape request");
        const result = scrapeLinkedInJobs();
        sendResponse(result);
    } else if (request.action === "checkScraperLoaded") {
        // Respond to confirm the script is loaded
        sendResponse({ loaded: true });
    }
    return true; // Keep the message channel open for async response
});

