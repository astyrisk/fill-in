// Global variables
let jobFilters = [];
let currentEditingFilterId = null;
let isScrapingFilters = false;

// Saves options to chrome.storage.sync
function saveOptions() {
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;

  // Location fields
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const country = document.getElementById('country').value;
  const zipCode = document.getElementById('zipCode').value;

  // Social & Portfolio fields
  const linkedinUrl = document.getElementById('linkedinUrl').value;
  const githubUrl = document.getElementById('githubUrl').value;
  const portfolioUrl = document.getElementById('portfolioUrl').value;

  // Employment Details fields
  const workAuth = document.getElementById('workAuth').value;
  const visaSponsorship = document.getElementById('visaSponsorship').value;
  const salaryExpectations = document.getElementById('salaryExpectations').value;
  const noticePeriod = document.getElementById('noticePeriod').value;
  const availableToStart = document.getElementById('availableToStart').value;

  // Additional Information fields
  const englishFluency = document.getElementById('englishFluency').value;
  const relatedToAnyone = document.getElementById('relatedToAnyone').value;

  // Highlight settings
  const highlightWords = document.getElementById('highlight-words').value;

  // Exclusion settings
  const excludeTitleWords = document.getElementById('exclude-title-words').value;

  // Tailor settings
  const openrouterApiKey = document.getElementById('openrouterApiKey').value;
  const tailorPrompt = document.getElementById('tailor-prompt').value;

  chrome.storage.sync.set(
    {
      userData: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        // Location data
        city: city,
        state: state,
        country: country,
        zipCode: zipCode,
        // Social & Portfolio data
        linkedinUrl: linkedinUrl,
        githubUrl: githubUrl,
        portfolioUrl: portfolioUrl,
        // Employment Details data
        workAuth: workAuth,
        visaSponsorship: visaSponsorship,
        salaryExpectations: salaryExpectations,
        noticePeriod: noticePeriod,
        availableToStart: availableToStart,
        // Additional Information data
        englishFluency: englishFluency,
        relatedToAnyone: relatedToAnyone
      },
      jobFilters: jobFilters,
      highlightWords: highlightWords,
      excludeTitleWords: excludeTitleWords,
      tailorSettings: {
        openrouterApiKey: openrouterApiKey,
        tailorPrompt: tailorPrompt
      }
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.classList.add('show');

      // Hide the status message after a delay
      setTimeout(() => {
        status.classList.remove('show');
      }, 2000);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  // Use default values if nothing is stored
  chrome.storage.sync.get(
    {
      userData: {},
      jobFilters: [],
      highlightWords: 'experience,',
      excludeTitleWords: '',
      tailorSettings: {
        openrouterApiKey: '',
        tailorPrompt: ''
      }
    },
    (items) => {
      if (items.userData) {
        document.getElementById('firstName').value = items.userData.firstName || '';
        document.getElementById('lastName').value = items.userData.lastName || '';
        document.getElementById('email').value = items.userData.email || '';
        document.getElementById('phone').value = items.userData.phone || '';

        // Restore location fields
        document.getElementById('city').value = items.userData.city || '';
        document.getElementById('state').value = items.userData.state || '';
        document.getElementById('country').value = items.userData.country || '';
        document.getElementById('zipCode').value = items.userData.zipCode || '';

        // Restore social & portfolio fields
        document.getElementById('linkedinUrl').value = items.userData.linkedinUrl || '';
        document.getElementById('githubUrl').value = items.userData.githubUrl || '';
        document.getElementById('portfolioUrl').value = items.userData.portfolioUrl || '';

        // Restore employment details fields
        document.getElementById('workAuth').value = items.userData.workAuth || '';
        document.getElementById('visaSponsorship').value = items.userData.visaSponsorship || '';
        document.getElementById('salaryExpectations').value = items.userData.salaryExpectations || '';
        document.getElementById('noticePeriod').value = items.userData.noticePeriod || '';
        document.getElementById('availableToStart').value = items.userData.availableToStart || '';

        // Restore additional information fields
        document.getElementById('englishFluency').value = items.userData.englishFluency || '';
        document.getElementById('relatedToAnyone').value = items.userData.relatedToAnyone || '';
      }

      // Restore job filters
      if (items.jobFilters && Array.isArray(items.jobFilters)) {
        jobFilters = items.jobFilters;
        renderJobFilters();
      }

      // Restore highlight words
      document.getElementById('highlight-words').value = items.highlightWords;

      // Restore exclude title words
      document.getElementById('exclude-title-words').value = items.excludeTitleWords;

      // Restore tailor settings
      if (items.tailorSettings) {
        document.getElementById('openrouterApiKey').value = items.tailorSettings.openrouterApiKey || '';

        // Restore tailor prompt or set default if empty
        const tailorPromptElement = document.getElementById('tailor-prompt');
        if (items.tailorSettings.tailorPrompt) {
          tailorPromptElement.value = items.tailorSettings.tailorPrompt;
        } else {
          // Set default prompt
          tailorPromptElement.value = getDefaultTailorPrompt();
        }
      }
    }
  );
}

// Generate a unique ID for each filter
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Render all job filters
function renderJobFilters() {
  const filtersContainer = document.getElementById('filters-container');
  const emptyState = document.getElementById('empty-filters-state');

  // Clear the container
  filtersContainer.innerHTML = '';

  // Show empty state if no filters
  if (jobFilters.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  // Hide empty state
  emptyState.style.display = 'none';

  // Render each filter
  jobFilters.forEach(filter => {
    const filterCard = document.createElement('div');
    filterCard.className = 'filter-card';
    filterCard.dataset.id = filter.id;

    // Get experience levels text and tags
    let experienceLevelText = '';
    let experienceLevelTags = '';

    // Function to get text for a level
    const getLevelText = (level) => {
      if (level === '1') return 'Internship';
      if (level === '2') return 'Entry';
      if (level === '6') return 'Associate';
      if (level === '3') return 'Mid-Sr';
      if (level === '4') return 'Director';
      if (level === '5') return 'Executive';
      return '';
    };

    // Handle multiple experience levels
    if (filter.experienceLevels && Array.isArray(filter.experienceLevels) && filter.experienceLevels.length > 0) {
      // Create tags for each level
      experienceLevelTags = filter.experienceLevels.map(level =>
        `<span class="experience-level-tag">${getLevelText(level)}</span>`
      ).join('');

      experienceLevelText = experienceLevelTags;
    }
    // Handle legacy single experience level
    else if (filter.experienceLevel) {
      experienceLevelText = getLevelText(filter.experienceLevel);
    }
    // Default case
    else {
      experienceLevelText = 'Any';
    }

    // Get posting date text
    let postingDateText = getPostingDateLabel(filter.postingDate);

    // Generate a display name based on job type and location
    const displayName = `${filter.jobType || 'Jobs'} in ${filter.location || 'Any Location'}`;

    filterCard.innerHTML = `
      <div class="filter-header">
        <h3 class="filter-name">${displayName}</h3>
        <div class="filter-actions">
          <button type="button" class="filter-action-btn edit" title="Edit Filter">
            <i class="fas fa-edit"></i>
          </button>
          <button type="button" class="filter-action-btn delete" title="Delete Filter">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <div class="filter-details">
        <div class="filter-detail">
          <span class="filter-detail-label">Job Title</span>
          <span class="filter-detail-value">${filter.jobType || 'Any'}</span>
        </div>
        <div class="filter-detail">
          <span class="filter-detail-label">Location</span>
          <span class="filter-detail-value">${filter.location || 'Any'}</span>
        </div>
        <div class="filter-detail">
          <span class="filter-detail-label">Experience Level</span>
          <span class="filter-detail-value">${experienceLevelText}</span>
        </div>
        <div class="filter-detail">
          <span class="filter-detail-label">Posting Date</span>
          <span class="filter-detail-value">${postingDateText}</span>
        </div>
      </div>
    `;

    // Add event listeners
    const editBtn = filterCard.querySelector('.edit');
    const deleteBtn = filterCard.querySelector('.delete');

    editBtn.addEventListener('click', () => {
      editFilter(filter.id);
    });

    deleteBtn.addEventListener('click', () => {
      deleteFilter(filter.id);
    });

    filtersContainer.appendChild(filterCard);
  });
}

// Add a new filter
function addFilter() {
  // Show the filter form
  document.getElementById('filter-form').style.display = 'block';
  document.getElementById('filter-form-title').textContent = 'Add New Filter';

  // Clear the form
  document.getElementById('filter-job-type').value = '';
  document.getElementById('filter-location').value = '';
  document.getElementById('filter-posting-date').value = '7';

  // Uncheck all experience level checkboxes
  for (let i of [1, 2, 6, 3, 4, 5]) {
    const checkbox = document.getElementById(`filter-experience-level-${i}`);
    if (checkbox) {
      checkbox.checked = false;
    }
  }

  // Check the Entry Level checkbox by default
  const entryLevelCheckbox = document.getElementById('filter-experience-level-2');
  if (entryLevelCheckbox) {
    entryLevelCheckbox.checked = true;
  }

  // Update the posting date label
  updateFilterPostingDateLabel('7');

  // Reset the current editing filter ID
  currentEditingFilterId = null;
}

// Edit an existing filter
function editFilter(filterId) {
  const filter = jobFilters.find(f => f.id === filterId);
  if (!filter) return;

  // Show the filter form
  document.getElementById('filter-form').style.display = 'block';
  document.getElementById('filter-form-title').textContent = 'Edit Filter';

  // Fill the form with filter data
  document.getElementById('filter-job-type').value = filter.jobType;
  document.getElementById('filter-location').value = filter.location;
  document.getElementById('filter-posting-date').value = filter.postingDate;

  // Reset all checkboxes first
  for (let i of [1, 2, 6, 3, 4, 5]) {
    const checkbox = document.getElementById(`filter-experience-level-${i}`);
    if (checkbox) {
      checkbox.checked = false;
    }
  }

  // Check the appropriate experience level checkboxes
  if (filter.experienceLevels && Array.isArray(filter.experienceLevels)) {
    filter.experienceLevels.forEach(level => {
      const checkbox = document.getElementById(`filter-experience-level-${level}`);
      if (checkbox) {
        checkbox.checked = true;
      }
    });
  } else if (filter.experienceLevel) {
    // Handle legacy format with single experience level
    const checkbox = document.getElementById(`filter-experience-level-${filter.experienceLevel}`);
    if (checkbox) {
      checkbox.checked = true;
    }
  }

  // Update the posting date label
  updateFilterPostingDateLabel(filter.postingDate);

  // Set the current editing filter ID
  currentEditingFilterId = filterId;
}

// Delete a filter
function deleteFilter(filterId) {
  if (confirm('Are you sure you want to delete this filter?')) {
    jobFilters = jobFilters.filter(f => f.id !== filterId);
    renderJobFilters();
    saveOptions();
  }
}

// Helper function to check if a filter is a duplicate
function isDuplicateFilter(jobType, location, experienceLevels, currentId = null) {
  // Sort experience levels to ensure consistent comparison
  const sortedExperienceLevels = [...experienceLevels].sort();

  return jobFilters.some(filter => {
    // Skip comparing with the filter being edited
    if (currentId && filter.id === currentId) {
      return false;
    }

    // Check if job type and location match
    const jobTypeMatch = filter.jobType.trim().toLowerCase() === jobType.trim().toLowerCase();
    const locationMatch = filter.location.trim().toLowerCase() === location.trim().toLowerCase();

    // Check if experience levels match
    let experienceLevelsMatch = false;
    if (filter.experienceLevels && Array.isArray(filter.experienceLevels)) {
      // Sort filter experience levels for consistent comparison
      const sortedFilterExperienceLevels = [...filter.experienceLevels].sort();

      // Check if arrays have the same length and same values
      experienceLevelsMatch =
        sortedFilterExperienceLevels.length === sortedExperienceLevels.length &&
        sortedFilterExperienceLevels.every((level, index) => level === sortedExperienceLevels[index]);
    }

    return jobTypeMatch && locationMatch && experienceLevelsMatch;
  });
}

// Save the current filter
function saveFilter() {
  const jobType = document.getElementById('filter-job-type').value.trim();
  const location = document.getElementById('filter-location').value.trim();
  const postingDate = document.getElementById('filter-posting-date').value || '7'; // Default to 7 if not set

  // Get selected experience levels
  const experienceLevels = [];
  // Check all possible experience level values (1-6)
  for (let i of [1, 2, 6, 3, 4, 5]) {
    const checkbox = document.getElementById(`filter-experience-level-${i}`);
    if (checkbox && checkbox.checked) {
      experienceLevels.push(checkbox.value);
    }
  }

  // Validate required fields
  let errorMessage = '';
  if (!jobType) {
    errorMessage += 'Job Title is required.\n';
  }
  if (!location) {
    errorMessage += 'Location is required.\n';
  }
  if (experienceLevels.length === 0) {
    errorMessage += 'At least one Experience Level must be selected.\n';
  }

  // Check for duplicate filter
  if (isDuplicateFilter(jobType, location, experienceLevels, currentEditingFilterId)) {
    errorMessage += 'A filter with the same Job Title, Location, and Experience Levels already exists.\n';
  }

  // Show error message if validation fails
  if (errorMessage) {
    alert('Please fix the following errors:\n' + errorMessage);
    return;
  }

  // Create or update filter
  if (currentEditingFilterId) {
    // Update existing filter
    const filterIndex = jobFilters.findIndex(f => f.id === currentEditingFilterId);
    if (filterIndex !== -1) {
      jobFilters[filterIndex] = {
        ...jobFilters[filterIndex],
        jobType,
        location,
        experienceLevels,
        postingDate
      };
    }
  } else {
    // Create new filter
    const newFilter = {
      id: generateUniqueId(),
      jobType,
      location,
      experienceLevels,
      postingDate
    };

    jobFilters.push(newFilter);
  }

  // Hide the form
  document.getElementById('filter-form').style.display = 'none';

  // Reset the current editing filter ID
  currentEditingFilterId = null;

  // Render the filters
  renderJobFilters();

  // Save the options
  saveOptions();
}

// Cancel filter editing
function cancelFilter() {
  document.getElementById('filter-form').style.display = 'none';
  currentEditingFilterId = null;
}

// Setup filter form slider
function setupFilterFormSlider() {
  const slider = document.getElementById('filter-posting-date');
  const ticks = document.querySelectorAll('#filter-form .tick');

  // Update the display when the slider value changes
  slider.addEventListener('input', function() {
    updateFilterPostingDateLabel(this.value);
    highlightFilterClosestTick(this.value);
  });

  // Add click event to ticks for direct selection
  ticks.forEach(tick => {
    tick.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      slider.value = value;
      updateFilterPostingDateLabel(value);
      highlightFilterClosestTick(value);
    });
  });
}

