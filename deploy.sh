#!/bin/bash

# ============================================
# GARDINA — AWS EC2 deployment script
# ============================================

set -e

echo "🚀 Starting Gardina deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Please run as root (sudo)${NC}"
    exit 1
fi

# ============================================
# STEP 1: Update system
# ============================================
echo -e "${GREEN}📦 Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# ============================================
# STEP 2: Install Docker if not present
# ============================================
if ! command -v docker &> /dev/null; then
    echo -e "${GREEN}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

# ============================================
# STEP 3: Install Docker Compose if not present
# ============================================
if ! command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}🐙 Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# ============================================
# STEP 4: Create directories
# ============================================
echo -e "${GREEN}📁 Creating directories...${NC}"
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p nginx/conf.d

# ============================================
# STEP 5: Initial SSL certificates (if not exist)
# ============================================
if [ ! -d "certbot/conf/live/gardina.kz" ]; then
    echo -e "${GREEN}🔐 Obtaining SSL certificates...${NC}"

    # Create temporary nginx config for certbot
    cat > nginx/conf.d/temp.conf << 'EOF'
server {
    listen 80;
    server_name gardina.kz www.gardina.kz app.gardina.kz api.gardina.kz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Waiting for SSL...';
        add_header Content-Type text/plain;
    }
}
EOF

    # Start nginx temporarily
    docker run -d --name temp-nginx \
        -p 80:80 \
        -v $(pwd)/nginx/conf.d/temp.conf:/etc/nginx/conf.d/default.conf:ro \
        -v $(pwd)/certbot/www:/var/www/certbot:ro \
        nginx:alpine

    # Wait for nginx to start
    sleep 5

    # Get certificates
    docker run --rm \
        -v $(pwd)/certbot/conf:/etc/letsencrypt \
        -v $(pwd)/certbot/www:/var/www/certbot \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email support@gardina.kz \
        --agree-tos \
        --no-eff-email \
        -d gardina.kz \
        -d www.gardina.kz \
        -d app.gardina.kz \
        -d api.gardina.kz

    # Stop temporary nginx
    docker stop temp-nginx && docker rm temp-nginx

    # Remove temporary config
    rm nginx/conf.d/temp.conf
fi

# ============================================
# STEP 6: Build and start containers
# ============================================
echo -e "${GREEN}🏗️ Building and starting containers...${NC}"
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

# ============================================
# STEP 7: Wait and check status
# ============================================
echo -e "${GREEN}⏳ Waiting for services to start...${NC}"
sleep 10

# Check status
echo -e "${GREEN}📊 Service status:${NC}"
docker-compose ps

# ============================================
# STEP 8: Health checks
# ============================================
echo -e "${GREEN}🏥 Running health checks...${NC}"

# Check backend
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

# Check nginx
if curl -s http://localhost:80 > /dev/null; then
    echo -e "${GREEN}✅ Nginx is healthy${NC}"
else
    echo -e "${RED}❌ Nginx health check failed${NC}"
fi

# ============================================
# DONE
# ============================================
echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Your services are now running:"
echo "  - Landing:  https://gardina.kz"
echo "  - App:      https://app.gardina.kz"
echo "  - API:      https://api.gardina.kz"
echo ""
echo "Useful commands:"
echo "  - View logs:    docker-compose logs -f"
echo "  - Restart:      docker-compose restart"
echo "  - Stop:         docker-compose down"
echo "  - Rebuild:      docker-compose up -d --build"
