const axios = require("axios");
const config = require("../config/config");

describe("SSL Validation API Tests", () => {
  test("should validate SSL for a given domain", async () => {
    const response = await axios.get(
      `${config.api.baseUrl}/api/validate-ssl?hostname=${config.api.domain}`
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("valid");
    expect(typeof response.data.valid).toBe("boolean");

    if (response.data.valid) {
      expect(response.data).toHaveProperty("details");
      expect(response.data.details).toHaveProperty("issuer");
      expect(typeof response.data.details.issuer).toBe("object");

      expect(response.data.details).toHaveProperty("validFrom");
      expect(typeof response.data.details.validFrom).toBe("string");

      expect(response.data.details).toHaveProperty("validTo");
      expect(typeof response.data.details.validTo).toBe("string");

      // Add additional assertions as needed
    } else {
      expect(response.data).toHaveProperty("error");
      expect(typeof response.data.error).toBe("string");
    }

    console.log(
      "SSL Validation API Response:",
      JSON.stringify(response.data, null, 2)
    );
  });
});
