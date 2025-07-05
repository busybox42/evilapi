#!/bin/bash
# Fix the docker-compose paths properly - only replace the command, not filenames

# First, revert the previous fix
git checkout scripts/deploy.sh

# Now apply the correct fix - only replace standalone docker-compose commands
# Use word boundaries to avoid replacing filenames
sed -i 's/\bdocker-compose\b/\/usr\/local\/bin\/docker-compose/g' scripts/deploy.sh

echo "Fixed docker-compose paths properly"
