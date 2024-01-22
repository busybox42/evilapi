const https = require("https");

const validateSSL = async (hostname) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      agent: false,
      rejectUnauthorized: false,
      ciphers: "ALL",
    };

    const req = https.request(options, (res) => {
      const certificate = res.socket.getPeerCertificate();

      if (certificate && certificate.subject) {
        const validFrom = new Date(certificate.valid_from).toISOString();
        const validTo = new Date(certificate.valid_to).toISOString();

        resolve({
          valid: res.socket.authorized,
          details: {
            subject: certificate.subject,
            issuer: certificate.issuer,
            validFrom,
            validTo,
            serialNumber: certificate.serialNumber,
            algorithm: certificate.sigalg,
          },
        });
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
