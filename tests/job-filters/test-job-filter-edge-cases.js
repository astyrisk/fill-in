/**
 * Edge case tests for job filter uniqueness
 * 
 * This file contains tests for edge cases in the job filter uniqueness feature:
 * - Case sensitivity
 * - Whitespace handling
 * - Experience level order
 * - Editing existing filters
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
function testCaseInsensitivity() {
    console.log('Test: Case insensitivity');
    
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
    
    // Check with different case
    const isDuplicate = isDuplicateFilter('software ENGINEER', 'REMOTE', ['2', '3']);
    
    console.assert(isDuplicate === true, 'Should be case insensitive');
    console.log('Result:', isDuplicate ? 'PASS' : 'FAIL');
}

function testWhitespaceHandling() {
    console.log('Test: Whitespace handling');
    
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
    
    // Check with extra whitespace
    const isDuplicate = isDuplicateFilter('  Software Engineer  ', '  Remote  ', ['2', '3']);
    
    console.assert(isDuplicate === true, 'Should trim whitespace');
    console.log('Result:', isDuplicate ? 'PASS' : 'FAIL');
}

function testExperienceLevelOrder() {
    console.log('Test: Experience level order');
    
    // Reset job filters
    jobFilters = [];
    
    // Add a filter
    jobFilters.push({
        id: generateUniqueId(),
        jobType: 'Software Engineer',
        location: 'Remote',
        experienceLevels: ['2', '3', '6'],
        postingDate: '7'
    });
    
    // Check with different order
    const tests = [
        { order: ['3', '2', '6'], expected: true },
        { order: ['6', '3', '2'], expected: true },
        { order: ['2', '6', '3'], expected: true }
    ];
    
    let allPassed = true;
    
    tests.forEach((test, index) => {
        const isDuplicate = isDuplicateFilter('Software Engineer', 'Remote', test.order);
        console.assert(isDuplicate === test.expected, `Test ${index + 1} failed: order should not matter`);
        
        if (isDuplicate !== test.expected) {
            allPassed = false;
        }
    });
    
    console.log('Result:', allPassed ? 'PASS' : 'FAIL');
}

function testEditingFilter() {
    console.log('Test: Editing filter');
    
    // Reset job filters
    jobFilters = [];
    
    // Add two filters
    const filter1 = {
        id: generateUniqueId(),
        jobType: 'Software Engineer',
        location: 'Remote',
        experienceLevels: ['2', '3'],
        postingDate: '7'
    };
    
    const filter2 = {
        id: generateUniqueId(),
        jobType: 'Data Scientist',
        location: 'New York',
        experienceLevels: ['1', '2'],
        postingDate: '14'
    };
    
    jobFilters.push(filter1, filter2);
    
    // Test 1: Editing a filter to be the same as itself should not be a duplicate
    currentEditingFilterId = filter1.id;
    const test1 = isDuplicateFilter('Software Engineer', 'Remote', ['2', '3'], currentEditingFilterId);
    
    console.assert(test1 === false, 'Editing a filter to be the same as itself should not be a duplicate');
    
    // Test 2: Editing a filter to be the same as another filter should be a duplicate
    currentEditingFilterId = filter1.id;
    const test2 = isDuplicateFilter('Data Scientist', 'New York', ['1', '2'], currentEditingFilterId);
    
    console.assert(test2 === true, 'Editing a filter to be the same as another filter should be a duplicate');
    
    console.log('Result:', (test1 === false && test2 === true) ? 'PASS' : 'FAIL');
}

// Run tests
function runAllTests() {
    console.log('Running edge case tests for job filter uniqueness...');
    testCaseInsensitivity();
    testWhitespaceHandling();
    testExperienceLevelOrder();
    testEditingFilter();
    console.log('Edge case tests completed!');
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testCaseInsensitivity,
        testWhitespaceHandling,
        testExperienceLevelOrder,
        testEditingFilter
    };
}
