const nodemailer = require("nodemailer");
const imaps = require("imap-simple");
const { v4: uuidv4 } = require("uuid"); // Import UUID generator

function logWithTimestamp(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

const testEmailDelivery = async ({ smtpConfig, imapConfig, timeout }) => {
  const uniqueId = uuidv4(); // Generate a unique identifier

  logWithTimestamp(`Sending test email with Unique ID: ${uniqueId}`);

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
  });

  // Capture send timestamp
  const sendTimestamp = Date.now();

  try {
    await transporter.sendMail({
      from: smtpConfig.from,
      to: smtpConfig.to,
      subject: `Email Delivery Test - ${uniqueId}`,
      text: "This is a test email for delivery verification.",
    });

    logWithTimestamp("Test email sent, proceeding to check inbox...");

    const config = {
      imap: {
        user: imapConfig.user,
        password: imapConfig.password,
        host: imapConfig.host,
        port: imapConfig.port,
        tls: imapConfig.tls,
        authTimeout: imapConfig.authTimeout || 3000,
      },
    };

    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");
    logWithTimestamp("Connected to IMAP and opened INBOX.");

    const searchCriteria = [
      "UNSEEN",
      ["SUBJECT", `Email Delivery Test - ${uniqueId}`],
    ];
    const fetchOptions = {
      bodies: ["HEADER.FIELDS (FROM SUBJECT DATE)"],
      struct: true,
    };

    let emailDetails = null;
    let receivedTimestamp;

    while (!emailDetails && Date.now() - sendTimestamp < timeout) {
      const messages = await connection.search(searchCriteria, fetchOptions);

      for (const message of messages) {
        const headerPart = message.parts.find(
          (part) => part.which === "HEADER.FIELDS (FROM SUBJECT DATE)"
        );
        if (headerPart) {
          const header = headerPart.body;
          const subject = header.subject ? header.subject[0] : "";
          if (subject.includes(uniqueId)) {
            receivedTimestamp = Date.now(); // Capture received timestamp
            emailDetails = {
              from: header.from[0],
              subject,
              date: header.date[0],
            };
            logWithTimestamp(
              `Email with Unique ID: ${uniqueId} successfully received.`
            );
            break; // Exit the loop
          }
        }
      }

      if (!emailDetails) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Check more frequently
      }
    }

    await connection.end();

    if (emailDetails && receivedTimestamp) {
      const latency = receivedTimestamp - sendTimestamp; // Calculate latency
      return {
        success: true,
        message: "Email successfully received.",
        details: emailDetails,
        latency: `${latency}ms`, // Include latency in the response
      };
    } else {
      logWithTimestamp("Email not received within the timeout period.");
      return {
        success: false,
        message: "Email not received within the timeout period.",
      };
    }
  } catch (error) {
    logWithTimestamp(`Error in email delivery verification: ${error}`);
    throw new Error(`Failed to verify email delivery: ${error.message}`);
  }
};

module.exports = { testEmailDelivery };
