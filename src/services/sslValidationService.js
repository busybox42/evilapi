const https = require("https");

const validateSSL = async (hostname, port = 443) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      agent: false,
      rejectUnauthorized: false,
      ciphers: "ALL",
    };

    const req = https.request(options, (res) => {
      const certificate = res.socket.getPeerCertificate();

      if (certificate && certificate.subject) {
        const validFrom = new Date(certificate.valid_from).toISOString();
        const validTo = new Date(certificate.valid_to).toISOString();

        // Extracting alternative hostnames
        const altNames = certificate.subjectaltname
          ?.split(", ")
          .filter((name) => name.startsWith("DNS:"))
          .map((name) => name.replace("DNS:", ""));

        const response = {
          valid: res.socket.authorized,
          details: {
            subject: certificate.subject,
            issuer: certificate.issuer,
            validFrom,
            validTo,
            serialNumber: certificate.serialNumber,
            algorithm: certificate.sigalg,
          },
        };

        // Only add alternative hostnames if they exist
        if (altNames && altNames.length > 0) {
          response.details.alternativeHostnames = altNames;
        }

        resolve(response);
      } else {
        resolve({ valid: false });
      }
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
};

module.exports = { validateSSL };
