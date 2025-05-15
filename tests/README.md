# Job Filter Uniqueness Tests

This folder contains tests for the job filter uniqueness feature. The tests verify that job filters with the same job type, location, and experience levels cannot be created.

## Test Files

- `test-job-filter-basic.js`: Basic tests for job filter functionality
- `test-job-filter-edge-cases.js`: Tests for edge cases like case sensitivity, whitespace handling, etc.
- `test-job-filter-integration.js`: Integration tests that simulate the full workflow
- `test-runner.html`: HTML page to run all tests in the browser
- `test-job-filter-uniqueness.html`: Standalone test page with visual results

## Running the Tests

### Option 1: Using the Test Runner

1. Open `test-runner.html` in a web browser
2. Click on the buttons to run different test suites:
   - "Run All Tests" to run all test suites
   - "Run Basic Tests" to run only basic tests
   - "Run Edge Case Tests" to run only edge case tests
   - "Run Integration Tests" to run only integration tests
   - "Clear Results" to clear the test results

### Option 2: Using the Standalone Test Page

1. Open `test-job-filter-uniqueness.html` in a web browser
2. Click "Run All Tests" to run the tests
3. View the results on the page

## Test Coverage

The tests cover the following scenarios:

### Basic Tests
- Creating a new filter
- Detecting duplicate filters
- Detecting non-duplicate filters (different job type, location, or experience levels)

### Edge Case Tests
- Case insensitivity (e.g., "Software Engineer" vs "software engineer")
- Whitespace handling (e.g., "Remote" vs " Remote ")
- Experience level order (e.g., ['2', '3'] vs ['3', '2'])
- Editing existing filters (should not detect itself as a duplicate)

### Integration Tests
- Full workflow simulation
- Adding multiple filters
- Editing filters
- Attempting to create duplicates
- Handling edge cases in a real-world scenario

## Implementation Details

The job filter uniqueness feature is implemented in `options.js` with the following key components:

1. `isDuplicateFilter()` function: Checks if a filter with the same job type, location, and experience levels already exists
2. `saveFilter()` function: Validates input and checks for duplicates before saving
3. UI notification: Informs users about the uniqueness requirement

The uniqueness check:
- Is case-insensitive
- Trims whitespace
- Handles experience levels in any order
- Properly handles editing existing filters
