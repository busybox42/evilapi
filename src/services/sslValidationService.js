const https = require("https");
const { spawn } = require('child_process');

// Check if port likely supports STARTTLS
function isStarttlsPort(port) {
  const starttlsPorts = [25, 110, 143, 587];
  return starttlsPorts.includes(port);
}

// Use Python SSL scanner for certificate info (handles STARTTLS)
async function getCertInfoFromPythonScanner(hostname, port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      'src/external/ssl_vuln_scanner.py',
      hostname,
      String(port)
    ]);
    
    let out = '';
    let err = '';
    
    proc.stdout.on('data', (data) => { out += data; });
    proc.stderr.on('data', (data) => { err += data; });
    
    proc.on('error', (error) => {
      reject(new Error(`Failed to start Python subprocess: ${error.message}`));
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python SSL scanner exited with code ${code}: ${err}`));
      }
      
      try {
        const results = JSON.parse(out);
        
        // Extract certificate info from Python scanner results
        if (results.cert_info && !results.cert_info.error) {
          const cert = results.cert_info;
          return resolve({
            valid: cert.valid,
            details: {
              subject: cert.subject || {},
              issuer: cert.issuer || {},
              validFrom: cert.not_before || cert.validFrom,
              validTo: cert.not_after || cert.validTo,
              serialNumber: cert.serial_number || cert.serialNumber,
              alternativeHostnames: cert.alt_names || cert.alternativeHostnames,
              // Add more fields as needed
            }
          });
        } else if (results.cert_info && results.cert_info.error) {
          return reject(new Error(results.cert_info.error));
        } else {
          return reject(new Error("No certificate information available"));
        }
      } catch (parseError) {
        reject(new Error(`Failed to parse Python SSL scanner output: ${parseError.message}`));
      }
    });
  });
}

const validateSSL = async (hostname, port = 443) => {
  // For STARTTLS ports, use Python SSL scanner which handles the protocol properly
  if (isStarttlsPort(port)) {
    try {
      return await getCertInfoFromPythonScanner(hostname, port);
    } catch (error) {
      // If Python scanner fails, return the error
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }
  
  // For direct SSL/TLS ports, use the existing Node.js approach
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      agent: false,
      rejectUnauthorized: false,
      ciphers: "ALL",
    };

    const req = https.request(options, (res) => {
      const certificate = res.socket.getPeerCertificate();

      if (certificate && certificate.subject) {
        const validFrom = new Date(certificate.valid_from).toISOString();
        const validTo = new Date(certificate.valid_to).toISOString();

        // Extracting alternative hostnames
        const altNames = certificate.subjectaltname
          ?.split(", ")
          .filter((name) => name.startsWith("DNS:"))
          .map((name) => name.replace("DNS:", ""));

        const response = {
          valid: res.socket.authorized,
          details: {
            subject: certificate.subject,
            issuer: certificate.issuer,
            validFrom,
            validTo,
            serialNumber: certificate.serialNumber,
            algorithm: certificate.sigalg,
          },
        };

        // Only add alternative hostnames if they exist
        if (altNames && altNames.length > 0) {
          response.details.alternativeHostnames = altNames;
        }

        resolve(response);
      } else {
        resolve({ valid: false });
      }
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
};

module.exports = { validateSSL };
