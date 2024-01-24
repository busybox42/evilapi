const encode = (text) => {
  return Buffer.from(text).toString("base64");
};

const decode = (encodedText) => {
  return Buffer.from(encodedText, "base64").toString("ascii");
};

module.exports = {
  encode,
  decode,
};
