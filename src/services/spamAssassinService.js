const { spawn } = require("child_process");

const scanEmailWithSpamAssassin = (emailContent) => {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!emailContent || typeof emailContent !== 'string') {
      return reject(new Error('Invalid email content provided'));
    }

    // Limit content size to prevent EPIPE errors
    const maxSize = 1024 * 1024; // 1MB limit
    if (emailContent.length > maxSize) {
      return resolve({
        score: "N/A",
        decision: "Content Too Large",
        details: [{
          points: "N/A",
          ruleName: "SIZE_LIMIT",
          description: `Email content exceeds ${Math.round(maxSize/(1024*1024))}MB limit for spam scanning. Large emails may cause processing issues in containerized environments.`
        }]
      });
    }

    // Include the '-R' flag when spawning the spamc process
    const spamc = spawn("spamc", ["-R"], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let result = "";
    let error = "";
    let processCompleted = false;
    let writeCompleted = false;

    // Set a timeout for the process
    const timeout = setTimeout(() => {
      if (!processCompleted) {
        spamc.kill('SIGKILL'); // Use SIGKILL for more forceful termination
        processCompleted = true;
        resolve({
          score: "Timeout",
          decision: "Scan Timeout",
          details: [{
            points: "N/A",
            ruleName: "TIMEOUT",
            description: "SpamAssassin scan timed out - this may indicate server overload or configuration issues."
          }]
        });
      }
    }, 10000); // Reduced timeout to 10 seconds

    // Collect data from stdout
    spamc.stdout.on("data", (data) => {
      result += data.toString();
    });

    // Collect data from stderr
    spamc.stderr.on("data", (data) => {
      error += data.toString();
    });

    // Handle process exit
    spamc.on("exit", (code) => {
      if (processCompleted) return; // Already handled by timeout
      
      clearTimeout(timeout);
      processCompleted = true;
      
      if (code === 0) {
        try {
          const parsedResult = parseSpamAssassinResult(result);
          resolve(parsedResult);
        } catch (parseError) {
          resolve({
            score: "Parse Error",
            decision: "Unable to Parse Results",
            details: [{
              points: "N/A",
              ruleName: "PARSE_ERROR",
              description: "Could not parse SpamAssassin output format."
            }]
          });
        }
      } else {
        // SpamAssassin process failed
        resolve({
          score: "Error",
          decision: "Scan Failed",
          details: [{
            points: "N/A",
            ruleName: "PROCESS_ERROR",
            description: `SpamAssassin process exited with error code ${code}.`
          }]
        });
      }
    });

    // Handle any errors spawning the process
    spamc.on("error", (spawnError) => {
      if (processCompleted) return;
      
      clearTimeout(timeout);
      processCompleted = true;
      resolve({
        score: "Unavailable",
        decision: "Service Unavailable",
        details: [{
          points: "N/A",
          ruleName: "SERVICE_ERROR",
          description: "SpamAssassin service is not available."
        }]
      });
    });

    // More robust stdin writing with better error handling
    const writeToStdin = () => {
      if (processCompleted) return;
      
      try {
        // Check if stdin is writable
        if (!spamc.stdin || !spamc.stdin.writable) {
          if (!processCompleted) {
            processCompleted = true;
            clearTimeout(timeout);
            resolve({
              score: "Communication Error",
              decision: "Cannot Send Content",
              details: [{
                points: "N/A",
                ruleName: "STDIN_ERROR",
                description: "SpamAssassin process closed stdin before content could be sent."
              }]
            });
          }
          return;
        }

        // For large emails, write in chunks to prevent EPIPE
        if (emailContent.length > 100 * 1024) { // 100KB threshold for chunking
          writeInChunks();
        } else {
          // Small emails can be written in one go
          const writeSuccess = spamc.stdin.write(emailContent, 'utf8');
          
          if (writeSuccess) {
            spamc.stdin.end();
            writeCompleted = true;
          } else {
            spamc.stdin.once('drain', () => {
              if (!processCompleted && spamc.stdin && spamc.stdin.writable) {
                spamc.stdin.end();
                writeCompleted = true;
              }
            });
          }
        }
        
      } catch (writeError) {
        if (!processCompleted) {
          processCompleted = true;
          clearTimeout(timeout);
          resolve({
            score: "Write Error",
            decision: "Cannot Write Content",
            details: [{
              points: "N/A",
              ruleName: "WRITE_ERROR",
              description: "Failed to write email content to SpamAssassin service."
            }]
          });
        }
      }
    };

    // Chunked writing for large emails
    const writeInChunks = () => {
      const chunkSize = 32 * 1024; // Smaller 32KB chunks for better stability
      let offset = 0;
      let writeTimeout;
      
      const writeNextChunk = () => {
        if (processCompleted || !spamc.stdin || !spamc.stdin.writable) {
          if (writeTimeout) clearTimeout(writeTimeout);
          return;
        }
        
        if (offset >= emailContent.length) {
          // All data written, close stdin
          if (writeTimeout) clearTimeout(writeTimeout);
          spamc.stdin.end();
          writeCompleted = true;
          return;
        }
        
        const chunk = emailContent.slice(offset, offset + chunkSize);
        offset += chunkSize;
        
        // Set timeout for this chunk write
        writeTimeout = setTimeout(() => {
          if (!processCompleted && !writeCompleted) {
            processCompleted = true;
            clearTimeout(timeout);
            resolve({
              score: "Timeout",
              decision: "Write Timeout",
              details: [{
                points: "N/A",
                ruleName: "WRITE_TIMEOUT",
                description: "Email content was too large to process within timeout limits."
              }]
            });
          }
        }, 5000); // 5 second timeout per chunk
        
        const writeSuccess = spamc.stdin.write(chunk, 'utf8');
        
        if (writeSuccess) {
          // Can write more immediately
          clearTimeout(writeTimeout);
          setImmediate(writeNextChunk);
        } else {
          // Buffer is full, wait for drain
          spamc.stdin.once('drain', () => {
            clearTimeout(writeTimeout);
            writeNextChunk();
          });
        }
      };
      
      writeNextChunk();
    };

    // Handle stdin errors more comprehensively
    spamc.stdin.on('error', (stdinError) => {
      if (!processCompleted) {
        processCompleted = true;
        clearTimeout(timeout);
        resolve({
          score: "Communication Error",
          decision: "Cannot Send Content",
          details: [{
            points: "N/A",
            ruleName: "STDIN_ERROR",
            description: "Failed to send content to SpamAssassin (broken pipe or process closed)."
          }]
        });
      }
    });

    // Handle stdin close events
    spamc.stdin.on('close', () => {
      writeCompleted = true;
    });

    // Start writing after a small delay to ensure process is ready
    setTimeout(writeToStdin, 100);
  });
};

