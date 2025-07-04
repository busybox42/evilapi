import apiClient from "./apiClient.js";

// Function to fetch email information from the API
async function fetchEmailInfo(domain) {
  try {
    const response = await apiClient.getEmailInfo(domain);
    console.log('Email info response:', response);
    
    if (response.success) {
      displayEmailInfo(response.data);
    } else {
      document.getElementById("emailInfoResults").textContent =
        response.error?.message || "Failed to retrieve data.";
    }
  } catch (error) {
    console.error("API error:", error);
    document.getElementById("emailInfoResults").textContent =
      error.message || "Failed to retrieve data.";
  }
}

// Function to display email information
function displayEmailInfo(data) {
  const resultsDiv = document.getElementById("emailInfoResults");
  let htmlContent = "";

  if (data.mxRecords) {
    htmlContent += `<div><strong>MX Records:</strong> ${JSON.stringify(
      data.mxRecords
    )}</div>`;
  }
  if (data.spfRecord) {
    htmlContent += `<div><strong>SPF Record:</strong> ${data.spfRecord}</div>`;
  }
  if (data.dmarcRecord) {
    htmlContent += `<div><strong>DMARC Record:</strong> ${data.dmarcRecord}</div>`;
  }
  if (data.bimiRecord) {
    htmlContent += `<div><strong>BIMI Record:</strong> ${data.bimiRecord}</div>`;
  }
  if (data.aRecord) {
    htmlContent += `<div><strong>A Record:</strong> ${JSON.stringify(
      data.aRecord
    )}</div>`;
  }
  if (data.clientSettings) {
    htmlContent += `<div><strong>Client Settings:</strong> ${JSON.stringify(
      data.clientSettings
    )}</div>`;
  }

  resultsDiv.innerHTML = htmlContent;
}

// Initialization function for email info functionality
export function initEmailInfo() {
  document
    .getElementById("fetchEmailInfoBtn")
    .addEventListener("click", async function () {
      const domain = document.getElementById("domainInput").value;
      if (domain) {
        await fetchEmailInfo(domain);
      } else {
        document.getElementById("emailInfoResults").textContent =
          "Please enter a domain.";
      }
    });
}
