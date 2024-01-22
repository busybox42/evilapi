const fs = require("fs");
const path = require("path");

// Dynamically import and execute all test scripts in the tests directory
const testsDirectory = path.join(__dirname, "tests");
fs.readdirSync(testsDirectory).forEach((file) => {
  // Only load files that end with .js
  if (file.endsWith(".js")) {
    try {
      require(path.join(testsDirectory, file));
    } catch (error) {
      console.error(`Error loading test file ${file}:`, error);
    }
  }
});
