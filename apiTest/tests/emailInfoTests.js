const axios = require("axios");
const config = require("../config/config");

describe("Email Info API Tests", () => {
  test("should return email information for a domain", async () => {
    const response = await axios.get(
      `${config.api.baseUrl}/api/email-info/${config.api.domain}`
    );

    expect(response.status).toBe(200);
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
    // ... Add specific checks for mxRecords, spfRecord, dmarcRecord, etc.

    console.log(
      "Email Info API Response:",
      JSON.stringify(response.data, null, 2)
    );
  });
});
