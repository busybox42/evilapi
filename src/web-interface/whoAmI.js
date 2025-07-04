import { API_URL } from "./config.js";
import { formatWhoAmIResult } from "./formatters.js";

// Function to fetch information about the client or a given IP/hostname
async function fetchWhoAmIInfo(ipAddress) {
  let url = `${API_URL}/whoami`;
  if (ipAddress) {
    url += `?ip=${encodeURIComponent(ipAddress)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displayWhoAmIInfo(data);
  } catch (error) {
    console.error("Who Am I error:", error);
    document.getElementById("whoAmIResults").innerHTML =
      `<div class="error-message">Failed to retrieve information: ${error.message}</div>`;
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
  document
    .getElementById("checkWhoAmIBtn")
    .addEventListener("click", function () {
      const ipAddress = document.getElementById("ipInput").value.trim();
      fetchWhoAmIInfo(ipAddress);
    });

  // Call fetchAndDisplayUserIp to set the user's IP in the input field on load
  fetchAndDisplayUserIp();
}
