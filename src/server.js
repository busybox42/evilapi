const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http'); // For non-SSL
const https = require('https');
const config = require('./config/config');
const pgpRoutes = require('./api/routes/pgpRoutes');
const { initializeStaticKeys } = require('./utils/pgpUtils');

const app = express();

// Initialize static PGP key pairs
let staticKeyPairs;
initializeStaticKeys().then(keys => {
  staticKeyPairs = keys;
  
  // Attach the key pairs to each request
  app.use((req, res, next) => {
    req.staticKeyPairs = staticKeyPairs;
    next();
  });

  // Remaining app setup
  const corsOptions = {
    origin: config.server.hostname, 
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));
  app.use(morgan('combined'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/api/pgp', pgpRoutes);
  app.use(express.static('public'));

  // Global error handler
  app.use((err, req, res, next) => {
    console.error(`Error in ${req.method} ${req.path}:`, err);
    res.status(500).send('Internal Server Error');
  });

  // Conditional SSL Setup
  if (config.ssl.enabled) {
    https.createServer(config.ssl, app).listen(config.server.port, () => {
      console.log(`HTTPS Server running on port ${config.server.port}`);
    });
  } else {
    http.createServer(app).listen(config.server.port, () => {
      console.log(`HTTP Server running on port ${config.server.port}`);
    });
  }
});
