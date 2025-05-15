# Fill-in
*This is a work in progress.*

A chrome extension (Manifest V3) to filter related jobs from linked-in and fill in your data. I am tired of those corperate shitty forms and mentally-unstable job descriptions.

The extension has two main parts:
1. The form filler part, which fills in the form fields on the website you are on.
2. The job scraper part, which scrapes jobs from LinkedIn and shows them in a popup. It also tailors a CV for each job.

## Features

Fill-in comes with three main features:

- **[Job Scraper](wiki/job-scraper.md)**: Automatically scrapes job listings from LinkedIn based on your preferences
- **[CV Tailoring](wiki/cv-tailoring.md)**: Automatically tailors your CV for each job application
- **[Form Filler](wiki/form-filler.md)**: Automatically fills in job application forms with your information

For detailed information about each feature, please visit the [wiki](wiki/README.md).

## Installation

1. Download the extension files or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The Fill-in extension icon should now appear in your browser toolbar

## Usage

### Quick Start

1. **Job Scraper**: Click the Fill-in extension icon and select "Scrape LinkedIn Jobs" or "View Saved Jobs"
2. **CV Tailoring**: View a job's details and click the "Tailor CV" button
3. **Form Filler**: Navigate to a job application form and use Ctrl+Shift+F to auto-fill

For detailed usage instructions, please see the feature pages in the [wiki](wiki/README.md):
- [Job Scraper Usage](wiki/job-scraper.md#using-the-job-scraper)
- [CV Tailoring Usage](wiki/cv-tailoring.md#using-the-cv-tailoring-feature)
- [Form Filler Usage](wiki/form-filler.md#using-the-form-filler)

## Configuration

1. Click the Fill-in extension icon and select "Settings"
2. Fill in your personal information, which will be used to auto-fill forms
3. Configure job scraper settings and CV tailoring options
4. Customize which words to highlight in job descriptions
5. Use the Import/Export tab to backup or restore your settings

For detailed configuration options, please see the [Configuration](wiki/configuration.md) page in the wiki.

## CV Tailor Server

The CV tailoring feature requires a local server. For quick setup:

1. Navigate to the `tailor` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Install rendercv: `npm install -g rendercv`
4. Start the server: `python tailor.py server`

For detailed information about the CV Tailor Server, please see the [CV Tailoring](wiki/cv-tailoring.md#setting-up-the-cv-tailor-server) page in the wiki.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was created to save time and reduce frustration when applying for jobs
- Special thanks to all contributors who have helped improve this extension

---

For developers interested in contributing to this project, please see [DEVELOPERS.md](DEVELOPERS.md) for technical documentation, project structure, and development guidelines.
