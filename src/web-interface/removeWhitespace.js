import { API_URL } from "./config.js";

async function removeSpaces() {
  var textArea = document.getElementById("textArea");
  var text = textArea.value;
  var data = JSON.stringify({ text: text });

  try {
    const response = await fetch(`${API_URL}/remove-whitespace`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    textArea.value = resultData.result;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

function copyToClipboard() {
  var textArea = document.getElementById("textArea");
  textArea.select();
  textArea.setSelectionRange(0, 99999);
  document.execCommand("copy");
}

export function initRemoveWhitespace() {
  document
    .getElementById("removeSpacesBtn")
    .addEventListener("click", removeSpaces);
  document
    .getElementById("copyToClipboardBtn")
    .addEventListener("click", copyToClipboard);
}
