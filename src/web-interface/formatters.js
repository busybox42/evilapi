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

// Format DNS lookup results
export const formatDnsLookup = (data) => {
  if (!data || typeof data !== 'object') {
    return `<div class="error-message">Invalid DNS lookup data</div>`;
  }

  if (data.error) {
    return `<div class="error-message">DNS Lookup Error: ${data.error}</div>`;
  }

  let sections = [];

  // Header with basic info
  sections.push(createSection('🔍 DNS Lookup Query', `
    ${createKeyValue('Host', data.host, true)}
    ${createKeyValue('Record Type', data.type, true)}
    ${createKeyValue('Timestamp', new Date(data.timestamp).toLocaleString())}
  `));

  // Records section
  if (data.records && data.records.length > 0) {
    const recordItems = data.records.map((record, index) => 
      `<div class="record-item">
        <span class="record-number">${index + 1}.</span>
        <span class="record-value">${formatDnsRecord(record, data.type)}</span>
      </div>`
    );
    
    sections.push(createSection(`📋 DNS Records (${data.records.length})`, recordItems.join('')));
  } else {
    sections.push(createSection('❌ No Records Found', 
      `<div class="no-records">No ${data.type} records found for ${data.host}</div>`
    ));
  }

  return sections.join('');
};

// Helper function to format different DNS record types
function formatDnsRecord(record, type) {
  if (typeof record === 'string') {
    return `<code class="dns-record">${record}</code>`;
  }

  if (Array.isArray(record)) {
    return `<code class="dns-record">${record.join(' ')}</code>`;
  }

  if (typeof record === 'object' && record !== null) {
    switch (type) {
      case 'MX':
        return `<code class="dns-record">${record.exchange}</code> <span class="mx-priority">(priority: ${record.priority})</span>`;
      case 'SRV':
        return `<code class="dns-record">${record.name}</code> <span class="srv-details">port ${record.port} priority ${record.priority} weight ${record.weight}</span>`;
      case 'SOA':
        return `<code class="dns-record">${record.nsname} ${record.hostmaster}</code> <span class="soa-details">(serial: ${record.serial})</span>`;
      case 'TXT':
        return `<code class="dns-record">${JSON.stringify(record)}</code>`;
      default:
        return `<code class="dns-record">${JSON.stringify(record)}</code>`;
    }
  }

  return `<code class="dns-record">${String(record)}</code>`;
}

