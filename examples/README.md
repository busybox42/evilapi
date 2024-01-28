## Examples

Below are examples of how to use the API endpoints with `curl` commands. For more detailed examples, refer to the `examples` directory.

### Email Info API

Get detailed email information for a specific domain:

```bash
curl https://www.some-website.tld:3011/api/email-info/some-website.tld
```

### SMTP Test API

Test SMTP server connectivity and configuration:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"serverAddress": "mail.some-website.tld", "port": "587"}' \
     https://www.some-website.tld:3011/api/test-smtp
```

### Email Blacklist Check

Check if a domain is listed on email blacklists:

```bash
curl https://www.some-website.tld:3011/api/blacklist-check/some-website.tld
```

### Email Header Analysis

Analyze email headers for security and configuration details:

```bash
curl -X POST -H "Content-Type: text/plain" \
     --data-binary "@/path/to/headers.txt" \
     https://www.some-website.tld:3011/api/analyze-headers
```

### PGP Encryption

Encrypt a message using PGP:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"message": "Hello, Some Dude!", "keyType": "General"}' \
     https://www.some-website.tld:3011/api/encrypt
```

### PGP Decryption

Decrypt a PGP encrypted message:

```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"message": "<encrypted_message>", "keyType": "General"}' \
     https://www.some-website.tld:3011/api/decrypt
```

### File Encryption

Encrypt a file using a custom key:

```bash
curl -X POST -F "file=@/path/to/your/file.txt" \
     -F "keyType=custom" \
     -F "customKeyName=YourNameHere" \
     https://www.some-website.tld:3011/api/encrypt-file \
     -o /path/to/encrypted_file.pgp
```

### File Decryption

Decrypt a previously encrypted file:

```bash
curl -X POST -F "file=@/path/to/your/encrypted_file.pgp" \
     -F "keyType=custom" \
     -F "customKeyName=YourNameHere" \
     https://www.some-website.tld:3011/api/decrypt-file \
     -o /path/to/decrypted_file.txt
```

### Fetching Information for the Client's IP Address

This command will return information about the client's IP, such as the browser info, OS, PTR record, geo location, and ISP info, if available.

```bash
curl https://www.some-website.tld:3011/api/whoami
```

### Fetching Information for a Specific IP Address

Replace `8.8.8.8` with the IP address you want to inquire about. This will return similar information as above, but for the specified IP address.

```bash
curl "https://www.some-website.tld:3011/api/whoami?ip=8.8.8.8"
```

### Fetching Information for a Hostname

Replace `example.com` with the hostname you are interested in. The response will include details about the hostname, such as geo location and ISP info.

```bash
curl "https://www.some-website.tld:3011/api/whoami?ip=example.com"
```

### Fetching SSL Informtation for a Hostname

Replace `example.com` with the hostname you are interested in. The response will include details about the SSL certificate for the site.

```bash
curl https://www.some-website.tld:3011/api/validate-ssl?hostname=example.com
```

### 1. Encoding a Text String

This API endpoint allows you to encode a plain text string into base64 format. Replace `"Hello, World!"` with the text you wish to encode. The response will include the base64 encoded version of the provided text.

```bash
curl -X POST https://www.some-website.tld:3011/api/encode -H "Content-Type: application/json" -d '{"text":"Hello, World!"}'
```

### 2. Decoding a Base64 String

This API endpoint allows you to decode a base64 encoded string back into plain text. Replace `"SGVsbG8sIFdvcmxkIQ=="` with the base64 string you wish to decode. The response will include the decoded text.

```bash
curl -X POST https://www.some-website.tld:3011/api/decode -H "Content-Type: application/json" -d '{"encodedText":"SGVsbG8sIFdvcmxkIQ=="}'
```

### Removing Whitespace from a Text String

Replace `"Your text with spaces"` with the text from which you want to remove all whitespace. The response will return the text with all spaces, tabs, and other whitespace characters removed.

```bash
curl -X POST https://www.some-website.tld:3011/api/remove-whitespace -H "Content-Type: application/json" -d '{"text": "Your text with spaces"}'
```

## Scanning Ports on a Host

To scan a host (IP address or hostname) for open ports, replace `"example.com"` with the target host. If you want to scan a specific port, also include the `port` parameter. The response will return an array of objects, each indicating a port number and its status ('open' or 'closed').

- **Scanning Common Ports on a Host:**

  Replace `"example.com"` with the IP address or hostname you want to scan. This example scans the most common ports.

  ```bash
  curl -X GET "https://www.some-website.tld:3011/api/scan?host=example.com"
  ```

- **Scanning a Specific Port on a Host:**

  Replace `"example.com"` and `80` with your target host and the specific port you want to scan.

  ```bash
  curl -X GET "https://www.some-website.tld:3011/api/scan?host=example.com&port=80"
  ```

### Notes and Reminders

- Replace `/path/to/your/file.txt` and `/path/to/your/encrypted_file.pgp` with the actual paths to your files for file encryption and decryption commands.
- Replace `YourNameHere` with the actual name used for custom key generation in encryption and decryption commands.
- Replace `<encrypted_message>` with your actual encrypted message in relevant `curl` commands.
- Each example assumes the API is accessible at `https://www.some-website.tld:3011`. Adjust the URL to match your actual API endpoint.
- For additional examples and specific use cases, please refer to the `examples` directory in the project repository.
