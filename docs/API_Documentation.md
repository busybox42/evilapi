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

### 8. API Documentation for Base64 Encoding and Decoding

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

### 9. API Documentation for Remove Whitespace

#### Endpoint: `/api/remove-whitespace`

- **Purpose**: Removes all whitespace from a given text string.
- **Methods**: POST
- **Request Body**:
  - `text`: The text string from which all whitespace will be removed.
- **Response**:
  - `textWithoutWhitespace`: The provided text string with all whitespace removed.

### 10. API Documentation for Port Scan

#### Endpoint: `/api/scan`

- **Purpose**: Scans the specified host (IP address or hostname) for open ports. It can scan either common ports or a specific port if provided.
- **Methods**: GET
- **Request Parameters**:
  - `host`: The IP address or hostname of the target for the port scan.
  - `port` (optional): A specific port to scan on the target host. If not provided, common ports will be scanned.
- **Response**:
  - An array of objects, each representing a port and its status. Each object contains:
    - `port`: The port number.
    - `status`: The status of the port, either 'open' or 'closed'.

### 11. API Documentation for DKIM Record Lookup

#### Endpoint: `/api/lookup-dkim`

- **Purpose**: Looks up DomainKeys Identified Mail (DKIM) records for a specified domain and selector to verify the presence and validity of the records.
- **Methods**: GET
- **URL Parameters**:
  - `domain`: The domain name for which DKIM records are being requested.
  - `selector`: The selector string used to query specific DKIM records associated with the domain.
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    - `message`: Descriptive message regarding the lookup result.
    - `records`: Array of strings representing the found DKIM records.
    - `lookedUp`: The complete selector record string that was looked up.
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    - `error`: "DKIM records not found or invalid parameters provided."

### 12. API Documentation for DKIM Key Generation

#### Endpoint: `/api/generate-dkim-keys`

- **Purpose**: Generates a new set of DomainKeys Identified Mail (DKIM) keys for a specified domain and selector. This includes both the public DKIM record to be added to the domain's DNS and the private key for signing emails.
- **Methods**: GET
- **URL Parameters**:
  - `selector`: The selector string that will be used to distinguish the DKIM public key in the DNS records.
  - `domain`: The domain name for which the DKIM keys are being generated.
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    - `dkimRecord`: The full DKIM TXT record to be added to the domain's DNS. This includes the selector, public key, and other necessary DKIM parameters.
    - `privateKeyWarning`: A warning message about the handling of the private key.
    - `privateKey`: The private key in PEM format. This key should be securely stored and used to sign outgoing emails from the domain.
- **Error Response**:
  - **Code**: 400 Bad Request
  - **Content**:
    - `error`: "Invalid request parameters. Please check the selector and domain name."
  - **Code**: 500 Internal Server Error
  - **Content**:
    - `error`: "An error occurred during the key generation process."

### 13. API Documentation for DMARC Record Validation

#### Endpoint: `/api/validate-dmarc`

- **Purpose**: Validates the Domain-based Message Authentication, Reporting, and Conformance (DMARC) record for a specified domain. The API retrieves the DMARC record, parses it, and provides a detailed report on each tag in the record, along with overall validation tests.
- **Methods**: GET
- **URL Parameters**:
  - `domain`: The domain name for which the DMARC record is being validated.
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    - `dmarc`: The domain name the DMARC record belongs to.
    - `record`: The full DMARC record string as found in the DNS.
    - `report`: An array of objects, each representing a DMARC tag in the record, including the tag name, value, and a description of what it specifies.
    - `tests`: An array of test results related to the DMARC record validation, including test name, result, and description.
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    - `error`: "DMARC record not found for the specified domain."
  - **Code**: 400 Bad Request
  - **Content**:
    - `error`: "Invalid domain name provided."
- **Notes**:
  - The `report` section provides a detailed breakdown of the DMARC record, explaining each part of the record for better understanding and validation purposes.
  - The `tests` section summarizes the validation results, indicating whether the DMARC record is correctly published and syntactically valid.
  - It's crucial to ensure the domain name is correctly specified to retrieve and validate the DMARC record accurately.
  - This API is beneficial for administrators and security teams to verify the DMARC policy's correctness and effectiveness in combating email spoofing and phishing attacks.

### 14. API Documentation for Email Delivery Test

#### Endpoint: `/api/test-email-delivery`

- **Purpose**: Tests email delivery by sending an email to the specified recipient using SMTP and then verifying its arrival through IMAP. It utilizes a unique identifier to ensure the specific email sent is the one checked for arrival.
- **Methods**: POST
- **Request Body**:
  - `smtpConfig`: Configuration for SMTP to send the email.
    - `host`: The hostname or IP address of the SMTP server.
    - `port`: The port on which the SMTP server is listening.
    - `user`: The username for SMTP authentication.
    - `password`: The password for SMTP authentication.
    - `from`: The email address from which the email will be sent.
    - `to`: The recipient email address.
  - `imapConfig`: Configuration for IMAP to check the email's arrival.
    - `user`: The username for IMAP authentication.
    - `password`: The password for IMAP authentication.
    - `host`: The hostname or IP address of the IMAP server.
    - `port`: The port on which the IMAP server is listening.
    - `tls`: A boolean indicating if TLS should be used for the IMAP connection.
    - `authTimeout`: The timeout in milliseconds for IMAP authentication (optional).
  - `timeout`: The duration in milliseconds to wait for the email to arrive before timing out.
- **Response**:
  - On success, returns an object with the following properties:
    - `success`: A boolean indicating the operation was successful (true).
    - `message`: A string message, "Email successfully received."
    - `details`: An object containing information about the received email:
      - `from`: The sender's email address.
      - `subject`: The subject of the email.
      - `date`: The date and time the email was received.
  - On failure (email not received within the timeout period or an error occurred), returns an object with:
    - `success`: A boolean indicating the operation was unsuccessful (false).
    - `message`: A string message detailing the failure, such as "Email not received within the timeout period." or the error message.

### 15. Ping Endpoint

#### Endpoint: `/api/ping/{target}`

- **Purpose**: Performs a ping operation to the specified IP address or hostname.
- **Method**: GET
- **URL Params**:
  - `target`: The IP address or hostname to ping.
- **Response**:
  - A summary of the ping operation, including success status, and ping results.

### 16. Traceroute Endpoint

#### Endpoint: `/api/traceroute/{target}`

- **Purpose**: Executes a traceroute to the specified IP address or hostname.
- **Method**: GET
- **URL Params**:
  - `target`: The IP address or hostname for the traceroute.
- **Response**:
  - A summary of the traceroute operation, including success status, and traceroute results.

## 16. Authentication Endpoint

#### Endpoint: POST /api/auth

This endpoint allows users to authenticate against various email and file transfer protocols. It supports a range of protocols including `submission`, `pop3`, `pop3s`, `imap`, `imaps`, `smtp`, `smtps`, `ftp`, and `sftp`.

#### Request Headers

- **Content-Type**: `application/json`

#### Request Body

The request body must include the following fields:

- **username** (string): The user's email address.
- **password** (string): The user's password.
- **hostname** (string): The server's hostname where the authentication should occur.
- **protocol** (string): The protocol to use for authentication. Supported protocols are `submission`, `pop3`, `pop3s`, `imap`, `imaps`, `smtp`, `smtps`, `ftp`, and `sftp`.

---

## Additional Notes

- All API requests and responses are in JSON format, except where noted (e.g., raw email headers for analysis).
- Ensure to replace `{domain}` in the URL with the actual domain for the relevant endpoints.

For further details or specific examples, refer to the `examples` directory in the project repository.
