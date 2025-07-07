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
      event.preventDefault(); // Prevent following the link
      window.location.reload(true); // Deprecated but intended for a hard refresh
      // Alternatively, for a more consistent hard refresh across browsers:
      // window.location.href = window.location.href;
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
  });

// Event listeners for navigation buttons to toggle views
const buttonIds = [
  "emailInfoBtn",
  "smtpTestBtn",
  "blacklistCheckBtn",
  "headerAnalysisBtn",
  "whoAmIBtn",
  "sslValidationBtn",
  "pgpEncryptionBtn",
  "removeWhitespaceBtn",
  "base64DecoderBtn",
  "portScanBtn",
  "validateDmarcBtn",
  "dkimToolsBtn",
  "testEmailDeliveryBtn",
  "networkTestBtn",
  "authValidatorBtn",
  "dnsLookupBtn",
  "dnsPropagationBtn",
  "passwordHashBtn",
  "timeToolsBtn",
  "urlEncoderBtn",
  "spamScanBtn",
  "sslTlsScannerBtn",
  "apiDocsBtn",
];

buttonIds.forEach((buttonId) => {
  document
    .getElementById(buttonId)
    .addEventListener("click", () => {
      toggleView(`${buttonId.replace("Btn", "View")}`);
      if (buttonId === "speedTestBtn") {
        initSpeedTest();
      }
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
