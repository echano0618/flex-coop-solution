# Flex Coop Solution 🇵🇭

**Flex Coop Solution** is an enterprise-grade Software-as-a-Service (SaaS) banking, lending, and accounting platform built specifically for Philippine Cooperatives. It is engineered from the ground up for strict compliance with the **Cooperative Development Authority (CDA)**, the **National Privacy Commission (NPC / Data Privacy Act of 2012)**, and the **Anti-Money Laundering Council (AMLC)**.

---

## 🏛️ System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               CLIENT CHANNELS                │
                    ├──────────────────────┬───────────────────────┤
                    │  Customer Mobile App │   Admin Web Portal    │
                    │      (Flutter)       │   (Next.js + Tailwind)│
                    └──────────┬───────────┴───────────┬───────────┘
                               │                       │
                               ▼                       ▼
                    ┌──────────────────────────────────────────────┐
                    │       EDGE & REVERSE PROXY / GATEWAY         │
                    │   - Dynamic Tenant Routing (`tenant_id`)     │
                    │   - Subdomain mapping: `<slug>.flexcoop.ph`  │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │          MODULAR MONOLITH BACKEND            │
                    │        (Node.js / Express + TypeScript)      │
                    ├──────────────────────────────────────────────┤
                    │ ├── Multi-Tenant Provisioner & Resolver      │
                    │ ├── Membership & eKYC (NPC Encrypted SPI)    │
                    │ ├── Share Capital & Savings Ledger           │
                    │ ├── Loan Origination & Approval Matrix (LOS) │
                    │ ├── Amortization Calculation Engine (LMS)    │
                    │ ├── Pass-Through Monetization & 12% VAT      │
                    │ ├── PayMongo QR Ph & Cashier Payments        │
                    │ ├── CDA Double-Entry General Ledger (GL)     │
                    │ └── Regulatory Reports (PAR / CDA / AMLC)    │
                    └──────────────────────┬───────────────────────┘
                                           │
                 ┌─────────────────────────┴─────────────────────────┐
                 ▼                                                   ▼
    ┌─────────────────────────┐                         ┌─────────────────────────┐
    │  MULTI-TENANT DATABASE  │                         │     OBJECT STORAGE      │
    │ PostgreSQL 16 (Schema-  │                         │       (Encrypted)       │
    │ per-Tenant Isolation)   │                         │  - KYC ID Images        │
    │  - `public`: Tenants,   │                         │  - Promissory Notes     │
    │    Invoices, Billing    │                         │  - Official Receipts    │
    │  - `tenant_<slug>`:     │                         └─────────────────────────┘
    │    Ledgers, Loans, GL   │
    └─────────────────────────┘
```

---

## 💰 Monetization Engine (Pass-Through Loan Processing Fee)

Every loan disbursement calculates and deducts the platform processing fee upfront from gross loan proceeds:

$$\text{Processing Fee} = \begin{cases} 
\max(0.02 \times \text{Loan Amount}, ₱100.00) & \text{if Tenant Uses Platform Escrow} \\
0.005 \times \text{Loan Amount} & \text{if Tenant Uses Own Merchant Account}
\end{cases}$$

### Net Member Proceeds:
$$\text{Net Disbursed} = \text{Gross Loan Principal} - \text{Platform Fee} - \text{Coop Service Fee}$$

### 12% Output VAT Breakdown (BIR Electronic Sales Invoice):
* **Net Base Revenue:** $\text{Gross Fee} / 1.12$
* **12% Output VAT:** $\text{Gross Fee} - \text{Net Base Revenue}$
* Every deduction automatically generates an official electronic invoice (`INV-xxxx`) with BIR TIN tracking.

---

## 💳 Payment & Repayment Rails

1. **PayMongo Dynamic QR Ph Code**:
   * Scannable by **GCash**, **Maya**, **BDO**, **BPI**, **UnionBank**, or any InstaPay/PESONet mobile banking app.
   * **Pass-On Convenience Fee**: Calculated dynamically (₱15.00 floor or 1.5%) and appended to the QR Ph payload so the member absorbs gateway convenience charges.
2. **In-Person Branch Cashier (Over-the-Counter)**:
   * **₱0.00 Convenience Fee**: Member pays at coop teller. Full payment is credited directly to loan amortization with immediate official receipt (`OR-xxxx`).
3. **Repayment Allocation Priority**:
   1. Past-due Penalties and Fines
   2. Accrued and current Interest
   3. Principal reduction
   4. Excess funds automatically credited to the member's **Voluntary Savings Account**

---

## 📊 CDA Double-Entry Accounting Standard

Pre-seeded with the **Cooperative Development Authority (CDA)** standard Chart of Accounts:
* **Assets (`1-xx`)**: Cash on Hand (`1-01-01`), Loans Receivable (`1-02-01`), Escrow Settlement (`1-01-04`)
* **Liabilities (`2-xx`)**: Savings Deposits (`2-01-01`), Platform Processing Fee Payable (`2-02-02`)
* **Equity (`3-xx`)**: Paid-Up Share Capital (`3-01-03`), General Reserve Fund (`3-02-01`)
* **Revenue (`4-xx`)**: Interest Income on Loans (`4-01-01`), Service and Filing Fees (`4-01-02`)
* **Expenses (`5-xx`)**: Administrative Expenses (`5-01-01`), Technology Expenses (`5-01-04`)

Strict double-entry validation enforces $\sum \text{Debit} == \sum \text{Credit}$ on every transaction.

---

## 🔒 Philippine Regulatory Compliance

* **NPC (Data Privacy Act of 2012)**: Explicit consent tracking with IP address and UserAgent logging. AES-256-GCM encryption on all Sensitive Personal Information (SPI: PhilSys National ID, TIN, SSS, birthdate).
* **AMLC (Anti-Money Laundering Council)**: Automated trigger alerts for single cash or equivalent transactions $\ge ₱500,000.00$.
* **Portfolio At Risk (PAR) Aging Analysis**: Automatic bucket calculation for PAR 1–30, PAR 31–60, PAR 61–90, and PAR > 90 days past due.

---

## 🚀 Quickstart & Verification

### 1. Run the Automated Verification Suite
To verify all 18 test cases across monetization math, VAT decomposition, amortization schedules, CDA double-entry balance, and PayMongo QR Ph fees:
```bash
npm run --workspace=apps/api test
```

### 2. Start the Backend API
```bash
npm run --workspace=apps/api start
# API starts on http://localhost:4000
```

### 3. Start the Next.js Admin Portal
```bash
npm run --workspace=apps/admin-portal dev
# Open http://localhost:3000 in your browser
```

### 4. Run with Docker (PostgreSQL & Redis)
```bash
docker-compose up -d
```

---

## 📁 Repository Structure

```
flex-coop-solution/
├── apps/
│   ├── api/                      # Modular Monolith Backend (Node.js/Express + TS)
│   ├── admin-portal/             # Admin Web Portal (Next.js 14 + Tailwind CSS)
│   └── mobile-app/               # Customer Mobile App (Flutter Material 3)
├── packages/
│   ├── shared-types/             # Core TypeScript DTOs, Enums, and Interfaces
│   ├── cda-coa/                  # CDA Standard Chart of Accounts seed & validators
│   └── db-migrations/            # PostgreSQL Schema-per-Tenant provisioning engine
├── docker-compose.yml            # PostgreSQL 16 & Redis
└── README.md
```
