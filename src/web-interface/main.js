// Importing modules for various features
import { initEmailInfo } from "./emailInfo.js";
import { initSmtpTest } from "./smtpTest.js";
import { initBlacklistCheck } from "./blacklistCheck.js";
import { initHeaderAnalysis } from "./headerAnalysis.js";
import { initWhoAmI } from "./whoAmI.js";
import { initSslValidation } from "./sslValidation.js";
import { initRemoveWhitespace } from "./removeWhitespace.js";
import { initBase64Decoder } from "./base64Decoder.js";
import { initPgpEncryption } from "./pgpEncryption.js";
import { initPortScan } from "./portScan.js";
import { initValidateDmarc } from "./validateDmarc.js";
import { initDkimTools } from "./dkimTools.js";
import { initSpfTools } from "./spfTools.js";
import { initTestEmailDelivery } from "./testEmailDelivery.js";
import { initNetworkTests } from "./networkTests.js";
import { initAuthValidator } from "./authValidator.js";
import { initDnsLookup } from "./dnsLookup.js";
import { initHashValidation } from "./hashValidation.js";
import { initTimeTools } from "./timeTools.js";
import { initUrlEncoder } from "./urlEncoder.js";
import { initSpamScan } from "./spamScan.js";
import { initDnsPropagation } from "./dnsPropagation.js";
import { renderSslTlsScanner } from "./sslTlsScanner.js";
import { initSecretSharing, retrieveAndShowSecret } from './secretSharing.js';

// Function to toggle visibility of content views
export function toggleView(viewId) {
  document.querySelectorAll(".content-view").forEach((view) => {
    view.classList.add("hidden");
  });
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove("hidden");
  } else {
    console.error(`View with id ${viewId} not found.`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const defaultViewLink = document.getElementById("defaultViewLink");
  if (defaultViewLink) {
    defaultViewLink.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.hash = ''; // Go to root hash
    });
  }
});

// Initialize functionalities after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  toggleView("defaultView");
  initEmailInfo();
  initSmtpTest();
  initBlacklistCheck();
  initHeaderAnalysis();
  initWhoAmI();
  initSslValidation();
  initRemoveWhitespace();
  initBase64Decoder();
  initPgpEncryption();
  initPortScan();
  initValidateDmarc();
  initDkimTools();
  initSpfTools();
  initTestEmailDelivery();
  initNetworkTests();
  initAuthValidator();
  initDnsLookup();
  initHashValidation();
  initTimeTools();
  initUrlEncoder();
  initSpamScan();
  initDnsPropagation();
  renderSslTlsScanner(document.getElementById("sslTlsScannerView"));
  initSecretSharing();
  
  // Only handle routing through the hashchange event
  window.addEventListener('hashchange', handleRouting);
  
  // If there's an initial hash, handle it
  if (window.location.hash) {
    handleRouting();
  }
});

// Event listeners for navigation buttons to toggle views
const buttonIds = [
  // Email Tools
  "emailInfoBtn",
  "blacklistCheckBtn",
  "headerAnalysisBtn",
  "spamScanBtn",
  "dkimToolsBtn",
  "spfToolsBtn",
  "validateDmarcBtn",
  "smtpTestBtn",
  "testEmailDeliveryBtn",
  
  // DNS & Network
  "dnsLookupBtn",
  "dnsPropagationBtn",
  "whoAmIBtn",
  "portScanBtn",
  "networkTestBtn",
  
  // Security & Encryption
  "sslValidationBtn",
  "sslTlsScannerBtn",
  "secretPushBtn",
  "pgpEncryptionBtn",
  "passwordHashBtn",
  
  // Utilities
  "timeToolsBtn",
  "authValidatorBtn",
  "base64DecoderBtn",
  "urlEncoderBtn",
  "removeWhitespaceBtn",
  "apiDocsBtn",
];

buttonIds.forEach((buttonId) => {
  document
    .getElementById(buttonId)
    .addEventListener("click", () => {
      const viewName = buttonId.replace("Btn", "");
      window.location.hash = viewName;
      });
});

// Event listeners for input fields to trigger actions on Enter key press
const inputIds = [
  "domainInput",
  "smtpServerInput",
  "smtpPortInput",
  "blacklistDomainInput",
  "ipInput",
  "hostnameInput",
  "propagationHostInput",
  "dateInput",
  "epochInput",
  // Consider adding IDs for the new time conversion inputs if they should also trigger on Enter key press
];

inputIds.forEach((inputId) => {
  document
    .getElementById(inputId)
    .addEventListener("keypress", function (event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById(`${inputId.replace("Input", "Btn")}`).click();
      }
    });
});

const secretCode = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const userSequence = [];

document.addEventListener('keydown', (event) => {
    userSequence.push(event.key);
    if (userSequence.length > secretCode.length) {
        userSequence.shift();
    }

    if (JSON.stringify(userSequence) === JSON.stringify(secretCode)) {
        launchPacman();
    }
});

window.addEventListener('message', (event) => {
    if (event.data === 'hardReset') {
        closePacman();
    }
});

function launchPacman() {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer.innerHTML === '') {
        gameContainer.innerHTML = `
            <div id="pacman-container" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background-color: black;">
                <iframe id="pacman-frame" style="width: 100%; height: 100%; border: none;" src="pacman/index.html"></iframe>
                <div style="position: absolute; top: 10px; right: 10px; color: white; font-family: monospace;">Press BACKSPACE to exit</div>
            </div>
        `;
    }
    const iframe = document.getElementById('pacman-frame');
    iframe.focus();
}

function closePacman() {
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.innerHTML = '';
    }
}

// Handle hash-based routing for secret links
function handleRouting() {
  const hash = window.location.hash.substring(1); // Remove the #
  
  if (hash.startsWith('secret/')) {
    const secretId = hash.substring(7); // Remove 'secret/'
    if (secretId) {
      retrieveAndShowSecret(secretId);
      toggleView('secretDisplayView');
    }
  } else if (hash) {
    // Handle regular navigation
    const viewId = hash + 'View';
    const targetView = document.getElementById(viewId);
    if (targetView) {
      toggleView(viewId);
    }
  } else {
    toggleView('defaultView');
  }
}
