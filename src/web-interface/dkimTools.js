import { API_URL } from "./config.js";

async function validateDkim() {
  const domain = document.getElementById("dkimDomainInput").value.trim();
  const selector = document.getElementById("dkimSelectorInput").value.trim();
  if (!domain || !selector) {
    alert("Please enter both domain and selector.");
    return;
  }
  const url = `${API_URL}/lookup-dkim?domain=${encodeURIComponent(
    domain
  )}&selector=${encodeURIComponent(selector)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      displayDkimResults(`${data.message}`, data.records.join("\n"));
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("DKIM validation error:", error);
    displayDkimResults("Validation Error", error.toString());
  }
}

async function generateDkim() {
  const domain = document.getElementById("dkimDomainInput").value.trim();
  const selector = document.getElementById("dkimSelectorInput").value.trim();
  if (!domain || !selector) {
    alert("Please enter both domain and selector.");
    return;
  }
  const url = `${API_URL}/generate-dkim-keys?domain=${encodeURIComponent(
    domain
  )}&selector=${encodeURIComponent(selector)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (response.ok) {
      displayDkimResults(
        `DKIM Record:\n ${data.dkimRecord}\n\n`,
        `Private Key:\n ${data.privateKey}`
      );
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("DKIM generation error:", error);
    displayDkimResults("Generation Error", error.toString());
  }
}

function displayDkimResults(title, message) {
  const resultsElement = document.getElementById("dkimResults");
  // Include the title within the `pre` tag to apply the same styling
  resultsElement.innerHTML = `<pre class="dkim-results"><strong>${title}</strong>\n${message}</pre>`;
}

export function initDkimTools() {
  document
    .getElementById("validateDkimBtn")
    .addEventListener("click", validateDkim);
  document
    .getElementById("generateDkimBtn")
    .addEventListener("click", generateDkim);
}
