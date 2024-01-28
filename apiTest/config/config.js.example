const fsPromises = require("fs").promises;

// Configuration settings for the test suite
const config = {
  api: {
    host: "https://www.some-website.tld",
    port: 3011,
    baseUrl: "https://www.some-website.tld:3011",
    domain: "some-website.tld",
  },
  messageData: {
    message: "Hello, Some Dude!",
    keyType: "General",
  },
  customKeyData: {
    name: "YourNameHere",
    email: "YourNameHere@some-website.tld",
    password: "YourRandomPasswordHere",
  },
  smtpTestData: {
    serverAddress: "mail.some-website.tld",
    port: "587",
  },
  testFilePaths: {
    file: "/tmp/file.txt",
    fileData: "Super Secret Message",
    hdrFile: "/tmp/hdr.txt",
  },
  testConstants: {
    testIp: "8.8.8.8",
    testHostname: "mail.some-website.tld",
  },
  setupTestFile: async function () {
    await fsPromises.writeFile(
      this.testFilePaths.file,
      this.testFilePaths.fileData
    );
  },
};

module.exports = config;
