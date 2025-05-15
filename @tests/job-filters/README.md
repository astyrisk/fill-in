# Job Filter Tests

This directory contains tests for the job filter functionality of the Fill-In extension.

## Test Files

- `test-job-filter-basic.js`: Basic tests for job filter functionality
  - Creating a new filter
  - Detecting duplicate filters
  - Detecting non-duplicate filters

- `test-job-filter-edge-cases.js`: Tests for edge cases in filter handling
  - Case insensitivity
  - Whitespace handling
  - Experience level order
  - Editing existing filters

- `test-job-filter-integration.js`: Integration tests for the full workflow
  - Adding multiple filters
  - Editing filters
  - Attempting to create duplicates
  - Handling edge cases in a real-world scenario

- `test-job-filter-uniqueness.js`: Standalone tests for filter uniqueness
  - Comprehensive tests for the uniqueness validation logic

- `test-job-filter-uniqueness.html`: Standalone test page with visual results
  - HTML page to run the uniqueness tests in isolation

## Running the Tests

You can run these tests using the main test runner:

```
@tests/test-runner.html
```

Or you can run the standalone test page:

```
@tests/job-filters/test-job-filter-uniqueness.html
```
