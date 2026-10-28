#!/usr/bin/env bash
set -e

# ==============================================================================
# Flex Coop Solution - Pre-Deployment Verification Gate
# Ensures zero wasted cost on Google Cloud Build and Firebase remote operations
# ==============================================================================

echo "======================================================================"
echo "🛡️  FLEX COOP SOLUTION - PRE-DEPLOYMENT LOCAL VERIFICATION GATE"
echo "======================================================================"
echo "Enforcing rule: NO Cloud Build or remote deployments until tests pass locally."
echo "Targeting minimal GCP cost with Firebase Local Emulator Suite."
echo ""

# 1. Verify Prerequisites
echo "▶ Step 1: Checking local toolchain..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

echo "  ✅ Node.js: $(node --version)"
echo "  ✅ npm: $(npm --version)"

HAS_JAVA=false
if java -version >/dev/null 2>&1; then
  HAS_JAVA=true
  echo "  ✅ Java: Available"
else
  echo "  ⚠️ Java JRE not detected: Firebase Local Emulator suite will be bypassed; running standalone in-memory test suite."
fi
echo ""

# 2. Compile TypeScript in all workspaces
echo "▶ Step 2: Compiling workspace TypeScript packages..."
npm run build
echo "  ✅ TypeScript compilation succeeded with 0 errors across all workspaces."
echo ""

# 3. Execute all unit, integration & domain verification queries
echo "▶ Step 3: Executing comprehensive verification suite..."
echo ""

if [ "$HAS_JAVA" = true ] && command -v firebase >/dev/null 2>&1; then
  TEST_EXEC='firebase emulators:exec --only firestore,auth "npm run test" --project flex-coop-solution'
else
  TEST_EXEC='npm run test'
fi

if eval "$TEST_EXEC"; then
  echo ""
  echo "======================================================================"
  echo "🎉 PRE-DEPLOYMENT VERIFICATION PASSED SUCCESSFULLY!"
  echo "======================================================================"
  echo "  ✅ All core domain test cases verified."
  echo "  ✅ Multi-tenant data isolation and CDA double-entry balancing confirmed."
  echo "  ✅ Code is safe to deploy without wasting Cloud Build build-minutes or Firestore operations."
  echo ""
  exit 0
else
  echo ""
  echo "======================================================================"
  echo "❌ PRE-DEPLOYMENT VERIFICATION FAILED!"
  echo "======================================================================"
  echo "🛑 DEPLOYMENT BLOCKED: Local tests failed against Firebase Local Emulator."
  echo "   Cloud Build and remote Cloud Run deployments are strictly PREVENTED."
  echo "   Fix the test failures above before attempting deployment."
  echo ""
  exit 1
fi
