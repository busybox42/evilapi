# API Test Suite README

Welcome to the test suite for the API. This document will guide you through setting up and running tests to ensure the functionality of the API.

## Prerequisites

- Node.js and npm installed on your machine.
- Access to the API server (running at `https://www.some-website.tld:3011`).

## Test Setup

1. **Clone the Repository**: If not already done, clone the API repository to your local machine.

   ```bash
   git clone git@github.com:busybox42/evilapi.git
   ```

2. **Navigate to Test Directory**: Change into the test directory within the cloned repository.

   ```bash
   cd evilapi/apiTest
   ```

3. **Install Dependencies**: Run npm to install necessary Node.js dependencies.
   ```bash
   npm install
   ```

## Running Tests

To execute the test suites, use the command:

```bash
npm test
```

This will run tests using Jest, a JavaScript testing framework.

## Test Configuration

- Tests are configured to connect to the API server at `https://www.some-website.tld:3011`.
- Global variables such as `DOMAIN`, `filePath`, `hdrFilePath`, and `smtpTestData` are set within the test script for easy adjustments.
- Ensure that the API server is running and accessible from your testing environment before executing tests.

## Important Notes

- Keep a stable internet connection as tests involve network requests.
- In case of test failures, check the API server logs for detailed error information.
- The test suite includes a variety of tests covering different aspects of the API, ensuring a comprehensive assessment.
