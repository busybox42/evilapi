#!/bin/bash
# Revert and properly fix the docker-compose issue

# First, checkout the original script
git checkout HEAD~1 scripts/deploy.sh

# Now apply a more targeted fix - only replace the command usage
# We'll use a different approach - set the DOCKER_COMPOSE variable and use it properly
sed -i '/check_dependencies() {/,/^}$/ {
    /print_status "Using docker-compose:/c\
    DOCKER_COMPOSE="$(which docker-compose)"\
    print_status "Using docker-compose: $DOCKER_COMPOSE"
}' scripts/deploy.sh

# Replace specific patterns where docker-compose is used as a command
sed -i 's/docker-compose -f "\$compose_file"/$DOCKER_COMPOSE -f "$compose_file"/g' scripts/deploy.sh
sed -i 's/docker-compose -f docker-compose\.yml/$DOCKER_COMPOSE -f docker-compose.yml/g' scripts/deploy.sh
sed -i 's/docker-compose -f docker-compose\.dev\.yml/$DOCKER_COMPOSE -f docker-compose.dev.yml/g' scripts/deploy.sh

echo "Fixed docker-compose paths properly"
