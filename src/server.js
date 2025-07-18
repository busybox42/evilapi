const express = require("express");
const rateLimit = require("express-rate-limit");
const ipAccessControl = require("express-ip-access-control");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const config = require("./config/secureConfig");
const { initializeStaticKeys } = require("./utils/pgpUtils");
const { globalErrorHandler } = require("./middleware/errorHandler");
const dkimGenKeyRoute = require("./api/routes/dkimGenKeyRoute");
const dkimLookUpRoute = require("./api/routes/dkimLookUpRoute");
const spfValidationRoute = require("./api/routes/spfValidationRoute");

const app = express();
const webApp = express();

// Trust only our nginx proxy
app.set('trust proxy', '127.0.0.1');

// IP access control for logging blacklisted IPs
app.use((req, res, next) => {
  // Normalize the IP address format for comparison
  let { ip } = req;

  // Attempt to normalize IPv6 representations of IPv4 addresses
  if (ip.substr(0, 7) === "::ffff:") {
    ip = ip.substr(7);
  }

  const { blacklist, whitelist } = config.ipAccessControlConfig;

  if (blacklist.includes(ip)) {
    console.log(`Blacklisted IP Attempt: ${ip}`);
    return res
      .status(403)
      .send("Access from your IP address has been blocked.");
  }

  if (whitelist.includes(ip)) {
    req.isWhitelisted = true; // Mark the request to skip rate limiting
  }

  next();
});

// Apply the rate limiter to /api routes
const limiter = rateLimit({
  windowMs: config.rateLimitConfig.windowMs,
  max: config.rateLimitConfig.max,
  message: config.rateLimitConfig.message,
  handler: (req, res) => {
    console.log(`Rate Limit Exceeded for ${req.ip}`);
    res.status(429).send(config.rateLimitConfig.message);
  },
  skip: (req) => {
    // Skip rate limiting for whitelisted IPs
    return !!req.isWhitelisted;
  },
  // Add standardHeaders to get rate limit info in response headers
  standardHeaders: true,
  // Disable legacy headers
  legacyHeaders: false,
  // Use a more secure key generator that includes forwarded IP
  keyGenerator: (req) => {
    const realIp = req.ip;
    const userAgent = req.get('user-agent') || 'unknown';
    return `${realIp}-${userAgent}`;
  },
});

app.use("/api", limiter);

// Function to dynamically load route files
const loadRoutes = (directoryPath, appInstance) => {
  fs.readdirSync(directoryPath).forEach((file) => {
    if (file.endsWith(".js") && file !== 'speedTestRoute.js') {
      const filePath = path.join(directoryPath, file);
      const fileModule = require(filePath);
      if (typeof fileModule === "function") {
        appInstance.use("/api", fileModule);
      }
    }
  });
};

// Function to initialize services (not load as routes)
const initializeServices = (directoryPath) => {
  const services = {};
  fs.readdirSync(directoryPath).forEach((file) => {
    if (file.endsWith(".js")) {
      const filePath = path.join(directoryPath, file);
      const serviceName = file.replace(".js", "");
      services[serviceName] = require(filePath);
    }
  });
  return services;
};

// Function to prune uploads directory
function pruneUploads() {
  const uploadsDir = path.join(__dirname, "uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    const now = new Date().getTime();

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const fileStat = fs.statSync(filePath);
      const age = now - fileStat.mtimeMs;

      if (age > 86400000) {
        // If the file is older than 24 hours (86400000 ms)
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete old file: ${file}`, err);
          } else {
            console.log(`Deleted old file: ${file}`);
          }
        });
      }
    });
  }
}

(async () => {
  try {
    // Initialize static PGP key pairs
    // Assuming this function exists and works correctly
    const staticKeyPairs = await initializeStaticKeys();

    app.use((req, res, next) => {
      req.staticKeyPairs = staticKeyPairs;
      next();
    });

    const corsOptions = {
      origin: config.server.url,
      optionsSuccessStatus: 200,
    };

    app.use(cors(corsOptions));
    app.use(morgan("combined"));
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Dynamically load route files
    loadRoutes(path.join(__dirname, "api", "routes"), app);

    // Manually load and mount the speed test route
    const speedTestRoute = require(path.join(__dirname, "api", "routes", "speedTestRoute.js"));
    app.use("/api/speedtest", speedTestRoute);

    // Register routes
    app.use("/api", [
        dkimGenKeyRoute,
        dkimLookUpRoute,
        spfValidationRoute,
    ]);
    
    // Serve static documentation files
    app.use('/docs', express.static(path.join(__dirname, '..', 'docs')));

    // Initialize services
    const services = initializeServices(path.join(__dirname, "services"));

    // Optional Web Server Configuration
    if (config.webServer.enabled) {
      webApp.use(express.static(path.join(__dirname, "web-interface")));

      webApp.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "web-interface", "index.html"));
      });

      app.use(webApp);
      http.createServer(app).listen(config.webServer.webPort, () => {
        console.log(`Web Server running on port ${config.webServer.webPort}`);
      });
    }

    // Global error handler
    app.use((req, res, next) => {
      const error = new Error("Not Found");
      error.status = 404;
      next(error);
    });

    app.use(globalErrorHandler);

    // Start the server
    if (config.ssl.enabled) {
      https
        .createServer(
          {
            key: fs.readFileSync(config.ssl.keyPath),
            cert: fs.readFileSync(config.ssl.certPath),
            ca: fs.readFileSync(config.ssl.caPath),
          },
          app
        )
        .listen(config.server.port, () => {
          console.log(`HTTPS API Server running on port ${config.server.port}`);
        });
    } else {
      http.createServer(app).listen(config.server.port, () => {
        console.log(`HTTP API Server running on port ${config.server.port}`);
      });
    }

    // Start the cleanup process every day
    setInterval(pruneUploads, 86400000); // 24 hours in milliseconds
  } catch (error) {
    console.error("Failed to initialize static key pairs:", error);
  }
})();
