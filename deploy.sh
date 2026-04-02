#!/usr/bin/env bash
set -euo pipefail

# ─── OpenSTR Production Deploy Script ─────────────────────────────────────────
# Run on your Linux server after cloning the repo.
# Prerequisites: Docker, Docker Compose v2, git
#
# Usage:
#   ./deploy.sh              # Full deploy (build + migrate + start)
#   ./deploy.sh --update     # Pull latest, rebuild, migrate, restart
#   ./deploy.sh --ssl        # Set up Let's Encrypt SSL certs
#   ./deploy.sh --seed-demo  # Seed with demo data (open source)
#   ./deploy.sh --seed-full  # Seed with your personal data (private fork)
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE="docker compose -f docker-compose.prod.yml"
ENV_FILE=".env.production"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1" >&2; }

# ─── Check prerequisites ─────────────────────────────────────────────────────
check_prereqs() {
  if ! command -v docker &>/dev/null; then
    err "Docker is not installed"
    exit 1
  fi
  if ! docker compose version &>/dev/null; then
    err "Docker Compose v2 is not installed"
    exit 1
  fi
}

# ─── Check env file exists ───────────────────────────────────────────────────
check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    err ".env.production not found!"
    echo ""
    echo "Create it from the template:"
    echo "  cp .env.production.example .env.production"
    echo "  nano .env.production"
    echo ""
    echo "Fill in: DOMAIN, POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, BETTER_AUTH_SECRET"
    exit 1
  fi
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  if [[ "${POSTGRES_PASSWORD:-}" == "CHANGE_ME"* ]] || [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
    err "POSTGRES_PASSWORD in $ENV_FILE is not set. Edit the file first."
    exit 1
  fi
  log "Environment loaded from $ENV_FILE"
}

# ─── SSL setup with Let's Encrypt ────────────────────────────────────────────
setup_ssl() {
  check_env
  local domain="${DOMAIN:?Set DOMAIN in $ENV_FILE}"

  log "Setting up SSL for $domain..."

  # Create dirs
  mkdir -p ssl certbot/www

  # Start nginx temporarily on port 80 for ACME challenge
  # Use a minimal config that only serves the challenge
  cat > /tmp/nginx-acme.conf <<'ACME'
events { worker_connections 64; }
http {
  server {
    listen 80;
    server_name _;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 444; }
  }
}
ACME

  docker run -d --name openstr-acme \
    -p 80:80 \
    -v "$SCRIPT_DIR/certbot/www:/var/www/certbot" \
    -v /tmp/nginx-acme.conf:/etc/nginx/nginx.conf:ro \
    nginx:alpine

  # Run certbot
  docker run --rm \
    -v "$SCRIPT_DIR/certbot/www:/var/www/certbot" \
    -v "$SCRIPT_DIR/ssl:/etc/letsencrypt/live/$domain" \
    certbot/certbot certonly \
      --webroot -w /var/www/certbot \
      -d "$domain" \
      --email "admin@$domain" \
      --agree-tos \
      --non-interactive

  docker stop openstr-acme && docker rm openstr-acme

  # Certbot puts certs in a subdir — symlink if needed
  if [ -f "ssl/$domain/fullchain.pem" ] && [ ! -f "ssl/fullchain.pem" ]; then
    ln -sf "$domain/fullchain.pem" ssl/fullchain.pem
    ln -sf "$domain/privkey.pem" ssl/privkey.pem
  fi

  log "SSL certificates installed in ssl/"
  echo ""
  echo "To auto-renew, add a cron job:"
  echo "  0 3 * * * cd $SCRIPT_DIR && docker run --rm -v $SCRIPT_DIR/certbot/www:/var/www/certbot -v $SCRIPT_DIR/ssl:/etc/letsencrypt certbot/certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload"
}

# ─── Self-signed SSL (for testing without a domain) ──────────────────────────
setup_self_signed() {
  log "Generating self-signed SSL certificate..."
  mkdir -p ssl
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem -out ssl/fullchain.pem \
    -subj "/CN=openstr-local/O=OpenSTR"
  log "Self-signed cert created in ssl/"
  warn "Browsers will show a security warning. Use --ssl with a real domain for production."
}

# ─── Build and start ─────────────────────────────────────────────────────────
build_start() {
  check_env

  # Ensure SSL certs exist
  if [ ! -f "ssl/fullchain.pem" ]; then
    warn "No SSL certificates found in ssl/"
    echo "Options:"
    echo "  1) ./deploy.sh --ssl      (Let's Encrypt — needs public domain)"
    echo "  2) Generating self-signed for local/testing..."
    setup_self_signed
  fi

  log "Building containers..."
  $COMPOSE --env-file "$ENV_FILE" build

  log "Starting services..."
  $COMPOSE --env-file "$ENV_FILE" up -d

  log "Waiting for database..."
  sleep 5

  log "Running migrations..."
  $COMPOSE --env-file "$ENV_FILE" exec api npx node-pg-migrate up || \
  warn "Migration command failed — you may need to run migrations manually"

  log "Services running!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Admin panel:  https://${DOMAIN:-localhost}"
  echo "  Mobile app:   https://${DOMAIN:-localhost}/app/"
  echo "  API:          https://${DOMAIN:-localhost}/api/"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Next steps:"
  echo "  • Seed data:  ./deploy.sh --seed-demo  (or --seed-full for your data)"
  echo "  • View logs:  $COMPOSE logs -f"
  echo "  • Stop:       $COMPOSE down"
}

# ─── Update (pull + rebuild + restart) ────────────────────────────────────────
update() {
  check_env
  log "Pulling latest code..."
  git pull --ff-only

  log "Rebuilding containers..."
  $COMPOSE --env-file "$ENV_FILE" build

  log "Restarting services..."
  $COMPOSE --env-file "$ENV_FILE" up -d

  log "Running migrations..."
  $COMPOSE --env-file "$ENV_FILE" exec api npx node-pg-migrate up || true

  log "Update complete!"
}

# ─── Seed data ────────────────────────────────────────────────────────────────
seed() {
  local script="$1"
  check_env
  log "Seeding database with $script..."
  $COMPOSE --env-file "$ENV_FILE" exec api sh -c "npx tsx src/db/$script"
  log "Seed complete!"
}

# ─── Main ─────────────────────────────────────────────────────────────────────
check_prereqs

case "${1:-}" in
  --ssl)
    setup_ssl
    ;;
  --update)
    update
    ;;
  --seed-demo)
    seed "seed-demo.ts"
    ;;
  --seed-full)
    seed "seed-full.ts"
    ;;
  --self-signed)
    setup_self_signed
    ;;
  --stop)
    check_env
    $COMPOSE --env-file "$ENV_FILE" down
    log "Stopped."
    ;;
  --logs)
    check_env
    $COMPOSE --env-file "$ENV_FILE" logs -f
    ;;
  ""|--start)
    build_start
    ;;
  *)
    echo "Usage: ./deploy.sh [OPTION]"
    echo ""
    echo "Options:"
    echo "  (none)        Build and start all services"
    echo "  --update      Pull latest, rebuild, migrate, restart"
    echo "  --ssl         Set up Let's Encrypt SSL certificates"
    echo "  --self-signed Generate self-signed SSL (for testing)"
    echo "  --seed-demo   Seed with generic demo data"
    echo "  --seed-full   Seed with your personal data"
    echo "  --stop        Stop all services"
    echo "  --logs        Tail logs from all services"
    ;;
esac
