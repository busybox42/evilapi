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

### 14. API Documentation for SPF Validation

#### Endpoint: `/api/validate-spf`

- **Purpose**: Validates the Sender Policy Framework (SPF) record for a specified domain. The API retrieves the SPF record, handles split records and redirects, and provides a detailed validation report.
- **Methods**: GET
- **URL Parameters**:
  - `domain`: The domain name for which the SPF record is being validated.
- **Success Response**:
  - **Code**: 200 OK
  - **Content**:
    - `domain`: The domain name the SPF record belongs to.
    - `record`: The full SPF record string as found in the DNS.
    - `isValid`: A boolean indicating whether the SPF record is valid.
    - `mechanisms`: Array of parsed SPF mechanisms and their parameters.
    - `redirectDomain`: If the record uses a redirect modifier, the target domain.
    - `errors`: Array of any syntax or validation errors found.
    - `warnings`: Array of potential issues or recommendations.
- **Error Response**:
  - **Code**: 404 Not Found
  - **Content**:
    - `error`: "SPF record not found for the specified domain."
  - **Code**: 400 Bad Request
  - **Content**:
    - `error`: "Invalid domain name provided."
- **Notes**:
  - The API handles split TXT records that exceed 255 characters by automatically joining them.
  - Supports SPF redirect mechanism by following the redirect chain.
  - Detects and prevents redirect loops.
  - Validates syntax according to RFC 7208.

### 15. API Documentation for Email Delivery Test

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

### 16. Ping Endpoint

#### Endpoint: `/api/ping/{target}`

- **Purpose**: Performs a ping operation to the specified IP address or hostname.
- **Method**: GET
- **URL Params**:
  - `target`: The IP address or hostname to ping.
- **Response**:
  - A summary of the ping operation, including success status, and ping results.

### 17. Traceroute Endpoint

#### Endpoint: `/api/traceroute/{target}`

- **Purpose**: Executes a traceroute to the specified IP address or hostname.
- **Method**: GET
- **URL Params**:
  - `target`: The IP address or hostname for the traceroute.
- **Response**:
  - A summary of the traceroute operation, including success status, and traceroute results.

### 18. Authentication Endpoint

#### Endpoint: `POST /api/auth`

This endpoint allows users to authenticate against various email and file transfer protocols. It supports a range of protocols including `submission`, `pop3`, `pop3s`, `imap`, `imaps`, `smtp`, `smtps`, `ftp`, and `sftp`.

#### Request Headers

- **Content-Type**: `application/json`

#### Request Body

The request body must include the following fields:

- **username** (string): The user's email address.
- **password** (string): The user's password.
- **hostname** (string): The server's hostname where the authentication should occur.
- **protocol** (string): The protocol to use for authentication. Supported protocols are `submission`, `pop3`, `pop3s`, `imap`, `imaps`, `smtp`, `smtps`, `ftp`, and `sftp`.

### 19. DNS Lookup Endpoint

#### Endpoint: `/api/lookup`

- **Purpose**: Performs a DNS lookup for the specified host and record type, optionally using a specified DNS server.
- **Method**: GET
- **URL Params**:
  - `host`: The hostname or IP address for the DNS lookup.
  - `type`: The type of DNS record to look up (e.g., `A`, `MX`, `PTR`). Defaults to `A` for hostnames and `PTR` for IP addresses if not specified.
  - `dnsServer`: (Optional) The IP address of the DNS server to use for the lookup. If not specified, the system's default DNS server is used.
- **Response**:
  - `host`: The queried hostname or IP address.
  - `type`: The type of DNS record looked up.
  - `addresses`: An array of the lookup results, specific to the record type.
  - `dnsServer`: The DNS server used for the lookup, if specified.
  - On success, returns an object containing the lookup results.
  - On failure, returns an object with an `error` key and a message describing the failure.

### 20. Hash Validation Endpoint

#### Endpoint: `/api/validate-hash`

- **Purpose**: Validates a given password against a specified hash using the chosen algorithm.
- **Method**: POST
- **Request Body**:
  - `algorithm`: The hash algorithm to use (e.g., `md5`, `sha1`, `sha256`, `sha512`, `bcrypt`, `argon2`).
  - `password`: The plaintext password to validate.
  - `hash`: The hash to compare against.
- **Response**:
  - `isValid`: A boolean indicating if the password matches the hash.
  - `algorithm`: The algorithm used for validation.
  - `hash`: The original hash provided in the request.
  - `generatedHash`: The hash generated from the provided password using the specified algorithm.

