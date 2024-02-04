// src/services/hashService.js

const crypto = require("crypto");

async function createHash(algorithm, text) {
  if (!crypto.getHashes().includes(algorithm)) {
    throw new Error(`The specified algorithm "${algorithm}" is not supported.`);
  }

  return crypto.createHash(algorithm).update(text).digest("hex");
}

module.exports = {
  createHash,
};
