# Use an official Node.js Alpine image
FROM node:current-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install system dependencies
RUN apk update && apk add --no-cache iputils bind-tools memcached libcap traceroute spamassassin spamassassin-client \
    git bash openssl perl \
    python3 py3-pip py3-openssl

# Install Python dependencies for SSL scanner
RUN pip install --break-system-packages requests pyOpenSSL

# Set capabilities on ping and traceroute to allow them to run without full root privileges
RUN setcap cap_net_raw+ep /usr/bin/traceroute
RUN setcap cap_net_raw+ep /bin/ping

RUN /usr/bin/sa-update -D || true

# Install testssl.sh
RUN git clone --depth 1 https://github.com/drwetter/testssl.sh.git /usr/local/bin/testssl.sh && \
    chmod +x /usr/local/bin/testssl.sh/testssl.sh

# Before copying package.json and installing dependencies,
# create the non-root user and change ownership of the work directory.
RUN adduser -D nonrootuser && chown -R nonrootuser:nonrootuser /usr/src/app

# Now switch to the non-root user
USER nonrootuser

# Copy package.json and package-lock.json (if available) to the working directory
COPY --chown=nonrootuser package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of your application code with correct ownership
COPY --chown=nonrootuser . .

# Copy the start script and make sure it is executable
COPY --chown=nonrootuser start.sh .
RUN chmod +x start.sh

# Expose the application port and the web server port
EXPOSE 3011 8080

# Start the application using the script
CMD ["./start.sh"]
