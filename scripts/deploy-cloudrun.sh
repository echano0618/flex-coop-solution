#!/usr/bin/env bash
set -e

# ==============================================================================
# Flex Coop Solution - Minimal Cost Cloud Run Deployment Script
#
# Rules enforced:
# 1. Tests must pass locally with Firebase Local Emulator Suite first!
# 2. Cloud Run scale-to-zero: --min-instances=0
# 3. CPU allocated only during request processing: --cpu-throttling
# 4. Minimal memory footprint: 512Mi
# 5. Cap instances to prevent unexpected traffic spikes: --max-instances=5
# ==============================================================================

PROJECT_ID="${GCP_PROJECT:-coop-solution}"
REGION="${GCP_REGION:-asia-southeast1}"
API_SERVICE_NAME="flexcoop-api"
WEB_SERVICE_NAME="flexcoop-web"

echo "======================================================================"
echo "🚀 CLOUD RUN MINIMAL-COST DEPLOYMENT PIPELINE"
echo "Target Project: ${PROJECT_ID}"
echo "Target Region:  ${REGION}"
echo "======================================================================"
echo ""

# STEP 1: Mandatory Local Pre-Deployment Gate
echo "🔒 ENFORCING PRE-DEPLOYMENT TEST GATE..."
bash "$(dirname "$0")/predeploy-check.sh"

echo ""
echo "======================================================================"
echo "⚡ PROCEEDING WITH COST-OPTIMIZED CLOUD RUN CONFIGURATION"
echo "======================================================================"
echo "Settings applied:"
echo "  • --min-instances=0       (Scale to zero when idle: ₱0.00 idle cost)"
echo "  • --cpu-throttling        (CPU allocated only during active requests)"
echo "  • --memory=512Mi          (Smallest viable memory tier)"
echo "  • --cpu=1                 (1 vCPU limit)"
echo "  • --max-instances=5       (Hard ceiling to prevent rogue spend)"
echo "  • --concurrency=80        (High multiplexing per container instance)"
echo ""

# Prompt or check flag for actual deployment
if [ "$1" == "--dry-run" ]; then
  echo "🔎 [DRY RUN] Verification passed. Skipping remote deployment command."
  echo "To deploy for real, run: bash scripts/deploy-cloudrun.sh --execute"
  exit 0
fi

API_IMAGE="asia-southeast1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${API_SERVICE_NAME}:latest"
WEB_IMAGE="asia-southeast1-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${WEB_SERVICE_NAME}:latest"

if [ "$1" != "--execute" ]; then
  echo "ℹ️  Run with --execute to perform actual deployment, e.g.:"
  echo "   npm run deploy:cloudrun -- --execute"
  echo "   or dry-run with: npm run deploy:cloudrun -- --dry-run"
  exit 0
fi

echo "▶ Step 1: Building container images via Cloud Build..."
gcloud builds submit --config=cloudbuild.yaml --project="${PROJECT_ID}" .

echo ""
echo "▶ Step 2: Deploying API and Web Portal to Cloud Run with minimal cost profile..."

# Deploy/Update API Service
gcloud run services update "${API_SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${API_IMAGE}" \
  --min-instances=0 \
  --max-instances=5 \
  --cpu-throttling \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80

# Deploy/Update Web Portal Service
gcloud run services update "${WEB_SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --image="${WEB_IMAGE}" \
  --min-instances=0 \
  --max-instances=5 \
  --cpu-throttling \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80

echo ""
echo "======================================================================"
echo "✅ CLOUD RUN SERVICES SUCCESSFULLY DEPLOYED WITH MINIMAL GCP COST!"
echo "======================================================================"
echo "API URL: https://flexcoop-api-607281616647.asia-southeast1.run.app"
echo "Web URL: https://flexcoop-web-607281616647.asia-southeast1.run.app"
echo "Services are now live with scale-to-zero and CPU idle throttling enabled."
