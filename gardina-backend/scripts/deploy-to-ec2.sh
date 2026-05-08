#!/bin/bash

# 🚀 Gardina backend deployment script to AWS EC2
# Usage: ./scripts/deploy-to-ec2.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_HOST="13.62.193.249"
EC2_USER="ubuntu"
EC2_KEY="$HOME/.ssh/prometric-key.pem"
APP_NAME="gardina-backend"
REMOTE_DIR="/home/ubuntu/gardina-backend"

echo -e "${GREEN}🚀 Starting Gardina backend deployment to EC2...${NC}"
echo ""

# 1. Check if SSH key exists
if [ ! -f "$EC2_KEY" ]; then
    echo -e "${RED}❌ SSH key not found: $EC2_KEY${NC}"
    exit 1
fi

# 2. Build archive
echo -e "${YELLOW}📦 Creating deployment archive...${NC}"
ARCHIVE_NAME="gardina-backend-$(date +%Y%m%d-%H%M%S).tar.gz"
ARCHIVE_PATH="/tmp/$ARCHIVE_NAME"

tar --exclude='node_modules' \
    --exclude='coverage' \
    --exclude='logs' \
    --exclude='.git' \
    --exclude='.env' \
    --exclude='*.log' \
    -czf "$ARCHIVE_PATH" .

echo -e "${GREEN}✅ Archive created: $ARCHIVE_PATH${NC}"

# 3. Upload to EC2
echo ""
echo -e "${YELLOW}⬆️  Uploading to EC2...${NC}"
scp -i "$EC2_KEY" "$ARCHIVE_PATH" "$EC2_USER@$EC2_HOST:/tmp/"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload successful${NC}"
else
    echo -e "${RED}❌ Upload failed${NC}"
    rm "$ARCHIVE_PATH"
    exit 1
fi

# 4. Deploy on server
echo ""
echo -e "${YELLOW}🔄 Deploying on server...${NC}"

ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" << ENDSSH
set -e

echo "📂 Extracting archive..."
cd $REMOTE_DIR
tar -xzf /tmp/$ARCHIVE_NAME

echo "📦 Installing dependencies..."
npm install --production --silent

echo "🔄 Restarting PM2 process..."
pm2 restart $APP_NAME

echo "⏳ Waiting for application to start..."
sleep 3

echo "✅ Checking application status..."
pm2 info $APP_NAME | grep -A 1 "status"

echo ""
echo "🧹 Cleaning up..."
rm /tmp/$ARCHIVE_NAME

echo ""
echo "✅ Deployment complete!"
ENDSSH

# 5. Cleanup local archive
rm "$ARCHIVE_PATH"

# 6. Test deployment
echo ""
echo -e "${YELLOW}🧪 Testing deployment...${NC}"
HEALTH_CHECK=$(curl -s "http://$EC2_HOST/gardina/health" | grep -o '"status":"healthy"' || echo "")

if [ -n "$HEALTH_CHECK" ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo -e "${GREEN}🎉 Deployment successful!${NC}"
else
    echo -e "${RED}⚠️  Health check failed - please check logs${NC}"
fi

echo ""
echo "📊 Application info:"
echo "   - Health: http://$EC2_HOST/gardina/health"
echo "   - API: http://$EC2_HOST/gardina/api"
echo ""
echo "📝 View logs: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'pm2 logs $APP_NAME'"
echo ""
