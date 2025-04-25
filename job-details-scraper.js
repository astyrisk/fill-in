// LinkedIn Job Details Scraper
// This script is injected into LinkedIn job pages to scrape additional job details

// Variable to store the application URL captured from navigation events
let capturedApplicationUrl = null;

// Set up a listener to capture navigation events
function setupNavigationCapture() {
    console.log('Setting up navigation capture for application URL');

    // Find the apply button - try multiple selectors to ensure we find it
    const applyButton = document.querySelector('#jobs-apply-button-id, .jobs-apply-button, button[role="link"][aria-label*="Apply"], a[data-control-name="jobdetails_apply_button"]');

    if (applyButton) {
        console.log('Found apply button, setting up click listener');

        // Store the job ID from the URL if available
        const jobId = extractJobIdFromUrl(window.location.href);
        console.log('Current job ID:', jobId);

        // Add a click listener to capture the URL before navigation
        applyButton.addEventListener('click', function(event) {
            // Don't prevent default for now, as it might interfere with LinkedIn's own handlers
            // event.preventDefault();
            // event.stopPropagation();

            console.log('Apply button clicked, capturing URL');

            // Send a message to the background script to start URL capture with the job ID
            chrome.runtime.sendMessage({
                action: "startUrlCapture",
                jobId: jobId,
                sourceUrl: window.location.href
            });

            // We'll let the click proceed normally and rely on the background script
            // to capture the URL of any new tab that opens
        });

        // Extract URL from onclick handlers
        const onclickAttr = applyButton.getAttribute('onclick');
        if (onclickAttr) {
            console.log('Found onclick attribute:', onclickAttr);
            // Try to extract URL from onclick if possible - improved regex to handle more patterns
            const urlMatch = onclickAttr.match(/window\.open\(['"]([^'"]+)['"]/) ||
                            onclickAttr.match(/location\.href\s*=\s*['"]([^'"]+)['"]/) ||
                            onclickAttr.match(/location\.replace\(['"]([^'"]+)['"]/);
            if (urlMatch && urlMatch[1]) {
                console.log('Extracted URL from onclick:', urlMatch[1]);
                capturedApplicationUrl = urlMatch[1];
            }
        }

        // Check for data attributes that might contain the URL
        const dataAttrs = Array.from(applyButton.attributes)
            .filter(attr => attr.name.startsWith('data-'));

        dataAttrs.forEach(attr => {
            console.log(`Data attribute ${attr.name}:`, attr.value);
            // Look for URLs in data attributes
            if (attr.value && (attr.value.startsWith('http') || attr.value.includes('apply'))) {
                console.log('Possible URL found in data attribute:', attr.value);
                capturedApplicationUrl = attr.value;
            }
        });

        // Check for event listeners using a MutationObserver
        setupMutationObserver(applyButton, jobId);

        // Try to extract URL from JavaScript event handlers
        extractUrlFromEventHandlers(applyButton);

        // If we still don't have a URL, try to simulate a click in a controlled way
        if (!capturedApplicationUrl) {
            console.log('Attempting to extract URL by simulating click behavior');
            simulateControlledClick(applyButton, jobId);
        }
    } else {
        console.log('Apply button not found');

        // If we can't find the apply button, look for any links that might be apply links
        const possibleApplyLinks = document.querySelectorAll('a[href*="apply"], a[href*="job"], a[href*="career"], button[data-control-name*="apply"], [role="button"][aria-label*="Apply"]');
        console.log('Found', possibleApplyLinks.length, 'possible apply links');

        possibleApplyLinks.forEach(link => {
            const href = link.getAttribute('href');
            console.log('Possible apply link:', href);

            // If it looks like an external link, it might be the apply link
            if (href && !href.includes('linkedin.com')) {
                console.log('Found potential external apply link:', href);
                capturedApplicationUrl = href;
            }

            // Also check onclick and other attributes
            extractUrlFromEventHandlers(link);
        });

        // Look for apply button in iframes
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                const iframeApplyButton = iframeDoc.querySelector('#jobs-apply-button-id, .jobs-apply-button, button[role="link"][aria-label*="Apply"]');
                if (iframeApplyButton) {
                    console.log('Found apply button in iframe');
                    extractUrlFromEventHandlers(iframeApplyButton);
                }
            } catch (e) {
                console.log('Could not access iframe content due to same-origin policy');
            }
        });
    }
}

