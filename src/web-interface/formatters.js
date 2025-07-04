// Utility functions for formatting API responses into user-friendly HTML

// Helper function to create section headers
const createSection = (title, content) => {
  return `
    <div class="result-section">
      <h3 class="section-title">${title}</h3>
      <div class="section-content">${content}</div>
    </div>
  `;
};

// Helper function to create status badges
const createStatusBadge = (status, type = 'info') => {
  const badgeClass = type === 'success' ? 'badge-success' : 
                    type === 'error' ? 'badge-error' : 
                    type === 'warning' ? 'badge-warning' : 'badge-info';
  return `<span class="status-badge ${badgeClass}">${status}</span>`;
};

// Helper function to create lists
const createList = (items, ordered = false) => {
  const tag = ordered ? 'ol' : 'ul';
  const listItems = items.map(item => `<li>${item}</li>`).join('');
  return `<${tag} class="formatted-list">${listItems}</${tag}>`;
};

// Helper function to create key-value pairs
const createKeyValue = (key, value, highlight = false) => {
  const className = highlight ? 'key-value highlight' : 'key-value';
  return `<div class="${className}"><span class="key">${key}:</span> <span class="value">${value}</span></div>`;
};

// Format Email Info results
export const formatEmailInfo = (data) => {
  let sections = [];

  // MX Records
  if (data.mxRecords && data.mxRecords.length > 0) {
    const mxItems = data.mxRecords.map(mx => 
      `Priority ${mx.priority}: <strong>${mx.exchange || 'No exchange specified'}</strong>`
    );
    sections.push(createSection('📧 MX Records (Mail Servers)', createList(mxItems)));
  }

  // SPF Record
  if (data.spfRecord && data.spfRecord.length > 0) {
    const spfContent = data.spfRecord.map(record => 
      `<code class="dns-record">${record}</code>`
    ).join('<br>');
    sections.push(createSection('🛡️ SPF Record (Sender Policy Framework)', spfContent));
  }

  // DMARC Record
  if (data.dmarcRecord && data.dmarcRecord.length > 0) {
    const dmarcContent = data.dmarcRecord.map(record => 
      `<code class="dns-record">${record}</code>`
    ).join('<br>');
    sections.push(createSection('📋 DMARC Record (Email Authentication)', dmarcContent));
  }

  // BIMI Record
  if (data.bimiRecord && data.bimiRecord.length > 0) {
    const bimiContent = data.bimiRecord.map(record => 
      `<code class="dns-record">${record}</code>`
    ).join('<br>');
    sections.push(createSection('🖼️ BIMI Record (Brand Indicators)', bimiContent));
  }

  // A Records (IP Addresses)
  if (data.aRecord && data.aRecord.length > 0) {
    const ipItems = data.aRecord.map(ip => `<code class="ip-address">${ip}</code>`);
    sections.push(createSection('🌐 A Records (IP Addresses)', createList(ipItems)));
  }

  // Client Settings
  if (data.clientSettings) {
    const settingsContent = Object.entries(data.clientSettings)
      .map(([key, value]) => createKeyValue(key, typeof value === 'object' ? JSON.stringify(value, null, 2) : value))
      .join('');
    sections.push(createSection('⚙️ Client Settings', settingsContent));
  }

  return sections.join('');
};

// Format Blacklist Check results
export const formatBlacklistCheck = (data) => {
  let content = '';

  // Header info
  content += createSection('🔍 Blacklist Check Summary', `
    ${createKeyValue('Domain/IP Checked', data.identifier, true)}
    ${createKeyValue('Resolved IP Address', data.ip, true)}
  `);

  // Blacklist results
  if (data.blacklistResults && Array.isArray(data.blacklistResults)) {
    const resultItems = data.blacklistResults.map(result => {
      const status = result.listed ? 
        createStatusBadge('LISTED', 'error') : 
        createStatusBadge('CLEAN', 'success');
      
      return `
        <div class="blacklist-item">
          <div class="blacklist-header">
            <strong>${result.blacklist}</strong> ${status}
          </div>
          ${result.listed ? `<div class="blacklist-details">⚠️ This IP is listed on this blacklist</div>` : ''}
          ${result.error ? `<div class="blacklist-error">❌ Error: ${result.error}</div>` : ''}
        </div>
      `;
    }).join('');

    const cleanCount = data.blacklistResults.filter(r => !r.listed && !r.error).length;
    const listedCount = data.blacklistResults.filter(r => r.listed).length;
    const errorCount = data.blacklistResults.filter(r => r.error).length;

    const summary = `
      <div class="blacklist-summary">
        ${createStatusBadge(`${cleanCount} Clean`, 'success')}
        ${listedCount > 0 ? createStatusBadge(`${listedCount} Listed`, 'error') : ''}
        ${errorCount > 0 ? createStatusBadge(`${errorCount} Errors`, 'warning') : ''}
      </div>
    `;

    content += createSection('📊 Blacklist Results', summary + resultItems);
  }

  return content;
};

