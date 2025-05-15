# Integration Tests

This directory contains integration tests for the Fill-In project that test multiple components working together.

## Test Files

Currently, there are no dedicated integration test files in this directory. Integration tests for specific features are located in their respective directories.

## Planned Tests

- `test-end-to-end-workflow.js`: End-to-end tests for the complete workflow
  - Job scraping
  - Job filtering
  - CV tailoring
  - Form filling

- `test-data-persistence.js`: Tests for data persistence across components
  - Saving and loading job listings
  - Saving and loading job filters
  - Saving and loading user data

## Running the Tests

Once implemented, you will be able to run these tests using the main test runner:

```
@tests/test-runner.html
```
