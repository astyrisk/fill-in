document.addEventListener('DOMContentLoaded', () => {
    const jobListingsContainer = document.getElementById('job-listings-container');
    const scrapeInfo = document.getElementById('scrape-info');
    const searchInput = document.getElementById('search-input');
    const refreshButton = document.getElementById('refresh-button');

    // Load job listings from storage
    loadJobListings();

    // Add event listeners
    searchInput.addEventListener('input', filterJobListings);

    // Add event listener for Easy Apply filter
    const easyApplyFilter = document.getElementById('filter-easy-apply');
    if (easyApplyFilter) {
        easyApplyFilter.addEventListener('change', filterJobListings);
    }

    refreshButton.addEventListener('click', () => {
        // Send message to background script to go back to LinkedIn and scrape again
        chrome.runtime.sendMessage({
            action: "openJobTab",
            url: "https://www.linkedin.com/jobs/"
        });
        window.close();
    });

    function loadJobListings() {
        chrome.storage.local.get(['linkedInJobs', 'scrapeTimestamp'], (data) => {
            if (!data.linkedInJobs || data.linkedInJobs.length === 0) {
                jobListingsContainer.innerHTML = '<p>No job listings found. Please scrape LinkedIn jobs first.</p>';
                scrapeInfo.textContent = 'No data available';
                return;
            }

            // Display scrape timestamp
            const scrapeDate = new Date(data.scrapeTimestamp);
            scrapeInfo.textContent = `${data.linkedInJobs.length} jobs scraped on ${scrapeDate.toLocaleString()}`;

            // Render job listings
            renderJobListings(data.linkedInJobs);
        });
    }

    function renderJobListings(jobs) {
        jobListingsContainer.innerHTML = '';

        jobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = 'job-card';

            // Create badges for Easy Apply and Promoted
            const badges = [];
            if (job.isEasyApply) {
                badges.push('<span class="job-badge easy-apply">Easy Apply</span>');
            }
            if (job.isPromoted) {
                badges.push('<span class="job-badge promoted">Promoted</span>');
            }

            // Format application insight if available
            const insightHtml = job.applicationInsight ?
                `<div class="job-insight">${job.applicationInsight}</div>` : '';

            jobCard.innerHTML = `
                <div class="job-header">
                    <div class="job-title">${job.title}</div>
                    <div class="job-badges">${badges.join('')}</div>
                </div>
                <div class="job-company">${job.company}</div>
                <div class="job-location">${job.location}</div>
                ${insightHtml}
                <div class="job-actions">
                    <a href="${job.jobUrl}" target="_blank" class="apply-button">View Job</a>
                    <span class="job-id">ID: ${job.jobId || 'N/A'}</span>
                </div>
            `;

            jobListingsContainer.appendChild(jobCard);
        });
    }

    function filterJobListings() {
        const searchTerm = searchInput.value.toLowerCase();

        chrome.storage.local.get(['linkedInJobs'], (data) => {
            if (!data.linkedInJobs) return;

            const filteredJobs = data.linkedInJobs.filter(job => {
                return job.title.toLowerCase().includes(searchTerm) ||
                       job.company.toLowerCase().includes(searchTerm) ||
                       job.location.toLowerCase().includes(searchTerm) ||
                       (job.applicationInsight && job.applicationInsight.toLowerCase().includes(searchTerm)) ||
                       (job.jobId && job.jobId.toLowerCase().includes(searchTerm));
            });

            // Add filter options for Easy Apply
            const easyApplyJobs = document.getElementById('filter-easy-apply')?.checked ?
                filteredJobs.filter(job => job.isEasyApply) : filteredJobs;

            renderJobListings(easyApplyJobs);
            scrapeInfo.textContent = `Showing ${easyApplyJobs.length} of ${data.linkedInJobs.length} jobs`;
        });
    }
});