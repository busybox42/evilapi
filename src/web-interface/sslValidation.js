import { API_URL } from "./config.js";
import { toggleView } from "./main.js";

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
    document.getElementById("sslValidationResults").textContent =
      "Failed to validate SSL.";
  }
}

// Function to display SSL validation results
function displaySslValidationResults(data) {
  const resultsDiv = document.getElementById("sslValidationResults");
  if (data.valid) {
    let htmlContent = `
      <div><strong>SSL Certificate is Valid:</strong> Yes</div>
      <div><strong>Subject:</strong> ${JSON.stringify(
        data.details.subject
      )}</div>
      <div><strong>Issuer:</strong> ${JSON.stringify(data.details.issuer)}</div>
      <div><strong>Valid From:</strong> ${data.details.validFrom}</div>
      <div><strong>Valid To:</strong> ${data.details.validTo}</div>
      <div><strong>Serial Number:</strong> ${data.details.serialNumber}</div>
    `;

    // Add alternative hostnames if they exist
    if (
      data.details.alternativeHostnames &&
      data.details.alternativeHostnames.length > 0
    ) {
      htmlContent += `<div><strong>Alternative Hostnames:</strong> ${data.details.alternativeHostnames.join(
        ", "
      )}</div>`;
    }

    resultsDiv.innerHTML = htmlContent;
  } else {
    resultsDiv.textContent = "SSL Certificate is not valid.";
  }
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
