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
    local npm_flags="${3:-}"  # Optional npm flags (e.g., --legacy-peer-deps)

    if [ ! -d "$dir" ]; then
        return 0
    fi

    # Install dependencies if .package-lock.json missing (npm creates this after install)
    # We check this instead of node_modules because symlinks may create node_modules early
    if [ ! -f "$dir/node_modules/.package-lock.json" ]; then
        echo "[aip-api-design] Installing $name dependencies..."
        cd "$dir"
        # Capture output and check npm's actual exit code
        output=$(npm install --silent --no-progress --no-audit --no-fund $npm_flags 2>&1)
        status=$?
        if [ $status -ne 0 ]; then
            echo "[aip-api-design] Failed to install $name dependencies."
            echo "$output" | grep -E "(error|Error|ERROR)" | head -5
            echo "[aip-api-design] Try manually: cd '$dir' && npm install $npm_flags"
            return 1
        fi
    fi

    # Build if dist missing
    if [ ! -d "$dir/dist" ]; then
        echo "[aip-api-design] Building $name..."
        cd "$dir"
        output=$(npm run build --silent 2>&1)
        status=$?
        if [ $status -ne 0 ]; then
            echo "[aip-api-design] Failed to build $name."
            echo "$output" | grep -E "(error|Error|ERROR)" | head -5
            echo "[aip-api-design] Try manually: cd '$dir' && npm run build"
            return 1
        fi
    fi

    return 0
}

# Function to link local package as dependency
# Creates symlink in node_modules to satisfy peer dependency without npm registry
link_local_dependency() {
    local target_dir="$1"      # Package that needs the dependency
    local source_dir="$2"      # Local package to link
    local package_name="$3"    # Scoped package name (e.g., @getlarge/aip-openapi-reviewer)

    if [ ! -d "$target_dir" ] || [ ! -d "$source_dir" ]; then
        return 0
    fi

    local scope_dir="$target_dir/node_modules/$(dirname "$package_name")"
    local link_path="$target_dir/node_modules/$package_name"

    # Skip if already exists
    if [ -e "$link_path" ] || [ -L "$link_path" ]; then
        return 0
    fi

    echo "[aip-api-design] Linking local dependency: $package_name"
    mkdir -p "$scope_dir"

    # Relative path from mcp-server/node_modules/@getlarge/ to openapi-reviewer
    ln -s "../../../openapi-reviewer" "$link_path" 2>/dev/null || {
        echo "[aip-api-design] Warning: Failed to create symlink for $package_name"
        return 1
    }
}

# Setup openapi-reviewer first (mcp-server depends on it)
setup_package "$OPENAPI_REVIEWER_DIR" "reviewer"

# Setup MCP server with --legacy-peer-deps to ignore peer dependency conflicts
# (Anthropic SDK and our package have different zod versions)
setup_package "$MCP_SERVER_DIR" "MCP server" "--legacy-peer-deps"

# Link openapi-reviewer into mcp-server's node_modules AFTER npm install
# This satisfies the peer dependency locally without needing the package on npm registry
link_local_dependency "$MCP_SERVER_DIR" "$OPENAPI_REVIEWER_DIR" "@getlarge/aip-openapi-reviewer"

echo "[aip-api-design] Setup complete."
