import { API_URL } from "./config.js";
import { formatSpamScan } from "./formatters.js";

// Function to scan email content for spam
async function scanEmailForSpam(emailContent) {
  const url = `${API_URL}/scan-email`; // Ensure this matches your actual API endpoint
  const resultsDiv = document.getElementById("spamScanResults");

  // Create a FormData object and append the email content as a blob
  const formData = new FormData();
  const blob = new Blob([emailContent], { type: "text/plain" });
  formData.append("emailFile", blob, "email.eml");

  // Display a loading message
  resultsDiv.innerHTML = `<div class="loading">Loading... Please wait.</div>`;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displaySpamScanResults(data);
  } catch (error) {
    console.error("Scan error:", error);
    resultsDiv.innerHTML = `<div class="error">Error: ${error.message || "Failed to scan email for spam."}</div>`;
  }
}

// Function to display spam scan results
function displaySpamScanResults(data) {
  const resultsDiv = document.getElementById("spamScanResults");
  resultsDiv.innerHTML = formatSpamScan(data);
}

// Initialization function for spam scan functionality
export function initSpamScan() {
  document.getElementById("scanSpamBtn").addEventListener("click", function () {
    const emailContent = document.getElementById("spamScanInput").value;
    if (emailContent) {
      scanEmailForSpam(emailContent);
    } else {
      document.getElementById("spamScanResults").textContent =
        "Please paste an email content.";
    }
  });
}
