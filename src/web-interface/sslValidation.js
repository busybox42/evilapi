import { API_URL } from "./config.js";
import { toggleView } from "./main.js";
import { formatSSLValidation } from "./formatters.js";

// Function to validate SSL certificate for a given hostname
async function validateSSL(hostnameWithPort) {
  let [hostname, port] = hostnameWithPort.split(":");
  let url = `${API_URL}/validate-ssl?hostname=${encodeURIComponent(hostname)}`;
  if (port) {
    url += `&port=${encodeURIComponent(port)}`;
  }

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
  document
    .getElementById("sslValidationBtn")
    .addEventListener("click", () => toggleView("sslValidationView"));
  document
    .getElementById("validateSslBtn")
    .addEventListener("click", function () {
      const hostname = document.getElementById("hostnameInput").value.trim();
      if (hostname) {
        validateSSL(hostname);
      } else {
        document.getElementById("sslValidationResults").textContent =
          "Please enter a hostname or URL.";
      }
    });
}
