# EvilAPI Production Deployment Guide - Rocky Linux 9 ARM64

## Overview
Deploy EvilAPI to production on Rocky Linux 9 ARM64 with SSL certificates for `example.com` and `www.example.com`.

## Prerequisites

### 1. Server Requirements
- Rocky Linux 9 ARM64 server with root access
- Docker and Docker Compose installed ✅ (you have this)
- Ports 80 and 443 open in firewall
- At least 2GB RAM and 20GB disk space

### 2. Domain Configuration
Configure your DNS records to point both domains to your server:

```
example.com       A    YOUR_SERVER_IP
www.example.com   A    YOUR_SERVER_IP
```

**Wait for DNS propagation** (can take up to 24 hours, check with `nslookup example.com`)

### 3. System Preparation (Rocky Linux 9 specific)
```bash
# Update system
sudo dnf update -y

# Install additional tools if needed
sudo dnf install -y curl wget git openssl

# Verify Docker is running
sudo systemctl status docker
sudo systemctl enable docker

# Add user to docker group if needed
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### 4. Firewall Configuration (firewalld)
```bash
# Check firewall status
sudo firewall-cmd --state

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall
sudo firewall-cmd --reload

# Verify rules
sudo firewall-cmd --list-all
```

### 5. SELinux Considerations
```bash
# Check SELinux status
getenforce

# If SELinux is enforcing, you may need to allow network connections
sudo setsebool -P httpd_can_network_connect 1
sudo setsebool -P httpd_can_network_relay 1
```

## Deployment Steps

### 1. Clone and Setup
```bash
# Clone repository
git clone https://github.com/yourusername/evilapi.git
cd evilapi

# Create configuration
cp src/config/config.js.example src/config/config.js
# Edit config.js with your settings if needed
```

### 2. Deploy to Production
```bash
# Option A: Quick deployment with SSL
DOMAIN=example.com EMAIL=admin@example.com make deploy-ssl

# Option B: Manual step-by-step deployment
make deploy
./scripts/setup-ssl.sh example.com admin@example.com www.example.com
```

### 3. Verify Deployment
```bash
# Check service status
make deploy-status

# Check logs
make deploy-logs

# Test endpoints
curl -I https://example.com/api/health
curl -I https://www.example.com/api/health
```

## Rocky Linux 9 Specific Configuration

### Docker Service Management
```bash
# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Check Docker status
sudo systemctl status docker

# View Docker logs if needed
sudo journalctl -u docker.service
```

### Firewall Management (firewalld)
```bash
# Check current zones
sudo firewall-cmd --get-active-zones

# Add custom ports if needed
sudo firewall-cmd --permanent --add-port=3011/tcp  # Direct API access
sudo firewall-cmd --reload

# List all rules
sudo firewall-cmd --list-all
```

### SELinux Troubleshooting
If you encounter permission issues:
```bash
# Check SELinux denials
sudo ausearch -m avc -ts recent

# Common SELinux fixes for Docker
sudo setsebool -P container_manage_cgroup 1
sudo setsebool -P httpd_can_network_connect 1

# If needed, create custom SELinux policy
sudo audit2allow -a
```

### System Monitoring
```bash
# Check system resources
top
htop  # if installed
free -h
df -h

# Monitor Docker containers
docker stats
```

## ARM64 Specific Considerations

### Docker Image Compatibility
The deployment should work seamlessly on ARM64 as the images are multi-arch:
- `nginx:alpine` - supports ARM64
- `certbot/certbot` - supports ARM64
- Node.js base images - support ARM64

### Performance Optimization
```bash
# Check CPU info
lscpu

# Monitor system performance
iostat -x 1
vmstat 1
```

## Management Commands

### Basic Operations
```bash
# Start services
make deploy

# Stop services
make deploy-stop

# Restart services
make deploy-restart

# View logs
make deploy-logs

# Check status
make deploy-status

# Update application
make deploy-update
```

### SSL Management
```bash
# Setup SSL certificates
./scripts/setup-ssl.sh example.com admin@example.com www.example.com

# Renew certificates
make ssl-renew

# Check certificate status
make ssl-status
```

## Rocky Linux 9 Troubleshooting

### 1. Docker Permission Issues
```bash
# If you get permission denied errors
sudo chown $USER:$USER /var/run/docker.sock
# Or add user to docker group
sudo usermod -aG docker $USER
```

### 2. Firewall Issues
```bash
# Check if firewall is blocking connections
sudo firewall-cmd --list-all
curl -I http://YOUR_SERVER_IP

# Test from another machine
telnet YOUR_SERVER_IP 80
telnet YOUR_SERVER_IP 443
```

### 3. SELinux Issues
```bash
# Temporarily disable SELinux for testing
sudo setenforce 0

# Check if containers can start
docker-compose up -d

# Re-enable SELinux
sudo setenforce 1
```

### 4. DNS Issues
```bash
# Test DNS resolution
nslookup example.com
dig example.com

# Test from different DNS servers
nslookup example.com 8.8.8.8
nslookup example.com 1.1.1.1
```

## System Service Integration

### Create systemd service (optional)
```bash
# Create service file
sudo tee /etc/systemd/system/evilapi.service << EOF
[Unit]
Description=EvilAPI Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/evilapi
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable evilapi
sudo systemctl start evilapi
```

## Success Verification

After deployment, verify these work:
- ✅ `https://example.com` - Loads EvilAPI interface
- ✅ `https://www.example.com` - Loads EvilAPI interface  
- ✅ `http://example.com` - Redirects to HTTPS
- ✅ `https://example.com/api/health` - Returns API health status
- ✅ SSL certificate is valid and trusted
- ✅ All EvilAPI tools function correctly

## Rocky Linux 9 Support

Your setup is ideal for this deployment:
- ✅ Rocky Linux 9 ARM64 - Excellent choice for production
- ✅ Docker Compose - Ready to deploy
- ✅ ARM64 architecture - All images support this

## Quick Start Command

Since you have everything ready, you can deploy immediately:

```bash
# Clone and deploy in one go
git clone https://github.com/yourusername/evilapi.git
cd evilapi
cp src/config/config.js.example src/config/config.js

# Deploy with SSL
DOMAIN=example.com EMAIL=admin@example.com make deploy-ssl
```

Your EvilAPI will be live at:
- **https://example.com**
- **https://www.example.com**

## Additional Rocky Linux 9 Resources

- **Package Management**: `dnf` instead of `apt`
- **Firewall**: `firewalld` instead of `ufw`
- **SELinux**: May need configuration for containers
- **systemd**: Full systemd support for service management 