// Function to update the tailoring status for a job
function updateJobTailoringStatus(jobId, country, status, filename = null) {
    if (!jobId || !country) {
        console.error('Cannot update tailoring status: Missing job ID or country');
        return;
    }

    chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
        if (!data.linkedInJobsByCountry || !data.linkedInJobsByCountry[country]) {
            console.error(`Cannot update tailoring status: Country ${country} not found`);
            return;
        }

        // Find the job in the country's job list
        const countryJobs = data.linkedInJobsByCountry[country];
        const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);

        if (jobIndex === -1) {
            console.error(`Cannot update tailoring status: Job ${jobId} not found in ${country}`);
            return;
        }

        // Update the job with tailoring status
        countryJobs[jobIndex].tailoringStatus = status;

        // If a filename is provided, store it
        if (filename) {
            countryJobs[jobIndex].tailoredCvFilename = filename;
        } else if (status === null) {
            // If we're resetting the status, also remove the filename
            delete countryJobs[jobIndex].tailoredCvFilename;
        }

        // Save the updated data
        chrome.storage.local.set({
            linkedInJobsByCountry: data.linkedInJobsByCountry,
            linkedInJobs: Object.values(data.linkedInJobsByCountry).flat() // Update flat list for backward compatibility
        }, () => {
            console.log(`Updated tailoring status for job ${jobId} to ${status || 'reset'}`);

            // Update the UI for this job if it's currently displayed
            updateTailoringStatusUI(jobId, status, filename);
        });
    });
}

// Function to reset the tailoring status for a job
function resetJobTailoringStatus(jobId, country) {
    if (!jobId || !country) {
        console.error('Cannot reset tailoring status: Missing job ID or country');
        return;
    }

    // Update the job with null status to reset it
    updateJobTailoringStatus(jobId, country, null);
}

// Function to update the tailoring status UI for a specific job
function updateTailoringStatusUI(jobId, status, filename = null) {
    // Find the job card for this job ID
    const jobCard = document.querySelector(`.job-card [data-job-id="${jobId}"]`)?.closest('.job-card');
    if (!jobCard) return;

    // Find or create the tailoring status element
    let tailoringStatusEl = jobCard.querySelector('.job-tailoring-status');

    // If status is null (reset) and there's no existing element, nothing to do
    if (status === null && !tailoringStatusEl) return;

    // If status is null (reset) and there is an element, remove it
    if (status === null && tailoringStatusEl) {
        tailoringStatusEl.remove();
        return;
    }

    // Create the element if it doesn't exist
    if (!tailoringStatusEl) {
        tailoringStatusEl = document.createElement('span');
        tailoringStatusEl.className = 'job-tailoring-status';

        // Insert it after the delete button in the job actions div
        const jobActions = jobCard.querySelector('.job-actions');
        if (jobActions) {
            const deleteButton = jobCard.querySelector('.job-delete-button');
            if (deleteButton && deleteButton.nextSibling) {
                jobActions.insertBefore(tailoringStatusEl, deleteButton.nextSibling);
            } else {
                // If delete button not found or it's the last element, append to the end
                jobActions.appendChild(tailoringStatusEl);
            }
        }
    }

    // Update the status display
    switch (status) {
        case 'queued':
            tailoringStatusEl.innerHTML = '<i class="fas fa-hourglass-start"></i> CV Queued <button class="reset-cv-status-btn" data-job-id="' + jobId + '" data-job-country="' + jobCard.querySelector('[data-job-country]').getAttribute('data-job-country') + '" title="Reset CV status"><i class="fas fa-times"></i></button>';
            tailoringStatusEl.className = 'job-tailoring-status queued';
            break;
        case 'processing':
            tailoringStatusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CV Processing <button class="reset-cv-status-btn" data-job-id="' + jobId + '" data-job-country="' + jobCard.querySelector('[data-job-country]').getAttribute('data-job-country') + '" title="Reset CV status"><i class="fas fa-times"></i></button>';
            tailoringStatusEl.className = 'job-tailoring-status processing';
            break;
        case 'completed':
            tailoringStatusEl.innerHTML = `<i class="fas fa-check-circle"></i> CV Ready${filename ? `: ${filename}` : ''} <button class="reset-cv-status-btn" data-job-id="${jobId}" data-job-country="${jobCard.querySelector('[data-job-country]').getAttribute('data-job-country')}" title="Reset CV status"><i class="fas fa-times"></i></button>`;
            tailoringStatusEl.className = 'job-tailoring-status completed';
            break;
        case 'failed':
            tailoringStatusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> CV Failed <button class="reset-cv-status-btn" data-job-id="' + jobId + '" data-job-country="' + jobCard.querySelector('[data-job-country]').getAttribute('data-job-country') + '" title="Reset CV status"><i class="fas fa-times"></i></button>';
            tailoringStatusEl.className = 'job-tailoring-status failed';
            break;
        default:
            tailoringStatusEl.innerHTML = '';
            tailoringStatusEl.className = 'job-tailoring-status';
    }

    // Add event listener for the reset button if it exists
    const resetButton = tailoringStatusEl.querySelector('.reset-cv-status-btn');
    if (resetButton) {
        resetButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling up

            const jobId = this.getAttribute('data-job-id');
            const country = this.getAttribute('data-job-country');

            if (jobId && country) {
                resetJobTailoringStatus(jobId, country);
            }
        });
    }
}