// Helper function to update the filter posting date label
function updateFilterPostingDateLabel(value) {
  const label = getPostingDateLabel(value);
  document.getElementById('filter-posting-date-value').textContent = label;
}

// Helper function to get posting date label
function getPostingDateLabel(value) {
  let label = 'Past day';

  if (value == 1) {
    label = 'Past day';
  } else if (value > 1 && value <= 7) {
    label = 'Past week';
  } else if (value > 7 && value <= 14) {
    label = 'Past 2 weeks';
  } else if (value > 14 && value <= 21) {
    label = 'Past 3 weeks';
  } else if (value > 21) {
    label = 'Past month';
  }

  return label + ' (' + value + ' days)';
}

// Helper function to highlight the closest tick in the filter form
function highlightFilterClosestTick(value) {
  const ticks = document.querySelectorAll('#filter-form .tick');
  let closestTick = null;
  let minDistance = Infinity;

  // Find the closest tick
  ticks.forEach(tick => {
    const tickValue = parseInt(tick.getAttribute('data-value'));
    const distance = Math.abs(tickValue - value);

    // Reset styles
    tick.style.fontWeight = 'normal';
    tick.style.color = '#888';

    if (distance < minDistance) {
      minDistance = distance;
      closestTick = tick;
    }
  });

  // Highlight the closest tick
  if (closestTick) {
    closestTick.style.fontWeight = 'bold';
    closestTick.style.color = '#4285f4';
  }
}

