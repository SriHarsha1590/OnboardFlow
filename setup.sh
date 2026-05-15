#!/usr/bin/env bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${BLUE}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}${BOLD}║     OnboardFlow — Setup Script               ║${NC}"
echo -e "${BLUE}${BOLD}║     Temporal Technologies POC                ║${NC}"
echo -e "${BLUE}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ── Check prerequisites ────────────────────────────────────────────────────────
check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ $1 is not installed. Please install it first.${NC}"
    exit 1
  fi
}

echo -e "${BOLD}Checking prerequisites...${NC}"
check_cmd node
check_cmd npm
check_cmd docker
check_cmd docker-compose || check_cmd "docker compose"

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo -e "${RED}✗ Node.js 18+ required. Current: $(node -v)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
echo -e "${GREEN}✓ npm $(npm -v)${NC}"
echo -e "${GREEN}✓ Docker$(NC)"
echo ""

# ── Start infrastructure ───────────────────────────────────────────────────────
echo -e "${BOLD}Starting Docker services (PostgreSQL + Temporal)...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}Waiting for services to be ready (30s)...${NC}"
sleep 30

# ── Install dependencies ───────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Installing dependencies...${NC}"
npm install --silent
npm install --workspace=backend --silent
npm install --workspace=frontend --silent
echo -e "${GREEN}✓ Dependencies installed${NC}"

# ── Run migrations ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Running database migrations...${NC}"
cd backend && node src/db/migrate.js && cd ..
echo -e "${GREEN}✓ Database ready${NC}"

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║  Setup complete! Start with:                 ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Open ${BOLD}3 terminals${NC} and run:"
echo ""
echo -e "  ${BLUE}Terminal 1${NC} — API Server:"
echo -e "  ${YELLOW}cd backend && node src/index.js${NC}"
echo ""
echo -e "  ${BLUE}Terminal 2${NC} — Temporal Worker:"
echo -e "  ${YELLOW}cd backend && node src/workers/onboardingWorker.js${NC}"
echo ""
echo -e "  ${BLUE}Terminal 3${NC} — React Frontend:"
echo -e "  ${YELLOW}cd frontend && npm run dev${NC}"
echo ""
echo -e "Then open:"
echo -e "  🌐 App:          ${BLUE}http://localhost:5173${NC}"
echo -e "  📡 API:          ${BLUE}http://localhost:3001/api/health${NC}"
echo -e "  ⚡ Temporal UI:  ${BLUE}http://localhost:8080${NC}"
echo ""
