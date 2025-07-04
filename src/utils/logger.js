// Simple logger utility with different log levels
const logger = {
  error: (message, err = null) => {
    const timestamp = new Date().toISOString();
    const errorDetails = err ? (err.stack || err.toString()) : '';
    console.error(`${timestamp} - ERROR: ${message}${errorDetails ? ` - ${errorDetails}` : ''}`);
  },
  
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - INFO: ${message}`);
  },
  
  debug: (message) => {
    const timestamp = new Date().toISOString();
    if (process.env.NODE_ENV === 'development') {
      console.log(`${timestamp} - DEBUG: ${message}`);
    }
  },
  
  warn: (message) => {
    const timestamp = new Date().toISOString();
    console.warn(`${timestamp} - WARN: ${message}`);
  }
};

// Legacy function for backwards compatibility
function logError(req, message, err) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl || req.url; // originalUrl includes the base path
  const errorDetails = err.stack || err.toString(); // Stack trace if available

  console.error(
    `${timestamp} - Error in ${method} ${path} - ${message}: ${errorDetails}`
  );
}

module.exports = { logError, logger };
module.exports.error = logger.error;
module.exports.info = logger.info;
module.exports.debug = logger.debug;
module.exports.warn = logger.warn;
