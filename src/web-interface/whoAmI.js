import { API_URL } from "./config.js";
import { formatWhoAmIResult } from "./formatters.js";

// Function to show or hide the loading indicator
function showLoadingIndicator(show) {
  const loadingIndicator = document.getElementById("whoAmILoadingIndicator");
  if (loadingIndicator) {
    if (show) {
      loadingIndicator.classList.remove("hidden");
    } else {
      loadingIndicator.classList.add("hidden");
    }
  }
}

// Function to fetch information about the client or a given IP/hostname
async function fetchWhoAmIInfo(ipAddress) {
  showLoadingIndicator(true);
  let url = `${API_URL}/whoami`;
  if (ipAddress) {
    url += `?ip=${encodeURIComponent(ipAddress)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displayWhoAmIInfo(data);
  } catch (error) {
    console.error("Who Am I error:", error);
    displayWhoAmIInfo({ 
      error: true, 
      message: error.message || "Failed to retrieve information",
      requestedIp: ipAddress || "auto-detect"
    });
  } finally {
    showLoadingIndicator(false);
  }
}

// Function to display information from the Who Am I API
function displayWhoAmIInfo(data) {
  const resultsDiv = document.getElementById("whoAmIResults");
  resultsDiv.innerHTML = formatWhoAmIResult(data);
}

// Function to fetch and display the user's IP address
async function fetchAndDisplayUserIp() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const { ip } = await response.json();
    document.getElementById("ipInput").value = ip; // Set the user's IP as default
  } catch (error) {
    console.error("Could not fetch the user's IP address:", error);
  }
}

// Initialization function for Who Am I functionality
export function initWhoAmI() {
  const button = document.getElementById("checkWhoAmIBtn");
  const input = document.getElementById("ipInput");

  button.addEventListener("click", function () {
    const ipAddress = input.value.trim();
    fetchWhoAmIInfo(ipAddress);
  });

  // Add Enter key support
  input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      button.click();
    }
  });

  // Call fetchAndDisplayUserIp to set the user's IP in the input field on load
  fetchAndDisplayUserIp();
}
