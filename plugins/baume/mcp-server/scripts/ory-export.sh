#!/usr/bin/env bash
#
# Export Ory Network project configuration
# Usage: ./ory-export.sh [output-dir]
#
# Environment variables (or will prompt):
#   ORY_PROJECT_ID    - Source project ID
#   ORY_WORKSPACE_ID  - Source workspace ID
#
# Exports:
#   - project.json       (Full project config including identity, oauth2, permissions)
#   - oauth2-clients.json (All OAuth2 clients, secrets NOT included)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Detect OS for install hints
detect_install_hint() {
    local pkg="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        case "$pkg" in
            ory) echo "brew install ory/tap/ory" ;;
            jq) echo "brew install jq" ;;
        esac
    elif [[ -f /etc/debian_version ]]; then
        case "$pkg" in
            ory) echo "curl -sSL https://raw.githubusercontent.com/ory/meta/master/install.sh | bash -s -- -b /usr/local/bin ory" ;;
            jq) echo "sudo apt-get install jq" ;;
        esac
    elif [[ -f /etc/redhat-release ]]; then
        case "$pkg" in
            ory) echo "curl -sSL https://raw.githubusercontent.com/ory/meta/master/install.sh | bash -s -- -b /usr/local/bin ory" ;;
            jq) echo "sudo dnf install jq" ;;
        esac
    else
        case "$pkg" in
            ory) echo "See https://www.ory.sh/docs/guides/cli/installation" ;;
            jq) echo "See https://jqlang.github.io/jq/download/" ;;
        esac
    fi
}

# Check if ory CLI is installed
if ! command -v ory &> /dev/null; then
    log_error "Ory CLI not found. Install with: $(detect_install_hint ory)"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    log_error "jq not found. Install with: $(detect_install_hint jq)"
    exit 1
fi

# Check if authenticated
if ! ory auth whoami &> /dev/null; then
    log_error "Not authenticated. Run: ory auth"
    exit 1
fi

# Get project and workspace IDs
PROJECT_ID="${ORY_PROJECT_ID:-}"
WORKSPACE_ID="${ORY_WORKSPACE_ID:-}"

if [[ -z "$PROJECT_ID" ]]; then
    log_info "Available workspaces:"
    ory list workspaces --format table
    echo ""
    read -p "Enter workspace ID: " WORKSPACE_ID

    log_info "Available projects in workspace:"
    ory list projects --workspace "$WORKSPACE_ID" --format table
    echo ""
    read -p "Enter project ID: " PROJECT_ID
fi

if [[ -z "$WORKSPACE_ID" ]]; then
    # Try to get workspace from project
    WORKSPACE_ID=$(ory get project "$PROJECT_ID" --format json 2>/dev/null | jq -r '.workspace_id // empty' || echo "")
    if [[ -z "$WORKSPACE_ID" ]]; then
        read -p "Enter workspace ID: " WORKSPACE_ID
    fi
fi

# Output directory
OUTPUT_DIR="${1:-./ory-config}"
mkdir -p "$OUTPUT_DIR"

log_info "Exporting Ory configuration..."
log_info "  Project:   $PROJECT_ID"
log_info "  Workspace: $WORKSPACE_ID"
log_info "  Output:    $OUTPUT_DIR"
echo ""

# Export full project config (includes identity, oauth2, permission configs)
log_info "Exporting project configuration..."
ory get project "$PROJECT_ID" --workspace "$WORKSPACE_ID" --format json > "$OUTPUT_DIR/project.json" 2>/dev/null || {
    log_error "Could not export project configuration"
    exit 1
}

# Extract key info for display
PROJECT_NAME=$(jq -r '.name' "$OUTPUT_DIR/project.json")
PROJECT_SLUG=$(jq -r '.slug' "$OUTPUT_DIR/project.json")
PROJECT_ENV=$(jq -r '.environment' "$OUTPUT_DIR/project.json")

log_info "  Name: $PROJECT_NAME"
log_info "  Slug: $PROJECT_SLUG"
log_info "  Environment: $PROJECT_ENV"

# Export OAuth2 clients
log_info "Exporting OAuth2 clients..."
ory list oauth2-clients --project "$PROJECT_ID" --workspace "$WORKSPACE_ID" --format json > "$OUTPUT_DIR/oauth2-clients.json" 2>/dev/null || {
    log_warn "Could not export OAuth2 clients"
    echo '{"items":[]}' > "$OUTPUT_DIR/oauth2-clients.json"
}

# Count clients
CLIENT_COUNT=$(jq '.items | length' "$OUTPUT_DIR/oauth2-clients.json" 2>/dev/null || echo "0")
log_info "  Found $CLIENT_COUNT OAuth2 client(s)"

# Create export manifest
# Use portable date format (works on both BSD/macOS and GNU/Linux)
EXPORT_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat > "$OUTPUT_DIR/manifest.json" << EOF
{
  "exported_at": "$EXPORT_TIMESTAMP",
  "source": {
    "project_id": "$PROJECT_ID",
    "project_name": "$PROJECT_NAME",
    "project_slug": "$PROJECT_SLUG",
    "workspace_id": "$WORKSPACE_ID",
    "environment": "$PROJECT_ENV"
  },
  "files": {
    "project": "project.json",
    "oauth2_clients": "oauth2-clients.json"
  },
  "contents": {
    "identity_config": "services.identity.config",
    "oauth2_config": "services.oauth2.config",
    "permission_config": "services.permission.config"
  },
  "notes": [
    "OAuth2 client secrets are NOT included - regenerate after import",
    "Social login provider secrets (GitHub, etc.) must be reconfigured manually",
    "URLs containing the project slug will need updating for target environment"
  ]
}
EOF

echo ""
log_info "Export complete!"
echo ""
echo "Files exported to: $OUTPUT_DIR"
ls -la "$OUTPUT_DIR"
echo ""
log_warn "IMPORTANT: OAuth2 client secrets are NOT exported."
log_warn "Social login secrets (GitHub OAuth) must be reconfigured manually."
echo ""
echo "To import to a new project, run:"
echo "  ./ory-import.sh $OUTPUT_DIR"
