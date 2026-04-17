# Cloud Run Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Agentic Systems Demo to Google Cloud Run with a GitHub Actions pipeline that auto-deploys on push to `main`.

**Architecture:** A multi-stage Dockerfile produces a minimal Next.js standalone image (~120MB), pushed to Google Artifact Registry on every `main` push via GitHub Actions using Workload Identity Federation for keyless auth. Cloud Run serves the container publicly; `OPENAI_API_KEY` is injected at runtime from Google Secret Manager.

**Tech Stack:** Docker (multi-stage, node:20-alpine), Google Artifact Registry, Google Cloud Run, Google Secret Manager, Workload Identity Federation, GitHub Actions (`google-github-actions/auth@v2`, `google-github-actions/setup-gcloud@v2`), Next.js standalone output, pnpm

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `next.config.ts` | Modify | Enable `output: 'standalone'` for minimal Docker image |
| `.dockerignore` | Create | Exclude dev artifacts from Docker build context |
| `Dockerfile` | Create | Three-stage build: deps → builder → runner |
| `.github/workflows/deploy.yml` | Create | CI/CD: build image → push to AR → deploy to Cloud Run |

---

## Task 1: Enable Next.js Standalone Output

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update next.config.ts**

Replace the full file contents with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: Verify the build produces standalone output**

```bash
pnpm build
```

Expected: build succeeds and `.next/standalone/` directory is created. You should see a `server.js` file inside it.

```bash
ls .next/standalone/
```

Expected output includes: `server.js`, `node_modules/`, `package.json`

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: enable Next.js standalone output for Docker"
```

---

## Task 2: Create .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

Create the file at the project root with these contents:

```
node_modules
.next
.git
.gitignore
*.md
.env
.env.*
.superpowers
docs
.claude
tsconfig.tsbuildinfo
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "feat: add .dockerignore for Docker build"
```

---

## Task 3: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create the Dockerfile**

Create at the project root:

```dockerfile
# Stage 1: install dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: build the app
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Stage 3: minimal production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

- [ ] **Step 2: Build the image locally to verify it works**

> Requires Docker Desktop running on your machine.

```bash
docker build -t agentic-demo:local .
```

Expected: build completes through all three stages with no errors. Final image should be ~150–200MB.

- [ ] **Step 3: Smoke-test the container locally**

```bash
docker run -p 3000:3000 agentic-demo:local
```

Open http://localhost:3000 in a browser. Expected: the app loads and you can navigate to any pattern page.

Stop the container with `Ctrl+C`.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile for Cloud Run"
```

---

## Task 4: Create GitHub Actions Deployment Workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

> **Before this task:** complete the one-time GCP setup in the design spec (`docs/superpowers/specs/2026-04-17-cloud-run-deployment-design.md`, sections 7.1–7.6). Then add these 7 secrets to your GitHub repo under **Settings → Secrets and variables → Actions**:
>
> | Secret | Example value |
> |--------|--------------|
> | `GCP_PROJECT_ID` | `my-project-123` |
> | `WIF_PROVIDER` | `projects/123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
> | `WIF_SERVICE_ACCOUNT` | `github-actions-sa@my-project-123.iam.gserviceaccount.com` |
> | `AR_REGION` | `us-central1` |
> | `AR_REPO` | `agentic-demo` |
> | `CLOUD_RUN_REGION` | `us-central1` |
> | `SERVICE_NAME` | `agentic-demo` |

- [ ] **Step 1: Create the workflow directory and file**

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  AR_REGION: ${{ secrets.AR_REGION }}
  AR_REPO: ${{ secrets.AR_REPO }}
  SERVICE_NAME: ${{ secrets.SERVICE_NAME }}
  CLOUD_RUN_REGION: ${{ secrets.CLOUD_RUN_REGION }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.AR_REGION }}-docker.pkg.dev --quiet

      - name: Build and push Docker image
        run: |
          IMAGE="${{ env.AR_REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.AR_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }}"
          docker build -t "$IMAGE" .
          docker push "$IMAGE"

      - name: Deploy to Cloud Run
        run: |
          IMAGE="${{ env.AR_REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.AR_REPO }}/${{ env.SERVICE_NAME }}:${{ github.sha }}"
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image "$IMAGE" \
            --region ${{ env.CLOUD_RUN_REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --port 3000 \
            --memory 512Mi \
            --min-instances 0 \
            --max-instances 3 \
            --set-secrets OPENAI_API_KEY=openai-api-key:latest \
            --project ${{ env.PROJECT_ID }}
```

- [ ] **Step 2: Commit and push to trigger the first deployment**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add GitHub Actions workflow for Cloud Run deployment"
git push origin main
```

- [ ] **Step 3: Verify the pipeline runs successfully**

Go to your GitHub repo → **Actions** tab. You should see the "Deploy to Cloud Run" workflow running. Wait for it to complete (typically 3–5 minutes).

Expected: all steps show green checkmarks.

- [ ] **Step 4: Verify the live deployment**

```bash
gcloud run services describe $SERVICE_NAME \
  --region $CLOUD_RUN_REGION \
  --project $PROJECT_ID \
  --format "value(status.url)"
```

Open the printed URL in a browser. Expected: the app loads and all 5 pattern pages work, including the SSE-powered agent stream.
