#!/bin/bash

# Production Deployment Script for YouTube Downloader
# This script handles the deployment process for both frontend and backend

set -e

echo "🚀 Starting YouTube Downloader deployment..."

# Configuration
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for Docker Compose (both v1 and v2)
if ! docker compose version &> /dev/null; then
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    else
        COMPOSE_CMD="docker-compose"
    fi
else
    COMPOSE_CMD="docker compose"
fi

print_status "Docker and Docker Compose are available"

# Check if environment files exist
if [ ! -f ".env.production" ]; then
    print_warning "Production environment file not found. Creating from template..."
    cp .env.local .env.production
    print_warning "Please edit .env.production with your production settings"
fi

# Build and start services
print_status "Building Docker images..."
$COMPOSE_CMD -f $COMPOSE_FILE build --no-cache

print_status "Starting services..."
$COMPOSE_CMD -f $COMPOSE_FILE up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
if $COMPOSE_CMD -f $COMPOSE_FILE ps | grep -q "Up"; then
    print_status "Services are running successfully!"
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Service Status:"
    $COMPOSE_CMD -f $COMPOSE_FILE ps
    echo ""
    echo "🌐 Access your application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "📝 To view logs:"
    echo "   $COMPOSE_CMD logs -f [service_name]"
    echo ""
    echo "🛑 To stop services:"
    echo "   $COMPOSE_CMD down"
    
else
    print_error "Some services failed to start. Check the logs:"
    $COMPOSE_CMD -f $COMPOSE_FILE logs
    exit 1
fi
