const { authPop3, authImap, authSmtp, authFtp } = require("../utils/authUtils");

const authService = async (username, password, hostname, protocol) => {
  switch (protocol.toLowerCase()) {
    case "pop3":
    case "pop3s":
      return authPop3(username, password, hostname, protocol);
    case "imap":
    case "imaps":
      return authImap(username, password, hostname, protocol);
    case "smtp":
    case "smtps":
    case "submission":
      return authSmtp(username, password, hostname, protocol);
    case "ftp":
    case "sftp":
      return authFtp(username, password, hostname, protocol);
    default:
      throw new Error("Unsupported protocol");
  }
};

module.exports = { authService };
