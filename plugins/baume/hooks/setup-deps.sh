#!/bin/bash
# Setup script for Baume plugin
# Downloads pre-built bundles from GitHub releases with local caching

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
REPO="getlarge/claude-api-care-plugins"

# Cache directory for downloaded releases
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/baume-plugin"

# Bundle paths
MCP_DIST="$PLUGIN_DIR/mcp-server/dist"
REVIEWER_DIST="$PLUGIN_DIR/openapi-reviewer/dist"

# Required bundles
MCP_BUNDLES=("server.bundle.js" "stdio.bundle.js" "worker.bundle.js")
REVIEWER_BUNDLES=("reviewer.bundle.js" "cli.bundle.js" "discover.bundle.js")

# =============================================================================
# Check Node.js version
# =============================================================================

if ! command -v node &> /dev/null; then
    echo "[baume] Node.js not found."
    echo "[baume] Install Node.js 22.5+ to use this plugin: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
NODE_MINOR=$(node -v | sed 's/v//' | cut -d'.' -f2)

if [ "$NODE_VERSION" -lt 22 ] || ([ "$NODE_VERSION" -eq 22 ] && [ "$NODE_MINOR" -lt 5 ]); then
    echo "[baume] Node.js $(node -v) detected. This plugin requires Node.js 22.5+."
    echo "[baume] Please upgrade: https://nodejs.org/"
    exit 1
fi

# =============================================================================
# Helper functions
# =============================================================================

check_bundles() {
    local dist_dir="$1"
    shift
    local bundles=("$@")

    for bundle in "${bundles[@]}"; do
        if [ ! -f "$dist_dir/$bundle" ]; then
            return 1
        fi
    done
    return 0
}

get_latest_release() {
    if command -v curl &> /dev/null; then
        curl -s "https://api.github.com/repos/$REPO/releases/latest" | \
            grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
    elif command -v wget &> /dev/null; then
        wget -qO- "https://api.github.com/repos/$REPO/releases/latest" | \
            grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
    else
        echo ""
    fi
}

download_file() {
    local url="$1"
    local dest="$2"

    mkdir -p "$(dirname "$dest")"

    if command -v curl &> /dev/null; then
        curl -sL "$url" -o "$dest"
    elif command -v wget &> /dev/null; then
        wget -q "$url" -O "$dest"
    else
        echo "[baume] Error: curl or wget required"
        return 1
    fi
}

# Copy bundle from cache or download
get_bundle() {
    local tag="$1"
    local filename="$2"
    local dest="$3"
    local cache_file="$CACHE_DIR/$tag/$filename"

    # Check if already in cache
    if [ -f "$cache_file" ]; then
        mkdir -p "$(dirname "$dest")"
        cp "$cache_file" "$dest"
        return 0
    fi

    # Download to cache first, then copy
    local url="https://github.com/$REPO/releases/download/$tag/$filename"
    if download_file "$url" "$cache_file"; then
        mkdir -p "$(dirname "$dest")"
        cp "$cache_file" "$dest"
        return 0
    fi

    return 1
}

build_from_source() {
    echo "[baume] Building from source..."

    if [ -f "$PLUGIN_DIR/mcp-server/package.json" ]; then
        cd "$PLUGIN_DIR/mcp-server"
        if command -v npm &> /dev/null; then
            echo "[baume]   Building mcp-server..."
            npm install --ignore-scripts 2>/dev/null || true
            npm run build 2>/dev/null || true
        fi
    fi

    if [ -f "$PLUGIN_DIR/openapi-reviewer/package.json" ]; then
        cd "$PLUGIN_DIR/openapi-reviewer"
        if command -v npm &> /dev/null; then
            echo "[baume]   Building openapi-reviewer..."
            npm install --ignore-scripts 2>/dev/null || true
            npm run build 2>/dev/null || true
        fi
    fi
}

# =============================================================================
# Main logic
# =============================================================================

# Check if all bundles already exist
if check_bundles "$MCP_DIST" "${MCP_BUNDLES[@]}" && \
   check_bundles "$REVIEWER_DIST" "${REVIEWER_BUNDLES[@]}"; then
    echo "[baume] Bundles found (Node.js $(node -v))"
    exit 0
fi

# Get latest release tag
LATEST_TAG=$(get_latest_release)

if [ -z "$LATEST_TAG" ]; then
    echo "[baume] Could not determine latest release."
    build_from_source

    if check_bundles "$MCP_DIST" "${MCP_BUNDLES[@]}" && \
       check_bundles "$REVIEWER_DIST" "${REVIEWER_BUNDLES[@]}"; then
        echo "[baume] Built from source successfully"
        exit 0
    else
        echo "[baume] Warning: Could not build bundles. Some features may not work."
        exit 0
    fi
fi

# Check if we have this version cached
CACHE_VERSION_FILE="$CACHE_DIR/$LATEST_TAG/.version"
if [ -f "$CACHE_VERSION_FILE" ]; then
    echo "[baume] Using cached release $LATEST_TAG..."
else
    echo "[baume] Downloading release $LATEST_TAG..."
fi

# Create directories
mkdir -p "$MCP_DIST" "$REVIEWER_DIST" "$CACHE_DIR/$LATEST_TAG"

# Get MCP server bundles (from cache or download)
for bundle in "${MCP_BUNDLES[@]}"; do
    if [ ! -f "$MCP_DIST/$bundle" ]; then
        if get_bundle "$LATEST_TAG" "$bundle" "$MCP_DIST/$bundle"; then
            echo "[baume]   Got $bundle"
        else
            echo "[baume]   Warning: Failed to get $bundle"
        fi
    fi
done

# Get openapi-reviewer bundles (from cache or download)
for bundle in "${REVIEWER_BUNDLES[@]}"; do
    if [ ! -f "$REVIEWER_DIST/$bundle" ]; then
        if get_bundle "$LATEST_TAG" "$bundle" "$REVIEWER_DIST/$bundle"; then
            echo "[baume]   Got $bundle"
        else
            echo "[baume]   Warning: Failed to get $bundle"
        fi
    fi
done

# Mark this version as cached
touch "$CACHE_VERSION_FILE"

# Final check
if check_bundles "$MCP_DIST" "${MCP_BUNDLES[@]}" && \
   check_bundles "$REVIEWER_DIST" "${REVIEWER_BUNDLES[@]}"; then
    echo "[baume] Ready (Node.js $(node -v), release $LATEST_TAG)"
else
    echo "[baume] Warning: Some bundles may be missing. Features may be limited."
fi
