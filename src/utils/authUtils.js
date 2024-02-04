const imaps = require("imap-simple");
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
    console.log(`Connected to ${protocol.toUpperCase()} server`);

    // Use "NOOP" command to check if the server is responding
    const [noopResponse] = await pop3.command("NOOP");
    console.log(`NOOP response: ${noopResponse}`);

    await pop3.QUIT();
    console.log("Logged out successfully");

    return {
      protocol: protocol.toUpperCase(),
      success: true,
      message: "Authentication successful",
    };
  } catch (error) {
    console.error(`Authentication failed: ${error.message}`);
    throw error;
  }
};

const authImap = async (username, password, hostname, protocol) => {
  let { port, secure } = protocolPortMap[protocol.toLowerCase()] || {};
  if (port === undefined) {
    throw new Error(`Unsupported protocol: ${protocol}`);
  }

  const config = {
    imap: {
      user: username,
      password: password,
      host: hostname,
      port: port,
      tls: secure,
      authTimeout: 3000,
    },
  };

  try {
    const connection = await imaps.connect(config);
    console.log(
      `Authenticated ${username} with ${protocol.toUpperCase()} at ${hostname}`
    );
    connection.end();
    return { protocol: protocol.toUpperCase(), success: true };
  } catch (error) {
    console.error(
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
    console.log(
      `Authenticated ${username} with ${protocol.toUpperCase()} at ${hostname}`
    );
    return { protocol: protocol.toUpperCase(), success: true };
  } catch (error) {
    console.error(
      `Authentication failed for ${username} with ${protocol.toUpperCase()} at ${hostname}: ${error}`
    );
    throw error;
  }
};

const authFtp = async (username, password, hostname, protocol = "FTP") => {
  console.log(`Authenticating ${username} with ${protocol} at ${hostname}`);

  if (protocol.toUpperCase() === "FTP") {
    const client = new Client.Client();
    try {
      await client.access({
        host: hostname,
        user: username,
        password: password,
        secure: false, // Set true for FTPS
      });
      console.log("FTP Authentication successful");
      client.close();
      return { protocol: "FTP", success: true };
    } catch (error) {
      console.error("FTP Authentication failed:", error.message);
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
      console.log("SFTP Authentication successful");
      sftp.end();
      return { protocol: "SFTP", success: true };
    } catch (error) {
      console.error("SFTP Authentication failed:", error.message);
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
