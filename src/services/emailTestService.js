const nodemailer = require("nodemailer");
const { ImapFlow } = require("imapflow");
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

    const client = new ImapFlow({
      host: imapConfig.host,
      port: imapConfig.port,
      secure: imapConfig.tls,
      auth: {
        user: imapConfig.user,
        pass: imapConfig.password,
      },
      logger: false, // Disable ImapFlow's internal logging
    });

    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    logWithTimestamp("Connected to IMAP and opened INBOX.");

    let emailDetails = null;
    let receivedTimestamp;

    try {
      while (!emailDetails && Date.now() - sendTimestamp < timeout) {
        // Search for unread emails with our unique subject
        const searchResults = await client.search({
          unseen: true,
          subject: `Email Delivery Test - ${uniqueId}`,
        });

        for (const uid of searchResults) {
          const messageData = await client.fetchOne(uid, {
            envelope: true,
            headers: ['from', 'subject', 'date'],
          });

          if (messageData && messageData.envelope && messageData.envelope.subject) {
            const subject = messageData.envelope.subject;
            if (subject.includes(uniqueId)) {
              receivedTimestamp = Date.now(); // Capture received timestamp
              emailDetails = {
                from: messageData.envelope.from[0]?.address || 'unknown',
                subject,
                date: messageData.envelope.date || new Date().toISOString(),
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
    } finally {
      lock.release();
      await client.logout();
    }

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
