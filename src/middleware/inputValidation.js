const { createErrorResponse } = require('./errorHandler');

// Input sanitization helpers
const sanitizeString = (str, maxLength = 255) => {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidHostname = (hostname) => {
  const hostnameRegex = /^[a-zA-Z0-9][a-zA-Z0-9-._]*[a-zA-Z0-9]$/;
  return hostnameRegex.test(hostname) && hostname.length <= 255;
};

const isValidPort = (port) => {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
};

const isValidProtocol = (protocol) => {
  const validProtocols = ['pop3', 'pop3s', 'imap', 'imaps', 'smtp', 'smtps', 'submission', 'ftp', 'sftp'];
  return validProtocols.includes(protocol.toLowerCase());
};

const isValidAlgorithm = (algorithm) => {
  const crypto = require('crypto');
  return crypto.getHashes().includes(algorithm);
};

// Validation middleware factories
const validateAuth = (req, res, next) => {
  const { username, password, hostname, protocol } = req.body;

  // Check required fields
  if (!username || !password || !hostname || !protocol) {
    return res.status(400).json(createErrorResponse(
      'Missing required fields: username, password, hostname, and protocol are required',
      400
    ));
  }

  // Sanitize inputs
  req.body.username = sanitizeString(username, 100);
  req.body.hostname = sanitizeString(hostname, 255);
  req.body.protocol = sanitizeString(protocol, 20);

  // Validate hostname format
  if (!isValidHostname(req.body.hostname)) {
    return res.status(400).json(createErrorResponse(
      'Invalid hostname format',
      400
    ));
  }

  // Validate protocol
  if (!isValidProtocol(req.body.protocol)) {
    return res.status(400).json(createErrorResponse(
      'Invalid protocol. Supported: pop3, pop3s, imap, imaps, smtp, smtps, submission, ftp, sftp',
      400
    ));
  }

  // Validate username length
  if (req.body.username.length === 0 || req.body.username.length > 100) {
    return res.status(400).json(createErrorResponse(
      'Username must be between 1 and 100 characters',
      400
    ));
  }

  // Validate password length (don't sanitize, just check length)
  if (!password || password.length === 0 || password.length > 255) {
    return res.status(400).json(createErrorResponse(
      'Password must be between 1 and 255 characters',
      400
    ));
  }

  next();
};

const validateText = (field = 'text', maxLength = 10485760) => { // 10MB default
  return (req, res, next) => {
    const text = req.body[field];
    
    if (text === undefined || text === null) {
      return res.status(400).json(createErrorResponse(
        `Field '${field}' is required`,
        400
      ));
    }

    if (typeof text !== 'string') {
      return res.status(400).json(createErrorResponse(
        `Field '${field}' must be a string`,
        400
      ));
    }

    if (text.length === 0) {
      return res.status(400).json(createErrorResponse(
        `Field '${field}' cannot be empty`,
        400
      ));
    }

    if (text.length > maxLength) {
      return res.status(400).json(createErrorResponse(
        `Field '${field}' exceeds maximum length of ${maxLength} characters`,
        400
      ));
    }

    next();
  };
};

const validateHash = (req, res, next) => {
  const { algorithm, text, hash, password } = req.body;

  if (!algorithm) {
    return res.status(400).json(createErrorResponse(
      'Algorithm is required',
      400
    ));
  }

  // For hash validation requests, we need either text or password
  if (hash !== undefined) {
    if (!password && !text) {
      return res.status(400).json(createErrorResponse(
        'Password or text is required for hash validation',
        400
      ));
    }
    
    if (typeof hash !== 'string' || hash.length === 0 || hash.length > 1000) {
      return res.status(400).json(createErrorResponse(
        'Invalid hash format',
        400
      ));
    }
  } else {
    // For hash creation, we need text
    if (!text) {
      return res.status(400).json(createErrorResponse(
        'Text is required for hash creation',
        400
      ));
    }
  }

  // Sanitize algorithm
  req.body.algorithm = sanitizeString(algorithm, 50);

  // Validate algorithm
  if (!isValidAlgorithm(req.body.algorithm)) {
    return res.status(400).json(createErrorResponse(
      'Unsupported hash algorithm',
      400
    ));
  }

  next();
};

const validateSmtp = (req, res, next) => {
  const { serverAddress, port } = req.body;

  if (!serverAddress) {
    return res.status(400).json(createErrorResponse(
      'Server address is required',
      400
    ));
  }

  // Sanitize inputs
  req.body.serverAddress = sanitizeString(serverAddress, 255);

  // Validate hostname/IP
  if (!isValidHostname(req.body.serverAddress)) {
    // Check if it's an IP address
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(req.body.serverAddress)) {
      return res.status(400).json(createErrorResponse(
        'Invalid server address format',
        400
      ));
    }
  }

  // Validate port if provided
  if (port !== undefined) {
    if (!isValidPort(port)) {
      return res.status(400).json(createErrorResponse(
        'Port must be a number between 1 and 65535',
        400
      ));
    }
  }

  next();
};

