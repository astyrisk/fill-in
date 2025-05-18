/**
 * Integration tests for job filter functionality
 * 
 * This file contains tests that simulate the full job filter workflow:
 * - Adding multiple filters
 * - Editing filters
 * - Attempting to create duplicates
 * - Handling edge cases in a real-world scenario
 */

// Mock the job filters array and related functions
let jobFilters = [];
let currentEditingFilterId = null;

// Generate a unique ID for each filter
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
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

// Mock save filter function
function saveFilter(jobType, location, experienceLevels, postingDate, editingId = null) {
    // Validate required fields
    if (!jobType || !location || experienceLevels.length === 0) {
        return { success: false, error: 'Missing required fields' };
    }
    
    // Check for duplicate filter
    if (isDuplicateFilter(jobType, location, experienceLevels, editingId)) {
        return { success: false, error: 'Duplicate filter' };
    }
    
    // Create or update filter
    if (editingId) {
        // Update existing filter
        const filterIndex = jobFilters.findIndex(f => f.id === editingId);
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
    
    return { success: true };
}

// Test functions
function testFullWorkflow() {
    console.log('Test: Full workflow');
    
    // Reset job filters
    jobFilters = [];
    
    // Step 1: Add first filter
    const result1 = saveFilter('Software Engineer', 'Remote', ['2', '3'], '7');
    console.assert(result1.success === true, 'Should successfully add first filter');
    console.assert(jobFilters.length === 1, 'Should have 1 filter after first add');
    
    // Step 2: Try to add duplicate filter
    const result2 = saveFilter('Software Engineer', 'Remote', ['2', '3'], '14');
    console.assert(result2.success === false, 'Should fail to add duplicate filter');
    console.assert(result2.error === 'Duplicate filter', 'Should return correct error message');
    console.assert(jobFilters.length === 1, 'Should still have 1 filter after failed add');
    
    // Step 3: Add different filter
    const result3 = saveFilter('Data Scientist', 'New York', ['1', '2'], '14');
    console.assert(result3.success === true, 'Should successfully add different filter');
    console.assert(jobFilters.length === 2, 'Should have 2 filters after second add');
    
    // Step 4: Edit first filter
    const firstFilterId = jobFilters[0].id;
    const result4 = saveFilter('Frontend Developer', 'Remote', ['2', '3'], '7', firstFilterId);
    console.assert(result4.success === true, 'Should successfully edit first filter');
    console.assert(jobFilters[0].jobType === 'Frontend Developer', 'First filter should be updated');
    console.assert(jobFilters.length === 2, 'Should still have 2 filters after edit');
    
    // Step 5: Try to edit first filter to be the same as second filter
    const result5 = saveFilter('Data Scientist', 'New York', ['1', '2'], '14', firstFilterId);
    console.assert(result5.success === false, 'Should fail to make first filter a duplicate of second');
    console.assert(result5.error === 'Duplicate filter', 'Should return correct error message');
    console.assert(jobFilters[0].jobType === 'Frontend Developer', 'First filter should not be changed');
    
    // Step 6: Add filter with same job type but different location
    const result6 = saveFilter('Frontend Developer', 'San Francisco', ['2', '3'], '7');
    console.assert(result6.success === true, 'Should successfully add filter with same job type but different location');
    console.assert(jobFilters.length === 3, 'Should have 3 filters after third add');
    
    // Step 7: Add filter with same job type and location but different experience levels
    const result7 = saveFilter('Frontend Developer', 'Remote', ['1', '6'], '7');
    console.assert(result7.success === true, 'Should successfully add filter with same job type and location but different experience levels');
    console.assert(jobFilters.length === 4, 'Should have 4 filters after fourth add');
    
    console.log('Result:', (
        result1.success === true &&
        result2.success === false &&
        result3.success === true &&
        result4.success === true &&
        result5.success === false &&
        result6.success === true &&
        result7.success === true
    ) ? 'PASS' : 'FAIL');
}

// Run tests
function runAllTests() {
    console.log('Running integration tests for job filter workflow...');
    testFullWorkflow();
    console.log('Integration tests completed!');
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testFullWorkflow
    };
}
