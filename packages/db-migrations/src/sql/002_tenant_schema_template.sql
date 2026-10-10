-- ========================================================
-- 002_tenant_schema_template.sql
-- Template SQL for isolated tenant schemas: {{SCHEMA_NAME}}
-- ========================================================

CREATE SCHEMA IF NOT EXISTS {{SCHEMA_NAME}};

-- 1. CDA Chart of Accounts
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.cda_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('ASSETS', 'LIABILITIES', 'EQUITY', 'REVENUE', 'EXPENSES')),
    normal_balance VARCHAR(16) NOT NULL CHECK (normal_balance IN ('DEBIT', 'CREDIT')),
    parent_code VARCHAR(32),
    is_header BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cooperative Users & Staff Roles
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('ADMIN', 'LOAN_OFFICER', 'CREDIT_COMMITTEE', 'BOD', 'TELLER', 'MEMBER')),
    member_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Members & KYC (NPC Sensitive Personal Data)
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_number VARCHAR(64) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    birthdate DATE NOT NULL,
    gender VARCHAR(16) NOT NULL,
    civil_status VARCHAR(32) NOT NULL,
    address TEXT NOT NULL,
    classification VARCHAR(32) NOT NULL DEFAULT 'REGULAR' CHECK (classification IN ('REGULAR', 'ASSOCIATE')),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED')),
    kyc_status VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED' CHECK (kyc_status IN ('UNVERIFIED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. NPC Consent Audit Logs (Data Privacy Act of 2012)
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.npc_consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.members(id) ON DELETE CASCADE,
    consent_type VARCHAR(64) NOT NULL,
    version VARCHAR(32) NOT NULL,
    agreed BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address VARCHAR(64) NOT NULL,
    user_agent TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. KYC Document Records & Encryption metadata
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.members(id) ON DELETE CASCADE,
    id_type VARCHAR(64) NOT NULL,
    id_number_encrypted TEXT NOT NULL,
    front_document_url TEXT NOT NULL,
    back_document_url TEXT,
    selfie_url TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED')),
    reviewed_by_user_id UUID REFERENCES {{SCHEMA_NAME}}.users(id),
    reviewer_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Share Capital Ledger
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.share_capital_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID UNIQUE NOT NULL REFERENCES {{SCHEMA_NAME}}.members(id) ON DELETE RESTRICT,
    account_number VARCHAR(64) UNIQUE NOT NULL,
    subscribed_shares NUMERIC(12, 2) NOT NULL DEFAULT 0,
    par_value_per_share NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    subscribed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_up_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.share_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.share_capital_accounts(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.members(id) ON DELETE RESTRICT,
    type VARCHAR(32) NOT NULL CHECK (type IN ('SUBSCRIPTION', 'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND_CREDIT')),
    amount NUMERIC(15, 2) NOT NULL,
    reference_no VARCHAR(128) NOT NULL,
    journal_entry_id UUID,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Savings Deposit Accounts
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.savings_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.members(id) ON DELETE RESTRICT,
    account_number VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('COMPULSORY', 'VOLUNTARY', 'TIME_DEPOSIT')),
    interest_rate_annual NUMERIC(5, 2) NOT NULL DEFAULT 0,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DORMANT', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Loan Products (Catalog)
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.loan_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(32) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL,
    min_amount NUMERIC(15, 2) NOT NULL,
    max_amount NUMERIC(15, 2) NOT NULL,
    annual_interest_rate NUMERIC(6, 4) NOT NULL,
    max_term_months INT NOT NULL,
    amortization_method VARCHAR(64) NOT NULL,
    service_fee_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.01,
    fines_rate_monthly NUMERIC(6, 4) NOT NULL DEFAULT 0.03,
    requires_co_maker BOOLEAN DEFAULT FALSE,
    min_co_makers INT DEFAULT 0,
    requires_collateral BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Loans (LOS / LMS Core)
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_number VARCHAR(64) UNIQUE NOT NULL,
    member_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.members(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.loan_products(id) ON DELETE RESTRICT,
    principal_amount NUMERIC(15, 2) NOT NULL,
    interest_rate_annual NUMERIC(6, 4) NOT NULL,
    term_months INT NOT NULL,
    payment_frequency VARCHAR(32) NOT NULL DEFAULT 'MONTHLY',
    amortization_method VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED' CHECK (
        status IN ('DRAFT', 'SUBMITTED', 'UNDER_CREDIT_REVIEW', 'COMMITTEE_APPROVAL', 'BOD_APPROVAL', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED', 'DEFAULTED', 'RESTRUCTURED')
    ),
    disbursement_method VARCHAR(32),
    disbursement_reference VARCHAR(128),
    disbursed_at TIMESTAMP WITH TIME ZONE,
    platform_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    coop_service_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_proceeds_disbursed NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_interest_expected NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_payable NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance_remaining NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Multi-Stage Approval Matrix
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.loan_approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.loans(id) ON DELETE CASCADE,
    stage VARCHAR(32) NOT NULL CHECK (stage IN ('LOAN_OFFICER', 'CREDIT_COMMITTEE', 'BOARD_OF_DIRECTORS')),
    assigned_user_id UUID REFERENCES {{SCHEMA_NAME}}.users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED')),
    remarks TEXT,
    action_taken_at TIMESTAMP WITH TIME ZONE
);

