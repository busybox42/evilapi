const fs = require("fs");
const { ConfigValidator, getEnvVar, parseEnvJson, parseEnvList } = require("./configValidator");

// Initialize validator
const validator = new ConfigValidator();

// Secure configuration object using environment variables
const config = {
  // Server configuration
  server: {
    port: getEnvVar('SERVER_PORT', 3011),
    hostname: getEnvVar('SERVER_HOSTNAME', 'localhost'),
    url: getEnvVar('SERVER_URL', 'http://localhost:8080'),
  },

  webServer: {
    enabled: getEnvVar('WEB_SERVER_ENABLED', 'true') === 'true',
    webHost: getEnvVar('WEB_SERVER_HOST', 'http://localhost'),
    webPort: getEnvVar('WEB_SERVER_PORT', 8080),
  },

  // SSL configuration - all paths from environment variables
  ssl: {
    enabled: getEnvVar('SSL_ENABLED', 'false') === 'true',
    keyPath: getEnvVar('SSL_KEY_PATH', ''),
    certPath: getEnvVar('SSL_CERT_PATH', ''),
    caPath: getEnvVar('SSL_CA_PATH', ''),
  },

  // PGP key configuration - no hardcoded credentials
  pgpKeys: parseEnvJson('PGP_KEYS', [
    {
      type: "General",
      email: getEnvVar('PGP_GENERAL_EMAIL', ''),
      passphrase: getEnvVar('PGP_GENERAL_PASSPHRASE', ''),
    },
    {
      type: "Evil",
      email: getEnvVar('PGP_EVIL_EMAIL', ''),
      passphrase: getEnvVar('PGP_EVIL_PASSPHRASE', ''),
    },
  ]),

  // File and message size limits with validation
  limits: {
    fileSize: parseInt(getEnvVar('MAX_FILE_SIZE', '10485760'), 10), // 10MB default
    messageSize: parseInt(getEnvVar('MAX_MESSAGE_SIZE', '10485760'), 10), // 10MB default
  },

  // Memcached configuration
  memcached: {
    host: getEnvVar('MEMCACHED_HOST', 'localhost'),
    port: parseInt(getEnvVar('MEMCACHED_PORT', '11211'), 10),
  },

  // Rate limiting configuration
  rateLimitConfig: {
    windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15 minutes
    max: parseInt(getEnvVar('RATE_LIMIT_MAX', '5'), 10), // 5 requests per IP (more secure)
    message: getEnvVar('RATE_LIMIT_MESSAGE', 'Too many requests from this IP, please try again later.'),
  },

  // IP access control configuration
  ipAccessControlConfig: {
    whitelist: parseEnvList('IP_WHITELIST', ['127.0.0.1', '::1']),
    blacklist: parseEnvList('IP_BLACKLIST', []),
  },

  // Security configuration
  security: {
    // Additional security headers
    enableSecurityHeaders: getEnvVar('ENABLE_SECURITY_HEADERS', 'true') === 'true',
    // CORS configuration
    corsOrigins: parseEnvList('CORS_ORIGINS', ['http://localhost:8080']),
    // Session configuration
    sessionSecret: getEnvVar('SESSION_SECRET', ''),
    // JWT configuration
    jwtSecret: getEnvVar('JWT_SECRET', ''),
    // Maximum request body size
    maxRequestBodySize: getEnvVar('MAX_REQUEST_BODY_SIZE', '10mb'),
  },
};

// Validate configuration
function validateConfiguration() {
  // Validate ports
  validator.validatePort(config.server.port, 'Server port');
  validator.validatePort(config.webServer.webPort, 'Web server port');
  validator.validatePort(config.memcached.port, 'Memcached port');

  // Validate IP access control
  validator.validateIpList(config.ipAccessControlConfig.whitelist, 'IP whitelist');
  validator.validateIpList(config.ipAccessControlConfig.blacklist, 'IP blacklist');

  // Validate rate limiting
  validator.validateRateLimit(config.rateLimitConfig);

  // Validate memory limits
  validator.validateMemoryLimit(config.limits.fileSize, 'File size limit');
  validator.validateMemoryLimit(config.limits.messageSize, 'Message size limit');

  // Validate SSL configuration if enabled
  if (config.ssl.enabled) {
    validator.validateFilePath(config.ssl.keyPath, 'SSL key file');
    validator.validateFilePath(config.ssl.certPath, 'SSL certificate file');
    validator.validateFilePath(config.ssl.caPath, 'SSL CA file', false);
  }

  // Check for hardcoded secrets
  validator.checkForHardcodedSecrets(config);

  // Validate security configuration
  if (config.security.enableSecurityHeaders) {
    // Validate session secret
    if (!config.security.sessionSecret || config.security.sessionSecret.length < 32) {
      validator.warnings.push('Session secret should be at least 32 characters long');
    }

    // Validate JWT secret
    if (!config.security.jwtSecret || config.security.jwtSecret.length < 32) {
      validator.warnings.push('JWT secret should be at least 32 characters long');
    }
  }

  // Validate PGP configuration
  config.pgpKeys.forEach((key, index) => {
    if (!key.email || !key.passphrase) {
      validator.warnings.push(`PGP key ${index + 1} (${key.type}) is missing email or passphrase`);
    }
  });

  // Log validation results
  const results = validator.logResults();
  
  if (!results.isValid) {
    console.error('Configuration validation failed. Please fix the errors above.');
    process.exit(1);
  }

  return results;
}

// Load SSL files if SSL is enabled and paths are valid
if (config.ssl.enabled) {
  try {
    if (config.ssl.keyPath && fs.existsSync(config.ssl.keyPath)) {
      config.ssl.key = fs.readFileSync(config.ssl.keyPath);
    }
    
    if (config.ssl.certPath && fs.existsSync(config.ssl.certPath)) {
      config.ssl.cert = fs.readFileSync(config.ssl.certPath);
    }
    
    if (config.ssl.caPath && fs.existsSync(config.ssl.caPath)) {
      config.ssl.ca = fs.readFileSync(config.ssl.caPath);
    }
  } catch (error) {
    console.error('Error loading SSL files:', error.message);
    process.exit(1);
  }
}

// Validate configuration on load
validateConfiguration();

// Export the validated configuration
module.exports = config; 