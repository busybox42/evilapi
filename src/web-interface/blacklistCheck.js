import { API_URL } from "./config.js";

// Function to fetch email blacklist information
async function fetchBlacklistInfo(domain) {
  const url = `${API_URL}/blacklist-check/${domain}`;
  const loadingIndicator = document.getElementById("blacklistCheckLoading");
  const resultsDiv = document.getElementById("blacklistCheckResults");

  loadingIndicator.classList.remove("hidden"); // Show loading indicator
  resultsDiv.classList.add("hidden"); // Hide results while loading

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displayBlacklistInfo(data);
  } catch (error) {
    console.error("Fetch error:", error);
    resultsDiv.textContent = "Failed to retrieve blacklist data.";
  } finally {
    loadingIndicator.classList.add("hidden"); // Hide loading indicator
    resultsDiv.classList.remove("hidden"); // Show results
  }
}

// Function to display email blacklist information
function displayBlacklistInfo(data) {
  const resultsDiv = document.getElementById("blacklistCheckResults");
  resultsDiv.innerHTML = `
    <div><strong>Domain Checked:</strong> ${data.identifier}</div>
    <div><strong>IP Address:</strong> ${data.ip}</div>
    <div><strong>Blacklist Results:</strong> <pre>${JSON.stringify(
      data.blacklistResults,
      null,
      2
    )}</pre></div>
  `;
}

// Initialization function for blacklist check functionality
export function initBlacklistCheck() {
  document
    .getElementById("performBlacklistCheckBtn")
    .addEventListener("click", function () {
      const domain = document.getElementById("blacklistDomainInput").value;
      if (domain) {
        fetchBlacklistInfo(domain);
      } else {
        document.getElementById("blacklistCheckResults").textContent =
          "Please enter a domain.";
      }
    });
}
