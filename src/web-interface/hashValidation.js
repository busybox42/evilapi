import { API_URL } from "./config.js";
import { formatHashResult } from "./formatters.js";

async function validateHash() {
  const algorithmSelect = document.getElementById("algorithmInput");
  const passwordInput = document.getElementById("passwordInput");
  const hashInput = document.getElementById("hashInput");
  const resultsDiv = document.getElementById("hashValidationResults");

  const payload = JSON.stringify({
    algorithm: algorithmSelect.value,
    password: passwordInput.value,
    hash: hashInput.value,
  });

  try {
    const response = await fetch(`${API_URL}/validate-hash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    resultsDiv.innerHTML = formatHashResult(resultData, true); // true = validation mode
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    resultsDiv.innerHTML = `<div class="error-message">Error validating hash: ${error.message}</div>`;
  }
}

async function createHash() {
  const algorithmSelect = document.getElementById("createAlgorithmInput");
  const textInput = document.getElementById("textInput");
  const resultsDiv = document.getElementById("hashCreationResults");

  const payload = JSON.stringify({
    algorithm: algorithmSelect.value,
    text: textInput.value,
  });

  try {
    const response = await fetch(`${API_URL}/create-hash`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    resultsDiv.innerHTML = formatHashResult(resultData, false); // false = creation mode
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    resultsDiv.innerHTML = `<div class="error-message">Error creating hash: ${error.message}</div>`;
  }
}

export function initHashValidation() {
  document
    .getElementById("performHashValidationBtn")
    .addEventListener("click", validateHash);
  document
    .getElementById("performHashCreationBtn")
    .addEventListener("click", createHash);
}
