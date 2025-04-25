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

// Function to get the selected country from the location input field
function getSelectedCountry() {
    // Try to find the location input field using the selector from country.html
    const locationInput = document.querySelector('#jobs-search-box-location-id-ember31') ||
                         document.querySelector('.jobs-search-box__text-input[aria-label="City, state, or zip code"]') ||
                         document.querySelector('input[aria-label*="location"]') ||
                         document.querySelector('input[placeholder*="location"]');

    if (locationInput && locationInput.value) {
        return locationInput.value.trim();
    }

    // Fallback to a default value if the input is not found or empty
    return 'Unknown';
}

// Function to scrape job listings from the current page
async function scrapeCurrentPage(jobCardSelector) {
    try {
        // Find all job cards on the page using the determined selector
        const jobCards = document.querySelectorAll(jobCardSelector);

        if (!jobCards || jobCards.length === 0) {
            console.warn("No job cards found on the page");
            return [];
        }

        console.log(`Found ${jobCards.length} job listings on current page`);

        // Extract data from each job card
        const extractedJobs = Array.from(jobCards).map(card => {
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

            // Use the selected country from the location input field for all jobs
            const country = getSelectedCountry();

            // Get job URL - use the same titleElement from above to get the URL
            const jobUrl = titleElement && titleElement.href ? titleElement.href : '';

            // Get job ID from data attribute
            const jobContainer = card.querySelector('.job-card-container');
            let jobId = jobContainer ? jobContainer.getAttribute('data-job-id') : '';

            // Generate a unique ID if none is found
            if (!jobId) {
                // Create a hash from the job title, company and URL if available
                const hashSource = `${title}-${company}-${jobUrl}-${Date.now()}-${Math.random()}`;
                jobId = 'generated-' + hashSource.split('').reduce((a, b) => {
                    a = ((a << 5) - a) + b.charCodeAt(0);
                    return a & a;
                }, 0).toString(36);
                console.log(`Generated ID for job without ID: ${jobId}`);
            }

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
                country,
                jobUrl,
                jobId,
                isEasyApply,
                isPromoted,
                applicationInsight
            };
        });

        // Filter out jobs with missing essential data
        const validJobs = extractedJobs.filter(job => {
            const hasEssentialData = job.title && job.title !== 'Unknown Title' &&
                                     job.company && job.company !== 'Unknown Company' &&
                                     job.jobId;

            if (!hasEssentialData) {
                console.warn('Filtering out job with missing essential data:', job);
            }

            return hasEssentialData;
        });

        console.log(`Filtered out ${extractedJobs.length - validJobs.length} jobs with missing essential data`);
        return validJobs;
    } catch (error) {
        console.error("Error scraping current page:", error);
        return [];
    }
}

// Function to find and click the next page button
async function clickNextPageButton() {
    try {
        // Try different selectors for the next page button
        const nextButtonSelectors = [
            // '.jobs-search-pagination__button--next', // Primary selector
            'button[aria-label="View next page"]',
            // '.artdeco-pagination__button--next',
            // '.artdeco-button--icon-right'
        ];

        let nextButton = null;
        for (const selector of nextButtonSelectors) {
            nextButton = document.querySelector(selector);
            if (nextButton) {
                console.log(`Found next page button using selector: ${selector}`);
                break;
            }
        }

        if (!nextButton) {
            console.log("No next page button found. This might be the last page.");
            return false;
        }

        // Check if the button is disabled
        if (nextButton.disabled || nextButton.getAttribute('aria-disabled') === 'true' ||
            nextButton.classList.contains('artdeco-button--disabled')) {
            console.log("Next page button is disabled. This is the last page.");
            return false;
        }

        // Click the next page button
        console.log("Clicking next page button...");
        nextButton.click();

        // Wait for the page to load
        console.log("Waiting for next page to load...");
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds for page to load

        // Additional check to ensure the page has loaded
        let loadingAttempts = 0;
        const maxLoadingAttempts = 10;

        while (loadingAttempts < maxLoadingAttempts) {
            // Check if there's a loading indicator and wait if there is
            const loadingIndicator = document.querySelector('.artdeco-loader');
            if (!loadingIndicator) {
                break; // No loading indicator, assume page is loaded
            }

            console.log("Page still loading, waiting...");
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            loadingAttempts++;
        }

        console.log("Next page loaded successfully");
        return true;
    } catch (error) {
        console.error("Error clicking next page button:", error);
        return false;
    }
}

