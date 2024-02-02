import { API_URL } from "./config.js";

async function validateDmarc() {
  const domainInput = document.getElementById("dmarcDomainInput");
  const domain = domainInput.value.trim();
  if (!domain) {
    alert("Please enter a domain.");
    return; // Prevent the function from proceeding further
  }
  const url = `${API_URL}/validate-dmarc?domain=${encodeURIComponent(domain)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    displayDmarcResults(data);
  } catch (error) {
    console.error("There was a problem with your fetch operation:", error);
    // Optionally update your UI to show the error
  }
}

function displayDmarcResults(data) {
  const resultsElement = document.getElementById("dmarcResults");
  resultsElement.innerHTML = `<h3>DMARC Record for ${data.dmarc}</h3>
                              <p><strong>Record:</strong> ${data.record}</p>
                              <div><strong>Report:</strong> ${renderReport(
                                data.report
                              )}</div>
                              <div><strong>Tests:</strong> ${renderTests(
                                data.tests
                              )}</div>`;

  function renderReport(reports) {
    return reports
      .map(
        (report) => `<div>
                                      <p><strong>${report.Name}:</strong> ${report.TagValue}</p>
                                      <p>${report.Description}</p>
                                    </div>`
      )
      .join("");
  }

  function renderTests(tests) {
    return tests
      .map(
        (test) => `<div>
                                  <p><strong>${test.Test}:</strong> ${test.Result}</p>
                                  <p>${test.Description}</p>
                                </div>`
      )
      .join("");
  }
}

export function initValidateDmarc() {
  document
    .getElementById("fetchDmarcBtn")
    .addEventListener("click", validateDmarc); // Corrected button ID
}
