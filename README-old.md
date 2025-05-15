*This is a work in progress.*

# Fill-in
chromium-based (Manifest V3) extension to filter related jobs from linked-in and fill in your data. I am tired of those corperate shitty forms and mentally-unstable job descriptions. 

The extension has two parts: 
1. The form filler part, which fills in the form fields on the website you are on. 
2. The job scraper part, which scrapes jobs from linkedin and shows them in a popup. It also tailors a CV for each job. 


## TODO
- [x] fix apply url
- [x] implement PIN, UNPIN
- [x] applied category for jobs
- [x] connect it with the python script to tailor the cv
- [x] tailor to handle multiple requests at the same time
- [x] shows a notification when the resume is done
- [x] the extension scrapes jobs in the background
- [x] when you archive or apply a job, remove the pin
- [x] when you click archive, the ui needs to updated correctly
- [x] hightlight the word experience in the job description
- [x] Words Filtering for job titles (not tested)
- [x] api Input in settings page
- [x] tabs: one for un-applied jobs and one for applied
- [x] sort them with date labels: last day, last week: before last month, ...
- [ ] some jobs without date?
- [ ] AI filtering for job descriptions (need a model for this, maybe qwen? which verison?) (https://huggingface.co/docs/transformers/en/model_doc/distilbert)
- [ ] test api key is not working
- [ ] fix the filling errors that appear in the console
- [ ] myworkday support
- [ ] support for companies' independent career sites

## Job Scraper

### Search Parameters
- Job Title
- Location
- Experience Level
- Posting Date

link to open linkedin and scrape from:

https://www.linkedin.com/jobs/search/?f_E=2%2C3&f_TPR=r604800&keywords=software%20engineer&location=Poland

Experience is a number: Internship -> 1, Entry Level -> 2 and so on f_E=2%2C3&
localtion for location
TPR for the showing jobs posted within the last week (604800 seconds). So, you would have to convert the times. f_TPR=r604800
for title keywords=software%20engineer&

### Errors
- [] fix the following error
Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
Context
background.js
Stack Trace
background.js:0 (anonymous function)


## Form Filler
### Supported Fields
- First Name, Last Name, Email, Phone, City, State, Country/Current location, Zip Code, LinkedIn URL, GitHub URL, Portfolio URL, work authorization status, salary expectations, current notice period, available to start, address.

### works on the following
- https://jobs.lever.co/instructure/8218b205-0c5c-4cc7-99a6-6ba4befec9ab/apply?source=LinkedIn
- https://careers.zenitech.co.uk/jobs/5454808-java-software-engineer/applications/new


### It breaks on the following
- https://www.opswat.com/jobs/4535955005?gh_jid=4535955005#application-form
- https://jobs.jobvite.com/ef-education-first/job/oOLQvfwE/apply?nl=1
- https://avisbudget.wd1.myworkdayjobs.com/en-US/ABG_Careers/job/Budapest-Service-Centre/Automation-Developer_R0174498?src=LinkedIn
- https://www.avisbudgetgroup.jobs/automation-developer/job/PAF-ABG-F95C890E-C277-4DA5-B6BF-C7274376CDA1_8392_1743186690_0?src=LinkedIn
- https://www.worldquant.com/career-listing/?application=4444526006

### Supported Sites
- General form filling - Implemented
- Myworkday - Not implemented yet
- jobs.lever.co - Not implemented yet

## Planned Features
- **Education**
    - Highest Level of Education
    - Major/Field of Study
    - Institution Name
- **Applicant Tracking Systems**
    - Greenhouse - Not implemented yet
    - Workable - Not implemented yet
    - SmartRecruiters - Not implemented yet
- **Job Boards**
    - Indeed - Not implemented yet
    - LinkedIn Apply Forms - Not implemented yet
    - Glassdoor Apply Forms - Not implemented yet
