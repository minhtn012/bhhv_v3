#!/bin/bash

# BHHV Docker Deployment Script
# This script automates the deployment process for the BHHV application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.docker"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    log_info "Checking Docker installation..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker service."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    log_success "Docker and Docker Compose are available"
}

# Check if required files exist
check_files() {
    log_info "Checking required files..."

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml file not found!"
        exit 1
    fi

    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found!"
        exit 1
    fi

    if [ ! -f "package.json" ]; then
        log_error "package.json file not found!"
        exit 1
    fi

    log_success "All required files are present"
}

# Build the application
build_app() {
    log_info "Building Docker images..."

    # Build the application image
    docker-compose -f "$COMPOSE_FILE" build --no-cache app

    log_success "Docker images built successfully"
}

# Run data migration
run_migration() {
    log_info "Running database migration..."

    # Start MongoDB first if not running
    docker-compose -f "$COMPOSE_FILE" up -d mongodb

    # Wait for MongoDB to be ready
    log_info "Waiting for MongoDB to be ready..."
    sleep 10

    # Check if migration script exists and run it
    if [ -f "scripts/migrate.js" ]; then
        # Run migration in a temporary container
        docker-compose -f "$COMPOSE_FILE" run --rm app node /app/scripts/migrate.js
        log_success "Database migration completed"
    else
        log_warning "Migration script not found, skipping migration"
    fi
}

# Start the application
start_app() {
    log_info "Starting application services..."

    # Start all services
    docker-compose -f "$COMPOSE_FILE" up -d

    # Wait for services to start
    log_info "Waiting for services to start..."
    sleep 15

    # Check if services are running
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_success "Application services started successfully"

        # Display running containers
        echo
        log_info "Running containers:"
        docker-compose -f "$COMPOSE_FILE" ps

        # Display access information
        echo
        log_success "🎉 Deployment completed!"
        echo
        echo "Application is now running:"
        echo "  - Web App: http://localhost:3000"
        echo "  - MongoDB: mongodb://localhost:27018"
        echo
        echo "To view logs: docker-compose logs -f"
        echo "To stop: docker-compose down"
        echo
    else
        log_error "Failed to start application services"
        docker-compose -f "$COMPOSE_FILE" logs
        exit 1
    fi
}

# Stop the application
stop_app() {
    log_info "Stopping application services..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "Application stopped"
}

# Clean up Docker resources
cleanup() {
    log_info "Cleaning up Docker resources..."

    # Remove stopped containers
    docker container prune -f

    # Remove unused images
    docker image prune -f

    log_success "Cleanup completed"
}

# Health check
health_check() {
    log_info "Running health check..."

    # Check if containers are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_error "Containers are not running"
        return 1
    fi

    # Check if web app responds
    if curl -f -s http://localhost:3000 > /dev/null; then
        log_success "Web application is responding"
    else
        log_warning "Web application is not responding yet"
    fi

    # Check if MongoDB is accessible
    if docker-compose -f "$COMPOSE_FILE" exec -T mongodb mongosh --eval "db.adminCommand('ismaster')" > /dev/null 2>&1; then
        log_success "MongoDB is accessible"
    else
        log_warning "MongoDB is not accessible yet"
    fi
}

# Show usage
show_usage() {
    echo "BHHV Docker Deployment Script"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  start       Build and start the application (default)"
    echo "  stop        Stop the application"
    echo "  restart     Restart the application"
    echo "  build       Build Docker images only"
    echo "  migrate     Run database migration only"
    echo "  logs        Show application logs"
    echo "  status      Show container status"
    echo "  cleanup     Clean up Docker resources"
    echo "  health      Run health check"
    echo "  help        Show this help message"
    echo
}

# Main deployment process
deploy() {
    log_info "🚀 Starting BHHV application deployment..."
    echo

    check_docker
    check_files
    build_app
    run_migration
    start_app
}

# Handle different commands
case "${1:-start}" in
    "start")
        deploy
        ;;
    "stop")
        stop_app
        ;;
    "restart")
        stop_app
        deploy
        ;;
    "build")
        check_docker
        check_files
        build_app
        ;;
    "migrate")
        check_docker
        run_migration
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;
    "status")
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
    "cleanup")
        cleanup
        ;;
    "health")
        health_check
        ;;
    "help")
        show_usage
        ;;
    *)
        log_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac