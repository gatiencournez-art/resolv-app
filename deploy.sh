#!/bin/bash
set -e

# ============================================================================
# Resolv — Deploy Script for VPS
# ============================================================================
# Usage:
#   1. SSH into your VPS
#   2. Clone the repo: git clone <your-repo> resolv && cd resolv
#   3. Edit .env.production with your values
#   4. Run: chmod +x deploy.sh && ./deploy.sh
# ============================================================================

ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"

echo "================================================"
echo "  Resolv — Production Deployment"
echo "================================================"

# Check env file
if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found!"
  echo "Copy .env.production and fill in your values first."
  exit 1
fi

# Check for placeholder values
if grep -q "CHANGE_ME" "$ENV_FILE" || grep -q "YOUR_DOMAIN_OR_IP" "$ENV_FILE"; then
  echo "ERROR: You still have placeholder values in $ENV_FILE"
  echo "Please replace CHANGE_ME and YOUR_DOMAIN_OR_IP with real values."
  exit 1
fi

# Load env
export $(grep -v '^#' "$ENV_FILE" | xargs)

echo ""
echo "[1/4] Building Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build

echo ""
echo "[2/4] Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo ""
echo "[3/4] Waiting for database to be ready..."
sleep 5

echo ""
echo "[4/4] Running database migrations..."
docker compose -f "$COMPOSE_FILE" exec api npx prisma migrate deploy

echo ""
echo "================================================"
echo "  Deployment complete!"
echo "================================================"
echo ""
echo "  Web:  http://$CORS_ORIGIN"
echo "  API:  http://$CORS_ORIGIN/api"
echo ""
echo "  Useful commands:"
echo "    Logs:     docker compose -f $COMPOSE_FILE logs -f"
echo "    Stop:     docker compose -f $COMPOSE_FILE down"
echo "    Restart:  docker compose -f $COMPOSE_FILE restart"
echo "    DB seed:  docker compose -f $COMPOSE_FILE exec api npx prisma db seed"
echo ""
