import { API_URL } from "./config.js";

let currentEventSource = null;

async function performNetworkTestStream(apiEndpoint) {
  const domain = document.getElementById("networkDomainInput").value.trim();
  if (!domain) {
    alert("Please enter a domain.");
    return;
  }

  // Close any existing stream
  if (currentEventSource) {
    currentEventSource.close();
  }

  const url = `${API_URL}/${apiEndpoint}-stream/${encodeURIComponent(domain)}`;
  const resultsElement = document.getElementById("networkResults");
  
  // Clear previous results and show initial message
  resultsElement.innerHTML = '<div class="loading">Connecting to stream...</div>';

  try {
    currentEventSource = new EventSource(url);
    let output = "";

    currentEventSource.onopen = function(event) {
      resultsElement.innerHTML = '<pre class="network-result streaming"></pre>';
    };

    currentEventSource.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        const outputElement = resultsElement.querySelector('.network-result');
        
        if (data.type === 'data') {
          output += data.content;
          outputElement.textContent = output;
          // Auto-scroll to bottom
          outputElement.scrollTop = outputElement.scrollHeight;
        } else if (data.type === 'end') {
          currentEventSource.close();
          outputElement.classList.remove('streaming');
          outputElement.classList.add('completed');
        } else if (data.type === 'error') {
          currentEventSource.close();
          resultsElement.innerHTML = `<div class="error-message">Error: ${data.content}</div>`;
        }
      } catch (parseError) {
        console.error("Error parsing SSE data:", parseError);
      }
    };

    currentEventSource.onerror = function(event) {
      console.error("EventSource failed:", event);
      currentEventSource.close();
      
      // Fallback to regular API if streaming fails
      resultsElement.innerHTML = '<div class="loading">Stream failed, trying standard request...</div>';
      performNetworkTestFallback(apiEndpoint.replace('-stream', ''));
    };

  } catch (error) {
    console.error("Network test error:", error);
    resultsElement.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
  }
}

// Fallback to original non-streaming method
async function performNetworkTestFallback(apiEndpoint) {
  const domain = document.getElementById("networkDomainInput").value.trim();
  if (!domain) {
    alert("Please enter a domain.");
    return;
  }
  const url = `${API_URL}/${apiEndpoint}/${encodeURIComponent(domain)}`;
  const resultsElement = document.getElementById("networkResults");
  resultsElement.innerHTML = '<div class="loading">Running network test...</div>';

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      resultsElement.innerHTML = `<pre class="network-result">${data.result}</pre>`;
    } else {
      const errorMsg = data.message || data.error || "Unknown error occurred";
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Network test error:", error);
    
    let errorMessage = error.message;
    if (error.message.includes("Failed to fetch")) {
      errorMessage = "Network request failed. Check if the API server is running.";
    } else if (error.message.includes("500")) {
      errorMessage = "Server error. The network test command may have failed.";
    }
    
    resultsElement.innerHTML = `<div class="error-message">Error: ${errorMessage}</div>`;
  }
}

// Legacy function for backward compatibility
async function performNetworkTest(apiEndpoint) {
  return performNetworkTestFallback(apiEndpoint);
}

export function initNetworkTests() {
  document
    .getElementById("pingBtn")
    .addEventListener("click", () => performNetworkTestStream("ping"));
  document
    .getElementById("tracerouteBtn")
    .addEventListener("click", () => performNetworkTestStream("traceroute"));
}
