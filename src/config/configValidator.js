const fs = require("fs");
const path = require("path");

// Configuration validation utilities
class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  // Validate required environment variables
  validateRequiredEnvVars(requiredVars) {
    const missing = [];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      this.errors.push(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return missing.length === 0;
  }

  // Validate port number
  validatePort(port, name = 'Port') {
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      this.errors.push(`${name} must be a valid port number (1-65535), got: ${port}`);
      return false;
    }
    return true;
  }

  // Validate file paths and existence
  validateFilePath(filePath, name = 'File', required = true) {
    if (!filePath) {
      if (required) {
        this.errors.push(`${name} path is required`);
      }
      return false;
    }

    try {
      const fullPath = path.resolve(filePath);
      if (!fs.existsSync(fullPath)) {
        if (required) {
          this.errors.push(`${name} not found at path: ${filePath}`);
        } else {
          this.warnings.push(`${name} not found at path: ${filePath}`);
        }
        return false;
      }
      return true;
    } catch (error) {
      this.errors.push(`Invalid ${name} path: ${filePath} - ${error.message}`);
      return false;
    }
  }

  // Validate IP addresses
  validateIpAddress(ip) {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (ip === 'localhost' || ip === '::1') {
      return true;
    }
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // Validate IP whitelist/blacklist
  validateIpList(ipList, name = 'IP list') {
    if (!Array.isArray(ipList)) {
      this.errors.push(`${name} must be an array`);
      return false;
    }

    const invalidIps = ipList.filter(ip => !this.validateIpAddress(ip));
    if (invalidIps.length > 0) {
      this.errors.push(`${name} contains invalid IP addresses: ${invalidIps.join(', ')}`);
      return false;
    }

    return true;
  }

  // Check for hardcoded credentials
  checkForHardcodedSecrets(config) {
    const sensitivePatterns = [
      { pattern: /password.*[:=]\s*["'].*["']/i, message: 'Hardcoded password detected' },
      { pattern: /passphrase.*[:=]\s*["'].*["']/i, message: 'Hardcoded passphrase detected' },
      { pattern: /secret.*[:=]\s*["'].*["']/i, message: 'Hardcoded secret detected' },
      { pattern: /key.*[:=]\s*["'].*["']/i, message: 'Hardcoded key detected' },
      { pattern: /token.*[:=]\s*["'].*["']/i, message: 'Hardcoded token detected' },
    ];

    const configStr = JSON.stringify(config);
    
    for (const { pattern, message } of sensitivePatterns) {
      if (pattern.test(configStr)) {
        this.warnings.push(`${message} - consider using environment variables`);
      }
    }
  }

  // Validate memory limits
  validateMemoryLimit(limit, name = 'Memory limit') {
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum <= 0) {
      this.errors.push(`${name} must be a positive number, got: ${limit}`);
      return false;
    }

    // Warn if limit is too high (>500MB)
    if (limitNum > 500 * 1024 * 1024) {
      this.warnings.push(`${name} is very high (${Math.round(limitNum / 1024 / 1024)}MB), consider reducing for security`);
    }

    return true;
  }

  // Validate rate limiting configuration
  validateRateLimit(rateLimitConfig) {
    if (!rateLimitConfig || typeof rateLimitConfig !== 'object') {
      this.errors.push('Rate limit configuration is required');
      return false;
    }

    const { windowMs, max, message } = rateLimitConfig;

    if (!windowMs || windowMs < 1000) {
      this.errors.push('Rate limit window must be at least 1000ms');
      return false;
    }

    if (!max || max < 1 || max > 10000) {
      this.errors.push('Rate limit max must be between 1 and 10000 requests');
      return false;
    }

    if (!message || typeof message !== 'string') {
      this.errors.push('Rate limit message must be a non-empty string');
      return false;
    }

    return true;
  }

  // Get validation results
  getResults() {
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  // Log validation results
  logResults(logger = console) {
    const results = this.getResults();
    
    if (results.errors.length > 0) {
      logger.error('❌ Configuration validation failed:');
      results.errors.forEach(error => logger.error(`  - ${error}`));
    }

    if (results.warnings.length > 0) {
      logger.warn('⚠️  Configuration warnings:');
      results.warnings.forEach(warning => logger.warn(`  - ${warning}`));
    }

    if (results.isValid) {
      logger.info('✅ Configuration validation passed');
    }

    return results;
  }
}

// Helper function to get environment variable with validation
const getEnvVar = (name, defaultValue = null, required = false) => {
  const value = process.env[name];
  
  if (!value && required) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value || defaultValue;
};

// Helper function to parse JSON environment variables safely
const parseEnvJson = (envVar, defaultValue = null) => {
  const value = process.env[envVar];
  
  if (!value) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON in environment variable ${envVar}: ${error.message}`);
  }
};

// Helper function to parse comma-separated values
const parseEnvList = (envVar, defaultValue = []) => {
  const value = process.env[envVar];
  
  if (!value) {
    return defaultValue;
  }
  
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

module.exports = {
  ConfigValidator,
  getEnvVar,
  parseEnvJson,
  parseEnvList
}; 