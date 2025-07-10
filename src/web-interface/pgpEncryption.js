import { API_URL } from "./config.js";

export function initPgpEncryption() {
  const encryptButton = document.getElementById("encrypt-btn");
  const decryptButton = document.getElementById("decrypt-btn");
  const generateTempKeyButton = document.getElementById(
    "generate-temp-key-btn"
  );
  const messageInput = document.getElementById("message-input");
  const fileInput = document.getElementById("file-input");
  const outputArea = document.getElementById("output");
  const keySelect = document.getElementById("key-select");

  function showLoading(message) {
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "loading-overlay";
    loadingDiv.innerHTML = `
            <div class="loading-modal">
                <p>${message}... Please wait.</p>
                <div class="loading-spinner"></div>
            </div>`;
    document.body.appendChild(loadingDiv);
  }

  function hideLoading() {
    const loadingDiv = document.getElementById("loading-overlay");
    if (loadingDiv) {
      document.body.removeChild(loadingDiv);
    }
  }

  encryptButton.addEventListener("click", () => handlePgpOperation("encrypt"));
  decryptButton.addEventListener("click", () => handlePgpOperation("decrypt"));
  generateTempKeyButton.addEventListener("click", generateTempKey);

  keySelect.addEventListener("change", handleKeySelectionChange);

  function handleKeySelectionChange() {
    if (keySelect.value === "custom") {
      const customKeyName = prompt("Enter the name of the custom key:");
      if (customKeyName) {
        keySelect.dataset.customKeyName = customKeyName;
      } else {
        keySelect.value = "General";
      }
    }
  }

  async function handlePgpOperation(operation) {
    const isFile = fileInput.files.length > 0;
    const keyType = keySelect.value;
    let customKeyName = "";

    if (keyType === "custom") {
      customKeyName = keySelect.dataset.customKeyName;
      if (!customKeyName) {
        alert("Custom key name is required.");
        return;
      }
    }

    showLoading(`${operation.charAt(0).toUpperCase() + operation.slice(1)}ing`);

    try {
      const endpoint = isFile ? `${operation}-file` : operation;
      let response;

      if (isFile) {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        formData.append("keyType", keyType);
        if (customKeyName) {
          formData.append("customKeyName", customKeyName);
        }
        response = await axios.post(`${API_URL}/${endpoint}`, formData, {
          responseType: "blob",
        });
      } else {
        const data = { message: messageInput.value, keyType };
        if (customKeyName) {
          data.customKeyName = customKeyName;
        }
        response = await axios.post(`${API_URL}/${endpoint}`, data, {
          responseType: "json",
        });
      }

      hideLoading();

      if (response.status !== 200) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      if (isFile) {
        const originalFileName = fileInput.files[0].name;
        let downloadFileName = "";

        if (operation === "encrypt") {
          downloadFileName = originalFileName + ".pgp";
        } else if (
          operation === "decrypt" &&
          originalFileName.endsWith(".pgp")
        ) {
          downloadFileName = originalFileName.slice(0, -4);
        } else {
          downloadFileName = originalFileName;
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", downloadFileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        outputArea.value = "File processed successfully.";
      } else {
        outputArea.value = response.data.result;
      }
    } catch (error) {
      hideLoading();
      console.error("Error:", error);
      alert("An error occurred while processing your request.");
    }
  }

  async function generateTempKey() {
    const name = prompt("Enter name for the temporary key:");
    if (!name) {
      alert("Please provide a name for the temporary key.");
      return;
    }

    const email = `${name}@example.com`;
    const password = generateRandomPassword(24);

    try {
      showLoading("Generating Key");
      const response = await axios.post(
        `${API_URL}/generate-temp-key`,
        { name, email, password },
        { responseType: "json" }
      );

      hideLoading();

      if (response.status === 409) {
        alert("Error: A key with this name already exists.");
        return;
      }

      if (response.status !== 200) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const expirationTime = new Date(new Date().getTime() + 60 * 60 * 1000);
      alert(
        `Temporary key ${name} generated successfully. It will expire ${expirationTime.toLocaleString()}`
      );
    } catch (error) {
      hideLoading();
      console.error("Error in generating temporary key:", error);
      alert("An error occurred while generating the temporary key.");
    }
  }

  function generateRandomPassword(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  }
}
