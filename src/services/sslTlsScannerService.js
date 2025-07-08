const { spawn } = require('child_process');

async function runPythonVulnScanner(host, port) {
  return new Promise((resolve, reject) => {
    console.log(`Attempting to spawn python3 src/external/ssl_vuln_scanner.py ${host} ${port}`);
    const proc = spawn('python3', [
      'src/external/ssl_vuln_scanner.py',
      host,
      String(port)
    ]);
    let out = '';
    let err = '';
    proc.stdout.on('data', (data) => { out += data; });
    proc.stderr.on('data', (data) => { err += data; });
    proc.on('error', (error) => {
      console.error(`Failed to start Python subprocess: ${error.message}`);
      reject(new Error(`Failed to start Python subprocess: ${error.message}`));
    });
    proc.on('close', (code) => {
      console.log(`Python script stdout: ${out}`);
      console.log(`Python script stderr: ${err}`);
      if (code !== 0) {
        return reject(new Error(`Python vuln scanner exited with code ${code}: ${err}`));
      }
      try {
        const results = JSON.parse(out);
        console.log(`Parsed Python script results: ${JSON.stringify(results)}`);
        resolve(results);
      } catch (e) {
        console.error(`Failed to parse Python vuln scanner output: ${e.message}`);
        reject(new Error('Failed to parse Python vuln scanner output: ' + e.message));
      }
    });
  });
}

/**
 * Scan SSL/TLS configuration and vulnerabilities for a given host/port
 * @param {Object} options
 * @param {string} options.host - Hostname or IP
 * @param {number} [options.port=443] - Port (default 443)
 * @returns {Promise<Object>} Scan result
 */
async function scanSslTls({ host, port = 443 }) {
  let vulnerabilities = null;
  try {
    vulnerabilities = await runPythonVulnScanner(host, port);
  } catch (e) {
    // Attempt to parse the error message from the Python script
    let errorMessage = e.message;
    try {
      const pythonError = JSON.parse(e.message.substring(e.message.indexOf('{')));
      if (pythonError.error) {
        errorMessage = pythonError.error;
      }
    } catch (parseError) {
      // If parsing fails, use the original message
    }
    vulnerabilities = { error: errorMessage };
  }
  return {
    host,
    port,
    vulnerabilities,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { scanSslTls }; 