// Format Email Header Analysis results
export const formatHeaderAnalysis = (data) => {
  let sections = [];

  // Summary
  if (data.summary) {
    const summaryContent = Object.entries(data.summary)
      .map(([key, value]) => createKeyValue(
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value
      ))
      .join('');
    sections.push(createSection('📊 Analysis Summary', summaryContent));
  }

  // Authentication Results
  if (data.authentication) {
    const authContent = Object.entries(data.authentication)
      .map(([key, value]) => {
        const status = value === 'pass' ? 'success' : value === 'fail' ? 'error' : 'warning';
        return createKeyValue(key.toUpperCase(), createStatusBadge(value, status));
      })
      .join('');
    sections.push(createSection('🔐 Authentication Results', authContent));
  }

  // Received Path
  if (data.receivedPath && Array.isArray(data.receivedPath)) {
    const pathItems = data.receivedPath.map((hop, index) => 
      `<div class="hop-item"><strong>Hop ${index + 1}:</strong> ${hop}</div>`
    );
    sections.push(createSection('📍 Email Path (Received Headers)', pathItems.join('')));
  }

  // Headers
  if (data.headers) {
    const headerContent = Object.entries(data.headers)
      .map(([key, value]) => createKeyValue(key, Array.isArray(value) ? value.join(', ') : value))
      .join('');
    sections.push(createSection('📧 Parsed Headers', headerContent));
  }

  // Security Analysis
  if (data.security) {
    const securityItems = Object.entries(data.security)
      .map(([key, value]) => {
        if (typeof value === 'boolean') {
          const status = value ? 'success' : 'warning';
          const badge = value ? 'Yes' : 'No';
          return createKeyValue(key, createStatusBadge(badge, status));
        }
        return createKeyValue(key, value);
      })
      .join('');
    sections.push(createSection('🛡️ Security Analysis', securityItems));
  }

  return sections.join('');
};

// Format Hash results
export const formatHashResult = (data, isValidation = false) => {
  if (isValidation) {
    const status = data.isValid ? 'success' : 'error';
    const statusText = data.isValid ? 'Valid' : 'Invalid';
    
    return createSection('🔒 Hash Validation Result', `
      ${createKeyValue('Algorithm', data.algorithm, true)}
      ${createKeyValue('Result', createStatusBadge(statusText, status), true)}
      ${data.isValid ? 
        '<div class="validation-success">✅ The password matches the provided hash</div>' :
        '<div class="validation-error">❌ The password does not match the provided hash</div>'
      }
    `);
  } else {
    return createSection('🔒 Hash Generation Result', `
      ${createKeyValue('Algorithm', data.algorithm || 'Unknown', true)}
      <div class="hash-result">
        <label class="hash-label">Generated Hash:</label>
        <code class="hash-value selectable">${data.hash}</code>
        <button class="copy-btn" onclick="copyToClipboard('${data.hash}')">📋 Copy</button>
      </div>
    `);
  }
};

// Format SSL Validation results
export const formatSSLValidation = (data) => {
  let sections = [];

  // Overall status
  const overallStatus = data.valid ? 'success' : 'error';
  const statusText = data.valid ? 'Valid SSL Certificate' : 'SSL Certificate Issues';
  
  sections.push(createSection('🔒 SSL Certificate Status', 
    createStatusBadge(statusText, overallStatus)
  ));

  // Certificate details
  if (data.certificate) {
    const cert = data.certificate;
    const certContent = `
      ${createKeyValue('Subject', cert.subject)}
      ${createKeyValue('Issuer', cert.issuer)}
      ${createKeyValue('Valid From', cert.valid_from)}
      ${createKeyValue('Valid To', cert.valid_to)}
      ${createKeyValue('Days Until Expiry', cert.daysUntilExpiry)}
      ${cert.subjectAltNames ? createKeyValue('Alternative Names', cert.subjectAltNames.join(', ')) : ''}
    `;
    sections.push(createSection('📋 Certificate Details', certContent));
  }

  // Validation errors
  if (data.errors && data.errors.length > 0) {
    const errorItems = data.errors.map(error => `❌ ${error}`);
    sections.push(createSection('⚠️ Validation Errors', createList(errorItems)));
  }

  return sections.join('');
};

