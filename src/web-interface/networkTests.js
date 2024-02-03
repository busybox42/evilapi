import { API_URL } from "./config.js";

async function performNetworkTest(apiEndpoint) {
  const domain = document.getElementById("networkDomainInput").value.trim();
  if (!domain) {
    alert("Please enter a domain.");
    return;
  }
  const url = `${API_URL}/${apiEndpoint}/${encodeURIComponent(domain)}`;
  const resultsElement = document.getElementById("networkResults");
  resultsElement.textContent = "Loading...";

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.success) {
      resultsElement.textContent = data.result;
    } else {
      throw new Error("Failed to retrieve network data.");
    }
  } catch (error) {
    console.error("Network test error:", error);
    resultsElement.textContent = "Error: " + error.message;
  }
}

export function initNetworkTests() {
  document
    .getElementById("pingBtn")
    .addEventListener("click", () => performNetworkTest("ping"));
  document
    .getElementById("tracerouteBtn")
    .addEventListener("click", () => performNetworkTest("traceroute"));
}
