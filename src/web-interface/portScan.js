import { API_URL } from "./config.js";
import { formatPortScan } from "./formatters.js";

function initPortScan() {
  const portScanBtn = document.getElementById("portScanBtn");
  const performPortScanBtn = document.getElementById("performPortScanBtn");
  const hostInput = document.getElementById("hostInput");
  const portInput = document.getElementById("portInput");
  const portScanResults = document.getElementById("portScanResults");
  const portScanLoading = document.getElementById("portScanLoading");

  // Create warning message element for port 25
  const createPort25Warning = () => {
    const warning = document.createElement("div");
    warning.id = "port25Warning";
    warning.className = "port25-warning";
    warning.innerHTML = `
      <div class="warning-content">
        ⚠️ <strong>Note:</strong> Port 25 scanning is blocked by our hosting provider for security reasons. 
        Results may show as closed/filtered even if the service is running.
      </div>
    `;
    return warning;
  };

  // Function to show/hide port 25 warning
  const handlePort25Warning = () => {
    const port = portInput.value;
    const existingWarning = document.getElementById("port25Warning");
    
    if (port === "25") {
      if (!existingWarning) {
        const warning = createPort25Warning();
        portInput.parentNode.appendChild(warning);
      }
    } else {
      if (existingWarning) {
        existingWarning.remove();
      }
    }
  };

  const performScan = async () => {
    const host = hostInput.value;
    const port = portInput.value;

    portScanResults.innerHTML = ""; // Clear previous results
    portScanLoading.classList.remove("hidden"); // Show loading indicator

    try {
      const response = await axios.get(`${API_URL}/scan`, {
        params: { host, port },
      });

      portScanResults.innerHTML = formatPortScan(response.data);
    } catch (error) {
      portScanResults.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
    } finally {
      portScanLoading.classList.add("hidden"); // Hide loading indicator
    }
  };

  performPortScanBtn.addEventListener("click", performScan);

  // Event listener for port input changes to show/hide warning
  portInput.addEventListener("input", handlePort25Warning);

  // Event listener for the Enter key in the host input
  hostInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      performScan();
    }
  });

  // Event listener for the Enter key in the port input
  portInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      performScan();
    }
  });
}

export { initPortScan };
