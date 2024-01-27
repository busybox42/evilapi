const express = require("express");
const router = express.Router();
const fsPromises = require("fs").promises;
const multer = require("multer");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 },
});
const openpgp = require("openpgp");
const config = require("../../config/config");
const { logError } = require("../../utils/logger");
const {
  getKeyFromMemcached,
  storeKeyInMemcached,
} = require("../../services/memcachedService");
const { generateStaticKeys } = require("../../utils/pgpUtils");

const sendJsonResponse = (res, statusCode, data) => {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(data, null, 2) + "\n");
};

router.post("/generate-temp-key", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if key already exists in Memcached
    const existingKey = await getKeyFromMemcached(name, req).catch(() => null);
    if (existingKey) {
      return res
        .status(409)
        .json({ error: `Key with name '${name}' already exists` });
    }

    // Generate keys
    const tempKey = await generateStaticKeys(name, email, password);

    if (!tempKey.publicKeyArmored || !tempKey.privateKeyArmored) {
      return logError(
        req,
        "Failed to generate armored keys",
        new Error("Armored keys generation failed")
      );
    }

    const keyData = JSON.stringify({
      publicKeyArmored: tempKey.publicKeyArmored,
      privateKeyArmored: tempKey.privateKeyArmored,
      passphrase: password,
    });

    // Store the generated key in Memcached
    await storeKeyInMemcached(name, keyData, req); // Pass the request object for error logging

    sendJsonResponse(res, 200, {
      message: "Key generated successfully",
      publicKey: tempKey.publicKeyArmored,
    });
  } catch (error) {
    logError(req, "Error in generate-temp-key endpoint", error);
    res.status(500).json({ error: error.message });
  }
});

// Encryption endpoint
router.post("/encrypt", async (req, res) => {
  try {
    const { message, keyType, customKeyName } = req.body;
    let publicKeyArmored;

    if (keyType === "custom") {
      const keyData = await getKeyFromMemcached(customKeyName);
      if (!keyData) {
        return res.status(404).json({ error: "Custom key not found" });
      }
      publicKeyArmored = keyData.publicKeyArmored;
    } else {
      const staticKey = req.staticKeyPairs[keyType];
      if (!staticKey) {
        console.error("Static key not found for type:", keyType); // Error log if key not found
        return res.status(404).json({ error: `${keyType} key not found` });
      }

      publicKeyArmored = staticKey.publicKey; // Use the armored public key
    }

    // Perform encryption using the appropriate key
    const encryptionKeys = await openpgp.readKey({
      armoredKey: publicKeyArmored,
    });
    const encryptedMessage = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: encryptionKeys,
    });

    sendJsonResponse(res, 200, { result: encryptedMessage });
  } catch (error) {
    logError(req, "Error in encrypt endpoint", error);
    res.status(500).json({ error: error.message });
  }
});

