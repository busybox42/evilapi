import { API_URL } from "./config.js";

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
    document.getElementById("headerAnalysisResults").textContent =
      error.message || "Failed to analyze email headers.";
  }
}

// Function to display email header analysis results
function displayHeaderAnalysis(data) {
  const resultsDiv = document.getElementById("headerAnalysisResults");
  resultsDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
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
