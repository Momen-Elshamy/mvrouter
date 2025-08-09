#!/bin/bash

# DigitalOcean Droplet Deployment Script for Hive Router
# This script should be run on your DigitalOcean Droplet

set -e

echo "🚀 Starting Hive Router deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not installed
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
APP_DIR="/opt/hive-router"
echo "📁 Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Create environment file
echo "🔐 Creating environment file..."
cat > $APP_DIR/.env << EOF
# Application Environment
NODE_ENV=production
PORT=3000

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-here-change-this
NEXTAUTH_URL=http://your-domain.com

# Database Configuration
MONGODB_URI=your-mongodb-connection-string

# API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
PROVIDER_API_KEY_OPENAI=your-provider-openai-api-key
PROVIDER_API_KEY_GEMINI=your-provider-gemini-api-key

# Application Settings
NEXT_TELEMETRY_DISABLED=1
HOSTNAME=0.0.0.0

# Optional: Logging
LOG_LEVEL=info

# Optional: Performance
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30000

# Optional: Security
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

echo "⚠️  Please edit $APP_DIR/.env with your actual environment variables"

# Create docker-compose.yml
echo "🐳 Creating docker-compose.yml..."
cat > $APP_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  hive-router:
    image: your-dockerhub-username/hive-router:latest
    ports:
      - "80:3000"
    environment:
      # Application Environment
      - NODE_ENV=production
      - PORT=3000
      
      # NextAuth Configuration
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      
      # Database Configuration
      - MONGODB_URI=${MONGODB_URI}
      
      # API Keys
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - PROVIDER_API_KEY_OPENAI=${PROVIDER_API_KEY_OPENAI}
      - PROVIDER_API_KEY_GEMINI=${PROVIDER_API_KEY_GEMINI}
      
      # Application Settings
      - NEXT_TELEMETRY_DISABLED=1
      - HOSTNAME=0.0.0.0
      
      # Optional: Logging
      - LOG_LEVEL=${LOG_LEVEL:-info}
      
      # Optional: Performance
      - MAX_CONCURRENT_REQUESTS=${MAX_CONCURRENT_REQUESTS:-100}
      - REQUEST_TIMEOUT=${REQUEST_TIMEOUT:-30000}
      
      # Optional: Security
      - CORS_ORIGIN=${CORS_ORIGIN:-*}
      - RATE_LIMIT_WINDOW=${RATE_LIMIT_WINDOW:-900000}
      - RATE_LIMIT_MAX=${RATE_LIMIT_MAX:-100}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/auth/me"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "com.hive-router.description=Hive Router API Service"
      - "com.hive-router.version=1.0.0"
      - "com.hive-router.maintainer=your-email@example.com"
EOF

# Create systemd service
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/hive-router.service > /dev/null << EOF
[Unit]
Description=Hive Router Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "🚀 Enabling and starting Hive Router service..."
sudo systemctl enable hive-router.service
sudo systemctl start hive-router.service

echo "✅ Deployment completed!"
echo "📊 Check service status: sudo systemctl status hive-router"
echo "📝 View logs: sudo journalctl -u hive-router -f"
echo "🌐 Your application should be available at: http://$(curl -s ifconfig.me)" 