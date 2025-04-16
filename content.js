/**
 * Fill-In Extension - Content Script
 * 
 * Main entry point for the extension's content script.
 * This script automatically fills in form fields on web pages using user data
 * stored in Chrome's sync storage.
 */

console.log("Content Script Loaded");

/**
 * Main function to attempt autofilling form fields
 */
function tryAutoFill() {
  console.log("Attempting to autofill...");

  // Check if this is an Angular form and handle it specially
  if (isAngularForm()) {
    console.log("Angular form detected, using special handling");
    handleAngularForms();
  }

  // 1. Get user data from storage
  chrome.storage.sync.get({ userData: {} }, (items) => {
    const userData = items.userData;

    if (!userData || !userData.email) { // Check if essential data exists
      console.warn("User data not found or incomplete in storage. Please set it in the extension options.");
      return;
    }

    console.log("Retrieved user data:", userData);

    // 2. Find and fill form fields using common selectors that work across most websites
    
    // Personal information fields
    const firstNameFilled = fillPersonalInfoFields(userData);
    const lastNameFilled = fillLastNameFields(userData);
    const emailFilled = fillEmailFields(userData);
    const phoneFilled = fillPhoneFields(userData);
    
    // Location fields
    const cityFilled = fillCityFields(userData);
    const stateFilled = fillStateFields(userData);
    const countryFilled = fillCountryFields(userData);
    const zipFilled = fillZipCodeFields(userData);
    
    // Social profile fields
    const linkedinFilled = fillLinkedInFields(userData, firstNameFilled);
    const githubFilled = fillGitHubFields(userData);
    const portfolioFilled = fillPortfolioFields(userData);
    
    // Employment details fields
    const workAuthFilled = fillWorkAuthFields(userData);
    const visaSponsorshipFilled = fillVisaSponsorshipFields(userData);
    const salaryFilled = fillSalaryFields(userData);
    const noticePeriodFilled = fillNoticePeriodFields(userData);
    const availableToStartFilled = fillAvailableToStartFields(userData);
    
    // Handle specific form fields
    const citizenshipFilled = handleCitizenshipFields(userData);
    const salaryHufFilled = fillSalaryHufFields(userData);
    const specificNoticePeriodFilled = fillSpecificNoticePeriodFields(userData);
    const englishFluencyFilled = handleEnglishFluencyFields(userData);
    const relatedToAnyoneFilled = fillRelatedToAnyoneFields(userData);

    // Log results
    logFilledFields({
      firstNameFilled, lastNameFilled, emailFilled, phoneFilled,
      cityFilled, stateFilled, countryFilled, zipFilled,
      linkedinFilled, githubFilled, portfolioFilled,
      workAuthFilled, visaSponsorshipFilled, salaryFilled, noticePeriodFilled, availableToStartFilled,
      citizenshipFilled, salaryHufFilled, specificNoticePeriodFilled, englishFluencyFilled, relatedToAnyoneFilled
    });

    // Try to fill name field if first and last name weren't filled separately
    if (!firstNameFilled && !lastNameFilled) {
      fillFullNameField(userData);
    }

    console.log("Autofill attempt finished.");
  });
}

// --- Field filling functions ---

function fillPersonalInfoFields(userData) {
  return fillInput('input[autocomplete="given-name"]', userData.firstName) ||
    fillInput('input[id*="first_name"]', userData.firstName) ||
    fillInput('input[id*="firstName"]', userData.firstName) ||
    fillInput('input[name*="first_name"]', userData.firstName) ||
    fillInput('input[name*="firstName"]', userData.firstName) ||
    fillInput('input[placeholder*="First name"]', userData.firstName) ||
    fillInput('input[placeholder*="first name"]', userData.firstName) ||
    fillInput('input[aria-label*="First name"]', userData.firstName) ||
    fillInputByLabel('First Name', userData.firstName);
}

function fillLastNameFields(userData) {
  return fillInput('input[autocomplete="family-name"]', userData.lastName) ||
    fillInput('input[id*="last_name"]', userData.lastName) ||
    fillInput('input[id*="lastName"]', userData.lastName) ||
    fillInput('input[name*="last_name"]', userData.lastName) ||
    fillInput('input[name*="lastName"]', userData.lastName) ||
    fillInput('input[placeholder*="Last name"]', userData.lastName) ||
    fillInput('input[placeholder*="last name"]', userData.lastName) ||
    fillInput('input[aria-label*="Last name"]', userData.lastName) ||
    fillInputByLabel('Last Name', userData.lastName);
}

