const { ImapFlow } = require("imapflow");
const nodemailer = require("nodemailer");
const Client = require("basic-ftp");
const SFTPClient = require("ssh2-sftp-client");
const Pop3Command = require("node-pop3");

const protocolPortMap = {
  pop3: { port: 110, secure: false },
  pop3s: { port: 995, secure: true },
  imap: { port: 143, secure: false },
  imaps: { port: 993, secure: true },
  smtp: { port: 25, secure: false },
  smtps: { port: 465, secure: true },
  submission: { port: 587, secure: false },
};

// Helper function to prepend a timestamp to log messages
const logWithTimestamp = (message) => {
  console.log(`${new Date().toISOString()} - ${message}`);
};

// Helper function to prepend a timestamp to error messages
const errorWithTimestamp = (message) => {
  console.error(`${new Date().toISOString()} - ${message}`);
};

const authPop3 = async (username, password, hostname, protocol) => {
  let { port, secure } = protocolPortMap[protocol.toLowerCase()] || {};
  if (port === undefined) {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  const pop3 = new Pop3Command({
    user: username,
    password: password,
    host: hostname,
    port: port,
    tls: secure,
  });

  try {
    await pop3.connect();
    logWithTimestamp(`Connected to ${protocol.toUpperCase()} server`);

    // Use "NOOP" command to check if the server is responding
    const [noopResponse] = await pop3.command("NOOP");
    logWithTimestamp(`NOOP response: ${noopResponse}`);

    await pop3.QUIT();
    logWithTimestamp("Logged out successfully");

    return {
      protocol: protocol.toUpperCase(),
      success: true,
      message: "Authentication successful",
    };
  } catch (error) {
    errorWithTimestamp(`Authentication failed: ${error.message}`);
    throw error;
  }
};

const authImap = async (username, password, hostname, protocol) => {
  let { port, secure } = protocolPortMap[protocol.toLowerCase()] || {};
  if (port === undefined) {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  const client = new ImapFlow({
    host: hostname,
    port: port,
    secure: secure,
    auth: {
      user: username,
      pass: password,
    },
    logger: false, // Disable ImapFlow's internal logging
  });

  try {
    await client.connect();
    logWithTimestamp(
      `Authenticated ${username} with ${protocol.toUpperCase()} at ${hostname}`
    );
    await client.logout();
    return { protocol: protocol.toUpperCase(), success: true };
  } catch (error) {
    errorWithTimestamp(
      `Authentication failed for ${username} with ${protocol.toUpperCase()} at ${hostname}: ${error}`
    );
    throw error;
  }
};

const authSmtp = async (username, password, hostname, protocol) => {
  let { port, secure } = protocolPortMap[protocol.toLowerCase()] || {};
  if (port === undefined) {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  let transporter = nodemailer.createTransport({
    host: hostname,
    port: port,
    secure: secure, // true for SMTPS, false otherwise
    auth: {
      user: username,
      pass: password,
    },
  });

  try {
    await transporter.verify();
    logWithTimestamp(
      `Authenticated ${username} with ${protocol.toUpperCase()} at ${hostname}`
    );
    return { protocol: protocol.toUpperCase(), success: true };
  } catch (error) {
    errorWithTimestamp(
      `Authentication failed for ${username} with ${protocol.toUpperCase()} at ${hostname}: ${error}`
    );
    throw error;
  }
};

const authFtp = async (username, password, hostname, protocol = "FTP") => {
  logWithTimestamp(
    `Authenticating ${username} with ${protocol} at ${hostname}`
  );

  if (protocol.toUpperCase() === "FTP") {
    const client = new Client.Client();
    try {
      await client.access({
        host: hostname,
        user: username,
        password: password,
        secure: false, // Set true for FTPS
      });
      logWithTimestamp("FTP Authentication successful");
      client.close();
      return { protocol: "FTP", success: true };
    } catch (error) {
      errorWithTimestamp("FTP Authentication failed:", error.message);
      throw error; // Rethrow or adjust as needed
    }
  } else if (protocol.toUpperCase() === "SFTP") {
    const sftp = new SFTPClient();
    try {
      await sftp.connect({
        host: hostname,
        port: 22, // Default SFTP port
        username: username,
        password: password,
      });
      logWithTimestamp("SFTP Authentication successful");
      sftp.end();
      return { protocol: "SFTP", success: true };
    } catch (error) {
      errorWithTimestamp("SFTP Authentication failed:", error.message);
      throw error; // Rethrow or adjust as needed
    }
  } else {
    throw new Error("Unsupported protocol. Please choose FTP or SFTP.");
  }
};

module.exports = {
  authPop3,
  authImap,
  authSmtp,
  authFtp,
};
