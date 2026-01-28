#!/usr/bin/env bash
#
# Import Ory Network project configuration
# Usage: ./ory-import.sh <config-dir> [--project <id>] [--workspace <id>]
#
# Environment variables (or use flags):
#   ORY_TARGET_PROJECT_ID    - Target project ID
#   ORY_TARGET_WORKSPACE_ID  - Target workspace ID
#
# Imports from:
#   - project.json       (Full project config: identity, oauth2, permission)
#   - oauth2-clients.json (Creates new clients, secrets regenerated)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

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

# Parse arguments
CONFIG_DIR=""
PROJECT_ID="${ORY_TARGET_PROJECT_ID:-}"
WORKSPACE_ID="${ORY_TARGET_WORKSPACE_ID:-}"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        --workspace)
            WORKSPACE_ID="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 <config-dir> [--project <id>] [--workspace <id>] [--dry-run]"
            echo ""
            echo "Options:"
            echo "  --project    Target project ID (or set ORY_TARGET_PROJECT_ID)"
            echo "  --workspace  Target workspace ID (or set ORY_TARGET_WORKSPACE_ID)"
            echo "  --dry-run    Show what would be imported without making changes"
            exit 0
            ;;
        *)
            if [[ -z "$CONFIG_DIR" ]]; then
                CONFIG_DIR="$1"
            fi
            shift
            ;;
    esac
done

if [[ -z "$CONFIG_DIR" ]]; then
    log_error "Config directory required"
    echo "Usage: $0 <config-dir> [--project <id>] [--workspace <id>]"
    exit 1
fi

if [[ ! -d "$CONFIG_DIR" ]]; then
    log_error "Config directory not found: $CONFIG_DIR"
    exit 1
fi

# Check for required files
if [[ ! -f "$CONFIG_DIR/project.json" ]]; then
    log_error "project.json not found in $CONFIG_DIR"
    log_error "Run ory-export.sh first to create the export"
    exit 1
fi

# Read manifest if exists
if [[ -f "$CONFIG_DIR/manifest.json" ]]; then
    log_info "Reading export manifest..."
    SOURCE_PROJECT=$(jq -r '.source.project_id' "$CONFIG_DIR/manifest.json")
    SOURCE_NAME=$(jq -r '.source.project_name' "$CONFIG_DIR/manifest.json")
    EXPORTED_AT=$(jq -r '.exported_at' "$CONFIG_DIR/manifest.json")
    log_info "  Source: $SOURCE_NAME ($SOURCE_PROJECT)"
    log_info "  Exported at: $EXPORTED_AT"
fi

# Get target project and workspace
if [[ -z "$PROJECT_ID" ]] || [[ -z "$WORKSPACE_ID" ]]; then
    log_info "Available workspaces:"
    ory list workspaces --format table
    echo ""

    if [[ -z "$WORKSPACE_ID" ]]; then
        read -p "Enter target workspace ID: " WORKSPACE_ID
    fi

    log_info "Available projects in workspace:"
    ory list projects --workspace "$WORKSPACE_ID" --format table
    echo ""

    if [[ -z "$PROJECT_ID" ]]; then
        read -p "Enter target project ID (or 'new' to create): " PROJECT_ID
    fi
fi

# Create new project if requested
if [[ "$PROJECT_ID" == "new" ]]; then
    read -p "Enter name for new project: " PROJECT_NAME
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create project: $PROJECT_NAME"
        PROJECT_ID="dry-run-project-id"
    else
        log_step "Creating new project: $PROJECT_NAME"
        PROJECT_ID=$(ory create project --name "$PROJECT_NAME" --workspace "$WORKSPACE_ID" --format json | jq -r '.id')
        log_info "Created project: $PROJECT_ID"
    fi
fi

echo ""
log_info "Import configuration:"
log_info "  Source:    $CONFIG_DIR"
log_info "  Target:    $PROJECT_ID"
log_info "  Workspace: $WORKSPACE_ID"
if [[ "$DRY_RUN" == "true" ]]; then
    log_warn "  Mode:      DRY RUN (no changes will be made)"
fi
echo ""

# Confirm before proceeding
if [[ "$DRY_RUN" != "true" ]]; then
    read -p "Continue with import? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Import cancelled"
        exit 0
    fi
fi

# Create temp directory for extracted configs
TEMP_DIR=$(mktemp -d) || { log_error "Failed to create temp directory"; exit 1; }
trap 'rm -rf "$TEMP_DIR"' EXIT

# Extract configs from project.json
log_step "Extracting configuration from project.json..."

# Extract identity config
if jq -e '.services.identity.config' "$CONFIG_DIR/project.json" > /dev/null 2>&1; then
    jq '.services.identity.config' "$CONFIG_DIR/project.json" > "$TEMP_DIR/identity-config.json"
    log_info "  Extracted identity config"
    HAS_IDENTITY=true
else
    log_warn "  No identity config found"
    HAS_IDENTITY=false
fi

# Extract OAuth2 config
if jq -e '.services.oauth2.config' "$CONFIG_DIR/project.json" > /dev/null 2>&1; then
    jq '.services.oauth2.config' "$CONFIG_DIR/project.json" > "$TEMP_DIR/oauth2-config.json"
    log_info "  Extracted OAuth2 config"
    HAS_OAUTH2=true
else
    log_warn "  No OAuth2 config found"
    HAS_OAUTH2=false
fi

