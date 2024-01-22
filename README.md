# EvilAPI

## Introduction
EvilAPI is a deliberately mischievous API, developed with for questionable purposes. This project is intended for educational and demonstration purposes only.

## Table of Contents
1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
5. [Dependencies](#dependencies)
6. [Configuration](#configuration)
7. [Documentation](#documentation)
8. [Examples](#examples)
9. [API Tests](#api-tests)
10. [Contributors](#contributors)
11. [License](#license)

## Installation
To install EvilAPI, follow these steps:

```bash
git clone https://github.com/busybox42/evilapi.git
cd evilapi
npm install
```

## Usage
To run EvilAPI, use the following command:

```bash
npm start
```

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

### Known Issues
The following are known issues with EvilAPI:

1. **Email Headers API - Work in Progress**: The Email Headers API is currently under development and may contain bugs. Notably, the calculation of time between hops is not accurate, and there may be other parsing issues...

2. **Temporary Key Expiration**: Temporary PGP keys lack an automated expiration or deletion mechanism, leading to potential accumulation of unused keys.

3. **SSL Configuration Limitations**: SSL setup requires manual file path inputs and does not automatically renew certificates, necessitating manual updates upon expiration.

4. **File Size Limitations**: The API enforces a 100 MB limit for file and message sizes, which might not be suitable for all use cases.

5. **Dependency Vulnerabilities**: Some dependencies may have unresolved security vulnerabilities. Regular updates and checks are recommended.

Please feel free to contribute by addressing these issues or reporting new ones on our [GitHub repository](https://github.com/busybox42/evilapi).

## Dependencies
EvilAPI relies on the following dependencies for its core functionality and additional features:

- **express**: ^4.18.2 - A web application framework for Node.js.
- **body-parser**: ^1.20.2 - Middleware for parsing incoming request bodies.
- **cors**: ^2.8.5 - Package for providing a Connect/Express middleware that can be used to enable CORS.
- **morgan**: ^1.10.0 - HTTP request logger middleware for Node.js.

Additionally, the following are required for specific functionalities:

- **memcached**: A high-performance distributed memory object caching system, necessary for storing temporary PGP keys.
- **openpgp**: A library for PGP encryption and decryption (required for PGP-related endpoints).
- **geoip-lite**: A light-weight native JavaScript library for looking up IP addresses to their geographical location.
- **dns**: Node.js DNS module for performing DNS lookups, including reverse DNS lookups (PTR records).
- **whois-json**: A Node.js library for fetching WHOIS information, including ISP details.

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