function fillEmailFields(userData) {
  return fillInput('input[autocomplete="email"]', userData.email) ||
    fillInput('input[type="email"]', userData.email) ||
    fillInput('input[id*="email"]', userData.email) ||
    fillInput('input[name*="email"]', userData.email) ||
    fillInput('input[placeholder*="Email"]', userData.email) ||
    fillInput('input[placeholder*="email"]', userData.email) ||
    fillInput('input[aria-label*="Email"]', userData.email) ||
    fillInputByLabel('Email', userData.email);
}

function fillPhoneFields(userData) {
  return fillInput('input[autocomplete="tel"]', userData.phone) ||
    fillInput('input[type="tel"]', userData.phone) ||
    fillInput('input[id*="phone"]', userData.phone) ||
    fillInput('input[name*="phone"]', userData.phone) ||
    fillInput('input[placeholder*="Phone"]', userData.phone) ||
    fillInput('input[placeholder*="phone"]', userData.phone) ||
    fillInput('input[aria-label*="Phone"]', userData.phone) ||
    fillInputByLabel('Phone', userData.phone);
}

function fillCityFields(userData) {
  return fillInput('input[autocomplete="address-level2"]', userData.city) ||
    fillInput('input[id*="city"]', userData.city) ||
    fillInput('input[name*="city"]', userData.city) ||
    fillInput('input[placeholder*="City"]', userData.city) ||
    fillInput('input[placeholder*="city"]', userData.city) ||
    fillInput('input[aria-label*="City"]', userData.city) ||
    fillInputByLabel('City', userData.city);
}

function fillStateFields(userData) {
  return fillInput('input[id*="state"]', userData.state) ||
    fillInput('input[name*="state"]', userData.state) ||
    fillInput('input[placeholder*="State"]', userData.state) ||
    fillInput('input[placeholder*="state"]', userData.state) ||
    fillInput('input[aria-label*="State"]', userData.state) ||
    fillInput('select[id*="state"]', userData.state) ||
    fillInput('select[name*="state"]', userData.state);
}

function fillCountryFields(userData) {
  return fillInput('select[autocomplete="country-name"]', userData.country) ||
    fillInput('input[autocomplete="country-name"]', userData.country) ||
    fillInput('input[id*="country"]', userData.country) ||
    fillInput('input[name*="country"]', userData.country) ||
    fillInput('input[placeholder*="Country"]', userData.country) ||
    fillInput('input[placeholder*="country"]', userData.country) ||
    fillInput('input[aria-label*="Country"]', userData.country) ||
    fillInput('select[id*="country"]', userData.country) ||
    fillInput('select[name*="country"]', userData.country) ||
    fillInput('input[id*="location"]', userData.country) ||
    fillInput('input[name*="location"]', userData.country) ||
    fillInput('input[placeholder*="Location"]', userData.country) ||
    fillInput('input[placeholder*="location"]', userData.country) ||
    fillInput('input[aria-label*="Location"]', userData.country) ||
    fillInputByLabel('Country', userData.country);
}

function fillZipCodeFields(userData) {
  return fillInput('input[id*="zip"]', userData.zipCode) ||
    fillInput('input[name*="zip"]', userData.zipCode) ||
    fillInput('input[placeholder*="Zip"]', userData.zipCode) ||
    fillInput('input[placeholder*="zip"]', userData.zipCode) ||
    fillInput('input[aria-label*="Zip"]', userData.zipCode) ||
    fillInput('input[id*="postal"]', userData.zipCode) ||
    fillInput('input[name*="postal"]', userData.zipCode) ||
    fillInput('input[placeholder*="Postal"]', userData.zipCode) ||
    fillInput('input[placeholder*="postal"]', userData.zipCode) ||
    fillInput('input[aria-label*="Postal"]', userData.zipCode);
}

