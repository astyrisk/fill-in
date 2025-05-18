// Test script for job filter uniqueness
console.log('Testing job filter uniqueness...');

// Mock the DOM elements
document.getElementById = function(id) {
  const elements = {
    'filter-job-type': { value: 'Software Engineer' },
    'filter-location': { value: 'Remote' },
    'filter-posting-date': { value: '7' },
    'filter-experience-level-1': { checked: false, value: '1' },
    'filter-experience-level-2': { checked: true, value: '2' },
    'filter-experience-level-6': { checked: false, value: '6' },
    'filter-experience-level-3': { checked: true, value: '3' },
    'filter-experience-level-4': { checked: false, value: '4' },
    'filter-experience-level-5': { checked: false, value: '5' },
    'filter-form': { style: { display: 'block' } },
    'filter-form-title': { textContent: 'Add New Filter' },
    'filters-container': { innerHTML: '', appendChild: () => {} },
    'empty-filters-state': { style: { display: 'none' } },
    'status': { classList: { add: () => {}, remove: () => {} } }
  };
  
  return elements[id] || { value: '', style: {}, classList: { add: () => {}, remove: () => {} } };
};

// Mock alert function to capture error messages
const originalAlert = alert;
let alertMessages = [];
alert = function(message) {
  console.log('Alert:', message);
  alertMessages.push(message);
};

// Import the functions from options.js
// Note: In a real test, you would use a proper testing framework
// This is just a simple demonstration

// Mock the jobFilters array
let jobFilters = [];
let currentEditingFilterId = null;

// Mock the generateUniqueId function
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Mock the renderJobFilters function
function renderJobFilters() {
  console.log('Rendering job filters:', jobFilters);
}

// Mock the saveOptions function
function saveOptions() {
  console.log('Saving options...');
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

// Run tests
function runTests() {
  console.log('Running tests...');
  
  // Test 1: Add a new filter
  console.log('\nTest 1: Add a new filter');
  saveFilter();
  console.log('Job filters after Test 1:', jobFilters);
  console.assert(jobFilters.length === 1, 'Should have 1 filter');
  
  // Test 2: Try to add a duplicate filter
  console.log('\nTest 2: Try to add a duplicate filter');
  alertMessages = []; // Reset alert messages
  saveFilter(); // Should fail with duplicate error
  console.log('Alert messages:', alertMessages);
  console.assert(alertMessages.length === 1, 'Should show an alert');
  console.assert(alertMessages[0].includes('already exists'), 'Alert should mention duplicate');
  console.assert(jobFilters.length === 1, 'Should still have 1 filter');
  
  // Test 3: Add a filter with different job type
  console.log('\nTest 3: Add a filter with different job type');
  document.getElementById('filter-job-type').value = 'Data Scientist';
  saveFilter();
  console.log('Job filters after Test 3:', jobFilters);
  console.assert(jobFilters.length === 2, 'Should have 2 filters');
  
  // Test 4: Add a filter with different location
  console.log('\nTest 4: Add a filter with different location');
  document.getElementById('filter-job-type').value = 'Software Engineer';
  document.getElementById('filter-location').value = 'New York';
  saveFilter();
  console.log('Job filters after Test 4:', jobFilters);
  console.assert(jobFilters.length === 3, 'Should have 3 filters');
  
  // Test 5: Add a filter with different experience levels
  console.log('\nTest 5: Add a filter with different experience levels');
  document.getElementById('filter-location').value = 'Remote';
  document.getElementById('filter-experience-level-2').checked = false;
  document.getElementById('filter-experience-level-6').checked = true;
  saveFilter();
  console.log('Job filters after Test 5:', jobFilters);
  console.assert(jobFilters.length === 4, 'Should have 4 filters');
  
  // Test 6: Edit a filter without making it a duplicate
  console.log('\nTest 6: Edit a filter without making it a duplicate');
  currentEditingFilterId = jobFilters[0].id;
  document.getElementById('filter-job-type').value = 'Frontend Developer';
  document.getElementById('filter-experience-level-2').checked = true;
  document.getElementById('filter-experience-level-6').checked = false;
  saveFilter();
  console.log('Job filters after Test 6:', jobFilters);
  console.assert(jobFilters.length === 4, 'Should still have 4 filters');
  console.assert(jobFilters[0].jobType === 'Frontend Developer', 'First filter should be updated');
  
  // Test 7: Try to edit a filter to make it a duplicate
  console.log('\nTest 7: Try to edit a filter to make it a duplicate');
  currentEditingFilterId = jobFilters[0].id;
  document.getElementById('filter-job-type').value = 'Data Scientist';
  document.getElementById('filter-location').value = 'Remote';
  alertMessages = []; // Reset alert messages
  saveFilter(); // Should fail with duplicate error
  console.log('Alert messages:', alertMessages);
  console.assert(alertMessages.length === 1, 'Should show an alert');
  console.assert(alertMessages[0].includes('already exists'), 'Alert should mention duplicate');
  
  // Restore original alert function
  alert = originalAlert;
  
  console.log('\nAll tests completed!');
}

// Run the tests
runTests();
