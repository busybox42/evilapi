// src/services/pingService.js
const { exec, spawn } = require("child_process");
const os = require("os");
const net = require("net");

const pingHost = (host) => {
  return new Promise((resolve, reject) => {
    // First try the traditional ping
    exec(`ping -c 4 ${host}`, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        // If ping fails, try a TCP connect test as fallback
        // Docker containers often have network restrictions that prevent ICMP ping
        if (error.code === 1 || error.code === 2 || error.code === null || 
            (stdout && stdout.includes("100% packet loss")) ||
            (error.signal === 'SIGTERM' && error.killed)) {
          // This is likely a Docker network restriction issue
          tcpConnectTest(host)
            .then((result) => {
              const fallbackMessage = `
PING ${host} - ICMP ping failed (likely Docker network restriction)
Fallback TCP connectivity test results:
${result}

Note: Traditional ICMP ping is not available in this container environment.
This is a common Docker limitation for security reasons.
The above TCP connectivity test provides basic reachability information.
`;
              resolve(fallbackMessage);
            })
            .catch((tcpError) => {
              reject(new Error(`Ping failed: ${error.message}\nTCP fallback also failed: ${tcpError.message}`));
            });
        } else {
          reject(new Error(`Ping error: ${error.message}`));
        }
        return;
      }
      if (stderr) {
        reject(new Error(`Ping stderr: ${stderr}`));
        return;
      }
      resolve(stdout);
    });
  });
};

const tcpConnectTest = (host) => {
  return new Promise((resolve, reject) => {
    const commonPorts = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995];
    let results = [];
    let completed = 0;
    
    const testPort = (port) => {
      return new Promise((portResolve) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
          socket.destroy();
          portResolve({ port, status: 'timeout' });
        }, 3000);
        
        socket.connect(port, host, () => {
          clearTimeout(timeout);
          socket.destroy();
          portResolve({ port, status: 'open' });
        });
        
        socket.on('error', () => {
          clearTimeout(timeout);
          portResolve({ port, status: 'closed' });
        });
      });
    };
    
    Promise.all(commonPorts.map(testPort))
      .then((portResults) => {
        const openPorts = portResults.filter(r => r.status === 'open');
        const closedPorts = portResults.filter(r => r.status === 'closed');
        const timeoutPorts = portResults.filter(r => r.status === 'timeout');
        
        let summary = `TCP Connectivity Test for ${host}:\n`;
        summary += `- Open ports: ${openPorts.length ? openPorts.map(p => p.port).join(', ') : 'None'}\n`;
        summary += `- Closed ports: ${closedPorts.length} (connection refused)\n`;
        summary += `- Timeout ports: ${timeoutPorts.length} (no response)\n`;
        
        if (openPorts.length > 0) {
          summary += `\nHost appears to be reachable (${openPorts.length} open ports found)`;
        } else if (closedPorts.length > 0) {
          summary += `\nHost appears to be reachable but tested ports are closed`;
        } else {
          summary += `\nHost may be unreachable or heavily filtered`;
        }
        
        resolve(summary);
      })
      .catch(reject);
  });
};

const tracerouteHost = (host) => {
  const command =
    os.platform() === "win32" ? `tracert -h 10 ${host}` : `traceroute -m 10 ${host}`;
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 15000 }, (error, stdout, stderr) => {
      if (error) {
        // If traceroute fails completely, provide a TCP path analysis as fallback
        if (error.code === 1 || error.code === 2 || error.code === null || 
            (error.signal === 'SIGTERM' && error.killed)) {
          tcpPathAnalysis(host)
            .then((result) => {
              const fallbackMessage = `
TRACEROUTE ${host} - Traditional traceroute failed (likely Docker network limitation)
Fallback TCP path analysis:
${result}

Note: Traditional traceroute may have limited functionality in container environments.
Docker networking often blocks ICMP and UDP packets used by standard traceroute.
The above TCP analysis provides basic connectivity path information.
`;
              resolve(fallbackMessage);
            })
            .catch((tcpError) => {
              reject(new Error(`Traceroute failed: ${error.message}\nTCP fallback also failed: ${tcpError.message}`));
            });
        } else {
          reject(new Error(`Traceroute error: ${error.message}`));
        }
        return;
      }
      if (stderr) {
        reject(new Error(`Traceroute stderr: ${stderr}`));
        return;
      }
      
      // If we get output but it's mostly timeouts, still provide it but with explanation
      const lines = stdout.split('\n');
      const timeoutLines = lines.filter(line => line.includes('* * *')).length;
      const totalLines = lines.filter(line => line.trim() && !line.includes('traceroute to')).length;
      
      if (timeoutLines > totalLines * 0.7) {
        // If more than 70% of lines are timeouts, add explanation
        const explanation = `
${stdout.trim()}

Note: Many hops show timeouts (* * *) which is common in Docker environments.
This typically indicates intermediate routers don't respond to traceroute probes
for security reasons, not network connectivity issues.
`;
        resolve(explanation);
      } else {
        resolve(stdout);
      }
    });
  });
};

