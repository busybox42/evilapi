const axios = require("axios");
const config = require("../config/config");

describe("SMTP Test API Tests", () => {
  test("should test SMTP server", async () => {
    const response = await axios.post(
      `${config.api.baseUrl}/api/test-smtp`,
      config.smtpTestData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    expect(response.status).toBe(200);
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

    console.log(
      "SMTP Test API Response:",
      JSON.stringify(response.data, null, 2)
    );
  });
});