// Function to set up a mutation observer to detect URL changes
function setupMutationObserver(applyButton, jobId) {
    // Create a MutationObserver to watch for changes to the apply button
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                const href = applyButton.getAttribute('href');
                if (href && (href.startsWith('http') || href.startsWith('/'))) {
                    console.log('Apply button href changed:', href);
                    capturedApplicationUrl = href.startsWith('/') ?
                        `${window.location.origin}${href}` : href;
                }
            }
        }
    });

    // Start observing the apply button for attribute changes
    observer.observe(applyButton, { attributes: true });

    // Also observe the document body for new links that might be added
    const bodyObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                const newLinks = document.querySelectorAll('a[href*="apply"][target="_blank"], a[href*="job"][target="_blank"]');
                newLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && !href.includes('linkedin.com')) {
                        console.log('Found new external link after mutation:', href);
                        capturedApplicationUrl = href;
                    }
                });
            }
        }
    });

    // Start observing the document body for new elements
    bodyObserver.observe(document.body, { childList: true, subtree: true });
}

// Function to extract URLs from JavaScript event handlers
function extractUrlFromEventHandlers(element) {
    if (!element) return;

    // Check for href attribute
    const href = element.getAttribute('href');
    if (href && (href.startsWith('http') || href.startsWith('/'))) {
        console.log('Found href attribute:', href);
        capturedApplicationUrl = href.startsWith('/') ?
            `${window.location.origin}${href}` : href;
        return;
    }

    // Check for data-url or similar attributes
    const dataUrl = element.getAttribute('data-url') ||
                   element.getAttribute('data-href') ||
                   element.getAttribute('data-link');
    if (dataUrl && (dataUrl.startsWith('http') || dataUrl.startsWith('/'))) {
        console.log('Found data-url attribute:', dataUrl);
        capturedApplicationUrl = dataUrl.startsWith('/') ?
            `${window.location.origin}${dataUrl}` : dataUrl;
        return;
    }

    // Check for JavaScript event handlers in HTML attributes
    const jsHandlers = ['onclick', 'onmousedown', 'onmouseup', 'ontouchend'];
    for (const handler of jsHandlers) {
        const handlerCode = element.getAttribute(handler);
        if (handlerCode) {
            console.log(`Found ${handler} attribute:`, handlerCode);

            // Look for various patterns of URL usage in JavaScript
            const urlPatterns = [
                /window\.open\(['"]([^'"]+)['"]/, // window.open('url')
                /location\.href\s*=\s*['"]([^'"]+)['"]/, // location.href = 'url'
                /location\.replace\(['"]([^'"]+)['"]/, // location.replace('url')
                /navigate\(['"]([^'"]+)['"]/, // navigate('url')
                /['"]https?:\/\/[^'"]+['"]/ // Any http/https URL
            ];

            for (const pattern of urlPatterns) {
                const match = handlerCode.match(pattern);
                if (match && match[1]) {
                    console.log(`Extracted URL from ${handler}:`, match[1]);
                    capturedApplicationUrl = match[1];
                    return;
                }
            }
        }
    }

    // Check for React/Angular/Vue event handlers stored in __reactEventHandlers or similar
    for (const key in element) {
        if (key.includes('reactEventHandlers') || key.includes('__reactProps') ||
            key.includes('__vueEventHandlers') || key.includes('ngEventHandlers')) {
            console.log(`Found framework event handlers: ${key}`);
            try {
                const handlers = element[key];
                // Look for onClick, onPress, or similar handlers
                for (const handlerKey in handlers) {
                    if (handlerKey.toLowerCase().includes('click') || handlerKey.toLowerCase().includes('press')) {
                        console.log(`Found handler: ${handlerKey}`);
                        // We can't directly extract the URL, but we can note that we found a handler
                        // This indicates we should rely on the navigation capture
                    }
                }
            } catch (e) {
                console.error('Error accessing event handlers:', e);
            }
        }
    }
}

// Function to simulate a click in a controlled way
function simulateControlledClick(applyButton, jobId) {
    if (!applyButton) return;

    // Create a proxy for window.open to capture the URL
    const originalWindowOpen = window.open;
    window.open = function(url) {
        console.log('Intercepted window.open call with URL:', url);
        capturedApplicationUrl = url;
        return { closed: false }; // Return a mock window object
    };

    // Create a proxy for location changes
    const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
    let locationChangeUrl = null;

    try {
        Object.defineProperty(window, 'location', {
            configurable: true,
            get: function() {
                return originalLocationDescriptor.get.call(this);
            },
            set: function(url) {
                console.log('Intercepted location change to:', url);
                locationChangeUrl = url;
                capturedApplicationUrl = url;
                // Don't actually change location
            }
        });

        // Also override location.href
        const originalHrefDescriptor = Object.getOwnPropertyDescriptor(window.location, 'href');
        Object.defineProperty(window.location, 'href', {
            configurable: true,
            get: function() {
                return originalHrefDescriptor.get.call(this);
            },
            set: function(url) {
                console.log('Intercepted location.href change to:', url);
                locationChangeUrl = url;
                capturedApplicationUrl = url;
                // Don't actually change location
            }
        });

        // Create a proxy for location.replace
        const originalReplace = window.location.replace;
        window.location.replace = function(url) {
            console.log('Intercepted location.replace call with URL:', url);
            locationChangeUrl = url;
            capturedApplicationUrl = url;
            // Don't actually call replace
        };

        // Simulate a click on the apply button
        console.log('Simulating click on apply button');
        applyButton.click();

        // If we captured a URL from the click, use it
        if (locationChangeUrl) {
            console.log('Captured URL from location change:', locationChangeUrl);
            capturedApplicationUrl = locationChangeUrl;
        }
    } catch (e) {
        console.error('Error during controlled click simulation:', e);
    } finally {
        // Restore original functions
        window.open = originalWindowOpen;
        Object.defineProperty(window, 'location', originalLocationDescriptor);

        // If we have a job ID, send a message to start URL capture anyway
        // as a fallback in case our interception didn't work
        if (jobId) {
            chrome.runtime.sendMessage({
                action: "startUrlCapture",
                jobId: jobId,
                sourceUrl: window.location.href
            });
        }
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

        // Method 1: Look for the apply button
        const applyButton = document.querySelector('#jobs-apply-button-id, .jobs-apply-button, button[role="link"][aria-label*="Apply"]');
        if (applyButton && applyButton.hasAttribute('href')) {
            applicationUrl = applyButton.getAttribute('href');
            console.log('Found application URL from apply button href:', applicationUrl);
        }

        // Method 2: Look for any apply button with a link
        if (!applicationUrl) {
            const applyLinks = document.querySelectorAll('a[data-control-name="jobdetails_apply_button"], a.jobs-apply-button, a[role="link"][aria-label*="Apply"], a[href*="apply"], a[href*="job"][target="_blank"]');
            if (applyLinks && applyLinks.length > 0) {
                for (const link of applyLinks) {
                    if (link.hasAttribute('href')) {
                        applicationUrl = link.getAttribute('href');
                        console.log('Found application URL from apply link:', applicationUrl);
                        break;
                    }
                }
            }
        }

        // Method 3: Check for an iframe that might contain the application
        if (!applicationUrl) {
            const iframes = document.querySelectorAll('iframe[src*="apply"], iframe[src*="job"]');
            if (iframes && iframes.length > 0) {
                applicationUrl = iframes[0].getAttribute('src');
                console.log('Found application URL from iframe:', applicationUrl);
            }
        }

        // Method 4: Check for any redirects in meta tags
        if (!applicationUrl) {
            const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
            if (metaRefresh) {
                const content = metaRefresh.getAttribute('content');
                const urlMatch = content && content.match(/URL=([^\s]+)/i);
                if (urlMatch && urlMatch[1]) {
                    applicationUrl = urlMatch[1];
                    console.log('Found application URL from meta refresh:', applicationUrl);
                }
            }
        }

        // Method 5: Check for apply URL in script tags
        if (!applicationUrl) {
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const scriptContent = script.textContent;
                if (scriptContent) {
                    // Look for apply URLs in script content
                    const applyUrlMatches = scriptContent.match(/applyUrl['"']?\s*:\s*['"']([^'"']+)['"']/) ||
                                           scriptContent.match(/apply_url['"']?\s*:\s*['"']([^'"']+)['"']/) ||
                                           scriptContent.match(/applicationUrl['"']?\s*:\s*['"']([^'"']+)['"']/) ||
                                           scriptContent.match(/redirectUrl['"']?\s*:\s*['"']([^'"']+)['"']/) ||
                                           scriptContent.match(/externalApplyUrl['"']?\s*:\s*['"']([^'"']+)['"']/);

                    if (applyUrlMatches && applyUrlMatches[1]) {
                        applicationUrl = applyUrlMatches[1];
                        console.log('Found application URL in script tag:', applicationUrl);
                        break;
                    }
                }
            }
        }

        // Method 6: Extract from JSON-LD structured data
        if (!applicationUrl) {
            const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const jsonScript of jsonLdScripts) {
                try {
                    const jsonData = JSON.parse(jsonScript.textContent);
                    // Look for application URL in structured data
                    if (jsonData.applicationUrl) {
                        applicationUrl = jsonData.applicationUrl;
                        console.log('Found application URL in JSON-LD data:', applicationUrl);
                        break;
                    } else if (jsonData.url && jsonData['@type'] === 'JobPosting') {
                        applicationUrl = jsonData.url;
                        console.log('Found job URL in JSON-LD data:', applicationUrl);
                        break;
                    }
                } catch (e) {
                    console.error('Error parsing JSON-LD data:', e);
                }
            }
        }

        // Method 7: Use the captured URL from navigation events if available
        if (!applicationUrl && capturedApplicationUrl) {
            applicationUrl = capturedApplicationUrl;
            console.log('Using captured application URL from navigation event:', applicationUrl);
        }

        // Method 8: Check local storage for a URL that might have been captured by the background script
        if (!applicationUrl) {
            // We'll retrieve this in the message handler after scraping is complete
            console.log('Will check local storage for captured URL after scraping');
        }

        // Method 9: Fallback to constructing a URL from the job ID
        if (!applicationUrl) {
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
            applicationUrl: applicationUrl || 'Not found'
        });

        // Return the scraped details
        return {
            description,
            postingDate,
            convertedDate,
            skills,
            applicantCount,
            applicationUrl,
            scrapedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error scraping job details:', error);
        return null;
    }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrapeJobDetails') {
        console.log('Received request to scrape job details');

        // Set up navigation capture to try to get the application URL
        setupNavigationCapture();

        // Scrape job details
        const jobDetails = scrapeJobDetails();

        // Check if we have a job ID
        const jobId = extractJobIdFromUrl(window.location.href);

        // Check if there's a captured URL in local storage for this job
        chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
            const capturedUrls = data.capturedApplicationUrls || {};

            if (jobId && capturedUrls[jobId]) {
                console.log('Found captured URL in storage for job', jobId, ':', capturedUrls[jobId]);
                jobDetails.applicationUrl = capturedUrls[jobId];
            }

            // Send the scraped details back
            sendResponse({
                success: true,
                jobDetails
            });
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

// Set up navigation capture when the script loads
setupNavigationCapture();

// Notify that the script is loaded
console.log('Job details scraper loaded');
