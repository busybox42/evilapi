import { API_URL } from "./config.js";
import { toggleView } from "./main.js";
import { formatSSLValidation } from "./formatters.js";

// Function to validate SSL certificate for a given hostname and port
async function validateSSL(hostname, port = 443) {
  let url = `${API_URL}/validate-ssl?hostname=${encodeURIComponent(hostname)}&port=${encodeURIComponent(port)}`;

  // Show loading message
  document.getElementById("sslValidationResults").innerHTML = `
    <div class="loading-message">
      <div class="loading-spinner"></div>
      <div class="loading-text">Validating SSL certificate for ${hostname}:${port}...</div>
    </div>
  `;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displaySslValidationResults(data);
  } catch (error) {
    console.error("SSL Validation error:", error);
    document.getElementById("sslValidationResults").innerHTML =
      `<div class="error-message">Failed to validate SSL: ${error.message}</div>`;
  }
}

// Function to display SSL validation results
function displaySslValidationResults(data) {
  const resultsDiv = document.getElementById("sslValidationResults");
  // Normalize the data structure for the formatter
  const normalizedData = {
    valid: data.valid,
    certificate: data.details || data.certificate,
    errors: data.errors || []
  };
  resultsDiv.innerHTML = formatSSLValidation(normalizedData);
}

// Initialization function for SSL Validation functionality
export function initSslValidation() {
  const hostnameInput = document.getElementById("hostnameInput");
  const portInput = document.getElementById("sslValidationPortInput");
  
  // Create warning message element for port 25
  const createPort25Warning = () => {
    const warning = document.createElement("div");
    warning.id = "sslValidationPort25Warning";
    warning.className = "port25-warning";
    warning.innerHTML = `
      <div class="warning-content">
        ⚠️ <strong>Note:</strong> Port 25 is blocked by our hosting provider for security reasons. 
        SSL validation on port 25 may fail even if the service is running. Consider using port 587 (STARTTLS) or 465 (SSL/TLS) instead.
      </div>
    `;
    return warning;
  };

  // Function to show/hide port 25 warning
  const handlePort25Warning = () => {
    const port = portInput.value;
    const existingWarning = document.getElementById("sslValidationPort25Warning");
    
    if (port === "25") {
      if (!existingWarning) {
        const warning = createPort25Warning();
        portInput.parentNode.appendChild(warning);
      }
    } else {
      if (existingWarning) {
        existingWarning.remove();
      }
    }
  };

  // Add event listener for port input changes
  portInput.addEventListener("input", handlePort25Warning);

  document
    .getElementById("sslValidationBtn")
    .addEventListener("click", () => toggleView("sslValidationView"));
  document
    .getElementById("validateSslBtn")
    .addEventListener("click", function () {
      const hostname = hostnameInput.value.trim();
      const port = portInput.value.trim() || "443";
      if (hostname) {
        validateSSL(hostname, port);
      } else {
        document.getElementById("sslValidationResults").innerHTML =
          '<div class="error-message">Please enter a hostname or IP address.</div>';
      }
    });

  // Add Enter key support for both inputs
  hostnameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("validateSslBtn").click();
  });

  portInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") document.getElementById("validateSslBtn").click();
  });
}
