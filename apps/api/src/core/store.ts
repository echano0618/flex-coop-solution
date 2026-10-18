import {
  AMLCCoveredTransactionAlert,
  JournalEntry,
  KYCDocument,
  Loan,
  LoanProduct,
  Member,
  NPCConsentRecord,
  PlatformInvoice,
  SavingsAccount,
  ShareCapitalAccount,
  Tenant,
  CollateralItem,
  SurplusDistributionResult,
  PlatformCreditTransaction,
  SystemBroadcast,
  CooperativeRegistration,
} from '@flexcoop/shared-types';
import { AmortizationService } from '../modules/lending/amortization.service';
import { MonetizationService } from '../modules/monetization/monetization.service';
import { GeneralLedgerService } from '../modules/accounting/ledger.service';
import { NPCEncryptionService } from './npc-encryption';

export interface PlatformPaymentMethod {
  id: string;
  type: 'BANK_TRANSFER' | 'QRPH';
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrCodeUrl?: string;
  instructions?: string;
  status: 'ACTIVE' | 'INACTIVE';
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface PlatformCreditTopupRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  sourceBank: string;
  referenceNumber: string;
  notes?: string;
  proofUrl?: string;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  requestedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export class AppDataStore {
  public tenants: Map<string, Tenant> = new Map();
  public members: Map<string, Member[]> = new Map(); // tenantId -> members
  public kycDocs: Map<string, KYCDocument[]> = new Map();
  public npcConsents: Map<string, NPCConsentRecord[]> = new Map();
  public shareAccounts: Map<string, ShareCapitalAccount[]> = new Map();
  public savingsAccounts: Map<string, SavingsAccount[]> = new Map();
  public loanProducts: Map<string, LoanProduct[]> = new Map();
  public loans: Map<string, Loan[]> = new Map();
  public journalEntries: Map<string, JournalEntry[]> = new Map();
  public platformInvoices: PlatformInvoice[] = [];
  public amlcAlerts: AMLCCoveredTransactionAlert[] = [];
  public collaterals: Map<string, CollateralItem[]> = new Map();
  public surplusDistributions: Map<string, SurplusDistributionResult[]> = new Map();
  public platformCredits: Map<string, number> = new Map(); // tenantId -> available credit
  public escrowFloats: Map<string, number> = new Map(); // tenantId -> escrow float balance
  public creditTransactions: PlatformCreditTransaction[] = [];
  public systemBroadcasts: SystemBroadcast[] = [];
  public coopRegistrations: CooperativeRegistration[] = [];
  public systemConfigs: Map<string, any> = new Map(); // tenantId -> SystemConfig
  public platformPaymentMethods: PlatformPaymentMethod[] = [];
  public creditTopupRequests: PlatformCreditTopupRequest[] = [];

  constructor() {
    this.seedDefaultPaymentMethods();
    this.seedInitialTenantData();
  }

  private seedDefaultPaymentMethods() {
    if (this.platformPaymentMethods.length === 0) {
      this.platformPaymentMethods.push({
        id: 'pm_landbank_01',
        type: 'BANK_TRANSFER',
        bankName: 'Land Bank of the Philippines',
        accountName: 'Tuntong Technology Solutions Inc.',
        accountNumber: '0012-9981-22',
        instructions: 'Transfer via InstaPay or PESONet. Key-in your cooperative name or reference number in remarks.',
        status: 'ACTIVE',
        isDefault: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        updatedBy: 'System Admin',
      });
    }
  }

  private seedInitialTenantData() {
    // Only seed mock demonstration tenant records in test environment
    if (process.env.NODE_ENV !== 'test') {
      return;
    }

    // 1. Seed Tenant: Bayani Multi-Purpose Cooperative
    const tenantId = 'tenant_bayani_001';
    const tenant: Tenant = {
      id: tenantId,
      name: 'Bayani Multi-Purpose Cooperative',
      slug: 'bayani',
      cdaRegistrationNumber: 'CDA-NCR-2024-00921',
      tin: '009-887-123-000',
      contactEmail: 'admin@bayanicoop.ph',
      contactPhone: '+63 917 555 0192',
      address: '45 Aurora Blvd, Quezon City, Metro Manila',
      billingMode: 'PLATFORM_ESCROW',
      status: 'ACTIVE',
      createdAt: '2026-01-15T08:00:00Z',
      updatedAt: '2026-01-15T08:00:00Z',
    };
    this.tenants.set(tenantId, tenant);

    // 2. Seed Loan Products
    const regularLoanProduct: LoanProduct = {
      id: 'prod_regular_001',
      name: 'Regular Member Loan',
      code: 'REG-01',
      type: 'REGULAR',
      minAmount: 5000,
      maxAmount: 250000,
      annualInterestRate: 0.12, // 12% p.a.
      maxTermMonths: 24,
      amortizationMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
      serviceFeeRate: 0.015,
      finesRateMonthly: 0.03,
      requiresCoMaker: true,
      minCoMakers: 1,
      requiresCollateral: false,
      isActive: true,
    };

    const emergencyLoanProduct: LoanProduct = {
      id: 'prod_emerg_002',
      name: 'Calamity & Emergency Loan',
      code: 'EMERG-01',
      type: 'EMERGENCY',
      minAmount: 3000,
      maxAmount: 50000,
      annualInterestRate: 0.06, // 6% p.a.
      maxTermMonths: 12,
      amortizationMethod: 'STRAIGHT_LINE',
      serviceFeeRate: 0.005,
      finesRateMonthly: 0.02,
      requiresCoMaker: false,
      minCoMakers: 0,
      requiresCollateral: false,
      isActive: true,
    };
    this.loanProducts.set(tenantId, [regularLoanProduct, emergencyLoanProduct]);

    // 3. Seed Members
    const member1: Member = {
      id: 'mem_maria_santos',
      memberNumber: 'MEM-2026-0001',
      firstName: 'Maria',
      middleName: 'Clara',
      lastName: 'Santos',
      email: 'maria.santos@gmail.com',
      phone: '+63 918 123 4567',
      birthdate: '1988-06-12',
      gender: 'FEMALE',
      civilStatus: 'MARRIED',
      address: '12 Rizal St, Barangay Central, Quezon City',
      classification: 'REGULAR',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedAt: '2026-01-20T09:00:00Z',
      createdAt: '2026-01-20T09:00:00Z',
      updatedAt: '2026-01-20T09:00:00Z',
    };

    const member2: Member = {
      id: 'mem_juan_delacruz',
      memberNumber: 'MEM-2026-0002',
      firstName: 'Juan',
      middleName: 'Perez',
      lastName: 'Dela Cruz',
      email: 'juan.delacruz@yahoo.com',
      phone: '+63 920 987 6543',
      birthdate: '1992-11-30',
      gender: 'MALE',
      civilStatus: 'SINGLE',
      address: '88 Mabini St, Barangay San Antonio, Pasig City',
      classification: 'REGULAR',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedAt: '2026-02-01T10:00:00Z',
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    };
    this.members.set(tenantId, [member1, member2]);

    // 4. Seed NPC Consents & KYC Docs
    this.npcConsents.set(tenantId, [
      {
        id: 'npc_001',
        memberId: member1.id,
        consentType: 'PRIVACY_POLICY',
        version: 'v2026.1',
        agreed: true,
        ipAddress: '120.29.74.12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)',
        timestamp: '2026-01-20T09:05:00Z',
      },
    ]);

    this.kycDocs.set(tenantId, [
      {
        id: 'kyc_001',
        memberId: member1.id,
        idType: 'PHILSYS_NATIONAL_ID',
        idNumberEncrypted: NPCEncryptionService.encrypt('1234-5678-9012-3456'),
        frontDocumentUrl: 'https://storage.flexcoop.ph/kyc/maria_front.png',
        selfieUrl: 'https://storage.flexcoop.ph/kyc/maria_selfie.png',
        status: 'VERIFIED',
        verifiedAt: '2026-01-20T10:00:00Z',
        createdAt: '2026-01-20T09:10:00Z',
      },
    ]);

    // 5. Seed Share Capital Accounts
    this.shareAccounts.set(tenantId, [
      {
        id: 'shr_001',
        memberId: member1.id,
        accountNumber: 'SC-2026-0001',
        subscribedShares: 200, // ₱20,000 subscribed
        parValuePerShare: 100,
        subscribedAmount: 20000,
        paidUpAmount: 15000,
        balance: 15000,
        updatedAt: '2026-01-20T10:00:00Z',
      },
      {
        id: 'shr_002',
        memberId: member2.id,
        accountNumber: 'SC-2026-0002',
        subscribedShares: 100,
        parValuePerShare: 100,
        subscribedAmount: 10000,
        paidUpAmount: 10000,
        balance: 10000,
        updatedAt: '2026-02-01T10:00:00Z',
      },
    ]);

    // 6. Seed Savings Accounts
    this.savingsAccounts.set(tenantId, [
      {
        id: 'sav_001',
        memberId: member1.id,
        accountNumber: 'SAV-COMP-0001',
        type: 'COMPULSORY',
        interestRateAnnual: 0.03,
        balance: 5000,
        status: 'ACTIVE',
        createdAt: '2026-01-20T10:00:00Z',
        updatedAt: '2026-01-20T10:00:00Z',
      },
    ]);

    // 7. Seed Loan & Schedule with Upfront Deductions
    const loanPrincipal = 50000.0;
    const feeCalculation = MonetizationService.calculatePlatformFee(loanPrincipal, tenant.billingMode);
    const coopServiceFee = 750.0; // 1.5% coop fee
    const netProceeds = loanPrincipal - feeCalculation.grossFee - coopServiceFee;

    const scheduleData = AmortizationService.generateSchedule({
      principalAmount: loanPrincipal,
      annualInterestRate: regularLoanProduct.annualInterestRate,
      termMonths: 12,
      paymentFrequency: 'MONTHLY',
      method: regularLoanProduct.amortizationMethod,
      startDate: new Date('2026-02-01'),
    });

    const loanId = 'loan_maria_001';
    const sampleLoan: Loan = {
      id: loanId,
      loanNumber: 'LN-2026-00001',
      memberId: member1.id,
      productId: regularLoanProduct.id,
      principalAmount: loanPrincipal,
      interestRateAnnual: regularLoanProduct.annualInterestRate,
      termMonths: 12,
      paymentFrequency: 'MONTHLY',
      amortizationMethod: regularLoanProduct.amortizationMethod,
      status: 'DISBURSED',
      disbursementMethod: 'PLATFORM_ESCROW',
      disbursementReference: 'ESCROW-TX-992182',
      disbursedAt: '2026-02-01T11:00:00Z',
      platformFee: feeCalculation.grossFee,
      coopServiceFee,
      netProceedsDisbursed: netProceeds,
      totalInterestExpected: scheduleData.totalInterest,
      totalPayable: scheduleData.totalPayable,
      balanceRemaining: loanPrincipal,
      schedule: scheduleData.schedule,
      createdAt: '2026-01-28T14:00:00Z',
      updatedAt: '2026-02-01T11:00:00Z',
    };
    this.loans.set(tenantId, [sampleLoan]);

    // 8. Seed Platform Invoice (12% VAT)
    const platformInvoice = MonetizationService.generatePlatformInvoice({
      tenantId,
      loanId,
      disbursementReference: sampleLoan.disbursementReference!,
      loanAmount: loanPrincipal,
      billingMode: tenant.billingMode,
      tenantTin: tenant.tin,
    });
    this.platformInvoices.push(platformInvoice);

    // 9. Seed Double-Entry Disbursement Journal Entry (Balanced CDA accounts)
    const disbJournal = GeneralLedgerService.buildDisbursementEntry({
      loanId,
      loanNumber: sampleLoan.loanNumber,
      grossPrincipal: loanPrincipal,
      platformFee: feeCalculation.grossFee,
      coopServiceFee,
      netProceeds,
      disbursementChannel: 'PLATFORM_ESCROW',
      userId: 'usr_admin_001',
      memberId: member1.id,
      memberNumber: member1.memberNumber,
      memberName: `${member1.firstName} ${member1.lastName}`,
    });

    const shareJournal1 = GeneralLedgerService.buildShareDepositEntry({
      memberId: member1.id,
      memberNumber: member1.memberNumber,
      memberName: `${member1.firstName} ${member1.lastName}`,
      amount: 15000,
      userId: 'usr_teller_001',
    });

    const shareJournal2 = GeneralLedgerService.buildShareDepositEntry({
      memberId: member2.id,
      memberNumber: member2.memberNumber,
      memberName: `${member2.firstName} ${member2.lastName}`,
      amount: 10000,
      userId: 'usr_teller_001',
    });

    const savingsJournal1 = GeneralLedgerService.buildSavingsDepositEntry({
      memberId: member1.id,
      memberNumber: member1.memberNumber,
      memberName: `${member1.firstName} ${member1.lastName}`,
      amount: 5000,
      savingsType: 'COMPULSORY',
      userId: 'usr_teller_001',
    });

    this.journalEntries.set(tenantId, [
      { id: 'je_disb_001', ...disbJournal },
      { id: 'je_share_001', ...shareJournal1 },
      { id: 'je_share_002', ...shareJournal2 },
      { id: 'je_sav_001', ...savingsJournal1 },
    ]);

    // 10. Seed Collaterals (Real Estate Mortgage & Chattel Mortgage)
    const sampleREM: CollateralItem = {
      id: 'col_rem_001',
      tenantId,
      memberId: member1.id,
      memberNumber: member1.memberNumber,
      memberName: `${member1.firstName} ${member1.lastName}`,
      type: 'REAL_ESTATE_MORTGAGE',
      description: 'Residential Lot & 2-Storey House in Fairview, Quezon City',
      appraisedValue: 1200000,
      assessedValue: 960000,
      maxLoanToValueRatio: 0.70,
      maxAllowableLoanAmount: 840000,
      encumbranceStatus: 'REGISTERED_MORTGAGE',
      linkedLoanId: sampleLoan.id,
      linkedLoanNumber: sampleLoan.loanNumber,
      tctNumber: 'TCT-004-2019004812',
      registryOfDeedsLocation: 'Quezon City Registry of Deeds',
      lotAreaSqm: 180,
      notaryPublic: 'Atty. Roberto Dela Rosa',
      registrationDate: '2026-02-01',
      notes: 'First real estate mortgage with comprehensive fire insurance endorsed to Bayani Coop.',
      createdAt: '2026-01-20T10:00:00Z',
      updatedAt: '2026-02-01T11:00:00Z',
    };

    const sampleChattel: CollateralItem = {
      id: 'col_chat_002',
      tenantId,
      memberId: 'mem_juan_delacruz',
      memberNumber: 'MEM-2026-0002',
      memberName: 'Juan Perez Dela Cruz',
      type: 'CHATTEL_MORTGAGE',
      description: '2024 Isuzu D-Max 4x4 Utility Pickup Truck',
      appraisedValue: 850000,
      assessedValue: 680000,
      maxLoanToValueRatio: 0.60,
      maxAllowableLoanAmount: 510000,
      encumbranceStatus: 'UNENCUMBERED',
      vehicleMakeModel: 'Isuzu D-Max 3.0L 4x4 MT',
      plateNumber: 'NFP-8812',
      engineNumber: '4JJ3-199481',
      chassisNumber: 'MP1TFS408NT018821',
      ltoOrCrNumber: 'CR-2024-QC-992144',
      notaryPublic: 'Atty. Cristina Gomez',
      notes: 'Clean LTO certificate without encumbrance. Available as collateral for SME livelihood loans.',
      createdAt: '2026-02-10T14:30:00Z',
      updatedAt: '2026-02-10T14:30:00Z',
    };

    this.collaterals.set(tenantId, [sampleREM, sampleChattel]);

    // 11. Seed Initial Net Surplus Allocation (FY 2025)
    const initialSurplus: SurplusDistributionResult = {
      id: 'surplus_2025_seed',
      fiscalYear: 2025,
      netSurplus: 1250000,
      generalReserveFund: 125000, // 10%
      cetfLocalFund: 62500, // 5%
      cetfApexFund: 62500, // 5%
      communityDevelopmentFund: 37500, // 3%
      optionalFund: 87500, // 7%
      totalStatutoryReserves: 375000, // 30%
      distributableSurplus: 875000, // 70%
      totalInterestOnShareCapital: 525000, // 60% of distributable
      totalPatronageRefund: 350000, // 40% of distributable
      status: 'POSTED_TO_GL',
      approvedAt: '2026-01-10T10:00:00Z',
      memberAllocations: [
        {
          memberId: member1.id,
          memberNumber: member1.memberNumber,
          memberName: `${member1.firstName} ${member1.lastName}`,
          paidUpShareCapital: 15000,
          interestPaidOnLoans: 5000,
          interestOnShareCapital: 3150.00,
          patronageRefund: 2100.00,
          totalSurplusPayable: 5250.00,
        },
        {
          memberId: 'mem_juan_delacruz',
          memberNumber: 'MEM-2026-0002',
          memberName: 'Juan Perez Dela Cruz',
          paidUpShareCapital: 10000,
          interestPaidOnLoans: 3000,
          interestOnShareCapital: 2100.00,
          patronageRefund: 1260.00,
          totalSurplusPayable: 3360.00,
        },
      ],
    };

    this.surplusDistributions.set(tenantId, [initialSurplus]);
  }
}

export const dbStore = new AppDataStore();