// Format DKIM/DMARC results
export const formatDNSRecordResult = (data, type = 'DKIM') => {
  let sections = [];

  if (data.error) {
    return createSection(`❌ ${type} Lookup Error`, 
      `<div class="error-message">${data.error}</div>`
    );
  }

  // Record found
  if (data.records || data.record) {
    const records = data.records || [data.record];
    const recordContent = records.map(record => 
      `<code class="dns-record">${record}</code>`
    ).join('<br>');
    
    sections.push(createSection(`✅ ${type} Record Found`, recordContent));
  }

  // Validation report (for DMARC)
  if (data.report && Array.isArray(data.report)) {
    const reportItems = data.report.map(item => `
      <div class="report-item">
        <strong>${item.Tag}</strong>: ${item.TagValue}
        <div class="report-description">${item.Description}</div>
      </div>
    `);
    sections.push(createSection('📊 DMARC Analysis', reportItems.join('')));
  }

  // Tests (for DMARC)
  if (data.tests && Array.isArray(data.tests)) {
    const testItems = data.tests.map(test => 
      `<div class="test-item">
        ${createStatusBadge(test.Result, 'success')} ${test.Description}
      </div>`
    );
    sections.push(createSection('🧪 Validation Tests', testItems.join('')));
  }

  return sections.join('');
};

// Format Port Scan results
export const formatPortScan = (data) => {
  let sections = [];

  if (data.host) {
    sections.push(createSection('🌐 Scan Target', 
      createKeyValue('Host', data.host, true)
    ));
  }

  if (data.openPorts && Array.isArray(data.openPorts)) {
    const portItems = data.openPorts.map(port => 
      `${createStatusBadge('OPEN', 'success')} Port ${port}`
    );
    sections.push(createSection('🔓 Open Ports', createList(portItems)));
  }

  if (data.closedPorts && Array.isArray(data.closedPorts)) {
    const portItems = data.closedPorts.map(port => 
      `${createStatusBadge('CLOSED', 'error')} Port ${port}`
    );
    sections.push(createSection('🔒 Closed Ports', createList(portItems)));
  }

  if (data.errors && Array.isArray(data.errors)) {
    const errorItems = data.errors.map(error => `❌ ${error}`);
    sections.push(createSection('⚠️ Scan Errors', createList(errorItems)));
  }

  return sections.join('');
};

// Format Authentication results
export const formatAuthResult = (data) => {
  const status = data.success ? 'success' : 'error';
  const statusText = data.success ? 'Authentication Successful' : 'Authentication Failed';
  
  return createSection('🔐 Authentication Result', `
    ${createStatusBadge(statusText, status)}
    ${data.protocol ? createKeyValue('Protocol', data.protocol) : ''}
    ${data.message ? `<div class="auth-message">${data.message}</div>` : ''}
  `);
};

// Format WhoAmI results
export const formatWhoAmIResult = (data) => {
  let sections = [];

  // IP Information
  if (data.ip) {
    sections.push(createSection('🌐 IP Address Information', 
      createKeyValue('IP Address', data.ip, true)
    ));
  }

  // Location Information
  if (data.city || data.region || data.country) {
    const locationContent = `
      ${data.city ? createKeyValue('City', data.city) : ''}
      ${data.region ? createKeyValue('Region/State', data.region) : ''}
      ${data.country ? createKeyValue('Country', data.country) : ''}
      ${data.country_code ? createKeyValue('Country Code', data.country_code) : ''}
      ${data.postal ? createKeyValue('Postal Code', data.postal) : ''}
      ${data.latitude && data.longitude ? createKeyValue('Coordinates', `${data.latitude}, ${data.longitude}`) : ''}
    `;
    sections.push(createSection('📍 Location Information', locationContent));
  }

  // ISP Information
  if (data.isp || data.org || data.as) {
    const ispContent = `
      ${data.isp ? createKeyValue('ISP', data.isp) : ''}
      ${data.org ? createKeyValue('Organization', data.org) : ''}
      ${data.as ? createKeyValue('AS Number', data.as) : ''}
    `;
    sections.push(createSection('🏢 ISP Information', ispContent));
  }

  // Additional Information
  if (data.timezone || data.mobile || data.proxy) {
    const additionalContent = `
      ${data.timezone ? createKeyValue('Timezone', data.timezone) : ''}
      ${data.mobile !== undefined ? createKeyValue('Mobile', data.mobile ? 'Yes' : 'No') : ''}
      ${data.proxy !== undefined ? createKeyValue('Proxy', data.proxy ? 'Yes' : 'No') : ''}
    `;
    sections.push(createSection('ℹ️ Additional Information', additionalContent));
  }

  // If no structured data is available, show raw data
  if (sections.length === 0) {
    const rawContent = Object.entries(data)
      .map(([key, value]) => createKeyValue(key, typeof value === 'object' ? JSON.stringify(value, null, 2) : value))
      .join('');
    sections.push(createSection('📊 Raw Data', rawContent));
  }

  return sections.join('');
};

// Copy to clipboard utility function
window.copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    // Show a temporary success message
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = 'Copied to clipboard!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}; 