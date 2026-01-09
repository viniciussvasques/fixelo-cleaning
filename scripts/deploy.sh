#!/bin/bash
# =============================================
# FIXELO - Production Deploy Script
# =============================================
# Usage: ./scripts/deploy.sh
# 
# This script handles:
# - Code update from git
# - Environment file creation (if missing)
# - Docker image build
# - Database migrations
# - Container orchestration
# - Health checks
# - Rollback on failure
# =============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_PATH="/srv/fixelo"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_TAG=""

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Change to deploy directory
cd "$DEPLOY_PATH" || {
    error "Deploy path $DEPLOY_PATH does not exist!"
    exit 1
}

# =============================================
# 1. Backup current state
# =============================================
backup_current_state() {
    log "📦 Backing up current state..."
    BACKUP_TAG="backup-$(date +'%Y%m%d-%H%M%S')"
    
    # Tag current images for rollback
    if docker image inspect fixelo-web:latest >/dev/null 2>&1; then
        docker tag fixelo-web:latest "fixelo-web:$BACKUP_TAG" || true
        log "✓ Tagged fixelo-web:$BACKUP_TAG"
    fi
}

# =============================================
# 2. Update code
# =============================================
update_code() {
    log "📥 Updating code from git..."
    
    if [ ! -d ".git" ]; then
        error "Not a git repository! Please clone first."
        exit 1
    fi
    
    git fetch origin main
    git reset --hard origin/main
    log "✓ Code updated"
}

# =============================================
# 3. Create/Update .env file
# =============================================
setup_env() {
    log "🔧 Checking environment file..."
    
    if [ ! -f ".env" ]; then
        warn ".env file not found! Creating from template..."
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env
            error "Please edit .env file with your production values!"
            exit 1
        else
            error ".env.production.example not found!"
            exit 1
        fi
    fi
    
    log "✓ Environment file ready"
}

# =============================================
# 4. Build Docker images
# =============================================
build_images() {
    log "🐳 Building Docker images..."
    
    docker compose -f "$COMPOSE_FILE" build --parallel
    
    log "✓ Images built successfully"
}

# =============================================
# 5. Run database migrations
# =============================================
run_migrations() {
    log "🗃️ Running database migrations..."
    
    # Start database first if not running
    docker compose -f "$COMPOSE_FILE" up -d db
    
    # Wait for database to be healthy
    log "⏳ Waiting for database to be healthy..."
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U fixelo >/dev/null 2>&1; then
            break
        fi
        sleep 2
        retries=$((retries - 1))
    done
    
    if [ $retries -eq 0 ]; then
        error "Database failed to become healthy!"
        exit 1
    fi
    
    # Run migrations using the migrate profile
    docker compose -f "$COMPOSE_FILE" --profile migration run --rm migrate
    
    log "✓ Migrations applied"
}

