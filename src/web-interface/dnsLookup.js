import { API_URL } from "./config.js";
import { formatDnsLookup } from "./formatters.js";

async function performDnsLookup() {
  const hostInput = document.getElementById("dnsHostInput");
  const typeSelect = document.getElementById("dnsTypeSelect");
  const dnsServerInput = document.getElementById("dnsServerInput");
  const resultsContainer = document.getElementById("dnsLookupResults");

  const host = hostInput.value.trim();
  const type = typeSelect.value;
  const dnsServer = dnsServerInput.value.trim();

  if (!host) {
    resultsContainer.innerHTML = `<div class="error-message">Please enter a hostname or IP address.</div>`;
    return;
  }

  // Show loading indicator
  resultsContainer.innerHTML = `<div class="loading">🔍 Performing DNS lookup...</div>`;

  try {
    const queryParams = new URLSearchParams({ host, type });
    if (dnsServer) queryParams.append("dnsServer", dnsServer);

    const response = await fetch(`${API_URL}/lookup?${queryParams}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    
    // Check if the response contains an error
    if (resultData.error) {
      resultsContainer.innerHTML = `<div class="error-message">DNS Lookup Error: ${resultData.error}</div>`;
      return;
    }

    // Use the formatter to display results
    resultsContainer.innerHTML = formatDnsLookup(resultData);
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    resultsContainer.innerHTML = `<div class="error-message">
      Failed to perform DNS lookup: ${error.message}
      <br><br>
      <div class="troubleshooting">
        <strong>Troubleshooting:</strong><br>
        • Check if the hostname is valid<br>
        • Verify network connectivity<br>
        • Try a different DNS server (e.g., 8.8.8.8)<br>
        • Some record types may not be available for all domains
      </div>
    </div>`;
  }
}

export function initDnsLookup() {
  // Existing setup for click event
  document
    .getElementById("performDnsLookupBtn")
    .addEventListener("click", performDnsLookup);

  // Add keypress event listeners to input fields
  const inputs = [
    document.getElementById("dnsHostInput"),
    document.getElementById("dnsTypeSelect"),
    document.getElementById("dnsServerInput"),
  ];

  inputs.forEach((input) => {
    input.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent the default action to stop form submission if applicable
        performDnsLookup(); // Trigger DNS lookup when Enter is pressed
      }
    });
  });
}
