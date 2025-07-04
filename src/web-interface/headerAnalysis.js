import { API_URL } from "./config.js";
import { formatHeaderAnalysis } from "./formatters.js";

// Function to analyze email headers
async function analyzeEmailHeaders(headerText) {
  const url = `${API_URL}/analyze-headers`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: headerText, // Send the raw header text
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayHeaderAnalysis(data);
  } catch (error) {
    console.error("Analyze error:", error);
    document.getElementById("headerAnalysisResults").innerHTML =
      `<div class="error-message">${error.message || "Failed to analyze email headers."}</div>`;
  }
}

// Function to display email header analysis results
function displayHeaderAnalysis(data) {
  const resultsDiv = document.getElementById("headerAnalysisResults");
  resultsDiv.innerHTML = formatHeaderAnalysis(data);
}

// Initialization function for header analysis functionality
export function initHeaderAnalysis() {
  document
    .getElementById("analyzeHeaderBtn")
    .addEventListener("click", function () {
      const headerText = document.getElementById("emailHeaderInput").value;
      if (headerText) {
        analyzeEmailHeaders(headerText);
      } else {
        document.getElementById("headerAnalysisResults").textContent =
          "Please paste an email header.";
      }
    });
}
