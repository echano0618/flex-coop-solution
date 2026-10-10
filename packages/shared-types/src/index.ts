/**
 * Flex Coop Solution - Shared Domain Types & Contracts
 */

// ==========================================
// 1. TENANCY & MONETIZATION
// ==========================================
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'DEACTIVATED';

export type TenantBillingMode = 'PLATFORM_ESCROW' | 'COOP_MERCHANT';

export interface Tenant {
  id: string;
  name: string;
  slug: string; // Used for tenant_<slug> schema and <slug>.flexcoop.ph
  cdaRegistrationNumber: string;
  tin: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  billingMode: TenantBillingMode;
  merchantAccountId?: string; // Connected PayMongo / Gateway ID if COOP_MERCHANT
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformFeeCalculation {
  loanAmount: number;
  billingMode: TenantBillingMode;
  feePercentage: number; // 2.0% for Escrow, 0.5% for Coop Merchant
  minimumFee: number; // 100 for Escrow, 0 for Coop Merchant
  grossFee: number; // The higher of percentage or minFee
  vatAmount: number; // 12% Output VAT on the fee
  netPlatformRevenue: number; // Gross fee less VAT
  calculationFormula: string;
}

export interface PlatformInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  loanId: string;
  disbursementReference: string;
  billingMode: TenantBillingMode;
  grossLoanAmount: number;
  grossFeeAmount: number;
  vatAmount: number;
  netRevenue: number;
  birTin: string;
  status: 'ISSUED' | 'DEDUCTED' | 'PAID' | 'VOIDED';
  issuedAt: string;
}

// ==========================================
// 2. MEMBERSHIP, eKYC & NPC COMPLIANCE
// ==========================================
export type MemberClassification = 'REGULAR' | 'ASSOCIATE';
export type MemberStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TERMINATED';
export type KYCStatus = 'UNVERIFIED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export type GovernmentIDType =
  | 'PHILSYS_NATIONAL_ID'
  | 'PASSPORT'
  | 'DRIVERS_LICENSE'
  | 'UMID'
  | 'SSS'
  | 'GSIS'
  | 'POSTAL_ID'
  | 'VOTERS_ID'
  | 'PRC_ID'
  | 'BIR_TIN_ID';

