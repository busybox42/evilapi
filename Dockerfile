# Use an official Node.js Alpine image
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Install system dependencies
RUN apk update && apk add --no-cache iputils bind-tools memcached libcap traceroute

# Set capabilities on traceroute to allow it to run without full root privileges
RUN setcap cap_net_raw+ep /usr/bin/traceroute

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

# Note on SSL:
# If you're using SSL, it's recommended to mount the SSL certificates and keys
# as volumes from the host machine to avoid including them in the Docker image.
# This can be done using the Docker run command and not in the Dockerfile.
# Example:
# docker run -p 3011:3011 -p 8080:8080 \
#   -e PORT=3011 \
#   -e WEB_SERVER_HOST=http://localhost \
#   -e WEB_SERVER_PORT=8080 \
#   -v /path/to/your/ssl:/opt/evilcrypt/ssl \
#   my-nodejs-api
