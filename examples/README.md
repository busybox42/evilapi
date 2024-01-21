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

### Notes and Reminders

- Replace `/path/to/your/file.txt` and `/path/to/your/encrypted_file.pgp` with the actual paths to your files for file encryption and decryption commands.
- Replace `YourNameHere` with the actual name used for custom key generation in encryption and decryption commands.
- Replace `<encrypted_message>` with your actual encrypted message in relevant `curl` commands.
- Each example assumes the API is accessible at `https://www.some-website.tld:3011`. Adjust the URL to match your actual API endpoint.
- For additional examples and specific use cases, please refer to the `examples` directory in the project repository.
