import { API_URL } from "./config.js";
import { formatDnsPropagation, formatMultiRecordPropagation, formatDnsServerList } from "./formatters.js";

// Function to perform single DNS propagation check
async function performPropagationCheck() {
  const hostInput = document.getElementById("propagationHostInput");
  const typeSelect = document.getElementById("propagationTypeSelect");
  const resultsContainer = document.getElementById("propagationResults");
  const loadingIndicator = document.getElementById("propagationLoadingIndicator");

  const hostname = hostInput.value.trim();
  const recordType = typeSelect.value;

  if (!hostname) {
    resultsContainer.innerHTML = `<div class="error-message">Please enter a hostname to check.</div>`;
    return;
  }

  // Show loading indicator
  loadingIndicator.classList.remove("hidden");
  resultsContainer.innerHTML = "";

  try {
    const queryParams = new URLSearchParams({ hostname, recordType });
    const response = await fetch(`${API_URL}/check?${queryParams}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    
    // Check if the response contains an error
    if (resultData.error) {
      resultsContainer.innerHTML = `<div class="error-message">DNS Propagation Error: ${resultData.error}</div>`;
      return;
    }

    // Use the formatter to display results
    resultsContainer.innerHTML = formatDnsPropagation(resultData);
  } catch (error) {
    console.error("DNS propagation check error:", error);
    resultsContainer.innerHTML = `<div class="error-message">
      Failed to check DNS propagation: ${error.message}
      <br><br>
      <div class="troubleshooting">
        <strong>Troubleshooting:</strong><br>
        • Verify the hostname is correct and accessible<br>
        • Check if the record type exists for this domain<br>
        • Some DNS servers may be temporarily unavailable<br>
        • Try checking again in a few minutes
      </div>
    </div>`;
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Function to perform multiple record types check
async function performMultiRecordCheck() {
  const hostInput = document.getElementById("propagationHostInput");
  const resultsContainer = document.getElementById("propagationResults");
  const loadingIndicator = document.getElementById("propagationLoadingIndicator");

  const hostname = hostInput.value.trim();

  if (!hostname) {
    resultsContainer.innerHTML = `<div class="error-message">Please enter a hostname to check.</div>`;
    return;
  }

  // Show loading indicator
  loadingIndicator.classList.remove("hidden");
  resultsContainer.innerHTML = "";

  try {
    const queryParams = new URLSearchParams({ hostname });
    const response = await fetch(`${API_URL}/check-multi?${queryParams}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    
    // Check if the response contains an error
    if (resultData.error) {
      resultsContainer.innerHTML = `<div class="error-message">Multi-Record Check Error: ${resultData.error}</div>`;
      return;
    }

    // Use the formatter to display results
    resultsContainer.innerHTML = formatMultiRecordPropagation(resultData);
  } catch (error) {
    console.error("Multi-record propagation check error:", error);
    resultsContainer.innerHTML = `<div class="error-message">
      Failed to check multi-record propagation: ${error.message}
      <br><br>
      <div class="troubleshooting">
        <strong>Troubleshooting:</strong><br>
        • Verify the hostname is correct and accessible<br>
        • This check may take longer as it tests multiple record types<br>
        • Some DNS servers may be temporarily unavailable<br>
        • Try checking individual record types if this fails
      </div>
    </div>`;
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Function to view available DNS servers
async function viewDnsServers() {
  const resultsContainer = document.getElementById("propagationResults");
  const loadingIndicator = document.getElementById("propagationLoadingIndicator");

  // Show loading indicator
  loadingIndicator.classList.remove("hidden");
  resultsContainer.innerHTML = "";

  try {
    const response = await fetch(`${API_URL}/servers`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    
    // Check if the response contains an error
    if (resultData.error) {
      resultsContainer.innerHTML = `<div class="error-message">DNS Servers Error: ${resultData.error}</div>`;
      return;
    }

    // Use the formatter to display results
    resultsContainer.innerHTML = formatDnsServerList(resultData);
  } catch (error) {
    console.error("DNS servers list error:", error);
    resultsContainer.innerHTML = `<div class="error-message">
      Failed to retrieve DNS servers list: ${error.message}
      <br><br>
      <div class="troubleshooting">
        <strong>Troubleshooting:</strong><br>
        • Check network connectivity<br>
        • API service may be temporarily unavailable<br>
        • Try refreshing the page and attempting again
      </div>
    </div>`;
  } finally {
    loadingIndicator.classList.add("hidden");
  }
}

// Initialize DNS propagation functionality
export function initDnsPropagation() {
  // Add event listeners for buttons
  document
    .getElementById("performPropagationCheckBtn")
    .addEventListener("click", performPropagationCheck);

  document
    .getElementById("performMultiRecordCheckBtn")
    .addEventListener("click", performMultiRecordCheck);

  document
    .getElementById("viewDnsServersBtn")
    .addEventListener("click", viewDnsServers);

  // Add keypress event listeners to input fields
  const inputs = [
    document.getElementById("propagationHostInput"),
    document.getElementById("propagationTypeSelect"),
  ];

  inputs.forEach((input) => {
    input.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        performPropagationCheck(); // Default to single check on Enter
      }
    });
  });
} 