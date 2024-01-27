const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const config = require("./config/config");
const { initializeStaticKeys } = require("./utils/pgpUtils");

const app = express();
const webApp = express();

// Function to dynamically load route and service files
const loadFiles = (directoryPath, appInstance) => {
  fs.readdirSync(directoryPath).forEach((file) => {
    if (file.endsWith(".js")) {
      const filePath = path.join(directoryPath, file);
      const fileModule = require(filePath);
      if (typeof fileModule === "function") {
        appInstance.use("/api", fileModule);
      }
    }
  });
};

(async () => {
  try {
    // Initialize static PGP key pairs
    const staticKeyPairs = await initializeStaticKeys();

    // Attach the key pairs to each request
    app.use((req, res, next) => {
      req.staticKeyPairs = staticKeyPairs;
      next();
    });

    const corsOptions = {
      origin: config.server.hostname,
      optionsSuccessStatus: 200,
    };

    app.use(cors(corsOptions));
    app.use(morgan("combined"));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Dynamically load route and service files
    loadFiles(path.join(__dirname, "api", "routes"), app);
    loadFiles(path.join(__dirname, "services"), app);

    // Optional Web Server Configuration
    if (config.webServer.enabled) {
      webApp.use(express.static(path.join(__dirname, "web-interface")));

      webApp.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "web-interface", "index.html"));
      });

      http.createServer(webApp).listen(config.webServer.webPort, () => {
        console.log(`Web Server running on port ${config.webServer.webPort}`);
      });
    }

    // Global error handler
    app.use((err, req, res, next) => {
      console.error(`Error in ${req.method} ${req.path}:`, err);
      res.status(500).send("Internal Server Error");
    });

    // Start the server
    if (config.ssl.enabled) {
      https.createServer(config.ssl, app).listen(config.server.port, () => {
        console.log(`HTTPS Server running on port ${config.server.port}`);
      });
    } else {
      http.createServer(app).listen(config.server.port, () => {
        console.log(`HTTP Server running on port ${config.server.port}`);
      });
    }
  } catch (error) {
    console.error("Failed to initialize static key pairs:", error);
  }
})();
