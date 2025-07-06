const { spawn } = require('child_process');

async function runPythonVulnScanner(host, port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [
      'src/external/ssl_vuln_scanner.py',
      host,
      String(port)
    ]);
    let out = '';
    let err = '';
    proc.stdout.on('data', (data) => { out += data; });
    proc.stderr.on('data', (data) => { err += data; });
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python vuln scanner exited with code ${code}: ${err}`));
      }
      try {
        const results = JSON.parse(out);
        resolve(results);
      } catch (e) {
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
    vulnerabilities = { error: e.message };
  }
  return {
    host,
    port,
    vulnerabilities,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { scanSslTls }; 