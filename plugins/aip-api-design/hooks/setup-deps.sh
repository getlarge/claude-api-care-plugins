#!/bin/bash
# Setup script for AIP API Design plugin dependencies
# Runs on SessionStart - installs deps and builds if needed

set -e

OPENAPI_REVIEWER_DIR="${CLAUDE_PLUGIN_ROOT}/openapi-reviewer"
MCP_SERVER_DIR="${CLAUDE_PLUGIN_ROOT}/mcp-server"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "[aip-api-design] npm not found. Install Node.js 20+ to use the MCP server and standalone reviewer."
    exit 0
fi

# Function to setup a package (install deps + build if needed)
setup_package() {
    local dir="$1"
    local name="$2"

    if [ ! -d "$dir" ]; then
        return 0
    fi

    # Install dependencies if node_modules missing
    if [ ! -d "$dir/node_modules" ]; then
        echo "[aip-api-design] Installing $name dependencies..."
        cd "$dir"
        npm install --silent --no-progress --no-audit --no-fund 2>/dev/null || {
            echo "[aip-api-design] Failed to install $name dependencies."
            return 1
        }
    fi

    # Build if dist missing
    if [ ! -d "$dir/dist" ]; then
        echo "[aip-api-design] Building $name..."
        cd "$dir"
        npm run build --silent 2>/dev/null || {
            echo "[aip-api-design] Failed to build $name."
            return 1
        }
    fi

    return 0
}

# Setup scripts package first (mcp-server depends on it for types)
setup_package "$OPENAPI_REVIEWER_DIR" "reviewer"

# Setup MCP server
setup_package "$MCP_SERVER_DIR" "MCP server"

echo "[aip-api-design] Setup complete."
