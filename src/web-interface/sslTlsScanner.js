export function renderSslTlsScanner(container) {
  container.innerHTML = `
    <h2>SSL/TLS Vulnerability Scanner</h2>
    <form id="ssl-scan-form" style="margin-bottom: 1.5em;">
      <div class="ssl-scan-input-group">
        <input type="text" id="ssl-host" placeholder="Enter hostname or IP" style="width: 200px;" />
        <input type="text" id="ssl-port" placeholder="443" style="width: 75px;" />
        <button type="submit" class="nav-btn">Perform Scan</button>
      </div>
    </form>
    <div id="ssl-scan-result"></div>
  `;

  const form = container.querySelector('#ssl-scan-form');
  const resultDiv = container.querySelector('#ssl-scan-result');
  const portInput = container.querySelector('#ssl-port');

  // Create warning message element for port 25
  const createPort25Warning = () => {
    const warning = document.createElement("div");
    warning.id = "sslPort25Warning";
    warning.className = "port25-warning";
    warning.innerHTML = `
      <div class="warning-content">
        ⚠️ <strong>Note:</strong> Port 25 is blocked by our hosting provider for security reasons. 
        SSL/TLS scanning on port 25 may fail even if the service is running. Consider testing port 587 (STARTTLS) or 465 (SSL/TLS) instead.
      </div>
    `;
    return warning;
  };

  // Function to show/hide port 25 warning
  const handlePort25Warning = () => {
    const port = portInput.value;
    const existingWarning = container.querySelector("#sslPort25Warning");
    
    if (port === "25") {
      if (!existingWarning) {
        const warning = createPort25Warning();
        form.appendChild(warning);
      }
    } else {
      if (existingWarning) {
        existingWarning.remove();
      }
    }
  };

  // Add event listener for port input changes
  portInput.addEventListener("input", handlePort25Warning);

  form.onsubmit = async (e) => {
    e.preventDefault();
    resultDiv.innerHTML = '<em>Scanning...</em>';
    const host = form.querySelector('#ssl-host').value.trim();
    const port = parseInt(form.querySelector('#ssl-port').value, 10) || 443;
    try {
      const res = await fetch('/api/ssl-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? `${data.error}: ${data.message || ''}` : 'Scan failed: ' + res.status);
      resultDiv.innerHTML = renderSslScanResult(data);
    } catch (err) {
      resultDiv.innerHTML = `<span style="color:red; font-weight:bold;">${err.message}</span>`;
    }
  };
}

function renderSslScanResult(data) {
  if (!data) return '<em>No result</em>';
  let html = `<h3>Result for ${data.host}:${data.port}</h3>`;
  const vdata = data.vulnerabilities || {};
  // Grade badge
  if (vdata.grade) {
    let gradeColor = '#4caf50';
    if (vdata.grade === 'B') gradeColor = '#2196f3';
    else if (vdata.grade === 'C') gradeColor = 'orange';
    else if (vdata.grade === 'F') gradeColor = '#ff4444';
    html += `<div style="margin-bottom:0.7em;"><span style="background:${gradeColor};color:#fff;padding:4px 18px;border-radius:8px;font-size:1.5em;font-weight:bold;letter-spacing:2px;">${vdata.grade}</span> <span style="font-size:1.1em;color:#555;">SSL Grade</span></div>`;
    if (Array.isArray(vdata.grade_breakdown) && vdata.grade_breakdown.length) {
      html += `<ul style="margin:0 0 1em 0.5em;padding:0 0 0 1.2em;color:#333;">`;
      for (const reason of vdata.grade_breakdown) {
        let reasonStyle = '';
        if (reason.includes('TLS 1.0/1.1')) {
          reasonStyle = 'color: #DAA520;'; // Darker yellow
        } else if (reason.includes('HTTP redirects to HTTPS')) {
          reasonStyle = 'color: #DAA520;'; // Darker yellow
        } else if (reason.includes('Weak: BREACH')) {
          reasonStyle = 'color: orange;'; // Orange for weak vulnerabilities
        }
        html += `<li style="${reasonStyle}">${reason}</li>`;
      }
      html += `</ul>`;
    }
  }
  // Vulnerabilities table
  if (vdata.results) {
    const vulns = Object.values(vdata.results);
    const anyVuln = vulns.some(v => v.status === 'vulnerable');
    const anyPotential = vulns.some(v => v.status === 'potentially vulnerable');
    if (anyVuln) {
      html += `<span style="background:#ff4444;color:#fff;padding:2px 10px;border-radius:6px;font-weight:bold;">Vulnerable</span> `;
    } else if (anyPotential) {
      html += `<span style="background:orange;color:#fff;padding:2px 10px;border-radius:6px;font-weight:bold;">Potentially Vulnerable</span> `;
    } else {
      html += `<span style="background:#4caf50;color:#fff;padding:2px 10px;border-radius:6px;font-weight:bold;">No Critical Vulns</span> `;
    }
    html += `<table style="width:100%;margin-top:1em;border-collapse:collapse;">
      <thead><tr><th style="text-align:left;padding:4px 8px;">Vulnerability</th><th style="text-align:left;padding:4px 8px;">Status</th><th style="text-align:left;padding:4px 8px;">Info</th></tr></thead><tbody>`;
    for (const [k, v] of Object.entries(vdata.results)) {
      let color = '#888';
      if (v.status === 'vulnerable') color = '#ff4444';
      else if (v.status === 'potentially vulnerable') color = 'orange';
      else if (v.status === 'not vulnerable') color = '#4caf50';
      html += `<tr>
        <td style="padding:4px 8px;font-weight:bold;">${k}</td>
        <td style="padding:4px 8px;"><span style="color:${color};font-weight:bold;">${v.status}</span></td>
        <td style="padding:4px 8px;"><span style="font-size:0.95em;color:#666;">${v.info}</span></td>
      </tr>`;
    }
    html += `</tbody></table>`;
  } else if (vdata.error) {
    html += `<div><b>Vulnerability Scan Error:</b> <span style="color:red">${vdata.error}</span></div>`;
  } else {
    html += `<div><b>Vulnerabilities:</b> <em>No data</em></div>`;
  }
  // Protocol support
  if (vdata.protocol_support) {
    html += `<div style="margin-top:1.2em;"><b>Protocol Support:</b> <span style="color:#2196f3;">${Array.isArray(vdata.protocol_support) ? vdata.protocol_support.join(', ') : vdata.protocol_support}</span></div>`;
  }
  // Cipher strength
  if (typeof vdata.cipher_strength === 'number') {
    html += `<div><b>Max Cipher Strength:</b> <span style="color:#2196f3;">${vdata.cipher_strength} bits</span></div>`;
  }
  // Certificate info
  if (vdata.cert_info) {
    const ci = vdata.cert_info;
    html += `<div style="margin-top:1.2em;"><b>Certificate:</b> <span style="color:${ci.valid ? '#4caf50' : '#ff4444'};font-weight:bold;">${ci.valid ? 'Valid' : 'Invalid/Expired'}</span></div>`;
    if (ci.subject) html += `<div><b>Subject:</b> <span style="color:#333;">${JSON.stringify(ci.subject)}</span></div>`;
    if (ci.issuer) html += `<div><b>Issuer:</b> <span style="color:#333;">${JSON.stringify(ci.issuer)}</span></div>`;
    if (ci.not_before) html += `<div><b>Valid From:</b> <span style="color:#333;">${ci.not_before}</span></div>`;
    if (ci.not_after) html += `<div><b>Valid Until:</b> <span style="color:#333;">${ci.not_after}</span></div>`;
    if (ci.error) {
      if (ci.error.includes("STARTTLS connection failed")) {
        html += `<div style="color:red;"><b>Connection Error:</b> ${ci.error}</div>`;
      } else {
        html += `<div style="color:red;"><b>Cert Error:</b> ${ci.error}</div>`;
      }
    }
  }
  html += `<div><small>Scanned at: ${data.timestamp}</small></div>`;
  return html;
} 