const tcpPathAnalysis = (host) => {
  return new Promise((resolve, reject) => {
    // Test connectivity to common ports and provide basic path info
    const commonPorts = [80, 443, 22];
    let results = [];
    
    const testPortWithTiming = (port) => {
      return new Promise((portResolve) => {
        const socket = new net.Socket();
        const startTime = Date.now();
        const timeout = setTimeout(() => {
          socket.destroy();
          portResolve({ port, status: 'timeout', time: Date.now() - startTime });
        }, 5000);
        
        socket.connect(port, host, () => {
          const connectionTime = Date.now() - startTime;
          clearTimeout(timeout);
          socket.destroy();
          portResolve({ port, status: 'open', time: connectionTime });
        });
        
        socket.on('error', () => {
          const connectionTime = Date.now() - startTime;
          clearTimeout(timeout);
          portResolve({ port, status: 'closed', time: connectionTime });
        });
      });
    };
    
    Promise.all(commonPorts.map(testPortWithTiming))
      .then((portResults) => {
        let summary = `TCP Path Analysis for ${host}:\n`;
        
        portResults.forEach(result => {
          summary += `- Port ${result.port}: ${result.status} (${result.time}ms)\n`;
        });
        
        const openPorts = portResults.filter(r => r.status === 'open');
        if (openPorts.length > 0) {
          const avgTime = Math.round(openPorts.reduce((sum, p) => sum + p.time, 0) / openPorts.length);
          summary += `\nAverage connection time: ${avgTime}ms`;
          summary += `\nHost is reachable via TCP on ${openPorts.length} tested ports`;
        } else {
          summary += `\nNo TCP connections successful on tested ports`;
        }
        
        resolve(summary);
      })
      .catch(reject);
  });
};

const pingHostStream = (host, onData, onEnd, onError) => {
  const pingCmd = `ping -c 4 ${host}`;
  const child = spawn('sh', ['-c', pingCmd]);
  
  onData("Starting ping test...\n");
  
  let output = "";
  let hasOutput = false;
  
  child.stdout.on('data', (data) => {
    hasOutput = true;
    const line = data.toString();
    output += line;
    onData(line);
  });
  
  child.stderr.on('data', (data) => {
    const line = data.toString();
    onData(`Error: ${line}`);
  });
  
  child.on('close', (code) => {
    if (code !== 0 || !hasOutput) {
      onData("\nPing failed, trying TCP connectivity test...\n");
      tcpConnectTestStream(host, onData, onEnd, onError);
    } else {
      onEnd();
    }
  });
  
  child.on('error', (error) => {
    onData("\nPing command failed, trying TCP connectivity test...\n");
    tcpConnectTestStream(host, onData, onEnd, onError);
  });
};

