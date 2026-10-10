-- ========================================================
-- 001_public_schema.sql
-- Master Public Schema for Flex Coop Solution Multi-Tenancy
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Master Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    cda_registration_number VARCHAR(100) NOT NULL,
    tin VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    billing_mode VARCHAR(32) NOT NULL DEFAULT 'PLATFORM_ESCROW' CHECK (billing_mode IN ('PLATFORM_ESCROW', 'COOP_MERCHANT')),
    merchant_account_id VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PROVISIONING', 'DEACTIVATED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- 2. Platform Invoices & Tax Tracking (12% VAT)
CREATE TABLE IF NOT EXISTS public.platform_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(64) UNIQUE NOT NULL,
    loan_id UUID NOT NULL,
    disbursement_reference VARCHAR(128) NOT NULL,
    billing_mode VARCHAR(32) NOT NULL,
    gross_loan_amount NUMERIC(15, 2) NOT NULL,
    gross_fee_amount NUMERIC(15, 2) NOT NULL,
    vat_amount NUMERIC(15, 2) NOT NULL,
    net_revenue NUMERIC(15, 2) NOT NULL,
    bir_tin VARCHAR(50) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ISSUED' CHECK (status IN ('ISSUED', 'DEDUCTED', 'PAID', 'VOIDED')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_invoices_tenant_id ON public.platform_invoices(tenant_id);

-- 3. Super Admins & Cross-Tenant Authentication
CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'SUPERADMIN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
