import { API_URL } from "./config.js";

let realTimeInterval = null;

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

  // Start real-time clock
  startRealTimeClock();
});

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getDetailedTimeInfo(epochTimeSeconds, timezone) {
  const epochMs = epochTimeSeconds * 1000;
  const date = new Date(epochMs);
  const currentEpoch = Math.floor(Date.now() / 1000);
  const diffSeconds = Math.abs(currentEpoch - epochTimeSeconds);
  
  // Calculate detailed relative time
  const years = Math.floor(diffSeconds / (365.25 * 24 * 3600));
  const months = Math.floor((diffSeconds % (365.25 * 24 * 3600)) / (30.44 * 24 * 3600));
  const days = Math.floor((diffSeconds % (30.44 * 24 * 3600)) / (24 * 3600));
  const hours = Math.floor((diffSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  
  let relativeTime = [];
  if (years > 0) relativeTime.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) relativeTime.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days > 0) relativeTime.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) relativeTime.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) relativeTime.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0 && relativeTime.length < 2) relativeTime.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  
  const isPast = epochTimeSeconds < currentEpoch;
  const relativeTimeStr = relativeTime.slice(0, 2).join(', ') + (isPast ? ' ago' : ' from now');
  
  // Get day info
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Calculate day of year
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
  
  // Calculate week number
  const startOfWeek = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date - startOfWeek) / 86400000 + startOfWeek.getDay() + 1) / 7);
  
  // Calculate quarter
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  
  return {
    epochMs,
    epochSeconds: epochTimeSeconds,
    localTime: date.toLocaleString('en-US', { timeZone: timezone }),
    isoString: date.toISOString(),
    utcString: date.toUTCString(),
    unixSeconds: epochTimeSeconds,
    unixMilliseconds: epochMs,
    relativeTime: relativeTimeStr,
    isPast,
    dayOfWeek: dayNames[date.getDay()],
    dayOfMonth: date.getDate(),
    dayOfYear,
    weekNumber,
    month: monthNames[date.getMonth()],
    monthNumber: date.getMonth() + 1,
    quarter,
    year: date.getFullYear(),
    timezone,
    
    // Different format options
    formats: {
      iso: date.toISOString(),
      rfc2822: date.toString(),
      sql: date.toISOString().slice(0, 19).replace('T', ' '),
      human: date.toLocaleDateString('en-US', { 
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      short: date.toLocaleDateString('en-US', { timeZone: timezone }),
      time24: date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: false }),
      time12: date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: true })
    }
  };
}

