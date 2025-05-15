// Background Service Worker
// This script runs as a service worker in the background

// Variables to track URL capture state
let isCapturingUrl = false;
let jobDetailsTabId = null;
let currentJobId = null;
let sourceJobUrl = null;
let pendingCapture = false;
let captureTimeoutId = null;

// Variables for direct URL scraping
let isProcessingFilters = false;
let currentFilterIndex = 0;
let totalFilters = 0;

// CV tailoring is now handled directly in job-listings.js with per-job status tracking
// No global notification system is needed anymore

// Function to construct LinkedIn search URL from job filter parameters
function constructLinkedInSearchUrl(filter) {
  if (!filter) {
    console.error("No filter provided to construct URL");
    return null;
  }

  // Base URL for LinkedIn job search
  let url = "https://www.linkedin.com/jobs/search/?";

  // Add job type (keywords)
  if (filter.jobType) {
    url += `keywords=${encodeURIComponent(filter.jobType)}`;
  }

  // Add location
  if (filter.location) {
    // For simplicity, we're using the location as provided
    url += `&location=${encodeURIComponent(filter.location)}`;
  }

  // Add distance (default to 25 miles)
  url += "&distance=25";

  // Add experience levels
  if (filter.experienceLevels && filter.experienceLevels.length > 0) {
    // LinkedIn uses f_E parameter for experience level
    // Values: 1 (Internship), 2 (Entry level), 3 (Associate), 4 (Mid-Senior), 5 (Director), 6 (Executive)
    url += `&f_E=${filter.experienceLevels.join("%2C")}`;
  }

  // Add posting date
  if (filter.postingDate) {
    // LinkedIn uses f_TPR parameter for time posted with format r[seconds]
    // Convert days directly to seconds for more precise time filtering
    const days = parseInt(filter.postingDate);
    // Calculate seconds: days * 24 hours * 60 minutes * 60 seconds
    const seconds = days * 24 * 60 * 60;
    const timePostedParam = `r${seconds}`;

    url += `&f_TPR=${timePostedParam}`;
  }

  // Add other common parameters
  url += "&origin=JOB_SEARCH_PAGE_JOB_FILTER&refresh=true";

  return url;
}

