const express = require("express");
const { generateKeyPairSync } = require("crypto");
const router = express.Router();

// Function to generate RSA key pair
const generateDkimKeyPair = () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048, // Length of your key in bits
    publicKeyEncoding: {
      type: "spki", // Recommended for RSA keys
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8", // Recommended for RSA keys
      format: "pem",
    },
  });

  return { privateKey, publicKey };
};

// Function to format public key for DNS
const formatPublicKeyForDNS = (publicKey, selector, domain) => {
  // Remove header, footer, and newlines
  let formattedKey = publicKey
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\n/g, "");

  // Format the DKIM TXT record with provided selector and domain
  const dkimRecord = `${selector}._domainkey.${domain} IN TXT "v=DKIM1; h=sha256; k=rsa; p=${formattedKey}";`;
  return dkimRecord;
};

// API endpoint to generate DKIM key pair and format public key for DNS
router.get("/generate-dkim-keys", (req, res) => {
  const { selector, domain } = req.query;

  // Validate required parameters
  if (!selector || !domain) {
    return res
      .status(400)
      .json({ error: "Both selector and domain are required parameters." });
  }

  const { privateKey, publicKey } = generateDkimKeyPair();
  const dkimRecord = formatPublicKeyForDNS(publicKey, selector, domain);

  // Return the DKIM record for DNS and a warning about private key handling
  // Using JSON.stringify for pretty printing and adding a newline at the end
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify(
      {
        dkimRecord,
        privateKeyWarning:
          "Private key is sensitive and should be handled securely!",
        privateKey, // Warning: Exposing the private key in responses can be very dangerous in a real application
      },
      null,
      2
    ) + "\n"
  );
});

module.exports = router;