// Setup tab navigation
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and content
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Add active class to clicked tab
      tab.classList.add('active');

      // Show corresponding content
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Function to scrape job filters directly using LinkedIn URLs
function scrapeJobFiltersDirectly() {
  if (jobFilters.length === 0) {
    alert('No job filters to scrape. Please add at least one filter first.');
    return;
  }

  if (isScrapingFilters) {
    alert('Already scraping job filters. Please wait for the current scraping to complete.');
    return;
  }

  // Confirm with the user
  if (!confirm(`This will scrape LinkedIn jobs for ${jobFilters.length} filters without opening LinkedIn in your browser. Continue?`)) {
    return;
  }

  // Set scraping state
  isScrapingFilters = true;

  // Update UI to show scraping status
  jobFilters.forEach(filter => {
    updateFilterScrapingStatus(filter.id, 'pending');
  });

  // Send message to background script to start scraping
  chrome.runtime.sendMessage({
    action: 'scrapeJobFiltersDirectly',
    filters: jobFilters
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error starting direct scraping:', chrome.runtime.lastError);
      alert(`Error starting scraping: ${chrome.runtime.lastError.message}`);
      isScrapingFilters = false;
      return;
    }

    if (!response || !response.success) {
      console.error('Failed to start direct scraping:', response?.error || 'Unknown error');
      alert(`Failed to start scraping: ${response?.error || 'Unknown error'}`);
      isScrapingFilters = false;
      return;
    }

    console.log('Direct scraping started successfully');
  });
}

