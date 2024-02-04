import { API_URL } from "./config.js"; // Import API_URL from your config

document.addEventListener("DOMContentLoaded", function () {
  // Function to add browser's timezone option to a dropdown
  function addBrowserTimezoneOption(dropdownId) {
    const timeZoneSelect = document.getElementById(dropdownId);
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const option = document.createElement("option");
    option.value = browserTimeZone;
    option.text = `${browserTimeZone} (Local Timezone)`;
    timeZoneSelect.appendChild(option);

    // Automatically select the browser's timezone
    timeZoneSelect.value = browserTimeZone;
  }

  // Add browser's timezone option to both dropdowns
  addBrowserTimezoneOption("timeZoneSelectToEpoch");
  addBrowserTimezoneOption("timeZoneSelectFromDate");
});

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0"); // JS months are zero-indexed.
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function initTimeTools() {
  // Elements for converting to epoch time
  const dateToEpochBtn = document.getElementById("dateToEpochBtn");
  const dateInput = document.getElementById("dateInput");
  const epochResultDiv = document.getElementById("epochResult");

  // Elements for converting from epoch time
  const epochToDateBtn = document.getElementById("epochToDateBtn");
  const epochInput = document.getElementById("epochInput");
  const dateResultDiv = document.getElementById("dateResult");

  dateInput.value = getCurrentDateTime();
  epochInput.value = Date.now();

  // Convert to epoch time event listener
  dateToEpochBtn.addEventListener("click", async () => {
    const dateStr = dateInput.value;
    const timeZone = timeZoneSelectToEpoch.value;
    try {
      const response = await axios.get(
        `${API_URL}/convert-to-epoch?dateStr=${encodeURIComponent(
          dateStr
        )}&timeZone=${encodeURIComponent(timeZone)}`
      );
      epochResultDiv.innerText = `Epoch Time: ${response.data.epochTime}`;
    } catch (error) {
      console.error("Error converting to epoch:", error);
      epochResultDiv.innerText =
        "Error converting to epoch. See console for details.";
    }
  });

  // Convert from epoch time event listener
  epochToDateBtn.addEventListener("click", async () => {
    const epochTime = epochInput.value;
    const timeZone = timeZoneSelectFromDate.value;
    try {
      const response = await axios.get(
        `${API_URL}/convert-to-date?epochTime=${encodeURIComponent(
          epochTime
        )}&timeZone=${encodeURIComponent(timeZone)}`
      );
      dateResultDiv.innerText = `Human-readable Date: ${response.data.dateStr}`;
    } catch (error) {
      console.error("Error converting from epoch:", error);
      dateResultDiv.innerText =
        "Error converting from epoch. See console for details.";
    }
  });
}
