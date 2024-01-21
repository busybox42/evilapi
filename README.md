# EvilAPI

## Introduction
EvilAPI is a deliberately mischievous API, developed with for questionable purposes. This project is intended for educational and demonstration purposes only.

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
- **Unpredictable Responses**: Some endpoints are designed to return unexpected or mischievous results, serving as a unique educational tool for understanding API behaviors and troubleshooting.

## Dependencies
EvilAPI relies on the following dependencies for its core functionality and additional features:

- **express**: ^4.18.2 - A web application framework for Node.js.
- **body-parser**: ^1.20.2 - Middleware for parsing incoming request bodies.
- **cors**: ^2.8.5 - Package for providing a Connect/Express middleware that can be used to enable CORS.
- **morgan**: ^1.10.0 - HTTP request logger middleware for Node.js.

Additionally, the following are required for specific functionalities:

- **memcached**: A high-performance distributed memory object caching system, necessary for storing temporary PGP keys.
- **openpgp**: A library for PGP encryption and decryption (required for PGP-related endpoints).

For running the test script:

- **jest**: A JavaScript testing framework.
- **axios**: Promise based HTTP client for the browser and Node.js (used in the test script).
- **form-data**: A module to create readable `"multipart/form-data"` streams (used in file upload tests).
- **fs** and **fs.promises**: Node.js file system module for handling file operations in tests.

## Configuration
Configuration details are located in the `config` directory. Adjust the settings to suit your environment.

## Documentation
Further documentation detailing API endpoints and their quirky behaviors can be found in the `docs` directory.
- For detailed API usage, see [API Documentation](docs/API_Documentation.md).

## Examples
For practical examples of using the API, please refer to the [examples directory](./examples) in the project repository.

## API Tests
API tests are designed to ensure the functionality and integrity of the EvilAPI endpoints. Follow the instructions in the `test/README.md` file to setup and run the tests.

## Contributors
- Alan Denniston (author and maintainer)

## License
This project is licensed under the MIT License - see the LICENSE file for details.
