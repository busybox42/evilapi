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

### 6. Whoami Information Endpoint

#### Endpoint: `/api/whoami`

- **Purpose**: Provides information about the client's IP address, including browser info, OS, PTR record, geo location, and ISP info. It can also accept an IP address or hostname as a query parameter to return information about a specific IP or domain.
- **Methods**: GET
- **Query Parameters**:
  - `ip` (optional): The IP address or hostname to inquire about. If not provided, the API uses the client's IP.
- **Response**:
  - `ip`: The IP address or hostname queried.
  - `geoInfo`: Geographical information about the IP, if available.
  - `ptrRecord`: The PTR record associated with the IP, if available.
  - `ispInfo`: Information about the Internet Service Provider, if available.

### 7. SSL Validation Endpoint

#### Endpoint: `/api/validate-ssl`

- **Purpose**: Validates SSL certificates for a given hostname or URL, providing details about the certificate's validity, issuer, valid duration, and more.
- **Methods**: GET
- **Query Parameters**:
  - `hostname`: The hostname or URL for which the SSL certificate will be validated.
- **Response**:
  - `valid`: A boolean indicating whether the SSL certificate is valid.
  - `details`: Detailed information about the SSL certificate, if valid. Includes:
    - `subject`: Information about whom the SSL certificate is issued to. Contains fields like `CN` (Common Name).
    - `issuer`: Information about the issuer of the SSL certificate. Fields include `C` (Country), `O` (Organization), and `CN` (Common Name).
    - `validFrom`: The start date of the SSL certificate's validity period.
    - `validTo`: The end date of the SSL certificate's validity period.
    - `serialNumber`: The serial number of the SSL certificate

### API Documentation for Base64 Encoding and Decoding

#### Endpoint: `/api/encode`

- **Purpose**: Encodes a given text string into base64 format.
- **Methods**: POST
- **Request Body**:
  - `text`: The plain text string to be encoded.
- **Response**:
  - `encodedText`: The base64 encoded version of the provided text.

#### Endpoint: `/api/decode`

- **Purpose**: Decodes a given base64 encoded string back into plain text.
- **Methods**: POST
- **Request Body**:
  - `encodedText`: The base64 string to be decoded.
- **Response**:
  - `decodedText`: The plain text version of the provided base64 string.

### API Documentation for Remove Whitespace

#### Endpoint: `/api/remove-whitespace`

- **Purpose**: Removes all whitespace from a given text string.
- **Methods**: POST
- **Request Body**:
  - `text`: The text string from which all whitespace will be removed.
- **Response**:
  - `textWithoutWhitespace`: The provided text string with all whitespace removed.

---

## Additional Notes

- All API requests and responses are in JSON format, except where noted (e.g., raw email headers for analysis).
- Ensure to replace `{domain}` in the URL with the actual domain for the relevant endpoints.

For further details or specific examples, refer to the `examples` directory in the project repository.
