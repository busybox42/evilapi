import { API_URL } from "./config.js";
import { formatAuthResult } from "./formatters.js";

function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById("loadingIndicator");
  if (show) {
    loadingIndicator.classList.remove("hidden");
  } else {
    loadingIndicator.classList.add("hidden");
  }
}

async function authenticateProtocol() {
  showLoadingIndicator(true);
  const form = document.getElementById("authForm");
  const username = form.elements.authUsername.value;
  const password = form.elements.authPassword.value;
  const hostname = form.elements.authHostname.value;
  const protocol = form.elements.authProtocol.value;

  const requestData = {
    username,
    password,
    hostname,
    protocol,
  };

  try {
    const response = await fetch(`${API_URL}/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add this line if your API requires a token or API key
        Authorization: "Bearer YOUR_API_KEY",
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();

    // Include username, protocol, and hostname in the response data
    resultData.username = username;
    resultData.protocol = protocol;
    resultData.hostname = hostname;

    return resultData; // Return the result data with additional information
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    return { success: false, message: "Error occurred during authentication" };
  } finally {
    showLoadingIndicator(false);
  }
}

export function initAuthValidator() {
  // Add an event listener to the form submit button to trigger authentication
  const form = document.getElementById("authForm");
  form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form submission
    const resultData = await authenticateProtocol(); // Call the function and get the result
    updateUI(resultData); // Update the UI with the result
  });
}

function updateUI(data) {
  console.log(data);
  const messageElement = document.getElementById("authResults");
  messageElement.innerHTML = formatAuthResult(data);
}
