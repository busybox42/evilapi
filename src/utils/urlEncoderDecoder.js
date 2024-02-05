// Function to encode a string
function encodeString(str) {
  return encodeURIComponent(str);
}

// Function to decode a string
function decodeString(str) {
  return decodeURIComponent(str);
}

module.exports = {
  encodeString,
  decodeString,
};
