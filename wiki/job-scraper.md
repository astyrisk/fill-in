# Job Scraper

The Job Scraper is a core feature of Fill-in that automatically scrapes job listings from LinkedIn based on your preferences.

## Features

- **Customizable Search Filters**: Set job title, location, experience level, and posting date
- **Multiple Job Filters**: Create and manage different search configurations
- **Background Scraping**: Runs in the background without requiring LinkedIn to be open
- **Job Organization**: Sort jobs by date with fold/unfold functionality
- **Job Management**: Pin important listings, mark jobs as applied, or archive them
- **Highlighted Keywords**: Easily spot important terms like "experience" in job descriptions
- **Word Filtering**: Filter out job titles containing specific words
- **Import/Export**: Backup and restore your settings and scraped jobs

## How It Works

The Job Scraper uses LinkedIn's search parameters to find relevant job listings:

- Experience level is mapped to numbers (Internship -> 1, Entry Level -> 2, etc.) using `f_E=2%2C3`
- Posting date is converted to seconds (e.g., past week = 604800 seconds) using `f_TPR=r604800`
- Job title is encoded in the URL as `keywords=software%20engineer`
- Location is included as `location=Poland`

## Using the Job Scraper

1. Click the Fill-in extension icon and select "Scrape LinkedIn Jobs" or "View Saved Jobs"
2. Configure your job filters with job title, location, and experience level
3. View and manage scraped jobs in the job listings page
4. Use the tabs to switch between un-applied, applied, and archived jobs

## Job Filter Configuration

Each job filter requires:
- **Job Title**: The position you're looking for (e.g., "Software Engineer")
- **Location**: Where you want to work (e.g., "New York")
- **Experience Level**: Your experience level (e.g., "Entry Level", "Associate", "Mid-Senior")
- **Posting Date**: How recent the job posting should be (defaults to 7 days)

## Job Management

The Job Scraper provides several ways to manage your job listings:

- **Pin**: Mark important jobs to keep them at the top of the list
- **Apply**: Mark jobs as applied to track your applications
- **Archive**: Hide jobs you're not interested in
- **View**: See the full job details
- **Open**: Open the job listing directly on LinkedIn

## Word Filtering

You can configure words that should be excluded from job titles. Jobs containing these words will not be scraped, helping you filter out irrelevant positions.

## Date Categories

Jobs are automatically organized into date categories:
- Pinned
- Past 24 Hours
- Past Week
- Past Month
- Older

Each category can be folded or unfolded to help you focus on the most relevant listings.
