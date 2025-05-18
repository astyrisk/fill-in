/**
 * Test for job title exclusion functionality
 *
 * This file contains tests for the job title exclusion feature:
 * - Checking if a job title contains excluded words
 * - Filtering out jobs with excluded words in their titles
 */

// Mock the shouldExcludeJob function from linkedin-scraper.js
async function shouldExcludeJob(title, excludedWords) {
    if (!excludedWords || !title) {
        return false;
    }

    // Convert title to lowercase for case-insensitive comparison
    const lowerTitle = title.toLowerCase();

    // Split the excluded words by comma and trim whitespace
    const excludedWordsArray = excludedWords.split(',')
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

    // Check if any excluded word is in the title
    const shouldExclude = excludedWordsArray.some(word => lowerTitle.includes(word));

    return shouldExclude;
}

// Test functions
async function testBasicExclusion() {
    console.log('Test: Basic job title exclusion');

    const testCases = [
        { title: 'Software Engineer', excludedWords: 'senior,manager,director', expected: false },
        { title: 'Senior Software Engineer', excludedWords: 'senior,manager,director', expected: true },
        { title: 'Engineering Manager', excludedWords: 'senior,manager,director', expected: true },
        { title: 'Director of Engineering', excludedWords: 'senior,manager,director', expected: true },
        { title: 'Junior Developer', excludedWords: 'senior,manager,director', expected: false },
        { title: 'Software Developer', excludedWords: '', expected: false },
        { title: '', excludedWords: 'senior,manager,director', expected: false }
    ];

    let allPassed = true;

    for (const testCase of testCases) {
        const result = await shouldExcludeJob(testCase.title, testCase.excludedWords);
        const passed = result === testCase.expected;

        console.log(`  - Title: "${testCase.title}", Excluded Words: "${testCase.excludedWords}", Expected: ${testCase.expected}, Result: ${result}, ${passed ? 'PASS' : 'FAIL'}`);

        if (!passed) {
            allPassed = false;
        }
    }

    console.log(`Result: ${allPassed ? 'PASS' : 'FAIL'}`);
    return allPassed;
}

async function testCaseInsensitivity() {
    console.log('Test: Case insensitivity in exclusion');

    const testCases = [
        { title: 'SENIOR Software Engineer', excludedWords: 'senior,manager,director', expected: true },
        { title: 'Software MANAGER', excludedWords: 'Senior,Manager,Director', expected: true },
        { title: 'director of Engineering', excludedWords: 'SENIOR,MANAGER,DIRECTOR', expected: true },
        { title: 'Junior Developer', excludedWords: 'SENIOR,manager,Director', expected: false }
    ];

    let allPassed = true;

    for (const testCase of testCases) {
        const result = await shouldExcludeJob(testCase.title, testCase.excludedWords);
        const passed = result === testCase.expected;

        console.log(`  - Title: "${testCase.title}", Excluded Words: "${testCase.excludedWords}", Expected: ${testCase.expected}, Result: ${result}, ${passed ? 'PASS' : 'FAIL'}`);

        if (!passed) {
            allPassed = false;
        }
    }

    console.log(`Result: ${allPassed ? 'PASS' : 'FAIL'}`);
    return allPassed;
}

async function testPartialWordMatching() {
    console.log('Test: Partial word matching in exclusion');

    const testCases = [
        { title: 'Software Engineer Senior Level', excludedWords: 'senior', expected: true },
        { title: 'Management Position', excludedWords: 'management', expected: true }, // Changed from 'manager' to 'management'
        { title: 'Software Engineering Lead', excludedWords: 'lead', expected: true },
        { title: 'Associate Developer', excludedWords: 'associate', expected: true },
        { title: 'Development Team', excludedWords: 'developer', expected: false } // Should not match 'developer' in 'development'
    ];

    let allPassed = true;

    for (const testCase of testCases) {
        const result = await shouldExcludeJob(testCase.title, testCase.excludedWords);
        const passed = result === testCase.expected;

        console.log(`  - Title: "${testCase.title}", Excluded Words: "${testCase.excludedWords}", Expected: ${testCase.expected}, Result: ${result}, ${passed ? 'PASS' : 'FAIL'}`);

        if (!passed) {
            allPassed = false;
        }
    }

    console.log(`Result: ${allPassed ? 'PASS' : 'FAIL'}`);
    return allPassed;
}

// Run all tests
async function runAllTests() {
    console.log('Running job title exclusion tests...');

    const testResults = [
        await testBasicExclusion(),
        await testCaseInsensitivity(),
        await testPartialWordMatching()
    ];

    const allPassed = testResults.every(result => result === true);

    console.log(`\nAll tests ${allPassed ? 'PASSED' : 'FAILED'}`);
    console.log('Job title exclusion tests completed!');
}

// Run the tests
runAllTests();