export interface NPCConsentRecord {
  id: string;
  memberId: string;
  consentType: 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'CREDIT_INVESTIGATION' | 'DATA_SHARING';
  version: string;
  agreed: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface KYCDocument {
  id: string;
  memberId: string;
  idType: GovernmentIDType;
  idNumberEncrypted: string;
  frontDocumentUrl: string;
  backDocumentUrl?: string;
  selfieUrl: string;
  status: KYCStatus;
  reviewedByUserId?: string;
  reviewerNotes?: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email: string;
  phone: string;
  birthdate: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  civilStatus: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED';
  address: string;
  classification: MemberClassification;
  status: MemberStatus;
  kycStatus: KYCStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. SHARE CAPITAL & SAVINGS
// ==========================================
export type ShareTransactionType = 'SUBSCRIPTION' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND_CREDIT';
export type SavingsType = 'COMPULSORY' | 'VOLUNTARY' | 'TIME_DEPOSIT';

export interface ShareCapitalAccount {
  id: string;
  memberId: string;
  accountNumber: string;
  subscribedShares: number;
  parValuePerShare: number; // Typically ₱100.00
  subscribedAmount: number;
  paidUpAmount: number;
  balance: number;
  updatedAt: string;
}

export interface SavingsAccount {
  id: string;
  memberId: string;
  accountNumber: string;
  type: SavingsType;
  interestRateAnnual: number;
  balance: number;
  status: 'ACTIVE' | 'DORMANT' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. LOAN ORIGINATION (LOS) & LMS
// ==========================================
export type LoanType = 'REGULAR' | 'EMERGENCY' | 'EDUCATIONAL' | 'LIVELIHOOD' | 'MICROFINANCE' | 'APPLIANCE';
export type AmortizationMethod = 'STRAIGHT_LINE' | 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT' | 'DIMINISHING_BALANCE_EQUAL_PRINCIPAL';
export type PaymentFrequency = 'WEEKLY' | 'BI_WEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY';
export type LoanStatus =
  | 'DRAFT'
  | 'PENDING_CO_MAKER_ACCEPTANCE'
  | 'CO_MAKER_DECLINED'
  | 'SUBMITTED'
  | 'UNDER_CREDIT_REVIEW'
  | 'COMMITTEE_APPROVAL'
  | 'BOD_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'COMPLETED'
  | 'DEFAULTED'
  | 'RESTRUCTURED';

export type DisbursementMethod = 'IN_PERSON_CASH' | 'EXTERNAL_BANK_TRANSFER' | 'PLATFORM_ESCROW';

export interface CoMakerEndorsement {
  coMakerMemberId: string;
  coMakerMemberNumber?: string;
  coMakerName?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  requestedAt?: string;
  decisionNotes?: string;
  acceptedAt?: string;
  ipAddress?: string;
  jointSolidaryAgreementAccepted: boolean;
}

export interface LoanProduct {
  id: string;
  tenantId?: string;
  name: string;
  code: string;
  type: LoanType;
  minAmount: number;
  maxAmount: number;
  annualInterestRate: number;
  minTermMonths?: number;
  maxTermMonths: number;
  amortizationMethod: AmortizationMethod;
  serviceFeeRate: number; // Coop's own filing/service fee
  finesRateMonthly: number; // Penalty for overdue
  requiresCoMaker: boolean;
  minCoMakers: number;
  coMakerRuleDescription?: string;
  requiresCollateral: boolean;
  isActive: boolean;
}

export interface LoanApprovalStep {
  id: string;
  loanId: string;
  stage: 'LOAN_OFFICER' | 'CREDIT_COMMITTEE' | 'BOARD_OF_DIRECTORS';
  assignedUserId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';
  remarks?: string;
  actionTakenAt?: string;
}

export interface AmortizationScheduleItem {
  installmentNumber: number;
  dueDate: string;
  beginningBalance: number;
  principalAmount: number;
  interestAmount: number;
  totalInstallment: number;
  endingBalance: number;
  paidPrincipal: number;
  paidInterest: number;
  paidPenalties: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface Loan {
  id: string;
  tenantId?: string;
  loanNumber: string;
  memberId: string;
  productId: string;
  productName?: string;
  principalAmount: number;
  interestRateAnnual: number;
  termMonths: number;
  paymentFrequency: PaymentFrequency;
  amortizationMethod: AmortizationMethod;
  status: LoanStatus;
  disbursementMethod?: DisbursementMethod;
  disbursementReference?: string;
  disbursedAt?: string;
  // Deductions:
  platformFee: number;
  coopServiceFee: number;
  netProceedsDisbursed: number;
  totalInterestExpected: number;
  totalPayable: number;
  balanceRemaining: number;
  schedule: AmortizationScheduleItem[];
  coMaker?: CoMakerEndorsement;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. PAYMENTS & PAYMONGO QR PH
// ==========================================
export type PaymentChannel = 'PAYMONGO_QRPH' | 'IN_PERSON_CASHIER' | 'MANUAL_BANK_TRANSFER';
export type PaymentAllocationType = 'PENALTY' | 'INTEREST' | 'PRINCIPAL' | 'EXCESS_SAVINGS';

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  loanId: string;
  memberId: string;
  channel: PaymentChannel;
  grossAmountPaid: number;
  passOnConvenienceFee: number; // Extra fee for PayMongo QR Ph
  netLoanPayment: number; // Allocated to Loan
  principalPortion: number;
  interestPortion: number;
  penaltyPortion: number;
  gatewayReference?: string;
  cashierUserId?: string;
  paidAt: string;
  createdAt: string;
}

// ==========================================
// 6. CDA DOUBLE-ENTRY GENERAL LEDGER
// ==========================================
export type CDAAccountCategory = 'ASSETS' | 'LIABILITIES' | 'EQUITY' | 'REVENUE' | 'EXPENSES';
export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface CDAAccount {
  id: string;
  code: string; // e.g., '1-01-01'
  name: string;
  category: CDAAccountCategory;
  normalBalance: NormalBalance;
  parentCode?: string;
  isHeader: boolean;
  isActive: boolean;
}

export interface JournalEntryLine {
  id?: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  postingDate: string;
  referenceType: 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'SHARE_CAPITAL_DEPOSIT' | 'SAVINGS_DEPOSIT' | 'MANUAL_JOURNAL';
  referenceId?: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdByUserId: string;
  postedAt: string;
}

// ==========================================
// 7. REGULATORY & AUDIT REPORTS
// ==========================================
export interface DelinquencyAgingItem {
  loanId: string;
  loanNumber: string;
  memberNumber: string;
  memberName: string;
  principalOverdue: number;
  interestOverdue: number;
  penalties: number;
  totalOverdue: number;
  daysPastDue: number;
  bucket: 'CURRENT' | 'PAR_1_30' | 'PAR_31_60' | 'PAR_61_90' | 'PAR_OVER_90';
}

export interface DelinquencyAgingReport {
  asOfDate: string;
  totalOutstandingPortfolio: number;
  totalPastDuePortfolio: number;
  portfolioAtRiskRatio: number; // PAR > 30 / Total
  buckets: {
    current: number;
    par1_30: number;
    par31_60: number;
    par61_90: number;
    parOver90: number;
  };
  details: DelinquencyAgingItem[];
}

export interface AMLCCoveredTransactionAlert {
  id: string;
  transactionId: string;
  memberId: string;
  amount: number; // >= ₱500,000
  transactionType: string;
  flaggedAt: string;
  status: 'PENDING_REVIEW' | 'FILED_WITH_AMLC' | 'DISMISSED';
}
