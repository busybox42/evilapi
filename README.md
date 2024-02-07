# EvilAPI

## Introduction

EvilAPI is a versatile collection of utilities designed for email and security research. This project is intended for educational and demonstration purposes only.

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
4. [Dependencies](#dependencies)
5. [Configuration](#configuration)
6. [Documentation](#documentation)
7. [Examples](#examples)
8. [API Tests](#api-tests)
9. [Contributors](#contributors)
10. [License](#license)

## Installation

To install EvilAPI, follow these steps:

```bash
git clone https://github.com/busybox42/evilapi.git
cd evilapi
npm install
```

## Usage

Before running EvilAPI, set up the configuration:

1. Copy the example configuration file:

```bash
cp src/config/config.js.example src/config/config.js
```

2. Modify `src/config/config.js` as needed to suit your environment and requirements.

To run EvilAPI locally using Node.js:

```bash
npm start
```

## Docker Usage

Before building the Docker image, ensure to set up the configuration:

1. If you haven't already created a configuration file, ensure that the `src/config/config.js.example` file exists. If not, you can create it by copying the example configuration:

```bash
cp src/config/config.js.example src/config/config.js
```

2. Modify `src/config/config.js` as needed to suit your environment and requirements.

To build and run EvilAPI using Docker:

```bash
docker build -t evilapi .
docker run -p 3011:3011 -p 8080:8080 -e PORT=3011 -e WEB_SERVER_HOST=http://localhost -e WEB_SERVER_PORT=8080 evilapi
```

If no `config.js` file is supplied during the build process, the `start.sh` script will automatically copy the example configuration file (`config.js.example`) to `config.js` before starting the Node.js server.

## Features

EvilAPI offers a range of features with a focus on unconventional and educational purposes:

- **Blacklist Check**: Determines if a domain is on various email blacklists.
- **Email Header Analysis**: Analyzes email headers for spam indicators, sender authenticity, and more.
- **PGP Encryption/Decryption**: Offers endpoints for encrypting and decrypting messages using PGP, including file encryption and decryption.
- **SMTP Server Testing**: Tests SMTP servers for connection reliability, TLS support, and open relay vulnerabilities.
- **Customizable PGP Key Generation**: Generates temporary PGP keys for testing encryption and decryption.
- **Email Info Lookup**: Retrieves MX, SPF, DMARC records, A records, and client settings for a given domain.
- **Whoami Information**: Provides details about the client's IP, browser info, OS, PTR record, geo location, and ISP info, and also supports querying information for a specified IP or hostname.
- **SSL Validation**: Validates SSL certificates for specified hostnames or URLs, detailing certificate validity, issuer information, validity period, and more.
- **Whitespace Removal API**: Provides a utility to remove unnecessary whitespace from text data, improving efficiency in data transmission and storage.
- **Base64 Encoder/Decoder API**: Offers a versatile tool for encoding and decoding data in Base64 format, useful in various encoding scenarios and data handling.
- **Optional Web Server**: Features an optional integrated web server for the API, enhancing usability and accessibility for users preferring web interfaces. This server can be enabled or disabled as per the configuration.
- **Password Hashing**: Provides functionality to hash passwords securely, ensuring confidentiality and integrity in user authentication systems.
- **Port Scanner**: Scans for open ports on specified hosts, useful for network diagnostics and security assessments.
- **Network Tests**: Conducts various network tests, including ping and traceroute, to analyze network connectivity and performance.
- **URL Encoder**: Encodes URLs to ensure proper transmission and interpretation of special characters in web requests.
- **Epoch Converter**: Converts timestamps between epoch time and human-readable date/time formats, facilitating time-related calculations and data analysis.

### Known Issues

The following are known issues with EvilAPI:

1. **Custom PGP Key Dependency**: For custom PGP encryption keys to function correctly, Memcached is required. Without Memcached, the feature will not work.

2. **SSL Configuration Limitations**: SSL setup requires manual file path inputs and does not automatically renew certificates, necessitating manual updates upon expiration.

3. **File Size Limitations**: The API enforces a 100 MB limit for file and message sizes, which might not be suitable for all use cases.

4. **Dependency Vulnerabilities**: Some dependencies may have unresolved security vulnerabilities. Regular updates and checks are recommended.

Please feel free to contribute by addressing these issues or reporting new ones on our [GitHub repository](https://github.com/busybox42/evilapi).

## Dependencies

EvilAPI leverages a range of Node.js packages for its core and specific functionalities:

- **express** (v4.18.2): A robust web application framework for Node.js, facilitating the creation of web servers and APIs.
- **body-parser** (v1.20.2): Middleware that parses incoming request bodies, essential for handling JSON, URL-encoded data, and more.
- **cors** (v2.8.5): Middleware to enable Cross-Origin Resource Sharing (CORS), allowing your API to be accessed from various domains.
- **morgan** (v1.10.0): An HTTP request logger middleware, useful for monitoring and debugging API requests.
- **axios** (v1.6.5): A promise-based HTTP client, ideal for making HTTP requests within your API.
- **geoip-lite** (v1.4.9): A lightweight library for geolocating IP addresses, enhancing your API's capability to provide geographic information.
- **multer** (v1.4.5-lts.1): A middleware for handling `multipart/form-data`, primarily used for uploading files.
- **openpgp** (v5.11.0): A comprehensive library for PGP encryption and decryption, crucial for your API's security-related features.
- **memcached** (v2.2.2): A distributed memory caching system, vital for efficient storage and retrieval of temporary PGP keys.
- **nodemailer** (v6.9.8): A module for sending emails, supporting various transports and features.
- **whois-json** (v2.0.4): For fetching WHOIS data, offering insights into domain registrations and associated details.
- **mailparser** (v3.6.6): A robust module for parsing raw emails into a more readable format.
- **argon2** (v0.31.2): A secure password hashing algorithm, useful for securely storing and verifying passwords.
- **bcrypt** (v5.1.1): Another password hashing algorithm commonly used for securing user passwords.
- **basic-ftp** (v5.0.4): A simple FTP client library, helpful for interacting with FTP servers.
- **dns-socket** (v4.2.2): A DNS client and server implementation for Node.js, allowing DNS resolution and querying.
- **express-ip-access-control** (v1.1.3): Middleware for IP-based access control in Express applications, useful for restricting access based on IP addresses.
- **express-rate-limit** (v7.1.5): Middleware for rate limiting HTTP requests in Express applications, preventing abuse and improving security.
- **imap-simple** (v1.6.3): A simple IMAP client library for Node.js, facilitating interaction with IMAP servers.
- **moment** (v2.30.1): A lightweight JavaScript date library for parsing, manipulating, and formatting dates and times.
- **moment-timezone** (v0.5.45): An extension of the Moment.js library for handling time zone data.
- **node-dns** (v0.1.0): A DNS resolver library for Node.js, providing DNS lookup capabilities.
- **node-pop3** (v0.9.0): A POP3 client library for Node.js, allowing interaction with POP3 servers.
- **ssh2-sftp-client** (v10.0.3): An SFTP (SSH File Transfer Protocol) client library for Node.js, facilitating secure file transfers over SSH.
- **uuid** (v9.0.1): A universally unique identifier (UUID) library for generating unique identifiers.

These dependencies form the backbone of EvilAPI, enabling a wide array of features from basic web server setup to complex security and email-related functionalities.

For running the test script:

- **jest**: A JavaScript testing framework.
- **axios**: Promise-based HTTP client for the browser and Node.js (used in the test script).
- **form-data**: A module to create readable `"multipart/form-data"` streams (used in file upload tests).
- **fs** and **fs.promises**: Node.js file system module for handling file operations in tests.

These dependencies ensure the API can effectively handle various network-related operations, data processing, and security functionalities.

## Configuration

Configuration details for EvilAPI are managed in the `config` directory. Here you can adjust the settings to suit your specific environment and requirements. Key configuration options include:

- Server settings: Define the port and hostname for the API.
- SSL configuration: Enable SSL and specify paths to key, certificate, and CA files.
- PGP keys: Configure PGP keys for encryption and decryption purposes.
- Limits: Set file size limits for uploads and message processing.
- Memcached settings: Specify the host and port for the memcached server, used for managing temporary PGP keys.

Refer to the `config.js` file in the `config` directory for an example and further details on each configuration option.

## Documentation

Further documentation detailing API endpoints and their quirky behaviors can be found in the `docs` directory.

- For detailed API usage, see [API Documentation](docs/API_Documentation.md).

## Examples

For practical examples of using the API, please refer to the [examples directory](./examples) in the project repository.

## API Tests

API tests are designed to ensure the functionality and integrity of the EvilAPI endpoints. Follow the instructions in the `apiTest/README.md` file to setup and run the tests.

## Contributors

- Alan Denniston (author and maintainer)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
