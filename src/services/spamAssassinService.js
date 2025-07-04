const { spawn } = require("child_process");

const scanEmailWithSpamAssassin = (emailContent) => {
  return new Promise((resolve, reject) => {
    // Validate input
    if (!emailContent || typeof emailContent !== 'string') {
      return reject(new Error('Invalid email content provided'));
    }

    // Include the '-R' flag when spawning the spamc process
    const spamc = spawn("spamc", ["-R"]);

    let result = "";
    let error = "";

    // Set a timeout for the process
    const timeout = setTimeout(() => {
      spamc.kill('SIGTERM');
      reject(new Error('SpamAssassin scan timed out after 30 seconds'));
    }, 30000);

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
      clearTimeout(timeout);
      
      if (code === 0) {
        try {
          const parsedResult = parseSpamAssassinResult(result);
          resolve(parsedResult);
        } catch (parseError) {
          reject(new Error(`Failed to parse SpamAssassin result: ${parseError.message}. Raw output: ${result}`));
        }
      } else {
        reject(new Error(`spamc exited with code ${code}. Error: ${error}. Output: ${result}`));
      }
    });

    // Handle any errors spawning the process
    spamc.on("error", (spawnError) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn spamc: ${spawnError.message}`));
    });

    // Write the email content to spamc's stdin and close it to execute
    try {
      spamc.stdin.write(emailContent);
      spamc.stdin.end();
    } catch (writeError) {
      clearTimeout(timeout);
      reject(new Error(`Failed to write to spamc stdin: ${writeError.message}`));
    }
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
    return parsedResult;
  }

  // The first line contains the score and required score, extract it
  const scoreLine = lines[0];
  if (scoreLine) {
    const scoreMatch = scoreLine.match(/([-\d.]+)\/(\d+\.?\d*)/);
    if (scoreMatch) {
      parsedResult.score = `${scoreMatch[1]} / ${scoreMatch[2]}`;
    } else {
      // If no score format found, use the whole line as score
      parsedResult.score = scoreLine;
    }
  }

  // The decision is typically on the second line
  if (lines.length > 1) {
    parsedResult.decision = lines[1];
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
  } else {
    // If no detailed analysis, try to extract basic rule info from simple format
    // Look for lines that might contain rule information
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (line && !line.startsWith("(") && !line.startsWith("Content")) {
        const ruleMatch = line.match(/(-?\d+\.\d+)\s+(\S+)\s*(.*)/);
        if (ruleMatch) {
          parsedResult.details.push({
            points: ruleMatch[1],
            ruleName: ruleMatch[2],
            description: ruleMatch[3] || "No description available",
          });
        }
      }
    }
  }

  return parsedResult;
};

module.exports = { scanEmailWithSpamAssassin };