// We no longer need to listen for messages from the background script
// since we're handling tailoring status directly in the job objects

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

    // Add event listener for the tailor CV button
    const tailorCvButton = document.getElementById('tailor-cv-button');
    let currentJobForTailoring = null;

    tailorCvButton.addEventListener('click', () => {
        if (currentJobForTailoring && currentJobForTailoring.description) {
            tailorCV(currentJobForTailoring.description);
        } else {
            document.getElementById('tailor-cv-status').textContent = 'No job description available for tailoring';
        }
    });

    // Load job listings from storage
    loadJobListings();

    // Add event listeners
    searchInput.addEventListener('input', filterJobListings);

    // Easy Apply filter removed

    // Add event listener for Applied filter
    const appliedFilter = document.getElementById('filter-applied');
    if (appliedFilter) {
        // Default is unchecked (only show non-applied jobs)
        appliedFilter.checked = false;
        appliedFilter.addEventListener('change', filterJobListings);
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
                    // If 'all' is selected, combine all countries except Archive
                    Object.entries(data.linkedInJobsByCountry).forEach(([country, countryJobs]) => {
                        if (country !== 'Archive') {
                            allJobs = allJobs.concat(countryJobs);
                        }
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

            // By default, show only non-applied jobs
            // If "Show Applied Jobs" is checked, include all jobs
            const showAppliedJobs = document.getElementById('filter-applied')?.checked;
            const appliedFilteredJobs = showAppliedJobs ?
                filteredJobs :
                filteredJobs.filter(job => !job.isApplied);

            callback(appliedFilteredJobs);
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
        // Save the currently selected country
        const currentSelectedCountry = countrySelect.value;

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

            // Restore the previously selected country if it still exists in the dropdown
            if (currentSelectedCountry) {
                // Check if the previously selected country still exists in the dropdown
                const optionExists = Array.from(countrySelect.options).some(option => option.value === currentSelectedCountry);
                if (optionExists) {
                    countrySelect.value = currentSelectedCountry;
                }
                // If the country no longer exists, it will default to 'All Countries'
            }
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

            let jobs = [];
            let totalJobCount = 0;

            // Use the new format if available, otherwise fall back to the old format
            if (data.linkedInJobsByCountry && Object.keys(data.linkedInJobsByCountry).length > 0) {
                // Filter out Archive jobs for initial load (consistent with 'All Countries' filter)
                Object.entries(data.linkedInJobsByCountry).forEach(([country, countryJobs]) => {
                    if (country !== 'Archive') {
                        jobs = jobs.concat(countryJobs);
                        totalJobCount += countryJobs.length;
                    }
                });
            } else if (data.linkedInJobs) {
                // Fall back to old format
                jobs = data.linkedInJobs;
                totalJobCount = jobs.length;
            }

            // Display job count
            scrapeInfo.textContent = `Showing ${totalJobCount} jobs (all countries except Archive)`;

            // Render job listings
            renderJobListings(jobs);

            // Populate country dropdown if we have country data
            if (data.countries && data.countries.length > 0) {
                populateCountryDropdown();
            }

            // Call filterJobListings to ensure consistent behavior
            filterJobListings();
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

    // Function to unarchive a single job (move from Archive back to original country)
    function unarchiveSingleJob(jobId, originalCountry, jobElement) {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry || !data.linkedInJobsByCountry['Archive']) return;

            // Find the job in the Archive country
            const archiveJobs = data.linkedInJobsByCountry['Archive'];
            const jobToUnarchive = archiveJobs.find(job => job.jobId === jobId);

            if (!jobToUnarchive) return;

            // Determine the target country (use original country if available, otherwise 'Unknown')
            const targetCountry = originalCountry && originalCountry !== 'undefined' ? originalCountry : 'Unknown';

            // Create a copy of the job with updated country
            const unarchivedJob = {
                // Keep only the basic job information
                jobId: jobToUnarchive.jobId,
                title: jobToUnarchive.title,
                company: jobToUnarchive.company,
                location: jobToUnarchive.location,
                jobUrl: jobToUnarchive.jobUrl,
                isEasyApply: jobToUnarchive.isEasyApply,
                isPromoted: jobToUnarchive.isPromoted,
                postingDate: jobToUnarchive.postingDate,
                applicationInsight: jobToUnarchive.applicationInsight,
                applyButtonType: jobToUnarchive.applyButtonType,
                applicationUrl: jobToUnarchive.applicationUrl,
                isPinned: jobToUnarchive.isPinned, // Preserve pinned status

                // Set country back to original
                country: targetCountry,
                unarchivedAt: new Date().toISOString(),
                wasArchived: true,

                // Reset scraped details flags
                detailsScraped: false,
                isScrapingDetails: false
            };

            // Initialize target country if it doesn't exist
            if (!data.linkedInJobsByCountry[targetCountry]) {
                data.linkedInJobsByCountry[targetCountry] = [];
            }

            // Add the job to the target country
            data.linkedInJobsByCountry[targetCountry].push(unarchivedJob);

            // Filter out the job from Archive
            const updatedArchiveJobs = archiveJobs.filter(job => job.jobId !== jobId);
            data.linkedInJobsByCountry['Archive'] = updatedArchiveJobs;

            // Update the flat list for backward compatibility
            const updatedAllJobs = Object.values(data.linkedInJobsByCountry).flat();

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: updatedAllJobs,
                countries: Object.keys(data.linkedInJobsByCountry)
            }, () => {
                console.log(`Unarchived job ${jobId} from Archive to ${targetCountry}`);

                // Remove the job element from the DOM if provided
                if (jobElement && jobElement.parentNode) {
                    jobElement.parentNode.removeChild(jobElement);
                }

                // Update the job count in the UI
                updateJobCountDisplay(updatedAllJobs.length);

                // Update the country dropdown with new job counts
                populateCountryDropdown();
            });
        });
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

            // Create a copy of the job with updated country and reset scraped details
            const archivedJob = {
                // Keep only the basic job information
                jobId: jobToArchive.jobId,
                title: jobToArchive.title,
                company: jobToArchive.company,
                location: jobToArchive.location,
                jobUrl: jobToArchive.jobUrl,
                isEasyApply: jobToArchive.isEasyApply,
                isPromoted: jobToArchive.isPromoted,
                postingDate: jobToArchive.postingDate,
                applicationInsight: jobToArchive.applicationInsight,
                applyButtonType: jobToArchive.applyButtonType,
                applicationUrl: jobToArchive.applicationUrl, // Preserve application URL if it exists
                isPinned: jobToArchive.isPinned, // Preserve pinned status

                // Set archive-specific fields
                country: 'Archive',
                archivedAt: new Date().toISOString(),
                originalCountry: country,

                // Reset scraped details flags
                detailsScraped: false,
                isScrapingDetails: false

                // Note: All other fields like description, skills, convertedDate, etc. will be omitted
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
                console.log(`Archived job ${jobId} from ${country} to Archive with reset details`);

                // Remove the job element from the DOM if provided
                if (jobElement && jobElement.parentNode) {
                    jobElement.parentNode.removeChild(jobElement);
                }

                // Update the job count in the UI
                updateJobCountDisplay(updatedAllJobs.length);

                // Update the country dropdown with new job counts
                populateCountryDropdown();
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

                // Update the country dropdown with new job counts
                populateCountryDropdown();
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

                // Update the country dropdown with new job counts
                populateCountryDropdown();
            });
        });
    }

    // Function to update the job count display
    function updateJobCountDisplay(totalJobCount) {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCountry = countrySelect.value;
        const showAppliedJobs = document.getElementById('filter-applied')?.checked;

        let statusText = `${totalJobCount} jobs`;
        if (selectedCountry && selectedCountry !== 'all') {
            statusText += ` in ${selectedCountry}`;
        }

        if (!showAppliedJobs) {
            statusText += " (not applied)";
        }

        if (searchTerm) {
            statusText += ` (filtered by "${searchTerm}")`;
        }

        scrapeInfo.textContent = statusText;
    }

    // Function to tailor CV with job description
    function tailorCV(jobDescription) {
        console.log('Tailoring CV with job description');

        // Make sure we have the current job for tailoring
        if (!currentJobForTailoring || !currentJobForTailoring.jobId || !currentJobForTailoring.country) {
            console.error('Cannot tailor CV: Missing job information');
            return;
        }

        const jobId = currentJobForTailoring.jobId;
        const country = currentJobForTailoring.country;

        // Get the tailor button and status elements
        const tailorButton = document.getElementById('tailor-cv-button');
        const tailorStatus = document.getElementById('tailor-cv-status');

        // Disable the button and show loading status
        tailorButton.disabled = true;
        tailorStatus.textContent = 'Tailoring CV...';

        // Update the job status to queued
        updateJobTailoringStatus(jobId, country, 'queued');

        // Send the job description to the tailor server
        fetch('http://localhost:5000/tailor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job_description: jobDescription
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            // Parse the JSON response
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.success) {
                // Update status with success message
                tailorStatus.textContent = data.message || 'CV tailoring request has been queued';

                // Store the request ID if provided
                if (data.request_id) {
                    console.log('Tailor request ID:', data.request_id);

                    // Store the request ID with the job
                    chrome.storage.local.get(['linkedInJobsByCountry'], (storageData) => {
                        if (!storageData.linkedInJobsByCountry || !storageData.linkedInJobsByCountry[country]) return;

                        const countryJobs = storageData.linkedInJobsByCountry[country];
                        const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);

                        if (jobIndex === -1) return;

                        // Update the job with the request ID
                        countryJobs[jobIndex].tailorRequestId = data.request_id;

                        // Save the updated data
                        chrome.storage.local.set({
                            linkedInJobsByCountry: storageData.linkedInJobsByCountry,
                            linkedInJobs: Object.values(storageData.linkedInJobsByCountry).flat()
                        });
                    });

                    // Start polling for status updates
                    startPollingTailorStatus(jobId, country, data.request_id);
                }

                // Re-enable the button after a delay
                setTimeout(() => {
                    tailorButton.disabled = false;
                }, 3000);
            } else {
                // Handle unexpected response format
                throw new Error('Unexpected response from server');
            }
        })
        .catch(error => {
            console.error('Error tailoring CV:', error);
            tailorStatus.textContent = `Error: ${error.message}`;

            // Update the job status to failed
            updateJobTailoringStatus(jobId, country, 'failed');

            // Re-enable the button
            tailorButton.disabled = false;
        });
    }

    // Function to start polling for tailor status updates
    function startPollingTailorStatus(jobId, country, requestId) {
        // Store the interval ID so we can clear it later
        const intervalId = setInterval(() => {
            // Check the status of the request
            fetch(`http://localhost:5000/status/${requestId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Server responded with status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (!data || !data.status) {
                        throw new Error('Invalid response from server');
                    }

                    const status = data.status.status;
                    console.log(`Tailor status for job ${jobId}, request ${requestId}: ${status}`);

                    // Update the job status
                    if (status === 'processing') {
                        updateJobTailoringStatus(jobId, country, 'processing');
                    } else if (status === 'completed') {
                        // Get the filename
                        const filename = data.status.filename || null;

                        // Update the job status to completed
                        updateJobTailoringStatus(jobId, country, 'completed', filename);

                        // Clear the interval since we're done
                        clearInterval(intervalId);
                    } else if (status === 'failed') {
                        // Update the job status to failed
                        updateJobTailoringStatus(jobId, country, 'failed');

                        // Clear the interval since we're done
                        clearInterval(intervalId);
                    }
                })
                .catch(error => {
                    console.error(`Error checking tailor status for job ${jobId}:`, error);

                    // Don't clear the interval, we'll try again
                });
        }, 5000); // Check every 5 seconds

        // Store the interval ID with the job so we can clear it if needed
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry || !data.linkedInJobsByCountry[country]) return;

            const countryJobs = data.linkedInJobsByCountry[country];
            const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);

            if (jobIndex === -1) return;

            // We can't store the interval ID directly, but we can store a flag
            countryJobs[jobIndex].isPollingTailorStatus = true;

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: Object.values(data.linkedInJobsByCountry).flat()
            });
        });
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

        // Set job type information if available
        document.getElementById('popup-job-type').textContent = job.jobTypeInfo || 'Not available';

        // Set application URL if available
        const applyUrlElement = document.getElementById('popup-apply-url');

        // Handle different apply button types
        if (job.noLongerAccepting) {
            // Case 1: No longer accepting applications
            applyUrlElement.textContent = 'No longer accepting applications';
        } else if (job.applyButtonType === 'easy_apply') {
            // Case 2: LinkedIn Easy Apply
            if (job.applicationUrl) {
                applyUrlElement.innerHTML = `<a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer">Apply on LinkedIn</a>`;
            } else if (job.jobId) {
                // Construct a LinkedIn apply URL
                const linkedInApplyUrl = `https://www.linkedin.com/jobs/view/${job.jobId}/apply/`;
                applyUrlElement.innerHTML = `<a href="${linkedInApplyUrl}" target="_blank" rel="noopener noreferrer">Apply on LinkedIn</a>`;

                // Update the job object with the URL
                job.applicationUrl = linkedInApplyUrl;

                // Update the job in storage
                updateJobWithDetails(job.jobId, job.country, { applicationUrl: linkedInApplyUrl });
            } else {
                applyUrlElement.textContent = 'LinkedIn Easy Apply (URL not available)';
            }
        } else if (job.applyButtonType === 'company_site') {
            // Case 3: Apply on company site
            // Just use the LinkedIn job posting URL for now
            const linkedInJobUrl = job.applicationUrl || job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
            if (linkedInJobUrl) {
                applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">View on LinkedIn</a>`;
            } else {
                applyUrlElement.textContent = 'LinkedIn job URL not available';
            }

            /* Commented out as per user request - code to handle apply button URL capture
            // For company site applications, we'll open the job in LinkedIn and click the apply button
            // We don't try to capture the URL - just let the browser handle it
            const linkedInJobUrl = job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
            if (linkedInJobUrl) {
                applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">Apply on company site</a>`;
            } else {
                applyUrlElement.textContent = 'Apply on company site (URL not available)';
            }
            */
        } else if (job.applicationUrl) {
            // General case with URL available
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
                        // Use the LinkedIn job posting URL instead
                        const linkedInJobUrl = job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
                        if (linkedInJobUrl) {
                            applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">View on LinkedIn</a>`;

                            // Update the job object with the URL
                            job.applicationUrl = linkedInJobUrl;

                            // Update the job in storage
                            updateJobWithDetails(job.jobId, job.country, { applicationUrl: linkedInJobUrl });
                        } else {
                            applyUrlElement.textContent = 'LinkedIn job URL not available';
                        }
                    }
                });
            } else {
                // Use the LinkedIn job posting URL instead
                const linkedInJobUrl = job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
                if (linkedInJobUrl) {
                    applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">View on LinkedIn</a>`;

                    // Update the job object with the URL
                    job.applicationUrl = linkedInJobUrl;
                } else {
                    applyUrlElement.textContent = 'LinkedIn job URL not available';
                }
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
            // If we don't have the description yet, try to scrape it now (but not for archived jobs)
            if (job.country === 'Archive') {
                descriptionContainer.innerHTML = '<div>This job is archived. Additional details are not available for archived jobs.</div>';
            } else if (!job.detailsScraped && !job.isScrapingDetails && job.jobId && job.jobUrl) {
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

                            // Enable the tailor CV button since we now have a job description
                            const tailorCvButton = document.getElementById('tailor-cv-button');
                            tailorCvButton.disabled = false;
                            document.getElementById('tailor-cv-status').textContent = '';
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

                        // Update job type information if available
                        document.getElementById('popup-job-type').textContent = job.jobTypeInfo || 'Not available';

                        // Update application URL if available
                        const applyUrlElement = document.getElementById('popup-apply-url');

                        // Handle different apply button types
                        if (job.noLongerAccepting) {
                            // Case 1: No longer accepting applications
                            applyUrlElement.textContent = 'No longer accepting applications';
                        } else if (job.applyButtonType === 'easy_apply') {
                            // Case 2: LinkedIn Easy Apply
                            if (job.applicationUrl) {
                                applyUrlElement.innerHTML = `<a href="${job.applicationUrl}" target="_blank" rel="noopener noreferrer">Apply on LinkedIn</a>`;
                            } else if (job.jobId) {
                                // Construct a LinkedIn apply URL
                                const linkedInApplyUrl = `https://www.linkedin.com/jobs/view/${job.jobId}/apply/`;
                                applyUrlElement.innerHTML = `<a href="${linkedInApplyUrl}" target="_blank" rel="noopener noreferrer">Apply on LinkedIn</a>`;

                                // Update the job object with the URL
                                job.applicationUrl = linkedInApplyUrl;

                                // Update the job in storage
                                updateJobWithDetails(job.jobId, job.country, { applicationUrl: linkedInApplyUrl });
                            } else {
                                applyUrlElement.textContent = 'LinkedIn Easy Apply (URL not available)';
                            }
                        } else if (job.applyButtonType === 'company_site') {
                            // Case 3: Apply on company site
                            // Just use the LinkedIn job posting URL for now
                            const linkedInJobUrl = job.applicationUrl || job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
                            if (linkedInJobUrl) {
                                applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">View on LinkedIn</a>`;
                            } else {
                                applyUrlElement.textContent = 'LinkedIn job URL not available';
                            }

                            /* Commented out as per user request - code to handle apply button URL capture
                            // For company site applications, we'll open the job in LinkedIn and click the apply button
                            // We don't try to capture the URL - just let the browser handle it
                            const linkedInJobUrl = job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
                            if (linkedInJobUrl) {
                                applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">Apply on company site</a>`;
                            } else {
                                applyUrlElement.textContent = 'Apply on company site (URL not available)';
                            }
                            */
                        } else if (job.applicationUrl) {
                            // General case with URL available
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
                                        // Use the LinkedIn job posting URL instead
                                        const linkedInJobUrl = job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
                                        if (linkedInJobUrl) {
                                            applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">View on LinkedIn</a>`;

                                            // Update the job object with the URL
                                            job.applicationUrl = linkedInJobUrl;

                                            // Update the job in storage
                                            updateJobWithDetails(job.jobId, job.country, { applicationUrl: linkedInJobUrl });
                                        } else {
                                            applyUrlElement.textContent = 'LinkedIn job URL not available';
                                        }
                                    }
                                });
                            } else {
                                // Use the LinkedIn job posting URL instead
                                const linkedInJobUrl = job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : null);
                                if (linkedInJobUrl) {
                                    applyUrlElement.innerHTML = `<a href="${linkedInJobUrl}" target="_blank" rel="noopener noreferrer">View on LinkedIn</a>`;

                                    // Update the job object with the URL
                                    job.applicationUrl = linkedInJobUrl;
                                } else {
                                    applyUrlElement.textContent = 'LinkedIn job URL not available';
                                }
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

        // Set the current job for tailoring
        currentJobForTailoring = job;

        // Reset the tailor CV status
        const tailorCvStatus = document.getElementById('tailor-cv-status');
        tailorCvStatus.textContent = '';

        // Update the tailor CV status based on the job's tailoring status
        if (job.tailoringStatus) {
            switch (job.tailoringStatus) {
                case 'queued':
                    tailorCvStatus.innerHTML = '<i class="fas fa-hourglass-start"></i> CV Queued <button id="reset-cv-status-popup-btn" class="reset-cv-status-popup-btn" title="Reset CV status"><i class="fas fa-times"></i> Reset</button>';
                    tailorCvStatus.className = 'status-queued';
                    break;
                case 'processing':
                    tailorCvStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CV Processing <button id="reset-cv-status-popup-btn" class="reset-cv-status-popup-btn" title="Reset CV status"><i class="fas fa-times"></i> Reset</button>';
                    tailorCvStatus.className = 'status-processing';
                    break;
                case 'completed':
                    tailorCvStatus.innerHTML = `<i class="fas fa-check-circle"></i> CV Ready${job.tailoredCvFilename ? `: ${job.tailoredCvFilename}` : ''} <button id="reset-cv-status-popup-btn" class="reset-cv-status-popup-btn" title="Reset CV status"><i class="fas fa-times"></i> Reset</button>`;
                    tailorCvStatus.className = 'status-completed';
                    break;
                case 'failed':
                    tailorCvStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i> CV Failed <button id="reset-cv-status-popup-btn" class="reset-cv-status-popup-btn" title="Reset CV status"><i class="fas fa-times"></i> Reset</button>';
                    tailorCvStatus.className = 'status-failed';
                    break;
            }

            // Add event listener for the reset button in the popup
            const resetButton = document.getElementById('reset-cv-status-popup-btn');
            if (resetButton) {
                resetButton.addEventListener('click', function(e) {
                    e.preventDefault();

                    if (job.jobId && job.country) {
                        resetJobTailoringStatus(job.jobId, job.country);

                        // Update the current job object
                        delete job.tailoringStatus;
                        delete job.tailoredCvFilename;

                        // Update the popup status
                        tailorCvStatus.innerHTML = '';
                        tailorCvStatus.className = '';

                        // Re-enable the tailor button if we have a description
                        if (job.description) {
                            tailorCvButton.disabled = false;
                        }
                    }
                });
            }
        }

        // Enable or disable the tailor CV button based on whether we have a job description
        // and whether a tailoring process is already in progress
        const tailorCvButton = document.getElementById('tailor-cv-button');
        if (!job.description) {
            tailorCvButton.disabled = true;
            if (!job.tailoringStatus) {
                tailorCvStatus.textContent = 'No job description available for tailoring';
            }
        } else if (job.tailoringStatus === 'queued' || job.tailoringStatus === 'processing') {
            // Disable the button if tailoring is in progress
            tailorCvButton.disabled = true;
        } else {
            tailorCvButton.disabled = false;
        }

        // Show the popup
        popupOverlay.classList.add('active');
        jobDetailsPopup.classList.add('active');
    }

    // Function to scrape job details from LinkedIn using a hidden tab
    async function scrapeJobDetails(jobUrl, jobId, country) {
        return new Promise((resolve, reject) => {
            console.log(`Starting to scrape details for job ${jobId} at ${jobUrl}`);

            // Get the job data from storage to pass to the scraper
            chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
                if (!data.linkedInJobsByCountry || !data.linkedInJobsByCountry[country]) {
                    console.log('No job data found in storage for country:', country);
                    sendScrapeRequest(null);
                    return;
                }

                const jobData = data.linkedInJobsByCountry[country].find(job => job.jobId === jobId);
                console.log('Found job data in storage:', jobData);
                sendScrapeRequest(jobData);
            });

            function sendScrapeRequest(jobData) {
                // Send message to background script to create a hidden tab and scrape the job details
                chrome.runtime.sendMessage({
                    action: "scrapeJobDetails",
                    jobUrl: jobUrl,
                    jobId: jobId,
                    country: country,
                    jobData: jobData
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
            }

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

        // Sort jobs to put pinned jobs at the top
        const sortedJobs = [...jobs].sort((a, b) => {
            // First sort by pinned status (pinned jobs first)
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });

        sortedJobs.forEach(job => {
            const jobCard = document.createElement('div');
            jobCard.className = job.isPinned ? 'job-card pinned' : 'job-card';

            // Create badges for Easy Apply, Promoted, Pinned, and Applied
            const badges = [];
            if (job.isPinned) {
                badges.push('<span class="job-badge pinned">Pinned</span>');
            }
            if (job.isEasyApply) {
                badges.push('<span class="job-badge easy-apply">Easy Apply</span>');
            }
            if (job.isPromoted) {
                badges.push('<span class="job-badge promoted">Promoted</span>');
            }
            if (job.isApplied) {
                badges.push('<span class="job-badge applied">Applied</span>');
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
                ${job.isPinned ?
                    `<button class="job-pin-button job-pin-corner job-unpin-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" title="Unpin this job"><i class="fas fa-thumbtack fa-rotate-90"></i></button>` :
                    `<button class="job-pin-button job-pin-corner" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" title="Pin this job to top"><i class="fas fa-thumbtack"></i></button>`
                }
                <div class="job-actions">
                    <a href="javascript:void(0)" class="apply-button view-job-btn" data-job-id="${job.jobId || ''}" data-job-url="${job.jobUrl}" data-job-country="${job.country || ''}" title="View job details"><i class="fas fa-eye"></i> View</a>
                    <a href="${job.jobUrl || (job.jobId ? `https://www.linkedin.com/jobs/view/${job.jobId}/` : '#')}" target="_blank" class="apply-button linkedin-btn" title="Open LinkedIn job page"><i class="fab fa-linkedin"></i> LinkedIn</a>
                    ${job.country === 'Archive' ?
                        `<button class="job-unarchive-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" data-original-country="${job.originalCountry || 'Unknown'}" title="Unarchive this job"><i class="fas fa-box-open"></i></button>` :
                        `<button class="job-archive-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" title="Archive this job"><i class="fas fa-archive"></i></button>`
                    }
                    ${job.isApplied ?
                        `<button class="job-unapplied-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" title="Mark as not applied"><i class="fas fa-check-circle"></i></button>` :
                        `<button class="job-applied-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" title="Mark as applied"><i class="fas fa-check"></i></button>`
                    }
                    <button class="job-delete-button" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" title="Delete this job permanently"><i class="fas fa-trash-alt"></i></button>
                    ${job.tailoringStatus ?
                        `<span class="job-tailoring-status ${job.tailoringStatus}">
                            ${job.tailoringStatus === 'queued' ? '<i class="fas fa-hourglass-start"></i> CV Queued' :
                              job.tailoringStatus === 'processing' ? '<i class="fas fa-spinner fa-spin"></i> CV Processing' :
                              job.tailoringStatus === 'completed' ? `<i class="fas fa-check-circle"></i> CV Ready${job.tailoredCvFilename ? `: ${job.tailoredCvFilename}` : ''}` :
                              job.tailoringStatus === 'failed' ? '<i class="fas fa-exclamation-circle"></i> CV Failed' : ''}
                            <button class="reset-cv-status-btn" data-job-id="${job.jobId || ''}" data-job-country="${job.country || ''}" title="Reset CV status"><i class="fas fa-times"></i></button>
                        </span>` : ''
                    }
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

                // Only scrape if we haven't already, we're not currently scraping, and the job is not archived
                if (!job.detailsScraped && !job.isScrapingDetails && jobId && jobUrl && job.country !== 'Archive') {
                    // Mark that we're starting to scrape
                    job.isScrapingDetails = true;

                    // Show loading indicator
                    this.classList.add('loading');
                    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

                    console.log(`Hovering over job ${jobId}, scraping details...`);

                    // Scrape job details
                    scrapeJobDetails(jobUrl, jobId, country).then(jobDetails => {
                        // Remove loading indicator
                        this.classList.remove('loading');
                        this.innerHTML = '<i class="fas fa-eye"></i> View';

                        // Reset scraping flag
                        job.isScrapingDetails = false;

                        if (jobDetails) {
                            console.log('Job listings - received job details:', jobDetails);
                            console.log('Job listings - isEasyApply from jobDetails:', jobDetails.isEasyApply);

                            // Update the job with the scraped details
                            updateJobWithDetails(jobId, country, jobDetails);

                            // Update the current job object for immediate use
                            Object.assign(job, jobDetails, { detailsScraped: true });
                            console.log('Job listings - job after update:', job);

                            // Add the details badge to the job card
                            const jobCard = this.closest('.job-card');
                            const badgesContainer = jobCard.querySelector('.job-badges');

                            // Add Details Available badge if not already present
                            if (badgesContainer && !jobCard.querySelector('.job-badge.details')) {
                                const detailsBadge = document.createElement('span');
                                detailsBadge.className = 'job-badge details';
                                detailsBadge.textContent = 'Details Available';
                                badgesContainer.appendChild(detailsBadge);
                            }

                            // Add Easy Apply badge if the job is detected as Easy Apply and badge not already present
                            console.log('Checking if Easy Apply badge should be added:',
                                'jobDetails =', jobDetails,
                                'jobDetails.isEasyApply =', jobDetails.isEasyApply,
                                'badgesContainer exists =', !!badgesContainer,
                                'badge already exists =', !!jobCard.querySelector('.job-badge.easy-apply'));

                            if (jobDetails.isEasyApply === true && badgesContainer && !jobCard.querySelector('.job-badge.easy-apply')) {
                                console.log('Adding Easy Apply badge to job card');
                                const easyApplyBadge = document.createElement('span');
                                easyApplyBadge.className = 'job-badge easy-apply';
                                easyApplyBadge.textContent = 'Easy Apply';
                                badgesContainer.appendChild(easyApplyBadge);

                                // Also update the job object's isEasyApply property
                                job.isEasyApply = true;
                                console.log('Updated job.isEasyApply to true');
                            } else {
                                console.log('Not adding Easy Apply badge. Conditions not met.');
                            }
                        }
                    }).catch(error => {
                        console.error(`Error scraping details for job ${jobId}:`, error);

                        // Remove loading indicator
                        this.classList.remove('loading');
                        this.innerHTML = '<i class="fas fa-eye"></i> View';

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

            // Get the archive button if it exists
            const archiveJobBtn = jobCard.querySelector('.job-archive-button');
            if (archiveJobBtn) {
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
            }

            // Get the unarchive button if it exists
            const unarchiveJobBtn = jobCard.querySelector('.job-unarchive-button');
            if (unarchiveJobBtn) {
                // Add click event to unarchive the job
                unarchiveJobBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const jobId = this.getAttribute('data-job-id');
                    const country = this.getAttribute('data-job-country');
                    const originalCountry = this.getAttribute('data-original-country');

                    if (!jobId || country !== 'Archive') {
                        alert('Cannot unarchive job: Invalid job ID or job is not archived');
                        return;
                    }

                    // Unarchive the job immediately without confirmation
                    unarchiveSingleJob(jobId, originalCountry, jobCard);
                });
            }

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

            // Get the reset CV status button if it exists
            const resetCvStatusBtn = jobCard.querySelector('.reset-cv-status-btn');
            if (resetCvStatusBtn) {
                // Add click event to reset the CV status
                resetCvStatusBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation(); // Prevent event from bubbling up

                    const jobId = this.getAttribute('data-job-id');
                    const country = this.getAttribute('data-job-country');

                    if (jobId && country) {
                        resetJobTailoringStatus(jobId, country);
                    }
                });
            }

            // Get the applied button if it exists
            const appliedJobBtn = jobCard.querySelector('.job-applied-button');
            if (appliedJobBtn) {
                // Add click event to mark the job as applied
                appliedJobBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const jobId = this.getAttribute('data-job-id');
                    const country = this.getAttribute('data-job-country');

                    if (!jobId || !country) {
                        alert('Cannot mark job as applied: Need both job ID and country');
                        return;
                    }

                    // Mark the job as applied
                    markJobAsApplied(jobId, country, jobCard);
                });
            }

            // Get the unapplied button if it exists
            const unappliedJobBtn = jobCard.querySelector('.job-unapplied-button');
            if (unappliedJobBtn) {
                // Add click event to mark the job as not applied
                unappliedJobBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const jobId = this.getAttribute('data-job-id');
                    const country = this.getAttribute('data-job-country');

                    if (!jobId || !country) {
                        alert('Cannot mark job as not applied: Need both job ID and country');
                        return;
                    }

                    // Mark the job as not applied
                    markJobAsUnapplied(jobId, country, jobCard);
                });
            }

            // Get the pin button (either in corner or in actions)
            const pinJobBtn = jobCard.querySelector('.job-pin-button');
            if (pinJobBtn) {
                // Add click event to pin the job
                pinJobBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const jobId = this.getAttribute('data-job-id');
                    const country = this.getAttribute('data-job-country');

                    if (!jobId || !country) {
                        alert('Cannot pin job: Need both job ID and country');
                        return;
                    }

                    // Pin the job
                    pinJob(jobId, country);
                });
            }

            // Get the unpin button (either in corner or in actions)
            const unpinJobBtn = jobCard.querySelector('.job-unpin-button');
            if (unpinJobBtn) {
                // Add click event to unpin the job
                unpinJobBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const jobId = this.getAttribute('data-job-id');
                    const country = this.getAttribute('data-job-country');

                    if (!jobId || !country) {
                        alert('Cannot unpin job: Need both job ID and country');
                        return;
                    }

                    // Unpin the job
                    unpinJob(jobId, country);
                });
            }
        });
    }

    // Function to pin a job
    function pinJob(jobId, country) {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) return;

            // Find the job in the country's job list
            const countryJobs = data.linkedInJobsByCountry[country];
            if (!countryJobs) return;

            // Find the job to pin
            const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);
            if (jobIndex === -1) return;

            // Update the job with isPinned flag
            countryJobs[jobIndex].isPinned = true;

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: Object.values(data.linkedInJobsByCountry).flat() // Update flat list for backward compatibility
            }, () => {
                console.log(`Pinned job ${jobId}`);

                // Refresh the job listings to show the pinned job at the top
                filterJobListings();
            });
        });
    }

    // Function to unpin a job
    function unpinJob(jobId, country) {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) return;

            // Find the job in the country's job list
            const countryJobs = data.linkedInJobsByCountry[country];
            if (!countryJobs) return;

            // Find the job to unpin
            const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);
            if (jobIndex === -1) return;

            // Update the job to remove isPinned flag
            countryJobs[jobIndex].isPinned = false;

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: Object.values(data.linkedInJobsByCountry).flat() // Update flat list for backward compatibility
            }, () => {
                console.log(`Unpinned job ${jobId}`);

                // Refresh the job listings
                filterJobListings();
            });
        });
    }

    // Function to mark a job as applied
    function markJobAsApplied(jobId, country, jobElement) {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) return;

            // Find the job in storage
            const countryJobs = data.linkedInJobsByCountry[country];
            if (!countryJobs) return;

            const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);
            if (jobIndex === -1) return;

            // Update the job to mark as applied
            countryJobs[jobIndex].isApplied = true;
            countryJobs[jobIndex].appliedAt = new Date().toISOString();

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: Object.values(data.linkedInJobsByCountry).flat() // Update flat list for backward compatibility
            }, () => {
                console.log(`Marked job ${jobId} as applied`);

                // Check if we should show applied jobs
                const showAppliedJobs = document.getElementById('filter-applied')?.checked;

                // If we have a job element, update it without refreshing the whole list
                if (jobElement) {
                    if (!showAppliedJobs) {
                        // If we're not showing applied jobs, remove the job card from view
                        if (jobElement.parentNode) {
                            // Add a fade-out animation
                            jobElement.classList.add('fade-out');

                            // Remove the element after animation completes
                            setTimeout(() => {
                                if (jobElement.parentNode) {
                                    jobElement.parentNode.removeChild(jobElement);

                                    // Update the job count in the UI
                                    const totalJobs = document.querySelectorAll('.job-card').length;
                                    updateJobCountDisplay(totalJobs);
                                }
                            }, 300); // Match this to the CSS animation duration
                        }
                    } else {
                        // Replace the applied button with unapplied button
                        const appliedBtn = jobElement.querySelector('.job-applied-button');
                        if (appliedBtn) {
                            const unappliedBtn = document.createElement('button');
                            unappliedBtn.className = 'job-unapplied-button';
                            unappliedBtn.setAttribute('data-job-id', jobId);
                            unappliedBtn.setAttribute('data-job-country', country);
                            unappliedBtn.setAttribute('title', 'Mark as not applied');
                            unappliedBtn.innerHTML = '<i class="fas fa-check-circle"></i>';

                            // Add click event to the new button
                            unappliedBtn.addEventListener('click', function(e) {
                                e.preventDefault();
                                const jobId = this.getAttribute('data-job-id');
                                const country = this.getAttribute('data-job-country');
                                markJobAsUnapplied(jobId, country, jobElement);
                            });

                            // Replace the button
                            appliedBtn.parentNode.replaceChild(unappliedBtn, appliedBtn);
                        }

                        // Add the applied badge if not already present
                        const badgesContainer = jobElement.querySelector('.job-badges');
                        if (badgesContainer && !jobElement.querySelector('.job-badge.applied')) {
                            const appliedBadge = document.createElement('span');
                            appliedBadge.className = 'job-badge applied';
                            appliedBadge.textContent = 'Applied';
                            badgesContainer.appendChild(appliedBadge);
                        }
                    }
                } else {
                    // Refresh the job listings if no element provided
                    filterJobListings();
                }
            });
        });
    }

    // Function to mark a job as not applied
    function markJobAsUnapplied(jobId, country, jobElement) {
        chrome.storage.local.get(['linkedInJobsByCountry'], (data) => {
            if (!data.linkedInJobsByCountry) return;

            // Find the job in storage
            const countryJobs = data.linkedInJobsByCountry[country];
            if (!countryJobs) return;

            const jobIndex = countryJobs.findIndex(job => job.jobId === jobId);
            if (jobIndex === -1) return;

            // Update the job to mark as not applied
            countryJobs[jobIndex].isApplied = false;
            delete countryJobs[jobIndex].appliedAt;

            // Save the updated data
            chrome.storage.local.set({
                linkedInJobsByCountry: data.linkedInJobsByCountry,
                linkedInJobs: Object.values(data.linkedInJobsByCountry).flat() // Update flat list for backward compatibility
            }, () => {
                console.log(`Marked job ${jobId} as not applied`);

                // If we have a job element, update it without refreshing the whole list
                if (jobElement) {
                    // Add a visual highlight effect to indicate the job is now unapplied
                    jobElement.classList.add('highlight-effect');
                    setTimeout(() => {
                        jobElement.classList.remove('highlight-effect');
                    }, 500);

                    // Replace the unapplied button with applied button
                    const unappliedBtn = jobElement.querySelector('.job-unapplied-button');
                    if (unappliedBtn) {
                        const appliedBtn = document.createElement('button');
                        appliedBtn.className = 'job-applied-button';
                        appliedBtn.setAttribute('data-job-id', jobId);
                        appliedBtn.setAttribute('data-job-country', country);
                        appliedBtn.setAttribute('title', 'Mark as applied');
                        appliedBtn.innerHTML = '<i class="fas fa-check"></i>';

                        // Add click event to the new button
                        appliedBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            const jobId = this.getAttribute('data-job-id');
                            const country = this.getAttribute('data-job-country');
                            markJobAsApplied(jobId, country, jobElement);
                        });

                        // Replace the button
                        unappliedBtn.parentNode.replaceChild(appliedBtn, unappliedBtn);
                    }

                    // Remove the applied badge if present
                    const appliedBadge = jobElement.querySelector('.job-badge.applied');
                    if (appliedBadge) {
                        appliedBadge.parentNode.removeChild(appliedBadge);
                    }
                } else {
                    // Refresh the job listings if no element provided
                    filterJobListings();
                }
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
                    // If 'all' is selected, combine all countries except Archive
                    Object.entries(data.linkedInJobsByCountry).forEach(([country, countryJobs]) => {
                        if (country !== 'Archive') {
                            allJobs = allJobs.concat(countryJobs);
                        }
                    });
                }

                // Calculate total job count across all countries (excluding Archive for 'all' selection)
                Object.entries(data.linkedInJobsByCountry).forEach(([country, countryJobs]) => {
                    // Only include Archive country in the count if it's specifically selected
                    if (country !== 'Archive' || selectedCountry === 'Archive') {
                        totalJobCount += countryJobs.length;
                    }
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

            // By default, show only non-applied jobs
            // If "Show Applied Jobs" is checked, include all jobs
            const showAppliedJobs = document.getElementById('filter-applied')?.checked;
            const appliedFilteredJobs = showAppliedJobs ?
                filteredJobs :
                filteredJobs.filter(job => !job.isApplied);

            renderJobListings(appliedFilteredJobs);

            // Update status text with filter information
            let statusText = `Showing ${appliedFilteredJobs.length} of ${totalJobCount} jobs`;
            if (selectedCountry && selectedCountry !== 'all') {
                statusText += ` in ${selectedCountry}`;
            } else {
                statusText += ` (all countries except Archive)`;
            }

            // Add applied filter information
            if (!showAppliedJobs) {
                statusText += " (not applied)";
            }

            if (searchTerm) {
                statusText += ` (filtered by "${searchTerm}")`;
            }

            scrapeInfo.textContent = statusText;
        });
    }
});