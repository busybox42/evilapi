const crypto = require('crypto');

const generateRandomData = (sizeInMB) => {
  const buffer = crypto.randomBytes(sizeInMB * 1024 * 1024);
  return buffer;
};

const downloadTest = (req, res) => {
  const dataSize = 50; // Send 50MB of data
  const data = generateRandomData(dataSize);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', data.length);
  res.send(data);
};

const uploadTest = (req, res) => {
    let dataLength = 0;
    req.on('data', chunk => {
        dataLength += chunk.length;
    });
    req.on('end', () => {
        res.json({ received: dataLength });
    });
};

module.exports = {
  downloadTest,
  uploadTest,
};
