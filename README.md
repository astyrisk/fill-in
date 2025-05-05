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
- [ ] fix apply url 
- [ ] implement applied category for jobs

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





<button role="link" aria-label="Apply to Test Automation Engineer  on company website" id="jobs-apply-button-id" class="jobs-apply-button artdeco-button artdeco-button--icon-right artdeco-button--3 artdeco-button--primary ember-view" data-live-test-job-apply-button="">        
         
<svg role="none" aria-hidden="true" class="artdeco-button__icon " xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" data-supported-dps="16x16" data-test-icon="link-external-small"> <use href="#link-external-small" width="16" height="16"></use> </svg>

<span class="artdeco-button__text">
    Apply
</span>

</button>



onClickUpdate



// file name = > 3i3xwuuxlymaqdmv1p4clzey9
onApplyClick() {
    var e, t
    const {companyApplyUrl: n, onsiteApply: i} = (null === (e = this.args.jobApplyCard.jobPostingCard.primaryActionV2) || void 0 === e || null === (t = e.applyJobAction) || void 0 === t ? void 0 : t.applyJobActionResolutionResult) ?? {}
    if (i) {
        const e = (0,
        h.addQueryParams)(`${(0,
        h.getDomainUrl)()}/jobs/view/${this.jobId}/apply`, {
            trackingId: this.args.trackingId,
            refId: this.args.jobApplyCard.jobTrackingData.referenceId
        })
        this.windowService.open(e)
    } else
        n && this.windowService.open(n)
    this.fireApplyClickEvent()
    this.fireCoachActionEvent()
}
