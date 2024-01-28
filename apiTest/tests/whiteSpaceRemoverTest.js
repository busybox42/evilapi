const axios = require("axios");
const config = require("../config/config");

describe("Whitespace Remover API Tests", () => {
  test("should remove all whitespace from a given text string", async () => {
    try {
      const text = "Your text with spaces";
      const expectedText = "Yourtextwithspaces";
      const response = await axios.post(
        `${config.api.baseUrl}/api/remove-whitespace`,
        { text }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("result", expectedText);

      console.log(
        "Whitespace Remover API Response:",
        JSON.stringify(response.data, null, 2)
      );
    } catch (error) {
      console.error("Error:", error.message);
      throw error;
    }
  });
});
