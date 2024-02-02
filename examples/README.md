## Examples

Below are examples of how to use the API endpoints with `curl` commands. For more detailed examples, refer to the `examples` directory.

### Email Info API

Get detailed email information for a specific domain:

```bash
curl http://localhost:3011/api/email-info/some-website.tld
```

### SMTP Test API

Test SMTP server connectivity and configuration:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"serverAddress": "mail.some-website.tld", "port": "587"}' \
     http://localhost:3011/api/test-smtp
```

### Email Blacklist Check

Check if a domain is listed on email blacklists:

```bash
curl http://localhost:3011/api/blacklist-check/some-website.tld
```

### Email Header Analysis

Analyze email headers for security and configuration details:

```bash
curl -X POST -H "Content-Type: text/plain" \
     --data-binary "@/path/to/headers.txt" \
     http://localhost:3011/api/analyze-headers
```

### PGP Encryption

Encrypt a message using PGP:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"message": "Hello, Some Dude!", "keyType": "General"}' \
     http://localhost:3011/api/encrypt
```

### PGP Decryption

Decrypt a PGP encrypted message:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"message": "<encrypted_message>", "keyType": "General"}' \
     http://localhost:3011/api/decrypt
```

### File Encryption

Encrypt a file using a custom key:

```bash
curl -X POST -F "file=@/path/to/your/file.txt" \
     -F "keyType=custom" \
     -F "customKeyName=YourNameHere" \
     http://localhost:3011/api/encrypt-file \
     -o /path/to/encrypted_file.pgp
```

### File Decryption

Decrypt a previously encrypted file:

```bash
curl -X POST -F "file=@/path/to/your/encrypted_file.pgp" \
     -F "keyType=custom" \
     -F "customKeyName=YourNameHere" \
     http://localhost:3011/api/decrypt-file \
     -o /path/to/decrypted_file.txt
```

### Fetching Information for the Client's IP Address

This command will return information about the client's IP, such as the browser info, OS, PTR record, geo location, and ISP info, if available.

```bash
curl http://localhost:3011/api/whoami
```

### Fetching Information for a Specific IP Address

Replace `8.8.8.8` with the IP address you want to inquire about. This will return similar information as above, but for the specified IP address.

```bash
curl "http://localhost:3011/api/whoami?ip=8.8.8.8"
```

### Fetching Information for a Hostname

Replace `example.com` with the hostname you are interested in. The response will include details about the hostname, such as geo location and ISP info.

```bash
curl "http://localhost:3011/api/whoami?ip=example.com"
```

### Fetching SSL Informtation for a Hostname

Replace `example.com` with the hostname you are interested in. The response will include details about the SSL certificate for the site.

```bash
curl http://localhost:3011/api/validate-ssl?hostname=example.com
```

### 1. Encoding a Text String

This API endpoint allows you to encode a plain text string into base64 format. Replace `"Hello, World!"` with the text you wish to encode. The response will include the base64 encoded version of the provided text.

```bash
curl -X POST http://localhost:3011/api/encode -H "Content-Type: application/json" -d '{"text":"Hello, World!"}'
```

### 2. Decoding a Base64 String

This API endpoint allows you to decode a base64 encoded string back into plain text. Replace `"SGVsbG8sIFdvcmxkIQ=="` with the base64 string you wish to decode. The response will include the decoded text.

```bash
curl -X POST http://localhost:3011/api/decode -H "Content-Type: application/json" -d '{"encodedText":"SGVsbG8sIFdvcmxkIQ=="}'
```

### Removing Whitespace from a Text String

Replace `"Your text with spaces"` with the text from which you want to remove all whitespace. The response will return the text with all spaces, tabs, and other whitespace characters removed.

```bash
curl -X POST http://localhost:3011/api/remove-whitespace -H "Content-Type: application/json" -d '{"text": "Your text with spaces"}'
```

## Scanning Ports on a Host

To scan a host (IP address or hostname) for open ports, replace `"example.com"` with the target host. If you want to scan a specific port, also include the `port` parameter. The response will return an array of objects, each indicating a port number and its status ('open' or 'closed').

- **Scanning Common Ports on a Host:**

  Replace `"example.com"` with the IP address or hostname you want to scan. This example scans the most common ports.

  ```bash
  curl -X GET "http://localhost:3011/api/scan?host=example.com"
  ```

- **Scanning a Specific Port on a Host:**

  Replace `"example.com"` and `80` with your target host and the specific port you want to scan.

  ```bash
  curl -X GET "http://localhost:3011/api/scan?host=example.com&port=80"
  ```

### Looking Up DKIM Records for a Domain

To verify the presence and content of DomainKeys Identified Mail (DKIM) records for a specific domain and selector, replace `"example.com"` with your domain name and `"myselector"` with your DKIM selector. The response will include any valid DKIM records found, along with a message confirming their validity.

```bash
curl "http://localhost:3011/api/lookup-dkim?domain=example.com&selector=myselector"
```

### Generating DKIM Keys for Your Domain

To generate DKIM keys for your domain, replace `"myselector"` with your chosen DKIM selector and `"example.com"` with your domain name. The API will return the DKIM public record for DNS insertion and the private key for email signing.

```bash
curl "http://localhost:3011/api/generate-dkim-keys?selector=myselector&domain=example.com"
```

This request queries the API to retrieve DKIM records associated with the specified domain and selector. The response includes:

- A `message` confirming the presence of valid DKIM records.
- An array of `records` containing the DKIM records found. These records are crucial for verifying the authenticity of emails sent from the domain.
- The `lookedUp` value showing the specific DKIM selector and domain queried.

### Validating DMARC Record for Your Domain

To validate the DMARC record for your domain, replace `"example.com"` with your actual domain name. This request checks the DMARC policy of your domain and returns detailed information about the record, including its policy, alignment modes, and reporting addresses.

```bash
curl "http://localhost:3011/api/validate-dmarc?domain=example.com"
```

### Notes and Reminders

- Replace `/path/to/your/file.txt` and `/path/to/your/encrypted_file.pgp` with the actual paths to your files for file encryption and decryption commands.
- Replace `YourNameHere` with the actual name used for custom key generation in encryption and decryption commands.
- Replace `<encrypted_message>` with your actual encrypted message in relevant `curl` commands.
- Each example assumes the API is accessible at `http://localhost:3011`. Adjust the URL to match your actual API endpoint.
- For additional examples and specific use cases, please refer to the `examples` directory in the project repository.
