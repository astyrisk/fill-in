// LinkedIn Job Details Scraper
// This script is injected into LinkedIn job pages to scrape additional job details

// Variable to store the application URL captured from navigation events
let capturedApplicationUrl = null;

// Set up a function to click the apply button and open in a new tab
function setupNavigationCapture() {
    console.log('Setting up apply button click for external application');

    // Find the apply button - try multiple selectors to ensure we find it
    const applyButton = document.querySelector('#jobs-apply-button-id, .jobs-apply-button, button[role="link"][aria-label*="Apply"], a[data-control-name="jobdetails_apply_button"]');

    if (applyButton) {
        console.log('Found apply button, clicking to open in new tab');

        // Simply click the apply button to open in a new tab
        // We don't try to capture the URL - just let the browser handle it
        console.log('Clicking apply button to open in new tab');
        applyButton.click();
    } else {
        console.log('Apply button not found');
    }
}

// Helper function to extract job ID from URL
function extractJobIdFromUrl(url) {
    if (!url) return null;

    // Try to extract job ID from LinkedIn job URL
    // Format: https://www.linkedin.com/jobs/view/[JOB_ID]/
    const match = url.match(/\/jobs\/view\/([0-9]+)/);
    return match ? match[1] : null;
}

// Main function to scrape job details
function scrapeJobDetails() {
    console.log('Scraping job details...');

    try {
        // Extract job description
        const descriptionElement = document.querySelector('.jobs-description__content');
        const description = descriptionElement ? descriptionElement.innerHTML : null;

        // Extract posting date
        const dateElements = document.querySelectorAll('.tvm__text');
        let postingDate = null;
        let convertedDate = null;

        for (const element of dateElements) {
            const text = element.textContent.trim();
            // Check for standard format with Posted/Reposted prefix
            if (text.includes('Posted') || text.includes('Reposted')) {
                postingDate = text;
                break;
            }
            // Also check for time periods that indicate a posting date without the prefix
            else if (text.match(/(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)\s+ago/)) {
                postingDate = text;
                break;
            }
        }

        // Convert the relative time string to an actual date if we found a posting date
        if (postingDate && typeof convertRelativeTimeToDate === 'function') {
            convertedDate = convertRelativeTimeToDate(postingDate);
            console.log('Converted date:', convertedDate);
        } else if (postingDate) {
            console.warn('convertRelativeTimeToDate function not available');
        }

        // Extract skills
        const skillsElements = document.querySelectorAll('a[href="#HYM"]');
        let skills = [];

        for (const element of skillsElements) {
            const text = element.textContent.trim();
            if (text.includes('Skills:')) {
                // Extract skills from text like "Skills: React.js, Java, +8 more"
                const skillsText = text.replace('Skills:', '').trim();

                // Split by comma and remove "+X more" part
                skills = skillsText.split(',')
                    .map(skill => skill.trim())
                    .filter(skill => !skill.includes('+') && skill !== '');

                break;
            }
        }

        // If we couldn't find skills in the main section, try looking in the qualifications section
        if (skills.length === 0) {
            const qualificationsSkills = document.querySelectorAll('.job-details-how-you-match__skills-item-subtitle');
            for (const element of qualificationsSkills) {
                const text = element.textContent.trim();
                if (text) {
                    // Split by comma and "and"
                    skills = text.split(/,|\sand\s/)
                        .map(skill => skill.trim())
                        .filter(skill => skill !== '');
                    break;
                }
            }
        }

        // Extract applicant count
        const applicantElements = document.querySelectorAll('.tvm__text');
        let applicantCount = null;

        for (const element of applicantElements) {
            const text = element.textContent.trim();
            if (text.includes('people clicked apply') || text.includes('applicants')) {
                applicantCount = text;
                break;
            }
        }

        // Try to extract the application URL directly
        let applicationUrl = null;
        let applyButtonType = null;
        let noLongerAccepting = false;

        // Check if the job is no longer accepting applications (Case 1)
        const noLongerAcceptingElement = document.querySelector('.artdeco-inline-feedback__message');
        if (noLongerAcceptingElement && noLongerAcceptingElement.textContent.trim().includes('No longer accepting applications')) {
            console.log('Job is no longer accepting applications');
            noLongerAccepting = true;
            applyButtonType = 'no_longer_accepting';
        }

        // Look for the apply button
        const applyButton = document.querySelector('#jobs-apply-button-id, .jobs-apply-button, button[role="link"][aria-label*="Apply"]');
        if (applyButton) {
            // Check if it's an Easy Apply button (Case 2)
            const buttonText = applyButton.textContent.trim();
            const isEasyApply = buttonText.includes('Easy Apply') ||
                               (applyButton.querySelector('svg[data-test-icon="linkedin-bug-xxsmall"]') !== null);

            if (isEasyApply) {
                console.log('Found LinkedIn Easy Apply button');
                applyButtonType = 'easy_apply';
                // For Easy Apply, we'll use the job URL
                const jobId = extractJobIdFromUrl(window.location.href);
                if (jobId) {
                    applicationUrl = `https://www.linkedin.com/jobs/view/${jobId}/apply/`;
                    console.log('Using LinkedIn job URL for Easy Apply:', applicationUrl);
                }
            } else if (buttonText.includes('Apply') && !noLongerAccepting) {
                // This is likely an external apply button (Case 3)
                console.log('Found external Apply button');
                applyButtonType = 'company_site';

                // For company site applications, we'll just click the button to open in a new tab
                // We won't try to capture the URL - just let the browser handle it
                if (applyButton) {
                    console.log('Clicking apply button to open in new tab');
                    applyButton.click();
                }
            }
        }

        // For company site applications (Case 3), we don't try to capture the URL
        // We just let the browser open the application page in a new tab

        // Fallback to constructing a URL from the job ID for Easy Apply
        if (!applicationUrl && applyButtonType === 'easy_apply') {
            const jobId = extractJobIdFromUrl(window.location.href);
            if (jobId) {
                // Construct a fallback URL that might work for LinkedIn jobs
                applicationUrl = `https://www.linkedin.com/jobs/view/${jobId}/apply/`;
                console.log('Using fallback application URL based on job ID:', applicationUrl);
            }
        }

        console.log('Scraped job details:', {
            description: description ? 'Found' : 'Not found',
            postingDate,
            convertedDate,
            skills,
            applicantCount,
            applicationUrl: applicationUrl || 'Not found',
            applyButtonType,
            noLongerAccepting
        });

        // Return the scraped details
        return {
            description,
            postingDate,
            convertedDate,
            skills,
            applicantCount,
            applicationUrl,
            applyButtonType,
            noLongerAccepting,
            scrapedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error scraping job details:', error);
        return null;
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'scrapeJobDetails') {
        console.log('Received request to scrape job details');

        // Set up navigation capture to try to get the application URL
        setupNavigationCapture();

        // Scrape job details
        const jobDetails = scrapeJobDetails();

        // We don't need to extract the job ID anymore since we're not using it for URL capture

        // For company site applications (Case 3), we don't need to check for captured URLs
        // We just let the browser open the application page in a new tab

        // Send the scraped details back
        sendResponse({
            success: true,
            jobDetails
        });

        // Return true to indicate we'll send a response asynchronously
        return true;
    } else if (request.action === 'capturedApplicationUrl') {
        // Store the captured URL from the background script
        capturedApplicationUrl = request.url;
        console.log('Received captured application URL:', capturedApplicationUrl);

        // If we have job details, update them with the captured URL
        if (request.jobId) {
            console.log('Updating job', request.jobId, 'with captured URL');

            // Store the URL in local storage for this job ID
            chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
                const capturedUrls = data.capturedApplicationUrls || {};
                capturedUrls[request.jobId] = request.url;

                chrome.storage.local.set({ capturedApplicationUrls: capturedUrls }, () => {
                    console.log('Stored captured URL in local storage for job', request.jobId);
                });
            });
        }

        sendResponse({ success: true });
    }

    // Keep the message channel open for async response
    return true;
});

// Notify that the script is loaded
console.log('Job details scraper loaded');
