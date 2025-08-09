# Docker Deployment Guide for Hive Router

This guide will help you deploy your Hive Router application to Docker Hub and then to a DigitalOcean Droplet.

## Prerequisites

- Docker installed on your local machine
- Docker Hub account
- DigitalOcean account
- MongoDB database (Atlas or self-hosted)

## Step 1: Build and Push to Docker Hub

### 1.1 Login to Docker Hub
```bash
docker login
```

### 1.2 Build the Docker Image
```bash
# Build the image
docker build -t your-dockerhub-username/hive-router:latest .

# Test the image locally
docker run -p 3000:3000 your-dockerhub-username/hive-router:latest
```

### 1.3 Push to Docker Hub
```bash
# Push the image
docker push your-dockerhub-username/hive-router:latest

# Tag with version (optional)
docker tag your-dockerhub-username/hive-router:latest your-dockerhub-username/hive-router:v1.0.0
docker push your-dockerhub-username/hive-router:v1.0.0
```

## Step 2: Deploy to DigitalOcean Droplet

### 2.1 Create a DigitalOcean Droplet

1. Go to [DigitalOcean](https://cloud.digitalocean.com/)
2. Click "Create" → "Droplets"
3. Choose Ubuntu 22.04 LTS
4. Select a plan (Basic → Regular → $6/month minimum)
5. Choose a datacenter region close to your users
6. Add your SSH key or create a password
7. Click "Create Droplet"

### 2.2 Connect to Your Droplet

```bash
# SSH into your droplet (replace with your droplet's IP)
ssh root@your-droplet-ip

# Or if you created a user
ssh your-username@your-droplet-ip
```

### 2.3 Run the Deployment Script

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/your-username/hive-router/main/deploy.sh | bash

# Or if you have the script locally, upload it to the droplet
scp deploy.sh root@your-droplet-ip:/tmp/
ssh root@your-droplet-ip "bash /tmp/deploy.sh"
```

### 2.4 Configure Environment Variables

Edit the environment file on your droplet:

```bash
nano /opt/hive-router/.env
```

Update with your actual values:

```env
NODE_ENV=production
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://your-domain.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hive-router
OPENAI_API_KEY=sk-your-openai-api-key
```

### 2.5 Update Docker Compose File

Edit the docker-compose.yml file:

```bash
nano /opt/hive-router/docker-compose.yml
```

Replace `your-dockerhub-username` with your actual Docker Hub username.

### 2.6 Start the Application

```bash
# Navigate to the application directory
cd /opt/hive-router

# Start the application
docker-compose up -d

# Check the status
docker-compose ps

# View logs
docker-compose logs -f
```

## Step 3: Domain and SSL Setup (Optional)

### 3.1 Point Your Domain

1. Go to your domain registrar
2. Add an A record pointing to your droplet's IP address
3. Wait for DNS propagation (can take up to 48 hours)

### 3.2 Install Nginx and SSL

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/hive-router
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/hive-router /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 4: Monitoring and Maintenance

### 4.1 Check Application Status

```bash
# Check service status
sudo systemctl status hive-router

# View logs
sudo journalctl -u hive-router -f

# Check Docker containers
docker ps
docker logs hive-router_hive-router_1
```

### 4.2 Update the Application

```bash
# Pull the latest image
docker-compose pull

# Restart the service
docker-compose up -d

# Or restart the systemd service
sudo systemctl restart hive-router
```

### 4.3 Backup and Restore

```bash
# Backup environment variables
cp /opt/hive-router/.env /opt/hive-router/.env.backup

# Backup docker-compose.yml
cp /opt/hive-router/docker-compose.yml /opt/hive-router/docker-compose.yml.backup
```

## Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   ```bash
   # Check if the container is running
   docker ps
   
   # Check if port is exposed
   netstat -tlnp | grep 3000
   ```

2. **Environment variables not loading**
   ```bash
   # Check the .env file
   cat /opt/hive-router/.env
   
   # Restart the service
   sudo systemctl restart hive-router
   ```

3. **MongoDB connection issues**
   - Verify your MongoDB URI is correct
   - Check if your IP is whitelisted in MongoDB Atlas
   - Test the connection string locally

4. **SSL certificate issues**
   ```bash
   # Renew SSL certificate
   sudo certbot renew
   
   # Check certificate status
   sudo certbot certificates
   ```

### Useful Commands

```bash
# View real-time logs
docker-compose logs -f

# Restart the application
docker-compose restart

# Stop the application
docker-compose down

# Update and restart
docker-compose pull && docker-compose up -d

# Check resource usage
docker stats

# Clean up unused images
docker image prune -a
```

## Security Considerations

1. **Firewall Setup**
   ```bash
   # Install UFW
   sudo apt install ufw
   
   # Allow SSH
   sudo ufw allow ssh
   
   # Allow HTTP/HTTPS
   sudo ufw allow 80
   sudo ufw allow 443
   
   # Enable firewall
   sudo ufw enable
   ```

2. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker-compose pull
   ```

3. **Backup Strategy**
   - Set up automated backups for your MongoDB database
   - Backup your environment variables and configuration files
   - Consider using DigitalOcean's backup service

## Cost Optimization

1. **Right-size your droplet** based on actual usage
2. **Use DigitalOcean's monitoring** to track resource usage
3. **Consider reserved instances** for long-term deployments
4. **Monitor bandwidth usage** to avoid overage charges

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat /opt/hive-router/.env`
3. Test connectivity: `curl http://localhost:3000`
4. Check system resources: `htop` or `docker stats` 