#!/bin/bash

# Production deployment script for YouTube Downloader

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting YouTube Downloader Production Deployment${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate

# Install/upgrade dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Create downloads directory
echo -e "${YELLOW}Creating downloads directory...${NC}"
mkdir -p downloads

# Set proper permissions
echo -e "${YELLOW}Setting permissions...${NC}"
chmod 755 downloads
chmod +x deploy.sh

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${YELLOW}To start the production server:${NC}"
echo -e "  gunicorn --config gunicorn.conf.py wsgi:app"
echo ""
echo -e "${YELLOW}To start with custom settings:${NC}"
echo -e "  gunicorn --bind 0.0.0.0:8000 --workers 4 wsgi:app"
echo ""
echo -e "${YELLOW}To run in background:${NC}"
echo -e "  nohup gunicorn --config gunicorn.conf.py wsgi:app &"
