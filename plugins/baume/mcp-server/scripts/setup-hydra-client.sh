#!/usr/bin/env bash
#
# Setup test OAuth2 client in Hydra for E2E testing
#
# Usage: ./scripts/setup-hydra-client.sh
#
# Environment variables:
#   HYDRA_ADMIN_URL - Hydra admin URL (default: http://localhost:4445)

set -euo pipefail

HYDRA_ADMIN_URL="${HYDRA_ADMIN_URL:-http://localhost:4445}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Wait for Hydra to be ready
log_info "Waiting for Hydra at ${HYDRA_ADMIN_URL}..."
max_retries=30
retry_count=0

until curl -sf "${HYDRA_ADMIN_URL}/health/ready" > /dev/null 2>&1; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $max_retries ]; then
    log_error "Hydra did not become ready within ${max_retries} seconds"
    exit 1
  fi
  sleep 1
done
log_info "Hydra is ready"

# Check if client already exists
CLIENT_ID="mcp-server-client"
if curl -sf "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}" > /dev/null 2>&1; then
  log_warn "Client '${CLIENT_ID}' already exists, deleting..."
  curl -sf -X DELETE "${HYDRA_ADMIN_URL}/admin/clients/${CLIENT_ID}" > /dev/null
  log_info "Existing client deleted"
fi

# Create test client
log_info "Creating test OAuth2 client..."
curl -sf -X POST "${HYDRA_ADMIN_URL}/admin/clients" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "mcp-server-client",
    "client_secret": "mcp-server-secret",
    "client_name": "MCP Server E2E Test Client",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "openid offline_access",
    "redirect_uris": ["http://localhost:4000/oauth/callback"],
    "token_endpoint_auth_method": "client_secret_basic"
  }' | jq .

log_info "Test client created successfully"
echo ""
log_info "Client credentials:"
echo "  Client ID:     mcp-server-client"
echo "  Client Secret: mcp-server-secret"
echo "  Redirect URI:  http://localhost:4000/oauth/callback"
echo ""
log_info "Hydra endpoints:"
echo "  Public:        http://localhost:4444"
echo "  Admin:         http://localhost:4445"
echo "  OIDC Discovery: http://localhost:4444/.well-known/openid-configuration"
