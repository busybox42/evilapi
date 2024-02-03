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
];

buttonIds.forEach((buttonId) => {
  document
    .getElementById(buttonId)
    .addEventListener("click", () =>
      toggleView(`${buttonId.replace("Btn", "View")}`)
    );
});

// Event listeners for input fields to trigger actions on Enter key press
const inputIds = [
  "domainInput",
  "smtpServerInput",
  "smtpPortInput",
  "blacklistDomainInput",
  "ipInput",
  "hostnameInput",
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
