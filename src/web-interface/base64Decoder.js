import { API_URL } from "./config.js";

async function base64Encode() {
  console.log("Encoding function called");
  var textArea = document.getElementById("base64TextArea");
  var text = textArea.value;
  var data = JSON.stringify({ text: text });

  try {
    const response = await fetch(`${API_URL}/encode`, {
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
    textArea.value = resultData.encodedText;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

async function base64Decode() {
  var textArea = document.getElementById("base64TextArea");
  var encodedText = textArea.value;
  var data = JSON.stringify({ encodedText: encodedText });

  try {
    const response = await fetch(`${API_URL}/decode`, {
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
    textArea.value = resultData.decodedText;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
}

export function initBase64Decoder() {
  document
    .getElementById("base64EncodeBtn")
    .addEventListener("click", base64Encode);
  document
    .getElementById("base64DecodeBtn")
    .addEventListener("click", base64Decode);
}