# =============================================
# 5b. Run database seed (if empty)
# =============================================
run_seed() {
    log "🌱 Checking if seed is needed..."
    
    # Check if ServiceType table has data
    local count=$(docker compose -f "$COMPOSE_FILE" exec -T db psql -U fixelo -d fixelo_prod -t -c 'SELECT COUNT(*) FROM "ServiceType"' 2>/dev/null | tr -d ' ')
    
    if [ "$count" = "0" ] || [ -z "$count" ]; then
        log "⏳ Database empty, running seed..."
        
        # Run seed using the web container which has prisma
        docker compose -f "$COMPOSE_FILE" exec -T web sh -c 'cd /app && npx prisma db seed --schema=packages/database/prisma/schema.prisma' || {
            warn "Prisma seed failed, trying direct SQL seed..."
            # Fallback: insert basic data directly
            docker compose -f "$COMPOSE_FILE" exec -T db psql -U fixelo -d fixelo_prod << 'SEEDSQL'
INSERT INTO "ServiceType" (id, name, slug, description, "basePrice", inclusions, exclusions, "isActive", "createdAt", "updatedAt", "baseTime", "timePerBed", "timePerBath")
SELECT gen_random_uuid(), 'Standard Cleaning', 'standard', 'Regular home cleaning service', 109, 
       ARRAY['Dusting all surfaces', 'Vacuum all floors', 'Mop hard floors', 'Bathroom cleaning', 'Kitchen surface cleaning', 'Trash removal']::text[], 
       ARRAY['Inside oven', 'Inside fridge']::text[], true, NOW(), NOW(), 120, 45, 30
WHERE NOT EXISTS (SELECT 1 FROM "ServiceType" WHERE slug='standard');

INSERT INTO "ServiceType" (id, name, slug, description, "basePrice", inclusions, exclusions, "isActive", "createdAt", "updatedAt", "baseTime", "timePerBed", "timePerBath")
SELECT gen_random_uuid(), 'Deep Cleaning', 'deep', 'Thorough deep cleaning service', 169, 
       ARRAY['Everything in Standard', 'Inside oven cleaning', 'Inside fridge cleaning', 'Baseboards', 'Cabinet exteriors']::text[], 
       ARRAY[]::text[], true, NOW(), NOW(), 180, 60, 45
WHERE NOT EXISTS (SELECT 1 FROM "ServiceType" WHERE slug='deep');

INSERT INTO "ServiceType" (id, name, slug, description, "basePrice", inclusions, exclusions, "isActive", "createdAt", "updatedAt", "baseTime", "timePerBed", "timePerBath")
SELECT gen_random_uuid(), 'Airbnb / Vacation Rental', 'airbnb', 'Turnover cleaning for vacation rentals', 129, 
       ARRAY['Turnover cleaning', 'Bed linens change', 'Trash removal', 'Bathroom reset', 'Kitchen reset']::text[], 
       ARRAY[]::text[], true, NOW(), NOW(), 90, 30, 20
WHERE NOT EXISTS (SELECT 1 FROM "ServiceType" WHERE slug='airbnb');

INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Inside Oven Cleaning', 'inside-oven', 'Deep clean inside oven', 25, 30, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='inside-oven');

INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Inside Fridge Cleaning', 'inside-fridge', 'Deep clean inside refrigerator', 25, 30, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='inside-fridge');

INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Eco-Friendly Products', 'eco-products', 'Use green cleaning products', 10, 0, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='eco-products');

INSERT INTO "AddOn" (id, name, slug, description, price, "timeAdded", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Window Cleaning', 'window-cleaning', 'Interior window cleaning', 35, 45, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "AddOn" WHERE slug='window-cleaning');
SEEDSQL
        }
        log "✓ Database seeded"
    else
        log "✓ Database already has data ($count service types)"
    fi
}

# =============================================
# 6. Start/Update containers
# =============================================
start_containers() {
    log "🚀 Starting containers..."
    
    docker compose -f "$COMPOSE_FILE" up -d
    
    log "✓ Containers started"
}

# =============================================
# 7. Health check
# =============================================
health_check() {
    log "🏥 Running health checks..."
    
    local retries=30
    local url="http://localhost:3000/api/health"
    
    while [ $retries -gt 0 ]; do
        if curl -sf "$url" >/dev/null 2>&1; then
            log "✓ Health check passed!"
            return 0
        fi
        sleep 5
        retries=$((retries - 1))
        log "⏳ Waiting for service to be ready... ($retries attempts left)"
    done
    
    error "Health check failed after multiple attempts!"
    return 1
}

# =============================================
# 8. Cleanup
# =============================================
cleanup() {
    log "🧹 Cleaning up old images..."
    docker image prune -f
    log "✓ Cleanup complete"
}

# =============================================
# 9. Rollback
# =============================================
rollback() {
    error "🔄 Rolling back to previous version..."
    
    if [ -n "$BACKUP_TAG" ] && docker image inspect "fixelo-web:$BACKUP_TAG" >/dev/null 2>&1; then
        docker tag "fixelo-web:$BACKUP_TAG" fixelo-web:latest
        docker compose -f "$COMPOSE_FILE" up -d
        log "✓ Rollback complete"
    else
        error "No backup available for rollback!"
    fi
}

# =============================================
# Main execution
# =============================================
main() {
    log "🚀 Starting Fixelo deployment..."
    echo ""
    
    backup_current_state
    update_code
    setup_env
    build_images
    run_migrations
    start_containers
    run_seed
    
    if health_check; then
        cleanup
        echo ""
        log "✅ Deployment successful!"
        docker compose -f "$COMPOSE_FILE" ps
    else
        rollback
        exit 1
    fi
}

# Run main function
main "$@"
