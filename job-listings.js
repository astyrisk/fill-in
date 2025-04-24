document.addEventListener('DOMContentLoaded', () => {
    const jobListingsContainer = document.getElementById('job-listings-container');
    const scrapeInfo = document.getElementById('scrape-info');
    const searchInput = document.getElementById('search-input');
    const refreshButton = document.getElementById('refresh-button');
    const countrySelect = document.getElementById('country-select');

    // Popup elements
    const popupOverlay = document.getElementById('popup-overlay');
    const jobDetailsPopup = document.getElementById('job-details-popup');
    const popupClose = document.getElementById('popup-close');

    // Close popup when clicking the close button or overlay
    popupClose.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', closePopup);

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

    // Function to close the popup
    function closePopup() {
        popupOverlay.classList.remove('active');
        jobDetailsPopup.classList.remove('active');
    }

    // Function to open the popup and display job details
    function openJobDetailsPopup(job) {
        console.log('Opening job details popup for:', job);

        // Set basic job details
        document.getElementById('popup-title').textContent = job.title || 'Job Title';
        document.getElementById('popup-company').textContent = job.company || 'Company';
        document.getElementById('popup-location').textContent = job.location || 'Location';

        // Set posting date if available
        if (job.postingDate && typeof job.postingDate === 'object') {
            // If it's the new format with converted date
            document.getElementById('popup-posted').textContent =
                `${job.postingDate.originalText} (${job.postingDate.convertedDate})`;
        } else {
            // Fallback to the old format or not available
            document.getElementById('popup-posted').textContent = job.postingDate || 'Not available';
        }

        // Set application count if available
        document.getElementById('popup-applications').textContent = job.applicantCount || 'Not available';

        // Set up Apply button if we have the URL
        const applyContainer = document.getElementById('popup-apply-container');
        const applyButton = document.getElementById('popup-apply-button');

        if (job.applyUrl) {
            applyButton.href = job.applyUrl;
            applyContainer.style.display = 'block';
        } else {
            applyContainer.style.display = 'none';
        }

        // Set skills if available
        const skillsContainer = document.getElementById('popup-skills');
        if (job.skills && job.skills.length > 0) {
            skillsContainer.innerHTML = '';
            job.skills.forEach(skill => {
                const skillElement = document.createElement('div');
                skillElement.className = 'popup-skill';
                skillElement.textContent = skill;
                skillsContainer.appendChild(skillElement);
            });
        } else {
            skillsContainer.innerHTML = '<div>No skills information available</div>';
        }

        // Set job description if available
        const descriptionContainer = document.getElementById('popup-description');
        if (job.description) {
            descriptionContainer.innerHTML = job.description;
        } else {
            // If we don't have the description yet, try to scrape it now
            if (!job.detailsScraped && !job.isScrapingDetails && job.jobId && job.jobUrl) {
                descriptionContainer.innerHTML = '<div class="popup-loading">Loading job description...</div>';

                // Mark that we're starting to scrape
                job.isScrapingDetails = true;

                // Scrape job details
                scrapeJobDetails(job.jobUrl, job.jobId, job.country).then(jobDetails => {
                    // Reset scraping flag
                    job.isScrapingDetails = false;

                    if (jobDetails) {
                        // Update the job with the scraped details
                        updateJobWithDetails(job.jobId, job.country, jobDetails);

                        // Update the current job object for immediate use
                        Object.assign(job, jobDetails, { detailsScraped: true });

                        // Update the popup with the new details
                        if (job.description) {
                            descriptionContainer.innerHTML = job.description;
                        } else {
                            descriptionContainer.innerHTML = '<div>No job description available</div>';
                        }

                        // Update skills
                        if (job.skills && job.skills.length > 0) {
                            skillsContainer.innerHTML = '';
                            job.skills.forEach(skill => {
                                const skillElement = document.createElement('div');
                                skillElement.className = 'popup-skill';
                                skillElement.textContent = skill;
                                skillsContainer.appendChild(skillElement);
                            });
                        }

                        // Update other fields
                        if (job.postingDate && typeof job.postingDate === 'object') {
                            document.getElementById('popup-posted').textContent =
                                `${job.postingDate.originalText} (${job.postingDate.convertedDate})`;
                        } else {
                            document.getElementById('popup-posted').textContent = job.postingDate || 'Not available';
                        }

                        document.getElementById('popup-applications').textContent = job.applicantCount || 'Not available';

                        // Update Apply button
                        const applyContainer = document.getElementById('popup-apply-container');
                        const applyButton = document.getElementById('popup-apply-button');

                        if (job.applyUrl) {
                            applyButton.href = job.applyUrl;
                            applyContainer.style.display = 'block';
                        } else {
                            applyContainer.style.display = 'none';
                        }
                    } else {
                        descriptionContainer.innerHTML = '<div>Failed to load job description</div>';
                    }
                }).catch(error => {
                    console.error(`Error scraping details for job ${job.jobId}:`, error);
                    descriptionContainer.innerHTML = '<div>Error loading job description</div>';
                    job.isScrapingDetails = false;
                });
            } else {
                descriptionContainer.innerHTML = '<div>No job description available</div>';
            }
        }

        // Show the popup
        popupOverlay.classList.add('active');
        jobDetailsPopup.classList.add('active');
    }

    // Function to scrape job details from LinkedIn using a hidden tab
    async function scrapeJobDetails(jobUrl, jobId, country) {
        return new Promise((resolve, reject) => {
            console.log(`Starting to scrape details for job ${jobId} at ${jobUrl}`);

            // Send message to background script to create a hidden tab and scrape the job details
            chrome.runtime.sendMessage({
                action: "scrapeJobDetails",
                jobUrl: jobUrl,
                jobId: jobId,
                country: country
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error scraping job details:", chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }

                if (response && response.success && response.jobDetails) {
                    console.log(`Successfully scraped details for job ${jobId}:`, response.jobDetails);
                    resolve(response.jobDetails);
                } else {
                    const errorMsg = response?.error || "Unknown error";
                    console.error(`Failed to scrape job details for job ${jobId}: ${errorMsg}`);
                    reject(new Error(errorMsg));
                }
            });

            // Set a timeout to prevent hanging if the background script doesn't respond
            setTimeout(() => {
                reject(new Error("Timeout while scraping job details"));
            }, 30000); // 30 seconds timeout
        });
    }

    // Function to update job with additional details
    function updateJobWithDetails(jobId, country, additionalDetails) {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) return;

            // Find the job in storage
            const countryJobs = data.linkedInJobsByCountry[country];
            if (!countryJobs) return;

            const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);
            if (jobIndex === -1) return;

            // Update the job with additional details
            const updatedJob = {
                ...countryJobs[jobIndex],
                ...additionalDetails,
                detailsScraped: true
            };

            // Update the job in storage
            countryJobs[jobIndex] = updatedJob;
            data.linkedInJobsByCountry[country] = countryJobs;

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: Object.values(data.linkedInJobsByCountry).flat() // Update flat list for backward compatibility
            }, () => {
                console.log(`Updated job ${jobId} with additional details`);
            });
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

            // Add details badge if we have scraped additional details
            if (job.detailsScraped) {
                badges.push('<span class="job-badge details">Details Available</span>');
            }

            jobCard.innerHTML = `
                <div class="job-header">
                    <div class="job-title">${job.title}</div>
                    <div class="job-badges">${badges.join('')}</div>
                </div>
                <div class="job-company">${job.company}</div>
                <div class="job-location">${job.location}</div>
                ${insightHtml}
                <div class="job-actions">
                    <a href="javascript:void(0)" class="apply-button view-job-btn" data-job-id="${job.jobId || ''}" data-job-url="${job.jobUrl}" data-job-country="${job.country || ''}">View Job</a>
                    <a href="${job.jobUrl}" target="_blank" class="apply-button" style="margin-left: 5px;">Open in LinkedIn</a>
                    <span class="job-id">ID: ${job.jobId || 'N/A'}</span>
                </div>
            `;

            jobListingsContainer.appendChild(jobCard);

            // Get the View Job button we just added
            const viewJobBtn = jobCard.querySelector('.view-job-btn');

            // Add hover event to scrape job details
            viewJobBtn.addEventListener('mouseenter', function() {
                const jobId = this.getAttribute('data-job-id');
                const jobUrl = this.getAttribute('data-job-url');
                const country = this.getAttribute('data-job-country');

                // Only scrape if we haven't already and we're not currently scraping
                if (!job.detailsScraped && !job.isScrapingDetails && jobId && jobUrl) {
                    // Mark that we're starting to scrape
                    job.isScrapingDetails = true;

                    // Show loading indicator
                    this.classList.add('loading');
                    this.textContent = 'Loading details...';

                    console.log(`Hovering over job ${jobId}, scraping details...`);

                    // Scrape job details
                    scrapeJobDetails(jobUrl, jobId, country).then(jobDetails => {
                        // Remove loading indicator
                        this.classList.remove('loading');
                        this.textContent = 'View Job';

                        // Reset scraping flag
                        job.isScrapingDetails = false;

                        if (jobDetails) {
                            // Update the job with the scraped details
                            updateJobWithDetails(jobId, country, jobDetails);

                            // Update the current job object for immediate use
                            Object.assign(job, jobDetails, { detailsScraped: true });

                            // Add the details badge to the job card
                            const jobCard = this.closest('.job-card');
                            const badgesContainer = jobCard.querySelector('.job-badges');
                            if (badgesContainer && !jobCard.querySelector('.job-badge.details')) {
                                const detailsBadge = document.createElement('span');
                                detailsBadge.className = 'job-badge details';
                                detailsBadge.textContent = 'Details Available';
                                badgesContainer.appendChild(detailsBadge);
                            }
                        }
                    }).catch(error => {
                        console.error(`Error scraping details for job ${jobId}:`, error);

                        // Remove loading indicator
                        this.classList.remove('loading');
                        this.textContent = 'View Job';

                        // Reset scraping flag
                        job.isScrapingDetails = false;
                    });
                }
            });

            // Add click event to show popup with job details
            viewJobBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openJobDetailsPopup(job);
            });
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