function parseHeaders(rawHeaders) {
  let headers = {};
  if (!rawHeaders) {
    console.error("No headers provided for parsing");
    return headers;
  }

  const lines = rawHeaders.split("\n").reduce((acc, line) => {
    if (line.match(/^\s/) && acc.length > 0) {
      acc[acc.length - 1] += " " + line.trim();
    } else {
      acc.push(line);
    }
    return acc;
  }, []);

  lines.forEach((line) => {
    const [key, value] = line.split(/:\s+/);
    if (key && value) {
      headers[key.trim()] = value.trim();
    }
  });

  return headers;
}

function analyzeSpf(headers) {
  const spfHeader = headers["Received-SPF"];
  if (!spfHeader) {
    return "No SPF Record";
  }
  return spfHeader.includes("pass") ? "Pass" : "Fail";
}

function analyzeDkim(headers) {
  if (headers["Authentication-Results"]) {
    return headers["Authentication-Results"].includes("dkim=pass")
      ? "Pass"
      : "Fail";
  }
  return "No DKIM Record";
}

function analyzeDmarc(headers) {
  if (headers["Authentication-Results"]) {
    return headers["Authentication-Results"].includes("dmarc=pass")
      ? "Pass"
      : "Fail";
  }
  return "No DMARC Record";
}

function extractHeader(headers, headerName) {
  return headers[headerName] || `No ${headerName} Header`;
}

function extractReceivedHeaders(headers) {
  return headers["Received"] ? headers["Received"].split("\n") : [];
}

function parseDateFromReceivedHeader(header) {
  const dateRegex = /;\s*(.+)$/; // Regular expression to extract the date
  const dateMatch = header.match(dateRegex);
  if (dateMatch) {
    try {
      return new Date(dateMatch[1].trim());
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  }
  return null;
}

function calculateReceivedDelays(receivedHeaders) {
  let previousDate = null;
  let delays = [];
  let totalTime = 0;

  // Process the received headers in reverse order (from oldest to newest)
  receivedHeaders.reverse().forEach((header) => {
    const date = parseDateFromReceivedHeader(header);
    if (date) {
      if (previousDate) {
        const delay = (date - previousDate) / 1000; // Convert milliseconds to seconds
        totalTime += delay;
        delays.push({
          header: header.split(" ")[0],
          delay: `${delay.toFixed(2)}s`,
        });
      }
      previousDate = date;
    }
  });

  return { delays, totalTime: `${totalTime.toFixed(2)}s` };
}

function analyze(rawHeaders) {
  if (!rawHeaders) {
    return { error: "No header data provided" };
  }

  const headers = parseHeaders(rawHeaders);
  const receivedHeaders = extractReceivedHeaders(headers);
  const { delays, totalTime } = calculateReceivedDelays(receivedHeaders);

  return {
    subject: extractHeader(headers, "Subject"),
    to: extractHeader(headers, "To"),
    from: extractHeader(headers, "From"),
    date: extractHeader(headers, "Date"),
    spf: analyzeSpf(headers),
    dkim: analyzeDkim(headers),
    dmarc: analyzeDmarc(headers),
    receivedDelays: delays,
    totalTime: totalTime,
  };
}

module.exports = {
  analyze,
};