function fillLinkedInFields(userData, firstNameFilled) {
  // Only attempt to fill LinkedIn URL if first name was successfully filled
  // This prevents LinkedIn URL from being incorrectly placed in first name field
  if (!firstNameFilled) {
    console.log("Skipping LinkedIn URL fill until first name is filled");
    return false;
  }
  
  return fillInput('input[id*="linkedin"]', userData.linkedinUrl) ||
    fillInput('input[name*="linkedin"]', userData.linkedinUrl) ||
    fillInput('input[name="urls[LinkedIn]"]', userData.linkedinUrl) ||
    fillInput('input[placeholder*="LinkedIn"]', userData.linkedinUrl) ||
    fillInput('input[placeholder*="linkedin"]', userData.linkedinUrl) ||
    fillInput('input[aria-label*="LinkedIn"]', userData.linkedinUrl) ||
    fillInputByLabel('LinkedIn URL', userData.linkedinUrl) ||
    fillInputByLabel('LinkedIn', userData.linkedinUrl);
}

function fillGitHubFields(userData) {
  return fillInput('input[id*="github"]', userData.githubUrl) ||
    fillInput('input[name*="github"]', userData.githubUrl) ||
    fillInput('input[name="urls[Github]"]', userData.githubUrl) ||
    fillInput('input[placeholder*="GitHub"]', userData.githubUrl) ||
    fillInput('input[placeholder*="github"]', userData.githubUrl) ||
    fillInput('input[aria-label*="GitHub"]', userData.githubUrl) ||
    fillInputByLabel('Github URL', userData.githubUrl) ||
    fillInputByLabel('GitHub URL', userData.githubUrl) ||
    fillInputByLabel('Github', userData.githubUrl) ||
    fillInputByLabel('GitHub', userData.githubUrl);
}

function fillPortfolioFields(userData) {
  return fillInput('input[id*="portfolio"]', userData.portfolioUrl) ||
    fillInput('input[name*="portfolio"]', userData.portfolioUrl) ||
    fillInput('input[name="urls[Portfolio]"]', userData.portfolioUrl) ||
    fillInput('input[placeholder*="Portfolio"]', userData.portfolioUrl) ||
    fillInput('input[placeholder*="portfolio"]', userData.portfolioUrl) ||
    fillInput('input[aria-label*="Portfolio"]', userData.portfolioUrl) ||
    fillInput('input[id*="website"]', userData.portfolioUrl) ||
    fillInput('input[name*="website"]', userData.portfolioUrl) ||
    fillInput('input[placeholder*="Website"]', userData.portfolioUrl) ||
    fillInput('input[placeholder*="website"]', userData.portfolioUrl) ||
    fillInput('input[aria-label*="Website"]', userData.portfolioUrl) ||
    fillInputByLabel('Portfolio URL', userData.portfolioUrl) ||
    fillInputByLabel('Portfolio', userData.portfolioUrl) ||
    fillInputByLabel('Website', userData.portfolioUrl) ||
    fillInputByLabel('Personal website', userData.portfolioUrl) ||
    fillInputByLabel('Other website', userData.portfolioUrl);
}

function fillWorkAuthFields(userData) {
  return fillInput('input[id*="work_auth"]', userData.workAuth) ||
    fillInput('input[name*="work_auth"]', userData.workAuth) ||
    fillInput('select[id*="work_auth"]', userData.workAuth) ||
    fillInput('select[name*="work_auth"]', userData.workAuth) ||
    fillInput('input[id*="workAuth"]', userData.workAuth) ||
    fillInput('input[name*="workAuth"]', userData.workAuth) ||
    fillInput('select[id*="workAuth"]', userData.workAuth) ||
    fillInput('select[name*="workAuth"]', userData.workAuth) ||
    fillInput('input[id*="authorization"]', userData.workAuth) ||
    fillInput('input[name*="authorization"]', userData.workAuth) ||
    fillInput('select[id*="authorization"]', userData.workAuth) ||
    fillInput('select[name*="authorization"]', userData.workAuth) ||
    fillInput('input[id*="right_to_work"]', userData.workAuth) ||
    fillInput('input[name*="right_to_work"]', userData.workAuth) ||
    fillInput('select[id*="right_to_work"]', userData.workAuth) ||
    fillInput('select[name*="right_to_work"]', userData.workAuth) ||
    fillInputByLabel('Work Authorization', userData.workAuth) ||
    fillInputByLabel('Work Authorization Status', userData.workAuth) ||
    fillInputByLabel('Are you authorized to work', userData.workAuth) ||
    fillInputByLabel('Legally authorized', userData.workAuth) ||
    fillInputByLabel('Right to work', userData.workAuth) ||
    fillInputByLabel('Work permit', userData.workAuth) ||
    fillInputByLabel('EU work authorization', userData.workAuth) ||
    fillInputByLabel('UK work authorization', userData.workAuth);
}