// Function to navigate through all pages and scrape job listings
async function navigateAndScrapeAllPages(jobCardSelector) {
    let allJobListings = [];
    let currentPage = 1;
    const maxPages = 20; // Limit to prevent infinite loops

    console.log(`Starting to scrape page ${currentPage}...`);

    // Scrape the first page
    const firstPageJobs = await scrapeCurrentPage(jobCardSelector);
    allJobListings = [...firstPageJobs];

    console.log(`Scraped ${firstPageJobs.length} jobs from page ${currentPage}`);

    // Navigate through subsequent pages
    while (currentPage < maxPages) {
        // Try to click the next page button
        const hasNextPage = await clickNextPageButton();

        if (!hasNextPage) {
            console.log(`No more pages available after page ${currentPage}`);
            break;
        }

        currentPage++;
        console.log(`Navigated to page ${currentPage}`);

        // Scroll to load all job listings on this page
        await scrollToBottom();

        // Scrape the current page
        console.log(`Scraping page ${currentPage}...`);
        const pageJobs = await scrapeCurrentPage(jobCardSelector);

        if (pageJobs.length === 0) {
            console.log(`No jobs found on page ${currentPage}, might be an error. Stopping pagination.`);
            break;
        }

        // Add jobs from this page to the total
        allJobListings = [...allJobListings, ...pageJobs];
        console.log(`Scraped ${pageJobs.length} jobs from page ${currentPage}. Total jobs so far: ${allJobListings.length}`);
    }

    console.log(`Finished scraping all pages. Total jobs collected: ${allJobListings.length}`);
    return allJobListings;
}

// Function to find and click the first page button
async function clickFirstPageButton() {
    try {
        console.log("Attempting to navigate to the first page...");

        // Try different selectors for the first page button
        const firstPageButtonSelectors = [
            'button[aria-label="Page 1"]',
            '.jobs-search-pagination__indicator-button[aria-current="page"]',
            '.jobs-search-pagination__indicator:first-child button',
            'button.jobs-search-pagination__indicator-button--active'
        ];

        let firstPageButton = null;
        for (const selector of firstPageButtonSelectors) {
            firstPageButton = document.querySelector(selector);
            if (firstPageButton) {
                console.log(`Found first page button using selector: ${selector}`);
                break;
            }
        }

        if (!firstPageButton) {
            console.log("No first page button found. We might already be on the first page.");
            return true; // Assume we're already on the first page
        }

        // Check if the button is already active (we're already on the first page)
        if (firstPageButton.getAttribute('aria-current') === 'page' ||
            firstPageButton.classList.contains('jobs-search-pagination__indicator-button--active')) {
            console.log("Already on the first page.");
            return true;
        }

        // Click the first page button
        console.log("Clicking first page button...");
        firstPageButton.click();

        // Wait for the page to load
        console.log("Waiting for first page to load...");
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds for page to load

        // Additional check to ensure the page has loaded
        let loadingAttempts = 0;
        const maxLoadingAttempts = 10;

        while (loadingAttempts < maxLoadingAttempts) {
            // Check if there's a loading indicator and wait if there is
            const loadingIndicator = document.querySelector('.artdeco-loader');
            if (!loadingIndicator) {
                break; // No loading indicator, assume page is loaded
            }

            console.log("Page still loading, waiting...");
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            loadingAttempts++;
        }

        console.log("First page loaded successfully");
        return true;
    } catch (error) {
        console.error("Error clicking first page button:", error);
        return false; // Continue with scraping even if navigation to first page fails
    }
}

// Function to check if a job is already saved in storage
async function checkIfJobExists(jobId, country) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!jobId) {
                resolve(false);
                return;
            }

            // Check if a job with this ID already exists in this country
            if (data.linkedInJobsByCountry && data.linkedInJobsByCountry[country]) {
                const existingJob = data.linkedInJobsByCountry[country].find(job => job.jobId === jobId);
                if (existingJob) {
                    resolve(true);
                    return;
                }
            }

            // Also check if the job exists in the Archive country
            if (data.linkedInJobsByCountry && data.linkedInJobsByCountry['Archive']) {
                const archivedJob = data.linkedInJobsByCountry['Archive'].find(job => job.jobId === jobId);
                if (archivedJob) {
                    console.log(`Job ${jobId} was previously archived and won't be added again`);
                    resolve(true);
                    return;
                }
            }

            resolve(false);
        });
    });
}