// Decryption endpoint
router.post("/decrypt", async (req, res) => {
  try {
    const { message, keyType, customKeyName } = req.body;
    let privateKeyArmored, passphrase;

    if (keyType === "custom") {
      const keyData = await getKeyFromMemcached(customKeyName);
      if (!keyData) {
        return res.status(404).json({ error: "Custom key not found" });
      }
      privateKeyArmored = keyData.privateKeyArmored;
      passphrase = keyData.passphrase;
    } else {
      const keyInfo = config.pgpKeys.find((key) => key.type === keyType);
      if (!keyInfo) {
        console.error("Key not found for type:", keyType); // Error log if key not found
        return res.status(404).json({ error: `${keyType} key not found` });
      }

      privateKeyArmored = req.staticKeyPairs[keyType].privateKey; // Use the armored private key
      passphrase = keyInfo.passphrase; // Use the passphrase
    }

    // Decrypt private key
    try {
      const privateKeyObj = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({
          armoredKey: privateKeyArmored,
        }),
        passphrase: passphrase,
      });

      // Ensure that the decryption was successful
      if (!privateKeyObj) {
        console.error("Private key decryption failed.");
        return res.status(500).json({ error: "Private key decryption failed" });
      }

      // Decrypt message using the decrypted private key
      const decryptedMessage = await openpgp.decrypt({
        message: await openpgp.readMessage({ armoredMessage: message }),
        decryptionKeys: privateKeyObj,
      });

      // Check if the message was decrypted successfully
      if (!decryptedMessage || !decryptedMessage.data) {
        console.error("Message decryption failed.");
        return res.status(500).json({ error: "Message decryption failed" });
      }

      // Send the decrypted message
      sendJsonResponse(res, 200, { result: decryptedMessage.data });
    } catch (error) {
      console.error("Error in decrypt endpoint:", error);
      logError(req, "Error in decrypt endpoint", error);
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error("Error in decrypt endpoint:", error);
    logError(req, "Error in decrypt endpoint", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for encrypting file
router.post("/encrypt-file", upload.single("file"), async (req, res) => {
  if (req.file.size > 100 * 1024 * 1024) {
    // 100 MB limit
    return res.status(413).json({ error: "File size exceeds limit of 100MB" });
  }

  try {
    const { keyType, customKeyName } = req.body;
    let publicKeyArmored;

    if (keyType === "custom") {
      const keyData = await getKeyFromMemcached(customKeyName);
      if (!keyData) {
        return res.status(404).json({ error: "Custom key not found" });
      }
      publicKeyArmored = keyData.publicKeyArmored;
    } else {
      const staticKey = req.staticKeyPairs[keyType];
      if (!staticKey) {
        return res.status(404).json({ error: `${keyType} key not found` });
      }
      publicKeyArmored = staticKey.publicKey; // Use the armored public key
    }

    // Read public key
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    // Read file contents asynchronously
    const fileBuffer = await fsPromises.readFile(req.file.path);
    const fileData = fileBuffer.toString("utf8");

    // Encrypt file contents
    const encryptedMessage = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: fileData }),
      encryptionKeys: publicKey,
    });

    // Send encrypted file to client
    res.writeHead(200, {
      "Content-Disposition": `attachment; filename="${req.file.originalname}.pgp"`,
      "Content-Type": "application/octet-stream",
    });
    res.end(encryptedMessage);
  } catch (error) {
    logError(req, "Error encrypting file", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint for decrypting file
router.post("/decrypt-file", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (req.file.size > 100 * 1024 * 1024) {
    // 100 MB limit
    return res.status(413).json({ error: "File size exceeds limit of 100MB" });
  }

  try {
    const { keyType, customKeyName } = req.body;
    let privateKeyArmored, passphrase;

    if (keyType === "custom") {
      const keyData = await getKeyFromMemcached(customKeyName);
      if (!keyData) {
        return res.status(404).json({ error: "Custom key not found" });
      }
      privateKeyArmored = keyData.privateKeyArmored;
      passphrase = keyData.passphrase;
    } else {
      const keyInfo = config.pgpKeys.find((key) => key.type === keyType);
      if (!keyInfo) {
        console.error("Key not found for type:", keyType);
        return res.status(404).json({ error: `${keyType} key not found` });
      }

      privateKeyArmored = req.staticKeyPairs[keyType].privateKey; // Adjusted to match working endpoint
      passphrase = keyInfo.passphrase;
    }

    // Decrypt private key
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({
        armoredKey: privateKeyArmored,
      }),
      passphrase: passphrase,
    });

    // Read file contents asynchronously
    const fileBuffer = await fsPromises.readFile(req.file.path);
    const fileData = fileBuffer.toString("utf8");

    // Decrypt file contents
    const decryptedMessage = await openpgp.decrypt({
      message: await openpgp.readMessage({ armoredMessage: fileData }),
      decryptionKeys: privateKey,
    });

    // Send decrypted file to client
    res.writeHead(200, {
      "Content-Disposition": `attachment; filename="${req.file.originalname.replace(
        ".pgp",
        ""
      )}"`,
      "Content-Type": "application/octet-stream",
    });
    res.end(decryptedMessage.data);
  } catch (error) {
    console.error("Error decrypting file:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", debugInfo: error.message });
  }
});

module.exports = router;
