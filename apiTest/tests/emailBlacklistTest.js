const axios = require("axios");
const config = require("../config/config");

describe("Email Blacklist Routes", () => {
  test("should return blacklist status for a domain", async () => {
    const response = await axios.get(
      `${config.api.baseUrl}/api/blacklist-check/${config.api.domain}`
    );
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("identifier", config.api.domain);
    expect(response.data).toHaveProperty("ip");
    expect(response.data).toHaveProperty("blacklistResults");
    expect(Array.isArray(response.data.blacklistResults)).toBeTruthy();

    const uceProtect2 = response.data.blacklistResults.find(
      (rbl) => rbl.rbl === "UCEProtect 2"
    );
    expect(uceProtect2).toBeDefined();
    expect(uceProtect2.listed).toBe(true);

    console.log(
      "Email Blacklist API Response:",
      JSON.stringify(response.data, null, 2)
    );
  }, 10000); // Increased timeout for the test
});
