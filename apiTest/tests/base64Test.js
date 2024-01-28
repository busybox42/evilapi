const axios = require("axios");
const config = require("../config/config");

describe("Base64 API Tests", () => {
  // Test for Base64 Encoding
  test("should encode 'Hello, World!' to Base64", async () => {
    try {
      const text = "Hello, World!";
      const response = await axios.post(`${config.api.baseUrl}/api/encode`, {
        text,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("encodedText");

      const encodedText = response.data.encodedText;
      console.log("Encoded Text:", encodedText);

      // Additional check: decode back and compare
      const decodeResponse = await axios.post(
        `${config.api.baseUrl}/api/decode`,
        { encodedText }
      );
      expect(decodeResponse.data).toHaveProperty("decodedText", text);
    } catch (error) {
      console.error("Error in encoding test:", error.message);
      throw error;
    }
  });

  // Test for Base64 Decoding
  test("should decode 'SGVsbG8sIFdvcmxkIQ==' to 'Hello, World!'", async () => {
    try {
      const encodedText = "SGVsbG8sIFdvcmxkIQ==";
      const expectedDecodedText = "Hello, World!";
      const response = await axios.post(`${config.api.baseUrl}/api/decode`, {
        encodedText,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("decodedText", expectedDecodedText);
      console.log("Decoded Text:", response.data.decodedText);
    } catch (error) {
      console.error("Error in decoding test:", error.message);
      throw error;
    }
  });
});
