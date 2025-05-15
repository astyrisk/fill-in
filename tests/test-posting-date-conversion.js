// Test script for posting date conversion
// This script tests the conversion of posting date values to LinkedIn URL parameters

// Function to construct LinkedIn search URL from job filter parameters (copied from direct-url-scraper.js)
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

// Test cases
const testCases = [
    {
        name: "1 day",
        filter: {
            jobType: "Software Engineer",
            location: "New York",
            experienceLevels: ["2", "3"],
            postingDate: "1"
        },
        expectedSeconds: 86400
    },
    {
        name: "2 days",
        filter: {
            jobType: "Software Engineer",
            location: "New York",
            experienceLevels: ["2", "3"],
            postingDate: "2"
        },
        expectedSeconds: 172800
    },
    {
        name: "7 days (1 week)",
        filter: {
            jobType: "Software Engineer",
            location: "New York",
            experienceLevels: ["2", "3"],
            postingDate: "7"
        },
        expectedSeconds: 604800
    },
    {
        name: "14 days (2 weeks)",
        filter: {
            jobType: "Software Engineer",
            location: "New York",
            experienceLevels: ["2", "3"],
            postingDate: "14"
        },
        expectedSeconds: 1209600
    },
    {
        name: "30 days (1 month)",
        filter: {
            jobType: "Software Engineer",
            location: "New York",
            experienceLevels: ["2", "3"],
            postingDate: "30"
        },
        expectedSeconds: 2592000
    }
];

// Run tests
console.log("Testing posting date conversion to LinkedIn URL parameters:");
console.log("--------------------------------------------------------");

testCases.forEach(testCase => {
    const url = constructLinkedInSearchUrl(testCase.filter);
    
    // Extract the f_TPR parameter from the URL
    const tprMatch = url.match(/f_TPR=r(\d+)/);
    const actualSeconds = tprMatch ? parseInt(tprMatch[1]) : null;
    
    const passed = actualSeconds === testCase.expectedSeconds;
    
    console.log(`Test case: ${testCase.name}`);
    console.log(`URL: ${url}`);
    console.log(`Expected seconds: ${testCase.expectedSeconds}`);
    console.log(`Actual seconds: ${actualSeconds}`);
    console.log(`Result: ${passed ? 'PASSED' : 'FAILED'}`);
    console.log("--------------------------------------------------------");
});

// Run the tests
console.log("To run this test, open the browser console and load this script.");