function formatTimeResult(epochTime, dateStr, timezone) {
  const epochTimeInSeconds = parseInt(epochTime);
  const timeInfo = getDetailedTimeInfo(epochTimeInSeconds, timezone);
  
  // Multiple timezone display
  const commonTimezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];
  
  let timezoneComparisons = '';
  if (timezone !== 'UTC') {
    timezoneComparisons = commonTimezones
      .filter(tz => tz !== timezone)
      .slice(0, 3)
      .map(tz => {
        const localTime = new Date(timeInfo.epochMs).toLocaleString('en-US', { 
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        return `
          <div class="timezone-comparison">
            <span class="tz-name">${tz}:</span>
            <span class="tz-time">${localTime}</span>
          </div>
        `;
      }).join('');
  }

  return `
    <div class="time-result-container enhanced">
      <!-- Main Time Display -->
      <div class="time-section primary-section">
        <h3 class="section-header">🕐 Primary Time Information</h3>
        <div class="time-grid">
          <div class="time-value-section">
            <label class="time-label">📅 Human-Readable Date:</label>
            <div class="time-value-container">
              <span class="time-value selectable large">${timeInfo.formats.human}</span>
              <button class="copy-btn" onclick="copyToClipboard('${timeInfo.formats.human}')">📋</button>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">⏰ Unix Timestamp (seconds):</label>
            <div class="time-value-container">
              <span class="time-value selectable large">${timeInfo.unixSeconds}</span>
              <button class="copy-btn" onclick="copyToClipboard('${timeInfo.unixSeconds}')">📋</button>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">⏳ Relative Time:</label>
            <div class="time-value-container">
              <span class="time-value ${timeInfo.isPast ? 'time-past' : 'time-future'}">${timeInfo.relativeTime}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Information -->
      <div class="time-section">
        <h3 class="section-header">📊 Detailed Information</h3>
        <div class="time-grid compact">
          <div class="time-value-section">
            <label class="time-label">📍 Timezone:</label>
            <div class="time-value-container">
              <span class="time-value">${timezone}</span>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">📅 Day of Week:</label>
            <div class="time-value-container">
              <span class="time-value">${timeInfo.dayOfWeek}</span>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">📊 Day of Year:</label>
            <div class="time-value-container">
              <span class="time-value">${timeInfo.dayOfYear} of 365</span>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">📈 Week Number:</label>
            <div class="time-value-container">
              <span class="time-value">Week ${timeInfo.weekNumber}</span>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">🗓️ Quarter:</label>
            <div class="time-value-container">
              <span class="time-value">Q${timeInfo.quarter} ${timeInfo.year}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Multiple Formats -->
      <div class="time-section">
        <h3 class="section-header">🔄 Multiple Formats</h3>
        <div class="time-grid compact">
          <div class="time-value-section">
            <label class="time-label">🌐 ISO 8601:</label>
            <div class="time-value-container">
              <span class="time-value selectable monospace">${timeInfo.formats.iso}</span>
              <button class="copy-btn" onclick="copyToClipboard('${timeInfo.formats.iso}')">📋</button>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">📧 RFC 2822:</label>
            <div class="time-value-container">
              <span class="time-value selectable monospace">${timeInfo.formats.rfc2822}</span>
              <button class="copy-btn" onclick="copyToClipboard('${timeInfo.formats.rfc2822}')">📋</button>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">🗄️ SQL Format:</label>
            <div class="time-value-container">
              <span class="time-value selectable monospace">${timeInfo.formats.sql}</span>
              <button class="copy-btn" onclick="copyToClipboard('${timeInfo.formats.sql}')">📋</button>
            </div>
          </div>
          <div class="time-value-section">
            <label class="time-label">⏰ Unix Milliseconds:</label>
            <div class="time-value-container">
              <span class="time-value selectable monospace">${timeInfo.unixMilliseconds}</span>
              <button class="copy-btn" onclick="copyToClipboard('${timeInfo.unixMilliseconds}')">📋</button>
            </div>
          </div>
        </div>
      </div>

      ${timezoneComparisons ? `
      <!-- Timezone Comparisons -->
      <div class="time-section">
        <h3 class="section-header">🌍 Other Timezones</h3>
        <div class="timezone-grid">
          ${timezoneComparisons}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function formatEpochResult(epochTime, inputDate, timezone) {
  const epochTimeInSeconds = Math.floor(epochTime / 1000);
  return formatTimeResult(epochTimeInSeconds, inputDate, timezone);
}

function startRealTimeClock() {
  const clockElement = document.getElementById("realTimeClock");
  if (!clockElement) return;

  function updateClock() {
    const now = new Date();
    const currentEpoch = Math.floor(now.getTime() / 1000);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    clockElement.innerHTML = `
      <div class="real-time-display">
        <div class="clock-section">
          <label class="clock-label">🕐 Current Time:</label>
          <div class="clock-value">${now.toLocaleString()}</div>
        </div>
        <div class="clock-section">
          <label class="clock-label">⏰ Current Epoch:</label>
          <div class="clock-value-container">
            <span class="clock-value selectable">${currentEpoch}</span>
            <button class="copy-btn" onclick="copyToClipboard('${currentEpoch}')">📋</button>
          </div>
        </div>
        <div class="clock-section">
          <label class="clock-label">📍 Your Timezone:</label>
          <div class="clock-value">${timezone}</div>
        </div>
      </div>
    `;
  }

  updateClock();
  realTimeInterval = setInterval(updateClock, 1000);
}

// Global copy function
window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show copy notification
    showCopyNotification();
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

function showCopyNotification() {
  // Remove existing notifications
  const existing = document.querySelector('.copy-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'copy-notification';
  notification.textContent = 'Copied to clipboard!';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 2000);
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

  // Use current timestamp buttons
  const useCurrentForDateBtn = document.getElementById("useCurrentForDate");
  const useCurrentForEpochBtn = document.getElementById("useCurrentForEpoch");

  // Set default values
  dateInput.value = getCurrentDateTime();
  epochInput.value = Math.floor(Date.now() / 1000);

  // Use current time buttons
  if (useCurrentForDateBtn) {
    useCurrentForDateBtn.addEventListener("click", () => {
      dateInput.value = getCurrentDateTime();
    });
  }

  if (useCurrentForEpochBtn) {
    useCurrentForEpochBtn.addEventListener("click", () => {
      epochInput.value = Math.floor(Date.now() / 1000);
    });
  }

  // Add Enter key support
  dateInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") dateToEpochBtn.click();
  });

  epochInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") epochToDateBtn.click();
  });

  // Convert to epoch time event listener
  dateToEpochBtn.addEventListener("click", async () => {
    const dateStr = dateInput.value.trim();
    const timeZone = document.getElementById("timeZoneSelectToEpoch").value;
    
    if (!dateStr) {
      epochResultDiv.innerHTML = '<div class="error-message">Please enter a date and time.</div>';
      return;
    }

    epochResultDiv.innerHTML = '<div class="loading">Converting to epoch...</div>';

    try {
      const response = await fetch(
        `${API_URL}/convert-to-epoch?dateStr=${encodeURIComponent(dateStr)}&timeZone=${encodeURIComponent(timeZone)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      epochResultDiv.innerHTML = formatEpochResult(data.epochTime, dateStr, timeZone);
    } catch (error) {
      console.error("Error converting to epoch:", error);
      epochResultDiv.innerHTML = `<div class="error-message">Error converting to epoch: ${error.message}</div>`;
    }
  });

  // Convert from epoch time event listener
  epochToDateBtn.addEventListener("click", async () => {
    const epochTime = epochInput.value.trim();
    const timeZone = document.getElementById("timeZoneSelectFromDate").value;
    
    if (!epochTime || isNaN(epochTime)) {
      dateResultDiv.innerHTML = '<div class="error-message">Please enter a valid epoch timestamp.</div>';
      return;
    }

    dateResultDiv.innerHTML = '<div class="loading">Converting from epoch...</div>';

    try {
      const response = await fetch(
        `${API_URL}/convert-to-date?epochTime=${encodeURIComponent(epochTime)}&timeZone=${encodeURIComponent(timeZone)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      dateResultDiv.innerHTML = formatTimeResult(epochTime, data.dateStr, timeZone);
    } catch (error) {
      console.error("Error converting from epoch:", error);
      dateResultDiv.innerHTML = `<div class="error-message">Error converting from epoch: ${error.message}</div>`;
    }
  });
}
