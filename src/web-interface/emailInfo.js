import { API_URL } from "./config.js"; // Import the API URL from the config file

// Function to fetch email information from the API
async function fetchEmailInfo(domain) {
  const url = `${API_URL}/email-info/${domain}`;
  console.log(`Making a request to: ${url}`); // Log the request URL
  try {
    const response = await fetch(url);
    console.log(`Received response with status: ${response.status}`); // Log the response status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data); // Log the response data
    displayEmailInfo(data);
  } catch (error) {
    console.error("Fetch error:", error);
    document.getElementById("emailInfoResults").textContent =
      "Failed to retrieve data.";
  }
}

// Function to display email information
function displayEmailInfo(data) {
  const resultsDiv = document.getElementById("emailInfoResults");
  resultsDiv.innerHTML = `
    <div><strong>MX Records:</strong> ${JSON.stringify(data.mxRecords)}</div>
    <div><strong>SPF Record:</strong> ${data.spfRecord}</div>
    <div><strong>DMARC Record:</strong> ${data.dmarcRecord}</div>
    <div><strong>A Record:</strong> ${JSON.stringify(data.aRecord)}</div>
    <div><strong>Client Settings:</strong> ${JSON.stringify(
      data.clientSettings
    )}</div>
  `;
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
