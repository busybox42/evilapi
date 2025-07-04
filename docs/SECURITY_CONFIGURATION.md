# Security Configuration Guide

## Overview

This guide covers how to securely configure Evil Admin Tools to protect against common security vulnerabilities.

## Environment Variables Configuration

### Step 1: Create Environment File

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your secure values:
   ```bash
   nano .env
   ```

### Step 2: Configure Required Security Settings

#### Generate Secure Secrets

Generate cryptographically secure secrets for sessions and JWT:

```bash
# Generate session secret (32+ characters)
openssl rand -hex 32

# Generate JWT secret (32+ characters)  
openssl rand -hex 32
```

Add these to your `.env` file:
```env
SESSION_SECRET=your-generated-session-secret-here
JWT_SECRET=your-generated-jwt-secret-here
```

#### PGP Configuration

**NEVER use the example passphrases!** Generate secure passphrases:

```env
PGP_GENERAL_EMAIL=admin@yourdomain.com
PGP_GENERAL_PASSPHRASE=your-secure-passphrase-here

PGP_EVIL_EMAIL=admin@yourdomain.com
PGP_EVIL_PASSPHRASE=your-different-secure-passphrase-here
```

#### IP Access Control

Configure IP whitelisting for production:

```env
# Only allow specific IPs
IP_WHITELIST=127.0.0.1,::1,your.server.ip.here

# Block known malicious IPs
IP_BLACKLIST=suspicious.ip.here,another.bad.ip.here
```

### Step 3: SSL/TLS Configuration

For production deployments, enable SSL:

```env
SSL_ENABLED=true
SSL_KEY_PATH=/path/to/your/ssl/private.key
SSL_CERT_PATH=/path/to/your/ssl/certificate.crt
SSL_CA_PATH=/path/to/your/ssl/ca-bundle.crt
```

### Step 4: Rate Limiting

Configure appropriate rate limits:

```env
# More restrictive for production
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX=5              # 5 requests per IP per window

# Less restrictive for development
# RATE_LIMIT_MAX=100
```

## Security Best Practices

### 1. File Permissions

Protect your environment file:
```bash
chmod 600 .env
```

### 2. Secret Management

- **Never commit secrets to version control**
- Use environment variables for all sensitive data
- Rotate secrets regularly (every 90 days)
- Use different secrets for different environments

### 3. Network Security

- **Enable IP whitelisting** in production
- **Use HTTPS only** in production
- **Configure firewall rules** to limit access
- **Monitor access logs** for suspicious activity

### 4. Resource Limits

Configure appropriate limits to prevent abuse:

```env
MAX_FILE_SIZE=10485760        # 10MB (adjust as needed)
MAX_MESSAGE_SIZE=10485760     # 10MB (adjust as needed)
MAX_REQUEST_BODY_SIZE=10mb    # Express body parser limit
```

## Configuration Validation

The system automatically validates configuration on startup:

- ✅ **Port validation** - Ensures ports are in valid range
- ✅ **IP validation** - Validates whitelist/blacklist IPs
- ✅ **File path validation** - Checks SSL certificate paths
- ✅ **Secret validation** - Warns about weak secrets
- ✅ **Rate limit validation** - Ensures reasonable limits

## Using the New Configuration

### Switch to Secure Configuration

To use the new secure configuration system:

1. **Update your server.js** to use the new config:
   ```javascript
   // Replace
   const config = require("./config/config");
   
   // With
   const config = require("./config/secureConfig");
   ```

2. **Set up your environment file** as described above

3. **Restart your application**

### Environment-Specific Configuration

#### Development
```env
NODE_ENV=development
DEBUG=true
RATE_LIMIT_MAX=100
SSL_ENABLED=false
```

#### Production
```env
NODE_ENV=production
DEBUG=false
RATE_LIMIT_MAX=5
SSL_ENABLED=true
ENABLE_SECURITY_HEADERS=true
```

## Common Security Issues Fixed

### 1. Hardcoded Credentials ✅
- **Before**: Passphrases stored in config files
- **After**: All secrets from environment variables

### 2. Information Disclosure ✅
- **Before**: SSL paths visible in config
- **After**: Paths from environment variables

### 3. Missing Validation ✅
- **Before**: No validation of configuration
- **After**: Comprehensive validation on startup

### 4. Weak Rate Limiting ✅
- **Before**: 10 requests per 15 minutes
- **After**: 5 requests per 15 minutes (configurable)

## Migration from Old Configuration

### Step 1: Backup Current Configuration
```bash
cp src/config/config.js src/config/config.js.backup
```

### Step 2: Create Environment File
```bash
cp .env.example .env
```

### Step 3: Transfer Settings
Transfer your current settings to the `.env` file:
- Server ports → `SERVER_PORT`, `WEB_SERVER_PORT`
- SSL settings → `SSL_ENABLED`, `SSL_KEY_PATH`, etc.
- Rate limits → `RATE_LIMIT_*` variables
- IP controls → `IP_WHITELIST`, `IP_BLACKLIST`

### Step 4: Update Server Import
In `src/server.js`:
```javascript
// Change this line
const config = require("./config/config");

// To this
const config = require("./config/secureConfig");
```

### Step 5: Test Configuration
```bash
# Test locally
npm start

# Check for validation errors in console
# Look for ✅ Configuration validation passed
```

## Troubleshooting

### Configuration Validation Failed
If you see validation errors:
1. Check the error messages in console
2. Verify all required environment variables are set
3. Ensure IP addresses are valid format
4. Check file paths exist and are readable

### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /path/to/cert.crt -text -noout

# Verify private key matches certificate
openssl rsa -in /path/to/private.key -pubout -outform PEM | sha256sum
openssl x509 -in /path/to/cert.crt -pubkey -noout -outform PEM | sha256sum
```

### Rate Limiting Too Restrictive
If rate limiting is blocking legitimate requests:
1. Increase `RATE_LIMIT_MAX` value
2. Adjust `RATE_LIMIT_WINDOW_MS` for longer window
3. Add legitimate IPs to `IP_WHITELIST`

## Security Monitoring

### Log Analysis
Monitor logs for:
- Failed authentication attempts
- Rate limit violations
- Invalid configuration warnings
- SSL certificate issues

### Regular Security Tasks
- [ ] Review and rotate secrets monthly
- [ ] Update IP whitelist as needed
- [ ] Monitor for new vulnerabilities
- [ ] Review access logs weekly
- [ ] Test SSL certificate expiration

## Questions?

If you have questions about secure configuration:
1. Check the validation warnings in console
2. Review this documentation
3. Test with minimal configuration first
4. Verify environment variables are loaded correctly 