import { API_URL } from "./config.js";
import { formatDNSRecordResult } from "./formatters.js";

async function validateDmarc() {
  const domainInput = document.getElementById("dmarcDomainInput");
  const domain = domainInput.value.trim();
  if (!domain) {
    alert("Please enter a domain.");
    return; // Prevent the function from proceeding further
  }
  const url = `${API_URL}/validate-dmarc?domain=${encodeURIComponent(domain)}`;
  const resultsElement = document.getElementById("dmarcResults");

  // Show loading state
  resultsElement.innerHTML = `<div class="loading">Loading DMARC record for ${domain}...</div>`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displayDmarcResults(data);
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
    resultsElement.innerHTML = `<div class="error">Error: ${error.message || "Failed to validate DMARC record"}</div>`;
  }
}

function displayDmarcResults(data) {
  const resultsElement = document.getElementById("dmarcResults");
  resultsElement.innerHTML = formatDNSRecordResult(data, 'DMARC');
}

export function initValidateDmarc() {
  document
    .getElementById("fetchDmarcBtn")
    .addEventListener("click", validateDmarc); // Corrected button ID
}