function fillVisaSponsorshipFields(userData) {
  return fillInput('input[id*="visa"]', userData.visaSponsorship) ||
    fillInput('input[name*="visa"]', userData.visaSponsorship) ||
    fillInput('select[id*="visa"]', userData.visaSponsorship) ||
    fillInput('select[name*="visa"]', userData.visaSponsorship) ||
    fillInput('input[id*="sponsorship"]', userData.visaSponsorship) ||
    fillInput('input[name*="sponsorship"]', userData.visaSponsorship) ||
    fillInput('select[id*="sponsorship"]', userData.visaSponsorship) ||
    fillInput('select[name*="sponsorship"]', userData.visaSponsorship) ||
    fillInputByLabel('Visa Sponsorship', userData.visaSponsorship) ||
    fillInputByLabel('Need Sponsorship', userData.visaSponsorship) ||
    fillInputByLabel('Require Sponsorship', userData.visaSponsorship) ||
    fillInputByLabel('Will you now or in the future require sponsorship', userData.visaSponsorship) ||
    fillInputByLabel('Do you require visa sponsorship', userData.visaSponsorship) ||
    fillInputByLabel('Do you need sponsorship', userData.visaSponsorship);
}

function fillSalaryFields(userData) {
  return fillInput('input[id*="salary"]', userData.salaryExpectations) ||
    fillInput('input[name*="salary"]', userData.salaryExpectations) ||
    fillInput('select[id*="salary"]', userData.salaryExpectations) ||
    fillInput('select[name*="salary"]', userData.salaryExpectations) ||
    fillInput('input[id*="compensation"]', userData.salaryExpectations) ||
    fillInput('input[name*="compensation"]', userData.salaryExpectations) ||
    fillInput('select[id*="compensation"]', userData.salaryExpectations) ||
    fillInput('select[name*="compensation"]', userData.salaryExpectations) ||
    fillInputByLabel('Salary', userData.salaryExpectations) ||
    fillInputByLabel('Salary Expectations', userData.salaryExpectations) ||
    fillInputByLabel('Expected Salary', userData.salaryExpectations) ||
    fillInputByLabel('Desired Salary', userData.salaryExpectations) ||
    fillInputByLabel('Compensation', userData.salaryExpectations) ||
    fillInputByLabel('Desired Compensation', userData.salaryExpectations);
}

function fillNoticePeriodFields(userData) {
  return fillInput('input[id*="notice"]', userData.noticePeriod) ||
    fillInput('input[name*="notice"]', userData.noticePeriod) ||
    fillInput('select[id*="notice"]', userData.noticePeriod) ||
    fillInput('select[name*="notice"]', userData.noticePeriod) ||
    fillInput('input[id*="notice_period"]', userData.noticePeriod) ||
    fillInput('input[name*="notice_period"]', userData.noticePeriod) ||
    fillInput('select[id*="notice_period"]', userData.noticePeriod) ||
    fillInput('select[name*="notice_period"]', userData.noticePeriod) ||
    fillInputByLabel('Notice Period', userData.noticePeriod) ||
    fillInputByLabel('Current Notice Period', userData.noticePeriod) ||
    fillInputByLabel('Notice', userData.noticePeriod);
}

function fillAvailableToStartFields(userData) {
  return fillInput('input[id*="available"]', userData.availableToStart) ||
    fillInput('input[name*="available"]', userData.availableToStart) ||
    fillInput('select[id*="available"]', userData.availableToStart) ||
    fillInput('select[name*="available"]', userData.availableToStart) ||
    fillInput('input[id*="start_date"]', userData.availableToStart) ||
    fillInput('input[name*="start_date"]', userData.availableToStart) ||
    fillInput('input[id*="startDate"]', userData.availableToStart) ||
    fillInput('input[name*="startDate"]', userData.availableToStart) ||
    fillInputByLabel('Available to Start', userData.availableToStart) ||
    fillInputByLabel('When can you start', userData.availableToStart) ||
    fillInputByLabel('Start Date', userData.availableToStart) ||
    fillInputByLabel('Earliest Start Date', userData.availableToStart);
}

