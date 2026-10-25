# 🇵🇭 Local Development, Local Firebase & Minimal GCP Cost Architecture

This guide details how **Flex Coop Solution** eliminates cloud testing costs by running the **Firebase Local Emulator Suite** and a **Local API Test Server**, enforcing a strict **Pre-Deployment Test Gate** to prevent premature Cloud Build / GCP spend, and configuring **Google Cloud Run** for minimal footprint and scale-to-zero.

---

## 🎯 Cost Optimization Objectives

1. **Zero Wasted Cloud Build Minutes**: Code is compiled and verified locally before any build trigger.
2. **Zero Remote Firestore Mutation Costs during Testing**: Every document read, query, write, and atomic transaction is executed against the Local Emulator Suite.
3. **Cloud Run Scale-to-Zero (`--min-instances=0`)**: ₱0.00 compute cost when the system is idle.
4. **CPU Throttling Enabled (`--cpu-throttling`)**: CPU is allocated **only** during active request processing.
5. **Minimal Memory Profile (`512Mi`)**: Cloud Run instances run with a slim 512Mi allocation.
6. **Hard Concurrency & Scaling Caps**: `--max-instances=5` and `--concurrency=80` protect against unexpected runaway costs.

---

## 🛠️ Local Environment & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LOCAL WORKSTATION (macOS)                      │
├───────────────────────────────────┬────────────────────────────────────┤
│       Next.js Web Portal          │         Modular Monolith API       │
│      (http://localhost:3000)      │       (http://localhost:4000)      │
└─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                  │                                    │
                  │                                    ▼
                  │                    ┌─────────────────────────────────┐
                  │                    │  FIREBASE LOCAL EMULATOR SUITE  │
                  │                    ├─────────────────────────────────┤
                  │                    │ • Firestore:      port 8080     │
                  └───────────────────►│ • Auth:           port 9099     │
                                       │ • Storage:        port 9199     │
                                       │ • Emulator UI:    port 4001     │
                                       └─────────────────────────────────┘
```

---

## 🚀 Quick Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Run Full Verification in Emulator** | `npm run test:emulator` | Starts Firestore/Auth emulators, runs all 327+ unit tests + 38 live Firestore queries & transactions, then shuts down. |
| **Start Standalone Firebase Emulator** | `npm run emulator:start` | Keeps the Firebase Emulator Suite running in foreground with UI at `http://localhost:4001`. |
| **Run Local API Server with Emulator** | `npm run dev:local` | Launches the Node.js/Express API connected to `localhost:8080` (Firestore) and `localhost:9099` (Auth). |
| **Run Next.js Admin Portal** | `npm run dev:admin` | Launches Admin Portal on `http://localhost:3000`. |
| **Pre-Deployment Safety Check** | `npm run predeploy:check` | Automated gate: verifies local compilation and tests all queries before deployment. |
| **Cloud Run Safe Deployment** | `npm run deploy:cloudrun -- --execute` | Enforces pre-deployment check, then deploys to Cloud Run with minimal cost flags. |

---

## 🧪 Comprehensive Firestore Query Testing in Emulator

Section 34 of `apps/api/src/test/suite.ts` tests **38 live Firestore operations and transactions** against the local emulator:

1. **Multi-Tenant Document Hierarchy**:
   - `fs.seedTenant()` creates tenant document and seeds CDA standard Chart of Accounts.
   - `fs.getTenant()` and `fs.listTenants()` test path and collection queries.
   - `fs.updateTenantStatus()` and `fs.updateTenantCreditBalance()`.
   - `fs.ensureFamilyTenantInitialized()` verifies idempotent root tenant creation.
2. **Chart of Accounts (CDA COA)**:
   - Verifies standard accounts (e.g. `1-01-01 Cash on Hand (Cashier/Counter)`).
   - Compound query with filter `where('category', '==', 'ASSETS')`.
3. **Members & Identity**:
   - Member creation, lookup by doc ID, compound query by `memberNumber`.
   - Mutation and member list queries.
4. **Member Credentials & Applications**:
   - Single-entry credential by email, compound lookup by `memberId`.
   - Application queue submission, retrieval, review, and approval state transitions.
5. **Loan Products & Loan Management**:
   - Loan product definitions, credit limit modifications, deletion.
   - Loan origination, lookup by `loanNumber`, disbursement status updates.
6. **CDA Double-Entry General Ledger (Atomic Firestore Transaction)**:
   - **Critical Rule Enforced**: All reads execute before writes inside `db.runTransaction()`.
   - Balanced voucher posting atomically increments Debit/Credit and updates CDA account balances.
   - Rejects unbalanced vouchers before write.
7. **Cashiering & Repayments (Atomic Balance Reduction)**:
   - Loan repayment transaction reads active balance, applies principal reduction, and automatically transitions status to `PAID_OFF` once balance hits ₱0.
8. **Operator Control Plane**:
   - Operator credentials, 6-digit numeric OTP generation, and session token verification.
9. **Platform Billing & Governance**:
   - Electronic invoices, AMLC covered transaction triggers, platform credit top-up requests, and broadcast dispatches.

---

## 🔒 Pre-Deployment Gate (`scripts/predeploy-check.sh`)

To guarantee zero wasted cost on Google Cloud:

```bash
npm run predeploy:check
```

If ANY test fails, the deployment script immediately exits with error code `1`:
```
❌ PRE-DEPLOYMENT VERIFICATION FAILED!
🛑 DEPLOYMENT BLOCKED: Local tests failed against Firebase Local Emulator.
   Cloud Build and remote Cloud Run deployments are strictly PREVENTED.
```

Remote deployments cannot be initiated until all tests pass locally.

---

## ☁️ Google Cloud Run Cost Optimization Flags

When ready to deploy, `scripts/deploy-cloudrun.sh` applies these cost-saving parameters:

```bash
gcloud run services update flexcoop-api \
  --project="coop-solution" \
  --region="asia-southeast1" \
  --min-instances=0 \
  --max-instances=5 \
  --cpu-throttling \
  --memory=512Mi \
  --cpu=1 \
  --concurrency=80
```

### Why These Flags Save Cost:
* **`--min-instances=0`**: Scale-to-zero. When no cooperative members or tellers are using the system, 0 containers run and 0 charges accrue.
* **`--cpu-throttling`**: CPU is only allocated and billed while processing an active HTTP request. During idle periods between requests, compute cost drops to 0.
* **`--memory=512Mi`**: Smallest viable memory footprint for Node.js Express service.
* **`--max-instances=5`**: Strict ceiling to eliminate runaway bills during unexpected traffic spikes.
* **`--concurrency=80`**: Handles up to 80 simultaneous requests on a single instance before spinning up a new container.
* **`machineType: 'E2_MEDIUM'` in `cloudbuild.yaml`**: Replaced high-cost `E2_HIGHCPU_8` build instance with lightweight build worker.
