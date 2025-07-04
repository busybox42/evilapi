import { API_URL } from "./config.js";
import { formatPortScan } from "./formatters.js";

function initPortScan() {
  const portScanBtn = document.getElementById("portScanBtn");
  const performPortScanBtn = document.getElementById("performPortScanBtn");
  const hostInput = document.getElementById("hostInput");
  const portInput = document.getElementById("portInput");
  const portScanResults = document.getElementById("portScanResults");
  const portScanLoading = document.getElementById("portScanLoading");

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
