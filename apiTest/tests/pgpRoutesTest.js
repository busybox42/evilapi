const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const config = require("../config/config"); // Adjust the path to your config file

describe("PGP Routes", () => {
  // Using global variables and data from config file
  let encryptedMessageGlobal = "";
  let encryptedFileContentGlobal = "";
  let decryptedFileContentGlobal = "";

  // Test for message encryption
  test("should encrypt a message and store the result", async () => {
    const response = await axios.post(
      `${config.api.baseUrl}/api/encrypt`,
      config.messageData,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("result");
    encryptedMessageGlobal = response.data.result;
    console.log("Encrypted Message:", encryptedMessageGlobal);
  });

  // Test for message decryption
  test("should decrypt the previously encrypted message", async () => {
    expect(encryptedMessageGlobal).toBeTruthy();

    const decryptionData = {
      message: encryptedMessageGlobal,
      keyType: "General",
    };

    const response = await axios.post(
      `${config.api.baseUrl}/api/decrypt`,
      decryptionData,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("result");
    expect(response.data.result).toBe(config.messageData.message);
    console.log("Decrypted Message:", response.data.result);
  });

  // Test for temporary key generation
  test("should generate a temporary key or indicate key already exists", async () => {
    try {
      const response = await axios.post(
        `${config.api.baseUrl}/api/generate-temp-key`,
        config.customKeyData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(response.status).toBe(200);
      console.log("Generated Key Response:", response.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        expect(error.response.status).toBe(409);
        console.log("Key Generation Error:", error.response.data);
      } else {
        throw error;
      }
    }
  });

  // Test for file encryption
  test("should encrypt a file", async () => {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(config.testFilePaths.file));
    formData.append("keyType", "custom");
    formData.append("customKeyName", config.customKeyData.name);

    const response = await axios.post(
      `${config.api.baseUrl}/api/encrypt-file`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    expect(response.status).toBe(200);
    await fsPromises.writeFile("/tmp/encrypted_file.pgp", response.data);
    console.log("Encrypted File Response:", response.data);
  });

  // Test for file decryption
  test("should decrypt a file", async () => {
    const encryptedFilePath = path.join("/tmp", "encrypted_file.pgp");
    const encryptedFileExists = fs.existsSync(encryptedFilePath);
    expect(encryptedFileExists).toBe(true);

    const encryptedFileContent = await fsPromises.readFile(encryptedFilePath);
    const formData = new FormData();
    formData.append("file", encryptedFileContent, {
      filename: "encrypted_file.pgp",
      contentType: "application/octet-stream",
    });
    formData.append("keyType", "custom");
    formData.append("customKeyName", config.customKeyData.name);

    const response = await axios.post(
      `${config.api.baseUrl}/api/decrypt-file`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    expect(response.status).toBe(200);
    await fsPromises.writeFile("/tmp/decrypted_file.txt", response.data);
    console.log("Decrypted File Response:", response.data);
  });
});
