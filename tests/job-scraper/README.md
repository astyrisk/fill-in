# Job Scraper Tests

This directory contains tests for the LinkedIn job scraping functionality of the Fill-In extension.

## Test Files

- `test-job-title-exclusion.js`: Tests for the job title exclusion feature
  - Basic exclusion functionality
  - Case insensitivity
  - Partial word matching

- `test-posting-date-conversion.js`: Tests for posting date conversion
  - Converting days to seconds for LinkedIn URL parameters
  - Handling different time periods (1 day, 1 week, etc.)

## Running the Tests

You can run these tests using the main test runner:

```
@tests/test-runner.html
```

Or you can run them directly in the browser console by loading the individual test files.
