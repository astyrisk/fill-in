Now, I need to scrape the following URL COMPANY SITE from the job details page and I need you to show it in the Apply URL:


there are three cases


1. No longer accepting applications
<span class="artdeco-inline-feedback__message">
      No longer accepting applications
<!---->  </span>


2. Apply on linkedin (Easy apply)

if it's the following just show a url for the job linked posting that is already scraped

<button aria-label="Easy Apply to Java Software Engineer at Shiwaforce" id="jobs-apply-button-id" class="jobs-apply-button
         artdeco-button artdeco-button--3 artdeco-button--primary ember-view" data-job-id="4212024360" data-live-test-job-apply-button="">        <svg role="none" aria-hidden="true" class="artdeco-button__icon artdeco-button__icon--in-bug" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" data-supported-dps="14x14" data-test-icon="linkedin-bug-xxsmall">
<!---->    
    <use href="#linkedin-bug-xxsmall" width="14" height="14"></use>
</svg>


<span class="artdeco-button__text">
    Easy Apply
</span></button>



3. Apply on company site


the url is not in the button. it executes some js code. For now, don't scrape it. Just show the button text "Apply on company site"
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
