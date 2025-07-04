const net = require("net");
const async = require("async");

const checkPort = (host, port, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    const id = setTimeout(() => {
      socket.destroy();
      reject("Timeout");
    }, timeout);

    socket
      .on("connect", () => {
        clearTimeout(id);
        socket.destroy();
        resolve(true);
      })
      .on("error", (err) => {
        clearTimeout(id);
        reject(err);
      })
      .on("timeout", () => {
        socket.destroy();
        reject("Timeout");
      });

    socket.connect(port, host);
  });
};

const scanPorts = async (host, specificPort) => {
  // Convert port to number if provided, otherwise use default ports
  const ports = specificPort
    ? [parseInt(specificPort)]
    : [80, 443, 21, 22, 25, 587, 465, 110, 143, 995, 993];
  let results = [];

  for (const port of ports) {
    try {
      const isOpen = await checkPort(host, port);
      results.push({ port: port, status: isOpen ? "open" : "closed" });
    } catch (error) {
      results.push({ port: port, status: "closed" });
    }
  }

  // Sorting results: open ports first
  results.sort((a, b) =>
    a.status === "closed" && b.status === "open" ? 1 : -1
  );

  return {
    host: host,
    totalPorts: results.length,
    results: results
  };
};

module.exports = { scanPorts };