const parseSpamAssassinResult = (result) => {
  // Initialize an object to hold the parsed data
  const parsedResult = {
    score: "",
    decision: "",
    details: [],
  };

  // Split the output into lines for easier processing
  const lines = result.split("\n").map(line => line.trim()).filter(line => line);

  if (lines.length === 0) {
    return {
      score: "No Output",
      decision: "Empty Response",
      details: []
    };
  }

  // The first line contains the score and required score, extract it
  const scoreLine = lines[0];
  if (scoreLine) {
    const scoreMatch = scoreLine.match(/([-\d.]+)\/(\d+\.?\d*)/);
    if (scoreMatch) {
      parsedResult.score = `${scoreMatch[1]} / ${scoreMatch[2]}`;
      
      // Determine decision based on score
      const score = parseFloat(scoreMatch[1]);
      const threshold = parseFloat(scoreMatch[2]);
      
      if (threshold === 0) {
        // No rules loaded, can't determine spam status
        parsedResult.decision = "Scan Complete (No Rules)";
      } else if (score >= threshold) {
        parsedResult.decision = "Spam Detected";
      } else if (score > 0) {
        parsedResult.decision = "Suspicious Content";
      } else {
        parsedResult.decision = "Clean";
      }
    } else {
      // If no score format found, use the whole line as score
      parsedResult.score = scoreLine;
      parsedResult.decision = "Unknown";
    }
  }

  // Extract content analysis details if present
  const detailsIndex = lines.findIndex((line) =>
    line.startsWith("Content analysis details:")
  );
  
  if (detailsIndex !== -1) {
    const detailsLines = lines.slice(detailsIndex + 2); // Skip the summary line
    for (const line of detailsLines) {
      const detailMatch = line.match(/(-?\d+\.\d+)\s+(\S+)\s+(.*)/);
      if (detailMatch) {
        parsedResult.details.push({
          points: detailMatch[1],
          ruleName: detailMatch[2],
          description: detailMatch[3],
        });
      }
    }
  }

  return parsedResult;
};

module.exports = {
  scanEmailWithSpamAssassin,
};
