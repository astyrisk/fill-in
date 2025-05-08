# Fill-in
chromium-based (Manifest V3) extension to filter related jobs from linked-in and fill in your data. I am tired of those corperate shitty forms and mentally-unstable job descriptions.

*This is a work in progress.*

## Supported Fields
- First Name, Last Name, Email, Phone, City, State, Country/Current location, Zip Code, LinkedIn URL, GitHub URL, Portfolio URL, work authorization status, salary expectations, current notice period, available to start.

- Street Address
- Resume - Not implemented yet


                statusDisplay.textContent = 'Error: Cannot connect to page.';
                console.error("Popup Error:", chrome.runtime.lastError.message);


## TODO
- [x] fix apply url
- [x] implement PIN, UNPIN
- [x] applied category for jobs
- [x] connect it with the python script to tailor the cv
- [ ] tailor to handle multiple requests at the same time
- [ ] shows a notification when the resume is done

- [ ] when you click archive, the ui needs to updated correctly

- [ ] when you archive or apply a job, remove the pin

- [ ] myworkday support

## works on the following
- https://jobs.lever.co/instructure/8218b205-0c5c-4cc7-99a6-6ba4befec9ab/apply?source=LinkedIn
- https://careers.zenitech.co.uk/jobs/5454808-java-software-engineer/applications/new


## It breaks on the following
- https://www.opswat.com/jobs/4535955005?gh_jid=4535955005#application-form
- https://jobs.jobvite.com/ef-education-first/job/oOLQvfwE/apply?nl=1
- https://avisbudget.wd1.myworkdayjobs.com/en-US/ABG_Careers/job/Budapest-Service-Centre/Automation-Developer_R0174498?src=LinkedIn
- https://www.avisbudgetgroup.jobs/automation-developer/job/PAF-ABG-F95C890E-C277-4DA5-B6BF-C7274376CDA1_8392_1743186690_0?src=LinkedIn
- https://www.worldquant.com/career-listing/?application=4444526006

## Supported Sites
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




