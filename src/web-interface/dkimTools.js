import { API_URL } from "./config.js";
import { formatDNSRecordResult } from "./formatters.js";

async function validateDkim() {
  const domain = document.getElementById("dkimDomainInput").value.trim();
  const selector = document.getElementById("dkimSelectorInput").value.trim();
  if (!domain || !selector) {
    alert("Please enter both domain and selector.");
    return;
  }
  const url = `${API_URL}/lookup-dkim?domain=${encodeURIComponent(
    domain
  )}&selector=${encodeURIComponent(selector)}`;
  const resultsElement = document.getElementById("dkimResults");

  // Show loading state
  resultsElement.innerHTML = `<div class="loading">Looking up DKIM record for ${selector}._domainkey.${domain}...</div>`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    displayDkimResults(data);
  } catch (error) {
    console.error("DKIM validation error:", error);
    resultsElement.innerHTML = `<div class="error">Error: ${error.message || "Failed to validate DKIM record"}</div>`;
  }
}

async function generateDkim() {
  const domain = document.getElementById("dkimDomainInput").value.trim();
  const selector = document.getElementById("dkimSelectorInput").value.trim();
  if (!domain || !selector) {
    alert("Please enter both domain and selector.");
    return;
  }
  const url = `${API_URL}/generate-dkim-keys?domain=${encodeURIComponent(
    domain
  )}&selector=${encodeURIComponent(selector)}`;
  const resultsElement = document.getElementById("dkimResults");

  // Show loading state
  resultsElement.innerHTML = `<div class="loading">Generating DKIM keys for ${selector}._domainkey.${domain}...</div>`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    displayDkimGenResults(data);
  } catch (error) {
    console.error("DKIM generation error:", error);
    resultsElement.innerHTML = `<div class="error">Error: ${error.message || "Failed to generate DKIM keys"}</div>`;
  }
}

function displayDkimResults(data) {
  const resultsElement = document.getElementById("dkimResults");
  resultsElement.innerHTML = formatDNSRecordResult(data, 'DKIM');
}

function displayDkimGenResults(data) {
  const resultsElement = document.getElementById("dkimResults");
  
  if (data.dkimRecord) {
    // Store the data in a safe way for copying
    window.currentDkimData = data;
    
    resultsElement.innerHTML = `
      <div class="dkim-generation">
        <div class="status-section">
          <div class="status-badge success">✅ DKIM Keys Generated</div>
          <div class="status-badge warning">⚠️ Handle Private Key Securely</div>
        </div>
        
        <div class="dkim-dns-record">
          <h4>🌐 DNS Record (Add to your DNS zone):</h4>
          <div class="record-content">${data.dkimRecord}</div>
          <button class="copy-btn" onclick="copyToClipboard(window.currentDkimData.dkimRecord)">📋 Copy DNS Record</button>
        </div>
        
        <div class="dkim-private-key">
          <h4>🔑 Private Key (Keep Secure):</h4>
          <div class="private-key-warning">
            <strong>⚠️ Security Warning:</strong> ${data.privateKeyWarning || 'Keep this private key secure and never share it publicly!'}
          </div>
          <div class="key-content"><pre>${data.privateKey}</pre></div>
          <button class="copy-btn" onclick="copyToClipboard(window.currentDkimData.privateKey)">📋 Copy Private Key</button>
        </div>
      </div>
    `;
  } else {
    resultsElement.innerHTML = `<div class="error">Error: Unknown DKIM generation response format. Received: ${JSON.stringify(data)}</div>`;
  }
}

export function initDkimTools() {
  document
    .getElementById("validateDkimBtn")
    .addEventListener("click", validateDkim);
  document
    .getElementById("generateDkimBtn")
    .addEventListener("click", generateDkim);
}

