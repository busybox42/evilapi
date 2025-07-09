const dns = require("dns").promises;
const { performance } = require("perf_hooks");
const net = require("net");
const tls = require("tls");

async function testSmtpServer(serverAddress, port) {
  let report = {};
  let connectionTime = 0;
  
  try {
    const startTime = performance.now();
    
    // First try implicit TLS (like port 465)
    let connectionResult = await testSmtpConnection(serverAddress, port, true);
    
    // If implicit TLS fails, try regular connection with potential STARTTLS
    if (!connectionResult.success) {
      connectionResult = await testSmtpConnection(serverAddress, port, false);
    }
    
    const endTime = performance.now();
    connectionTime = ((endTime - startTime) / 1000).toFixed(3);
    
    report = {
      connection: connectionResult.success ? "Successful" : "Failed",
      transactionTimeMs: connectionTime,
      capabilities: connectionResult.capabilities || [],
      greeting: connectionResult.greeting || "",
      tlsSupport: "Not supported",
      smtpAuthSupport: connectionResult.authSupported,
      authMethods: connectionResult.authMethods || [],
      openRelay: false,
      reverseDnsMismatch: false,
      portSpecificInfo: {
        type: "SMTP",
        description: "Custom SMTP Port",
        tlsMode: "none"
      }
    };

    if (connectionResult.success) {
      // If we connected with implicit TLS
      if (connectionResult.implicitTls) {
        report.tlsSupport = "Supported";
        report.portSpecificInfo = {
          type: "SMTPS",
          description: "Implicit TLS/SSL",
          tlsMode: "implicit"
        };
      } 
      // If STARTTLS is available, test it and get updated capabilities
      else if (connectionResult.tlsSupported) {
        const starttlsResult = await testStartTLS(serverAddress, port);
        if (starttlsResult.success) {
          report.tlsSupport = "Supported";
          report.portSpecificInfo = {
            type: "SMTP with STARTTLS",
            description: "STARTTLS Available",
            tlsMode: "STARTTLS"
          };
          
          // Update capabilities and auth methods from post-STARTTLS connection
          if (starttlsResult.capabilities) {
            report.capabilities = starttlsResult.capabilities;
            report.smtpAuthSupport = starttlsResult.authSupported;
            report.authMethods = starttlsResult.authMethods || [];
          }
        }
      }

      // Check for Reverse DNS Mismatch
      try {
        let ipAddresses = await dns.resolve(serverAddress);
        let reverseDns = await dns.reverse(ipAddresses[0]);
        report.reverseDnsMismatch = !reverseDns.some(name => 
          name.toLowerCase() === serverAddress.toLowerCase()
        );
      } catch (dnsError) {
        report.reverseDnsMismatch = "Unable to verify";
        report.dnsError = dnsError.message;
      }
    }

  } catch (error) {
    report.error = error.message;
    report.connection = "Failed";
    report.transactionTimeMs = connectionTime;
    
    if (error.code === 'ECONNREFUSED') {
      report.errorDetails = "Connection refused - server not accepting connections on this port";
    } else if (error.code === 'ETIMEDOUT') {
      report.errorDetails = "Connection timed out - server not responding or port blocked";
    } else if (error.code === 'ECONNRESET') {
      report.errorDetails = "Connection reset by server";
    }
  }

  return report;
}

function testSmtpConnection(serverAddress, port, tryImplicitTls = false) {
  return new Promise((resolve, reject) => {
    let client;
    let response = "";
    let greeting = "";
    let capabilities = [];
    let authMethods = [];
    let tlsSupported = false;
    let authSupported = false;
    let step = 0; // 0: greeting, 1: ehlo response
    
    const timeout = setTimeout(() => {
      if (client) client.destroy();
      reject(new Error("Connection timeout"));
    }, 10000);

    const handleData = (data) => {
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
            response = lines[lines.length - 1];
            break;
          }
        }
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
              authMethods: authMethods,
              implicitTls: tryImplicitTls
            });
            return;
          }
        }
      }
      
      response = lines[lines.length - 1];
    };

    const handleError = (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: err.message,
        capabilities: [],
        tlsSupported: false,
        authSupported: false,
        authMethods: []
      });
    };

    const handleClose = () => {
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
    };

    // Try implicit TLS if requested
    if (tryImplicitTls) {
      client = tls.connect({
        host: serverAddress,
        port: port,
        rejectUnauthorized: false // Allow self-signed certificates
      });
    } else {
      client = net.createConnection({ host: serverAddress, port: port });
    }

    client.on("data", handleData);
    client.on("error", handleError);
    client.on("close", handleClose);
  });
}

async function testStartTLS(serverAddress, port) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ host: serverAddress, port: port });
    
    let step = 0; // 0: greeting, 1: ehlo, 2: starttls, 3: post-starttls-ehlo
    let response = "";
    let capabilities = [];
    let authMethods = [];
    let authSupported = false;
    
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
          // STARTTLS accepted, upgrade connection
          step = 3;
          const tlsOptions = {
            socket: client,
            rejectUnauthorized: false,
            host: serverAddress
          };
          
          const tlsClient = tls.connect(tlsOptions, () => {
            // Send EHLO again after TLS upgrade to get new capabilities
            tlsClient.write(`EHLO testclient.local\r\n`);
            
            // Handle post-STARTTLS EHLO response
            let postTlsResponse = "";
            tlsClient.on("data", (tlsData) => {
              postTlsResponse += tlsData.toString();
              const tlsLines = postTlsResponse.split('\r\n');
              
              for (let j = 0; j < tlsLines.length - 1; j++) {
                const tlsLine = tlsLines[j];
                if (tlsLine.startsWith('250-') || tlsLine.startsWith('250 ')) {
                  const capability = tlsLine.substring(4).trim();
                  capabilities.push(capability);
                  
                  if (capability.toUpperCase().startsWith('AUTH ')) {
                    authSupported = true;
                    const methods = capability.substring(5).split(' ');
                    authMethods = methods.filter(m => m.length > 0);
                  }
                  
                  if (tlsLine.startsWith('250 ')) {
                    clearTimeout(timeout);
                    tlsClient.end();
                    resolve({
                      success: true,
                      capabilities: capabilities,
                      authSupported: authSupported,
                      authMethods: authMethods
                    });
                    return;
                  }
                }
              }
              postTlsResponse = tlsLines[tlsLines.length - 1];
            });
          });
          
          tlsClient.on("error", (err) => {
            clearTimeout(timeout);
            resolve({
              success: false,
              error: "TLS negotiation failed"
            });
          });
          
          return;
        }
      }
      
      response = lines[lines.length - 1];
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: err.message
      });
    });

    client.on("close", () => {
      clearTimeout(timeout);
      if (step < 2) {
        resolve({
          success: false,
          error: "Connection closed before STARTTLS"
        });
      }
    });
  });
}

module.exports = {
  testSmtpServer,
  testStartTLS
};
