const { spawn } = require("child_process");

const scanEmailWithSpamAssassin = (emailContent) => {
  return new Promise((resolve, reject) => {
    // Include the '-R' flag when spawning the spamc process
    const spamc = spawn("spamc", ["-R"]);

    let result = "";
    let error = "";

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
      if (code === 0) {
        resolve(parseSpamAssassinResult(result));
      } else {
        reject(new Error(`spamc exited with code ${code}: ${error}`));
      }
    });

    // Handle any errors spawning the process
    spamc.on("error", (spawnError) => {
      reject(spawnError);
    });

    // Write the email content to spamc's stdin and close it to execute
    spamc.stdin.write(emailContent);
    spamc.stdin.end();
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
  const lines = result.split("\n");

  // The first line contains the score and required score, extract it
  const scoreLine = lines[0].trim();
  if (scoreLine) {
    const scoreMatch = scoreLine.match(/([-\d.]+)\/(\d.+)/);
    if (scoreMatch) {
      parsedResult.score = `${scoreMatch[1]} / ${scoreMatch[2]}`;
    }
  }

  // The decision is in the second and third lines, but we'll just reference it for clarity
  parsedResult.decision = lines.slice(1, 3).join(" ").trim();

  // Extract content analysis details
  const detailsIndex = lines.findIndex((line) =>
    line.startsWith("Content analysis details:")
  );
  if (detailsIndex !== -1) {
    const detailsLines = lines.slice(detailsIndex + 2); // Skip the summary line
    for (const line of detailsLines) {
      const detailMatch = line.trim().match(/(-?\d+\.\d) (\S+) +(.*)/);
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

module.exports = { scanEmailWithSpamAssassin };
