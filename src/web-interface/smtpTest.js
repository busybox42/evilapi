import { API_URL } from "./config.js"; // Importing the API URL from the config file

// Function to handle the SMTP test
async function testSMTP(serverAddress, port, testOpenRelay = false) {
  const url = `${API_URL}/test`;
  const requestBody = {
    server: serverAddress,
    port: port,
    testOpenRelay: testOpenRelay
  };

  const resultsDiv = document.getElementById("smtpTestResults");
  resultsDiv.innerHTML = '<div class="loading">Testing SMTP server...</div>';

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displaySMTPTestResults(data, serverAddress, port);
  } catch (error) {
    console.error("SMTP Test error:", error);
    resultsDiv.innerHTML = `<div class="error-message">Failed to perform SMTP test: ${error.message}</div>`;
  }
}

// Function to get port-specific information and recommendations
function getPortInfo(port) {
  const portInfo = {
    25: {
      name: "SMTP (Unencrypted)",
      description: "Traditional SMTP port, often blocked by ISPs",
      security: "Low - No encryption by default",
      recommendation: "Use for server-to-server communication only",
      icon: "📮"
    },
    465: {
      name: "SMTPS (SSL/TLS)",
      description: "SMTP over SSL/TLS (deprecated but still used)",
      security: "High - Encrypted connection",
      recommendation: "Secure but deprecated, prefer port 587",
      icon: "🔒"
    },
    587: {
      name: "SMTP Submission (STARTTLS)",
      description: "Modern SMTP submission port with STARTTLS",
      security: "High - STARTTLS encryption",
      recommendation: "Recommended for email clients",
      icon: "✅"
    },
    2525: {
      name: "Alternative SMTP",
      description: "Alternative port when others are blocked",
      security: "Varies - Depends on TLS configuration",
      recommendation: "Used when standard ports are blocked",
      icon: "🔀"
    }
  };

  return portInfo[port] || {
    name: "Custom SMTP Port",
    description: "Non-standard SMTP port",
    security: "Unknown - Check TLS configuration",
    recommendation: "Verify security configuration",
    icon: "❓"
  };
}

// Function to analyze security status
function getSecurityAnalysis(data) {
  let score = 0;
  let issues = [];
  let recommendations = [];

  // Connection analysis (25 points)
  if (data.connection === "Successful") {
    score += 25;
  } else {
    issues.push("Connection failed");
    recommendations.push("Check server address and port");
  }

  // TLS analysis (40 points)
  if (data.tlsSupport === "Supported") {
    score += 40;
  } else {
    issues.push("TLS not supported");
    recommendations.push("Enable TLS/SSL for secure communication");
  }

  // Auth support analysis (20 points)
  if (data.smtpAuthSupport === true) {
    score += 20;
  } else {
    issues.push("SMTP authentication not available");
    recommendations.push("Enable SMTP authentication for security");
  }

  // Reverse DNS analysis (15 points)
  if (data.reverseDnsMismatch === false) {
    score += 15;
  } else if (data.reverseDnsMismatch === 'Unable to verify') {
    score += 5; // Partial credit
    recommendations.push("Verify reverse DNS (PTR record) configuration for better deliverability");
  } else {
    issues.push("Reverse DNS mismatch detected");
    recommendations.push("Configure proper reverse DNS (PTR record)");
  }

  // Note about non-invasive testing
  if (score > 0) {
    recommendations.push("Note: Open relay testing was skipped to avoid invasive testing");
  }

  let status, color;
  if (score >= 80) {
    status = "Excellent";
    color = "success";
  } else if (score >= 60) {
    status = "Good";
    color = "success";
  } else if (score >= 40) {
    status = "Fair";
    color = "warning";
  } else {
    status = "Poor";
    color = "error";
  }

  return { score, status, color, issues, recommendations };
}

