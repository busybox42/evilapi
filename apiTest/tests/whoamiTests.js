const axios = require("axios");
const config = require("../config/config");

describe("Whoami API Tests", () => {
  test("should return information for a specific IP", async () => {
    try {
      const response = await axios.get(
        `${config.api.baseUrl}/api/whoami?ip=${config.testConstants.testIp}`
      );
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("ip", config.testConstants.testIp);
      // ... (other assertions)
      console.log(
        "Whoami API Response for IP:",
        JSON.stringify(response.data, null, 2)
      );
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  });

  test("should return information for a specific hostname", async () => {
    try {
      const response = await axios.get(
        `${config.api.baseUrl}/api/whoami?ip=${config.testConstants.testHostname}`
      );
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty(
        "ip",
        config.testConstants.testHostname
      );
      // ... (other assertions)
      console.log(
        "Whoami API Response for Hostname:",
        JSON.stringify(response.data, null, 2)
      );
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  });
});
