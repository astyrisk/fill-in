// LinkedIn Job Details Scraper
// This script is injected into LinkedIn job pages to scrape additional job details

// Function to convert relative date to actual date
function convertRelativeDateToActual(relativeDate) {
    if (!relativeDate) return null;

    // Extract the time period (e.g., "4 days ago", "2 weeks ago", "1 month ago")
    const match = relativeDate.match(/(\d+)\s+(day|days|week|weeks|month|months|hour|hours|minute|minutes)\s+ago/);
    if (!match) return relativeDate; // Return original if no match

    const amount = parseInt(match[1]);
    const unit = match[2];

    // Create a new date object for today
    const today = new Date();
    let date = new Date(today);

    // Subtract the appropriate amount of time
    if (unit === 'minute' || unit === 'minutes') {
        date.setMinutes(date.getMinutes() - amount);
    } else if (unit === 'hour' || unit === 'hours') {
        date.setHours(date.getHours() - amount);
    } else if (unit === 'day' || unit === 'days') {
        date.setDate(date.getDate() - amount);
    } else if (unit === 'week' || unit === 'weeks') {
        date.setDate(date.getDate() - (amount * 7));
    } else if (unit === 'month' || unit === 'months') {
        date.setMonth(date.getMonth() - amount);
    }

    // Format the date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];

    // Return both the original text and the converted date
    return {
        originalText: relativeDate,
        convertedDate: formattedDate,
        timestamp: date.getTime()
    };
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
        let postingDateText = null;

        for (const element of dateElements) {
            const text = element.textContent.trim();
            if (text.includes('Posted') || text.includes('Reposted')) {
                postingDateText = text;
                break;
            }
        }

        // Convert posting date to actual date
        const postingDate = convertRelativeDateToActual(postingDateText);

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

        // Extract apply URL
        let applyUrl = null;

        // First try to find the apply button
        const applyButtons = document.querySelectorAll('button[data-live-test-job-apply-button], a.jobs-apply-button');

        for (const applyButton of applyButtons) {
            // Check if the button has a role="link" attribute, which indicates it's a link
            if (applyButton.getAttribute('role') === 'link') {
                // Try to extract the URL from various sources

                // 1. Check if there's an onclick attribute that contains a URL
                const onClickAttr = applyButton.getAttribute('onclick') || '';
                if (onClickAttr.includes('http')) {
                    const match = onClickAttr.match(/https?:\/\/[^'"\s]+/);
                    if (match) {
                        applyUrl = match[0];
                        break;
                    }
                }

                // 2. Check if there's a data attribute that contains a URL
                for (const attr of applyButton.attributes) {
                    if (attr.name.startsWith('data-') && attr.value.includes('http')) {
                        const match = attr.value.match(/https?:\/\/[^'"\s]+/);
                        if (match) {
                            applyUrl = match[0];
                            break;
                        }
                    }
                }

                // 3. Check if there's a parent element with an href attribute
                if (!applyUrl) {
                    let parent = applyButton.parentElement;
                    let depth = 0; // Limit the depth to avoid infinite loops
                    while (parent && !applyUrl && depth < 5) {
                        if (parent.hasAttribute('href')) {
                            applyUrl = parent.getAttribute('href');
                            break;
                        }
                        parent = parent.parentElement;
                        depth++;
                    }
                }
            } else if (applyButton.tagName === 'A') {
                // If it's an actual link, get the href attribute
                applyUrl = applyButton.getAttribute('href');
                break;
            }
        }

        // If we still don't have the URL, try to find it in the page metadata
        if (!applyUrl) {
            // LinkedIn sometimes includes the apply URL in a meta tag
            const metaTags = document.querySelectorAll('meta');
            for (const meta of metaTags) {
                const content = meta.getAttribute('content') || '';
                if (content.includes('apply') && content.includes('http')) {
                    const match = content.match(/https?:\/\/[^'"\s]+/);
                    if (match) {
                        applyUrl = match[0];
                        break;
                    }
                }
            }
        }

        // If we still don't have the URL, look for any link that might be the apply link
        if (!applyUrl) {
            const applyLinks = document.querySelectorAll('a[href*="apply"], a[href*="job"]');
            for (const link of applyLinks) {
                const href = link.getAttribute('href');
                if (href && href.includes('http')) {
                    applyUrl = href;
                    break;
                }
            }
        }

        // If we still don't have the URL, try to extract it from the current page URL
        if (!applyUrl) {
            // LinkedIn job URLs often contain the job ID, which we can use to construct the apply URL
            const currentUrl = window.location.href;
            const jobIdMatch = currentUrl.match(/\/jobs\/view\/(\d+)/);
            if (jobIdMatch && jobIdMatch[1]) {
                const jobId = jobIdMatch[1];
                applyUrl = `https://www.linkedin.com/jobs/view/${jobId}/apply/`;
            }
        }

        console.log('Scraped job details:', {
            description: description ? 'Found' : 'Not found',
            postingDate,
            skills,
            applicantCount,
            applyUrl: applyUrl || 'Not found'
        });

        // Return the scraped details
        return {
            description,
            postingDate,
            skills,
            applicantCount,
            applyUrl,
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

        // Scrape job details
        const jobDetails = scrapeJobDetails();

        // Send the scraped details back
        sendResponse({
            success: true,
            jobDetails
        });
    }

    // Keep the message channel open for async response
    return true;
});

// Notify that the script is loaded
console.log('Job details scraper loaded');
