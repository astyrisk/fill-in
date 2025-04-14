// Saves options to chrome.storage.sync
function saveOptions() {
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  // Get other fields...

  chrome.storage.sync.set(
    {
      userData: {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        // Add other fields...
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
        // Set other fields...
      }
    }
  );
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);