# Extract permission config
if jq -e '.services.permission.config' "$CONFIG_DIR/project.json" > /dev/null 2>&1; then
    jq '.services.permission.config' "$CONFIG_DIR/project.json" > "$TEMP_DIR/permission-config.json"
    log_info "  Extracted permission config"
    HAS_PERMISSION=true
else
    HAS_PERMISSION=false
fi

echo ""

# Import identity config
if [[ "$HAS_IDENTITY" == "true" ]]; then
    log_step "Importing identity config (Kratos)..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would import identity config"
    else
        ory update identity-config --project "$PROJECT_ID" --workspace "$WORKSPACE_ID" --file "$TEMP_DIR/identity-config.json" --format json --yes > /dev/null
        log_info "Identity config imported"
    fi
fi

# Import OAuth2 config
if [[ "$HAS_OAUTH2" == "true" ]]; then
    log_step "Importing OAuth2 config (Hydra)..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would import OAuth2 config"
    else
        ory update oauth2-config --project "$PROJECT_ID" --workspace "$WORKSPACE_ID" --file "$TEMP_DIR/oauth2-config.json" --format json --yes > /dev/null
        log_info "OAuth2 config imported"
    fi
fi

# Import permission config
if [[ "$HAS_PERMISSION" == "true" ]]; then
    log_step "Importing permission config (Keto)..."
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would import permission config"
    else
        ory update permission-config --project "$PROJECT_ID" --workspace "$WORKSPACE_ID" --file "$TEMP_DIR/permission-config.json" --format json --yes 2>/dev/null || {
            log_warn "Could not import permission config (may not be enabled on target)"
        }
    fi
fi

# Import OAuth2 clients
if [[ -f "$CONFIG_DIR/oauth2-clients.json" ]]; then
    CLIENT_COUNT=$(jq '.items | length' "$CONFIG_DIR/oauth2-clients.json" 2>/dev/null || echo "0")
    if [[ "$CLIENT_COUNT" -gt 0 ]]; then
        log_step "Creating OAuth2 clients ($CLIENT_COUNT found)..."
        echo ""

        jq -c '.items[]' "$CONFIG_DIR/oauth2-clients.json" | while read -r client; do
            CLIENT_NAME=$(echo "$client" | jq -r '.client_name // "unnamed"')

            # Extract client configuration
            GRANT_TYPES=$(echo "$client" | jq -r '.grant_types // ["authorization_code"] | map("--grant-type " + .) | join(" ")')
            RESPONSE_TYPES=$(echo "$client" | jq -r '.response_types // ["code"] | map("--response-type " + .) | join(" ")')
            SCOPES=$(echo "$client" | jq -r '.scope // "openid"')
            REDIRECT_URIS=$(echo "$client" | jq -r '.redirect_uris // [] | map("--redirect-uri " + .) | join(" ")')
            TOKEN_AUTH=$(echo "$client" | jq -r '.token_endpoint_auth_method // "client_secret_basic"')

            log_info "Creating client: $CLIENT_NAME"

            if [[ "$DRY_RUN" == "true" ]]; then
                log_info "  [DRY RUN] Would create with:"
                log_info "    Scopes: $SCOPES"
                echo "$client" | jq -r '.redirect_uris[]? // empty' | while read -r uri; do
                    log_info "    Redirect: $uri"
                done
            else
                # Build and execute the create command
                CREATE_CMD="ory create oauth2-client \
                    --project $PROJECT_ID \
                    --workspace $WORKSPACE_ID \
                    --name \"$CLIENT_NAME\" \
                    $GRANT_TYPES \
                    $RESPONSE_TYPES \
                    --scope \"$SCOPES\" \
                    --token-endpoint-auth-method $TOKEN_AUTH \
                    --format json"

                if [[ -n "$REDIRECT_URIS" ]]; then
                    CREATE_CMD="$CREATE_CMD $REDIRECT_URIS"
                fi

                NEW_CLIENT=$(eval "$CREATE_CMD" 2>/dev/null) || {
                    log_warn "  Failed to create client: $CLIENT_NAME"
                    continue
                }

                NEW_CLIENT_ID=$(echo "$NEW_CLIENT" | jq -r '.client_id')
                NEW_CLIENT_SECRET=$(echo "$NEW_CLIENT" | jq -r '.client_secret // "none (public client)"')

                log_info "  Client ID:     $NEW_CLIENT_ID"
                log_info "  Client Secret: $NEW_CLIENT_SECRET"
                log_warn "  ⚠️  Save this secret - it won't be shown again!"
                echo ""
            fi
        done
    else
        log_info "No OAuth2 clients to import"
    fi
fi

echo ""
log_info "Import complete!"
echo ""

if [[ "$DRY_RUN" != "true" ]]; then
    # Get the project URL
    PROJECT_SLUG=$(ory get project "$PROJECT_ID" --workspace "$WORKSPACE_ID" --format json 2>/dev/null | jq -r '.slug // empty' || echo "")
    if [[ -n "$PROJECT_SLUG" ]]; then
        echo "Project URL: https://$PROJECT_SLUG.projects.oryapis.com"
    fi
    echo ""
    log_warn "Next steps:"
    echo "  1. Update OAuth2 client redirect URIs for target environment"
    echo "  2. Reconfigure social login provider secrets (GitHub, etc.)"
    echo "  3. Update MCP server with new ORY_PROJECT_URL"
fi
