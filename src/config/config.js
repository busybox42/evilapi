const fs = require('fs');

// Configuration settings
const config = {
  server: {
    port: process.env.PORT || 3011,
    hostname: 'https://www.some-website.tld',
  },
  ssl: {
    enabled: false,
    keyPath: '/opt/evilcrypt/ssl/some-website.tld.key',
    certPath: '/opt/evilcrypt/ssl/some-website.tld.crt',
    caPath: '/opt/evilcrypt/ssl/some-website.tld.ca'
  },
  pgpKeys: [
    {
      type: 'General',
      email: 'somedude@some-website.tld',
      passphrase: 'SuperSecretPassword',
    },
    {
      type: 'Evil',
      email: 'somedude@some-website.tld',
      passphrase: 'SuperEvilPassword',
    }
  ],
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    messageSize: 100 * 1024 * 1024 // 100 MB
  },
  memcached: {
    host: 'localhost',
    port: 11211
  } 
};

// Conditionally load SSL files if SSL is enabled
if (config.ssl.enabled) {
  config.ssl.key = fs.readFileSync(config.ssl.keyPath);
  config.ssl.cert = fs.readFileSync(config.ssl.certPath);
  config.ssl.ca = fs.readFileSync(config.ssl.caPath);
}

module.exports = config;
