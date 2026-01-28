# Baume MCP Server Deployment Guide

Deploy the Baume MCP server to Fly.io with PostgreSQL and S3-compatible storage.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Fly.io (Paris CDG)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   MCP Server    │───▶│   Fly Postgres  │                │
│  │  (scale-to-zero)│    │   (metadata)    │                │
│  └────────┬────────┘    └─────────────────┘                │
│           │                                                 │
│           │             ┌─────────────────┐                │
│           └────────────▶│  Tigris S3      │                │
│                         │  (file content) │                │
│                         └─────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Ory Network   │
                    │    (OAuth2)     │
                    └─────────────────┘
```

## Prerequisites

### Fly.io CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Authenticate
fly auth login
```

### Ory CLI

```bash
# macOS
brew install ory/tap/ory

# Linux
bash <(curl https://raw.githubusercontent.com/ory/meta/master/install.sh) -b /usr/local/bin ory

# Authenticate (opens browser)
ory auth

# Verify
ory auth whoami
```

### Accounts

- **Fly.io**: [fly.io](https://fly.io)
- **Ory Network** (free tier): [console.ory.sh](https://console.ory.sh)

## Cost Estimate

| Component     | Specification                                                | Monthly Cost  |
| ------------- | ------------------------------------------------------------ | ------------- |
| MCP Server    | shared-cpu-1x, 256MB, scale-to-zero                          | ~$2           |
| Fly Postgres  | 1 node, 256MB, 1GB storage                                   | ~$2           |
| Upstash Redis | Pay-as-you-go, 500K free commands (optional, for multi-node) | ~$0-5         |
| Tigris S3     | 5GB free, then $0.02/GB                                      | ~$0-2         |
| IPv4 Address  | Dedicated public IP                                          | $2            |
| **Total**     |                                                              | **~$6-13/mo** |

---

## Local Testing

Before deploying, test locally with Docker.

### Build the Image

```bash
cd plugins/baume/mcp-server

# Build from repo root context
docker build -t baume-mcp:test -f Dockerfile ../../..
```

### Run Without Auth (Quick Test)

```bash
docker run -d --name aip-test -p 4000:4000 \
  -e AUTH_ENABLED=false \
  baume-mcp:test

# Verify
curl http://localhost:4000/health

# Cleanup
docker stop aip-test && docker rm aip-test
```

### Run With Auth (Full Test)

```bash
docker run -d --name aip-test -p 4000:4000 \
  -e AUTH_ENABLED=true \
  -e ORY_PROJECT_URL="https://YOUR-PROJECT.projects.oryapis.com" \
  -e MCP_RESOURCE_URI="http://localhost:4000" \
  baume-mcp:test

# Health check (excluded from auth)
curl http://localhost:4000/health

# OAuth metadata
curl http://localhost:4000/.well-known/oauth-protected-resource

# MCP endpoint requires auth (should return 401)
curl http://localhost:4000/mcp

# Cleanup
docker stop aip-test && docker rm aip-test
```

### Run With Full Stack (Postgres + S3)

```bash
# Start Postgres
docker run -d --name aip-postgres \
  -e POSTGRES_USER=aip \
  -e POSTGRES_PASSWORD=aip \
  -e POSTGRES_DB=aip \
  -p 5432:5432 \
  postgres:16-alpine

# Start MinIO (S3-compatible)
docker run -d --name aip-minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -p 9000:9000 \
  minio/minio server /data

# Create bucket (wait a few seconds for MinIO to start)
docker run --rm --link aip-minio minio/mc \
  alias set local http://aip-minio:9000 minioadmin minioadmin && \
  mc mb local/baume-mcp

# Run MCP server
docker run -d --name aip-test -p 4000:4000 \
  --link aip-postgres --link aip-minio \
  -e AUTH_ENABLED=false \
  -e DATABASE_URL="postgresql://aip:aip@aip-postgres:5432/aip" \
  -e S3_ACCESS_KEY_ID="minioadmin" \
  -e S3_SECRET_ACCESS_KEY="minioadmin" \
  -e S3_ENDPOINT="http://aip-minio:9000" \
  -e S3_BUCKET_SPECS="baume-mcp" \
  -e S3_BUCKET_FINDINGS="baume-mcp" \
  -e S3_FORCE_PATH_STYLE="true" \
  baume-mcp:test

# Verify
curl http://localhost:4000/health

# Cleanup
docker stop aip-test aip-postgres aip-minio
docker rm aip-test aip-postgres aip-minio
```

---

## Quick Start

### 1. Create the Fly App

```bash
cd plugins/baume/mcp-server

# Create app (will prompt for name)
fly apps create baume-mcp --org personal
```

### 2. Create PostgreSQL Database

```bash
# Create Fly Postgres cluster (single node for dev)
fly postgres create \
  --name baume-mcp-db \
  --region cdg \
  --vm-size shared-cpu-1x \
  --volume-size 1 \
  --initial-cluster-size 1

# Attach to app (creates DATABASE_URL secret automatically)
fly postgres attach baume-mcp-db --app baume-mcp
```

### 3. Create Redis (Upstash) — Optional

Redis is only needed for multi-node deployments to share sessions across instances.
Skip this step for single-node deployments.

```bash
# Create Upstash Redis via Fly.io
fly redis create \
  --name baume-mcp-redis \
  --region cdg \
  --no-replicas

# Note the connection URL, then set as secret
fly secrets set REDIS_URL="redis://default:xxx@fly-baume-mcp-redis.upstash.io:6379" --app baume-mcp
```

### 4. Create Tigris S3 Bucket

```bash
# Create Tigris bucket
fly storage create baume-mcp-specs

# This automatically sets these secrets:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY
# - BUCKET_NAME
# - AWS_ENDPOINT_URL_S3
```

### 5. Set Secrets

```bash
fly secrets set \
  AUTH_ENABLED="true" \
  ORY_PROJECT_URL="https://YOUR-PROJECT.projects.oryapis.com" \
  MCP_RESOURCE_URI="https://baume-mcp.fly.dev" \
  ALLOWED_ORIGINS="https://claude.ai" \
  --app baume-mcp

# Optional: for correlate tool
fly secrets set ANTHROPIC_API_KEY="sk-ant-..." --app baume-mcp
```

### 6. Deploy

```bash
fly deploy
```

---

## Configuration Files

### fly.toml

Create `fly.toml` in the mcp-server directory:

```toml
app = "baume-mcp"
primary_region = "cdg"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "4000"
  LOG_LEVEL = "info"
  NODE_ENV = "production"
  # Storage auto-detection:
  # - Metadata store: postgres if DATABASE_URL set, else sqlite
  # - File backend: S3 if AWS_ACCESS_KEY_ID set, else local
  # Configure via secrets (see below)

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [http_service.concurrency]
    type = "requests"
    hard_limit = 250
    soft_limit = 200

[[http_service.checks]]
  grace_period = "30s"
  interval = "30s"
  method = "GET"
  path = "/health"
  timeout = "5s"

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

---

## Environment Variables

### Storage (Auto-Detected)

The server auto-detects storage backends based on available environment variables:

| Condition          | Metadata Store | File Backend                |
| ------------------ | -------------- | --------------------------- |
| `DATABASE_URL` set | PostgreSQL     | S3 (if configured) or local |
| No `DATABASE_URL`  | SQLite         | Local filesystem            |

### S3/Tigris (auto-set by `fly storage create`)

| Variable                | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | S3 access key (Tigris: `tid_xxx`)              |
| `AWS_SECRET_ACCESS_KEY` | S3 secret key (Tigris: `tsec_xxx`)             |
| `AWS_ENDPOINT_URL_S3`   | S3 endpoint (`https://fly.storage.tigris.dev`) |
| `BUCKET_NAME`           | S3 bucket name                                 |

Alternative S3 variable names (take precedence over `AWS_*` if set):

| Variable               | Description                            |
| ---------------------- | -------------------------------------- |
| `S3_ACCESS_KEY_ID`     | S3 access key                          |
| `S3_SECRET_ACCESS_KEY` | S3 secret key                          |
| `S3_ENDPOINT`          | S3 endpoint                            |
| `S3_BUCKET_SPECS`      | Bucket for spec files                  |
| `S3_BUCKET_FINDINGS`   | Bucket for findings                    |
| `S3_REGION`            | S3 region (default: `auto`)            |
| `S3_FORCE_PATH_STYLE`  | Use path-style URLs (default: `false`) |

### Authentication

| Variable              | Required        | Description                                 |
| --------------------- | --------------- | ------------------------------------------- |
| `AUTH_ENABLED`        | Yes             | Set to `true` to enable OAuth2              |
| `ORY_PROJECT_URL`     | If auth enabled | Ory Network project URL                     |
| `MCP_RESOURCE_URI`    | If auth enabled | Public URL of this MCP server               |
| `ORY_PROJECT_API_KEY` | No              | Ory admin API key (for token introspection) |
| `OAUTH_CLIENT_ID`     | No              | OAuth2 client ID                            |
| `OAUTH_CLIENT_SECRET` | No              | OAuth2 client secret                        |

### Redis (for multi-node deployments)

| Variable    | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| `REDIS_URL` | Redis connection string (optional, for session sharing across nodes) |

### Other

| Variable                  | Default                          | Description                                               |
| ------------------------- | -------------------------------- | --------------------------------------------------------- |
| `PORT`                    | 4000                             | Server port                                               |
| `LOG_LEVEL`               | info                             | Logging level                                             |
| `ALLOWED_ORIGINS`         | localhost                        | CORS origins (comma-separated)                            |
| `ANTHROPIC_API_KEY`       | -                                | For baume-correlate tool                                  |
| `CLAUDE_CODE_OAUTH_TOKEN` | -                                | Alternative to ANTHROPIC_API_KEY                          |
| `TEMP_TTL_MS`             | 300000                           | Temp storage TTL (5 min)                                  |
| `FINDINGS_TTL_MS`         | 0 (postgres) / 86400000 (others) | Findings TTL. Use `0` for infinite (default for postgres) |

---

## Ory Network Setup

### 1. Create Project

1. Go to [console.ory.sh](https://console.ory.sh)
2. Create new project (free Developer tier)
3. Note your project details:
   - Project URL: `https://YOUR-SLUG.projects.oryapis.com`
   - Project ID: found in project settings
   - Workspace ID: found in workspace settings

### 2. GitHub Social Login

1. Create GitHub OAuth App: [github.com/settings/developers](https://github.com/settings/developers)
   - Homepage: `https://YOUR-PROJECT.projects.oryapis.com`
   - Callback: `https://YOUR-PROJECT.projects.oryapis.com/self-service/methods/oidc/callback/github`
2. In Ory Console: Authentication > Social Sign-In > Add GitHub
3. Enter Client ID and Client Secret from GitHub

### 3. Create MCP OAuth2 Client

```bash
ory create oauth2-client \
  --project YOUR-PROJECT-ID \
  --workspace YOUR-WORKSPACE-ID \
  --name "Baume MCP Server" \
  --grant-type authorization_code,refresh_token \
  --response-type code \
  --scope "openid offline_access" \
  --redirect-uri "http://localhost:4000/oauth/callback" \
  --redirect-uri "https://baume-mcp.fly.dev/oauth/callback" \
  --token-endpoint-auth-method client_secret_post
```

Save the returned client ID and secret.

### 4. Export/Import Configuration (Environment Replication)

Use the scripts in `scripts/` to replicate Ory configuration across environments.

#### Export from existing project

```bash
# Set source project
export ORY_PROJECT_ID="61f88477-eab5-4a53-92c7-11b6976e658f"
export ORY_WORKSPACE_ID="d20c1743-f263-48d8-912b-fd98d03a224c"

# Export all config
./scripts/ory-export.sh ./ory-config
```

This exports:

- `project.json` - Full project config (identity, oauth2, permission services)
- `oauth2-clients.json` - All OAuth2 clients (secrets NOT included)
- `manifest.json` - Export metadata and notes

#### Import to new project

```bash
# Set target project
export ORY_TARGET_PROJECT_ID="new-project-id"
export ORY_TARGET_WORKSPACE_ID="workspace-id"

# Import (will prompt for confirmation)
./scripts/ory-import.sh ./ory-config

# Or create new project during import
./scripts/ory-import.sh ./ory-config --project new

# Dry run to preview changes
./scripts/ory-import.sh ./ory-config --dry-run
```

#### Post-import steps

1. **Regenerate OAuth2 client secrets** - secrets are not exported
2. **Update redirect URIs** for the target environment
3. **Reconfigure social login secrets** in Ory Console (GitHub OAuth credentials)
4. **Update MCP server** with new `ORY_PROJECT_URL`

#### Find project/workspace IDs

```bash
# List workspaces
ory list workspaces

# List projects in workspace
ory list projects --workspace <workspace-id>

# Get project details
ory get project <project-id> --workspace <workspace-id> --format json
```

---

## Operations

### View Logs

```bash
fly logs --app baume-mcp
```

### Connect to Postgres

```bash
fly postgres connect --app baume-mcp-db
```

### Scale Up (for production)

```bash
# Increase MCP server resources
fly scale vm shared-cpu-2x --memory 512 --app baume-mcp

# Scale Postgres (create replica)
fly postgres create \
  --name baume-mcp-db-replica \
  --region ams \
  --vm-size shared-cpu-1x \
  --volume-size 1
```

### Custom Domain

#### 1. Add Certificate

```bash
fly certs add baume-mcp.yourdomain.com --app baume-mcp
```

#### 2. Configure DNS

For **subdomains** (e.g., `aip.example.com`), add a CNAME record:

```
baume-mcp.yourdomain.com  CNAME  baume-mcp.fly.dev
```

For **apex domains** (e.g., `example.com`), use an A record with dedicated IP:

```bash
# Get your app's IP
fly ips list --app baume-mcp

# Add A record pointing to the IPv4 address
```

#### 3. Verify Certificate

```bash
# Check certificate status (may take a few minutes for DNS propagation)
fly certs show baume-mcp.yourdomain.com --app baume-mcp
```

Status should show "Ready" when complete.

#### 4. Update Configuration

After adding a custom domain, update these:

```bash
# Update MCP resource URI
fly secrets set MCP_RESOURCE_URI="https://baume-mcp.yourdomain.com" --app baume-mcp
```

And in Ory, add the new redirect URI to your OAuth2 client:

```bash
ory update oauth2-client CLIENT_ID \
  --project YOUR-PROJECT-ID \
  --workspace YOUR-WORKSPACE-ID \
  --redirect-uri "https://baume-mcp.yourdomain.com/oauth/callback" \
  --redirect-uri "https://baume-mcp.fly.dev/oauth/callback" \
  --redirect-uri "http://localhost:4000/oauth/callback"
```

---

## Verify Deployment

```bash
# Health check
curl https://baume-mcp.fly.dev/health

# OAuth2 discovery
curl https://baume-mcp.fly.dev/.well-known/oauth-protected-resource

# MCP Inspector
npx @anthropic/mcp-inspector https://baume-mcp.fly.dev/mcp
```

Expected health response:

```json
{
  "findingsStorage": { "type": "postgres" },
  "status": "ok",
  "tempStorage": { "count": 0, "type": "s3" },
  "version": "1.0.0",
  "workerPool": { "available": 1, "busy": 0, "queued": 0, "total": 1 }
}
```

---

## Troubleshooting

### Cold Start Timeout

If health checks fail after scale-to-zero:

```bash
# Increase grace period in fly.toml
[[http_service.checks]]
  grace_period = "60s"
```

### Database Connection Issues

```bash
# Check Postgres status
fly status --app baume-mcp-db

# Verify DATABASE_URL is set
fly secrets list --app baume-mcp
```

### Redis Connection Issues

```bash
# Check Redis status
fly redis status baume-mcp-redis

# Test connection
fly ssh console --app baume-mcp
> node -e "require('redis').createClient({url: process.env.REDIS_URL}).connect().then(() => console.log('OK'))"
```

### Ory CLI Issues

```bash
# Re-authenticate
ory auth logout
ory auth

# Check current session
ory auth whoami
```

### Local Development with OAuth (MCP Inspector)

Ory Network **does not allow CORS from localhost origins**. To test OAuth-protected MCP endpoints locally with browser-based tools like MCP Inspector, use **Ory Tunnel**.

#### How It Works

Ory Tunnel creates a local proxy that:

- Runs on `http://localhost:4000` (default)
- Proxies all Ory APIs (`/.well-known/*`, `/oauth2/*`, `/ui/*`, etc.)
- Rewrites URLs in responses to use localhost
- Enables cookies and CORS to work on localhost

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  MCP Inspector  │────▶│   MCP Server    │────▶│   Ory Tunnel    │
│ localhost:6274  │     │  localhost:3000 │     │  localhost:4000 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  Ory Network    │
                                               │ *.oryapis.com   │
                                               └─────────────────┘
```

#### Setup Steps

1. **Create Ory Project API Key** (for headless tunnel operation):

   ```bash
   # Go to console.ory.sh → Project Settings → API Keys
   # Create a new API key and export it
   export ORY_PROJECT_API_KEY="ory_pat_..."
   ```

2. **Start Ory Tunnel**:

   ```bash
   ory tunnel --dev --project YOUR-PROJECT-ID http://localhost:3000
   # Tunnel listens on http://localhost:4000
   ```

3. **Run MCP Server Locally** (pointing to tunnel):

   ```bash
   # Build the image first
   docker build -t baume-mcp:test -f plugins/baume/mcp-server/Dockerfile .

   # Run with tunnel as OAuth provider
   docker run -d --name baume-local -p 3000:4000 \
     -e AUTH_ENABLED=true \
     -e ORY_PROJECT_URL="http://host.docker.internal:4000" \
     -e MCP_RESOURCE_URI="http://localhost:3000" \
     -e ALLOWED_ORIGINS="http://localhost:6274" \
     baume-mcp:test
   ```

4. **Test with MCP Inspector**:

   ```bash
   npx @modelcontextprotocol/inspector
   # Opens http://localhost:6274

   # In Inspector UI:
   # - Transport Type: Streamable HTTP
   # - URL: http://localhost:3000/mcp
   ```

The OAuth flow works because:

- Inspector fetches `/.well-known/oauth-protected-resource` from MCP server
- MCP server returns `authorization_servers: ["http://localhost:4000"]` (tunnel)
- Inspector fetches OAuth metadata from tunnel (no CORS issues - same origin)
- User authenticates via tunnel UI at `http://localhost:4000/ui/login`

#### Production CORS Configuration

For production browser clients on custom domains, enable CORS in Ory Network:

```bash
ory patch project YOUR-PROJECT-ID \
  --workspace YOUR-WORKSPACE-ID \
  --replace '/cors_public/enabled=true' \
  --replace '/cors_public/origins=["https://*.yourdomain.com"]'
```

Notes:

- Wildcard subdomains (`https://*.example.com`) are supported
- `localhost` and `127.0.0.1` are **never** allowed by Ory Network
- Exact matches are recommended for better security

---

## CI/CD with GitHub Actions

The repository includes `.github/workflows/mcp-server-deploy.yml` for automatic deployments.

### Required Secrets

Add these to your GitHub repository secrets:

| Secret          | Description                                   |
| --------------- | --------------------------------------------- |
| `FLY_API_TOKEN` | Fly.io API token (`fly tokens create deploy`) |

### Manual Deployment Trigger

```bash
gh workflow run mcp-server-deploy.yml --ref main -f deploy=true
```