// Main function to scrape LinkedIn jobs
async function scrapeLinkedInJobs() {
    console.log("Starting LinkedIn jobs scraping");

    // Log the selected country at the start of scraping
    const selectedCountry = getSelectedCountry();
    console.log(`Using selected country: ${selectedCountry}`);

    // Check if we're on a LinkedIn jobs page
    if (!window.location.href.includes('linkedin.com/jobs')) {
        console.error("Not on a LinkedIn jobs page");
        return { status: "Error: Not on a LinkedIn jobs page" };
    }

    try {
        // First navigate to the first page
        console.log("Navigating to the first page before starting scraping...");
        await clickFirstPageButton();

        // Then scroll to load all job listings on the current page
        console.log("Scrolling to load all job listings on the current page...");
        const scrollResult = await scrollToBottom();

        // Use the job card selector that was successful during scrolling
        const jobCardSelector = scrollResult.jobCardSelector || 'li.scaffold-layout__list-item';
        console.log(`Using job card selector for scraping: ${jobCardSelector}`);

        // Navigate through all pages and scrape job listings
        const allJobListings = await navigateAndScrapeAllPages(jobCardSelector);

        if (allJobListings.length === 0) {
            console.warn("No job listings found across all pages");
            return { status: "No job listings found" };
        }

        // Get the final country value right before storing
        const finalCountry = getSelectedCountry();
        console.log(`Final selected country for all jobs: ${finalCountry}`);

        // Make sure all jobs have the same country value
        allJobListings.forEach(job => {
            job.country = finalCountry;
        });

        // Get existing jobs from storage to check for duplicates
        console.log("Checking for duplicate jobs...");

        // Filter out jobs that already exist in storage
        const newJobListings = [];
        let duplicateCount = 0;

        // Process each job to check if it's already saved
        for (const job of allJobListings) {
            if (!job.jobId) {
                // If job has no ID, we can't check for duplicates, so include it
                newJobListings.push(job);
                continue;
            }

            // Check if this job already exists in storage
            const jobExists = await checkIfJobExists(job.jobId, finalCountry);

            if (jobExists) {
                duplicateCount++;
                console.log(`Skipping duplicate job: ${job.title} (ID: ${job.jobId})`);
            } else {
                newJobListings.push(job);
            }
        }

        console.log(`Found ${duplicateCount} duplicate jobs. Adding ${newJobListings.length} new jobs.`);

        // If no new jobs were found, return early
        if (newJobListings.length === 0) {
            return { status: `No new jobs found. All ${duplicateCount} jobs were already saved.` };
        }

        // Organize jobs by country (in this case, all jobs will be under the same country)
        let jobsByCountry = {};

        // Get existing jobs first
        await new Promise(resolve => {
            chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
                jobsByCountry = data.linkedInJobsByCountry || {};
                resolve();
            });
        });

        // Add new jobs to the existing structure
        if (finalCountry) {
            // Initialize the country array if it doesn't exist
            if (!jobsByCountry[finalCountry]) {
                jobsByCountry[finalCountry] = [];
            }

            // Add new jobs to the existing array
            jobsByCountry[finalCountry] = [...jobsByCountry[finalCountry], ...newJobListings];
        } else {
            // Fallback in case country is empty
            if (!jobsByCountry['Unknown']) {
                jobsByCountry['Unknown'] = [];
            }
            jobsByCountry['Unknown'] = [...jobsByCountry['Unknown'], ...newJobListings];
        }

        // Calculate total jobs for logging
        let totalJobs = 0;
        Object.values(jobsByCountry).forEach(countryJobs => {
            totalJobs += countryJobs.length;
        });

        console.log(`Organized ${newJobListings.length} new jobs under country: ${finalCountry || 'Unknown'}. Total jobs: ${totalJobs}`);

        // Store the updated data in chrome.storage
        chrome.storage.local.set({
            linkedInJobsByCountry: jobsByCountry,
            linkedInJobs: Object.values(jobsByCountry).flat(), // Keep the old format for backward compatibility
            scrapeTimestamp: new Date().toISOString(),
            countries: Object.keys(jobsByCountry)
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

        return { status: `Scraped ${allJobListings.length} job listings (${newJobListings.length} new, ${duplicateCount} duplicates)` };
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

