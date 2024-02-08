#!/bin/sh

# Start memcached in daemon mode
memcached -d

# Start SpamAssassin
spamd -x &

# Check if config.js file exists and copy it there if not so the service starts
if [ ! -f "/usr/src/app/src/config/config.js" ]; then
    cp /usr/src/app/src/config/config.js.example /usr/src/app/src/config/config.js
fi

# Start the Node.js server
exec node src/server.js