// Format Email Info results
export const formatEmailInfo = (data) => {
  let sections = [];

  // MX Records
  if (data.mxRecords && data.mxRecords.length > 0) {
    const mxContent = data.mxRecords.map(mx => 
      `<code class="dns-record">Priority ${mx.priority}: ${mx.exchange || 'No exchange specified'}</code>`
    ).join('<br>');
    sections.push(createSection('📧 MX Records (Mail Servers)', mxContent));
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
    sections.push(createSection('🔒 DMARC Record (Domain-based Message Authentication)', dmarcContent));
  }

  // Client Settings
  if (data.clientSettings && data.clientSettings.length > 0) {
    const settingsContent = `<code class="dns-record">${data.clientSettings.join('\n')}</code>`;
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
            <strong>${result.rbl || result.blacklist || 'Unknown RBL'}</strong> ${status}
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

  // Basic Email Information
  if (data.subject || data.from || data.to || data.date) {
    const basicContent = `
      ${data.subject ? createKeyValue('Subject', data.subject, true) : ''}
      ${data.from ? createKeyValue('From', data.from, true) : ''}
      ${data.to ? createKeyValue('To', data.to, true) : ''}
      ${data.date ? createKeyValue('Date', new Date(data.date).toLocaleString(), true) : ''}
    `;
    sections.push(createSection('📧 Email Information', basicContent));
  }

  // Authentication Results
  if (data.spf || data.dkim || data.dmarc) {
    const authContent = `
      ${data.spf ? createKeyValue('SPF', data.spf.includes('No') ? createStatusBadge(data.spf, 'warning') : createStatusBadge(data.spf, 'success')) : ''}
      ${data.dkim ? createKeyValue('DKIM', data.dkim.includes('No') ? createStatusBadge(data.dkim, 'warning') : createStatusBadge(data.dkim, 'success')) : ''}
      ${data.dmarc ? createKeyValue('DMARC', data.dmarc.includes('No') ? createStatusBadge(data.dmarc, 'warning') : createStatusBadge(data.dmarc, 'success')) : ''}
    `;
    sections.push(createSection('🔐 Authentication Results', authContent));
  }

  // Email Path Analysis
  if (data.receivedDelays && Array.isArray(data.receivedDelays)) {
    const pathItems = data.receivedDelays.map((hop, index) => 
      `<div class="hop-item">
        <strong>Hop ${hop.hop}:</strong> ${hop.host} 
        <span class="hop-delay">(${hop.delay})</span>
      </div>`
    );
    const pathContent = pathItems.join('') + 
      (data.totalTime ? `<div class="total-time"><strong>Total Transit Time:</strong> ${data.totalTime}</div>` : '');
    sections.push(createSection('📍 Email Path Analysis', pathContent));
  }

  // All Headers
  if (data.headersFound && Array.isArray(data.headersFound)) {
    const headerContent = data.headersFound
      .map(header => createKeyValue(
        header.headerName.toUpperCase(), 
        header.headerValue.length > 100 ? 
          header.headerValue.substring(0, 100) + '...' : 
          header.headerValue
      ))
      .join('');
    sections.push(createSection('📋 All Headers', headerContent));
  }

  // If no structured data is available, show raw data
  if (sections.length === 0) {
    const rawContent = Object.entries(data)
      .map(([key, value]) => createKeyValue(key, typeof value === 'object' ? JSON.stringify(value, null, 2) : value))
      .join('');
    sections.push(createSection('📊 Raw Analysis Data', rawContent));
  }

  return sections.join('');
};

// Format Hash results
export const formatHashResult = (data, isValidation = false) => {
  if (isValidation) {
    const validationData = data.data || data;
    const status = validationData.isValid ? 'success' : 'error';
    const statusText = validationData.isValid ? 'Valid' : 'Invalid';
    
    return createSection('🔒 Hash Validation Result', `
      ${createKeyValue('Algorithm', validationData.algorithm, true)}
      ${createKeyValue('Result', createStatusBadge(statusText, status), true)}
      ${validationData.isValid ? 
        '<div class="validation-success">✅ The password matches the provided hash</div>' :
        '<div class="validation-error">❌ The password does not match the provided hash</div>'
      }
    `);
  } else {
    const hashData = data.data || data;
    const hash = hashData.hash;
    
    return createSection('🔒 Hash Generation Result', `
      ${createKeyValue('Algorithm', hashData.algorithm || 'Unknown', true)}
      <div class="hash-result">
        <label class="hash-label">Generated Hash:</label>
        <code class="hash-value selectable">${hash}</code>
        <button class="copy-btn" onclick="copyToClipboard('${hash}')">📋 Copy</button>
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
  if (data.details || data.certificate) {
    const cert = data.details || data.certificate;
    
    // Helper function to format certificate subject/issuer objects
    const formatCertificateInfo = (obj) => {
      if (typeof obj === 'string') return obj;
      if (typeof obj === 'object' && obj !== null) {
        // Handle certificate subject/issuer objects
        const parts = [];
        if (obj.CN) parts.push(`CN=${obj.CN}`);
        if (obj.O) parts.push(`O=${obj.O}`);
        if (obj.C) parts.push(`C=${obj.C}`);
        if (obj.ST) parts.push(`ST=${obj.ST}`);
        if (obj.L) parts.push(`L=${obj.L}`);
        if (obj.OU) parts.push(`OU=${obj.OU}`);
        return parts.length > 0 ? parts.join(', ') : JSON.stringify(obj);
      }
      return String(obj);
    };

    // Calculate days until expiry
    const calculateDaysUntilExpiry = (validTo) => {
      if (!validTo) return 'Unknown';
      const expiryDate = new Date(validTo);
      const today = new Date();
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? `${diffDays} days` : `Expired ${Math.abs(diffDays)} days ago`;
    };

    const certContent = `
      ${cert.subject ? createKeyValue('Subject', formatCertificateInfo(cert.subject)) : ''}
      ${cert.issuer ? createKeyValue('Issuer', formatCertificateInfo(cert.issuer)) : ''}
      ${cert.validFrom ? createKeyValue('Valid From', new Date(cert.validFrom).toLocaleString()) : ''}
      ${cert.validTo ? createKeyValue('Valid To', new Date(cert.validTo).toLocaleString()) : ''}
      ${cert.validTo ? createKeyValue('Days Until Expiry', calculateDaysUntilExpiry(cert.validTo)) : ''}
      ${cert.serialNumber ? createKeyValue('Serial Number', cert.serialNumber) : ''}
      ${cert.algorithm ? createKeyValue('Algorithm', cert.algorithm) : ''}
      ${cert.alternativeHostnames ? createKeyValue('Alternative Names', cert.alternativeHostnames.join(', ')) : ''}
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

  // Handle both old array format and new object format
  let results = [];
  let host = null;
  
  if (Array.isArray(data)) {
    // Old format: direct array
    results = data;
  } else if (data && data.results && Array.isArray(data.results)) {
    // New format: object with results array
    results = data.results;
    host = data.host;
  } else {
    return createSection('❌ Port Scan Error', 
      '<div class="error-message">Invalid port scan data format</div>'
    );
  }

  // Separate open and closed ports
  const openPorts = results.filter(item => item.status === 'open');
  const closedPorts = results.filter(item => item.status === 'closed');

  // Header with target host
  sections.push(createSection('🔍 Port Scan Results', 
    createStatusBadge('Scan Completed', 'success')
  ));

  // Show target host if available
  if (host) {
    sections.push(createSection('🌐 Scan Target', 
      createKeyValue('Host', host, true)
    ));
  }

  // Open ports
  if (openPorts.length > 0) {
    const portItems = openPorts.map(item => 
      `${createStatusBadge('OPEN', 'success')} Port ${item.port}`
    );
    sections.push(createSection('🔓 Open Ports', createList(portItems)));
  }

  // Closed ports (only show if there are some, to avoid cluttering)
  if (closedPorts.length > 0 && closedPorts.length <= 10) {
    const portItems = closedPorts.map(item => 
      `${createStatusBadge('CLOSED', 'error')} Port ${item.port}`
    );
    sections.push(createSection('🔒 Closed Ports', createList(portItems)));
  }

  // Summary
  const summaryContent = `
    ${createKeyValue('Total Ports Scanned', results.length, true)}
    ${createKeyValue('Open Ports', openPorts.length, true)}
    ${createKeyValue('Closed Ports', closedPorts.length, true)}
  `;
  sections.push(createSection('📊 Scan Summary', summaryContent));

  // If there are too many closed ports, show a note
  if (closedPorts.length > 10) {
    sections.push(createSection('ℹ️ Note', 
      '<div class="info-message">Closed ports list is hidden to reduce clutter. See summary above for counts.</div>'
    ));
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

  // Handle error cases
  if (data.error) {
    sections.push(createSection('❌ Who Am I Lookup Failed', 
      createStatusBadge('Lookup Failed', 'error')
    ));

    if (data.message) {
      sections.push(createSection('⚠️ Error Details', 
        `<div class="error-message">${data.message}</div>`
      ));
    }

    if (data.requestedIp) {
      sections.push(createSection('🔍 Request Details', 
        createKeyValue('Requested IP/Hostname', data.requestedIp)
      ));
    }

    // Troubleshooting tips
    const troubleshootingTips = [
      'Check if the IP address or hostname is valid',
      'Verify network connectivity',
      'Try with a different IP address (e.g., 8.8.8.8)',
      'Rate limiting may be in effect - try again later',
      'Ensure the IP is publicly routable'
    ];
    
    sections.push(createSection('🔧 Troubleshooting Tips', 
      createList(troubleshootingTips.map(tip => `💡 ${tip}`))
    ));

    return sections.join('');
  }

  // Success header
  sections.push(createSection('✅ Who Am I Information', 
    createStatusBadge('Lookup Successful', 'success')
  ));

  // IP Information (handle different data structures)
  const ipAddress = data.ip || data.ipAddress || data.query || data.requestedIp;
  if (ipAddress) {
    sections.push(createSection('🌐 IP Address Information', 
      createKeyValue('IP Address', ipAddress, true)
    ));
  }

  // Location Information (handle geoInfo nested structure)
  const geoInfo = data.geoInfo || data;
  const location = data.location || data;
  
  if (geoInfo.city || geoInfo.region || geoInfo.country || location.city || location.region || location.country) {
    const locationContent = `
      ${(geoInfo.city || location.city) ? createKeyValue('City', geoInfo.city || location.city) : ''}
      ${(geoInfo.region || location.region || location.regionName) ? createKeyValue('Region/State', geoInfo.region || location.region || location.regionName) : ''}
      ${(geoInfo.country || location.country || location.countryCode) ? createKeyValue('Country', geoInfo.country || location.country || location.countryCode) : ''}
      ${(geoInfo.ll && Array.isArray(geoInfo.ll)) ? createKeyValue('Coordinates', `${geoInfo.ll[0]}, ${geoInfo.ll[1]}`) : ''}
      ${(location.lat && location.lon) ? createKeyValue('Coordinates', `${location.lat}, ${location.lon}`) : ''}
      ${(geoInfo.timezone || location.timezone) ? createKeyValue('Timezone', geoInfo.timezone || location.timezone) : ''}
    `;
    sections.push(createSection('📍 Location Information', locationContent));
  }

  // ISP Information (handle different structures)
  const ispInfo = data.ispInfo || data;
  if (ispInfo.isp || ispInfo.org || ispInfo.as || data.isp || data.org || data.as) {
    const ispContent = `
      ${(ispInfo.isp || data.isp) ? createKeyValue('ISP', ispInfo.isp || data.isp) : ''}
      ${(ispInfo.org || data.org) ? createKeyValue('Organization', ispInfo.org || data.org) : ''}
      ${(ispInfo.as || data.as) ? createKeyValue('AS Number', ispInfo.as || data.as) : ''}
    `;
    sections.push(createSection('🏢 ISP Information', ispContent));
  }

  // PTR Record (reverse DNS)
  if (data.ptrRecord) {
    sections.push(createSection('🔄 Reverse DNS', 
      createKeyValue('PTR Record', data.ptrRecord, true)
    ));
  }

  // Additional Information
  const additionalInfo = [];
  if (data.mobile !== undefined) additionalInfo.push(createKeyValue('Mobile Connection', data.mobile ? 'Yes' : 'No'));
  if (data.proxy !== undefined) additionalInfo.push(createKeyValue('Proxy Detected', data.proxy ? 'Yes' : 'No'));
  if (data.hosting !== undefined) additionalInfo.push(createKeyValue('Hosting Provider', data.hosting ? 'Yes' : 'No'));
  
  if (additionalInfo.length > 0) {
    sections.push(createSection('ℹ️ Additional Information', additionalInfo.join('')));
  }

  // If we have raw WHOIS data
  if (data.ispInfo && typeof data.ispInfo === 'object' && Object.keys(data.ispInfo).length > 0) {
    const whoisEntries = Object.entries(data.ispInfo)
      .filter(([key, value]) => value && !['isp', 'org', 'as'].includes(key))
      .map(([key, value]) => createKeyValue(key.charAt(0).toUpperCase() + key.slice(1), 
        typeof value === 'object' ? JSON.stringify(value, null, 2) : value));
    
    if (whoisEntries.length > 0) {
      sections.push(createSection('📋 WHOIS Information', whoisEntries.join('')));
    }
  }

  // If no structured data is available, show raw data
  if (sections.length <= 1) { // Only success header
    const rawContent = Object.entries(data)
      .filter(([key]) => !['error', 'message', 'requestedIp'].includes(key))
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

// Format Spam Scan results
export const formatSpamScan = (data) => {
  if (!data || (!data.score && !data.decision)) {
    return createSection('❌ Spam Scan Error', 
      '<div class="error-message">No scan results available or invalid data format</div>'
    );
  }

  let sections = [];
  
  // Parse score
  let score = 0;
  let threshold = 5;
  let scoreDisplay = 'N/A';
  
  if (data.score && data.score !== 'N/A') {
    const scoreParts = data.score.split('/');
    if (scoreParts.length >= 2) {
      score = parseFloat(scoreParts[0]);
      threshold = parseFloat(scoreParts[1]);
      scoreDisplay = data.score;
    } else {
      scoreDisplay = data.score;
    }
  }
  
  // Determine status based on decision and score
  let status, statusText;
  if (data.decision && (data.decision.includes('Error') || data.decision.includes('Unavailable'))) {
    status = 'error';
    statusText = '❌ SCAN ERROR';
  } else if (data.decision && (data.decision.includes('Timeout') || data.decision.includes('Too Large'))) {
    status = 'warning';
    statusText = '⚠️ SCAN LIMITED';
  } else if (data.decision === 'Scan Complete (No Rules)') {
    status = 'info';
    statusText = '✅ SCAN COMPLETE';
  } else if (data.decision === 'Spam Detected') {
    status = 'error';
    statusText = '🚨 SPAM DETECTED';
  } else if (data.decision === 'Suspicious Content') {
    status = 'warning';
    statusText = '⚠️ SUSPICIOUS CONTENT';
  } else if (data.decision === 'Clean') {
    status = 'success';
    statusText = '✅ CLEAN';
  } else {
    // Fallback to score-based detection for compatibility
    const isSpam = score >= threshold && threshold > 0;
    status = isSpam ? 'error' : 'success';
    statusText = isSpam ? '🚨 SPAM DETECTED' : '✅ CLEAN';
  }
  
  // Overall result
  sections.push(createSection('🛡️ Spam Scan Result', `
    ${createStatusBadge(statusText, status)}
    ${createKeyValue('Score', scoreDisplay, true)}
    ${data.decision ? createKeyValue('Status', data.decision) : ''}
  `));

  // Detailed analysis
  if (data.details && Array.isArray(data.details) && data.details.length > 0) {
    const detailItems = data.details.map(detail => {
      // Handle both numeric and N/A points
      const points = detail.points === 'N/A' ? 'N/A' : parseFloat(detail.points) || 0;
      const pointsClass = points === 'N/A' ? 'spam-info' : points > 0 ? 'spam-positive' : 'spam-negative';
      const pointsPrefix = (points !== 'N/A' && points > 0) ? '+' : '';
      
      return `
        <div class="spam-rule">
          <div class="rule-points ${pointsClass}">
            ${pointsPrefix}${points}
          </div>
          <div class="rule-details">
            <strong>${detail.ruleName}</strong>
            <div class="rule-description">${detail.description}</div>
          </div>
        </div>
      `;
    }).join('');
    
    sections.push(createSection('📊 Analysis Details', detailItems));
  }

  return sections.join('');
};

// Format Email Delivery Test results
export const formatEmailDeliveryTest = (data) => {
  let sections = [];

  if (data.success) {
    // Successful delivery
    sections.push(createSection('✅ Email Delivery Test - Success', 
      createStatusBadge('Email Successfully Delivered', 'success')
    ));

    // Performance metrics
    if (data.latency) {
      const latencyMs = parseInt(data.latency.replace('ms', ''));
      const latencyStatus = latencyMs < 1000 ? 'success' : latencyMs < 30000 ? 'warning' : 'error';
      const performanceContent = `
        ${createKeyValue('Delivery Latency', data.latency, true)}
        ${createStatusBadge(
          latencyMs < 1000 ? 'Excellent Performance' : 
          latencyMs < 30000 ? 'Good Performance' : 'Slow Delivery', 
          latencyStatus
        )}
      `;
      sections.push(createSection('⚡ Performance Metrics', performanceContent));
    }

    // Email details
    if (data.details) {
      const detailsContent = `
        ${data.details.from ? createKeyValue('From', data.details.from) : ''}
        ${data.details.subject ? createKeyValue('Subject', data.details.subject) : ''}
        ${data.details.date ? createKeyValue('Date Received', new Date(data.details.date).toLocaleString()) : ''}
      `;
      sections.push(createSection('📧 Email Details', detailsContent));
    }

    // Success message
    if (data.message) {
      sections.push(createSection('📋 Test Results', 
        `<div class="success-message">${data.message}</div>`
      ));
    }

  } else {
    // Failed delivery
    sections.push(createSection('❌ Email Delivery Test - Failed', 
      createStatusBadge('Email Delivery Failed', 'error')
    ));

    // Error details
    if (data.message) {
      sections.push(createSection('⚠️ Error Details', 
        `<div class="error-message">${data.message}</div>`
      ));
    }

    // Troubleshooting tips
    const troubleshootingTips = [
      'Verify SMTP server settings and credentials',
      'Check IMAP server settings and authentication',
      'Ensure firewall allows SMTP/IMAP connections',
      'Verify email addresses are correct',
      'Check if emails are going to spam folder',
      'Increase timeout if network is slow'
    ];
    
    sections.push(createSection('🔧 Troubleshooting Tips', 
      createList(troubleshootingTips.map(tip => `💡 ${tip}`))
    ));
  }

  return sections.join('');
};

// Format DNS propagation results
export const formatDnsPropagation = (data) => {
  if (!data || typeof data !== 'object') {
    return `<div class="error-message">Invalid DNS propagation data</div>`;
  }

  if (data.error) {
    return `<div class="error-message">DNS Propagation Error: ${data.error}</div>`;
  }

  let sections = [];

  // Header with basic info
  sections.push(createSection('🌐 DNS Propagation Check', `
    ${createKeyValue('Hostname', data.hostname, true)}
    ${createKeyValue('Record Type', data.recordType, true)}
    ${createKeyValue('Query Time', new Date(data.timestamp).toLocaleString())}
    ${createKeyValue('Servers Checked', data.totalServers || 0, true)}
  `));

  // Summary section
  const propagationStatus = data.hasInconsistentRecords ? 
    createStatusBadge('INCONSISTENT', 'warning') : 
    createStatusBadge('CONSISTENT', 'success');
  
  sections.push(createSection('📊 Propagation Summary', `
    ${createKeyValue('Status', propagationStatus, true)}
    ${createKeyValue('Successful Queries', `${data.successful || 0}/${data.totalServers || 0}`)}
    ${createKeyValue('Failed Queries', data.failed || 0)}
    ${createKeyValue('Average Response Time', data.averageResponseTime ? `${data.averageResponseTime}ms` : 'N/A')}
    ${data.hasInconsistentRecords ? createKeyValue('Inconsistencies Found', data.uniqueRecordSets || 0, true) : ''}
  `));

  // Server results
  if (data.results && data.results.length > 0) {
    const serverResults = data.results.map(result => {
      const status = result.success ? 
        createStatusBadge('SUCCESS', 'success') : 
        createStatusBadge('FAILED', 'error');
      
      const records = result.records ? 
        result.records.map(record => formatDnsRecord(record, data.recordType)).join('<br>') :
        'No records found';
      
      return `
        <div class="dns-server-result">
          <div class="server-header">
            <strong>${result.server}</strong> (${result.location}) ${status}
            ${result.responseTime ? `<span class="response-time">${result.responseTime}ms</span>` : ''}
          </div>
          <div class="server-ip">
            <code>${result.ip}</code>
          </div>
          <div class="server-records">
            ${result.success ? records : `<div class="server-error">Error: ${result.error}</div>`}
          </div>
        </div>
      `;
    }).join('');

    sections.push(createSection(`🖥️ DNS Server Results (${data.results.length})`, serverResults));
  }

  // Inconsistencies section
  if (data.hasInconsistentRecords && data.recordValuesByServer) {
    const recordList = Object.entries(data.recordValuesByServer).map(([server, records]) =>
      `<div><strong>${server}:</strong> <code>${records.join(', ')}</code></div>`
    ).join('');
    sections.push(createSection('⚠️ Record Values by Server', recordList));
  }

  return sections.join('');
};

// Format multi-record propagation results
export const formatMultiRecordPropagation = (data) => {
  if (!data || typeof data !== 'object') {
    return `<div class="error-message">Invalid multi-record propagation data</div>`;
  }

  if (data.error) {
    return `<div class="error-message">Multi-Record Propagation Error: ${data.error}</div>`;
  }

  let sections = [];

  // Header with basic info
  sections.push(createSection('🌐 Multi-Record DNS Propagation', `
    ${createKeyValue('Hostname', data.hostname, true)}
    ${createKeyValue('Record Types Checked', Array.isArray(data.recordTypes) ? data.recordTypes.join(', ') : 'N/A', true)}
    ${createKeyValue('Query Time', new Date(data.timestamp).toLocaleString())}
  `));

  // Calculate total server queries across all record types
  let totalServerQueries = 0;
  if (Array.isArray(data.results)) {
    totalServerQueries = data.results.reduce((sum, r) => sum + (r.totalServers || (r.results ? r.results.length : 0)), 0);
  }

  // Summary section
  if (data.summary) {
    let overallStatus = data.summary?.overallStatus;
    let statusBadge;
    if (overallStatus === 'ALL_CONSISTENT') {
      statusBadge = createStatusBadge('ALL CONSISTENT', 'success');
    } else if (overallStatus === 'ALL_RECORDS_PROPAGATED') {
      statusBadge = createStatusBadge('ALL PROPAGATED', 'success');
    } else if (overallStatus === 'SOME_FAILED') {
      statusBadge = createStatusBadge('SOME FAILED', 'error');
    } else if (overallStatus === 'ALL_FAILED') {
      statusBadge = createStatusBadge('ALL FAILED', 'error');
    } else {
      statusBadge = createStatusBadge(overallStatus || 'UNKNOWN', 'info');
    }
    sections.push(createSection('📊 Overall Summary', `
      ${createKeyValue('Status', statusBadge, true)}
      ${createKeyValue('Successful Record Types', data.summary.successful || 0)}
      ${createKeyValue('Failed Record Types', data.summary.failed || 0)}
      ${createKeyValue('Total Server Queries', totalServerQueries)}
    `));
  }

  // Individual record type results
  if (data.results && data.results.length > 0) {
    const recordResults = data.results.map(result => {
      if (result.success === false) {
        return `
          <div class="record-type-result">
            <h4>${result.recordType} Records ${createStatusBadge('FAILED', 'error')}</h4>
            <div class="error-message">Error: ${result.error}</div>
          </div>
        `;
      }
      // Use backend hasInconsistentRecords for status
      const status = result.hasInconsistentRecords
        ? createStatusBadge('INCONSISTENT', 'warning')
        : createStatusBadge('CONSISTENT', 'success');
      let recordList = '';
      // Show all per-server results for this record type
      if (Array.isArray(result.results) && result.results.length > 0) {
        recordList = result.results.map(serverResult => {
          const sStatus = serverResult.success ? createStatusBadge('SUCCESS', 'success') : createStatusBadge('FAILED', 'error');
          // Use formatDnsRecord to correctly display different record types
          const records = serverResult.records 
            ? serverResult.records.map(r => formatDnsRecord(r, result.recordType)).join('<br>') 
            : 'No records found';
          return `<div class="dns-server-result" style="margin-bottom:0.5em;">
            <div class="server-header"><strong>${serverResult.server}</strong> (${serverResult.location}) ${sStatus} ${serverResult.responseTime ? `<span class="response-time">${serverResult.responseTime}ms</span>` : ''}</div>
            <div class="server-ip"><code>${serverResult.ip}</code></div>
            <div class="server-records">${serverResult.success ? records : `<div class="server-error">Error: ${serverResult.error}</div>`}</div>
          </div>`;
        }).join('');
      }
      // If inconsistent, also show recordValuesByServer
      if (result.hasInconsistentRecords && result.recordValuesByServer) {
        recordList += Object.entries(result.recordValuesByServer).map(([server, records]) => {
          const formattedRecords = records.map(r => formatDnsRecord(r, result.recordType)).join(', ');
          return `<div><strong>${server}:</strong> ${formattedRecords}</div>`;
        }).join('');
      }
      // Use result.totalServers or result.results.length for denominator
      const totalServers = result.totalServers || (result.results ? result.results.length : 0);
      return `
        <div class="record-type-result">
          <h4>${result.recordType} Records ${status}</h4>
          <div class="record-summary">
            ${createKeyValue('Successful Queries', `${result.successful || 0}/${totalServers}`)}
            ${createKeyValue('Failed Queries', result.failed || 0)}
            ${result.summary?.avgResponseTime ? createKeyValue('Avg Response Time', `${result.summary.avgResponseTime}ms`) : ''}
          </div>
          ${recordList}
        </div>
      `;
    }).join('');

    sections.push(createSection('📋 Record Type Results', recordResults));
  }

  return sections.join('');
};

// Format DNS server list
export const formatDnsServerList = (data) => {
  if (!data || typeof data !== 'object') {
    return `<div class="error-message">Invalid DNS server list data</div>`;
  }

  if (data.error) {
    return `<div class="error-message">DNS Server List Error: ${data.error}</div>`;
  }

  let sections = [];

  // Header with basic info
  sections.push(createSection('🖥️ Available DNS Servers', `
    ${createKeyValue('Total Servers', data.total || 0, true)}
    ${createKeyValue('Last Updated', new Date(data.timestamp).toLocaleString())}
  `));

  // Server list
  if (data.servers && data.servers.length > 0) {
    const serverList = data.servers.map((server, index) => 
      `<div class="dns-server-item">
        <div class="server-info">
          <strong>${server.name}</strong>
          <span class="server-ip">${server.ip}</span>
          <span class="server-location">${server.location}</span>
        </div>
      </div>`
    ).join('');

    sections.push(createSection(`📡 DNS Server List (${data.servers.length})`, serverList));
  }

  return sections.join('');
};