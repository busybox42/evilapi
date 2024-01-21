const nodemailer = require("nodemailer");
const dns = require("dns").promises;
const { performance } = require("perf_hooks");

async function testSmtpServer(serverAddress, port) {
  let report = {};
  try {
    // Connect to the SMTP server
    let transporter = nodemailer.createTransport({
      host: serverAddress,
      port: port || 25,
      secure: false, // Use TLS
      tls: {
        rejectUnauthorized: false, // Allow unauthorized certificates (for testing purposes)
      },
    });

    // Start measuring transaction time
    const transactionStartTime = performance.now();

    // Verify connection
    let connectionResult = await transporter.verify();

    // Stop measuring transaction time
    const transactionEndTime = performance.now();

    // Calculate transaction time in milliseconds
    const transactionTimeMs = (
      (transactionEndTime - transactionStartTime) /
      1000
    ).toFixed(3);

    report.connection = connectionResult ? "Successful" : "Failed";
    report.transactionTimeMs = transactionTimeMs;

    // Check for Reverse DNS Mismatch
    let ipAddresses = await dns.resolve(serverAddress);
    let reverseDns = await dns.reverse(ipAddresses[0]);
    report.reverseDnsMismatch = reverseDns[0] !== serverAddress;

    // Check TLS Support
    const tlsResult = await testTlsSupport(serverAddress, port);
    report.tlsSupport = tlsResult;

    // Check for Open Relay
    const openRelayResult = await checkOpenRelay(
      serverAddress,
      port,
      "test@example.com"
    );
    report.openRelay = openRelayResult;
  } catch (error) {
    report.error = error.message;
  }

  return report;
}

async function testTransactionTime(serverAddress, port) {
  try {
    // Connect to the SMTP server
    let transporter = nodemailer.createTransport({
      host: serverAddress,
      port: port || 25,
      secure: false, // Use TLS
      tls: {
        rejectUnauthorized: false, // Allow unauthorized certificates (for testing purposes)
      },
    });

    // Perform a mock SMTP transaction
    const testEmail = {
      from: "test@example.com", // Replace with a suitable sender address
      to: "test@example.com", // Replace with a suitable recipient address
      subject: "Transaction Time Test",
      text: "This is a test email for measuring transaction time.",
    };

    // Start measuring transaction time
    const transactionStartTime = performance.now();

    await transporter.sendMail(testEmail);

    // Stop measuring transaction time
    const transactionEndTime = performance.now();

    // Calculate the time taken
    const timeTaken = (
      (transactionEndTime - transactionStartTime) /
      1000
    ).toFixed(2);

    return timeTaken;
  } catch (error) {
    console.error("SMTP Transaction Error:", error);
    return `Error: ${error.message}`; // Return detailed error message
  }
}

async function testTlsSupport(serverAddress, port) {
  try {
    // Connect to the SMTP server
    let transporter = nodemailer.createTransport({
      host: serverAddress,
      port: port || 25,
      secure: false, // Use TLS
      tls: {
        rejectUnauthorized: false, // Allow unauthorized certificates (for testing purposes)
      },
    });

    // Check if the transporter supports TLS
    const tlsResult = await transporter.verify();
    return tlsResult ? "Supported" : "Not supported";
  } catch (error) {
    console.error("TLS Support Check Error:", error);
    return "Error checking TLS support";
  }
}

async function checkOpenRelay(serverAddress, port, testEmail) {
  try {
    // Connect to the SMTP server
    let transporter = nodemailer.createTransport({
      host: serverAddress,
      port: port || 25,
      secure: false, // Use TLS
      tls: {
        rejectUnauthorized: false, // Allow unauthorized certificates (for testing purposes)
      },
    });

    // Attempt to send a test email without authenticating
    await transporter.sendMail({
      from: "test@example.com", // Sender address
      to: testEmail, // Recipient address (could be any external email)
      subject: "Open Relay Test",
      text: "This is a test email for open relay check.",
    });

    // If no error is thrown, the server might be an open relay
    return true;
  } catch (error) {
    // If sending fails, it's likely not an open relay
    if (error && error.responseCode === 550) {
      // Typical response code for unauthenticated send failure
      return false;
    }
    throw error; // Re-throw other errors for handling in the calling function
  }
}

module.exports = {
  testSmtpServer,
  testTransactionTime,
  testTlsSupport,
  checkOpenRelay,
};
