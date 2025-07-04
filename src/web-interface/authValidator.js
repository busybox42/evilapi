import { API_URL } from "./config.js";
import { formatAuthResult } from "./formatters.js";

function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById("authLoadingIndicator");
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
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();

    // Include username, protocol, and hostname in the response data for display
    resultData.username = username;
    resultData.protocol = protocol;
    resultData.hostname = hostname;

    return resultData;
  } catch (error) {
    console.error("Authentication error:", error);
    return { 
      success: false, 
      message: error.message || "Error occurred during authentication",
      protocol: protocol,
      hostname: hostname
    };
  } finally {
    showLoadingIndicator(false);
  }
}

export function initAuthValidator() {
  // Add an event listener to the auth button to trigger authentication
  const authButton = document.getElementById("performAuthBtn");
  authButton.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent form submission
    const resultData = await authenticateProtocol(); // Call the function and get the result
    updateUI(resultData); // Update the UI with the result
  });

  // Add Enter key support for form inputs
  const form = document.getElementById("authForm");
  form.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      authButton.click();
    }
  });
}

function updateUI(data) {
  console.log(data);
  const messageElement = document.getElementById("authResults");
  messageElement.innerHTML = formatAuthResult(data);
}
