const axios = require("axios");
const fsPromises = require("fs").promises;
const config = require("../config/config");

describe("Email Header Analysis Routes", () => {
  test("should analyze email headers and return analysis", async () => {
    const headerData = await fsPromises.readFile(
      config.testFilePaths.hdrFile,
      "utf8"
    );
    const response = await axios.post(
      `${config.api.baseUrl}/api/analyze-headers`,
      headerData,
      {
        headers: { "Content-Type": "text/plain" },
      }
    );

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("date");
    expect(response.data).toHaveProperty("dkim");
    expect(response.data).toHaveProperty("dmarc");
    expect(response.data).toHaveProperty("from");
    expect(response.data).toHaveProperty("receivedDelays");
    expect(response.data).toHaveProperty("spf");
    expect(response.data).toHaveProperty("subject");
    expect(response.data).toHaveProperty("to");
    expect(response.data).toHaveProperty("totalTime");

    console.log(
      "Email Header Analysis API Response:",
      JSON.stringify(response.data, null, 2)
    );
  });
});
