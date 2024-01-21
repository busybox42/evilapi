# EvilAPI Documentation

## Overview

This document provides detailed information about the API endpoints of EvilAPI. Each section below describes a specific endpoint, including its functionality, request format, and response structure.

---

### 1. Email Information Endpoint

#### Endpoint: `/api/email-info/{domain}`

- **Purpose**: Retrieves email configuration information for a specified domain.
- **Method**: GET
- **URL Params**:
  - `domain`: The domain to query.
- **Response**:
  - `mxRecords`: Array of MX records for the domain.
  - `spfRecord`: SPF record details.
  - `dmarcRecord`: DMARC policy.
  - `aRecord`: A record details.
  - `clientSettings`: Client-specific settings.

### 2. SMTP Test Endpoint

#### Endpoint: `/api/test-smtp`

- **Purpose**: Tests an SMTP server's connection and configuration.
- **Method**: POST
- **Request Body**:
  - `serverAddress`: SMTP server address.
  - `port`: SMTP server port.
- **Response**:
  - `connection`: Connection status.
  - `transactionTimeMs`: Time taken for the transaction.
  - `reverseDnsMismatch`: Reverse DNS mismatch status.
  - `tlsSupport`: TLS support status.
  - `openRelay`: Open relay status.

### 3. Email Blacklist Check Endpoint

#### Endpoint: `/api/blacklist-check/{domain}`

- **Purpose**: Checks if a domain is on any email blacklists.
- **Method**: GET
- **URL Params**:
  - `domain`: The domain to check.
- **Response**:
  - `identifier`: The domain checked.
  - `ip`: IP address associated with the domain.
  - `blacklistResults`: Blacklist check results.

### 4. Email Header Analysis Endpoint

#### Endpoint: `/api/analyze-headers`

- **Purpose**: Analyzes email headers for diagnostics.
- **Method**: POST
- **Request Body**:
  - Email header as raw text.
- **Response**:
  - Analyzed details from the email header.

### 5. PGP Encryption and Decryption Endpoints

#### Endpoints: `/api/encrypt`, `/api/decrypt`, `/api/encrypt-file`, `/api/decrypt-file`

- **Purpose**: Provides PGP encryption and decryption services.
- **Methods**: POST
- **Request Body for Encryption**:
  - `message`: The message or file content to encrypt.
  - `keyType`: Type of key to use for encryption.
- **Response**:
  - Encrypted message or file.
- **Request Body for Decryption**:
  - `message`: The encrypted message or file content to decrypt.
  - `keyType`: Type of key to use for decryption.
- **Response**:
  - Decrypted message or file.

---

## Additional Notes

- All API requests and responses are in JSON format, except where noted (e.g., raw email headers for analysis).
- Ensure to replace `{domain}` in the URL with the actual domain for the relevant endpoints.

For further details or specific examples, refer to the `examples` directory in the project repository.
