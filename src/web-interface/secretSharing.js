import { API_URL } from './config.js';

// Function to push a secret
async function pushSecret() {
  const textInput = document.getElementById('secretTextInput');
  const expiresInInput = document.getElementById('secretExpiresIn');
  const maxViewsInput = document.getElementById('secretMaxViews');
  const resultContainer = document.getElementById('secretResult');

  const text = textInput.value.trim();
  const expiresIn = parseInt(expiresInInput.value, 10);
  const maxViews = parseInt(maxViewsInput.value, 10);

  if (!text) {
    resultContainer.innerHTML = '<div class="error-message">Please enter a secret to push.</div>';
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
    
    document.getElementById('secretResult').style.display = 'block';
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

  } catch (error) {
    console.error('Push secret error:', error);
    resultContainer.innerHTML = `<div class="error-message">Failed to push secret: ${error.message}</div>`;
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
      <textarea readonly rows="6">${resultData.text}</textarea>
    `;
  } catch (error) {
    console.error('Retrieve secret error:', error);
    resultContainer.innerHTML = `<div class="error-message">${error.message}</div>`;
  }
}

// Initialize secret sharing functionality
export function initSecretSharing() {
  document.getElementById('pushSecretBtn').addEventListener('click', pushSecret);
} 