import { API_URL } from "./config.js"; // Importing the API URL from the config file

// Function to handle the SMTP test
async function testSMTP(serverAddress, port) {
  const url = `${API_URL}/test-smtp`;
  const requestBody = {
    serverAddress: serverAddress,
    port: port,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displaySMTPTestResults(data);
  } catch (error) {
    console.error("SMTP Test error:", error);
    document.getElementById("smtpTestResults").textContent =
      "Failed to perform SMTP test.";
  }
}

// Function to display SMTP test results
function displaySMTPTestResults(data) {
  const resultsDiv = document.getElementById("smtpTestResults");
  resultsDiv.innerHTML = `
    <div><strong>Connection Status:</strong> ${data.connection}</div>
    <div><strong>Transaction Time:</strong> ${data.transactionTimeMs} ms</div>
    <div><strong>Reverse DNS Mismatch:</strong> ${data.reverseDnsMismatch}</div>
    <div><strong>TLS Support:</strong> ${data.tlsSupport}</div>
    <div><strong>Open Relay Status:</strong> ${data.openRelay}</div>
    <div><strong>SMTP Auth Support:</strong> ${data.smtpAuthSupport}</div>
  `;
}

// Initialization function for SMTP test functionality
export function initSmtpTest() {
  document
    .getElementById("performSmtpTestBtn")
    .addEventListener("click", async function () {
      const serverAddress = document.getElementById("smtpServerInput").value;
      let port = document.getElementById("smtpPortInput").value;

      // Use default port 587 if no port is specified
      if (!port) {
        port = 587;
      }

      if (serverAddress) {
        await testSMTP(serverAddress, port);
      } else {
        document.getElementById("smtpTestResults").textContent =
          "Please enter the server address.";
      }
    });
}