-- 11. Amortization Schedule
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.loan_amortization_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.loans(id) ON DELETE CASCADE,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    beginning_balance NUMERIC(15, 2) NOT NULL,
    principal_amount NUMERIC(15, 2) NOT NULL,
    interest_amount NUMERIC(15, 2) NOT NULL,
    total_installment NUMERIC(15, 2) NOT NULL,
    ending_balance NUMERIC(15, 2) NOT NULL,
    paid_principal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_interest NUMERIC(15, 2) NOT NULL DEFAULT 0,
    paid_penalties NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_{{SCHEMA_NAME}}_loan_installment UNIQUE (loan_id, installment_number)
);

-- 12. Payment Transactions (PayMongo QR Ph / Counter)
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(64) UNIQUE NOT NULL,
    loan_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.loans(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.members(id) ON DELETE RESTRICT,
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('PAYMONGO_QRPH', 'IN_PERSON_CASHIER', 'MANUAL_BANK_TRANSFER')),
    gross_amount_paid NUMERIC(15, 2) NOT NULL,
    pass_on_convenience_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    net_loan_payment NUMERIC(15, 2) NOT NULL,
    principal_portion NUMERIC(15, 2) NOT NULL DEFAULT 0,
    interest_portion NUMERIC(15, 2) NOT NULL DEFAULT 0,
    penalty_portion NUMERIC(15, 2) NOT NULL DEFAULT 0,
    gateway_reference VARCHAR(128),
    cashier_user_id UUID REFERENCES {{SCHEMA_NAME}}.users(id),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. General Ledger (Double-Entry CDA Journal)
CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(64) UNIQUE NOT NULL,
    posting_date DATE NOT NULL,
    reference_type VARCHAR(64) NOT NULL,
    reference_id UUID,
    description TEXT NOT NULL,
    total_debit NUMERIC(15, 2) NOT NULL,
    total_credit NUMERIC(15, 2) NOT NULL,
    is_balanced BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS {{SCHEMA_NAME}}.journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES {{SCHEMA_NAME}}.journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(32) NOT NULL REFERENCES {{SCHEMA_NAME}}.cda_accounts(code),
    account_name VARCHAR(255) NOT NULL,
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_{{SCHEMA_NAME}}_jel_account ON {{SCHEMA_NAME}}.journal_entry_lines(account_code);
CREATE INDEX IF NOT EXISTS idx_{{SCHEMA_NAME}}_loans_member ON {{SCHEMA_NAME}}.loans(member_id);
