const https = require("https");
const { spawn } = require('child_process');
const path = require('path');

// Check if port likely supports STARTTLS
function isStarttlsPort(port) {
  const starttlsPorts = [25, 110, 143, 587];
  return starttlsPorts.includes(port);
}

// Use Python SSL scanner for certificate info (handles STARTTLS)
async function getCertInfoFromPythonScanner(hostname, port) {
  return new Promise((resolve, reject) => {
    console.log(`SSL Validation: Attempting to scan ${hostname}:${port} using Python SSL scanner`);
    
    // Use path.join to create proper path relative to project root
    const scriptPath = path.join(__dirname, '..', 'external', 'ssl_vuln_scanner.py');
    console.log(`SSL Validation: Using Python script path: ${scriptPath}`);
    
    const proc = spawn('python3', [
      scriptPath,
      hostname,
      String(port)
    ]);
    
    let out = '';
    let err = '';
    
    proc.stdout.on('data', (data) => { out += data; });
    proc.stderr.on('data', (data) => { err += data; });
    
    proc.on('error', (error) => {
      console.error(`SSL Validation: Python subprocess error for ${hostname}:${port}:`, error);
      reject(new Error(`Failed to start Python subprocess: ${error.message}`));
    });
    
    proc.on('close', (code) => {
      console.log(`SSL Validation: Python script exited with code ${code} for ${hostname}:${port}`);
      console.log(`SSL Validation: Python stdout:`, out);
      console.log(`SSL Validation: Python stderr:`, err);
      
      if (code !== 0) {
        return reject(new Error(`Python SSL scanner exited with code ${code}: ${err}`));
      }
      
      try {
        const results = JSON.parse(out);
        console.log(`SSL Validation: Parsed results for ${hostname}:${port}:`, JSON.stringify(results, null, 2));
        
        // Extract certificate info from Python scanner results
        if (results.cert_info && !results.cert_info.error) {
          const cert = results.cert_info;
          
          // Convert subject and issuer from array format to object format
          const subjectObj = {};
          const issuerObj = {};
          
          if (cert.subject && Array.isArray(cert.subject)) {
            cert.subject.forEach(([key, value]) => {
              subjectObj[key] = value;
            });
          }
          
          if (cert.issuer && Array.isArray(cert.issuer)) {
            cert.issuer.forEach(([key, value]) => {
              issuerObj[key] = value;
            });
          }
          
          return resolve({
            valid: cert.valid,
            details: {
              subject: subjectObj,
              issuer: issuerObj,
              validFrom: cert.not_before || cert.validFrom,
              validTo: cert.not_after || cert.validTo,
              serialNumber: cert.serial_number || cert.serialNumber,
              alternativeHostnames: cert.alt_names || cert.alternativeHostnames,
              // Add more fields as needed
            }
          });
        } else if (results.cert_info && results.cert_info.error) {
          console.log(`SSL Validation: Certificate error for ${hostname}:${port}:`, results.cert_info.error);
          return reject(new Error(results.cert_info.error));
        } else {
          console.log(`SSL Validation: No certificate info available for ${hostname}:${port}`);
          return reject(new Error("No certificate information available"));
        }
      } catch (parseError) {
        console.error(`SSL Validation: Failed to parse Python output for ${hostname}:${port}:`, parseError);
        reject(new Error(`Failed to parse Python SSL scanner output: ${parseError.message}`));
      }
    });
  });
}

const validateSSL = async (hostname, port = 443) => {
  console.log(`SSL Validation: Starting validation for ${hostname}:${port}`);
  
  // Use Python SSL scanner for all SSL/TLS ports - it's more robust and handles all protocols
  console.log(`SSL Validation: Using Python SSL scanner for ${hostname}:${port}`);
  try {
    const result = await getCertInfoFromPythonScanner(hostname, port);
    console.log(`SSL Validation: Python scanner succeeded for ${hostname}:${port}`);
    return result;
  } catch (error) {
    console.error(`SSL Validation: Python scanner failed for ${hostname}:${port}:`, error);
    // If Python scanner fails, return the error
    return {
      valid: false,
      errors: [error.message]
    };
  }
  
  // Keep the Node.js approach as fallback (though it's not used anymore)
  console.log(`SSL Validation: Fallback to Node.js https module (not used anymore)`);
  
  // For direct SSL/TLS ports, use the existing Node.js approach
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      agent: false,
      rejectUnauthorized: false,
      ciphers: "ALL",
    };

    console.log(`SSL Validation: Creating https request to ${hostname}:${port}`);
    
    const req = https.request(options, (res) => {
      console.log(`SSL Validation: Got response from ${hostname}:${port}`);
      const certificate = res.socket.getPeerCertificate();

      if (certificate && certificate.subject) {
        console.log(`SSL Validation: Certificate found for ${hostname}:${port}`);
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
        console.log(`SSL Validation: No certificate found for ${hostname}:${port}`);
        resolve({ valid: false });
      }
    });

    req.on("error", (e) => {
      console.error(`SSL Validation: HTTPS request error for ${hostname}:${port}:`, e);
      reject(e);
    });

    req.end();
  });
};

module.exports = { validateSSL };
