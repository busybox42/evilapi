import { API_URL } from "./config.js";

// API Client utility class
class ApiClient {
  constructor(baseURL = API_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making request to: ${url}`);
    
    const config = {
      method: options.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    // Add body for POST/PUT requests
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Specific API methods for common operations
  async getEmailInfo(domain) {
    return this.get(`/email-info/${domain}`);
  }

  async scanPorts(host, port = null) {
    return this.get('/scan', { host, ...(port && { port }) });
  }

  async testSmtp(data) {
    return this.post('/test-smtp', data);
  }

  async testAuth(data) {
    return this.post('/auth', data);
  }

  async checkBlacklist(identifier) {
    return this.get(`/blacklist/${identifier}`);
  }

  async analyzeHeaders(headers) {
    return this.post('/analyze-headers', { headers });
  }

  async encodeBase64(text) {
    return this.post('/encode', { text });
  }

  async decodeBase64(encodedText) {
    return this.post('/decode', { encodedText });
  }

  async validateSsl(hostname, port = 443) {
    return this.get('/validate-ssl', { hostname, port });
  }

  async whoami() {
    return this.get('/whoami');
  }

  async lookupDmarc(domain) {
    return this.get(`/dmarc/${domain}`);
  }

  async lookupDkim(domain, selector) {
    return this.get(`/dkim/${domain}/${selector}`);
  }

  async generateDkimKeys(domain, selector) {
    return this.post('/dkim/generate', { domain, selector });
  }

  async testEmailDelivery(data) {
    return this.post('/test-email', data);
  }

  async dnsLookup(host, type, dnsServer) {
    return this.get('/dns', { host, type, dnsServer });
  }

  async createHash(algorithm, text) {
    return this.post('/create-hash', { algorithm, text });
  }

  async validateHash(algorithm, password, hash) {
    return this.post('/validate-hash', { algorithm, password, hash });
  }

  async convertTime(data) {
    return this.post('/convert-time', data);
  }

  async encodeUrl(text) {
    return this.post('/encode-url', { text });
  }

  async decodeUrl(encodedText) {
    return this.post('/decode-url', { encodedText });
  }

  async scanSpam(email) {
    return this.post('/scan-spam', { email });
  }

  async removeWhitespace(text) {
    return this.post('/remove-whitespace', { text });
  }

  async ping(host) {
    return this.get('/ping', { host });
  }

  async pgpEncrypt(data) {
    return this.post('/pgp/encrypt', data);
  }

  async pgpDecrypt(data) {
    return this.post('/pgp/decrypt', data);
  }

  async pgpSign(data) {
    return this.post('/pgp/sign', data);
  }

  async pgpVerify(data) {
    return this.post('/pgp/verify', data);
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

// Export both the class and the singleton
export { ApiClient, apiClient };
export default apiClient; 