function fillSalaryHufFields(userData) {
  if (!userData.salaryExpectations) return false;
  
  return fillInput('input[name*="salary"][placeholder="Type your response"]', userData.salaryExpectations) ||
    fillInput('input[name="cards[4cdd9b69-f47d-43bf-9fa5-5ca6aab388a2][field2]"]', userData.salaryExpectations) ||
    fillInputByLabel('salary expectations', userData.salaryExpectations) ||
    fillInputByLabel('gross HUF', userData.salaryExpectations);
}

function fillSpecificNoticePeriodFields(userData) {
  if (!userData.noticePeriod && !userData.availableToStart) return false;
  
  const noticeValue = userData.noticePeriod || userData.availableToStart;
  return fillInput('input[name="cards[4cdd9b69-f47d-43bf-9fa5-5ca6aab388a2][field3]"]', noticeValue) ||
    fillInputByLabel('notice period', noticeValue) ||
    fillInputByLabel('When would you be available', noticeValue);
}

function fillRelatedToAnyoneFields(userData) {
  if (!userData.relatedToAnyone) return false;
  
  return fillTextareaByLabel('related to anyone', userData.relatedToAnyone) ||
    fillInput('textarea[name="cards[4cdd9b69-f47d-43bf-9fa5-5ca6aab388a2][field4]"]', userData.relatedToAnyone);
}

function fillFullNameField(userData) {
  const fullName = `${userData.firstName} ${userData.lastName}`.trim();
  if (!fullName) return false;
  
  const nameFilled =
    fillInput('input[id*="name"]', fullName) ||
    fillInput('input[name*="name"]', fullName) ||
    fillInput('input[placeholder*="Name"]', fullName) ||
    fillInput('input[placeholder*="name"]', fullName) ||
    fillInput('input[aria-label*="Name"]', fullName);

  console.log("Full name field filled:", nameFilled);
  return nameFilled;
}

function logFilledFields(fields) {
  console.log("Fields filled - First name:", fields.firstNameFilled, "Last name:", fields.lastNameFilled,
             "Email:", fields.emailFilled, "Phone:", fields.phoneFilled);
  console.log("Location fields filled - City:", fields.cityFilled, "State:", fields.stateFilled,
             "Country:", fields.countryFilled, "Zip Code:", fields.zipFilled);
  console.log("Social fields filled - LinkedIn:", fields.linkedinFilled, "GitHub:", fields.githubFilled,
             "Portfolio:", fields.portfolioFilled);
  console.log("Employment details filled - Work Auth:", fields.workAuthFilled, "Visa Sponsorship:", fields.visaSponsorshipFilled,
             "Salary:", fields.salaryFilled, "Notice Period:", fields.noticePeriodFilled, "Available to Start:", fields.availableToStartFilled);
  console.log("Specific form fields filled - Citizenship:", fields.citizenshipFilled, "Salary HUF:", fields.salaryHufFilled,
             "Specific Notice Period:", fields.specificNoticePeriodFilled, "English Fluency:", fields.englishFluencyFilled,
             "Related to Anyone:", fields.relatedToAnyoneFilled);
}

// --- Event Listeners and Initialization ---

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "triggerAutofillFromPopup") {
    console.log("Autofill triggered from popup or keyboard shortcut.");
    showNotification("Auto-filling form fields...");
    tryAutoFill();
    sendResponse({ status: "Autofill initiated" });
  }
  return true; // Keep the message channel open for async response
});

// Initialize the extension
window.setTimeout(() => {
  if (checkForFormFields()) {
    addButton(tryAutoFill);

    // Check if this is an Angular form
    if (isAngularForm()) {
      console.log("Angular form detected, adding special handling");
      // Add a small delay to ensure Angular has initialized the form
      setTimeout(handleAngularForms, 500);
    }
  } else {
    console.log("No form fields detected on this page.");
  }
}, 1500);
