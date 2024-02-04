// src/utils/timeConverter.js

const moment = require("moment-timezone"); // Using moment-timezone for timezone support

/**
 * Converts a human-readable date to epoch time in milliseconds, considering the timezone.
 * @param {string} dateStr - The date string in "YYYY-MM-DD HH:mm:ss" format.
 * @param {string} timeZone - The IANA time zone name (e.g., "America/New_York").
 * @returns {number} The epoch time in milliseconds.
 */
function dateToEpoch(dateStr, timeZone = "UTC") {
  // Check if the provided timezone is valid
  if (!moment.tz.zone(timeZone)) {
    throw new Error(`Invalid timezone: ${timeZone}`);
  }
  return moment.tz(dateStr, "YYYY-MM-DD HH:mm:ss", timeZone).valueOf();
}

/**
 * Converts epoch time in milliseconds to a human-readable date, considering the timezone.
 * @param {number} epochTime - The epoch time in milliseconds.
 * @param {string} timeZone - The IANA time zone name (e.g., "America/New_York").
 * @param {string} format - Optional format string, defaults to "YYYY-MM-DD HH:mm:ss".
 * @returns {string} The formatted date string.
 */
function epochToDate(
  epochTime,
  timeZone = "UTC",
  format = "YYYY-MM-DD HH:mm:ss"
) {
  return moment.tz(epochTime, timeZone).format(format);
}

module.exports = { dateToEpoch, epochToDate };
