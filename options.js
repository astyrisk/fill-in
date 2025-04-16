// Saves options to chrome.storage.sync
function saveOptions() {
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;

  // Location fields
  const city = document.getElementById('city').value;
  const state = document.getElementById('state').value;
  const country = document.getElementById('country').value;
  const zipCode = document.getElementById('zipCode').value;

  // Social & Portfolio fields
  const linkedinUrl = document.getElementById('linkedinUrl').value;
  const githubUrl = document.getElementById('githubUrl').value;
  const portfolioUrl = document.getElementById('portfolioUrl').value;

  // Employment Details fields
  const workAuth = document.getElementById('workAuth').value;
  const visaSponsorship = document.getElementById('visaSponsorship').value;
  const salaryExpectations = document.getElementById('salaryExpectations').value;
  const noticePeriod = document.getElementById('noticePeriod').value;
  const availableToStart = document.getElementById('availableToStart').value;

  // Additional Information fields
  const englishFluency = document.getElementById('englishFluency').value;
  const relatedToAnyone = document.getElementById('relatedToAnyone').value;

  chrome.storage.sync.set(
    {
      userData: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        // Location data
        city: city,
        state: state,
        country: country,
        zipCode: zipCode,
        // Social & Portfolio data
        linkedinUrl: linkedinUrl,
        githubUrl: githubUrl,
        portfolioUrl: portfolioUrl,
        // Employment Details data
        workAuth: workAuth,
        visaSponsorship: visaSponsorship,
        salaryExpectations: salaryExpectations,
        noticePeriod: noticePeriod,
        availableToStart: availableToStart,
        // Additional Information data
        englishFluency: englishFluency,
        relatedToAnyone: relatedToAnyone
      }
    },
    () => {
      // Update status to let user know options were saved.
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 1500);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  // Use default values if nothing is stored
  chrome.storage.sync.get(
    { userData: {} }, // Default to empty object if not set
    (items) => {
      if (items.userData) {
        document.getElementById('firstName').value = items.userData.firstName || '';
        document.getElementById('lastName').value = items.userData.lastName || '';
        document.getElementById('email').value = items.userData.email || '';
        document.getElementById('phone').value = items.userData.phone || '';

        // Restore location fields
        document.getElementById('city').value = items.userData.city || '';
        document.getElementById('state').value = items.userData.state || '';
        document.getElementById('country').value = items.userData.country || '';
        document.getElementById('zipCode').value = items.userData.zipCode || '';

        // Restore social & portfolio fields
        document.getElementById('linkedinUrl').value = items.userData.linkedinUrl || '';
        document.getElementById('githubUrl').value = items.userData.githubUrl || '';
        document.getElementById('portfolioUrl').value = items.userData.portfolioUrl || '';

        // Restore employment details fields
        document.getElementById('workAuth').value = items.userData.workAuth || '';
        document.getElementById('visaSponsorship').value = items.userData.visaSponsorship || '';
        document.getElementById('salaryExpectations').value = items.userData.salaryExpectations || '';
        document.getElementById('noticePeriod').value = items.userData.noticePeriod || '';
        document.getElementById('availableToStart').value = items.userData.availableToStart || '';

        // Restore additional information fields
        document.getElementById('englishFluency').value = items.userData.englishFluency || '';
        document.getElementById('relatedToAnyone').value = items.userData.relatedToAnyone || '';
      }
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);