document.addEventListener('DOMContentLoaded', () => {
    const jobListingsContainer = document.getElementById('job-listings-container');
    const scrapeInfo = document.getElementById('scrape-info');
    const searchInput = document.getElementById('search-input');
    const refreshButton = document.getElementById('refresh-button');
    const countrySelect = document.getElementById('country-select');

    // Load job listings from storage
    loadJobListings();

    // Add event listeners
    searchInput.addEventListener('input', filterJobListings);

    // Add event listener for Easy Apply filter
    const easyApplyFilter = document.getElementById('filter-easy-apply');
    if (easyApplyFilter) {
        easyApplyFilter.addEventListener('change', filterJobListings);
    }

    // Add event listener for country filter
    if (countrySelect) {
        countrySelect.addEventListener('change', filterJobListings);

        // Populate country dropdown
        populateCountryDropdown();
    }

    refreshButton.addEventListener('click', () => {
        // Send message to background script to go back to LinkedIn and scrape again
        chrome.runtime.sendMessage({
            action: "openJobTab",
            url: "https://www.linkedin.com/jobs/"
        });
        window.close();
    });

    // Function to populate the country dropdown
    function populateCountryDropdown() {
        chrome.storage.local.get(['countries', 'linkedInJobsByCountry'], (data) => {
            // Get countries from either the countries array or the keys of linkedInJobsByCountry
            let availableCountries = [];

            if (data.countries && data.countries.length > 0) {
                availableCountries = data.countries;
            } else if (data.linkedInJobsByCountry) {
                availableCountries = Object.keys(data.linkedInJobsByCountry);
            }

            if (availableCountries.length === 0) {
                return;
            }

            // Sort countries alphabetically
            const sortedCountries = [...availableCountries].sort();

            // Clear existing options except the 'All Countries' option
            while (countrySelect.options.length > 1) {
                countrySelect.remove(1);
            }

            // Add country options
            sortedCountries.forEach(country => {
                if (country && country !== 'undefined') {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;

                    // Add job count if available
                    if (data.linkedInJobsByCountry && data.linkedInJobsByCountry[country]) {
                        const count = data.linkedInJobsByCountry[country].length;
                        option.textContent = `${country} (${count})`;
                    }

                    countrySelect.appendChild(option);
                }
            });
        });
    }

    function loadJobListings() {
        chrome.storage.local.get(['linkedInJobs', 'linkedInJobsByCountry', 'scrapeTimestamp', 'countries'], (data) => {
            if ((!data.linkedInJobs || data.linkedInJobs.length === 0) &&
                (!data.linkedInJobsByCountry || Object.keys(data.linkedInJobsByCountry).length === 0)) {
                jobListingsContainer.innerHTML = '<p>No job listings found. Please scrape LinkedIn jobs first.</p>';
                scrapeInfo.textContent = 'No data available';
                return;
            }

            // Use the new format if available, otherwise fall back to the old format
            const jobs = data.linkedInJobs || [];
            const totalJobCount = jobs.length;

            // Display scrape timestamp and job count
            const scrapeDate = new Date(data.scrapeTimestamp || new Date());
            scrapeInfo.textContent = `${totalJobCount} jobs scraped on ${scrapeDate.toLocaleString()} (includes all scrolled content)`;

            // Render job listings
            renderJobListings(jobs);

            // Populate country dropdown if we have country data
            if (data.countries && data.countries.length > 0) {
                populateCountryDropdown();
            }
        });
    }

    function renderJobListings(jobs) {
        jobListingsContainer.innerHTML = '';

        if (!jobs || jobs.length === 0) {
            jobListingsContainer.innerHTML = '<p>No job listings match your current filters.</p>';
            return;
        }

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

            // Add country badge if available
            if (job.country && job.country !== 'Unknown') {
                badges.push(`<span class="job-badge country">${job.country}</span>`);
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
        const selectedCountry = countrySelect.value;

        chrome.storage.local.get(['linkedInJobs', 'linkedInJobsByCountry'], (data) => {
            // Use the new format if available, otherwise fall back to the old format
            let allJobs = [];
            let totalJobCount = 0;

            if (data.linkedInJobsByCountry && Object.keys(data.linkedInJobsByCountry).length > 0) {
                // If country is selected and not 'all', filter by country
                if (selectedCountry && selectedCountry !== 'all') {
                    allJobs = data.linkedInJobsByCountry[selectedCountry] || [];
                } else {
                    // If 'all' is selected, combine all countries
                    Object.values(data.linkedInJobsByCountry).forEach(countryJobs => {
                        allJobs = allJobs.concat(countryJobs);
                    });
                }

                // Calculate total job count across all countries
                Object.values(data.linkedInJobsByCountry).forEach(countryJobs => {
                    totalJobCount += countryJobs.length;
                });
            } else if (data.linkedInJobs) {
                // Fall back to old format
                allJobs = data.linkedInJobs;
                totalJobCount = allJobs.length;
            } else {
                // No jobs available
                renderJobListings([]);
                scrapeInfo.textContent = 'No job data available';
                return;
            }

            // Apply text search filter
            const filteredJobs = allJobs.filter(job => {
                return job.title.toLowerCase().includes(searchTerm) ||
                       job.company.toLowerCase().includes(searchTerm) ||
                       job.location.toLowerCase().includes(searchTerm) ||
                       (job.applicationInsight && job.applicationInsight.toLowerCase().includes(searchTerm)) ||
                       (job.jobId && job.jobId.toLowerCase().includes(searchTerm));
            });

            // Apply Easy Apply filter
            const easyApplyJobs = document.getElementById('filter-easy-apply')?.checked ?
                filteredJobs.filter(job => job.isEasyApply) : filteredJobs;

            renderJobListings(easyApplyJobs);

            // Update status text with filter information
            let statusText = `Showing ${easyApplyJobs.length} of ${totalJobCount} jobs`;
            if (selectedCountry && selectedCountry !== 'all') {
                statusText += ` in ${selectedCountry}`;
            }
            scrapeInfo.textContent = statusText;
        });
    }
});