const tcpConnectTestStream = (host, onData, onEnd, onError) => {
  const commonPorts = [80, 443, 22, 21, 25, 53, 110, 143, 993, 995];
  let completed = 0;
  let results = [];
  
  onData(`\nTCP Connectivity Test for ${host}:\n`);
  
  const testPort = (port) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      results.push({ port, status: 'timeout' });
      completed++;
      onData(`Port ${port}: timeout\n`);
      checkComplete();
    }, 3000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      results.push({ port, status: 'open' });
      completed++;
      onData(`Port ${port}: open\n`);
      checkComplete();
    });
    
    socket.on('error', () => {
      clearTimeout(timeout);
      results.push({ port, status: 'closed' });
      completed++;
      onData(`Port ${port}: closed\n`);
      checkComplete();
    });
  };
  
  const checkComplete = () => {
    if (completed === commonPorts.length) {
      const openPorts = results.filter(r => r.status === 'open');
      const closedPorts = results.filter(r => r.status === 'closed');
      const timeoutPorts = results.filter(r => r.status === 'timeout');
      
      onData(`\nSummary:\n`);
      onData(`- Open ports: ${openPorts.length ? openPorts.map(p => p.port).join(', ') : 'None'}\n`);
      onData(`- Closed ports: ${closedPorts.length} (connection refused)\n`);
      onData(`- Timeout ports: ${timeoutPorts.length} (no response)\n`);
      
      if (openPorts.length > 0) {
        onData(`\nHost appears to be reachable (${openPorts.length} open ports found)\n`);
      } else if (closedPorts.length > 0) {
        onData(`\nHost appears to be reachable but tested ports are closed\n`);
      } else {
        onData(`\nHost may be unreachable or heavily filtered\n`);
      }
      
      onEnd();
    }
  };
  
  commonPorts.forEach(testPort);
};

const tracerouteHostStream = (host, onData, onEnd, onError) => {
  const tracerouteCmd = `traceroute -m 10 ${host}`;
  const child = spawn('sh', ['-c', tracerouteCmd]);
  
  onData("Starting traceroute...\n");
  
  let output = "";
  let hasOutput = false;
  
  child.stdout.on('data', (data) => {
    hasOutput = true;
    const line = data.toString();
    output += line;
    onData(line);
  });
  
  child.stderr.on('data', (data) => {
    const line = data.toString();
    onData(`Error: ${line}`);
  });
  
  child.on('close', (code) => {
    if (code !== 0 || !hasOutput) {
      onData("\nTraceroute failed, trying TCP path analysis...\n");
      tcpPathAnalysisStream(host, onData, onEnd, onError);
    } else {
      // Check if mostly timeouts
      const lines = output.split('\n');
      const timeoutLines = lines.filter(line => line.includes('* * *')).length;
      const totalLines = lines.filter(line => line.trim() && !line.includes('traceroute to')).length;
      
      if (timeoutLines > totalLines * 0.7) {
        onData(`\nNote: Many hops show timeouts (* * *) which is common in Docker environments.\n`);
        onData(`This typically indicates intermediate routers don't respond to traceroute probes\n`);
        onData(`for security reasons, not network connectivity issues.\n`);
      }
      onEnd();
    }
  });
  
  child.on('error', (error) => {
    onData("\nTraceroute command failed, trying TCP path analysis...\n");
    tcpPathAnalysisStream(host, onData, onEnd, onError);
  });
};

const tcpPathAnalysisStream = (host, onData, onEnd, onError) => {
  const commonPorts = [80, 443, 22];
  let completed = 0;
  let results = [];
  
  onData(`\nTCP Path Analysis for ${host}:\n`);
  
  const testPortWithTiming = (port) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      socket.destroy();
      const time = Date.now() - startTime;
      results.push({ port, status: 'timeout', time });
      completed++;
      onData(`Port ${port}: timeout (${time}ms)\n`);
      checkComplete();
    }, 5000);
    
    socket.connect(port, host, () => {
      const connectionTime = Date.now() - startTime;
      clearTimeout(timeout);
      socket.destroy();
      results.push({ port, status: 'open', time: connectionTime });
      completed++;
      onData(`Port ${port}: open (${connectionTime}ms)\n`);
      checkComplete();
    });
    
    socket.on('error', () => {
      const connectionTime = Date.now() - startTime;
      clearTimeout(timeout);
      results.push({ port, status: 'closed', time: connectionTime });
      completed++;
      onData(`Port ${port}: closed (${connectionTime}ms)\n`);
      checkComplete();
    });
  };
  
  const checkComplete = () => {
    if (completed === commonPorts.length) {
      const openPorts = results.filter(r => r.status === 'open');
      if (openPorts.length > 0) {
        const avgTime = Math.round(openPorts.reduce((sum, p) => sum + p.time, 0) / openPorts.length);
        onData(`\nAverage connection time: ${avgTime}ms\n`);
        onData(`Host is reachable via TCP on ${openPorts.length} tested ports\n`);
      } else {
        onData(`\nNo TCP connections successful on tested ports\n`);
      }
      onEnd();
    }
  };
  
  commonPorts.forEach(testPortWithTiming);
};

module.exports = { pingHost, tracerouteHost, pingHostStream, tracerouteHostStream };
