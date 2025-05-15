# Fill-in
*This is a work in progress.*


A chrome extension (Manifest V3) to filter related jobs from linked-in and fill in your data. I am tired of those corperate shitty forms and mentally-unstable job descriptions. 

The extension has two main parts:
1. The form filler part, which fills in the form fields on the website you are on.
2. The job scraper part, which scrapes jobs from LinkedIn and shows them in a popup. It also tailors a CV for each job.

![Fill-in Logo](icons/icon128.png)

## Features

### Job Scraper
Automatically scrapes job listings from LinkedIn based on your preferences:

- **Customizable Search Filters**: Set job title, location, experience level, and posting date
- **Multiple Job Filters**: Create and manage different search configurations
- **Background Scraping**: Runs in the background without requiring LinkedIn to be open
- **Job Organization**: Sort jobs by date with fold/unfold functionality
- **Job Management**: Pin important listings, mark jobs as applied, or archive them
- **Highlighted Keywords**: Easily spot important terms like "experience" in job descriptions
- **Word Filtering**: Filter out job titles containing specific words

LinkedIn search parameters are automatically constructed:
- Experience level is mapped to numbers (Internship -> 1, Entry Level -> 2, etc.) using `f_E=2%2C3`
- Posting date is converted to seconds (e.g., past week = 604800 seconds) using `f_TPR=r604800`
- Job title is encoded in the URL as `keywords=software%20engineer`
- Location is included as `location=Poland`

### CV Tailoring
Automatically tailors your CV for each job application:

- **AI-Powered**: Uses DeepSeek V3 API to customize your CV based on job descriptions
- **Status Tracking**: Monitor the tailoring process for each job listing
- **Multiple Requests**: Handles multiple tailoring requests simultaneously

### Form Filler
Automatically fills in job application forms with your information:

- **Personal Information**: Name, email, phone, location details, address
- **Professional Links**: LinkedIn, GitHub, portfolio URLs
- **Employment Details**: Work authorization, salary expectations, notice period, available start date
- **Smart Field Detection**: Identifies form fields across different websites and formats
- **Keyboard Shortcut**: Trigger form filling with Ctrl+Shift+F (Cmd+Shift+F on Mac)

#### Supported Sites
- General form filling - Implemented
- Works well on:
  - jobs.lever.co
  - careers.zenitech.co.uk
- Known issues with:
  - opswat.com
  - jobs.jobvite.com
  - myworkday sites (implementation in progress)

## Installation

1. Download the extension files or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The Fill-in extension icon should now appear in your browser toolbar

## Usage

### Job Scraper
1. Click the Fill-in extension icon and select "Scrape LinkedIn Jobs" or "View Saved Jobs"
2. Configure your job filters with job title, location, and experience level
3. View and manage scraped jobs in the job listings page
4. Use the tabs to switch between un-applied, applied, and archived jobs

### CV Tailoring
1. Open the settings page and configure your DeepSeek V3 API key
2. View a job's details and click the "Tailor CV" button
3. Monitor the tailoring status for each job

### Form Filler
1. Navigate to a job application form
2. Click the Fill-in extension icon and select "Auto-Fill Form Fields" or use the keyboard shortcut (Ctrl+Shift+F)
3. The extension will automatically fill in the form with your information

## Configuration

1. Click the Fill-in extension icon and select "Settings"
2. Fill in your personal information, which will be used to auto-fill forms
3. Configure job scraper settings and CV tailoring options
4. Customize which words to highlight in job descriptions

## CV Tailor Server

The CV tailoring feature requires a local server:

1. Navigate to the `tailor` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Install rendercv: `npm install -g rendercv`
4. Start the server: `python tailor.py server`

## Development

### Project Structure
- `background.js`: Main background script for the extension
- `form-filler/`: Form filling functionality
- `job-scraper/`: LinkedIn job scraping functionality
- `tailor/`: CV tailoring server
- `tests/`: Test cases for various features

### Running Tests
Open the test runner in your browser:
```
tests/test-runner.html
```

## Roadmap
### 0.2.0
- [ ] how to deal with jobs without date information
- [ ] test api key validation
- [ ] user should be able to control tailor's prompt
- [ ] import/export settings and jobs
- [ ] link settings to the listing and vice versa
- [ ] option to reset all jobs and settings.
- [ ] tutorial on how to use the extension
- [ ] unify tests
- [ ] separate it to a normal wiki and developer wiki
### 0.3.0
- [ ] AI filtering for job descriptions
- [ ] optimize memory usage
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

### In Progress

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created to save time and reduce frustration when applying for jobs
- Special thanks to all contributors who have helped improve this extension
