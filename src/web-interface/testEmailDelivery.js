import { API_URL } from "./config.js";

// Function to show or hide the loading indicator
function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (show) {
    loadingIndicator.classList.remove("hidden");
  } else {
    loadingIndicator.classList.add("hidden");
  }
}

// Function to display the results of the email delivery test
function displayResults(data) {
  const resultDiv = document.getElementById("emailTestResults");
  if (data.success) {
    resultDiv.innerHTML = `Success: ${data.message}<br>Latency: ${
      data.latency
    }<br>From: ${data.details?.from ?? "N/A"}<br>Subject: ${
      data.details?.subject ?? "N/A"
    }<br>Date: ${data.details?.date ?? "N/A"}`;
  } else {
    resultDiv.innerHTML = `Failed to test email delivery. Error: ${data.message}`;
  }
}

// Main function to perform the email delivery test
async function testEmailDelivery() {
  showLoadingIndicator(true);

  const smtpConfig = {
    from: document.getElementById("smtpFrom").value,
    to: document.getElementById("smtpTo").value,
    host: document.getElementById("smtpHost").value,
    port: parseInt(document.getElementById("smtpPort").value, 10),
    user: document.getElementById("smtpUser").value,
    password: document.getElementById("smtpPassword").value,
  };

  const imapConfig = {
    user: document.getElementById("imapUser").value,
    password: document.getElementById("imapPassword").value,
    host: document.getElementById("imapHost").value,
    port: parseInt(document.getElementById("imapPort").value, 10),
    tls: document.getElementById("imapTls").checked,
    authTimeout: 3000,
  };

  // Retrieve the timeout value from the input field or default to 60 seconds
  const timeoutInput = document.getElementById("timeoutInput");
  const timeoutSeconds = timeoutInput ? parseInt(timeoutInput.value, 10) : 60;
  const timeoutMilliseconds = timeoutSeconds * 1000; // Convert to milliseconds

  try {
    const response = await fetch(`${API_URL}/test-email-delivery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        smtpConfig,
        imapConfig,
        timeout: timeoutMilliseconds,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    displayResults(resultData);
  } catch (error) {
    console.error("Failed to test email delivery:", error);
    displayResults({
      success: false,
      message: error.message || "Error occurred",
    });
  } finally {
    showLoadingIndicator(false);
  }
}

// Initialization function to set up event listeners
export function initTestEmailDelivery() {
  document
    .getElementById("performTestEmailDeliveryBtn")
    .addEventListener("click", testEmailDelivery);
}
