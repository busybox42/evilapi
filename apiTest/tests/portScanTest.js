const axios = require("axios");
const config = require("../config/config");

describe("Port Scan API Tests", () => {
  test("should return data for a common port on a specific host", async () => {
    try {
      const host = config.testConstants.testHost; // Replace with a test host
      const response = await axios.get(
        `${config.api.baseUrl}/api/scan?host=${host}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
      // Check if the response includes any data
      expect(response.data.length).toBeGreaterThan(0);

      console.log(
        "Port Scan API Response:",
        JSON.stringify(response.data, null, 2)
      );
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  });

  test("should return status for a specific port on a specific host", async () => {
    try {
      const host = config.testConstants.testHost; // Replace with a test host
      const port = 80; // Replace with a specific test port
      const response = await axios.get(
        `${config.api.baseUrl}/api/scan?host=${host}&port=${port}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
      expect(response.data.length).toBe(1);
      // Convert port to string before comparison
      expect(response.data[0]).toHaveProperty("port", port.toString());
      expect(["open", "closed"]).toContain(response.data[0].status);

      console.log(
        "Specific Port Scan API Response:",
        JSON.stringify(response.data, null, 2)
      );
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  });
});
