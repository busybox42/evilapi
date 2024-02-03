// src/services/pingService.js
const { exec } = require("child_process");
const os = require("os");

const pingHost = (host) => {
  return new Promise((resolve, reject) => {
    exec(`ping -c 4 ${host}`, (error, stdout, stderr) => {
      if (error) {
        reject(`Ping error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Ping stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
};

const tracerouteHost = (host) => {
  const command =
    os.platform() === "win32" ? `tracert ${host}` : `traceroute ${host}`;
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Traceroute error: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`Traceroute stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
};

module.exports = { pingHost, tracerouteHost };
