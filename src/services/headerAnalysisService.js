const { simpleParser } = require("mailparser");

async function parseRawHeaders(rawHeaders) {
  const mail = await simpleParser(rawHeaders);
  return mail.headers;
}

function analyzeSpf(headers) {
  const spfHeader = headers.get("received-spf");
  if (!spfHeader) {
    return "No SPF Record";
  }
  return spfHeader.includes("pass") ? "Pass" : "Fail";
}

function analyzeDkim(headers) {
  const dkimHeader = headers.get("authentication-results");
  if (!dkimHeader) {
    return "No DKIM Record";
  }
  return dkimHeader.includes("dkim=pass") ? "Pass" : "Fail";
}

function analyzeDmarc(headers) {
  const dmarcHeader = headers.get("authentication-results");
  if (!dmarcHeader) {
    return "No DMARC Record";
  }
  return dmarcHeader.includes("dmarc=pass") ? "Pass" : "Fail";
}

function formatAddress(headerValue) {
  if (!headerValue || !headerValue.value || !Array.isArray(headerValue.value)) {
    return "No Address";
  }

  return headerValue.value
    .map(({ name, address }) => {
      return name ? `${name} <${address}>` : address;
    })
    .join(", ");
}

function extractHeader(headers, headerName) {
  const header = headers.get(headerName.toLowerCase());
  if (!header) {
    return `No ${headerName} Header`;
  }

  if (
    headerName.toLowerCase() === "to" ||
    headerName.toLowerCase() === "from"
  ) {
    return formatAddress(header);
  }

  return header;
}

function extractReceivedHeaders(headers) {
  const received = headers.get("received");
  if (!received) {
    return [];
  }

  const receivedStr = Array.isArray(received) ? received.join("\n") : received;
  return receivedStr.split("\n");
}

function parseDateFromReceivedHeader(header) {
  const dateRegex = /;\s*(.+)$/;
  const dateMatch = header.match(dateRegex);
  if (dateMatch) {
    try {
      const parsedDate = new Date(dateMatch[1].trim());
      return parsedDate;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  }
  return null;
}

function calculateReceivedDelays(receivedHeaders) {
  let delays = [];
  let totalTime = 0;
  let previousDate = null;

  // Reverse the headers to process them in chronological order
  receivedHeaders = receivedHeaders.reverse();

  receivedHeaders.forEach((header, index) => {
    const date = parseDateFromReceivedHeader(header);
    if (date) {
      const hostMatch = /from\s+([\S]+)\s+\(/.exec(header);
      const host = hostMatch ? hostMatch[1] : "Unknown Host";

      if (index > 0 && previousDate) {
        // Calculate delay from the previous hop
        const delay = (date - previousDate) / 1000;
        totalTime += delay;

        delays.push({
          hop: index + 1,
          header: header.split(" ")[0],
          delay: `${delay.toFixed(2)}s`,
          host: host,
        });
      } else {
        // First hop
        delays.push({
          hop: index + 1,
          header: header.split(" ")[0],
          delay: "0.00s",
          host: host,
        });
      }

      previousDate = date;
    }
  });

  return { delays, totalTime: `${totalTime.toFixed(2)}s` };
}

async function analyze(rawHeaders) {
  if (!rawHeaders) {
    return { error: "No header data provided" };
  }

  const headers = await parseRawHeaders(rawHeaders);
  const receivedHeaders = extractReceivedHeaders(headers);
  const { delays, totalTime } = calculateReceivedDelays(receivedHeaders);

  // Create a Headers Found section
  const headersFound = Array.from(headers).map(([headerName, headerValue]) => {
    let value;

    // Check if header value is an object and format accordingly
    if (typeof headerValue === "object" && headerValue !== null) {
      if (
        headerName.toLowerCase() === "to" ||
        headerName.toLowerCase() === "from"
      ) {
        // Address-like headers
        value = formatAddress(headerValue);
      } else if (Array.isArray(headerValue)) {
        // Array of values
        value = headerValue.join(", ");
      } else if (headerValue.value && Array.isArray(headerValue.value)) {
        // Header with 'value' property as an array
        value = headerValue.value
          .map((val) => val.text || val.address || val)
          .join(", ");
      } else {
        // Object, but not address-like or array
        value = JSON.stringify(headerValue);
      }
    } else {
      // String or other simple types
      value = headerValue.toString();
    }

    return { headerName, headerValue: value };
  });

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
    headersFound,
  };
}

module.exports = {
  analyze,
};
