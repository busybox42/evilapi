const Memcached = require('memcached');
const config = require('../config/config');
const { logError } = require('../utils/logger');

const memcached = new Memcached(`${config.memcached.host}:${config.memcached.port}`);

function getKeyFromMemcached(keyName, req) {
  return new Promise((resolve, reject) => {
    memcached.get(keyName, (err, data) => {
      if (err) {
        if (req) logError(req, "Error retrieving key from Memcached", err);
        reject(err);
      } else {
        if (data === null || data === undefined) {
          resolve(null);
        } else {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (parseError) {
            if (req) logError(req, "Error parsing key data from Memcached", parseError);
            reject(parseError);
          }
        }
      }
    });
  });
}

// Function to store a key in Memcached
async function storeKeyInMemcached(keyName, keyData, req) {
    return new Promise((resolve, reject) => {
      // Set the key in Memcached with a specific expiration time (e.g., 3600 seconds)
      memcached.set(keyName, keyData, 3600, (err) => {
        if (err) {
          if (req) logError(req, "Error storing key in Memcached", err);
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
}

module.exports = { getKeyFromMemcached, storeKeyInMemcached };