// Function to process filters one by one
function processNextFilter(filters, index, results, callback) {
  // Check if we've processed all filters
  if (index >= filters.length) {
    callback({
      status: `Processed ${results.length} of ${filters.length} filters`,
      processedCount: results.length,
      errors: results.filter(r => r.error).map(r => ({ filterId: r.filterId, error: r.error }))
    });
    return;
  }

  const filter = filters[index];

  // Update status for this filter
  chrome.runtime.sendMessage({
    action: "updateFilterScrapingStatus",
    filterId: filter.id,
    status: "processing"
  });

  // Construct the LinkedIn search URL
  const url = constructLinkedInSearchUrl(filter);
  if (!url) {
    const error = `Failed to construct URL for filter: ${filter.jobType} in ${filter.location}`;
    console.error(error);

    // Update status and continue to next filter
    chrome.runtime.sendMessage({
      action: "updateFilterScrapingStatus",
      filterId: filter.id,
      status: "failed",
      error: error
    });

    results.push({ filterId: filter.id, error: error });
    processNextFilter(filters, index + 1, results, callback);
    return;
  }

  console.log(`Processing filter ${index + 1}/${filters.length}: ${filter.jobType} in ${filter.location}`);
  console.log(`Using LinkedIn search URL: ${url}`);

  // Create a new tab with the LinkedIn search URL and make it active
  chrome.tabs.create({ url: url, active: true }, (tab) => {
    const tabId = tab.id;

    // Wait for the page to load
    chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        // Remove the listener to avoid multiple calls
        chrome.tabs.onUpdated.removeListener(listener);

        // Wait a bit for the page to fully render
        setTimeout(() => {
          console.log(`Injecting LinkedIn scraper script into tab ${tabId} for filter: ${filter.jobType} in ${filter.location}`);

          // Inject the LinkedIn scraper script
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['job-scraper/linkedin-scraper.js']
          }).then(() => {
            console.log(`Successfully injected LinkedIn scraper into tab ${tabId}`);

            // Wait a bit for the script to initialize
            setTimeout(() => {
              // Instead of trying to send a message, let's execute a script directly
              chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: (filter) => {
                  // This function will be executed in the context of the page
                  console.log("Starting direct scraping of LinkedIn jobs");

                  // Call the scrapeLinkedInJobs function if it exists
                  if (typeof scrapeLinkedInJobs === 'function') {
                    return scrapeLinkedInJobs(filter);
                  } else {
                    return { status: "Error: scrapeLinkedInJobs function not found" };
                  }
                },
                args: [filter]
              }).then((results) => {
                // Get the result from the script execution
                const scriptResult = results && results[0] && results[0].result;

                if (scriptResult && scriptResult.status) {
                  console.log(`Scraping completed for filter ${index + 1}: ${scriptResult.status}`);

                  // Update status
                  chrome.runtime.sendMessage({
                    action: "updateFilterScrapingStatus",
                    filterId: filter.id,
                    status: "completed"
                  });

                  results.push({ filterId: filter.id, success: true, status: scriptResult.status });
                } else {
                  const error = "Failed to scrape jobs - no valid result";
                  console.error(error);

                  // Update status
                  chrome.runtime.sendMessage({
                    action: "updateFilterScrapingStatus",
                    filterId: filter.id,
                    status: "failed",
                    error: error
                  });

                  results.push({ filterId: filter.id, error: error });
                }

                // Close the tab after scraping
                chrome.tabs.remove(tabId, () => {
                  if (chrome.runtime.lastError) {
                    console.log("Tab may have already been closed");
                  }
                });

                // Process the next filter after a delay
                setTimeout(() => {
                  processNextFilter(filters, index + 1, results, callback);
                }, 2000);
              }).catch((error) => {
                console.error("Error executing script:", error);

                // Update status
                chrome.runtime.sendMessage({
                  action: "updateFilterScrapingStatus",
                  filterId: filter.id,
                  status: "failed",
                  error: error.message
                });

                results.push({ filterId: filter.id, error: error.message });

                // Close the tab after scraping
                chrome.tabs.remove(tabId, () => {
                  if (chrome.runtime.lastError) {
                    console.log("Tab may have already been closed");
                  }
                });

                // Process the next filter after a delay
                setTimeout(() => {
                  processNextFilter(filters, index + 1, results, callback);
                }, 2000);
              });
            }, 3000); // Wait 3 seconds for the script to initialize
          }).catch(error => {
            console.error("Error injecting LinkedIn scraper:", error);

            // Update status
            chrome.runtime.sendMessage({
              action: "updateFilterScrapingStatus",
              filterId: filter.id,
              status: "failed",
              error: error.message
            });

            results.push({ filterId: filter.id, error: error.message });

            // Close the tab
            chrome.tabs.remove(tabId, () => {
              if (chrome.runtime.lastError) {
                console.log("Tab may have already been closed");
              }
            });

            // Process the next filter after a delay
            setTimeout(() => {
              processNextFilter(filters, index + 1, results, callback);
            }, 2000);
          });
        }, 8000); // Wait 8 seconds for the page to fully render
      }
    });
  });
}

// Listener for when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Form Fill Helper Extension Installed/Updated.");
  // You could potentially set default options here if needed
  // chrome.storage.sync.set({ userData: { firstName: "", ... } });
});

