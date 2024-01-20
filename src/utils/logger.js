function logError(req, message, err) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const path = req.originalUrl || req.url; // originalUrl includes the base path
    const errorDetails = err.stack || err.toString(); // Stack trace if available
  
    console.error(`${timestamp} - Error in ${method} ${path} - ${message}: ${errorDetails}`);
  }
  
module.exports = { logError };
  