// Function to format performance metrics
function getPerformanceAnalysis(transactionTimeMs) {
  const time = parseFloat(transactionTimeMs);
  let performance, color, description;

  if (time < 1000) {
    performance = "Excellent";
    color = "success";
    description = "Very fast response time";
  } else if (time < 3000) {
    performance = "Good";
    color = "success";
    description = "Acceptable response time";
  } else if (time < 5000) {
    performance = "Fair";
    color = "warning";
    description = "Slower than optimal";
  } else {
    performance = "Poor";
    color = "error";
    description = "High latency detected";
  }

  return { performance, color, description, time };
}

// Function to display SMTP test results
function displaySMTPTestResults(data, serverAddress, port) {
  const resultsDiv = document.getElementById("smtpTestResults");
  
  if (data.error) {
    resultsDiv.innerHTML = `
      <div class="error-message">
        SMTP Test Failed: ${data.error}
        ${data.errorDetails ? `<br><small>${data.errorDetails}</small>` : ''}
      </div>`;
    return;
  }

  const portInfo = getPortInfo(parseInt(port));
  const security = getSecurityAnalysis(data);
  const performance = getPerformanceAnalysis(data.transactionTimeMs);

  // Format capabilities list
  const capabilitiesDisplay = data.capabilities && data.capabilities.length > 0 
    ? data.capabilities.map(cap => `<span class="capability-item">${cap}</span>`).join('')
    : '<span class="capability-item">None detected</span>';

  // Format auth methods
  const authMethodsDisplay = data.authMethods && data.authMethods.length > 0
    ? data.authMethods.map(method => `<span class="auth-method">${method}</span>`).join('')
    : '<span class="auth-method none">No auth methods detected</span>';

  // Add port-specific information display
  const portSpecificInfo = data.portSpecificInfo || {};
  const tlsStatusDisplay = `
    <div class="smtp-value-section">
      <label class="smtp-label">🔒 TLS Status:</label>
      <div class="smtp-value-container">
        <span class="smtp-value">${portSpecificInfo.tlsMode === 'implicit' ? 'Implicit SSL/TLS' : 
          portSpecificInfo.tlsMode === 'STARTTLS' ? 'STARTTLS Available and Working' : 
          'No Encryption'}</span>
        ${portSpecificInfo.tlsMode === 'STARTTLS' ? 
          `<br><small>✅ Connection upgraded to TLS</small>` : 
          portSpecificInfo.tlsMode === 'implicit' ? 
          `<br><small>✅ Secure connection established</small>` : 
          `<br><small>⚠️ Unencrypted connection</small>`}
      </div>
    </div>
  `;

  const portSpecificDisplay = `
    <div class="smtp-value-section">
      <label class="smtp-label">🔍 Connection Type:</label>
      <div class="smtp-value-container">
        <span class="smtp-value">${portSpecificInfo.type}</span>
        <br><small>${portSpecificInfo.description}</small>
      </div>
    </div>
    ${tlsStatusDisplay}
  `;

  // Format open relay status with the fixed logic
  let openRelayStatus = '';
  if (data.openRelayTested) {
    const isOpenRelay = data.openRelay || data.openRelayDetails.includes("WARNING: Server accepted relay");
    openRelayStatus = `
      <div class="smtp-value-section">
        <label class="smtp-label">🚫 Open Relay:</label>
        <div class="smtp-value-container">
          <span class="status-badge ${isOpenRelay ? 'badge-error' : 'badge-success'}">
            ${isOpenRelay ? '⚠️ Open Relay Detected!' : '✅ Not an Open Relay'}
          </span>
          ${data.openRelayDetails ? `
            <div class="open-relay-details">
              <pre>${data.openRelayDetails}</pre>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  resultsDiv.innerHTML = `
    <div class="smtp-result-container enhanced">
      <!-- Server Information -->
      <div class="smtp-section primary-section">
        <h3 class="section-header">🌐 Server Information</h3>
        <div class="smtp-grid">
          <div class="smtp-value-section">
            <label class="smtp-label">📡 Server Address:</label>
            <div class="smtp-value-container">
              <span class="smtp-value large">${serverAddress}</span>
            </div>
          </div>
          <div class="smtp-value-section">
            <label class="smtp-label">${portInfo.icon} Port:</label>
            <div class="smtp-value-container">
              <span class="smtp-value large">${port}</span>
            </div>
          </div>
          ${portSpecificDisplay}
          ${data.greeting ? `
          <div class="smtp-value-section">
            <label class="smtp-label">👋 Server Greeting:</label>
            <div class="smtp-value-container">
              <span class="smtp-value monospace">${data.greeting}</span>
            </div>
          </div>
          ` : ''}
        </div>
      </div>

      <!-- Connection Status -->
      <div class="smtp-section">
        <h3 class="section-header">🔌 Connection Status</h3>
        <div class="smtp-grid compact">
          <div class="smtp-value-section">
            <label class="smtp-label">Connection:</label>
            <div class="smtp-value-container">
              <span class="status-badge ${data.connection === 'Successful' ? 'badge-success' : 'badge-error'}">
                ${data.connection === 'Successful' ? '✅' : '❌'} ${data.connection}
              </span>
            </div>
          </div>
          <div class="smtp-value-section">
            <label class="smtp-label">Response Time:</label>
            <div class="smtp-value-container">
              <span class="status-badge badge-${performance.color}">
                ⚡ ${data.transactionTimeMs} ms (${performance.performance})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Server Capabilities -->
      ${data.capabilities && data.capabilities.length > 0 ? `
      <div class="smtp-section">
        <h3 class="section-header">⚙️ Server Capabilities</h3>
        <div class="capabilities-container">
          ${capabilitiesDisplay}
        </div>
        <div class="capabilities-note">
          <em>${portSpecificInfo.tlsMode === 'STARTTLS' ? 
            'These are the capabilities after STARTTLS upgrade' : 
            'These are the features advertised by the server'}</em>
        </div>
      </div>
      ` : ''}

      <!-- Security Analysis -->
      <div class="smtp-section">
        <h3 class="section-header">🔒 Security Analysis</h3>
        <div class="smtp-values-grid">
          <div class="smtp-value-section">
            <label class="smtp-label">🛡️ Authentication:</label>
            <div class="smtp-value-container">
              <span class="status-badge ${data.smtpAuthSupport ? 'badge-success' : 'badge-warning'}">
                ${data.smtpAuthSupport ? '✅ Supported' : '⚠️ Not Available'}
              </span>
            </div>
          </div>
          ${openRelayStatus}
        </div>
        <div class="security-overview">
          <div class="security-score">
            <span class="score-label">Security Score:</span>
            <span class="score-value badge-${security.color}">${security.score}/100 (${security.status})</span>
          </div>
        </div>
        <div class="smtp-grid compact">
          <div class="smtp-value-section">
            <label class="smtp-label">🔐 TLS/SSL Support:</label>
            <div class="smtp-value-container">
              <span class="status-badge ${data.tlsSupport === 'Supported' ? 'badge-success' : 'badge-error'}">
                ${data.tlsSupport === 'Supported' ? '🔒' : '🔓'} ${data.tlsSupport}
              </span>
            </div>
          </div>
          <div class="smtp-value-section">
            <label class="smtp-label">🛡️ Authentication:</label>
            <div class="smtp-value-container">
              <span class="status-badge ${data.smtpAuthSupport ? 'badge-success' : 'badge-warning'}">
                ${data.smtpAuthSupport ? '✅ Supported' : '⚠️ Not Available'}
              </span>
            </div>
          </div>
          <div class="smtp-value-section">
            <label class="smtp-label">🔄 Reverse DNS:</label>
            <div class="smtp-value-container">
              <span class="status-badge ${data.reverseDnsMismatch === false ? 'badge-success' : data.reverseDnsMismatch === 'Unable to verify' ? 'badge-warning' : 'badge-warning'}">
                ${data.reverseDnsMismatch === false ? '✅ Configured' : data.reverseDnsMismatch === 'Unable to verify' ? '⚠️ Unable to verify' : '⚠️ Mismatch'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Authentication Methods -->
      ${data.authMethods && data.authMethods.length > 0 ? `
      <div class="smtp-section">
        <h3 class="section-header">🔑 Authentication Methods</h3>
        <div class="auth-methods-container">
          ${authMethodsDisplay}
        </div>
        <div class="auth-methods-note">
          <em>${portSpecificInfo.tlsMode === 'STARTTLS' ? 
            'Authentication methods available after STARTTLS' : 
            'Authentication methods supported by this server'}</em>
        </div>
      </div>
      ` : ''}

      <!-- Recommendations -->
      <div class="smtp-section">
        <h3 class="section-header">💡 Security Recommendations</h3>
        ${security.issues.length > 0 ? `
          <div class="recommendation-group">
            <h4 class="recommendation-title">⚠️ Issues Found:</h4>
            <ul class="recommendation-list issues">
              ${security.issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${security.recommendations.length > 0 ? `
          <div class="recommendation-group">
            <h4 class="recommendation-title">🔧 Recommended Actions:</h4>
            <ul class="recommendation-list recommendations">
              ${security.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        <div class="recommendation-group">
          <h4 class="recommendation-title">📋 Port Information:</h4>
          <p class="port-recommendation">${portInfo.description}</p>
          ${portInfo.recommendation ? `<p class="port-recommendation">${portInfo.recommendation}</p>` : ''}
        </div>
      </div>

      <!-- Technical Details -->
      <div class="smtp-section">
        <h3 class="section-header">🔧 Technical Details</h3>
        <div class="smtp-grid compact">
          <div class="smtp-value-section">
            <label class="smtp-label">Security Level:</label>
            <div class="smtp-value-container">
              <span class="smtp-value">${portSpecificInfo.tlsMode === 'none' ? 'Low - No Encryption' :
                portSpecificInfo.tlsMode === 'STARTTLS' ? 'High - STARTTLS Encryption' :
                portSpecificInfo.tlsMode === 'implicit' ? 'High - Implicit SSL/TLS' :
                'Unknown'}</span>
            </div>
          </div>
          <div class="smtp-value-section">
            <label class="smtp-label">Performance:</label>
            <div class="smtp-value-container">
              <span class="smtp-value">${performance.description}</span>
            </div>
          </div>
          <div class="smtp-value-section">
            <label class="smtp-label">Connection Time:</label>
            <div class="smtp-value-container">
              <span class="smtp-value monospace">${data.transactionTimeMs} ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Initialization function for SMTP test functionality
export function initSmtpTest() {
  const performTestBtn = document.getElementById("performSmtpTestBtn");
  if (!performTestBtn) return;

  performTestBtn.addEventListener("click", async function() {
    const serverAddress = document.getElementById("smtpServerInput").value.trim();
    const port = document.getElementById("smtpPortInput").value.trim() || "25";
    const testOpenRelay = document.getElementById("testOpenRelay")?.checked || false;

    if (serverAddress) {
      await testSMTP(serverAddress, port, testOpenRelay);
    } else {
      document.getElementById("smtpTestResults").innerHTML = 
        '<div class="error-message">Please enter the server address.</div>';
    }
  });

  // Add Enter key support
  document.getElementById("smtpServerInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("performSmtpTestBtn").click();
  });

  document.getElementById("smtpPortInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("performSmtpTestBtn").click();
  });

  // Add the open relay checkbox if it doesn't exist
  const formGroup = document.getElementById("smtpServerInput").parentElement;
  if (!document.getElementById("testOpenRelay")) {
    const checkboxDiv = document.createElement("div");
    checkboxDiv.className = "form-group checkbox-group";
    checkboxDiv.innerHTML = `
      <input type="checkbox" id="testOpenRelay" name="testOpenRelay">
      <label for="testOpenRelay">Test for open relay (Warning: This will attempt to send a test email)</label>
    `;
    formGroup.insertAdjacentElement("afterend", checkboxDiv);
  }
}
