const axios = require("axios");
const fs = require("fs");
const fsPromises = require("fs").promises;
const FormData = require("form-data");

// Global constants
const API_HOST = "https://www.some-website.tld";
const API_PORT = 3011;
const BASE_URL = `${API_HOST}:${API_PORT}`;
const DOMAIN = "some-website.tld";

// Global variables for encrypted message and file content
let encryptedMessageGlobal = "";
let encryptedFileContentGlobal = "";
let decryptedFileContentGlobal = "";

// Data for message encryption
const messageData = {
  message: "Hello, Some Dude!",
  keyType: "General",
};

// Data for custom key
const customKeyData = {
  name: "YourNameHere",
  email: "YourNameHere@some-website.tld",
  password: "YourRandomPasswordHere",
};

// Global variable for SMTP test data
const smtpTestData = {
  serverAddress: "mail.some-website.tld",
  port: "587",
};

// File path and data for testing
const filePath = "/tmp/file.txt";
const fileData = "Super Secret Message";
const hdrFilePath = "/tmp/hdr.txt";

// Setup function for test file
async function setupTestFile() {
  await fsPromises.writeFile(filePath, fileData);
}

// Call the async function before tests
beforeAll(async () => {
  await setupTestFile();
});

// Test suite
describe("EvilAPI Tests", () => {
  describe("Email Info API Tests", () => {
    test("should return email information for a domain", async () => {
      const response = await axios.get(`${BASE_URL}/api/email-info/${DOMAIN}`);

      // Check if the response status is 200 (OK)
      expect(response.status).toBe(200);

      // Validate response structure
      expect(response.data).toHaveProperty("mxRecords");
      expect(Array.isArray(response.data.mxRecords)).toBeTruthy();
      expect(response.data.mxRecords[0]).toHaveProperty("exchange");
      expect(response.data.mxRecords[0]).toHaveProperty("priority");

      expect(response.data).toHaveProperty("spfRecord");
      expect(Array.isArray(response.data.spfRecord)).toBeTruthy();

      expect(response.data).toHaveProperty("dmarcRecord");
      expect(Array.isArray(response.data.dmarcRecord)).toBeTruthy();

      expect(response.data).toHaveProperty("aRecord");
      expect(Array.isArray(response.data.aRecord)).toBeTruthy();

      expect(response.data).toHaveProperty("clientSettings");
      expect(Array.isArray(response.data.clientSettings)).toBeTruthy();

      // Validate specific values in the response
      expect(response.data.mxRecords).toContainEqual(
        expect.objectContaining({
          exchange: expect.any(String),
          priority: expect.any(Number),
        })
      );

      expect(response.data.spfRecord[0]).toMatch(/v=spf1/); // Example regex check for SPF record format

      expect(response.data.dmarcRecord[0]).toMatch(/v=DMARC1/); // Example regex check for DMARC record format

      response.data.aRecord.forEach((ip) => {
        expect(ip).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/); // Validate IP address format
      });

      response.data.clientSettings.forEach((setting) => {
        expect(setting).toMatch(/\.evil-admin\.com$/); // Validate client settings end with the domain
      });

      // Log the JSON response for visual verification
      console.log(
        "Email Info API Response:",
        JSON.stringify(response.data, null, 2)
      );
    });
  });

  describe("SMTP Test API Tests", () => {
    test("should test SMTP server", async () => {
      const response = await axios.post(
        `${BASE_URL}/api/test-smtp`,
        smtpTestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Check if the response status is 200 (OK)
      expect(response.status).toBe(200);

      // Validate response structure
      expect(response.data).toHaveProperty("connection");
      expect(typeof response.data.connection).toBe("string");

      expect(response.data).toHaveProperty("transactionTimeMs");
      expect(typeof response.data.transactionTimeMs).toBe("string");

      expect(response.data).toHaveProperty("reverseDnsMismatch");
      expect(typeof response.data.reverseDnsMismatch).toBe("boolean");

      expect(response.data).toHaveProperty("tlsSupport");
      expect(typeof response.data.tlsSupport).toBe("string");

      expect(response.data).toHaveProperty("openRelay");
      expect(typeof response.data.openRelay).toBe("boolean");

      // Additional checks for specific values
      expect(response.data.connection).toMatch(/Successful|Failed/); // Check if the connection status is either 'Successful' or 'Failed'
      expect(response.data.tlsSupport).toMatch(/Supported|Not Supported/); // Check if TLS support is either 'Supported' or 'Not Supported'

      // Log the JSON response for visual verification
      console.log(
        "SMTP Test API Response:",
        JSON.stringify(response.data, null, 2)
      );
    });
  });

  // Email Blacklist Routes
  describe("Email Blacklist Routes", () => {
    test("should return blacklist status for a domain", async () => {
      const response = await axios.get(
        `${BASE_URL}/api/blacklist-check/${DOMAIN}`
      );
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("identifier", DOMAIN);
      expect(response.data).toHaveProperty("ip");
      expect(response.data).toHaveProperty("blacklistResults");
      expect(Array.isArray(response.data.blacklistResults)).toBeTruthy();

      const uceProtect2 = response.data.blacklistResults.find(
        (rbl) => rbl.rbl === "UCEProtect 2"
      );
      expect(uceProtect2).toBeDefined();
      expect(uceProtect2.listed).toBe(true);

      // Log the JSON response for visual verification
      console.log(
        "Email Blacklist API Response:",
        JSON.stringify(response.data, null, 2)
      );
    }, 10000); // Increased timeout
  });

  // Email Header Analysis Routes
  describe("Email Header Analysis Routes", () => {
    test("should analyze email headers and return analysis", async () => {
      const headerData = await fsPromises.readFile(hdrFilePath, "utf8");
      const response = await axios.post(
        `${BASE_URL}/api/analyze-headers`,
        headerData,
        {
          headers: { "Content-Type": "text/plain" },
        }
      );

      expect(response.status).toBe(200);
      // Check for the existence of the key properties in the response
      expect(response.data).toHaveProperty("date");
      expect(response.data).toHaveProperty("dkim");
      expect(response.data).toHaveProperty("dmarc");
      expect(response.data).toHaveProperty("from");
      expect(response.data).toHaveProperty("receivedDelays");
      expect(response.data).toHaveProperty("spf");
      expect(response.data).toHaveProperty("subject");
      expect(response.data).toHaveProperty("to");
      expect(response.data).toHaveProperty("totalTime");

      // Validate the types of the properties
      expect(typeof response.data.date).toBe("string");
      expect(typeof response.data.dkim).toBe("string");
      expect(typeof response.data.dmarc).toBe("string");
      expect(typeof response.data.from).toBe("string");
      expect(Array.isArray(response.data.receivedDelays)).toBeTruthy();
      expect(typeof response.data.spf).toBe("string");
      expect(typeof response.data.subject).toBe("string");
      expect(typeof response.data.to).toBe("string");
      expect(typeof response.data.totalTime).toBe("string");

      // Log the JSON response for visual verification
      console.log(
        "Email Header Analysis API Response:",
        JSON.stringify(response.data, null, 2)
      );
    });
  });

  // PGP Routes
  describe("PGP Routes", () => {
    test("should encrypt a message and store the result", async () => {
      const response = await axios.post(
        `${BASE_URL}/api/encrypt`,
        messageData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("result");
      encryptedMessageGlobal = response.data.result;

      // Log the encrypted message for visual verification
      console.log("Encrypted Message:", encryptedMessageGlobal);
    });

    test("should decrypt the previously encrypted message", async () => {
      expect(encryptedMessageGlobal).toBeTruthy();

      const decryptionData = {
        message: encryptedMessageGlobal,
        keyType: "General",
      };

      const response = await axios.post(
        `${BASE_URL}/api/decrypt`,
        decryptionData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("result");
      expect(response.data.result).toBe("Hello, Alan!");

      // Log the decrypted message for visual verification
      console.log("Decrypted Message:", response.data.result);
    });

    // Test for temporary key generation
    test("should generate a temporary key or indicate key already exists", async () => {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/generate-temp-key`,
          customKeyData,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        // The key is generated successfully
        expect(response.status).toBe(200);
        console.log("Generated Key Response:", response.data); // Log the response
      } catch (error) {
        if (error.response) {
          // If the key already exists, the server responds with a 409 error
          expect(error.response.status).toBe(409);
          console.log("Key Generation Error:", error.response.data); // Log the error response
        } else {
          throw error;
        }
      }
    });

    // Test for file encryption
    test("should encrypt a file", async () => {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(filePath));
      formData.append("keyType", "custom");
      formData.append("customKeyName", customKeyData.name);

      const response = await axios.post(
        `${BASE_URL}/api/encrypt-file`,
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      expect(response.status).toBe(200);
      fsPromises.writeFile("/tmp/encrypted_file.pgp", response.data);
      console.log("Encrypted File Response:", response.data); // Log the encrypted file response
    });

    // Test for file decryption
    test("should decrypt a file", async () => {
      // Ensure the encrypted file exists
      const encryptedFilePath = "/tmp/encrypted_file.pgp";
      const encryptedFileExists = fs.existsSync(encryptedFilePath);
      expect(encryptedFileExists).toBe(true);

      // Read the encrypted file content
      const encryptedFileContent = await fsPromises.readFile(encryptedFilePath);

      const formData = new FormData();
      formData.append("file", encryptedFileContent, {
        filename: "encrypted_file.pgp",
        contentType: "application/octet-stream",
      });
      formData.append("keyType", "custom");
      formData.append("customKeyName", customKeyData.name);

      const response = await axios.post(
        `${BASE_URL}/api/decrypt-file`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      expect(response.status).toBe(200);
      await fsPromises.writeFile("/tmp/decrypted_file.txt", response.data);
      console.log("Decrypted File Response:", response.data); // Log the decrypted file response
    });
  });
});
