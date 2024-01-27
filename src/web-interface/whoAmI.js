import { API_URL } from "./config.js";

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
    document.getElementById("whoAmIResults").textContent =
      "Failed to retrieve information.";
  }
}

// Function to display information from the Who Am I API
function displayWhoAmIInfo(data) {
  const resultsDiv = document.getElementById("whoAmIResults");
  resultsDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

// Initialization function for Who Am I functionality
export function initWhoAmI() {
  // Existing event listener for checkWhoAmIBtn
  document
    .getElementById("checkWhoAmIBtn")
    .addEventListener("click", function () {
      const ipAddress = document.getElementById("ipInput").value.trim();
      fetchWhoAmIInfo(ipAddress);
    });

  // Add event listener for whoAmIBtn
  document.getElementById("whoAmIBtn").addEventListener("click", function () {
    // Call fetchWhoAmIInfo without an IP address to use the client's IP
    fetchWhoAmIInfo();
  });
}
