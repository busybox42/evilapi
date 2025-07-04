const crypto = require("crypto");

async function createHash(algorithm, text) {
  if (!crypto.getHashes().includes(algorithm)) {
    throw new Error(`The specified algorithm "${algorithm}" is not supported.`);
  }

  return {
    hash: crypto.createHash(algorithm).update(text).digest("hex"),
    algorithm: algorithm
  };
}

module.exports = {
  createHash,
};
