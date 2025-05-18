/**
 * Basic tests for job filter functionality
 * 
 * This file contains tests for the basic functionality of job filters:
 * - Creating a new filter
 * - Validating required fields
 * - Checking for duplicates
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

// Test functions
function testBasicFilterCreation() {
    console.log('Test: Basic filter creation');
    
    // Reset job filters
    jobFilters = [];
    
    // Create a new filter
    const filter = {
        id: generateUniqueId(),
        jobType: 'Software Engineer',
        location: 'Remote',
        experienceLevels: ['2', '3'],
        postingDate: '7'
    };
    
    jobFilters.push(filter);
    
    // Verify filter was added
    console.assert(jobFilters.length === 1, 'Filter should be added to the array');
    console.assert(jobFilters[0].jobType === 'Software Engineer', 'Job type should match');
    console.assert(jobFilters[0].location === 'Remote', 'Location should match');
    console.assert(jobFilters[0].experienceLevels.length === 2, 'Should have 2 experience levels');
    
    console.log('Result:', jobFilters.length === 1 ? 'PASS' : 'FAIL');
}

function testDuplicateDetection() {
    console.log('Test: Duplicate detection');
    
    // Reset job filters
    jobFilters = [];
    
    // Add a filter
    jobFilters.push({
        id: generateUniqueId(),
        jobType: 'Software Engineer',
        location: 'Remote',
        experienceLevels: ['2', '3'],
        postingDate: '7'
    });
    
    // Check for duplicate
    const isDuplicate = isDuplicateFilter('Software Engineer', 'Remote', ['2', '3']);
    
    console.assert(isDuplicate === true, 'Should detect duplicate filter');
    console.log('Result:', isDuplicate ? 'PASS' : 'FAIL');
}

function testNonDuplicateDetection() {
    console.log('Test: Non-duplicate detection');
    
    // Reset job filters
    jobFilters = [];
    
    // Add a filter
    jobFilters.push({
        id: generateUniqueId(),
        jobType: 'Software Engineer',
        location: 'Remote',
        experienceLevels: ['2', '3'],
        postingDate: '7'
    });
    
    // Check for non-duplicates
    const tests = [
        { jobType: 'Data Scientist', location: 'Remote', experienceLevels: ['2', '3'] },
        { jobType: 'Software Engineer', location: 'New York', experienceLevels: ['2', '3'] },
        { jobType: 'Software Engineer', location: 'Remote', experienceLevels: ['1', '4'] }
    ];
    
    let allPassed = true;
    
    tests.forEach((test, index) => {
        const isDuplicate = isDuplicateFilter(test.jobType, test.location, test.experienceLevels);
        console.assert(isDuplicate === false, `Test ${index + 1} should not detect duplicate`);
        
        if (isDuplicate) {
            allPassed = false;
        }
    });
    
    console.log('Result:', allPassed ? 'PASS' : 'FAIL');
}

// Run tests
function runAllTests() {
    console.log('Running basic job filter tests...');
    testBasicFilterCreation();
    testDuplicateDetection();
    testNonDuplicateDetection();
    console.log('Basic tests completed!');
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testBasicFilterCreation,
        testDuplicateDetection,
        testNonDuplicateDetection
    };
}
