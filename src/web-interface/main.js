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

// Function to toggle visibility of content views
function toggleView(viewId) {
  document.querySelectorAll(".content-view").forEach((view) => {
    view.classList.add("hidden");
  });
  document.getElementById(viewId).classList.remove("hidden");
}

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
});

// Event listeners for navigation buttons to toggle views
document
  .getElementById("emailInfoBtn")
  .addEventListener("click", () => toggleView("emailInfoView"));
document
  .getElementById("smtpTestBtn")
  .addEventListener("click", () => toggleView("smtpTestView"));
document
  .getElementById("blacklistCheckBtn")
  .addEventListener("click", () => toggleView("blacklistCheckView"));
document
  .getElementById("headerAnalysisBtn")
  .addEventListener("click", () => toggleView("headerAnalysisView"));
document
  .getElementById("whoAmIBtn")
  .addEventListener("click", () => toggleView("whoAmIView"));
document
  .getElementById("sslValidationBtn")
  .addEventListener("click", () => toggleView("sslValidationView"));
document
  .getElementById("pgpEncryptionBtn")
  .addEventListener("click", () => toggleView("pgpEncryptionView"));
document
  .getElementById("removeWhitespaceBtn")
  .addEventListener("click", () => toggleView("removeWhitespaceView"));
document
  .getElementById("base64DecoderBtn")
  .addEventListener("click", () => toggleView("base64DecoderView"));

// Event listeners for input fields to trigger actions on Enter key press
document
  .getElementById("domainInput")
  .addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("fetchEmailInfoBtn").click();
    }
  });
document
  .getElementById("smtpServerInput")
  .addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("performSmtpTestBtn").click();
    }
  });
document
  .getElementById("smtpPortInput")
  .addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("performSmtpTestBtn").click();
    }
  });
document
  .getElementById("blacklistDomainInput")
  .addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("performBlacklistCheckBtn").click();
    }
  });
document
  .getElementById("ipInput")
  .addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("checkWhoAmIBtn").click();
    }
  });
document
  .getElementById("hostnameInput")
  .addEventListener("keypress", function (event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      document.getElementById("validateSslBtn").click();
    }
  });

// Exporting toggleView for potential use in other modules
export { toggleView };
