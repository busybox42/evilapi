const dns = require("dns").promises;
const { performance } = require("perf_hooks");
const net = require("net");
const tls = require("tls");

async function testSmtpServer(serverAddress, port) {
  let report = {};
  let connectionTime = 0;
  
  try {
    const startTime = performance.now();
    
    // Test basic connection and get capabilities
    const connectionResult = await testSmtpConnection(serverAddress, port);
    
    const endTime = performance.now();
    connectionTime = ((endTime - startTime) / 1000).toFixed(3);
    
    report = {
      connection: connectionResult.success ? "Successful" : "Failed",
      transactionTimeMs: connectionTime,
      capabilities: connectionResult.capabilities || [],
      greeting: connectionResult.greeting || "",
      tlsSupport: connectionResult.tlsSupported ? "Supported" : "Not supported",
      smtpAuthSupport: connectionResult.authSupported,
      authMethods: connectionResult.authMethods || [],
      openRelay: false, // We don't test this by sending emails anymore
      reverseDnsMismatch: false
    };

    // Check for Reverse DNS Mismatch (if connection was successful)
    if (connectionResult.success) {
      try {
        let ipAddresses = await dns.resolve(serverAddress);
        let reverseDns = await dns.reverse(ipAddresses[0]);
        report.reverseDnsMismatch = !reverseDns.some(name => 
          name.toLowerCase() === serverAddress.toLowerCase()
        );
      } catch (dnsError) {
        report.reverseDnsMismatch = "Unable to verify";
      }
    }

  } catch (error) {
    report.error = error.message;
    report.connection = "Failed";
    report.transactionTimeMs = connectionTime;
  }

  return report;
}

function testSmtpConnection(serverAddress, port) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host: serverAddress, port: port }, () => {
      // Connection established
    });

    let response = "";
    let greeting = "";
    let capabilities = [];
    let authMethods = [];
    let tlsSupported = false;
    let authSupported = false;
    let step = 0; // 0: greeting, 1: ehlo response
    
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("Connection timeout"));
    }, 10000);

    client.on("data", (data) => {
      const chunk = data.toString();
      response += chunk;
      
      // Process complete lines
      const lines = response.split('\r\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        
        if (step === 0) {
          // Waiting for greeting
          if (line.startsWith('220 ')) {
            greeting = line;
            step = 1;
            // Send EHLO command
            client.write(`EHLO testclient.local\r\n`);
            response = lines[lines.length - 1]; // Keep incomplete line
            break;
          }
        } else if (step === 1) {
          // Processing EHLO response
          if (line.startsWith('250-') || line.startsWith('250 ')) {
            const capability = line.substring(4).trim();
            capabilities.push(capability);
            
            // Check for specific capabilities
            if (capability.toUpperCase().startsWith('STARTTLS')) {
              tlsSupported = true;
            }
            
            if (capability.toUpperCase().startsWith('AUTH ')) {
              authSupported = true;
              const methods = capability.substring(5).split(' ');
              authMethods = methods.filter(m => m.length > 0);
            }
            
            // If this is the final line (250 instead of 250-)
            if (line.startsWith('250 ')) {
              clearTimeout(timeout);
              client.end();
              resolve({
                success: true,
                greeting: greeting,
                capabilities: capabilities,
                tlsSupported: tlsSupported,
                authSupported: authSupported,
                authMethods: authMethods
              });
              return;
            }
          }
        }
      }
      
      // Keep the last incomplete line
      response = lines[lines.length - 1];
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: err.message,
        capabilities: [],
        tlsSupported: false,
        authSupported: false,
        authMethods: []
      });
    });

    client.on("close", () => {
      clearTimeout(timeout);
      if (step === 0) {
        resolve({
          success: false,
          error: "Connection closed before greeting",
          capabilities: [],
          tlsSupported: false,
          authSupported: false,
          authMethods: []
        });
      }
    });
  });
}

// Test STARTTLS capability (if advertised)
async function testStartTLS(serverAddress, port) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host: serverAddress, port: port });
    
    let step = 0; // 0: greeting, 1: ehlo, 2: starttls
    let response = "";
    
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("STARTTLS test timeout"));
    }, 10000);

    client.on("data", (data) => {
      const chunk = data.toString();
      response += chunk;
      
      const lines = response.split('\r\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];
        
        if (step === 0 && line.startsWith('220 ')) {
          step = 1;
          client.write(`EHLO testclient.local\r\n`);
        } else if (step === 1 && line.startsWith('250 ')) {
          step = 2;
          client.write(`STARTTLS\r\n`);
        } else if (step === 2 && line.startsWith('220 ')) {
          // STARTTLS ready
          clearTimeout(timeout);
          client.end();
          resolve(true);
          return;
        }
      }
      
      response = lines[lines.length - 1];
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

// Legacy functions kept for compatibility but simplified
async function testTransactionTime(serverAddress, port) {
  try {
    const startTime = performance.now();
    const result = await testSmtpConnection(serverAddress, port);
    const endTime = performance.now();
    return ((endTime - startTime) / 1000).toFixed(2);
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

async function testTlsSupport(serverAddress, port) {
  try {
    const result = await testSmtpConnection(serverAddress, port);
    return result.tlsSupported ? "Supported" : "Not supported";
  } catch (error) {
    return "Error checking TLS support";
  }
}

// Simplified - we don't test open relay by sending emails anymore
async function checkOpenRelay(serverAddress, port, testEmail) {
  // Return false - we don't test this invasively anymore
  return false;
}

async function testSmtpAuthSupport(serverAddress, port) {
  try {
    const result = await testSmtpConnection(serverAddress, port);
    return result.authSupported;
  } catch (error) {
    return false;
  }
}

module.exports = {
  testSmtpServer,
  testTransactionTime,
  testTlsSupport,
  checkOpenRelay,
  testSmtpAuthSupport,
};