const validatePgp = (req, res, next) => {
  const { name, email, password, message, keyType, customKeyName } = req.body;

  // For key generation
  if (name !== undefined || email !== undefined || password !== undefined) {
    if (!name || !email || !password) {
      return res.status(400).json(createErrorResponse(
        'Name, email, and password are required for key generation',
        400
      ));
    }

    req.body.name = sanitizeString(name, 100);
    req.body.email = sanitizeString(email, 255);

    if (!isValidEmail(req.body.email)) {
      return res.status(400).json(createErrorResponse(
        'Invalid email format',
        400
      ));
    }

    if (password.length < 8) {
      return res.status(400).json(createErrorResponse(
        'Password must be at least 8 characters long',
        400
      ));
    }
  }

  // For encryption/decryption operations
  if (message !== undefined) {
    if (!message || message.length === 0) {
      return res.status(400).json(createErrorResponse(
        'Message is required',
        400
      ));
    }

    if (message.length > 10485760) { // 10MB limit
      return res.status(400).json(createErrorResponse(
        'Message exceeds maximum size of 10MB',
        400
      ));
    }
  }

  // Validate keyType if provided
  if (keyType !== undefined) {
    const validKeyTypes = ['General', 'Evil'];
    if (!validKeyTypes.includes(keyType)) {
      return res.status(400).json(createErrorResponse(
        'Invalid key type. Must be "General" or "Evil"',
        400
      ));
    }
  }

  // Validate customKeyName if provided
  if (customKeyName !== undefined) {
    req.body.customKeyName = sanitizeString(customKeyName, 100);
  }

  next();
};

const validateEmailHeaders = (req, res, next) => {
  const headers = req.body;

  if (!headers || typeof headers !== 'string' || headers.trim() === '') {
    return res.status(400).json(createErrorResponse(
      'Email headers are required and must be a non-empty string',
      400
    ));
  }

  if (headers.length > 1048576) { // 1MB limit for headers
    return res.status(400).json(createErrorResponse(
      'Email headers exceed maximum size of 1MB',
      400
    ));
  }

  next();
};

const validateEmailTest = (req, res, next) => {
  const { smtpConfig, imapConfig, timeout } = req.body;

  if (!smtpConfig || !imapConfig) {
    return res.status(400).json(createErrorResponse(
      'Both SMTP and IMAP configurations are required',
      400
    ));
  }

  // Validate SMTP config
  if (!smtpConfig.host || !smtpConfig.user || !smtpConfig.password) {
    return res.status(400).json(createErrorResponse(
      'SMTP configuration must include host, user, and password',
      400
    ));
  }

  // Validate IMAP config
  if (!imapConfig.host || !imapConfig.user || !imapConfig.password) {
    return res.status(400).json(createErrorResponse(
      'IMAP configuration must include host, user, and password',
      400
    ));
  }

  // Validate hostnames
  if (!isValidHostname(smtpConfig.host) || !isValidHostname(imapConfig.host)) {
    return res.status(400).json(createErrorResponse(
      'Invalid hostname format in SMTP or IMAP configuration',
      400
    ));
  }

  // Validate ports if provided
  if (smtpConfig.port && !isValidPort(smtpConfig.port)) {
    return res.status(400).json(createErrorResponse(
      'Invalid SMTP port number',
      400
    ));
  }

  if (imapConfig.port && !isValidPort(imapConfig.port)) {
    return res.status(400).json(createErrorResponse(
      'Invalid IMAP port number',
      400
    ));
  }

  // Validate timeout
  if (timeout && (typeof timeout !== 'number' || timeout < 1000 || timeout > 300000)) {
    return res.status(400).json(createErrorResponse(
      'Timeout must be between 1000ms (1s) and 300000ms (5min)',
      400
    ));
  }

  next();
};

const validateDnsPropagation = (req, res, next) => {
  const { hostname, recordType } = req.query;

  if (!hostname || typeof hostname !== 'string' || hostname.trim() === '') {
    return res.status(400).json(createErrorResponse(
      'Hostname is required and must be a non-empty string',
      400
    ));
  }

  // Sanitize hostname
  const sanitizedHostname = sanitizeString(hostname.trim(), 255);
  
  // Validate hostname format
  if (!isValidHostname(sanitizedHostname)) {
    return res.status(400).json(createErrorResponse(
      'Invalid hostname format',
      400
    ));
  }

  // Validate record type if provided
  if (recordType) {
    const validRecordTypes = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS', 'PTR', 'SRV', 'SOA'];
    if (!validRecordTypes.includes(recordType.toUpperCase())) {
      return res.status(400).json(createErrorResponse(
        `Invalid record type. Supported types: ${validRecordTypes.join(', ')}`,
        400
      ));
    }
  }

  // Update the query with sanitized hostname
  req.query.hostname = sanitizedHostname;
  
  next();
};

const validateSslScan = (req, res, next) => {
  const { host, port } = req.body;
  if (!host) {
    return res.status(400).json(createErrorResponse('Host is required', 400));
  }
  // Accept hostname or IPv4/IPv6
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/;
  if (!isValidHostname(host) && !ipRegex.test(host)) {
    return res.status(400).json(createErrorResponse('Invalid host format', 400));
  }
  if (port !== undefined && !isValidPort(port)) {
    return res.status(400).json(createErrorResponse('Port must be 1-65535', 400));
  }
  req.body.host = sanitizeString(host, 255);
  next();
};

module.exports = {
  validateAuth,
  validateText,
  validateHash,
  validateSmtp,
  validatePgp,
  validateEmailHeaders,
  validateEmailTest,
  validateDnsPropagation,
  validateSslScan,
  sanitizeString,
  isValidEmail,
  isValidHostname,
  isValidPort,
  isValidProtocol,
  isValidAlgorithm
}; 