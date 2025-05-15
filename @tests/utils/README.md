# Test Utilities

This directory contains utility functions and helpers for testing the Fill-In project.

## Files

- `test_helpers.js`: Common utility functions for JavaScript tests
  - Mock storage creation
  - Mock job filter creation
  - Mock job listing creation
  - Object comparison utilities

## Using the Utilities

To use these utilities in your tests, include the appropriate file at the top of your test file:

```javascript
// For JavaScript tests
const { createMockStorage, createMockJobFilter, createMockJobListing, assertObjectsEqual } = require('../utils/test_helpers.js');
```

## Examples

### Creating a mock storage object

```javascript
const mockStorage = createMockStorage({
    userData: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com'
    }
});

// Use the mock storage in tests
mockStorage.get('userData', (result) => {
    console.assert(result.userData.firstName === 'John', 'First name should be John');
});
```

### Creating a mock job filter

```javascript
const mockFilter = createMockJobFilter({
    jobType: 'Data Scientist',
    location: 'New York'
});

console.assert(mockFilter.jobType === 'Data Scientist', 'Job type should be Data Scientist');
console.assert(mockFilter.location === 'New York', 'Location should be New York');
```

### Comparing objects

```javascript
const actual = { name: 'John', age: 30 };
const expected = { name: 'John', age: 30 };

assertObjectsEqual(actual, expected, 'Objects should be equal');
```
