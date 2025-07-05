// Dynamic API URL configuration
function getApiUrl() {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // If we're running locally (localhost or 127.0.0.1), use direct API port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Check if we're accessing via port 8080 (web server) or port 3011 (API server)
        if (port === '8080' || port === '3011') {
            return `${protocol}//${hostname}:3011/api`;
        }
        // If no port specified, assume nginx proxy is running
        return `${protocol}//${hostname}/api`;
    }
    
    // For remote servers with nginx proxy, use same protocol/host
    if (port) {
        return `${protocol}//${hostname}:${port}/api`;
    }
    
    // Default: same protocol and host as the website
    return `${protocol}//${hostname}/api`;
}

export const API_URL = getApiUrl();

// Debug logging (remove in production)
console.log('API URL configured as:', API_URL);