// Listener for messages from content scripts (optional for this basic setup,
// but useful for more complex interactions)
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("Message received in background:", request);

  if (request.action === "openJobTab") {
    if (request.url) {
      chrome.tabs.create({ url: request.url });
      sendResponse({ status: "Tab opening requested", url: request.url });
    } else {
       sendResponse({ status: "Error: No URL provided" });
    }
    return true; // Keep message channel open for async response
  }

  // Example: If content script needed data directly from background
  if (request.action === "getUserDataFromBackground") {
     chrome.storage.sync.get({ userData: {} }, (items) => {
        sendResponse({ userData: items.userData });
     });
     return true; // Indicate async response
  }

  // Handle job details scraping
  if (request.action === "scrapeJobDetails") {
    const { jobUrl, jobId, jobData } = request;
    console.log('Received job data for scraping:', jobData);

    if (!jobUrl) {
      sendResponse({ success: false, error: "No job URL provided" });
      return true;
    }

    console.log(`Scraping details for job ${jobId} at ${jobUrl}`);

    // Create a new tab to load the job page but make it hidden
    chrome.tabs.create({ url: jobUrl, active: false}, (tab) => {
      const tabId = tab.id;

      // Function to scrape the job details once the page is loaded
      const scrapeJobDetails = () => {
        // First inject the utils.js file which contains the date conversion function
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['shared/utils.js']
        }).then(() => {
          // Then inject the job details scraper script
          return chrome.scripting.executeScript({
            target: { tabId },
            files: ['job-scraper/job-details-scraper.js']
          });
        }).then(() => {
          // Send message to the content script to scrape job details
          chrome.tabs.sendMessage(tabId, {
            action: 'scrapeJobDetails',
            jobData: jobData // Pass the job data to the content script
          }, (response) => {
            // Close the tab regardless of the result

            setTimeout(() => {
              chrome.tabs.remove(tabId, () => {
                  if (chrome.runtime.lastError) {
                    console.log("Tab may have already been closed");
                  }
                });
            }, 1000); // 5 seconds

            // chrome.tabs.remove(tabId, () => {
            //   if (chrome.runtime.lastError) {
            //     console.log("Tab may have already been closed");
            //   }
            // });

            if (chrome.runtime.lastError) {
              console.error("Error scraping job details:", chrome.runtime.lastError);
              sendResponse({ success: false, error: chrome.runtime.lastError.message });
            } else if (response && response.jobDetails) {
              // Send the scraped details back to the original requester
              sendResponse({ success: true, jobDetails: response.jobDetails });
            } else {
              sendResponse({ success: false, error: "Failed to scrape job details" });
            }
          });
        }).catch(error => {
          console.error("Error injecting job details scraper:", error);
          chrome.tabs.remove(tabId);
          sendResponse({ success: false, error: "Error injecting job details scraper" });
        });
      };

      // Wait for the page to load before scraping
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, changeInfo) {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          // Remove the listener to avoid multiple calls
          chrome.tabs.onUpdated.removeListener(listener);

          // Wait a bit more for any dynamic content to load
          setTimeout(scrapeJobDetails, 2000);
        }
      });
    });

    return true; // Keep message channel open for async response
  }

  // Handle URL capture start request - commented out as per user request
  /*
  if (request.action === "startUrlCapture") {
    console.log("Starting URL capture");

    // Clear any existing timeout
    if (captureTimeoutId) {
      clearTimeout(captureTimeoutId);
    }

    isCapturingUrl = true;
    pendingCapture = true;

    // Store the job ID and source URL if provided
    if (request.jobId) {
      currentJobId = request.jobId;
      console.log("Capturing URL for job ID:", currentJobId);
    }

    if (request.sourceUrl) {
      sourceJobUrl = request.sourceUrl;
      console.log("Source job URL:", sourceJobUrl);
    }

    // Set a timeout to reset the capture state if no URL is captured
    captureTimeoutId = setTimeout(() => {
      if (pendingCapture) {
        console.log("URL capture timeout - resetting capture state");
        isCapturingUrl = false;
        pendingCapture = false;

        // If we have a job ID but no URL was captured, store a fallback URL
        if (currentJobId) {
          const fallbackUrl = `https://www.linkedin.com/jobs/view/${currentJobId}/apply/`;
          console.log(`Using fallback application URL for job ${currentJobId}:`, fallbackUrl);

          // Store the fallback URL
          chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
            const capturedUrls = data.capturedApplicationUrls || {};

            // Only store if we don't already have a URL for this job
            if (!capturedUrls[currentJobId]) {
              capturedUrls[currentJobId] = fallbackUrl;

              chrome.storage.local.set({ capturedApplicationUrls: capturedUrls }, () => {
                console.log(`Stored fallback application URL for job ${currentJobId} in local storage`);
              });
            }
          });
        }
      }
    }, 15000); // 15 second timeout (increased from 10)

    sendResponse({ success: true });
    return true;
  }
  */

  // Handle opening a URL in a background tab - removed as per user request

  // Tailor notification control has been removed
  // CV tailoring status is now tracked per job in job-listings.js

  // Handle direct URL scraping of job filters
  if (request.action === "scrapeJobFiltersDirectly") {
    const { filters } = request;

    if (!filters || filters.length === 0) {
      sendResponse({ success: false, error: "No job filters provided" });
      return true;
    }

    console.log(`Received request to scrape ${filters.length} job filters directly`);

    // Check if we're already processing filters
    if (isProcessingFilters) {
      sendResponse({ success: false, error: "Already processing job filters" });
      return true;
    }

    // Set processing state
    isProcessingFilters = true;
    currentFilterIndex = 0;
    totalFilters = filters.length;

    // Process filters one by one
    processNextFilter(filters, 0, [], (result) => {
      // Reset processing state
      isProcessingFilters = false;

      if (result.errors && result.errors.length > 0) {
        console.error("Errors during filter processing:", result.errors);
        sendResponse({
          success: true,
          result: result,
          warning: `Completed with ${result.errors.length} errors`
        });
      } else {
        console.log("Job filters processing completed successfully:", result);
        sendResponse({ success: true, result: result });
      }
    });

    return true; // Keep message channel open for async response
  }

  // Handle filter scraping status updates
  if (request.action === "updateFilterScrapingStatus") {
    const { filterId, status, error } = request;

    console.log(`Filter ${filterId} scraping status: ${status}${error ? ` (${error})` : ''}`);

    // If we're on the options page, forward the status update
    chrome.tabs.query({ url: chrome.runtime.getURL("options.html") }, (tabs) => {
      if (tabs && tabs.length > 0) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: "filterScrapingStatusUpdate",
            filterId,
            status,
            error
          }).catch(err => console.error("Error sending status update to options page:", err));
        });
      }
    });

    // If this is the last filter and it's completed or failed, reset the processing state
    if (status === "completed" || status === "failed") {
      currentFilterIndex++;

      if (currentFilterIndex >= totalFilters) {
        isProcessingFilters = false;
      }
    }

    sendResponse({ success: true });
    return true;
  }

  // Handle scraper status updates for the bridge page
  if (request.action === "updateScraperStatus") {
    const { status } = request;
    console.log(`Scraper status update: ${status}`);
    sendResponse({ success: true });
    return true;
  }

  // Add more message handlers as needed

});

