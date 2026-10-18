/**
 * Flex Coop Solution - SaaS Operator & Multi-Tenant Control Plane Types
 * Used by Tuntong Tech Solution to monitor, bill, and manage cooperative instances.
 */

import { TenantBillingMode, TenantStatus } from './index';

export interface TenantFleetSummary {
  id: string;
  name: string;
  slug: string;
  subdomain: string; // e.g. "bayani-coop.tuntongtech.com"
  cdaRegistrationNumber: string;
  tin: string;
  contactEmail: string;
  contactPhone?: string;
  adminName: string;
  billingMode: TenantBillingMode;
  status: TenantStatus;
  
  // Member Census
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  freeTierMembers: number; // Sequence 1-15 (₱0.00 onboarding fee)
  billedMembers: number;   // Sequence > 15 (₱50.00 onboarding fee)

  // Financial & Platform Float
  platformCreditBalance: number; // Prepaid credits for paying platform tech fees
  escrowFloatBalance: number;     // QR Ph collections held in platform escrow
  totalLoansDisbursed: number;
  totalLoanVolume: number;
  totalTechFeesGenerated: number; // 1% tech fees accumulated
  lastBillingDate?: string;

  // Resource Usage & Diagnostics
  storageUsedMb: number;         // Submitted KYC docs & selfies (capped at 5MB/upload)
  storageQuotaMb: number;        // Default quota e.g. 10,240 MB (10 GB)
  databaseSchema: string;        // e.g. "tenant_bayani"
  healthScore: number;           // 0 - 100 based on uptime & payment status
  lastActiveAt: string;
  createdAt: string;
}

export interface OperatorOverviewMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalFleetMembers: number;
  totalFleetLoanVolume: number;
  totalEscrowFloat: number;
  totalPlatformCreditPool: number;
  monthlyTechFeeRevenue: number;     // Net tech fee
  monthlyOutputVatPayable: number;    // 12% BIR Output VAT
  totalStorageUsedGb: number;
  lowCreditTenantsCount: number;
}

export type PlatformCreditTransactionType = 'TOP_UP' | 'FEE_DEDUCTION' | 'PROMO_GRANT' | 'ADJUSTMENT' | 'REFUND';

export interface PlatformCreditTransaction {
  id: string;
  tenantId: string;
  tenantName: string;
  type: PlatformCreditTransactionType;
  amount: number;             // Positive for credits, negative for deductions
  balanceBefore: number;
  balanceAfter: number;
  reference: string;          // e.g. "BANK-DEP-2026-091", "INV-ONB-0016"
  notes: string;
  performedBy: string;        // Operator user ID/name
  createdAt: string;
}

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  targetTenantIds?: string[]; // Empty means all tenants
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

export type RegistrationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface RegistrationEmailNotification {
  from: string; // 'support@tuntongtech.com'
  to: string;
  subject: string;
  sentAt: string;
  body: string;
  domain?: string;
  temporaryPassword?: string;
}

export interface CooperativeRegistration {
  id: string; // e.g. "REG-2026-1049"
  name: string;
  coopType: string;
  slug: string;
  subdomain: string;
  cdaRegistrationNumber: string;
  tin: string;
  contactEmail: string;
  contactPhone?: string;
  address: string;
  adminFirstName: string;
  adminMiddleName?: string;
  adminLastName: string;
  adminEmail: string;
  validIdUrl?: string;
  validIdFileName?: string;
  validIdFileSizeMb?: string;
  status: RegistrationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  oneTimePassword?: string;
  emailNotification?: RegistrationEmailNotification;
}

export interface OperatorAccount {
  username: string;
  name: string;
  email: string;
  role: 'PLATFORM_SUPER_OPERATOR' | 'PLATFORM_SUPPORT';
}

export interface OperatorSession {
  token: string;
  username: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
}

export interface OperatorOtpResponse {
  success: boolean;
  message: string;
  email?: string;
  username?: string;
  otp?: string;
  error?: string;
}

