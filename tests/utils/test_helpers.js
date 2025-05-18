/**
 * Test Helper Functions
 * 
 * This file contains utility functions for testing the Fill-In extension.
 */

/**
 * Creates a mock storage object for testing
 * @param {Object} initialData - Initial data to populate the mock storage with
 * @returns {Object} - Mock storage object with get and set methods
 */
function createMockStorage(initialData = {}) {
    const storage = { ...initialData };
    
    return {
        get: function(keys, callback) {
            if (typeof keys === 'string') {
                const result = {};
                result[keys] = storage[keys];
                callback(result);
            } else if (Array.isArray(keys)) {
                const result = {};
                keys.forEach(key => {
                    result[key] = storage[key];
                });
                callback(result);
            } else if (typeof keys === 'object') {
                const result = {};
                Object.keys(keys).forEach(key => {
                    result[key] = storage[key] !== undefined ? storage[key] : keys[key];
                });
                callback(result);
            } else {
                callback(storage);
            }
        },
        
        set: function(items, callback) {
            Object.assign(storage, items);
            if (callback) callback();
        },
        
        // Helper method to get the current state of the storage
        _getAll: function() {
            return { ...storage };
        }
    };
}

/**
 * Creates a mock job filter for testing
 * @param {Object} overrides - Properties to override in the default filter
 * @returns {Object} - Mock job filter object
 */
function createMockJobFilter(overrides = {}) {
    const defaultFilter = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        jobType: 'Software Engineer',
        location: 'Remote',
        experienceLevels: ['2', '3'],
        postingDate: '7'
    };
    
    return { ...defaultFilter, ...overrides };
}

/**
 * Creates a mock job listing for testing
 * @param {Object} overrides - Properties to override in the default listing
 * @returns {Object} - Mock job listing object
 */
function createMockJobListing(overrides = {}) {
    const defaultListing = {
        jobId: Date.now().toString(36) + Math.random().toString(36).substring(2),
        title: 'Software Engineer',
        company: 'Example Corp',
        location: 'Remote',
        datePosted: '2 days ago',
        applyUrl: 'https://example.com/jobs/apply',
        description: 'This is a job description for a Software Engineer position.',
        viewed: false,
        applied: false,
        archived: false,
        pinned: false,
        cvStatus: null
    };
    
    return { ...defaultListing, ...overrides };
}

/**
 * Asserts that two objects are equal (deep comparison)
 * @param {Object} actual - The actual object
 * @param {Object} expected - The expected object
 * @param {string} message - Optional message to display on failure
 * @returns {boolean} - Whether the assertion passed
 */
function assertObjectsEqual(actual, expected, message = '') {
    try {
        // Convert to JSON and back to handle circular references
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        
        const result = actualStr === expectedStr;
        console.assert(result, message || `Expected ${expectedStr}, but got ${actualStr}`);
        return result;
    } catch (error) {
        console.assert(false, `Error comparing objects: ${error.message}`);
        return false;
    }
}

// Export the helper functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createMockStorage,
        createMockJobFilter,
        createMockJobListing,
        assertObjectsEqual
    };
}
