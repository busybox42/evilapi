import { API_URL } from './config.js';

// Function to push a secret
async function pushSecret() {
  const textInput = document.getElementById('secretTextInput');
  const expiresInInput = document.getElementById('secretExpiresIn');
  const maxViewsInput = document.getElementById('secretMaxViews');
  const errorContent = document.getElementById('errorContent');
  const successContent = document.getElementById('successContent');

  // Clear previous messages
  errorContent.innerHTML = '';
  successContent.classList.add('hidden');

  const text = textInput.value.trim();
  const expiresIn = parseInt(expiresInInput.value, 10);
  const maxViews = parseInt(maxViewsInput.value, 10);

  if (!text) {
    errorContent.innerHTML = '<div class="error-message">Please enter a secret to push.</div>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/secret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, expiresIn, maxViews }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    const secretUrl = `${window.location.origin}/#secret/${resultData.id}`;
    
    document.getElementById('secretSuccessMessage').textContent = 'Secret pushed successfully!';
    document.getElementById('secretLink').textContent = secretUrl;

    const qrcodeContainer = document.getElementById('qrcode');
    qrcodeContainer.innerHTML = ''; // Clear previous QR code
    
    // Generate QR code using QRious library
    const qr = new QRious({
      element: document.createElement('canvas'),
      value: secretUrl,
      size: 128
    });
    qrcodeContainer.appendChild(qr.canvas);

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(secretUrl).then(() => {
        alert('Link copied to clipboard!');
      });
    });

    successContent.classList.remove('hidden');

  } catch (error) {
    console.error('Push secret error:', error);
    errorContent.innerHTML = `<div class="error-message">Failed to push secret: ${error.message}</div>`;
  }
}

// Keep track of fetched secrets to prevent duplicates
const fetchedSecrets = new Set();

// Function to retrieve and show a secret
export async function retrieveAndShowSecret(id) {
  // Prevent duplicate fetches of the same secret
  if (fetchedSecrets.has(id)) {
    console.log('[DEBUG] Preventing duplicate fetch of secret:', id);
    return;
  }
  fetchedSecrets.add(id);

  const resultContainer = document.getElementById('secretDisplayResult');
  const secretDisplayView = document.getElementById('secretDisplayView');
  
  // Show the secret display view
  document.querySelectorAll('.content-view').forEach(view => view.classList.add('hidden'));
  secretDisplayView.classList.remove('hidden');

  try {
    const response = await fetch(`${API_URL}/secret/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Secret not found. It may have expired or already been viewed.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resultData = await response.json();
    let message = '';
    if (resultData.deleted) {
      message = `<div class="success-message">Secret retrieved successfully. It has now been deleted.</div>`;
    } else {
      message = `<div class="success-message">Secret retrieved successfully. ${resultData.viewsRemaining} views remaining.</div>`;
    }

    resultContainer.innerHTML = `
      ${message}
      <div class="secret-controls">
        <button id="unblurBtn" class="nav-btn">Show Secret</button>
        <button id="copySecretBtn" class="nav-btn">Copy to Clipboard</button>
        ${!resultData.deleted ? `<button id="expireSecretBtn" class="nav-btn danger">Expire Secret</button>` : ''}
      </div>
      <div id="secretText" class="secret-text">${resultData.text}</div>
    `;

    // Add event listeners for the buttons
    document.getElementById('unblurBtn').addEventListener('click', function() {
      const secretText = document.getElementById('secretText');
      const button = this;
      if (secretText.classList.contains('unblurred')) {
        secretText.classList.remove('unblurred');
        button.textContent = 'Show Secret';
      } else {
        secretText.classList.add('unblurred');
        button.textContent = 'Hide Secret';
      }
    });

    document.getElementById('copySecretBtn').addEventListener('click', function() {
      const secretText = resultData.text;
      navigator.clipboard.writeText(secretText).then(() => {
        this.textContent = 'Copied!';
        setTimeout(() => {
          this.textContent = 'Copy to Clipboard';
        }, 2000);
      });
    });

    if (!resultData.deleted) {
      document.getElementById('expireSecretBtn').addEventListener('click', async function() {
        if (confirm('Are you sure you want to expire this secret? This action cannot be undone.')) {
          try {
            const expireResponse = await fetch(`${API_URL}/secret/${id}`, {
              method: 'DELETE'
            });

            if (!expireResponse.ok) {
              throw new Error(`HTTP error! status: ${expireResponse.status}`);
            }

            resultContainer.innerHTML = `
              <div class="success-message">Secret has been manually expired and deleted.</div>
            `;
          } catch (error) {
            console.error('Error expiring secret:', error);
            resultContainer.innerHTML += `
              <div class="error-message">Failed to expire secret: ${error.message}</div>
            `;
          }
        }
      });
    }

  } catch (error) {
    console.error('Retrieve secret error:', error);
    resultContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
  }
}

function formatTime(seconds) {
    if (seconds < 3600) {
        const minutes = Math.round(seconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (seconds < 86400) {
        const hours = Math.round(seconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
        const days = Math.round(seconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
}

// Initialize secret sharing functionality
export function initSecretSharing() {
  document.getElementById('pushSecretBtn').addEventListener('click', pushSecret);
  
  const expiresInSlider = document.getElementById('secretExpiresIn');
  const expiresInValue = document.getElementById('expiresInValue');

  // Set initial value and text
  expiresInSlider.value = 86400; // Default to 1 day
  expiresInValue.textContent = formatTime(expiresInSlider.value);

  expiresInSlider.addEventListener('input', () => {
      if (expiresInSlider.value < 3600) {
        expiresInSlider.step = 300; // 5 minute intervals
      } else {
        expiresInSlider.step = 3600; // 1 hour intervals
      }
      expiresInValue.textContent = formatTime(expiresInSlider.value);
  });

  const maxViewsSlider = document.getElementById('secretMaxViews');
  const maxViewsValue = document.getElementById('maxViewsValue');
  maxViewsSlider.addEventListener('input', () => {
      maxViewsValue.textContent = maxViewsSlider.value;
  });

  document.getElementById('resetSecretBtn').addEventListener('click', () => {
    document.getElementById('secretTextInput').value = '';
    expiresInSlider.value = 86400;
    expiresInValue.textContent = '1 day';
    maxViewsSlider.value = 5;
    maxViewsValue.textContent = '5';
    document.getElementById('errorContent').innerHTML = '';
    document.getElementById('successContent').classList.add('hidden');
  });
} 