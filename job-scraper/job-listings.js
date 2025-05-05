document.addEventListener('DOMContentLoaded', () => {
    const jobListingsContainer = document.getElementById('job-listings-container');
    const scrapeInfo = document.getElementById('scrape-info');
    const searchInput = document.getElementById('search-input');
    // Refresh button removed
    const deleteShownJobsButton = document.getElementById('delete-shown-jobs-button');
    const countrySelect = document.getElementById('country-select');

    // Popup elements
    const popupOverlay = document.getElementById('popup-overlay');
    const jobDetailsPopup = document.getElementById('job-details-popup');
    const popupClose = document.getElementById('popup-close');

    // Confirmation dialog elements
    const confirmationDialog = document.getElementById('confirmation-dialog');
    const confirmationTitle = document.getElementById('confirmation-title');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmDeleteButton = document.getElementById('confirm-delete');
    const cancelDeleteButton = document.getElementById('cancel-delete');

    // Variables to store deletion context
    let deletionContext = {
        filteredJobs: null
    };

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

    // Refresh button event listener removed

    // Function to get filtered jobs based on current filters
    function getFilteredJobs(callback) {
        chrome.storage.local.get(['linkedInJobs', 'linkedInJobsByCountry'], (data) => {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedCountry = countrySelect.value;
            let allJobs = [];

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
            } else if (data.linkedInJobs) {
                // Fall back to old format
                allJobs = data.linkedInJobs;
            } else {
                // No jobs available
                callback([]);
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

            callback(easyApplyJobs);
        });
    }

    // Add event listener for Delete Shown Jobs button
    deleteShownJobsButton.addEventListener('click', () => {
        // Get the currently filtered jobs
        getFilteredJobs((filteredJobs) => {
            if (filteredJobs.length === 0) {
                alert('No jobs to delete with current filters.');
                return;
            }

            // Set up deletion context
            deletionContext = {
                filteredJobs: filteredJobs
            };

            // Show confirmation dialog
            confirmationTitle.textContent = 'Delete Multiple Jobs';
            confirmationMessage.textContent = `Are you sure you want to delete ${filteredJobs.length} jobs? This action cannot be undone.`;
            confirmationDialog.classList.add('active');
            popupOverlay.classList.add('active');
        });
    });

    // Add event listeners for confirmation dialog buttons
    confirmDeleteButton.addEventListener('click', () => {
        // Delete multiple jobs
        deleteMultipleJobs(deletionContext.filteredJobs);

        // Close the confirmation dialog
        closeConfirmationDialog();
    });

    cancelDeleteButton.addEventListener('click', closeConfirmationDialog);

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

    // Function to close the confirmation dialog
    function closeConfirmationDialog() {
        confirmationDialog.classList.remove('active');
        popupOverlay.classList.remove('active');
    }

    // Function to archive a single job (move to Archive country)
    function archiveSingleJob(jobId, country, jobElement) {
        // Don't archive if the job is already in Archive
        if (country === 'Archive') {
            alert('This job is already archived');
            return;
        }

        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) return;

            // Find the job in the country's job list
            const countryJobs = data.linkedInJobsByCountry[country];
            if (!countryJobs) return;

            // Find the job to archive
            const jobToArchive = countryJobs.find(job => job.jobId === jobId);
            if (!jobToArchive) return;

            // Create a copy of the job with updated country
            const archivedJob = {
                ...jobToArchive,
                country: 'Archive',
                archivedAt: new Date().toISOString(),
                originalCountry: country
            };

            // Initialize Archive country if it doesn't exist
            if (!data.linkedInJobsByCountry['Archive']) {
                data.linkedInJobsByCountry['Archive'] = [];
            }

            // Add the job to the Archive country
            data.linkedInJobsByCountry['Archive'].push(archivedJob);

            // Filter out the job from the original country
            const updatedCountryJobs = countryJobs.filter(job => job.jobId !== jobId);

            // Update the country's job list
            data.linkedInJobsByCountry[country] = updatedCountryJobs;

            // Update the flat list for backward compatibility
            const updatedAllJobs = Object.values(data.linkedInJobsByCountry).flat();

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: updatedAllJobs,
                countries: Object.keys(data.linkedInJobsByCountry)
            }, () => {
                console.log(`Archived job ${jobId} from ${country} to Archive`);

                // Remove the job element from the DOM if provided
                if (jobElement && jobElement.parentNode) {
                    jobElement.parentNode.removeChild(jobElement);
                }

                // Update the job count in the UI
                updateJobCountDisplay(updatedAllJobs.length);
            });
        });
    }

    // Function to delete a single job
    function deleteSingleJob(jobId, country, jobElement) {
        // If we have a job element but no ID or country, just remove the element from the DOM
        if (jobElement && (!jobId || !country)) {
            console.log('Removing job element without ID or country from the DOM');
            if (jobElement.parentNode) {
                jobElement.parentNode.removeChild(jobElement);
            }
            return;
        }

        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) {
                // If there's no job data but we have a job element, remove it
                if (jobElement && jobElement.parentNode) {
                    jobElement.parentNode.removeChild(jobElement);
                }
                return;
            }

            // If country is missing, try to find the job in all countries
            if (!country) {
                let foundJob = false;
                Object.keys(data.linkedInJobsByCountry).forEach(countryKey => {
                    const countryJobs = data.linkedInJobsByCountry[countryKey];
                    const jobToDelete = countryJobs.find(job => job.jobId === jobId);
                    if (jobToDelete) {
                        foundJob = true;
                        // Use the found country to delete the job
                        country = countryKey;
                    }
                });

                if (!foundJob) {
                    // If job not found and we have a job element, remove it
                    if (jobElement && jobElement.parentNode) {
                        jobElement.parentNode.removeChild(jobElement);
                    }
                    return;
                }
            }

            // Find the job in the country's job list
            const countryJobs = data.linkedInJobsByCountry[country];
            if (!countryJobs) {
                // If country doesn't exist but we have a job element, remove it
                if (jobElement && jobElement.parentNode) {
                    jobElement.parentNode.removeChild(jobElement);
                }
                return;
            }

            // Filter out the job to delete
            const updatedCountryJobs = countryJobs.filter(job => job.jobId !== jobId);

            // Update the country's job list
            data.linkedInJobsByCountry[country] = updatedCountryJobs;

            // If the country has no more jobs, remove it (except for Archive)
            if (updatedCountryJobs.length === 0 && country !== 'Archive') {
                delete data.linkedInJobsByCountry[country];
            }

            // Update the flat list for backward compatibility
            const updatedAllJobs = Object.values(data.linkedInJobsByCountry).flat();

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: updatedAllJobs,
                countries: Object.keys(data.linkedInJobsByCountry)
            }, () => {
                console.log(`Permanently deleted job ${jobId} from ${country}`);

                // Remove the job element from the DOM if provided
                if (jobElement && jobElement.parentNode) {
                    jobElement.parentNode.removeChild(jobElement);
                }

                // Update the job count in the UI
                updateJobCountDisplay(updatedAllJobs.length);
            });
        });
    }

    // Function to delete multiple jobs
    function deleteMultipleJobs(jobsToDelete) {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) return;

            // Create a set of job IDs to delete for faster lookup
            const jobIdsToDelete = new Set(jobsToDelete.map(job => job.jobId));

            // Create a new object to store the updated jobs by country
            const updatedJobsByCountry = {};

            // For each country, process the jobs to delete
            Object.keys(data.linkedInJobsByCountry).forEach(country => {
                const countryJobs = data.linkedInJobsByCountry[country];

                // Filter out the jobs to delete
                const updatedCountryJobs = countryJobs.filter(job => !jobIdsToDelete.has(job.jobId));

                // Only add the country if it still has jobs or if it's the Archive country
                if (updatedCountryJobs.length > 0 || country === 'Archive') {
                    updatedJobsByCountry[country] = updatedCountryJobs;
                }
            });

            // Update the flat list for backward compatibility
            const updatedAllJobs = Object.values(updatedJobsByCountry).flat();

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: updatedJobsByCountry,
                linkedInJobs: updatedAllJobs,
                countries: Object.keys(updatedJobsByCountry)
            }, () => {
                console.log(`Permanently deleted ${jobsToDelete.length} jobs`);

                // Refresh the job listings display
                renderJobListings(updatedAllJobs);

                // Update the job count in the UI
                updateJobCountDisplay(updatedAllJobs.length);
            });
        });
    }

    // Function to update the job count display
    function updateJobCountDisplay(totalJobCount) {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCountry = countrySelect.value;

        let statusText = `${totalJobCount} jobs`;
        if (selectedCountry && selectedCountry !== 'all') {
            statusText += ` in ${selectedCountry}`;
        }

        if (searchTerm) {
            statusText += ` (filtered by "${searchTerm}")`;
        }

        scrapeInfo.textContent = statusText;
    }

    // Function to open the popup and display job details
    function openJobDetailsPopup(job) {
        console.log('Opening job details popup for:', job);

        // Set basic job details
        document.getElementById('popup-title').textContent = job.title || 'Job Title';
        document.getElementById('popup-company').textContent = job.company || 'Company';
        document.getElementById('popup-location').textContent = job.location || 'Location';

        // Set posting date if available
        if (job.convertedDate && job.convertedDate.formattedDate) {
            let dateText = job.convertedDate.formattedDate;
            // Add the action (Posted/Reposted) if available
            if (job.convertedDate.action) {
                dateText += ` (${job.convertedDate.action})`;
            }
            document.getElementById('popup-posted').textContent = dateText;
        } else {
            document.getElementById('popup-posted').textContent = job.postingDate || 'Not available';
        }

        // Set application count if available
        document.getElementById('popup-applications').textContent = job.applicantCount || 'Not available';

        // Set application URL if available
        const applyUrlElement = document.getElementById('popup-apply-url');
        if (job.applicationUrl) {
            // Create a clickable link
            applyUrlElement.innerHTML = `<a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer">Open Application Page</a>`;
        } else {
            // Check if we have a captured URL for this job in storage
            if (job.jobId) {
                chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
                    const capturedUrls = data.capturedApplicationUrls || {};
                    if (capturedUrls[job.jobId]) {
                        console.log('Found captured URL in storage for job', job.jobId);
                        // Create a clickable link
                        applyUrlElement.innerHTML = `<a href="${capturedUrls[job.jobId]}" target="_blank" rel="noopener noreferrer">Open Application Page</a>`;

                        // Update the job object with the URL
                        job.applicationUrl = capturedUrls[job.jobId];

                        // Update the job in storage
                        updateJobWithDetails(job.jobId, job.country, { applicationUrl: capturedUrls[job.jobId] });
                    } else {
                        applyUrlElement.textContent = 'Not available - Click Apply button to capture';
                    }
                });
            } else {
                applyUrlElement.textContent = 'Not available - Click Apply button to capture';
            }
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
                        if (job.convertedDate && job.convertedDate.formattedDate) {
                            let dateText = job.convertedDate.formattedDate;
                            // Add the action (Posted/Reposted) if available
                            if (job.convertedDate.action) {
                                dateText += ` (${job.convertedDate.action})`;
                            }
                            document.getElementById('popup-posted').textContent = dateText;
                        } else {
                            document.getElementById('popup-posted').textContent = job.postingDate || 'Not available';
                        }
                        document.getElementById('popup-applications').textContent = job.applicantCount || 'Not available';

                        // Update application URL if available
                        const applyUrlElement = document.getElementById('popup-apply-url');
                        if (job.applicationUrl) {
                            // Create a clickable link
                            applyUrlElement.innerHTML = `<a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer">Open Application Page</a>`;
                        } else {
                            // Check if we have a captured URL for this job in storage
                            if (job.jobId) {
                                chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
                                    const capturedUrls = data.capturedApplicationUrls || {};
                                    if (capturedUrls[job.jobId]) {
                                        console.log('Found captured URL in storage for job', job.jobId);
                                        // Create a clickable link
                                        applyUrlElement.innerHTML = `<a href="${capturedUrls[job.jobId]}" target="_blank" rel="noopener noreferrer">Open Application Page</a>`;

                                        // Update the job object with the URL
                                        job.applicationUrl = capturedUrls[job.jobId];

                                        // Update the job in storage
                                        updateJobWithDetails(job.jobId, job.country, { applicationUrl: capturedUrls[job.jobId] });
                                    } else {
                                        applyUrlElement.textContent = 'Not available - Click Apply button to capture';
                                    }
                                });
                            } else {
                                applyUrlElement.textContent = 'Not available - Click Apply button to capture';
                            }
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

            // Format posting date if available
            let postingDateHtml = '';
            if (job.convertedDate && job.convertedDate.formattedDate) {
                postingDateHtml = `<div class="job-posting-date">Posted: ${job.convertedDate.formattedDate}</div>`;
            } else if (job.postingDate) {
                postingDateHtml = `<div class="job-posting-date">Posted: ${job.postingDate}</div>`;
            }

            jobCard.innerHTML = `
                <div class="job-header">
                    <div class="job-title">${job.title}</div>
                    <div class="job-badges">${badges.join('')}</div>
                </div>
                <div class="job-company">${job.company}</div>
                <div class="job-location">${job.location}</div>
                ${postingDateHtml}
                ${insightHtml}
                <div class="job-actions">
                    <a href="javascript:void(0)" class="apply-button view-job-btn" data-job-id="${job.jobId || ''}" data-job-url="${job.jobUrl}" data-job-country="${job.country || ''}">View Job</a>
                    <a href="${job.jobUrl}" target="_blank" class="apply-button" style="margin-left: 5px;">Open in LinkedIn</a>
                    <button class="job-archive-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}">Archive</button>
                    <button class="job-delete-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}">Delete</button>
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

            // Get the archive button we just added
            const archiveJobBtn = jobCard.querySelector('.job-archive-button');

            // Add click event to archive the job
            archiveJobBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const jobId = this.getAttribute('data-job-id');
                const country = this.getAttribute('data-job-country');

                if (!jobId || !country) {
                    alert('Cannot archive job: Need both job ID and country to archive');
                    return;
                }

                // Archive the job immediately without confirmation
                archiveSingleJob(jobId, country, jobCard);
            });

            // Get the delete button we just added
            const deleteJobBtn = jobCard.querySelector('.job-delete-button');

            // Add click event to delete the job
            deleteJobBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const jobId = this.getAttribute('data-job-id');
                const country = this.getAttribute('data-job-country');

                // Delete the job immediately without confirmation
                // Even if jobId or country is missing, we'll handle it in deleteSingleJob
                deleteSingleJob(jobId, country, jobCard);
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