### 21. DNS Propagation Endpoints

#### Endpoint: `/api/dns/servers`

- **Purpose**: Retrieves a list of global DNS servers used for propagation checks.
- **Method**: GET
- **Response**:
  - `total`: Total number of servers.
  - `servers`: Array of server objects, each with `name`, `ip`, and `location`.
  - `timestamp`: Timestamp of the response.

#### Endpoint: `/api/dns/check`

- **Purpose**: Checks DNS propagation for a single record type across multiple DNS servers.
- **Method**: GET
- **Query Parameters**:
  - `hostname`: The hostname to check.
  - `recordType` (optional): The record type (e.g., `A`, `AAAA`, `MX`, `TXT`). Defaults to `A`.
  - `customServers` (optional): Comma-separated list of custom DNS server IPs to query.
- **Response**:
  - `hostname`: The queried hostname.
  - `recordType`: The record type checked.
  - `timestamp`: Timestamp of the response.
  - `totalServers`: Total number of servers queried.
  - `successful`: Number of successful queries.
  - `failed`: Number of failed queries.
  - `propagationPercentage`: Percentage of successful propagation.
  - `isFullyPropagated`: Boolean indicating full propagation.
  - `hasInconsistentRecords`: Boolean indicating inconsistent records.
  - `uniqueRecordSets`: Number of unique record sets found.
  - `averageResponseTime`: Average response time of successful queries.
  - `totalQueryTime`: Total time taken for all queries.
  - `results`: Array of detailed results from each server.
  - `recordValuesByServer`: Object mapping server names to their record values.
  - `summary`: Object with overall status and messages.

#### Endpoint: `/api/dns/check-multi`

- **Purpose**: Checks DNS propagation for multiple record types across multiple DNS servers.
- **Method**: GET
- **Query Parameters**:
  - `hostname`: The hostname to check.
  - `recordTypes` (optional): Comma-separated list of record types (e.g., `A,MX,TXT`). Defaults to `A,AAAA,MX,TXT`.
- **Response**:
  - `hostname`: The queried hostname.
  - `timestamp`: Timestamp of the response.
  - `recordTypes`: Array of record types checked.
  - `results`: Array of detailed results for each record type.
  - `summary`: Object with overall status and counts.

#### Endpoint: `/api/dns/check-bulk`

- **Purpose**: Performs bulk DNS propagation checks for multiple hostnames.
- **Method**: POST
- **Request Body**:
  - `hostnames`: Array of hostnames to check (max 10).
  - `recordType` (optional): The record type (e.g., `A`). Defaults to `A`.
  - `customServers` (optional): Array of custom DNS server IPs.
- **Response**:
  - `total`: Total number of hostnames requested.
  - `successful`: Number of successful checks.
  - `failed`: Number of failed checks.
  - `results`: Array of detailed results for each hostname.
  - `timestamp`: Timestamp of the response.

### 22. SSL/TLS Scanner Endpoint

#### Endpoint: `/api/ssl-scan`

- **Purpose**: Scans the SSL/TLS configuration and identifies potential vulnerabilities for a given host and port.
- **Method**: POST
- **Request Body**:
  - `host`: The hostname or IP address to scan.
  - `port` (optional): The port to scan (defaults to 443).
- **Response**:
  - `host`: The scanned host.
  - `port`: The scanned port.
  - `vulnerabilities`: Object containing scan results and identified vulnerabilities.
  - `timestamp`: Timestamp of the scan.

### 23. Speed Test Endpoints

#### Endpoint: `/api/speedtest/download`

- **Purpose**: Provides a large payload for download speed testing.
- **Method**: GET
- **Response**:
  - A binary payload of 50MB.

#### Endpoint: `/api/speedtest/upload`

- **Purpose**: Receives a payload for upload speed testing.
- **Method**: POST
- **Request Body**:
  - A binary payload to be uploaded.
- **Response**:
  - `received`: The size of the received payload in bytes.

---

## Additional Notes

- All API requests and responses are in JSON format, except where noted (e.g., raw email headers for analysis).
- Ensure to replace `{domain}` in the URL with the actual domain for the relevant endpoints.
- A secret tool can be accessed by pressing the following sequence of keys: ↑, ↓, ←, →.

For further details or specific examples, refer to the `examples` directory in the project repository.