// Listening for keyboard shortcuts (defined in manifest.json -> commands)
chrome.commands.onCommand.addListener((command) => {
  console.log(`Command received: ${command}`);

  if (command === "trigger-autofill") {
    // Get the active tab and send a message to trigger autofill
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "triggerAutofillFromPopup" })
          .catch(err => {
            console.error("Error triggering autofill:", err);
          });
      } else {
        console.error("No active tab found");
      }
    });
  }
});

// Set up a listener for web navigation events to capture the application URL - commented out as per user request
/*
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only process main frame navigations when we're actively capturing
  if (details.frameId === 0 && isCapturingUrl) {
    console.log("Captured navigation to URL:", details.url);

    // Check if this is likely an application URL
    const isLikelyApplicationUrl = (
      details.url.includes('apply') ||
      details.url.includes('career') ||
      details.url.includes('job') ||
      details.url.includes('position') ||
      details.url.includes('talent') ||
      details.url.includes('application') ||
      details.url.includes('form') ||
      details.url.includes('submit') ||
      details.url.includes('resume') ||
      details.url.includes('cv') ||
      !details.url.includes('linkedin.com') || // Any external URL is likely an application URL
      details.url.includes('linkedin.com/jobs/collections') // LinkedIn's application collection page
    );

    if (isLikelyApplicationUrl) {
      // Reset the capturing flags
      isCapturingUrl = false;
      pendingCapture = false;

      // Clear the timeout
      if (captureTimeoutId) {
        clearTimeout(captureTimeoutId);
        captureTimeoutId = null;
      }

      console.log("Captured likely application URL:", details.url);

      // If we have an active job details tab, send the URL to it
      if (jobDetailsTabId) {
        chrome.tabs.sendMessage(jobDetailsTabId, {
          action: 'capturedApplicationUrl',
          url: details.url,
          jobId: currentJobId
        }).catch(error => {
          console.error("Error sending captured URL to job details tab:", error);
        });
      }

      // Store the URL in local storage for potential later use
      if (currentJobId) {
        // Store by job ID if we have one
        chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
          const capturedUrls = data.capturedApplicationUrls || {};
          capturedUrls[currentJobId] = details.url;

          chrome.storage.local.set({ capturedApplicationUrls: capturedUrls }, () => {
            console.log(`Stored captured application URL for job ${currentJobId} in local storage`);
          });
        });
      } else {
        // Otherwise store as the last captured URL
        chrome.storage.local.set({ lastCapturedApplicationUrl: details.url }, () => {
          console.log("Stored captured application URL in local storage");
        });
      }
    }
  }
});
*/

