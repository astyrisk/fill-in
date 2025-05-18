# Fill-In Project Test Suite

This directory contains all tests for the Fill-In project. The tests are organized by functionality to improve discoverability and maintenance.

## Test Structure

- `job-filters/` - Tests for job filter functionality
  - Basic filter creation and management
  - Filter uniqueness validation
  - Edge cases for filter handling

- `job-scraper/` - Tests for LinkedIn job scraping functionality
  - Job title exclusion
  - Posting date conversion
  - Direct URL scraping

- `form-filler/` - Tests for form filling functionality
  - Field detection
  - Data insertion
  - Special form handling (Angular, etc.)

- `tailor/` - Tests for CV tailoring functionality
  - API endpoints
  - PDF generation
  - Request handling

- `integration/` - End-to-end and integration tests
  - Full workflow tests
  - Cross-component functionality

- `utils/` - Test utilities and helpers
  - Mock data
  - Test helpers
  - Common test functions

## Running Tests

### JavaScript Tests

For browser-based JavaScript tests, open the test runner in your browser:

```
@tests/test-runner.html
```

This will run all JavaScript tests and display the results in the browser.

### Python Tests

For Python tests (primarily for the tailor service), run:

```bash
cd @tests/tailor
python -m unittest discover
```

## Adding New Tests

When adding new tests:

1. Place the test in the appropriate subdirectory based on functionality
2. Follow the naming convention:
   - JavaScript: `test-[feature-name].js`
   - Python: `test_[feature_name].py`
3. Update the test runner if necessary
4. Document the test purpose in a comment at the top of the file

## Test Conventions

### JavaScript Tests

JavaScript tests should:
- Export a `runAllTests()` function that runs all tests in the file
- Log test results to the console
- Return a boolean indicating whether all tests passed

### Python Tests

Python tests should:
- Use the `unittest` framework
- Include appropriate assertions
- Be runnable individually or as part of the test suite

## Continuous Integration

The test suite is designed to be run in a CI environment. The CI configuration will:
1. Run all JavaScript tests using a headless browser
2. Run all Python tests
3. Report test results and coverage
