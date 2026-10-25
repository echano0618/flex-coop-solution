/**
 * Flex Coop Solution - Shared Domain Types & Contracts
 */

// ==========================================
// 1. TENANCY & MONETIZATION
// ==========================================
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PROVISIONING' | 'DEACTIVATED';

export type TenantBillingMode = 'STANDARD_UNIFIED' | 'PLATFORM_ESCROW' | 'COOP_MERCHANT';

export interface Tenant {
  id: string;
  name: string;
  slug: string; // Used for tenant_<slug> schema and <slug>-coop.tuntongtech.com
  cdaRegistrationNumber: string;
  tin: string;
  contactEmail: string;
  contactPhone?: string;
  adminFirstName?: string;
  adminMiddleName?: string;
  adminLastName?: string;
  validIdUrl?: string;
  address: string;
  coopType?: string;
  billingMode: TenantBillingMode;
  merchantAccountId?: string; // Connected PayMongo / Gateway ID if COOP_MERCHANT
  platformCreditBalance?: number;
  escrowFloatBalance?: number;
  status: TenantStatus;
  environment?: 'production' | 'testing';
  tag?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformFeeCalculation {
  loanAmount: number;
  billingMode?: TenantBillingMode;
  feePercentage: number; // Single model: 1.0% technology fee for approved loans
  minimumFee?: number; // Optional floor
  grossFee: number; // 1.0% of loan amount
  vatAmount: number; // 12% Output VAT on the fee
  netPlatformRevenue: number; // Gross fee less VAT
  calculationFormula: string;
}

export interface MemberOnboardingFeeCalculation {
  memberSequenceIndex: number;
  isFreeTier: boolean;
  grossFee: number; // ₱0.00 if sequence <= 15, else ₱50.00
  vatAmount: number; // 12% Output VAT: ₱5.36 if > 15, else ₱0.00
  netPlatformRevenue: number; // ₱44.64 if > 15, else ₱0.00
  formula: string;
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

export interface MemberRegistrationFieldConfig {
  id: string;
  fieldKey: string;
  label: string;
  category: 'PERSONAL' | 'EMPLOYMENT' | 'CONTACT' | 'GOVERNMENT' | 'ADDRESS';
  type: 'TEXT' | 'DATE' | 'SELECT' | 'NUMBER';
  enabled: boolean;
  required: boolean;
  description?: string;
  placeholder?: string;
  options?: string[]; // If type is SELECT
  isSystemCore?: boolean; // Core fields like firstName, lastName, etc. cannot be disabled
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
  landline?: string;
  birthdate: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  civilStatus: 'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED';
  address: string;
  country?: string;
  region?: string;
  city?: string;
  municipality?: string;
  barangay?: string;
  street?: string;
  houseNumber?: string;
  buildingNumber?: string;
  zipCode?: string;
  zipcode?: string;
  psgcAddress?: import('./psgc').PSGCAddress;
  // Institutional / Workplace & Employment Details
  employeeIdNumber?: string;
  position?: string;
  officeUnitSection?: string;
  dateOfAppointment?: string;
  tin?: string;
  occupation?: string;
  monthlyIncome?: number;
  classification: MemberClassification;
  isDividendEligible?: boolean;
  status: MemberStatus;
  kycStatus: KYCStatus;
  paidUpShares?: number;
  paidUpCapital?: number;
  sharesCount?: number;
  subscribedShares?: number;
  subscribedCapital?: number;
  totalShareCapitalBalance?: number;
  savingsBalance?: number;
  loanBalance?: number;
  sharePaymentStatus?: string;
  memberNo?: string;
  selfieUrl?: string;
  selfiePreview?: string | null;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

// Default Membership Registration Configurable Fields
export const DEFAULT_MEMBER_REGISTRATION_FIELDS: MemberRegistrationFieldConfig[] = [
  {
    id: 'field_first_name',
    fieldKey: 'firstName',
    label: 'First Name',
    category: 'PERSONAL',
    type: 'TEXT',
    enabled: true,
    required: true,
    placeholder: 'e.g. Clara',
    isSystemCore: true,
    description: 'Statutory given name of the applicant member.',
  },
  {
    id: 'field_middle_name',
    fieldKey: 'middleName',
    label: 'Middle Name',
    category: 'PERSONAL',
    type: 'TEXT',
    enabled: true,
    required: false,
    placeholder: 'e.g. Bautista',
    isSystemCore: false,
    description: 'Applicant middle name / maternal surname.',
  },
  {
    id: 'field_last_name',
    fieldKey: 'lastName',
    label: 'Last Name',
    category: 'PERSONAL',
    type: 'TEXT',
    enabled: true,
    required: true,
    placeholder: 'e.g. Magdalo',
    isSystemCore: true,
    description: 'Family or surname of the member.',
  },
  {
    id: 'field_employee_id',
    fieldKey: 'employeeIdNumber',
    label: 'Employee ID No',
    category: 'EMPLOYMENT',
    type: 'TEXT',
    enabled: true,
    required: true,
    placeholder: 'e.g. EMP-2026-0814',
    isSystemCore: false,
    description: 'Institutional or agency employee identification number.',
  },
  {
    id: 'field_position',
    fieldKey: 'position',
    label: 'Position',
    category: 'EMPLOYMENT',
    type: 'TEXT',
    enabled: true,
    required: true,
    placeholder: 'e.g. Senior Administrative Officer',
    isSystemCore: false,
    description: 'Current job position or rank in the institution.',
  },
  {
    id: 'field_office_unit',
    fieldKey: 'officeUnitSection',
    label: 'Office/Unit/Section',
    category: 'EMPLOYMENT',
    type: 'TEXT',
    enabled: true,
    required: true,
    placeholder: 'e.g. Finance & Accounting Division - Treasury Unit',
    isSystemCore: false,
    description: 'Assigned division, bureau, department, or operating section.',
  },
  {
    id: 'field_date_appointment',
    fieldKey: 'dateOfAppointment',
    label: 'Date of Appointment',
    category: 'EMPLOYMENT',
    type: 'DATE',
    enabled: true,
    required: true,
    placeholder: 'YYYY-MM-DD',
    isSystemCore: false,
    description: 'Official date of tenure or appointment to current position.',
  },
  {
    id: 'field_landline',
    fieldKey: 'landline',
    label: 'Landline',
    category: 'CONTACT',
    type: 'TEXT',
    enabled: true,
    required: false,
    placeholder: 'e.g. (02) 8812-4500 or (044) 940-1234',
    isSystemCore: false,
    description: 'Office or residence telephone / landline contact number.',
  },
  {
    id: 'field_mobile_phone',
    fieldKey: 'phone',
    label: 'Mobile Number (+63)',
    category: 'CONTACT',
    type: 'TEXT',
    enabled: true,
    required: true,
    placeholder: '09191234567',
    isSystemCore: true,
    description: 'Mobile phone number for OTP and loan transaction alerts.',
  },
  {
    id: 'field_email',
    fieldKey: 'email',
    label: 'Email Address',
    category: 'CONTACT',
    type: 'TEXT',
    enabled: true,
    required: true,
    placeholder: 'name@organization.gov.ph',
    isSystemCore: true,
    description: 'Official or personal email address for e-statements.',
  },
  {
    id: 'field_birthdate',
    fieldKey: 'birthdate',
    label: 'Date of Birth',
    category: 'PERSONAL',
    type: 'DATE',
    enabled: true,
    required: true,
    placeholder: 'YYYY-MM-DD',
    isSystemCore: true,
    description: 'Member birth date for legal age and insurance verification.',
  },
  {
    id: 'field_gender',
    fieldKey: 'gender',
    label: 'Gender',
    category: 'PERSONAL',
    type: 'SELECT',
    enabled: true,
    required: true,
    options: ['FEMALE', 'MALE'],
    isSystemCore: true,
    description: 'Legal gender for CDA statistical reporting.',
  },
  {
    id: 'field_civil_status',
    fieldKey: 'civilStatus',
    label: 'Civil Status',
    category: 'PERSONAL',
    type: 'SELECT',
    enabled: true,
    required: true,
    options: ['SINGLE', 'MARRIED', 'WIDOWED', 'SEPARATED'],
    isSystemCore: true,
    description: 'Marital status for beneficiary and estate management.',
  },
  {
    id: 'field_tin',
    fieldKey: 'tin',
    label: 'Tax Identification Number (TIN)',
    category: 'GOVERNMENT',
    type: 'TEXT',
    enabled: true,
    required: false,
    placeholder: '000-000-000-000',
    isSystemCore: false,
    description: 'BIR TIN for dividend and withholding tax reporting.',
  },
  {
    id: 'field_monthly_income',
    fieldKey: 'monthlyIncome',
    label: 'Est. Monthly Income (₱)',
    category: 'EMPLOYMENT',
    type: 'NUMBER',
    enabled: true,
    required: false,
    placeholder: '35000',
    isSystemCore: false,
    description: 'Gross monthly compensation or business income.',
  },
];

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
  | 'CANCELLED'
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

export interface CoMakerCapacityEvaluation {
  coMakerMemberId: string;
  coMakerMemberNumber: string;
  coMakerName: string;
  activeCoMakerCount: number;
  maxAllowedCoMakerCount: number;
  ownOutstandingLoans: number;
  guaranteedLoansBalance: number;
  totalDirectAndContingentExposure: number;
  paidUpShareCapital: number;
  savingsBalance: number;
  totalUnencumberedEquity: number;
  maxAllowableExposure: number; // 3x totalUnencumberedEquity
  proposedLoanAmount: number;
  projectedExposure: number;
  isCountEligible: boolean;
  isFinancialCapacityEligible: boolean;
  isEligible: boolean;
  rejectionReasons: string[];
}

export interface EarlyLoanSettlementQuote {
  loanId: string;
  loanNumber: string;
  memberId: string;
  settlementDate: string;
  currentPrincipalBalance: number;
  accruedInterestToDate: number;
  unearnedInterestRebate: number;
  penaltiesDue: number;
  totalPayoffAmount: number;
  originalTotalInterest: number;
  interestSavedByBorrower: number;
}

export type LoanTermUnit = 'MONTHS' | 'WEEKS';
export type WeeklyPaymentFrequency = 'EVERY_WEEK' | 'EVERY_OTHER_WEEK';
export type MandatorySharePaymentTreatment = 'UPFRONT_DEDUCTION' | 'INCLUDED_IN_LOAN_PAYMENT';

export interface LoanProduct {
  id: string;
  tenantId?: string;
  name: string;
  code: string;
  type: LoanType;
  minAmount: number;
  maxAmount: number;
  annualInterestRate: number;
  // Term Configuration: Weeks or Months
  termUnit?: LoanTermUnit;
  weeklyPaymentFrequency?: WeeklyPaymentFrequency;
  minTermMonths?: number;
  maxTermMonths: number;
  minTermWeeks?: number;
  maxTermWeeks?: number;
  // Mandatory Share Purchase Option
  mandatorySharePurchaseEnabled?: boolean;
  mandatoryShareQuantity?: number;
  mandatorySharePaymentTreatment?: MandatorySharePaymentTreatment;
  amortizationMethod: AmortizationMethod;
  serviceFeeRate: number; // Coop's own filing/service fee
  finesRateMonthly: number; // Penalty for overdue
  requiresCoMaker: boolean;
  minCoMakers: number;
  coMakerRuleDescription?: string;
  requiresCollateral: boolean;
  isActive: boolean;
  status?: string;
  optionalFees?: any[];
  advanceInterestOption?: string;
  succeedingMethod?: string;
  fixedMonthlyInstallment?: boolean;
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
  mandatoryShareAmount?: number;
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
  termWeeks?: number;
  termUnit?: LoanTermUnit;
  weeklyPaymentFrequency?: WeeklyPaymentFrequency;
  firstDueDate?: string;
  mandatorySharePurchaseEnabled?: boolean;
  mandatoryShareQuantity?: number;
  mandatoryShareAmount?: number;
  mandatorySharePaymentTreatment?: MandatorySharePaymentTreatment;
  mandatoryShareAmortizedPerInstallment?: number;
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
  memberName?: string;
  memberNo?: string;
  repayments?: any[];
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
  memberId?: string;
  memberNumber?: string;
  memberName?: string;
  subledgerType?: 'SHARE_CAPITAL' | 'SAVINGS' | 'LOAN' | 'ACCOUNTS_RECEIVABLE' | 'ACCOUNTS_PAYABLE' | 'OTHER';
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  postingDate: string;
  referenceType: 'LOAN_DISBURSEMENT' | 'LOAN_APPROVAL' | 'LOAN_REPAYMENT' | 'SHARE_CAPITAL_DEPOSIT' | 'SAVINGS_DEPOSIT' | 'MANUAL_JOURNAL';
  referenceId?: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  channel?: string;
  createdByUserId: string;
  postedAt: string;
}

// ==========================================
// 6.1 MEMBER SUBSIDIARY LEDGER (SL) & GENERAL LEDGER (GL) CONTROL
// ==========================================
export type SubsidiaryLedgerType = 'SHARE_CAPITAL' | 'SAVINGS' | 'LOAN' | 'OTHER';

export interface SubsidiaryLedgerTransaction {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  postingDate: string;
  referenceType: string;
  referenceId?: string;
  accountCode: string;
  accountName: string;
  subledgerType: SubsidiaryLedgerType;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  postedAt: string;
}

export interface MemberAccountLedgerSummary {
  accountCode: string;
  accountName: string;
  subledgerType: SubsidiaryLedgerType;
  accountReferenceNumber?: string;
  totalDebit: number;
  totalCredit: number;
  currentBalance: number;
  transactions: SubsidiaryLedgerTransaction[];
}

export interface MemberSubsidiaryLedger {
  memberId: string;
  memberNumber: string;
  memberName: string;
  classification: MemberClassification;
  status: MemberStatus;
  accounts: MemberAccountLedgerSummary[];
  totalShareCapitalBalance: number;
  totalSavingsBalance: number;
  totalLoanOutstandingBalance: number;
  lastActivityDate?: string;
}

export interface GeneralLedgerAccountStatement {
  accountCode: string;
  accountName: string;
  category: CDAAccountCategory;
  normalBalance: NormalBalance;
  beginningBalance: number;
  totalDebit: number;
  totalCredit: number;
  endingBalance: number;
  entries: {
    journalEntryId: string;
    entryNumber: string;
    postingDate: string;
    referenceType: string;
    referenceId?: string;
    description: string;
    debit: number;
    credit: number;
    runningBalance: number;
    memo?: string;
    memberId?: string;
    memberNumber?: string;
    memberName?: string;
  }[];
}

export interface GLSLReconciliationItem {
  accountCode: string;
  accountName: string;
  category: CDAAccountCategory;
  glBalance: number;
  slTotalBalance: number;
  variance: number;
  isReconciled: boolean;
  memberCount: number;
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

// ==========================================
// 8. ANNUAL NET SURPLUS & PATRONAGE REFUND (ART. 86 RA 9520)
// ==========================================
export interface MemberSurplusVoucher {
  memberId: string;
  memberNumber: string;
  memberName: string;
  paidUpShareCapital: number;
  interestPaidOnLoans: number;
  interestOnShareCapital: number; // Dividend
  patronageRefund: number;
  totalSurplusPayable: number;
}

export interface SurplusDistributionResult {
  id: string;
  fiscalYear: number;
  netSurplus: number;
  // Statutory Reserve Allocations (Art. 86 RA 9520)
  generalReserveFund: number; // Min 10%
  cetfLocalFund: number; // 5%
  cetfApexFund: number; // 5%
  communityDevelopmentFund: number; // Min 3%
  optionalFund: number; // Max 7%
  totalStatutoryReserves: number;
  // Distributable Portion (typically 70%)
  distributableSurplus: number;
  totalInterestOnShareCapital: number;
  totalPatronageRefund: number;
  memberAllocations: MemberSurplusVoucher[];
  journalEntryId?: string;
  status: 'PROPOSED' | 'POSTED_TO_GL';
  approvedAt?: string;
}

// ==========================================
// 9. COLLATERAL & CHATTEL MORTGAGE REGISTRY
// ==========================================
export type CollateralType = 'REAL_ESTATE_MORTGAGE' | 'CHATTEL_MORTGAGE' | 'DEPOSIT_HOLD';

export interface CollateralItem {
  id: string;
  tenantId?: string;
  memberId: string;
  memberNumber: string;
  memberName?: string;
  type: CollateralType;
  description: string;
  appraisedValue: number;
  assessedValue: number;
  maxLoanToValueRatio: number; // 0.70 for REM, 0.60 for Chattel
  maxAllowableLoanAmount: number;
  linkedLoanId?: string;
  linkedLoanNumber?: string;
  encumbranceStatus: 'UNENCUMBERED' | 'REGISTERED_MORTGAGE' | 'DISCHARGED';
  // Real Estate Mortgage details:
  tctNumber?: string;
  registryOfDeedsLocation?: string;
  lotAreaSqm?: number;
  // Chattel Mortgage details:
  vehicleMakeModel?: string;
  plateNumber?: string;
  engineNumber?: string;
  chassisNumber?: string;
  ltoOrCrNumber?: string;
  // Notary & Registration details:
  notaryPublic?: string;
  registrationDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 10. PHILIPPINE STANDARD GEOGRAPHIC CODE (PSGC)
// ==========================================
export * from './psgc';

// ==========================================
// 11. SAAS OPERATOR & CONTROL PLANE
// ==========================================
export * from './operator';

// ==========================================
// 12. MEMBER BANK TRANSFER VERIFICATION REQUESTS
// ==========================================
export type BankTransferPaymentType = 'SHARE_PURCHASE' | 'LOAN_PAYMENT' | 'SAVINGS_DEPOSIT';
export type BankTransferPaymentStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED';

export interface BankTransferPaymentRequest {
  id: string;
  tenantId: string;
  type: BankTransferPaymentType;
  memberId: string;
  memberNumber: string;
  memberName: string;
  amount: number;
  sharesCount?: number;
  loanId?: string;
  loanNumber?: string;
  bankName: string;
  referenceNumber: string;
  notes?: string;
  status: BankTransferPaymentStatus;
  createdAt: string;
  confirmedAt?: string;
  confirmedByUserId?: string;
  confirmedByUserName?: string;
  rejectionReason?: string;
  journalEntryId?: string;
  receiptNumber?: string;
}

