# Fill-in Developer Documentation

This document provides technical information for developers who want to contribute to the Fill-in Chrome extension.

## Project Structure

- `background.js`: Main background script for the extension
- `form-filler/`: Form filling functionality
- `job-scraper/`: LinkedIn job scraping functionality
- `options/`: Settings page and related functionality
- `popup/`: Extension popup interface
- `tailor/`: CV tailoring server
- `@tests/`: Unified test suite organized by functionality
  - `job-filters/`: Tests for job filter functionality
  - `job-scraper/`: Tests for job scraping functionality
  - `form-filler/`: Tests for form filling functionality
  - `tailor/`: Tests for CV tailoring functionality
  - `integration/`: End-to-end and integration tests
  - `utils/`: Test utilities and helpers

## Technical Details

### LinkedIn Job Scraping

LinkedIn search parameters are automatically constructed:
- Experience level is mapped to numbers (Internship -> 1, Entry Level -> 2, etc.) using `f_E=2%2C3`
- Posting date is converted to seconds (e.g., past week = 604800 seconds) using `f_TPR=r604800`
- Job title is encoded in the URL as `keywords=software%20engineer`
- Location is included as `location=Poland`

### Running Tests

#### JavaScript Tests
Open the test runner in your browser:
```
@tests/test-runner.html
```

#### Python Tests
For the tailor service tests:
```bash
cd @tests/tailor
python run_tests.py
```

## Development Roadmap

### 0.2.0
- [x] optimize memory and localstorage usage
- [x] link settings to the listing and vice versa
- [x] user should be able to control tailor's prompt
- [x] import/export settings and jobs
- [x] option to reset all jobs and settings.
- [x] archive/apply/pin/unpin shouldn't render the whole UI
- [x] api key not working
- [ ] fix the tailor
  - Only the content should be sent to deepseek, not the entire yaml format.
- [x] unify tests
- [x] separate it to a normal wiki and developer wiki
- [ ] implement select/unselect
- [ ] fetch all jobs details button
- [ ] implememnt freedom to move the blocks down/up by drag and drop
- [ ] feature to copy generated pdf name
- [ ] header's UI consistency
- [ ] delete should permanently delete the job
- [ ] undo option after actions
- [ ] tutorial on how to use the extension

### 0.3.0
- [ ] how to deal with jobs without date information
- [ ] AI filtering for job descriptions
- [ ] more optimizations
- [ ] is there a way to this without having to login?
- [ ] Fix form filling errors appearing in console
- [ ] Support for myworkday sites
- [ ] Support for companies' independent career sites
- [ ] Support for additional job sites (Indeed, Glassdoor)
- [ ] Support for more applicant tracking systems (Greenhouse, Workable, SmartRecruiters)
- [ ] Education field auto-filling
  - Highest Level of Education
  - Major/Field of Study
  - Institution Name

### Completed
- [x] Fix apply URL functionality
- [x] Implement PIN and UNPIN features
- [x] Add applied category for jobs
- [x] Connect with Python script to tailor CV
- [x] Enable tailor service to handle multiple requests simultaneously
- [x] Show notification when resume tailoring is complete
- [x] Background job scraping without requiring LinkedIn to be open
- [x] Remove pin when archiving or applying to a job
- [x] Update UI correctly when archiving jobs
- [x] Highlight the word "experience" in job descriptions
- [x] Add word filtering for job titles
- [x] Add API input in settings page
- [x] Create tabs for un-applied and applied jobs
- [x] Sort jobs with date labels (last day, last week, etc.)

## Contributing Guidelines

1. **Fork the Repository**: Create your own fork of the project
2. **Create a Feature Branch**: Make your changes in a new branch
3. **Follow Code Style**: Maintain consistent coding style with the rest of the project
4. **Write Tests**: Add tests for any new functionality
5. **Document Your Changes**: Update documentation to reflect your changes
6. **Submit a Pull Request**: Open a PR with a clear description of your changes

## Development Environment Setup

1. Clone the repository
2. Load the unpacked extension in Chrome's developer mode
3. For the CV tailoring server:
   - Install Python dependencies: `pip install -r requirements.txt`
   - Install rendercv: `npm install -g rendercv`
   - Start the server in development mode: `python tailor.py server --dev`

## Debugging Tips

- Use Chrome's developer tools to debug the extension
- Check the console for error messages
- For background script issues, go to `chrome://extensions/`, find Fill-in, and click "background page" under "Inspect views"
- For content script issues, open the developer tools on the page where the extension is active

## Architecture Overview

The extension follows a modular architecture:

1. **Background Script**: Handles events and coordinates between modules
2. **Job Scraper Module**: Manages LinkedIn job scraping and storage
3. **Form Filler Module**: Detects and fills form fields
4. **CV Tailoring Module**: Communicates with the local tailoring server
5. **Settings Module**: Manages user configuration (located in the `options/` directory)
6. **Popup Module**: Provides quick access to main features

Each module is designed to be independent, making the codebase easier to maintain and extend.
