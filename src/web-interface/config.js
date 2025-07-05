// Dynamic API URL configuration
function getApiUrl() {
    // If we're running locally (localhost or 127.0.0.1), use localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3011/api';
    }
    
    // For remote servers, use the same hostname but port 3011
    return `http://${window.location.hostname}:3011/api`;
}

export const API_URL = getApiUrl();