// Function to update the scraping status UI for a filter
function updateFilterScrapingStatus(filterId, status, error = null) {
  const filterCard = document.querySelector(`.filter-card[data-id="${filterId}"]`);
  if (!filterCard) return;

  // Find or create the status element
  let statusEl = filterCard.querySelector('.filter-scraping-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.className = 'filter-scraping-status';
    filterCard.appendChild(statusEl);
  }

  // Update the status display
  switch (status) {
    case 'pending':
      statusEl.innerHTML = '<i class="fas fa-clock"></i> Pending';
      statusEl.className = 'filter-scraping-status pending';
      break;
    case 'processing':
      statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scraping...';
      statusEl.className = 'filter-scraping-status processing';
      break;
    case 'completed':
      statusEl.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
      statusEl.className = 'filter-scraping-status completed';
      // Auto-hide after a delay
      setTimeout(() => {
        statusEl.style.opacity = '0';
        setTimeout(() => {
          statusEl.remove();
        }, 1000);
      }, 5000);
      break;
    case 'failed':
      statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> Failed${error ? `: ${error}` : ''}`;
      statusEl.className = 'filter-scraping-status failed';
      break;
    default:
      statusEl.remove();
  }

  // If all filters are completed or failed, reset the scraping state
  if (status === 'completed' || status === 'failed') {
    const pendingOrProcessingFilters = document.querySelectorAll('.filter-scraping-status.pending, .filter-scraping-status.processing');
    if (pendingOrProcessingFilters.length === 0) {
      isScrapingFilters = false;
    }
  }
}

// Listen for filter scraping status updates from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'filterScrapingStatusUpdate') {
    const { filterId, status, error } = request;
    updateFilterScrapingStatus(filterId, status, error);
    sendResponse({ success: true });
    return true;
  }
});

// Function to test the OpenRouter API key
function testApiKey() {
  const apiKey = document.getElementById('openrouterApiKey').value.trim();
  const statusElement = document.getElementById('api-key-status');

  if (!apiKey) {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Please enter an API key</span>';
    return;
  }

  // Validate API key format
  if (!apiKey.startsWith('sk-or-')) {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Invalid API key format. OpenRouter keys should start with "sk-or-"</span>';
    return;
  }

  statusElement.innerHTML = '<span style="color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Testing API key...</span>';

  // Use the tailor service to test the API key
  fetch('http://localhost:5000/test-api-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: apiKey
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Save the API key to storage immediately after successful validation
      chrome.storage.sync.get({
        tailorSettings: {
          openrouterApiKey: '',
          tailorPrompt: getDefaultTailorPrompt()
        }
      }, (items) => {
        const updatedSettings = {
          tailorSettings: {
            ...items.tailorSettings,
            openrouterApiKey: apiKey
          }
        };

        chrome.storage.sync.set(updatedSettings, () => {
          console.log('API key saved to storage after successful validation');
        });
      });

      if (data.has_deepseek) {
        statusElement.innerHTML = '<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> API key is valid and DeepSeek model is available</span>';

        // Show additional message if config was saved on the server
        if (data.config_saved) {
          statusElement.innerHTML += '<br><span style="color: var(--success-color);"><i class="fas fa-info-circle"></i> API key has been updated on the server</span>';
        }
      } else {
        statusElement.innerHTML = '<span style="color: var(--warning-color);"><i class="fas fa-exclamation-circle"></i> API key is valid but DeepSeek model not found</span>';
      }
    } else {
      throw new Error(data.message || 'Unknown error');
    }
  })
  .catch(error => {
    console.error('Error testing API key:', error);
    statusElement.innerHTML = `<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error: ${error.message}</span>`;

    // Check if the error might be related to the tailor service not running
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      statusElement.innerHTML += '<br><span style="color: var(--error-color);">Make sure the tailor service is running at http://localhost:5000</span>';
    }
  });
}

// Function to export settings to a JSON file
function exportSettings() {
  chrome.storage.sync.get(null, (items) => {
    // Create a JSON string from the settings
    const settingsJson = JSON.stringify(items, null, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([settingsJson], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = `fill-in-settings-${new Date().toISOString().split('T')[0]}.json`;

    // Trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // Show success message
    const statusElement = document.getElementById('import-settings-status');
    statusElement.innerHTML = '<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Settings exported successfully</span>';

    // Clear the message after a delay
    setTimeout(() => {
      statusElement.innerHTML = '';
    }, 3000);
  });
}

// Function to import settings from a JSON file
function importSettings() {
  const fileInput = document.getElementById('import-settings-file');
  const statusElement = document.getElementById('import-settings-status');

  if (!fileInput.files || fileInput.files.length === 0) {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> No file selected</span>';
    return;
  }

  const file = fileInput.files[0];
  if (!file.name.endsWith('.json')) {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Please select a JSON file</span>';
    return;
  }

  statusElement.innerHTML = '<span style="color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Importing settings...</span>';

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const settings = JSON.parse(event.target.result);

      // Validate the settings object
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings format');
      }

      // Save the imported settings
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          statusElement.innerHTML = `<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error: ${chrome.runtime.lastError.message}</span>`;
          return;
        }

        // Show success message
        statusElement.innerHTML = '<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Settings imported successfully</span>';

        // Restore the options to reflect the imported settings
        restoreOptions();

        // Clear the file input
        fileInput.value = '';

        // Clear the message after a delay
        setTimeout(() => {
          statusElement.innerHTML = '';
        }, 3000);
      });
    } catch (error) {
      console.error('Error importing settings:', error);
      statusElement.innerHTML = `<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error: ${error.message}</span>`;
    }
  };

  reader.onerror = () => {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error reading file</span>';
  };

  reader.readAsText(file);
}

// Function to export jobs to a JSON file
function exportJobs() {
  chrome.storage.local.get(['linkedInJobsByCountry', 'linkedInJobs', 'countries', 'scrapeTimestamp', 'capturedApplicationUrls'], (items) => {
    // Create a JSON string from the jobs data
    const jobsJson = JSON.stringify(items, null, 2);

    // Create a Blob with the JSON data
    const blob = new Blob([jobsJson], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = `fill-in-jobs-${new Date().toISOString().split('T')[0]}.json`;

    // Trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    // Show success message
    const statusElement = document.getElementById('import-jobs-status');
    statusElement.innerHTML = '<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Jobs exported successfully</span>';

    // Clear the message after a delay
    setTimeout(() => {
      statusElement.innerHTML = '';
    }, 3000);
  });
}

// Function to import jobs from a JSON file
function importJobs() {
  const fileInput = document.getElementById('import-jobs-file');
  const statusElement = document.getElementById('import-jobs-status');

  if (!fileInput.files || fileInput.files.length === 0) {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> No file selected</span>';
    return;
  }

  const file = fileInput.files[0];
  if (!file.name.endsWith('.json')) {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Please select a JSON file</span>';
    return;
  }

  statusElement.innerHTML = '<span style="color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Importing jobs...</span>';

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const jobsData = JSON.parse(event.target.result);

      // Validate the jobs data
      if (!jobsData || typeof jobsData !== 'object') {
        throw new Error('Invalid jobs data format');
      }

      // Get current jobs data to merge with imported data
      chrome.storage.local.get(['linkedInJobsByCountry', 'capturedApplicationUrls'], (currentData) => {
        const currentJobsByCountry = currentData.linkedInJobsByCountry || {};
        const currentCapturedUrls = currentData.capturedApplicationUrls || {};

        // Merge the imported jobs with current jobs
        const mergedJobsByCountry = { ...currentJobsByCountry };

        // If the imported data has linkedInJobsByCountry, merge it
        if (jobsData.linkedInJobsByCountry) {
          Object.keys(jobsData.linkedInJobsByCountry).forEach(country => {
            if (!mergedJobsByCountry[country]) {
              mergedJobsByCountry[country] = [];
            }

            // Add each job from the imported data, avoiding duplicates
            jobsData.linkedInJobsByCountry[country].forEach(importedJob => {
              // Check if the job already exists
              const existingJobIndex = mergedJobsByCountry[country].findIndex(job => job.jobId === importedJob.jobId);

              if (existingJobIndex === -1) {
                // Job doesn't exist, add it
                mergedJobsByCountry[country].push(importedJob);
              } else {
                // Job exists, update it
                mergedJobsByCountry[country][existingJobIndex] = importedJob;
              }
            });
          });
        }

        // Merge captured application URLs
        const mergedCapturedUrls = { ...currentCapturedUrls };
        if (jobsData.capturedApplicationUrls) {
          Object.keys(jobsData.capturedApplicationUrls).forEach(jobId => {
            mergedCapturedUrls[jobId] = jobsData.capturedApplicationUrls[jobId];
          });
        }

        // Create a flat list of all jobs for backward compatibility
        const allJobs = Object.values(mergedJobsByCountry).flat();

        // Save the merged data
        chrome.storage.local.set({
          linkedInJobsByCountry: mergedJobsByCountry,
          linkedInJobs: allJobs,
          countries: Object.keys(mergedJobsByCountry),
          capturedApplicationUrls: mergedCapturedUrls,
          scrapeTimestamp: new Date().toISOString()
        }, () => {
          if (chrome.runtime.lastError) {
            statusElement.innerHTML = `<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error: ${chrome.runtime.lastError.message}</span>`;
            return;
          }

          // Show success message
          statusElement.innerHTML = '<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Jobs imported successfully</span>';

          // Clear the file input
          fileInput.value = '';

          // Clear the message after a delay
          setTimeout(() => {
            statusElement.innerHTML = '';
          }, 3000);
        });
      });
    } catch (error) {
      console.error('Error importing jobs:', error);
      statusElement.innerHTML = `<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error: ${error.message}</span>`;
    }
  };

  reader.onerror = () => {
    statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error reading file</span>';
  };

  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  setupFilterFormSlider();
  setupTabs();

  // Add event listeners for filter actions
  document.getElementById('add-filter').addEventListener('click', addFilter);
  document.getElementById('save-filter').addEventListener('click', saveFilter);
  document.getElementById('cancel-filter').addEventListener('click', cancelFilter);

  // Add event listener for scrape button
  const scrapeButton = document.getElementById('scrape-filters');
  if (scrapeButton) {
    scrapeButton.addEventListener('click', scrapeJobFiltersDirectly);
  }

  // Add event listener for API key testing
  const testApiKeyButton = document.getElementById('test-api-key');
  if (testApiKeyButton) {
    testApiKeyButton.addEventListener('click', testApiKey);
  }

  // Add event listener for restart tailor service button
  const restartTailorServiceButton = document.getElementById('restart-tailor-service');
  if (restartTailorServiceButton) {
    restartTailorServiceButton.addEventListener('click', restartTailorService);
  }

  // Add event listener for check config button
  const checkConfigButton = document.getElementById('check-config');
  if (checkConfigButton) {
    checkConfigButton.addEventListener('click', checkCurrentConfig);
  }

  // Add event listener for reset prompt button
  const resetPromptButton = document.getElementById('reset-prompt');
  if (resetPromptButton) {
    resetPromptButton.addEventListener('click', resetTailorPrompt);
  }

  // Add event listeners for import/export settings
  const exportSettingsButton = document.getElementById('export-settings');
  if (exportSettingsButton) {
    exportSettingsButton.addEventListener('click', exportSettings);
  }

  const importSettingsButton = document.getElementById('import-settings');
  if (importSettingsButton) {
    importSettingsButton.addEventListener('click', () => {
      // Trigger the file input click
      document.getElementById('import-settings-file').click();
    });
  }

  const importSettingsFileInput = document.getElementById('import-settings-file');
  if (importSettingsFileInput) {
    importSettingsFileInput.addEventListener('change', importSettings);
  }

  // Add event listeners for import/export jobs
  const exportJobsButton = document.getElementById('export-jobs');
  if (exportJobsButton) {
    exportJobsButton.addEventListener('click', exportJobs);
  }

  const importJobsButton = document.getElementById('import-jobs');
  if (importJobsButton) {
    importJobsButton.addEventListener('click', () => {
      // Trigger the file input click
      document.getElementById('import-jobs-file').click();
    });
  }

  const importJobsFileInput = document.getElementById('import-jobs-file');
  if (importJobsFileInput) {
    importJobsFileInput.addEventListener('change', importJobs);
  }

  // Add event listeners for reset options
  const resetSettingsButton = document.getElementById('reset-settings');
  if (resetSettingsButton) {
    resetSettingsButton.addEventListener('click', resetAllSettings);
  }

  const removeAllJobsButton = document.getElementById('remove-all-jobs');
  if (removeAllJobsButton) {
    removeAllJobsButton.addEventListener('click', removeAllJobs);
  }

  const resetEverythingButton = document.getElementById('reset-everything');
  if (resetEverythingButton) {
    resetEverythingButton.addEventListener('click', resetEverything);
  }
});

document.getElementById('save').addEventListener('click', saveOptions);

// Function to get the default tailor prompt
function getDefaultTailorPrompt() {
  return `You are an expert resume writer. I have a default CV in YAML format and a job description.
Tailor the CV to match the ats important keywords and
to optimize it for ATS systems. pick the relavant projects (4 projects) and activities.
Don't add new information.
Return *only* the tailored CV in YAML format, with no additional text
or explanations. Ensure all 'highlights' fields are simple strings (e.g., 'GPA: 4.0/5.0').
IMPORTANT: You must preserve the exact same order of sections and fields as in the original YAML.
Do not change the structure or order of the YAML, only modify the content to match the job description.
You can change the following fields: name, date, label, details, highlights
In summary, I am a fresh graduate student, So you can start with that .
Use ** to make text bold as markdown syntax.
Don't add any new fields.
Also, add a field called 'filename' at the very top of the YAML with a suggested filename for the CV that includes the job title.
Here is the exact format of the original YAML:

{original_yaml}

Job Description:
{job_description}

Output the tailored CV in YAML format with the exact same structure and order as the original, plus the filename field at the top.`;
}

// Function to check the current configuration
function checkCurrentConfig() {
  const statusElement = document.getElementById('api-key-status');
  const configStatusElement = document.getElementById('config-status');
  const configPreElement = configStatusElement.querySelector('pre');

  statusElement.innerHTML = '<span style="color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Checking current configuration...</span>';

  // Call the config-status endpoint
  fetch('http://localhost:5000/config-status')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Format the configuration data
        const configData = data.config;
        const formattedConfig = JSON.stringify(configData, null, 2);

        // Display the configuration
        configPreElement.textContent = formattedConfig;
        configStatusElement.style.display = 'block';

        // Update status
        statusElement.innerHTML = '<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Configuration retrieved successfully</span>';

        // Check for potential issues
        let warnings = [];

        if (!configData.api_key_valid_format) {
          warnings.push("API key format is invalid (should start with 'sk-or-')");
        }

        if (configData.api_key_length < 20) {
          warnings.push("API key length seems too short");
        }

        if (!configData.model.includes('deepseek')) {
          warnings.push("Model does not appear to be a DeepSeek model");
        }

        // Display warnings if any
        if (warnings.length > 0) {
          const warningsList = warnings.map(w => `<li>${w}</li>`).join('');
          statusElement.innerHTML += `<br><span style="color: var(--warning-color);"><i class="fas fa-exclamation-triangle"></i> Potential issues detected:</span><ul style="color: var(--warning-color); margin-top: 5px;">${warningsList}</ul>`;
        }

        // Clear the status message after a delay (but keep the config display)
        setTimeout(() => {
          statusElement.innerHTML = '';
        }, 5000);
      } else {
        throw new Error(data.message || 'Failed to retrieve configuration');
      }
    })
    .catch(error => {
      console.error('Error checking configuration:', error);

      // Check if the error might be related to the server not running
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        statusElement.innerHTML = '<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Could not connect to tailor service. Make sure it is running at http://localhost:5000</span>';
      } else {
        statusElement.innerHTML = `<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error: ${error.message}</span>`;
      }

      // Hide the config status element
      configStatusElement.style.display = 'none';
    });
}

// Function to restart the tailor service
function restartTailorService() {
  const statusElement = document.getElementById('api-key-status');
  statusElement.innerHTML = '<span style="color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Restarting tailor service...</span>';

  // Get the current API key
  const apiKey = document.getElementById('openrouterApiKey').value.trim();

  // First, update the configuration with the current API key
  fetch('http://localhost:5000/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      openrouter_api_key: apiKey
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Now, call a special restart endpoint
      return fetch('http://localhost:5000/restart', {
        method: 'POST'
      });
    } else {
      throw new Error(data.message || 'Failed to update configuration');
    }
  })
  .then(response => {
    // The server might have restarted, so we might not get a response
    if (response && response.ok) {
      return response.json();
    } else {
      // If we don't get a response, assume the server is restarting
      return { success: true, message: 'Tailor service is restarting' };
    }
  })
  .then(data => {
    statusElement.innerHTML = '<span style="color: var(--success-color);"><i class="fas fa-check-circle"></i> Tailor service restarted successfully</span>';

    // If we have configuration data, display it
    if (data.config) {
      const configStatusElement = document.getElementById('config-status');
      const configPreElement = configStatusElement.querySelector('pre');

      // Format the configuration data
      const formattedConfig = JSON.stringify(data.config, null, 2);

      // Display the configuration
      configPreElement.textContent = formattedConfig;
      configStatusElement.style.display = 'block';
    }

    // Clear the message after a delay
    setTimeout(() => {
      statusElement.innerHTML = '';
    }, 3000);
  })
  .catch(error => {
    console.error('Error restarting tailor service:', error);

    // Check if the error might be related to the server restarting
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      statusElement.innerHTML = '<span style="color: var(--warning-color);"><i class="fas fa-exclamation-circle"></i> Tailor service may be restarting. Please wait a moment and try again.</span>';
    } else {
      statusElement.innerHTML = `<span style="color: var(--error-color);"><i class="fas fa-times-circle"></i> Error: ${error.message}</span>`;
    }
  });
}

// Function to reset the tailor prompt to default
function resetTailorPrompt() {
  const tailorPromptElement = document.getElementById('tailor-prompt');
  tailorPromptElement.value = getDefaultTailorPrompt();

  // Show a temporary message
  const resetButton = document.getElementById('reset-prompt');
  const originalText = resetButton.innerHTML;
  resetButton.innerHTML = '<i class="fas fa-check"></i> Default Prompt Restored';
  resetButton.disabled = true;

  setTimeout(() => {
    resetButton.innerHTML = originalText;
    resetButton.disabled = false;
  }, 2000);
}

// Function to reset all settings
function resetAllSettings() {
  if (!confirm('Are you sure you want to reset all settings? This will remove all your personal information, job filters, and tailor settings. This action cannot be undone.')) {
    return;
  }

  // Clear all settings in chrome.storage.sync
  chrome.storage.sync.clear(() => {
    if (chrome.runtime.lastError) {
      alert(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }

    // Set default values
    chrome.storage.sync.set({
      userData: {},
      jobFilters: [],
      highlightWords: 'experience,',
      excludeTitleWords: '',
      tailorSettings: {
        openrouterApiKey: '',
        tailorPrompt: getDefaultTailorPrompt()
      }
    }, () => {
      // Reset global variables
      jobFilters = [];
      currentEditingFilterId = null;

      // Restore options with default values
      restoreOptions();

      // Show success message
      const status = document.getElementById('status');
      status.innerHTML = '<i class="fas fa-check-circle"></i> All settings have been reset';
      status.classList.add('show');

      // Hide the status message after a delay
      setTimeout(() => {
        status.classList.remove('show');
      }, 2000);
    });
  });
}

// Function to remove all jobs
function removeAllJobs() {
  if (!confirm('Are you sure you want to remove all jobs? This will delete all your scraped jobs from all countries. This action cannot be undone.')) {
    return;
  }

  // Clear job-related data in chrome.storage.local
  chrome.storage.local.remove([
    'linkedInJobsByCountry',
    'linkedInJobs',
    'countries',
    'capturedApplicationUrls',
    'scrapeTimestamp'
  ], () => {
    if (chrome.runtime.lastError) {
      alert(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }

    // Show success message
    const status = document.getElementById('status');
    status.innerHTML = '<i class="fas fa-check-circle"></i> All jobs have been removed';
    status.classList.add('show');

    // Hide the status message after a delay
    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  });
}

// Function to reset everything (settings and jobs)
function resetEverything() {
  if (!confirm('Are you sure you want to reset everything? This will remove all your settings and jobs, completely resetting the extension to its initial state. This action cannot be undone.')) {
    return;
  }

  // First reset all settings
  chrome.storage.sync.clear(() => {
    if (chrome.runtime.lastError) {
      alert(`Error: ${chrome.runtime.lastError.message}`);
      return;
    }

    // Set default values for settings
    chrome.storage.sync.set({
      userData: {},
      jobFilters: [],
      highlightWords: 'experience,',
      excludeTitleWords: '',
      tailorSettings: {
        openrouterApiKey: '',
        tailorPrompt: getDefaultTailorPrompt()
      }
    }, () => {
      // Reset global variables
      jobFilters = [];
      currentEditingFilterId = null;

      // Then remove all jobs
      chrome.storage.local.remove([
        'linkedInJobsByCountry',
        'linkedInJobs',
        'countries',
        'capturedApplicationUrls',
        'scrapeTimestamp'
      ], () => {
        if (chrome.runtime.lastError) {
          alert(`Error: ${chrome.runtime.lastError.message}`);
          return;
        }

        // Restore options with default values
        restoreOptions();

        // Show success message
        const status = document.getElementById('status');
        status.innerHTML = '<i class="fas fa-check-circle"></i> Extension has been completely reset';
        status.classList.add('show');

        // Hide the status message after a delay
        setTimeout(() => {
          status.classList.remove('show');
        }, 2000);
      });
    });
  });
}
