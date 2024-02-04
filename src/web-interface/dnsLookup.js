import { API_URL } from "./config.js";

async function performDnsLookup() {
  const hostInput = document.getElementById("dnsHostInput");
  const typeSelect = document.getElementById("dnsTypeSelect");
  const dnsServerInput = document.getElementById("dnsServerInput");
  const resultsContainer = document.getElementById("dnsLookupResults");

  const host = hostInput.value;
  const type = typeSelect.value;
  const dnsServer = dnsServerInput.value;

  try {
    const queryParams = new URLSearchParams({ host, type });
    if (dnsServer) queryParams.append("dnsServer", dnsServer);

    const response = await fetch(`${API_URL}/lookup?${queryParams}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    // Wrap the JSON string in a <pre> tag to apply existing styles
    resultsContainer.innerHTML = `<pre>${JSON.stringify(
      resultData,
      null,
      2
    )}</pre>`;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    resultsContainer.innerHTML = `<p style="color: red;">Failed to perform DNS lookup.</p>`;
  }
}

export function initDnsLookup() {
  // Existing setup for click event
  document
    .getElementById("performDnsLookupBtn")
    .addEventListener("click", performDnsLookup);

  // Add keypress event listeners to input fields
  const inputs = [
    document.getElementById("dnsHostInput"),
    document.getElementById("dnsTypeSelect"),
    document.getElementById("dnsServerInput"),
  ];

  inputs.forEach((input) => {
    input.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent the default action to stop form submission if applicable
        performDnsLookup(); // Trigger DNS lookup when Enter is pressed
      }
    });
  });
}
