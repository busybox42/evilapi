import apiClient from "./apiClient.js";
import { formatEmailInfo } from "./formatters.js";

// Function to fetch email information from the API
async function fetchEmailInfo(domain) {
  try {
    const response = await apiClient.getEmailInfo(domain);
    console.log('Email info response:', response);
    
    if (response.success) {
      displayEmailInfo(response.data);
    } else {
      document.getElementById("emailInfoResults").innerHTML =
        `<div class="error-message">${response.error?.message || "Failed to retrieve data."}</div>`;
    }
  } catch (error) {
    console.error("API error:", error);
    document.getElementById("emailInfoResults").innerHTML =
      `<div class="error-message">${error.message || "Failed to retrieve data."}</div>`;
  }
}

// Function to display email information
function displayEmailInfo(data) {
  const resultsDiv = document.getElementById("emailInfoResults");
  resultsDiv.innerHTML = formatEmailInfo(data);
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
