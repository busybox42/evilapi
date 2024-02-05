import { API_URL } from "./config.js";

async function urlEncode() {
  var textArea = document.getElementById("urlTextArea");
  var text = textArea.value;
  var data = JSON.stringify({ toEncode: text });

  try {
    const response = await fetch(`${API_URL}/url-encode`, {
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
    textArea.value = resultData.encodedString;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function urlDecode() {
  var textArea = document.getElementById("urlTextArea");
  var text = textArea.value;
  var data = JSON.stringify({ toDecode: text });

  try {
    const response = await fetch(`${API_URL}/url-decode`, {
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
    textArea.value = resultData.decodedString;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

export function initUrlEncoder() {
  document.getElementById("urlEncodeBtn").addEventListener("click", urlEncode);
  document.getElementById("urlDecodeBtn").addEventListener("click", urlDecode);
}
