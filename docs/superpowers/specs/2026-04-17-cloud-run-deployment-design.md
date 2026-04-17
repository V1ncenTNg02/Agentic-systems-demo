# Cloud Run Deployment — Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Author:** V1ncenTNg02

---

## 1. Overview

Deploy the Agentic Systems Demo (Next.js App Router, pnpm) to Google Cloud Run via a GitHub Actions CI/CD pipeline. On every push to `main`, GitHub Actions builds a Docker image, pushes it to Google Artifact Registry, and deploys to Cloud Run. The `OPENAI_API_KEY` secret is stored in Google Secret Manager and mounted as an environment variable at runtime.

---

## 2. Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `next.config.ts` | Modify | Add `output: 'standalone'` to enable minimal Docker image |
| `Dockerfile` | Create | Multi-stage build: deps → builder → runner |
| `.dockerignore` | Create | Exclude `node_modules`, `.git`, `.next/cache`, etc. |
| `.github/workflows/deploy.yml` | Create | CI/CD pipeline: build → push → deploy |

---

## 3. Dockerfile Design

Three-stage multi-stage build targeting `node:20-alpine`:

### Stage 1 — `deps`
- Install pnpm via `corepack enable`
- Copy `package.json` and `pnpm-lock.yaml`
- Run `pnpm install --frozen-lockfile`

### Stage 2 — `builder`
- Copy installed `node_modules` from `deps`
- Copy all source files
- Set `NODE_ENV=production`
- Run `pnpm build` (produces `.next/standalone` via `output: 'standalone'`)

### Stage 3 — `runner`
- Fresh `node:20-alpine` base (no build tools)
- Copy `.next/standalone` from `builder`
- Copy `.next/static` into `standalone/.next/static`
- Copy `public/` into `standalone/public/`
- Expose port `3000`
- `CMD ["node", "server.js"]`

---

## 4. .dockerignore

Excludes: `node_modules/`, `.next/`, `.git/`, `*.md`, `.env*`, `.superpowers/`, `docs/`

---

## 5. next.config.ts Change

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

This tells Next.js to bundle only the files needed to run the server, reducing the final image size significantly.

---

## 6. GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`
**Trigger:** `push` to `main` branch

### Steps

1. **Checkout** — `actions/checkout@v4`
2. **Auth to GCP** — `google-github-actions/auth@v2` using Workload Identity Federation (no JSON key file)
3. **Set up Cloud SDK** — `google-github-actions/setup-gcloud@v2`
4. **Auth Docker** — `gcloud auth configure-docker $AR_REGION-docker.pkg.dev`
5. **Build & push image** — Docker build tagged `$AR_REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/$SERVICE_NAME:$GITHUB_SHA`
6. **Deploy to Cloud Run** — `gcloud run deploy` with:
   - `--image` pointing to the pushed image
   - `--region $CLOUD_RUN_REGION`
   - `--platform managed`
   - `--allow-unauthenticated` (public demo)
   - `--port 3000`
   - `--memory 512Mi`
   - `--min-instances 0`
   - `--max-instances 3`
   - `--set-secrets OPENAI_API_KEY=openai-api-key:latest`

### GitHub Repository Secrets Required

| Secret | Description |
|--------|-------------|
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `WIF_PROVIDER` | Workload Identity Federation provider resource name |
| `WIF_SERVICE_ACCOUNT` | Service account email used by the pipeline |
| `AR_REGION` | Artifact Registry region (e.g. `us-central1`) |
| `AR_REPO` | Artifact Registry repository name (e.g. `agentic-demo`) |
| `CLOUD_RUN_REGION` | Cloud Run region (e.g. `us-central1`) |
| `SERVICE_NAME` | Cloud Run service name (e.g. `agentic-demo`) |

---

## 7. One-Time GCP Setup (Manual Steps)

These steps are performed once by the developer before the first pipeline run.

### 7.1 Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  iamcredentials.googleapis.com \
  --project=$PROJECT_ID
```

### 7.2 Create Artifact Registry Repository

```bash
gcloud artifacts repositories create $AR_REPO \
  --repository-format=docker \
  --location=$AR_REGION \
  --project=$PROJECT_ID
```

### 7.3 Create Workload Identity Federation Pool and Provider

```bash
# Create pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --project=$PROJECT_ID

# Create provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --project=$PROJECT_ID
```

### 7.4 Create Service Account and Bind Permissions

```bash
# Get your project number (needed for WIF resource names)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Create service account
gcloud iam service-accounts create "github-actions-sa" \
  --project=$PROJECT_ID

SA_EMAIL="github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com"
POOL_NAME="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool"

# Allow GitHub repo to impersonate this SA
# Replace YOUR_GITHUB_ORG/YOUR_REPO_NAME with e.g. V1ncenTNg02/Agentic-systems-demo
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/$POOL_NAME/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO_NAME" \
  --project=$PROJECT_ID

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

### 7.5 Store OPENAI_API_KEY in Secret Manager

```bash
echo -n "your-openai-api-key" | gcloud secrets create openai-api-key \
  --data-file=- \
  --project=$PROJECT_ID
```

### 7.6 Grant Cloud Run Runtime SA Access to the Secret

Cloud Run uses the Compute Engine default service account at runtime. Grant it secret access:

```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
COMPUTE_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:$COMPUTE_SA" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

---

## 8. Cloud Run Service Configuration

| Setting | Value |
|---------|-------|
| Port | `3000` |
| Min instances | `0` (scale to zero) |
| Max instances | `3` |
| Memory | `512Mi` |
| CPU | `1` |
| Auth | `--allow-unauthenticated` (public demo) |
| Secret | `OPENAI_API_KEY` from Secret Manager `openai-api-key:latest` |

---

## 9. SSE Compatibility Note

The app uses Server-Sent Events (SSE) via `fetch + ReadableStream` on the client (not native `EventSource`). Cloud Run supports HTTP/1.1 streaming, so SSE works without special configuration as long as `Cache-Control: no-cache` is set on the route handlers (already done per CLAUDE.md).

---

## 10. Out of Scope

- Custom domain / Cloud Load Balancer
- Cloud CDN
- Multi-region deployment
- Database or auth layer (app is stateless)
