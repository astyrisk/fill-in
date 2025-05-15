// Global variables
let jobFilters = [];
let currentEditingFilterId = null;

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
      jobFilters: jobFilters
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
      jobFilters: []
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
          <span class="filter-detail-label">Job Type</span>
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
    errorMessage += 'Job Type is required.\n';
  }
  if (!location) {
    errorMessage += 'Location is required.\n';
  }
  if (experienceLevels.length === 0) {
    errorMessage += 'At least one Experience Level must be selected.\n';
  }

  // Check for duplicate filter
  if (isDuplicateFilter(jobType, location, experienceLevels, currentEditingFilterId)) {
    errorMessage += 'A filter with the same Job Type, Location, and Experience Levels already exists.\n';
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

document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  setupFilterFormSlider();
  setupTabs();

  // Add event listeners for filter actions
  document.getElementById('add-filter').addEventListener('click', addFilter);
  document.getElementById('save-filter').addEventListener('click', saveFilter);
  document.getElementById('cancel-filter').addEventListener('click', cancelFilter);
});

document.getElementById('save').addEventListener('click', saveOptions);
