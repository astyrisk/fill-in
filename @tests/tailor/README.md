# CV Tailor Tests

This directory contains tests for the CV tailoring functionality of the Fill-In project.

## Test Files

- `test_tailor_api.py`: Tests for the tailor API endpoints
  - Health endpoint
  - Tailor endpoint
  - API key configuration
  - CV generation

## Running the Tests

You can run these tests using the Python unittest framework:

```bash
cd @tests/tailor
python -m unittest discover
```

Or run a specific test file:

```bash
cd @tests/tailor
python -m unittest test_tailor_api.py
```

## Test Coverage

The tests cover the following functionality:

- API endpoints
  - Health check
  - Tailor CV
  - Update configuration
  - Test API key

- CV generation
  - Parsing job descriptions
  - Calling the OpenRouter API
  - Processing the API response
  - Generating PDF files

## Adding New Tests

When adding new tests:

1. Create a new test file with the `test_` prefix
2. Use the unittest framework
3. Mock external dependencies (API calls, file operations, etc.)
4. Focus on testing one component or function per test case
