/**
 * LinkedIn Jobs Scraper
 * Scrapes job listings from LinkedIn jobs search results
 */

console.log("LinkedIn Scraper loaded");

// Function to scroll to the bottom of the page to load all job listings
async function scrollToBottom() {
    console.log("Starting to scroll to load all job listings...");

    // Get the job list container - try different selectors for different LinkedIn layouts
    let jobListContainer = document.querySelector('.jobs-search-results-list');

    // If the primary selector doesn't work, try alternative selectors
    if (!jobListContainer) {
        // Try alternative selectors for different LinkedIn layouts
        const alternativeSelectors = [
            '.scaffold-layout__list', // Another common container
            '.jobs-search-results',
            '.jobs-search-two-pane__results',
            '.jobs-search-results-list__container',
            // If none of the above work, use the main content area
            'main',
            // Last resort - use document.body
            'body'
        ];

        for (const selector of alternativeSelectors) {
            jobListContainer = document.querySelector(selector);
            if (jobListContainer) {
                console.log(`Found job container using alternative selector: ${selector}`);
                break;
            }
        }
    }

    if (!jobListContainer) {
        console.warn("Could not find any suitable job list container, using document.body");
        jobListContainer = document.body; // Last resort
    }

    // Try to find job cards with different selectors
    const jobCardSelectors = [
        'li.scaffold-layout__list-item', // Primary selector
        '.job-card-container', // Alternative selector
        '.jobs-search-results__list-item',
        '.job-card-list',
        '.jobs-search-result-item'
    ];

    // Function to get job count using multiple selectors
    function getJobCount() {
        for (const selector of jobCardSelectors) {
            const count = document.querySelectorAll(selector).length;
            if (count > 0) {
                return { count, selector };
            }
        }
        return { count: 0, selector: null };
    }

    // Initial job count
    const initialJobData = getJobCount();
    let previousJobCount = initialJobData.count;
    const jobCardSelector = initialJobData.selector || 'li.scaffold-layout__list-item'; // Fallback to default if none found

    console.log(`Initial job count: ${previousJobCount} using selector: ${jobCardSelector}`);

    // Scroll down in increments and wait for new content to load
    let scrollAttempts = 0;
    const maxScrollAttempts = 20; // Limit scrolling attempts to prevent infinite loops
    let noNewJobsCounter = 0;

    while (scrollAttempts < maxScrollAttempts) {
        // Try different scrolling methods
        // Method 1: Using scrollTop property
        jobListContainer.scrollTop = jobListContainer.scrollHeight;

        // Method 2: Using scrollTo method
        jobListContainer.scrollTo(0, jobListContainer.scrollHeight);

        // Method 3: Using window.scrollTo for the entire page
        window.scrollTo(0, document.body.scrollHeight);

        // Method 4: Using scrollIntoView on the last job card
        const allCards = document.querySelectorAll('li.scaffold-layout__list-item');
        if (allCards && allCards.length > 0) {
            allCards[allCards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
        }

        // Wait for potential new content to load
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if new jobs were loaded using the same selector we found initially
        const currentJobCount = document.querySelectorAll(jobCardSelector).length;
        console.log(`Current job count after scrolling: ${currentJobCount} using selector: ${jobCardSelector}`);

        if (currentJobCount > previousJobCount) {
            // New jobs loaded, reset counter
            previousJobCount = currentJobCount;
            noNewJobsCounter = 0;
        } else {
            // No new jobs loaded, increment counter
            noNewJobsCounter++;

            // If no new jobs loaded after 3 consecutive attempts, assume we've reached the end
            if (noNewJobsCounter >= 3) {
                console.log("No new jobs loaded after multiple scroll attempts. Assuming all jobs are loaded.");
                break;
            }
        }

        scrollAttempts++;
    }

    console.log(`Finished scrolling. Total jobs loaded: ${document.querySelectorAll(jobCardSelector).length} using selector: ${jobCardSelector}`);
    return { success: true, jobCardSelector };
}

// Function to scrape job listings from the current page
async function scrapeLinkedInJobs() {
    console.log("Starting LinkedIn jobs scraping");

    // Check if we're on a LinkedIn jobs page
    if (!window.location.href.includes('linkedin.com/jobs')) {
        console.error("Not on a LinkedIn jobs page");
        return { status: "Error: Not on a LinkedIn jobs page" };
    }

    // First scroll to load all job listings
    console.log("Scrolling to load all job listings before scraping...");
    const scrollResult = await scrollToBottom();

    try {
        // Use the job card selector that was successful during scrolling
        const jobCardSelector = scrollResult.jobCardSelector || 'li.scaffold-layout__list-item';
        console.log(`Using job card selector for scraping: ${jobCardSelector}`);

        // Find all job cards on the page using the determined selector
        const jobCards = document.querySelectorAll(jobCardSelector);

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
        // Use async/await pattern with Promise to handle the async scraping function
        scrapeLinkedInJobs().then(result => {
            sendResponse(result);
        }).catch(error => {
            console.error("Error during scraping:", error);
            sendResponse({ status: "Error during scraping" });
        });
    } else if (request.action === "checkScraperLoaded") {
        // Respond to confirm the script is loaded
        sendResponse({ loaded: true });
    }
    return true; // Keep the message channel open for async response
});