// Listen for tab creation events to capture application URLs - commented out as per user request
/*
chrome.tabs.onCreated.addListener((tab) => {
  // If we're actively capturing and a new tab is created, it might be the application page
  if (isCapturingUrl && pendingCapture) {
    console.log("New tab created while capturing URLs:", tab.id, tab.pendingUrl || tab.url);

    // Wait for the tab to fully load to get its final URL
    const tabId = tab.id;

    // Set up a listener for this specific tab
    const tabUpdatedListener = (updatedTabId, changeInfo, updatedTab) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        // Remove the listener to avoid multiple calls
        chrome.tabs.onUpdated.removeListener(tabUpdatedListener);

        const finalUrl = updatedTab.url;
        console.log("Tab finished loading with URL:", finalUrl);

        // Check if this is likely an application URL
        const isLikelyApplicationUrl = (
          finalUrl.includes('apply') ||
          finalUrl.includes('career') ||
          finalUrl.includes('job') ||
          finalUrl.includes('position') ||
          finalUrl.includes('talent') ||
          finalUrl.includes('application') ||
          finalUrl.includes('form') ||
          finalUrl.includes('submit') ||
          finalUrl.includes('resume') ||
          finalUrl.includes('cv') ||
          !finalUrl.includes('linkedin.com') || // Any external URL is likely an application URL
          finalUrl.includes('linkedin.com/jobs/collections') // LinkedIn's application collection page
        );

        if (isLikelyApplicationUrl) {
          // Reset the capturing flags
          isCapturingUrl = false;
          pendingCapture = false;

          // Clear the timeout
          if (captureTimeoutId) {
            clearTimeout(captureTimeoutId);
            captureTimeoutId = null;
          }

          console.log("Captured likely application URL from new tab:", finalUrl);

          // If we have an active job details tab, send the URL to it
          if (jobDetailsTabId) {
            chrome.tabs.sendMessage(jobDetailsTabId, {
              action: 'capturedApplicationUrl',
              url: finalUrl,
              jobId: currentJobId
            }).catch(error => {
              console.error("Error sending captured URL to job details tab:", error);
            });
          }

          // Store the URL in local storage for potential later use
          if (currentJobId) {
            // Store by job ID if we have one
            chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
              const capturedUrls = data.capturedApplicationUrls || {};
              capturedUrls[currentJobId] = finalUrl;

              chrome.storage.local.set({ capturedApplicationUrls: capturedUrls }, () => {
                console.log(`Stored captured application URL for job ${currentJobId} in local storage`);

                // Close the tab after storing the URL
                setTimeout(() => {
                  chrome.tabs.remove(tabId, () => {
                    if (chrome.runtime.lastError) {
                      console.log("Tab may have already been closed");
                    } else {
                      console.log("Closed application tab after capturing URL");
                    }
                  });
                }, 1000); // Wait 1 second before closing to ensure URL is stored
              });
            });
          } else {
            // Otherwise store as the last captured URL
            chrome.storage.local.set({ lastCapturedApplicationUrl: finalUrl }, () => {
              console.log("Stored captured application URL in local storage");

              // Close the tab after storing the URL
              setTimeout(() => {
                chrome.tabs.remove(tabId, () => {
                  if (chrome.runtime.lastError) {
                    console.log("Tab may have already been closed");
                  } else {
                    console.log("Closed application tab after capturing URL");
                  }
                });
              }, 1000); // Wait 1 second before closing to ensure URL is stored
            });
          }
        }
      }
    };

    // Add the listener
    chrome.tabs.onUpdated.addListener(tabUpdatedListener);
  }

  // Check if this tab was created for job details scraping
  if (tab.url && tab.url.includes('linkedin.com/jobs/view/')) {
    console.log("Setting job details tab ID:", tab.id);
    jobDetailsTabId = tab.id;

    // Try to extract the job ID from the URL
    const match = tab.url.match(/\/jobs\/view\/([0-9]+)/);
    if (match && match[1]) {
      const jobId = match[1];
      console.log("Extracted job ID from tab URL:", jobId);

      // Check if we have a captured URL for this job
      chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
        const capturedUrls = data.capturedApplicationUrls || {};
        if (capturedUrls[jobId]) {
          console.log("Found previously captured URL for job", jobId, ":", capturedUrls[jobId]);
        }
      });
    }
  }
});

// Listen for tab updates to capture URL changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, _tab) => {
  // If we're actively capturing and the URL changes, it might be the application URL
  if (isCapturingUrl && pendingCapture && changeInfo.url) {
    console.log("Tab URL changed while capturing:", tabId, changeInfo.url);

    // Check if this is likely an application URL
    const isLikelyApplicationUrl = (
      changeInfo.url.includes('apply') ||
      changeInfo.url.includes('career') ||
      changeInfo.url.includes('job') ||
      changeInfo.url.includes('position') ||
      changeInfo.url.includes('talent') ||
      changeInfo.url.includes('application') ||
      changeInfo.url.includes('form') ||
      changeInfo.url.includes('submit') ||
      changeInfo.url.includes('resume') ||
      changeInfo.url.includes('cv') ||
      !changeInfo.url.includes('linkedin.com') || // Any external URL is likely an application URL
      changeInfo.url.includes('linkedin.com/jobs/collections') // LinkedIn's application collection page
    );

    if (isLikelyApplicationUrl) {
      // Reset the capturing flags
      isCapturingUrl = false;
      pendingCapture = false;

      // Clear the timeout
      if (captureTimeoutId) {
        clearTimeout(captureTimeoutId);
        captureTimeoutId = null;
      }

      console.log("Captured likely application URL from tab update:", changeInfo.url);

      // If we have an active job details tab, send the URL to it
      if (jobDetailsTabId) {
        chrome.tabs.sendMessage(jobDetailsTabId, {
          action: 'capturedApplicationUrl',
          url: changeInfo.url,
          jobId: currentJobId
        }).catch(error => {
          console.error("Error sending captured URL to job details tab:", error);
        });
      }

      // Store the URL in local storage for potential later use
      if (currentJobId) {
        // Store by job ID if we have one
        chrome.storage.local.get(['capturedApplicationUrls'], (data) => {
          const capturedUrls = data.capturedApplicationUrls || {};
          capturedUrls[currentJobId] = changeInfo.url;

          chrome.storage.local.set({ capturedApplicationUrls: capturedUrls }, () => {
            console.log(`Stored captured application URL for job ${currentJobId} in local storage`);

            // Close the tab after storing the URL
            setTimeout(() => {
              chrome.tabs.remove(tabId, () => {
                if (chrome.runtime.lastError) {
                  console.log("Tab may have already been closed");
                } else {
                  console.log("Closed application tab after capturing URL");
                }
              });
            }, 1000); // Wait 1 second before closing to ensure URL is stored
          });
        });
      } else {
        // Otherwise store as the last captured URL
        chrome.storage.local.set({ lastCapturedApplicationUrl: changeInfo.url }, () => {
          console.log("Stored captured application URL in local storage");

          // Close the tab after storing the URL
          setTimeout(() => {
            chrome.tabs.remove(tabId, () => {
              if (chrome.runtime.lastError) {
                console.log("Tab may have already been closed");
              } else {
                console.log("Closed application tab after capturing URL");
              }
            });
          }, 1000); // Wait 1 second before closing to ensure URL is stored
        });
      }
    }
  }
});
*/

// Keep the code that sets the job details tab ID
chrome.tabs.onCreated.addListener((tab) => {
  // Check if this tab was created for job details scraping
  if (tab.url && tab.url.includes('linkedin.com/jobs/view/')) {
    console.log("Setting job details tab ID:", tab.id);
    jobDetailsTabId = tab.id;
  }
});

console.log("Background service worker started.");
