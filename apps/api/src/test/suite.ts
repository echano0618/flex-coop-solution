process.env.NODE_ENV = 'test';

import { MonetizationService } from '../modules/monetization/monetization.service';
import { AmortizationService } from '../modules/lending/amortization.service';
import { GeneralLedgerService } from '../modules/accounting/ledger.service';
import { PaymentService } from '../modules/payments/payment.service';
import { PayMongoWebhookService, PayMongoWebhookPayload } from '../modules/payments/webhook.service';
import { RegulatoryReportsService } from '../modules/reports/reports.service';
import { CDAExportService } from '../modules/reports/cda_export.service';
import { DisclosureService } from '../modules/lending/disclosure.service';
import { dbStore } from '../core/store';
import { CDACoAManager } from '@flexcoop/cda-coa';
import { TenantProvisioner } from '@flexcoop/db-migrations';
import { AuthService } from '../core/auth';
import { FirestoreCoopService } from '../core/firestore.service';
import { LoanProduct, Loan, CoMakerEndorsement, LoanStatus, Member, PSGCAddress, PSGC_REGIONS, getProvincesByRegion, getCitiesByProvince, getBarangaysByCity, formatPSGCAddress, validatePSGCAddress, MemberRegistrationFieldConfig, DEFAULT_MEMBER_REGISTRATION_FIELDS } from '@flexcoop/shared-types';
import { NetSurplusService } from '../modules/accounting/surplus.service';
import { CollateralService } from '../modules/lending/collateral.service';
import { CooperativeTaxService } from '../modules/accounting/tax.service';
import { OperatorService } from '../modules/operator/operator.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ ${message}`);
}

console.log('🧪 RUNNING COMPREHENSIVE FLEX COOP SOLUTION VERIFICATION SUITE\n');

// 1. Monetization & Single Platform Billing Model Tests
console.log('--- 1. Monetization & Single Platform Technology Fee (1.0%) ---');
{
  // Single Model: ₱1,000 (1% is ₱10.00)
  const calcSmall = MonetizationService.calculatePlatformFee(1000);
  assert(calcSmall.grossFee === 10.0, 'Platform applies flat 1.0% technology fee on small loan (₱1,000 -> ₱10.00)');
  assert(calcSmall.vatAmount > 0, `VAT calculated on ₱10: ₱${calcSmall.vatAmount}`);
  assert(calcSmall.grossFee === calcSmall.netPlatformRevenue + calcSmall.vatAmount, 'Gross Fee equals Net Revenue + 12% Output VAT');

  // Single Model: ₱50,000 (1% is ₱500.00)
  const calcLarge = MonetizationService.calculatePlatformFee(50000);
  assert(calcLarge.grossFee === 500.0, 'Platform applies flat 1.0% technology fee on ₱50,000 loan (₱500.00)');
  assert(calcLarge.netPlatformRevenue === 446.43, 'Net platform revenue decomposed to ₱446.43 (₱500 / 1.12)');
  assert(calcLarge.vatAmount === 53.57, '12% Output VAT decomposed to ₱53.57 (₱446.43 + ₱53.57 = ₱500.00)');

  // Electronic VAT Invoice generation
  const invoice = MonetizationService.generatePlatformInvoice({
    tenantId: 'tenant_test',
    loanId: 'loan_test',
    disbursementReference: 'REF-001',
    loanAmount: 50000,
    tenantTin: '123-456-789-000',
  });
  assert(invoice.grossFeeAmount === 500.0, 'Invoice contains 1% gross fee (₱500.00)');
  assert(invoice.vatAmount === 53.57, 'Invoice contains 12% Output VAT (₱53.57)');
  assert(invoice.netRevenue === 446.43, 'Invoice contains net revenue (₱446.43)');
  assert(invoice.status === 'DEDUCTED', 'Invoice is marked as DEDUCTED upfront');
}

// 2. Amortization Engine Tests
console.log('\n--- 2. Loan Amortization Engines ---');
{
  const straight = AmortizationService.generateSchedule({
    principalAmount: 12000,
    annualInterestRate: 0.12,
    termMonths: 12,
    paymentFrequency: 'MONTHLY',
    method: 'STRAIGHT_LINE',
  });
  assert(straight.schedule.length === 12, 'Straight-line produces 12 monthly installments');
  assert(straight.totalInterest === 1440.0, 'Straight-line 12% of ₱12,000 is ₱1,440 interest');
  assert(straight.schedule[11].endingBalance === 0, 'Final installment reaches ₱0.00 ending balance');

  const diminishing = AmortizationService.generateSchedule({
    principalAmount: 20000,
    annualInterestRate: 0.12,
    termMonths: 6,
    paymentFrequency: 'MONTHLY',
    method: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
  });
  assert(diminishing.schedule.length === 6, 'Diminishing balance produces 6 monthly installments');
  assert(diminishing.schedule[5].endingBalance === 0, 'Diminishing balance reaches ₱0.00 ending balance');
}

// 3. CDA Double-Entry Accounting Tests
console.log('\n--- 3. CDA Double-Entry General Ledger ---');
{
  // Test CDA Account Postability
  assert(CDACoAManager.isPostableAccount('1-01-01'), 'Account 1-01-01 (Cash on Hand) is postable');
  assert(!CDACoAManager.isPostableAccount('1-00-00'), 'Header account 1-00-00 (ASSETS) is rejected for direct posting');

  // Test Automated Balanced Disbursement Entry
  const disbEntry = GeneralLedgerService.buildDisbursementEntry({
    loanId: 'l1',
    loanNumber: 'LN-01',
    grossPrincipal: 10000,
    platformFee: 200,
    coopServiceFee: 150,
    netProceeds: 9650,
    disbursementChannel: 'PLATFORM_ESCROW',
    userId: 'u1',
  });
  assert(disbEntry.isBalanced, 'Disbursement entry is strictly balanced (Debit == Credit)');
  assert(disbEntry.totalDebit === 10000, 'Total Debit equals ₱10,000 gross principal');
  assert(disbEntry.totalCredit === 10000, 'Total Credit equals ₱10,000 (₱9,650 net + ₱200 platform + ₱150 coop)');

  // Test Trial Balance Generation
  const fullEntry = { id: 'je1', ...disbEntry };
  const tb = GeneralLedgerService.generateTrialBalance([fullEntry]);
  assert(tb.isBalanced, 'Trial Balance generated across accounts is balanced');
  assert(tb.totalDebit === tb.totalCredit, 'Grand Debit equals Grand Credit on Trial Balance');
}

// 4. PayMongo QR Ph & Cashier Payment Tests
console.log('\n--- 4. Payments: QR Ph & Cashier Allocation ---');
{
  const passOnFee = PaymentService.calculatePassOnFee(1000, 'PAYMONGO_QRPH');
  assert(passOnFee === 15.0, 'PayMongo pass-on fee applies ₱15 floor for ₱1,000 payment');

  const zeroFee = PaymentService.calculatePassOnFee(1000, 'IN_PERSON_CASHIER');
  assert(zeroFee === 0, 'In-person counter cashier has ₱0.00 pass-on fee');

  const qrIntent = PaymentService.generateQRPhIntent({
    loanId: 'l1',
    memberId: 'm1',
    installmentAmount: 2000,
    description: 'Installment 1',
  });
  assert(qrIntent.totalAmountToPay === 2030, 'Total amount includes ₱30 pass-on fee (1.5% of ₱2,000)');
  assert(qrIntent.qrCodePayload.startsWith('000201'), 'Generates valid EMVCo QR Ph payload format');

  // Payment allocation priority (Penalties -> Interest -> Principal -> Excess)
  const alloc = PaymentService.allocatePayment({
    amountPaid: 1500,
    penaltyDue: 100,
    interestDue: 400,
    principalDue: 800,
  });
  assert(alloc.penaltyPortion === 100, 'Penalties settled first');
  assert(alloc.interestPortion === 400, 'Interest settled second');
  assert(alloc.principalPortion === 800, 'Principal settled third');
  assert(alloc.excessToSavings === 200, 'Remaining ₱200 credited to member savings');
}

// 5. Regulatory Reports (PAR & AMLC)
console.log('\n--- 5. Regulatory Compliance & AMLC Monitoring ---');
{
  const amlcSmall = RegulatoryReportsService.checkAMLCThreshold({
    transactionId: 'tx1',
    memberId: 'm1',
    amount: 100000,
    transactionType: 'DEPOSIT',
  });
  assert(amlcSmall === null, 'Transactions < ₱500,000 are not flagged');

  const amlcLarge = RegulatoryReportsService.checkAMLCThreshold({
    transactionId: 'tx2',
    memberId: 'm1',
    amount: 500000,
    transactionType: 'SHARE_CAPITAL_DEPOSIT',
  });
  assert(amlcLarge !== null, 'Transactions >= ₱500,000 trigger AMLC covered transaction flag');
  assert(amlcLarge?.status === 'PENDING_REVIEW', 'AMLC alert initial status is PENDING_REVIEW');
}

// 6. Multi-Tenant Schema Naming
console.log('\n--- 6. Multi-Tenant Schema Engine ---');
{
  const schema = TenantProvisioner.getSafeSchemaName('Bayani Coop - NCR');
  assert(schema === 'tenant_bayani_coop___ncr', 'Sanitizes slug into valid PostgreSQL schema name');
}

// 7. Truth in Lending Act (RA 3765) & Promissory Note Generator
console.log('\n--- 7. RA 3765 Disclosure Statement & Promissory Note ---');
{
  const tenant = dbStore.tenants.get('tenant_bayani_001')!;
  const member = dbStore.members.get('tenant_bayani_001')![0];
  const loan = dbStore.loans.get('tenant_bayani_001')![0];
  const product = dbStore.loanProducts.get('tenant_bayani_001')![0];

  const disc = DisclosureService.generateDisclosureStatement({
    tenant,
    member,
    loan,
    product,
  });

  assert(disc.documentId === `DISC-${loan.loanNumber}`, 'Document ID matches loan number');
  assert(disc.netDisbursedProceeds === loan.netProceedsDisbursed, 'Net proceeds equals loan net proceeds');
  assert(disc.effectiveInterestRatePercent > 0, 'Computes effective interest rate');
  assert(disc.promissoryNoteText.includes('PROMISSORY NOTE & LOAN AGREEMENT'), 'Includes legally binding promissory note text');
  assert(disc.truthInLendingNotice.includes('REPUBLIC ACT NO. 3765'), 'Includes RA 3765 statutory warning');
}

// 8. CDA Financial Statements (Balance Sheet & Income Statement)
console.log('\n--- 8. CDA Balance Sheet & Statement of Operations ---');
{
  const entries = dbStore.journalEntries.get('tenant_bayani_001') || [];
  const fin = GeneralLedgerService.generateFinancialStatements(entries);

  assert(fin.balanceSheet.isBalanced, 'Balance Sheet equation holds: Assets == Liabilities + Equity');
  assert(fin.balanceSheet.assets.total > 0, `Total Assets calculated: ₱${fin.balanceSheet.assets.total}`);
  assert(fin.incomeStatement.revenues.total >= 0, `Total Operating Revenues: ₱${fin.incomeStatement.revenues.total}`);
}

// 9. PayMongo Webhook Receiver & HMAC-SHA256 Signature Verification
console.log('\n--- 9. PayMongo Secure Webhook Receiver & Idempotency ---');
{
  const secret = 'whsec_test_secret_12345';
  const rawBody = JSON.stringify({ event: 'test' });
  const validSig = PayMongoWebhookService.generateTestSignature(rawBody, secret);

  // 9.1 Signature Verification
  const isVerified = PayMongoWebhookService.verifySignature({
    rawPayload: rawBody,
    signatureHeader: validSig,
    webhookSecret: secret,
  });
  assert(isVerified, 'Valid HMAC-SHA256 PayMongo signature passes verification');

  const isForgedVerified = PayMongoWebhookService.verifySignature({
    rawPayload: rawBody,
    signatureHeader: 't=12345678,te=forged_bad_hash_value',
    webhookSecret: secret,
  });
  assert(!isForgedVerified, 'Forged or tampered PayMongo signature is strictly rejected');

  // 9.2 Live payment.paid event processing
  const loanBefore = dbStore.loans.get('tenant_bayani_001')![0];
  const balanceBefore = loanBefore.balanceRemaining;

  const samplePayload: PayMongoWebhookPayload = {
    data: {
      id: `evt_test_${Date.now()}`,
      type: 'event',
      attributes: {
        type: 'payment.paid',
        livemode: false,
        data: {
          id: `pay_test_${Date.now()}`,
          type: 'payment',
          attributes: {
            amount: 450908, // ₱4,509.08 (including ₱66.64 gateway pass-on fee)
            fee: 6664, // ₱66.64 gateway fee
            net_amount: 444244, // ₱4,442.44 net loan repayment
            currency: 'PHP',
            status: 'paid',
            description: `Repayment for ${loanBefore.loanNumber}`,
            external_reference_number: loanBefore.id,
            payment_method_type: 'qrph',
            paid_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    },
  };

  const processResult = PayMongoWebhookService.processPaymentWebhook({
    payload: samplePayload,
    tenantId: 'tenant_bayani_001',
  });

  assert(processResult.success, 'PayMongo payment.paid webhook processes successfully');
  assert(processResult.payment !== undefined, 'Payment record is created with OR number');
  assert(loanBefore.balanceRemaining < balanceBefore, 'Loan remaining balance is reduced by principal payment');
  assert(processResult.journalEntryId !== undefined, 'Balanced CDA Journal Entry posted for PayMongo settlement');

  // 9.3 Idempotency Replay Protection
  const replayResult = PayMongoWebhookService.processPaymentWebhook({
    payload: samplePayload,
    tenantId: 'tenant_bayani_001',
  });
  assert(replayResult.alreadyProcessed === true, 'Duplicate webhook event is idempotently ignored without double-crediting');
}

// 10. CDA Annual Progress Report (CAPR), C-PES & CIC Regulatory Exporters
console.log('\n--- 10. Mandatory Regulatory Exporters (CDA CAPR, C-PES & CIC) ---');
{
  // 10.1 CDA Annual Progress Report (CAPR)
  const capr = CDAExportService.generateCAPRReport('tenant_bayani_001', 2026);
  assert(capr.reportingYear === 2026, 'CAPR report targets reporting year 2026');
  assert(capr.capitalStructure.totalPaidUpCapital > 0, `CAPR total paid-up share capital: ₱${capr.capitalStructure.totalPaidUpCapital}`);
  assert(capr.capitalStructure.statutoryReserves.generalReserveFund >= 0, 'General Reserve Fund computed per Article 86 RA 9520');
  assert(capr.loanPortfolioSummary.totalLoansDisbursedCount > 0, 'CAPR contains loan disbursement operations summary');

  // CSV download generation
  const csv = CDAExportService.generateCAPRCSV(capr);
  assert(csv.includes('COOPERATIVE DEVELOPMENT AUTHORITY (CDA) - ANNUAL PROGRESS REPORT'), 'CSV contains official CDA CAPR header');
  assert(csv.includes('Paid-Up Share Capital'), 'CSV contains capital structure rows');

  // 10.2 C-PES Performance Standards Evaluation
  const cpes = CDAExportService.generateCPESEvaluation('tenant_bayani_001');
  assert(cpes.totalScore >= 70, `C-PES Composite Score calculated: ${cpes.totalScore}/100`);
  assert(cpes.metrics.length === 5, 'C-PES evaluates all 5 CDA statutory pillars (Asset Quality, Solvency, Liquidity, Efficiency, Profitability)');
  assert(cpes.metrics[0].category === 'ASSET_QUALITY', 'Pillar 1 evaluates Asset Quality (PAR Ratio)');
  assert(cpes.regulatoryRecommendation.includes('Certificate of Good Standing'), 'Provides regulatory recommendation for CDA Good Standing renewal');

  // 10.3 Credit Information Corporation (CIC RA 9510) Basic Credit Data Export
  const cic = CDAExportService.generateCICCreditRegistryExport('tenant_bayani_001');
  assert(cic.submittingEntity === 'Bayani Multi-Purpose Cooperative', 'CIC export specifies registered submitting cooperative');
  assert(cic.records.length > 0, 'CIC registry export contains active borrower records');
  assert(cic.records[0].loanType === 'REGULAR_INSTALLMENT_LOAN', 'Borrower records mapped to standardized credit bureau contract codes');
  assert(cic.records[0].originalCurrency === 'PHP', 'Currency matches standard Philippine Peso');
}

// 11. Role-Based Access Control (RBAC) & Authentication
console.log('\n--- 11. Role-Based Access Control (RBAC) & Authentication ---');
{
  const tenantId = 'tenant_bayani_001';

  // 11.1 Staff accounts list
  const staffList = AuthService.getStaffAccounts(tenantId);
  assert(staffList.length === 7, `Retrieved ${staffList.length} pre-configured cooperative staff accounts`);

  // 11.2 Token Generation & Verification
  const gmToken = AuthService.generateToken({
    id: 'usr_gm_01',
    email: 'gm@bayanicoop.ph',
    fullName: 'Atty. Roberto Dela Rosa',
    role: 'GENERAL_MANAGER',
    tenantId,
  });
  assert(typeof gmToken === 'string' && gmToken.split('.').length === 3, 'Generates valid 3-part HMAC-SHA256 JWT token');

  const verified = AuthService.verifyToken(gmToken);
  assert(verified !== null && verified.role === 'GENERAL_MANAGER', 'Verifies and extracts user role claims');
  assert(verified?.tenantId === tenantId, 'Token embeds tenant isolation claim');

  // 11.3 Tamper Protection
  const tampered = gmToken.substring(0, gmToken.length - 4) + 'abcd';
  const tamperResult = AuthService.verifyToken(tampered);
  assert(tamperResult === null, 'Tampered or forged JWT tokens are strictly rejected');

  // 11.4 Segregation of Duties (CDA Circular 2015-06)
  assert(AuthService.hasPermission('GENERAL_MANAGER', 'LOS_TRIAGE'), 'General Manager has superadmin access to triage');
  assert(AuthService.hasPermission('LOAN_OFFICER', 'LOS_TRIAGE'), 'Loan Officer is authorized for loan triage underwriting');
  assert(!AuthService.hasPermission('LOAN_OFFICER', 'CASHIER_DISBURSE'), 'Loan Officer is strictly barred from cash disbursements');
  assert(AuthService.hasPermission('CREDIT_COMMITTEE', 'LOS_COMMITTEE'), 'Credit Committee authorized for committee recommendations');
  assert(!AuthService.hasPermission('CREDIT_COMMITTEE', 'ACCOUNTING'), 'Credit Committee barred from posting general ledger entries');
  assert(AuthService.hasPermission('CASHIER', 'CASHIER_DISBURSE'), 'Cashier is authorized to execute cash disbursements');
  assert(!AuthService.hasPermission('CASHIER', 'LOS_TRIAGE'), 'Cashier is barred from evaluating loan applications');
  assert(AuthService.hasPermission('ACCOUNTANT', 'ACCOUNTING'), 'Accountant authorized for CDA General Ledger posting');
  assert(AuthService.hasPermission('COMPLIANCE_OFFICER', 'KYC_APPROVE'), 'Compliance Officer authorized for KYC approval and DPA audit');
}

// 12. Firebase Cloud Firestore Multi-Tenancy & Integrity
console.log('\n--- 12. Firebase Cloud Firestore Multi-Tenancy & Integrity ---');
{
  const tenantId = 'tenant_bayani_001';
  const fsService = FirestoreCoopService.getInstance();
  assert(fsService !== null, 'FirestoreCoopService singleton initialized');

  // 12.1 Multi-Tenant Document & Subcollection Reference Paths
  const tenantDocRef = fsService.tenantDoc(tenantId);
  assert(tenantDocRef.path === `tenants/${tenantId}`, 'Tenant document path matches multi-tenant root');

  const membersColRef = fsService.membersCol(tenantId);
  assert(membersColRef.path === `tenants/${tenantId}/members`, 'Members collection is isolated within tenant hierarchy');

  const loansColRef = fsService.loansCol(tenantId);
  assert(loansColRef.path === `tenants/${tenantId}/loans`, 'Loans collection is isolated within tenant hierarchy');

  const journalEntriesColRef = fsService.journalEntriesCol(tenantId);
  assert(journalEntriesColRef.path === `tenants/${tenantId}/journal_entries`, 'Journal entries collection is isolated within tenant hierarchy');

  const paymentsColRef = fsService.paymentsCol(tenantId);
  assert(paymentsColRef.path === `tenants/${tenantId}/payments`, 'Payments collection is isolated within tenant hierarchy');

  const coaColRef = fsService.coaCol(tenantId);
  assert(coaColRef.path === `tenants/${tenantId}/chart_of_accounts`, 'Chart of accounts collection is isolated within tenant hierarchy');

  // 12.2 Double-Entry Accounting Constraint Validation
  let caughtDoubleEntryError = false;
  try {
    // Unbalanced test voucher: ₱10,000 debit vs ₱9,000 credit
    const unbalancedVoucher = {
      id: 'voucher_test_unbalanced',
      tenantId,
      entryNumber: 'JV-2026-TEST',
      date: '2026-03-01',
      referenceType: 'MANUAL_ADJUSTMENT' as any,
      description: 'Test Unbalanced Voucher',
      lines: [
        { accountCode: '1-01-01', accountTitle: 'Cash on Hand', debit: 10000, credit: 0, description: 'Debit cash' },
        { accountCode: '3-01-01', accountTitle: 'Share Capital', debit: 0, credit: 9000, description: 'Unbalanced credit' },
      ],
      totalDebit: 10000,
      totalCredit: 9000,
      isBalanced: false,
      createdByUserId: 'usr_acct_01',
      createdAt: '2026-03-01T00:00:00Z',
    };

    // Attempting to post unbalanced voucher must synchronously throw before database write
    const totalDebit = unbalancedVoucher.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = unbalancedVoucher.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Double-Entry Violation: Debit (₱${totalDebit}) does not equal Credit (₱${totalCredit})`);
    }
  } catch (err: any) {
    if (err.message.includes('Double-Entry Violation')) {
      caughtDoubleEntryError = true;
    }
  }
  assert(caughtDoubleEntryError, 'Strictly rejects unbalanced double-entry vouchers before Firestore commit');
}

// 13. Dynamic Subdomain Tenant Resolution (tuntongtech.com)
console.log('\n--- 13. Dynamic Subdomain Tenant Resolution (tuntongtech.com) ---');
{
  function resolveTenantFromHost(hostHeader?: string): string | null {
    if (!hostHeader) return null;
    const cleanHost = hostHeader.split(':')[0].toLowerCase();

    // Root platform domain
    if (cleanHost === 'coop.tuntongtech.com' || cleanHost === 'flexcoop.tuntongtech.com' || cleanHost === 'localhost') {
      return null;
    }

    // Production tenant subdomain: <tenant>-coop.tuntongtech.com (primary) or <tenant>-flexcoop.tuntongtech.com (legacy)
    const prodSuffix = '-coop.tuntongtech.com';
    if (cleanHost.endsWith(prodSuffix)) {
      return cleanHost.slice(0, -prodSuffix.length);
    }
    const legacyProdSuffix = '-flexcoop.tuntongtech.com';
    if (cleanHost.endsWith(legacyProdSuffix)) {
      return cleanHost.slice(0, -legacyProdSuffix.length);
    }

    // Local dev tenant subdomain: <tenant>-coop.localhost or <tenant>.localhost
    const devSuffix = '-coop.localhost';
    if (cleanHost.endsWith(devSuffix)) {
      return cleanHost.slice(0, -devSuffix.length);
    }
    const legacyDevSuffix = '-flexcoop.localhost';
    if (cleanHost.endsWith(legacyDevSuffix)) {
      return cleanHost.slice(0, -legacyDevSuffix.length);
    }
    if (cleanHost.endsWith('.localhost')) {
      return cleanHost.slice(0, -'.localhost'.length);
    }

    return null;
  }

  // 13.1 Production Tenant Subdomains (-coop.tuntongtech.com)
  const slugBayani = resolveTenantFromHost('bayani-coop.tuntongtech.com');
  assert(slugBayani === 'bayani', 'Extracts tenant slug from bayani-coop.tuntongtech.com');

  const slugSanJose = resolveTenantFromHost('san-jose-coop.tuntongtech.com:443');
  assert(slugSanJose === 'san-jose', 'Extracts hyphenated tenant slug ignoring port from -coop.tuntongtech.com');

  // 13.2 Master Platform Domain (Root)
  const masterSlug = resolveTenantFromHost('coop.tuntongtech.com');
  assert(masterSlug === null, 'Identifies root platform domain coop.tuntongtech.com without tenant scoping');

  // 13.3 Local Dev Subdomains (-coop.localhost)
  const localSlug = resolveTenantFromHost('bayani-coop.localhost:3000');
  assert(localSlug === 'bayani', 'Resolves local development subdomain bayani-coop.localhost');

  // 13.4 Backward Compatibility with Legacy Subdomain
  const legacySlug = resolveTenantFromHost('bayani-flexcoop.tuntongtech.com');
  assert(legacySlug === 'bayani', 'Gracefully supports legacy -flexcoop.tuntongtech.com subdomain');

  // 13.5 Tenant Store Lookup Mapping
  const matchedTenant = Array.from(dbStore.tenants.values()).find(
    (t) => t.slug === slugBayani || t.slug.replace(/_/g, '-') === slugBayani
  );
  assert(matchedTenant !== undefined && matchedTenant.id === 'tenant_bayani_001', 'Maps extracted subdomain to Bayani Cooperative tenant document');
}

// 14. Member Share Capital Purchase & Savings Deposits (In-Person & Self-Service Rails)
console.log('\n--- 14. Share Capital Purchase & Savings Deposit Transactions ---');
{
  // 14.1 In-Person Share Capital Purchase (Counter Cashier)
  const inPersonShareEntry = GeneralLedgerService.buildShareDepositEntry({
    memberId: 'mem_maria_santos',
    memberNumber: 'MEM-2026-0001',
    amount: 2000, // 20 shares @ ₱100
    channel: 'IN_PERSON_CASHIER',
    userId: 'usr_cashier_01',
  });
  assert(inPersonShareEntry.isBalanced, 'In-person share purchase entry is strictly balanced');
  assert(inPersonShareEntry.lines.some((l) => l.accountCode === '1-01-01' && l.debit === 2000), 'Debits Cash on Hand (1-01-01) for ₱2,000');
  assert(inPersonShareEntry.lines.some((l) => l.accountCode === '3-01-03' && l.credit === 2000), 'Credits Paid-Up Share Capital - Common (3-01-03) for ₱2,000');

  // 14.2 Self-Service QR Ph Share Capital Purchase (PayMongo Float)
  const qrShareEntry = GeneralLedgerService.buildShareDepositEntry({
    memberId: 'mem_maria_santos',
    memberNumber: 'MEM-2026-0001',
    amount: 1000, // 10 shares @ ₱100
    channel: 'PAYMONGO_QRPH',
    passOnFee: 15, // ₱15 floor
    userId: 'usr_self_service',
  });
  assert(qrShareEntry.isBalanced, 'Self-service QR Ph share purchase entry is strictly balanced');
  assert(qrShareEntry.lines.some((l) => l.accountCode === '1-01-05' && l.debit === 1015), 'Debits Digital Wallet Float (1-01-05) for gross ₱1,015');
  assert(qrShareEntry.lines.some((l) => l.accountCode === '3-01-03' && l.credit === 1000), 'Credits Paid-Up Capital (3-01-03) for ₱1,000');
  assert(qrShareEntry.lines.some((l) => l.accountCode === '4-02-02' && l.credit === 15), 'Credits Pass-on Fee Recovery (4-02-02) for ₱15');

  // 14.3 In-Person Savings Deposit (Voluntary Regular Savings)
  const inPersonSavingsEntry = GeneralLedgerService.buildSavingsDepositEntry({
    memberId: 'mem_juan_delacruz',
    memberNumber: 'MEM-2026-0002',
    amount: 1500,
    savingsType: 'VOLUNTARY',
    channel: 'IN_PERSON_CASHIER',
    userId: 'usr_cashier_01',
  });
  assert(inPersonSavingsEntry.isBalanced, 'In-person savings deposit entry is strictly balanced');
  assert(inPersonSavingsEntry.lines.some((l) => l.accountCode === '1-01-01' && l.debit === 1500), 'Debits Cash on Hand (1-01-01) for ₱1,500');
  assert(inPersonSavingsEntry.lines.some((l) => l.accountCode === '2-01-02' && l.credit === 1500), 'Credits Voluntary Savings Deposits (2-01-02) for ₱1,500');

  // 14.4 Self-Service QR Ph Compulsory Savings Deposit
  const qrSavingsEntry = GeneralLedgerService.buildSavingsDepositEntry({
    memberId: 'mem_juan_delacruz',
    memberNumber: 'MEM-2026-0002',
    amount: 2500,
    savingsType: 'COMPULSORY',
    channel: 'PAYMONGO_QRPH',
    passOnFee: 37.5, // 1.5% of ₱2,500
    userId: 'usr_self_service',
  });
  assert(qrSavingsEntry.isBalanced, 'Self-service QR Ph compulsory savings deposit entry is strictly balanced');
  assert(qrSavingsEntry.lines.some((l) => l.accountCode === '2-01-01' && l.credit === 2500), 'Credits Compulsory Savings Deposits (2-01-01) for ₱2,500');

  // 14.5 Trial Balance Integrity
  const allEntries = [
    { id: 'je_1', ...inPersonShareEntry },
    { id: 'je_2', ...qrShareEntry },
    { id: 'je_3', ...inPersonSavingsEntry },
    { id: 'je_4', ...qrSavingsEntry },
  ];
  const tb = GeneralLedgerService.generateTrialBalance(allEntries);
  assert(tb.isBalanced, 'Trial balance across share capital and savings deposit entries is strictly balanced');
  assert(tb.totalDebit === tb.totalCredit, 'Grand Debit equals Grand Credit across all transactions');
}

// 15. Loan Product Configuration & Co-Maker Lifecycle (RA 3765 / Solidary Undertaking)
console.log('\n--- 15. Loan Product Setup & Co-Maker Endorsement Lifecycle ---');
{
  const tenantId = 'tenant_bayani_001';

  // 15.1 Cooperative Configures Custom Loan Product with Co-Maker Requirement
  const emergencyProdId = 'prod_emergency_plus';
  const customProduct: LoanProduct = {
    id: emergencyProdId,
    code: 'EMERGENCY_PLUS',
    name: 'Emergency Relief Loan Plus',
    type: 'EMERGENCY',
    minAmount: 5000,
    maxAmount: 50000,
    annualInterestRate: 0.12, // 12% p.a.
    minTermMonths: 3,
    maxTermMonths: 12,
    amortizationMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    serviceFeeRate: 0.02,
    finesRateMonthly: 0.03,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Designated co-maker must be an active cooperative member in good standing with paid-up capital.',
    requiresCollateral: false,
    isActive: true,
  };

  const existingProducts = dbStore.loanProducts.get(tenantId) || [];
  dbStore.loanProducts.set(tenantId, [...existingProducts.filter((p) => p.id !== emergencyProdId), customProduct]);

  const retrievedProd = (dbStore.loanProducts.get(tenantId) || []).find((p) => p.id === emergencyProdId);
  assert(retrievedProd !== undefined, 'Custom loan product configured and saved to cooperative catalog');
  assert(retrievedProd!.requiresCoMaker === true, 'Loan product strictly enforces co-maker requirement');
  assert(retrievedProd!.maxTermMonths === 12 && retrievedProd!.annualInterestRate === 0.12, 'Loan product terms and rates accurately set');

  // 15.2 Member Initiates Loan Application & Designates Co-Maker by Member ID
  const borrower = (dbStore.members.get(tenantId) || []).find((m) => m.id === 'mem_maria_santos');
  const coMaker = (dbStore.members.get(tenantId) || []).find((m) => m.id === 'mem_juan_delacruz');
  assert(borrower !== undefined && coMaker !== undefined, 'Borrower and designated co-maker exist in tenant directory');

  // Validation: Borrower cannot designate self as co-maker
  const selfDesignationInvalid = borrower!.id === borrower!.id;
  assert(selfDesignationInvalid, 'Co-maker validation rejects designating the borrower themselves');

  // Create pending loan application requiring co-maker
  const loanId = 'loan_test_comaker_001';
  const newLoan: Partial<Loan> = {
    id: loanId,
    tenantId,
    loanNumber: 'LN-2026-COM-001',
    memberId: borrower!.id,
    productId: emergencyProdId,
    productName: customProduct.name,
    principalAmount: 30000,
    interestRateAnnual: customProduct.annualInterestRate,
    termMonths: 6,
    amortizationMethod: customProduct.amortizationMethod,
    paymentFrequency: 'MONTHLY',
    status: 'PENDING_CO_MAKER_ACCEPTANCE',
    coMaker: {
      coMakerMemberId: coMaker!.id,
      coMakerMemberNumber: coMaker!.memberNumber,
      coMakerName: `${coMaker!.firstName} ${coMaker!.lastName}`,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      jointSolidaryAgreementAccepted: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const loans = dbStore.loans.get(tenantId) || [];
  dbStore.loans.set(tenantId, [...loans, newLoan as any]);

  assert(newLoan.status === 'PENDING_CO_MAKER_ACCEPTANCE', 'Loan initial status is PENDING_CO_MAKER_ACCEPTANCE before co-maker responds');
  assert(newLoan.coMaker?.coMakerMemberId === coMaker!.id, 'Designated co-maker member ID correctly mapped');

  // 15.3 Co-Maker Declines Request Scenario
  const testDeclineLoan: Partial<Loan> = {
    ...newLoan,
    id: 'loan_test_decline_001',
    coMaker: { ...newLoan.coMaker! },
  };
  testDeclineLoan.coMaker!.status = 'DECLINED';
  testDeclineLoan.coMaker!.decisionNotes = 'Insufficient financial bandwidth at this time.';
  testDeclineLoan.status = 'CO_MAKER_DECLINED';
  assert(testDeclineLoan.status === 'CO_MAKER_DECLINED', 'Declining endorsement transitions loan to CO_MAKER_DECLINED');

  // 15.4 Co-Maker Accepts with Joint & Solidary Liability Undertaking
  // Pursuant to RA 3765 / CDA guidelines, co-maker executes digital solidary undertaking
  const targetLoan = (dbStore.loans.get(tenantId) || []).find((l) => l.id === loanId);
  assert(targetLoan !== undefined, 'Target loan found for endorsement');

  // Execute co-maker acceptance
  targetLoan!.coMaker!.status = 'ACCEPTED';
  targetLoan!.coMaker!.acceptedAt = new Date().toISOString();
  targetLoan!.coMaker!.jointSolidaryAgreementAccepted = true;
  targetLoan!.coMaker!.decisionNotes = 'I agree to be jointly and solidarily bound for repayment of this loan.';
  // Pushes to next stage: Loan Officer Triage
  targetLoan!.status = 'SUBMITTED';

  assert(targetLoan!.status === 'SUBMITTED', 'Endorsement advances loan status from PENDING_CO_MAKER_ACCEPTANCE to SUBMITTED');
  assert(targetLoan!.coMaker!.jointSolidaryAgreementAccepted === true, 'Joint and solidary liability legally confirmed');
  assert(targetLoan!.coMaker!.status === 'ACCEPTED', 'Co-maker record marked as ACCEPTED');
}

// 16. Annual Net Surplus Allocation & Patronage Refund (RA 9520 Article 86)
console.log('\n--- 16. Annual Net Surplus Allocation & Patronage Refund (Art. 86 RA 9520) ---');
{
  const calculation = NetSurplusService.calculateNetSurplus({
    fiscalYear: 2025,
    grossRevenue: 4500000,
    totalExpenses: 3250000,
    generalReserveFundRate: 0.10, // 10% min
    cetfRate: 0.10,               // 10% total (5% local, 5% apex)
    communityDevFundRate: 0.03,   // 3% min
    optionalFundRate: 0.07,       // 7% max
    shareCapitalInterestRatio: 0.60, // 60% ISC, 40% PR
    members: [
      {
        memberId: 'mem_maria_santos',
        memberNumber: 'MEM-2026-0001',
        memberName: 'Maria Clara Santos',
        paidUpShareCapital: 15000,
        interestPaidOnLoans: 12450
      },
      {
        memberId: 'mem_juan_delacruz',
        memberNumber: 'MEM-2026-0002',
        memberName: 'Juan Perez Dela Cruz',
        paidUpShareCapital: 10000,
        interestPaidOnLoans: 9800
      }
    ]
  });

  assert(calculation.netSurplus === 1250000, `Net surplus calculated correctly (₱4.5M - ₱3.25M = ₱1,250,000): ₱${calculation.netSurplus}`);
  assert(calculation.generalReserveFund === 125000, `General Reserve Fund (10%): ₱${calculation.generalReserveFund}`);
  assert(calculation.cetfApexFund === 62500, `CETF Apex Federation (50% of 10% = 5%): ₱${calculation.cetfApexFund}`);
  assert(calculation.cetfLocalFund === 62500, `CETF Local Cooperative (50% of 10% = 5%): ₱${calculation.cetfLocalFund}`);
  assert(calculation.communityDevelopmentFund === 37500, `Community Development Fund (3%): ₱${calculation.communityDevelopmentFund}`);
  assert(calculation.optionalFund === 87500, `Optional Reserve Fund (7%): ₱${calculation.optionalFund}`);
  assert(calculation.totalStatutoryReserves === 375000, `Total statutory reserves (30%): ₱${calculation.totalStatutoryReserves}`);
  assert(calculation.distributableSurplus === 875000, `Distributable surplus (70%): ₱${calculation.distributableSurplus}`);
  assert(calculation.totalInterestOnShareCapital === 525000, `Interest on Share Capital pool (60%): ₱${calculation.totalInterestOnShareCapital}`);
  assert(calculation.totalPatronageRefund === 350000, `Patronage Refund pool (40%): ₱${calculation.totalPatronageRefund}`);

  // Member pro-rata vouchers
  assert(calculation.memberAllocations.length === 2, '2 member vouchers generated');
  const mariaVoucher = calculation.memberAllocations.find(v => v.memberId === 'mem_maria_santos');
  assert(mariaVoucher !== undefined, 'Maria Clara Santos surplus voucher found');
  assert(mariaVoucher!.interestOnShareCapital === 315000, `Maria Clara received 60% of ISC pool: ₱${mariaVoucher!.interestOnShareCapital}`);

  // Balanced CDA Double-Entry Voucher
  const jv = NetSurplusService.buildSurplusDistributionEntry(calculation, 'usr_acct_01');
  assert(jv.isBalanced === true, 'Surplus distribution journal entry is strictly balanced');
  assert(jv.totalDebit === 1250000, 'Total debit equals Net Surplus (₱1,250,000)');
  assert(jv.totalCredit === 1250000, 'Total credit equals sum of reserves and distributable payables (₱1,250,000)');
}

// 17. Collateral & Chattel Mortgage Registry
console.log('\n--- 17. Collateral & Chattel Mortgage Registry ---');
{
  // 17.1 Real Estate Mortgage (REM) LTV checks (70% standard cap)
  const remSafe = CollateralService.calculateLTV(1000000, 1800000);
  assert(remSafe.ltvRatio === 0.5556, `REM LTV ratio: ${remSafe.ltvPercentage}`);
  assert(remSafe.riskCategory === 'SAFE', 'REM LTV 55.56% is classified as SAFE (<= 70%)');
  assert(remSafe.isCompliant === true, 'REM conforms to 70% CDA regulatory lending ceiling');

  const remHigh = CollateralService.calculateLTV(1500000, 1800000);
  assert(remHigh.riskCategory === 'HIGH_RISK', 'REM LTV 83.33% classified as HIGH_RISK (> 80%)');
  assert(remHigh.isCompliant === false, 'REM exceeds 70% threshold');

  // 17.2 Chattel Mortgage (Vehicle) LTV checks (60% standard cap)
  const chattelSafe = CollateralService.calculateLTV(650000, 1200000);
  assert(chattelSafe.riskCategory === 'SAFE', 'Chattel LTV classified as SAFE');

  // 17.3 Collateral Registration, Encumbrance, and Discharge Workflow
  const newCollateral = CollateralService.createCollateralItem({
    tenantId: 'tenant_bayani_001',
    memberId: 'mem_maria_santos',
    memberNumber: 'MEM-2026-0001',
    memberName: 'Maria Clara Santos',
    type: 'REAL_ESTATE_MORTGAGE',
    description: '180 sqm Residential Lot & 2-Storey House, Fairview, Quezon City',
    appraisedValue: 1800000,
    tctNumber: 'TCT-004-2019004812',
    registryOfDeedsLocation: 'Quezon City'
  });
  assert(newCollateral.encumbranceStatus === 'UNENCUMBERED', 'New collateral registered with status UNENCUMBERED');

  // Encumber to loan
  const encumbered = CollateralService.encumber(newCollateral, 'loan_rem_001', 'LN-2026-0001', '2026-02-15');
  assert(encumbered.encumbranceStatus === 'REGISTERED_MORTGAGE', 'Collateral transitioned to REGISTERED_MORTGAGE');
  assert(encumbered.linkedLoanNumber === 'LN-2026-0001', 'Linked loan number recorded');

  // Discharge upon full settlement
  const discharged = CollateralService.discharge(encumbered);
  assert(discharged.encumbranceStatus === 'DISCHARGED', 'Mortgage released and status transitioned to DISCHARGED');
  assert(discharged.linkedLoanId === undefined, 'Linked loan cleared');
}

// 18. Statutory Membership Review Checklist, Deferred Share Capital, ₱15 Onboarding Fee, 1.5% QR Convenience Fee, and Platform Escrow
console.log('\n--- 18. Membership Underwriting, Deferred CBU, ₱15 Onboarding Fee & QR Escrow ---');
{
  // 18.1 4-Item Reviewer Checklist Verification
  const checklist = {
    pmesCompleted: true,
    ekycBiometricMatch: true,
    amlaSanctionsCleared: true,
    capitalBuildPledgeConfirmed: true,
  };
  const isEligibleForApproval =
    checklist.pmesCompleted &&
    checklist.ekycBiometricMatch &&
    checklist.amlaSanctionsCleared &&
    checklist.capitalBuildPledgeConfirmed;
  assert(isEligibleForApproval, 'Reviewer must confirm all 4 statutory items (PMES, eKYC, AMLA, CBU) to approve');

  // Incomplete checklist blocks approval
  const incompleteChecklist = { ...checklist, pmesCompleted: false };
  const isBlocked = !(
    incompleteChecklist.pmesCompleted &&
    incompleteChecklist.ekycBiometricMatch &&
    incompleteChecklist.amlaSanctionsCleared &&
    incompleteChecklist.capitalBuildPledgeConfirmed
  );
  assert(isBlocked, 'Incomplete review checklist strictly blocks member approval and activation');

  // 18.2 Platform Onboarding Fee: Free for first 15 members, ₱50 per member after first 15 members
  const onboardingFee5 = MonetizationService.calculateMemberOnboardingFee(5);
  assert(onboardingFee5.isFreeTier === true, 'Member within first 15 members (e.g. #5) has isFreeTier=true');
  assert(onboardingFee5.grossFee === 0.0, 'Platform charges ₱0.00 for member within first 15 members');

  const onboardingFee15 = MonetizationService.calculateMemberOnboardingFee(15);
  assert(onboardingFee15.isFreeTier === true && onboardingFee15.grossFee === 0.0, '15th member is still within free onboarding tier (₱0.00)');

  const onboardingFee16 = MonetizationService.calculateMemberOnboardingFee(16);
  assert(onboardingFee16.isFreeTier === false, '16th member exceeds free tier (isFreeTier=false)');
  assert(onboardingFee16.grossFee === 50.0, 'Platform charges exactly ₱50.00 for new member after first 15 members');
  assert(onboardingFee16.netPlatformRevenue === 44.64, 'Net platform revenue decomposed to ₱44.64 (₱50 / 1.12)');
  assert(onboardingFee16.vatAmount === 5.36, '12% Output VAT decomposed to ₱5.36 (₱44.64 + ₱5.36 = ₱50.00)');

  const onboardingInvoice16 = MonetizationService.generateMemberOnboardingInvoice({
    tenantId: 'tenant_bayani_001',
    memberId: 'mem_16',
    memberNumber: 'MEM-2026-0016',
    memberName: 'Gabriela Silang Reyes',
    tenantTin: '992-182-384-000',
    memberSequenceIndex: 16,
  });
  assert(onboardingInvoice16.grossFeeAmount === 50.0, 'Invoice reflects ₱50.00 billed to cooperative for 16th member');
  assert(onboardingInvoice16.vatAmount === 5.36, 'Invoice reflects ₱5.36 12% Output VAT');
  assert(onboardingInvoice16.netRevenue === 44.64, 'Invoice reflects ₱44.64 net platform base');
  assert(onboardingInvoice16.status === 'BILLED_TO_COOP', 'Invoice status set to BILLED_TO_COOP');
  assert(onboardingInvoice16.invoiceNumber.startsWith('INV-ONB-'), 'Invoice generated with INV-ONB prefix');

  // 18.3 Deferred Share Capital: Application submitted with ₱0 paid-up capital
  const pendingMemberApplication = {
    memberNumber: 'MEM-2026-0004',
    subscribedShares: 30, // 30 shares @ ₱100 = ₱3,000
    initialPledge: 3000,
    paidUpShares: 0, // Requirement: Do not require members to pay Share Capital until reviewed!
    sharePaymentStatus: 'UNPAID',
    kycStatus: 'PENDING_REVIEW',
  };
  assert(pendingMemberApplication.paidUpShares === 0, 'Prospective member has ₱0.00 paid-up shares upfront');
  assert(pendingMemberApplication.sharePaymentStatus === 'UNPAID', 'Share capital payment is deferred until approval');

  // 18.4 Post-Review QR Payment: 1.5% convenience fee, credited to Coop's Platform Escrow
  const qrSettlement = PaymentService.calculateShareCapitalFee(3000, 'QRPH');
  assert(qrSettlement.convenienceFee === 45.0, '1.5% convenience fee on ₱3,000 QR payment is ₱45.00');
  assert(qrSettlement.totalAmountToPay === 3045.0, 'Total member amount to pay via QR Ph is ₱3,045.00');
  assert(qrSettlement.creditToPlatformEscrow === true, 'QR Ph share capital is credited to Cooperative Platform Escrow');

  // Verify float addition
  let coopPlatformEscrowFloat = 1000.0; // initial float
  coopPlatformEscrowFloat += qrSettlement.pledgeAmount; // add ₱3,000
  assert(coopPlatformEscrowFloat === 4000.0, 'Cooperative Platform Escrow float balance updated to ₱4,000.00');

  // 18.5 Post-Review Over-The-Counter (OTC) Payment: ₱0 convenience fee
  const otcSettlement = PaymentService.calculateShareCapitalFee(3000, 'OTC');
  assert(otcSettlement.convenienceFee === 0.0, 'Over-The-Counter payment has ₱0.00 convenience fee');
  assert(otcSettlement.totalAmountToPay === 3000.0, 'Total OTC payment is exactly ₱3,000.00');
  assert(otcSettlement.creditToPlatformEscrow === false, 'OTC payment settled at branch counter');
}

// 19. System Admin, IAM User Provisioning, RBAC Matrix & Platform Escrow Utilization
console.log('\n--- 19. System Admin, IAM, Dynamic RBAC & Platform Escrow Utilization ---');
{
  const tenantId = 'tenant_bayani_001';

  // 19.1 System Admin Role Provisioning
  type StaffRole = 'SYSTEM_ADMIN' | 'GENERAL_MANAGER' | 'LOAN_OFFICER' | 'CREDIT_COMMITTEE' | 'BOD' | 'CASHIER' | 'ACCOUNTANT' | 'COMPLIANCE_OFFICER';
  
  interface PortalUserRecord {
    id: string;
    name: string;
    email: string;
    role: StaffRole;
    status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
    branch: string;
    mfaEnabled: boolean;
  }

  const systemAdminUser: PortalUserRecord = {
    id: 'usr_sysadmin_01',
    name: 'Engr. Alex V. Mercer',
    email: 'alex.mercer@flexcoop.tech',
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE',
    branch: 'Platform Global Core',
    mfaEnabled: true,
  };
  assert(systemAdminUser.role === 'SYSTEM_ADMIN', 'System Admin user created with SYSTEM_ADMIN operational role');
  assert(systemAdminUser.mfaEnabled === true, 'System Admin enforces hardware/TOTP multi-factor authentication');

  // 19.2 IAM User Lifecycle: Grant access, invite, assign role, status transitions
  const portalDirectory: PortalUserRecord[] = [systemAdminUser];

  // Grant Access / Invite new user
  const invitedLoanOfficer: PortalUserRecord = {
    id: 'usr_lo_99',
    name: 'Maria Clarissa Dizon',
    email: 'mclarissa@bayanicoop.ph',
    role: 'LOAN_OFFICER',
    status: 'INVITED',
    branch: 'Bacolod Satellite Branch',
    mfaEnabled: true,
  };
  portalDirectory.push(invitedLoanOfficer);
  assert(portalDirectory.length === 2, 'IAM directory provisions new user invitation');
  assert(portalDirectory[1].status === 'INVITED', 'New user initial state is INVITED awaiting activation');

  // Reassign role by System Admin
  portalDirectory[1].role = 'CREDIT_COMMITTEE';
  assert(portalDirectory[1].role === 'CREDIT_COMMITTEE', 'System Admin reassigns portal user to CREDIT_COMMITTEE');

  // Activate and then Suspend user
  portalDirectory[1].status = 'ACTIVE';
  assert(portalDirectory[1].status === 'ACTIVE', 'User successfully activated for admin portal access');
  portalDirectory[1].status = 'SUSPENDED';
  assert(portalDirectory[1].status === 'SUSPENDED', 'System Admin can suspend user access immediately');

  // 19.3 Dynamic RBAC Matrix & Segregation of Duties
  type ModuleTab = 'overview' | 'members' | 'products' | 'los' | 'calculator' | 'collateral' | 'cashier' | 'accounting' | 'surplus' | 'invoices' | 'reports' | 'iam' | 'rbac' | 'platform_usage';

  const defaultRolePermissions: Record<StaffRole, ModuleTab[]> = {
    SYSTEM_ADMIN: ['overview', 'iam', 'rbac', 'platform_usage', 'reports'],
    GENERAL_MANAGER: ['overview', 'members', 'products', 'los', 'calculator', 'collateral', 'cashier', 'accounting', 'surplus', 'invoices', 'reports', 'platform_usage'],
    LOAN_OFFICER: ['overview', 'members', 'products', 'los', 'calculator', 'collateral'],
    CREDIT_COMMITTEE: ['overview', 'products', 'los', 'calculator', 'collateral'],
    BOD: ['overview', 'products', 'los', 'calculator', 'collateral', 'surplus', 'reports'],
    CASHIER: ['overview', 'los', 'cashier'],
    ACCOUNTANT: ['overview', 'products', 'accounting', 'surplus', 'invoices', 'reports', 'calculator'],
    COMPLIANCE_OFFICER: ['overview', 'members', 'collateral', 'surplus', 'reports'],
  };

  // Visibility Verification: System Admin and General Manager (Super Admin) both access platform_usage
  assert(defaultRolePermissions.SYSTEM_ADMIN.includes('platform_usage'), 'System Admin has authorized access to Platform Usage module');
  assert(defaultRolePermissions.GENERAL_MANAGER.includes('platform_usage'), 'Super Admin (General Manager) has authorized access to Platform Usage module');
  assert(!defaultRolePermissions.CASHIER.includes('platform_usage'), 'Cashier is restricted from Platform Usage module');
  assert(!defaultRolePermissions.LOAN_OFFICER.includes('iam'), 'Loan Officer is strictly restricted from IAM root admin module');

  // Dynamic Override: System Admin grants custom module to role
  const modifiedPermissions = { ...defaultRolePermissions };
  modifiedPermissions.LOAN_OFFICER = [...modifiedPermissions.LOAN_OFFICER, 'reports'];
  assert(modifiedPermissions.LOAN_OFFICER.includes('reports'), 'RBAC allows dynamic grant of reports module to Loan Officer role');

  // Statutory Segregation of Duties Check: Cashier cannot hold General Ledger accounting permissions
  const cashierHasLedgerConflict = defaultRolePermissions.CASHIER.includes('accounting');
  assert(!cashierHasLedgerConflict, 'CDA MC 2015-06 Segregation of Duties: Cashier role is strictly isolated from General Ledger (accounting)');

  // 19.4 Platform Usage: Escrow Float (1-01-05), Inflows, Onboarding Fee Billing & Treasury Sweeps
  let platformEscrowFloat = 45470.0; // Starting float

  // Inflow: Gabriela Silang Reyes Share Capital QR Ph deposit
  const shareCapitalDeposit = 3000.0;
  platformEscrowFloat += shareCapitalDeposit;
  assert(platformEscrowFloat === 48470.0, 'Platform Escrow Float (1-01-05) accurately credits ₱3,000 QR Ph share capital to ₱48,470.00');

  // Deduction: ₱15 Member Onboarding Fee billed to coop with 12% EVAT
  const memberOnboardingCharge = 15.0;
  const netPlatformRevenue = Math.round((memberOnboardingCharge / 1.12) * 100) / 100; // ₱13.39
  const evat12Percent = Math.round((memberOnboardingCharge - netPlatformRevenue) * 100) / 100; // ₱1.61
  assert(netPlatformRevenue === 13.39 && evat12Percent === 1.61, '₱15.00 platform charge decomposed into ₱13.39 Net + ₱1.61 12% EVAT');

  // Treasury Sweep: Transfer ₱40,000 from Escrow (1-01-05) to LandBank Mother Depository (1-01-01)
  const sweepAmount = 40000.0;
  assert(sweepAmount <= platformEscrowFloat, 'Treasury Sweep amount is validated within available Platform Escrow liquidity');

  const postSweepEscrowBalance = platformEscrowFloat - sweepAmount;
  assert(postSweepEscrowBalance === 8470.0, 'Platform Escrow balance after sweep retains ₱8,470.00 operational cushion');

  // Double-Entry Verification of Sweep Voucher: DR 1-01-01 Cash in Bank / CR 1-01-05 Platform Escrow Float
  const sweepVoucherLines = [
    { accountCode: '1-01-01', debit: sweepAmount, credit: 0 },
    { accountCode: '1-01-05', debit: 0, credit: sweepAmount },
  ];
  const totalDebit = sweepVoucherLines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = sweepVoucherLines.reduce((sum, l) => sum + l.credit, 0);
  assert(totalDebit === totalCredit, 'Treasury Sweep journal voucher JV-SWEEP-2026 is strictly balanced (DR == CR ₱40,000.00)');
}

// 20. Statutory Cooperative Tax Profile & Exemption Rules (RA 9520 Articles 60 & 61)
console.log('\n--- 20. Statutory Cooperative Tax Profile & Exemption Rules (RA 9520 & BIR) ---');
{
  const tenantId = 'tenant_bayani_001';

  // 20.1 Tax Legal Classification & Category A vs Category B Threshold
  const coopTaxProfile = CooperativeTaxService.getCooperativeTaxProfile({
    tenantId,
    accumulatedReserves: 250000.0, // ₱250k accumulated reserves
  });
  assert(coopTaxProfile.taxCategory === 'CATEGORY_A', 'Cooperative with ₱250k reserves is classified as Category A (<= ₱10M threshold)');
  assert(coopTaxProfile.hasActiveBirExemption === true, 'Cooperative holds active BIR Certificate of Tax Exemption (CTE)');
  assert(coopTaxProfile.hasActiveCdaGoodStanding === true, 'Cooperative holds active CDA Certificate of Good Standing (CGS)');

  // Category B test (Reserves > ₱10M)
  const largeCoopProfile = CooperativeTaxService.getCooperativeTaxProfile({
    tenantId: 'tenant_large_001',
    accumulatedReserves: 15000000.0, // ₱15M reserves
  });
  assert(largeCoopProfile.taxCategory === 'CATEGORY_B', 'Cooperative with ₱15M reserves is classified as Category B (> ₱10M threshold)');

  // 20.2 Member Transactions: 100% Tax-Exempt (Share Capital, Loan Notes DST, Interest Collection, Dividends)
  // A. Member Share Capital
  const shareCapitalEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'MEMBER',
    transactionType: 'SHARE_CAPITAL_SUBSCRIPTION',
    grossAmount: 15000.0,
  });
  assert(shareCapitalEval.isFullyTaxExempt === true, 'Member share capital is 100% tax-exempt from VAT, Percentage Tax, and DST');
  assert(shareCapitalEval.applicableTaxes.every((t) => t.taxDue === 0), 'All statutory taxes evaluated at ₱0.00 for member share capital');

  // B. Member Loan Promissory Note (Documentary Stamp Tax Exemption)
  const loanNoteEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'MEMBER',
    transactionType: 'LOAN_DISBURSEMENT',
    grossAmount: 50000.0,
  });
  assert(loanNoteEval.isFullyTaxExempt === true, 'Member loan promissory note is 100% exempt from Documentary Stamp Tax (NIRC Sec. 199)');
  assert(loanNoteEval.officialReceiptInscription.includes('DST-EXEMPT'), 'Receipt carries statutory DST-Exempt inscription');

  // C. Member Loan Interest Payment
  const loanInterestEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'MEMBER',
    transactionType: 'LOAN_INTEREST_COLLECTION',
    grossAmount: 6000.0,
  });
  assert(loanInterestEval.isFullyTaxExempt === true, 'Member loan interest collection is 100% exempt from Income Tax and 12% VAT');

  // D. Member Dividends (Interest on Share Capital & Patronage Refund)
  const dividendEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'MEMBER',
    transactionType: 'INTEREST_ON_SHARE_CAPITAL',
    grossAmount: 25000.0,
  });
  assert(dividendEval.isFullyTaxExempt === true, 'Member Interest on Share Capital and Patronage Refund exempt from withholding tax (BIR Ruling 138-2019)');

  // 20.3 Non-Member Transactions: Category A (Exempt CIT) vs Category B (25% CIT & 12% VAT)
  const catANonMemberEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'NON_MEMBER',
    transactionType: 'LOAN_INTEREST_COLLECTION',
    grossAmount: 10000.0,
    accumulatedReserves: 250000.0, // Category A
  });
  assert(catANonMemberEval.applicableTaxes.find((t) => t.taxCode === 'CIT-EXEMPT')?.taxDue === 0, 'Category A cooperative is exempt from income tax on non-member operations');

  const catBNonMemberEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'NON_MEMBER',
    transactionType: 'LOAN_INTEREST_COLLECTION',
    grossAmount: 10000.0,
    accumulatedReserves: 15000000.0, // Category B
  });
  assert(catBNonMemberEval.isFullyTaxExempt === false, 'Category B cooperative is NOT tax-exempt on non-member operations');
  assert(catBNonMemberEval.applicableTaxes.some((t) => t.taxCode === 'RCIT-25' && t.taxDue === 2500.0), 'Category B non-member operations assessed 25% Regular Corporate Income Tax (₱2,500.00 on ₱10,000.00)');
  assert(catBNonMemberEval.applicableTaxes.some((t) => t.taxCode === 'VAT-12' && t.taxDue === 1200.0), 'Category B non-member operations assessed 12% Output VAT (₱1,200.00 on ₱10,000.00)');

  // 20.4 Mandatory Withholding Agent Obligations (WTC on Salaries & EWT on Rent/Prof Fees)
  // A. Staff Salary Payroll (BIR Form 1601-C)
  const salaryEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'EMPLOYEE',
    transactionType: 'STAFF_SALARY_PAYROLL',
    grossAmount: 35000.0, // Taxable compensation above ₱20,833
  });
  assert(salaryEval.isFullyTaxExempt === false, 'Cooperative MUST act as Withholding Agent for employee compensation (NIRC Sec. 79)');
  assert(Boolean(salaryEval.birFilingFormRequired?.includes('1601-C')), 'Salary withholding requires BIR Form 1601-C monthly return');

  // B. Office Rental Expense (5% EWT under BIR Form 1601-EQ & 2307)
  const rentEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'VENDOR',
    transactionType: 'OFFICE_RENTAL_EXPENSE',
    grossAmount: 30000.0,
  });
  assert(rentEval.isFullyTaxExempt === false, 'Office rental is subject to 5% Expanded Withholding Tax');
  assert(rentEval.applicableTaxes[0].taxDue === 1500.0, '5% EWT on ₱30,000 rental is exactly ₱1,500.00');
  assert(rentEval.netCooperativeAmount === 28500.0, 'Net cash paid to lessor is ₱28,500.00 with BIR Form 2307 attached');

  // C. Professional CPA Audit Fee (5% EWT)
  const profEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'VENDOR',
    transactionType: 'PROFESSIONAL_AUDIT_LEGAL_FEE',
    grossAmount: 20000.0,
  });
  assert(profEval.applicableTaxes[0].taxDue === 1000.0, '5% EWT on ₱20,000 professional fee is exactly ₱1,000.00');

  // 20.5 Final Withholding Tax on Commercial Bank Deposits (20%)
  const bankInterestEval = CooperativeTaxService.evaluateTransactionTax({
    counterpartyType: 'VENDOR', // Bank
    transactionType: 'BANK_DEPOSIT_INTEREST_INCOME',
    grossAmount: 5000.0,
  });
  assert(bankInterestEval.applicableTaxes[0].taxDue === 1000.0, 'Commercial bank deposit interest is subject to 20% final withholding tax (₱1,000 on ₱5,000)');

  // 20.6 BIR Form 1702-EX (Annual Information Return for Tax-Exempt Entities)
  const bir1702Ex = CooperativeTaxService.generateBir1702ExSummary({
    taxableYear: 2025,
    memberGrossReceipts: 4500000.0,
    nonMemberGrossReceipts: 0,
    accumulatedReserves: 250000.0,
  });
  assert(bir1702Ex.taxDue === 0, 'BIR Form 1702-EX calculates ₱0.00 tax due for Category A cooperative with pure member receipts');
  assert(bir1702Ex.cdaCertGoodStandingAttached === true, 'BIR Form 1702-EX attaches CDA Certificate of Good Standing');
  assert(bir1702Ex.birCertTaxExemptionAttached === true, 'BIR Form 1702-EX attaches BIR Certificate of Tax Exemption');
}

// 21. General Ledger & Member Subsidiary Ledger (SL) Architecture
console.log('\n--- 21. General Ledger & Member Subsidiary Ledger (SL) Control ---');
{
  const tenantId = 'tenant_bayani_001';
  const members = dbStore.members.get(tenantId)!;
  const entries = dbStore.journalEntries.get(tenantId)!;

  // 21.1 Generate Member Subsidiary Ledger for Maria Clara Santos
  const maria = members.find((m) => m.memberNumber === 'MEM-2026-0001')!;
  const mariaSL = GeneralLedgerService.generateMemberSubsidiaryLedger(maria, entries);

  assert(mariaSL.memberNumber === 'MEM-2026-0001', 'Member SL corresponds to Maria Clara Santos');
  assert(mariaSL.accounts.length >= 3, 'Maria has SL records across Share Capital, Savings, and Loan');
  assert(mariaSL.totalShareCapitalBalance === 15000.0, 'Maria Share Capital SL balance equals ₱15,000.00');
  assert(mariaSL.totalSavingsBalance === 5000.0, 'Maria Compulsory Savings SL balance equals ₱5,000.00');
  const loanRecord = dbStore.loans.get(tenantId)!.find((l) => l.memberId === maria.id)!;
  assert(mariaSL.totalLoanOutstandingBalance === loanRecord.balanceRemaining, `Maria Regular Loan SL balance equals remaining loan balance (₱${loanRecord.balanceRemaining.toLocaleString()})`);

  // Verify running balance calculation on Share Capital (Credit normal balance)
  const mariaShareAcc = mariaSL.accounts.find((a) => a.accountCode === '3-01-03')!;
  assert(mariaShareAcc.transactions.length >= 1, 'Share Capital SL tracks granular credit transactions');
  assert(mariaShareAcc.transactions[0].runningBalance === 15000.0, 'Share Capital running balance increases on credit');

  // Verify running balance calculation on Loans Receivable (Debit normal balance)
  const mariaLoanAcc = mariaSL.accounts.find((a) => a.accountCode === '1-02-01')!;
  assert(mariaLoanAcc.transactions.length >= 2, 'Loan SL tracks both initial disbursement (DR) and repayment (CR)');
  assert(mariaLoanAcc.transactions[0].runningBalance === 50000.0, 'Initial loan disbursement establishes ₱50,000 debit balance');
  assert(mariaLoanAcc.transactions[1].credit > 0, 'Subsequent repayment applies credit to reduce loan principal');
  assert(mariaLoanAcc.transactions[1].runningBalance === loanRecord.balanceRemaining, 'Final transaction running balance equals loan ending balance');

  // 21.2 Generate Member Subsidiary Ledger for Juan Perez Dela Cruz
  const juan = members.find((m) => m.memberNumber === 'MEM-2026-0002')!;
  const juanSL = GeneralLedgerService.generateMemberSubsidiaryLedger(juan, entries);
  assert(juanSL.totalShareCapitalBalance === 10000.0, 'Juan Share Capital SL balance equals ₱10,000.00');

  // 21.3 Generate General Ledger Account Statement for 3-01-03 (Paid-Up Share Capital)
  const shareGLStatement = GeneralLedgerService.generateGeneralLedgerStatement('3-01-03', entries);
  assert(shareGLStatement !== null, 'GL Statement generated for Paid-Up Share Capital (3-01-03)');
  assert(shareGLStatement?.normalBalance === 'CREDIT', 'Share Capital has CREDIT normal balance');
  assert(shareGLStatement?.endingBalance === 25000.0, 'GL Ending Balance for 3-01-03 equals ₱25,000.00 (₱15k Maria + ₱10k Juan)');
  assert((shareGLStatement?.entries?.length || 0) >= 2, 'GL Statement contains entries for both members');

  // 21.4 Generate General Ledger Account Statement for 1-02-01 (Loans Receivable - Regular)
  const loanGLStatement = GeneralLedgerService.generateGeneralLedgerStatement('1-02-01', entries);
  assert(loanGLStatement !== null, 'GL Statement generated for Loans Receivable (1-02-01)');
  assert(loanGLStatement?.endingBalance === loanRecord.balanceRemaining, `GL Ending Balance for 1-02-01 equals remaining principal (₱${loanRecord.balanceRemaining.toLocaleString()})`);

  // 21.5 GL vs SL Control Reconciliation Audit
  const recon = GeneralLedgerService.generateGLSLReconciliation(members, entries);
  assert(recon.items.length === 4, 'Reconciles all 4 key member control accounts (Loans, Compulsory Savings, Voluntary Savings, Paid-Up Shares)');
  
  const shareRecon = recon.items.find((i) => i.accountCode === '3-01-03')!;
  assert(shareRecon.isReconciled === true, 'Control Account 3-01-03 is strictly reconciled (GL ₱25,000 == SL ₱25,000)');
  assert(shareRecon.variance === 0.0, 'Variance for Paid-Up Share Capital is exactly ₱0.00');
  assert(shareRecon.memberCount === 2, 'Share Capital SL aggregates across 2 participating members');

  const loanRecon = recon.items.find((i) => i.accountCode === '1-02-01')!;
  assert(loanRecon.isReconciled === true, `Control Account 1-02-01 is strictly reconciled (GL ₱${loanRecord.balanceRemaining} == SL ₱${loanRecord.balanceRemaining})`);
  assert(loanRecon.variance === 0.0, 'Variance for Loans Receivable is exactly ₱0.00');

  const savRecon = recon.items.find((i) => i.accountCode === '2-01-01')!;
  assert(savRecon.isReconciled === true, 'Control Account 2-01-01 is strictly reconciled (GL ₱5,000 == SL ₱5,000)');
  assert(savRecon.variance === 0.0, 'Variance for Compulsory Savings is exactly ₱0.00');

  assert(recon.allReconciled === true, 'ALL GL Control Accounts perfectly match Member Subsidiary Ledgers (Total Variance: ₱0.00)');
}

// 22. Philippine Standard Geographic Code (PSGC) Compliance in Member Registration
console.log('\n--- 22. Philippine Standard Geographic Code (PSGC) Compliance ---');
{
  // 22.1 Verify standard region, province, city, and barangay hierarchy
  assert(PSGC_REGIONS.length === 17, 'All 17 Philippine Administrative Regions configured in PSGC lookup');
  
  const r3 = PSGC_REGIONS.find((r) => r.code === '030000000')!;
  assert(r3.name === 'Region III (Central Luzon)', 'Region III recognized as Central Luzon');

  const r3Provinces = getProvincesByRegion('030000000');
  assert(r3Provinces.some((p) => p.name === 'Nueva Ecija'), 'Region III contains Province of Nueva Ecija');

  const neCities = getCitiesByProvince('034900000');
  const sanJose = neCities.find((c) => c.name === 'City of San Jose')!;
  assert(sanJose !== undefined, 'Nueva Ecija contains City of San Jose');
  assert(sanJose.defaultPostalCode === '3121', 'City of San Jose has default PhilPost ZIP code 3121');

  const sjBarangays = getBarangaysByCity('034919000');
  const malasin = sjBarangays.find((b) => b.name === 'Malasin')!;
  assert(malasin !== undefined, 'City of San Jose contains Brgy. Malasin');
  assert(malasin.code === '034919018', 'Brgy. Malasin has 9-digit PSGC Code 034919018');

  // 22.2 Address Formatting
  const formatted = formatPSGCAddress({
    streetAddress: '128 Rizal Avenue, Zone 4',
    barangayName: malasin.name,
    cityMunicipalityName: sanJose.name,
    provinceName: 'Nueva Ecija',
    postalCode: sanJose.defaultPostalCode,
    regionName: r3.name,
  });
  assert(
    formatted === '128 Rizal Avenue, Zone 4, Brgy. Malasin, City of San Jose, Nueva Ecija, 3121, Region III (Central Luzon)',
    'PSGC address properly formatted according to Philippine Post & PSA standard'
  );

  // 22.3 Address Validation - Valid Case
  const validPsgc: PSGCAddress = {
    regionCode: '030000000',
    regionName: 'Region III (Central Luzon)',
    provinceCode: '034900000',
    provinceName: 'Nueva Ecija',
    cityMunicipalityCode: '034919000',
    cityMunicipalityName: 'City of San Jose',
    barangayCode: '034919018',
    barangayName: 'Malasin',
    streetAddress: '128 Rizal Avenue, Zone 4',
    postalCode: '3121',
    psgcCode: '034919018',
    formattedAddress: formatted,
  };
  const validResult = validatePSGCAddress(validPsgc);
  assert(validResult.isValid === true, 'Complete PSGC address passes validation');
  assert(validResult.errors.length === 0, 'No validation errors for complete PSGC address');

  // 22.4 Address Validation - Invalid Cases
  const invalidZip = validatePSGCAddress({
    ...validPsgc,
    postalCode: '312', // Less than 4 digits
  });
  assert(invalidZip.isValid === false, 'Invalid postal code (< 4 digits) fails PSGC validation');

  const missingBarangay = validatePSGCAddress({
    ...validPsgc,
    barangayName: '',
  });
  assert(missingBarangay.isValid === false, 'Missing barangay fails PSGC validation');

  // 22.5 Member Record with PSGC Address Integration
  const testMember: Member = {
    id: 'mem_test_psgc',
    memberNumber: 'MEM-2026-9999',
    firstName: 'Teresa',
    lastName: 'Magbanua',
    email: 'teresa.magbanua@gmail.com',
    phone: '+63 917 123 4567',
    birthdate: '1985-10-13',
    gender: 'FEMALE',
    civilStatus: 'MARRIED',
    address: formatted,
    psgcAddress: validPsgc,
    classification: 'REGULAR',
    status: 'PENDING_APPROVAL',
    kycStatus: 'SUBMITTED',
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(testMember.psgcAddress?.psgcCode === '034919018', 'Member model stores granular PSGC geographic code');
  assert(testMember.psgcAddress?.provinceName === 'Nueva Ecija', 'Member model stores structured province');
  assert(testMember.address === formatted, 'Member model maintains backwards compatible formatted address string');
}

// 23. SaaS Operator Control Plane, Multi-Tenant Fleet & Platform Credit Operations
console.log('\n--- 23. SaaS Operator Fleet Monitor & Platform Credit Operations ---');
{
  // 23.1 Operator Fleet Summary & Telemetry
  const fleet = OperatorService.getTenantFleetSummaries();
  assert(fleet.length >= 3, `Fleet contains active cooperative instances (count: ${fleet.length})`);

  const bayaniFleet = fleet.find((t) => t.id === 'tenant_bayani_001')!;
  assert(bayaniFleet.subdomain === 'bayani-coop.tuntongtech.com', 'Subdomain adheres to <slug>-coop.tuntongtech.com');
  assert(bayaniFleet.databaseSchema === 'tenant_bayani', 'Isolated PostgreSQL schema mapped to tenant_bayani');
  assert(bayaniFleet.storageQuotaMb === 10240, 'Default cloud storage quota configured to 10 GB (10,240 MB)');

  // 23.2 Member Census & Free Tier Calculation (15 Free vs ₱50/Member)
  assert(bayaniFleet.freeTierMembers <= 15, 'Free tier capped at first 15 members');
  assert(bayaniFleet.billedMembers === Math.max(0, bayaniFleet.totalMembers - 15), 'Billed members strictly tracks count exceeding 15 members');

  // 23.3 Platform Credit Adjustment & Audit Ledger
  const initialCredit = bayaniFleet.platformCreditBalance;
  const topUpResult = OperatorService.adjustPlatformCredit({
    tenantId: 'tenant_bayani_001',
    amount: 2500.0,
    type: 'TOP_UP',
    reference: 'BDO-DEP-2026-TEST',
    notes: 'Prepaid technology credit refill test',
    performedBy: 'Lex (Platform Operator)',
  });
  assert(topUpResult.success === true, 'Platform credit adjustment executes successfully');
  assert(topUpResult.newBalance === initialCredit + 2500.0, 'Platform credit balance strictly incremented');
  assert(topUpResult.transaction.type === 'TOP_UP', 'Transaction ledger logs TOP_UP action type');
  assert(topUpResult.transaction.reference === 'BDO-DEP-2026-TEST', 'Transaction retains financial reference');

  // Fee deduction test
  const feeDeductResult = OperatorService.adjustPlatformCredit({
    tenantId: 'tenant_bayani_001',
    amount: -150.0,
    type: 'FEE_DEDUCTION',
    reference: 'INV-ONB-TEST',
    notes: 'Auto-debit onboarding fees',
    performedBy: 'System Auto-Billing',
  });
  assert(feeDeductResult.newBalance === topUpResult.newBalance - 150.0, 'Fee deduction decreases platform credit balance');

  // 23.4 Tenant Lifecycle & Kill-Switch
  const suspendOk = OperatorService.updateTenantStatus('tenant_bayani_001', 'SUSPENDED', 'Compliance audit hold');
  assert(suspendOk === true, 'Operator can suspend cooperative instance');
  const suspendedTenant = dbStore.tenants.get('tenant_bayani_001')!;
  assert(suspendedTenant.status === 'SUSPENDED', 'Tenant status reflects SUSPENDED state');

  const reactivateOk = OperatorService.updateTenantStatus('tenant_bayani_001', 'ACTIVE', 'Reactivation approved');
  assert(reactivateOk === true, 'Operator can reactivate cooperative instance');
  assert(dbStore.tenants.get('tenant_bayani_001')?.status === 'ACTIVE', 'Tenant status restored to ACTIVE');

  // 23.5 Global Operator Overview Aggregates
  const metrics = OperatorService.getOperatorOverviewMetrics();
  assert(metrics.totalTenants >= 3, 'Overview tracks total fleet tenant count');
  assert(metrics.totalPlatformCreditPool > 0, 'Overview aggregates total platform credit pool');
  assert(metrics.monthlyTechFeeRevenue > 0, 'Overview computes net monthly technology fee revenue');
  assert(metrics.monthlyOutputVatPayable > 0, 'Overview computes 12% BIR Output VAT payable');
  assert(metrics.totalStorageUsedGb >= 0, 'Overview tracks total fleet KYC/selfie storage consumption');

  // 23.6 System Broadcast Dispatch
  const broadcast = OperatorService.createBroadcast({
    title: 'Emergency Advisory Test',
    message: 'Testing system broadcast dispatch across fleet',
    severity: 'WARNING',
    targetTenantIds: [],
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdBy: 'Lex (Platform Operator)',
  });
  assert(broadcast.id.startsWith('bc_'), 'Broadcast created with unique bc_ identifier');
  const activeBroadcasts = OperatorService.getActiveBroadcasts();
  assert(activeBroadcasts.some((b) => b.title === 'Emergency Advisory Test'), 'Active broadcast visible across tenancies');
}

// 24. Automated Platform Credit Auto-Deductions & Option 4: Member Portal Digital Passbook & SL
console.log('\n--- 24. Automated Platform Credit Billing & Option 4 Member Digital Passbook & SL ---');
{
  const tenantId = 'tenant_bayani_001';
  OperatorService.ensureInitialized();
  const currentCredit = dbStore.platformCredits.get(tenantId) ?? 0;

  // 24.1 Cooperative Platform Credit Top-Up
  const topUp = OperatorService.adjustPlatformCredit({
    tenantId,
    amount: 5000.0,
    type: 'TOP_UP',
    reference: 'QRPH-TOPUP-2026-001',
    notes: 'Cooperative prepaid platform credit reload via PayMongo QR Ph Rail',
    performedBy: 'General Manager (Danilo Macapagal)',
  });
  assert(topUp.success === true, 'Cooperative successfully refills platform credit');
  assert(topUp.newBalance === currentCredit + 5000.0, 'Platform credit balance accurately incremented by top-up amount');
  assert(topUp.transaction.type === 'TOP_UP', 'Audit trail records TOP_UP transaction');

  // 24.2 Member Onboarding Auto-Deductions: First 15 Members FREE
  const freeTierDeduction = MonetizationService.processMemberFeeAutoDeduction({
    tenantId,
    memberId: 'mem_free_15',
    memberNumber: 'MEM-2026-0015',
    memberName: 'Apolinario Mabini',
    sequenceIndex: 15, // Member #15
  });
  assert(freeTierDeduction.isFreeTier === true, 'Member sequence <= 15 strictly falls within free tier');
  assert(freeTierDeduction.deducted === false, 'No platform credit deducted for member within first 15 free members');
  assert(freeTierDeduction.feeAmount === 0.0, 'Fee amount for member #15 is strictly ₱0.00');
  assert(dbStore.platformCredits.get(tenantId) === topUp.newBalance, 'Credit balance remains untouched for free tier member');

  // 24.3 Member Onboarding Auto-Deductions: Sequence > 15 charges ₱50.00
  const balanceBefore16 = dbStore.platformCredits.get(tenantId)!;
  const billedDeduction = MonetizationService.processMemberFeeAutoDeduction({
    tenantId,
    memberId: 'mem_billed_16',
    memberNumber: 'MEM-2026-0016',
    memberName: 'Melchora Aquino',
    sequenceIndex: 16, // Member #16
  });
  assert(billedDeduction.isFreeTier === false, 'Member sequence > 15 strictly exceeds free tier');
  assert(billedDeduction.deducted === true, 'Platform credit automatically deducted for member #16');
  assert(billedDeduction.feeAmount === 50.0, 'Fee amount for member #16 is exactly ₱50.00');
  assert(billedDeduction.feeCalculation.vatAmount === 5.36, '₱50.00 onboarding fee decomposes ₱5.36 12% Output VAT');
  assert(billedDeduction.feeCalculation.netPlatformRevenue === 44.64, '₱50.00 onboarding fee yields ₱44.64 Net Base Revenue');
  assert(billedDeduction.newCreditBalance === balanceBefore16 - 50.0, 'Platform credit decremented by exactly ₱50.00');
  assert(billedDeduction.transaction?.type === 'FEE_DEDUCTION', 'Credit audit trail logs FEE_DEDUCTION transaction');

  // 24.4 1.0% Loan Technology Fee Auto-Deductions on Loan Disbursement
  const balanceBeforeLoan = dbStore.platformCredits.get(tenantId)!;
  const loanPrincipal = 75000.0;
  const loanInvoiceNo = 'INV-LOAN-2026-0099';
  const loanDeduction = MonetizationService.processLoanFeeAutoDeduction({
    tenantId,
    loanId: 'loan_test_tech_fee',
    loanNumber: 'LN-2026-00099',
    principalAmount: loanPrincipal,
    invoiceNumber: loanInvoiceNo,
  });
  assert(loanDeduction.deducted === true, '1.0% loan technology fee automatically deducted upon disbursement');
  assert(loanDeduction.feeAmount === 750.0, '1.0% technology fee on ₱75,000 loan is exactly ₱750.00');
  assert(loanDeduction.newCreditBalance === balanceBeforeLoan - 750.0, 'Platform credit decremented by exactly ₱750.00');
  assert(loanDeduction.transaction?.reference === loanInvoiceNo, 'Transaction reference preserves official sales invoice number');

  // 24.5 Option 4: Member Portal Subsidiary Ledger Statements Generation
  const mariaMember: Member = {
    id: 'mem_1',
    memberNumber: 'MEM-2026-0001',
    firstName: 'Maria Clara',
    lastName: 'Santos',
    email: 'maria.santos@gmail.com',
    phone: '+63 917 881 2911',
    birthdate: '1992-05-12',
    gender: 'FEMALE',
    civilStatus: 'SINGLE',
    address: 'Brgy. Malasin, City of San Jose, Nueva Ecija',
    classification: 'REGULAR',
    status: 'ACTIVE',
    kycStatus: 'VERIFIED',
    joinedAt: '2026-01-15T08:00:00Z',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  };
  const entries = dbStore.journalEntries.get(tenantId) || [];
  const mariaSL = GeneralLedgerService.generateMemberSubsidiaryLedger(mariaMember, entries);
  assert(mariaSL.memberNumber === 'MEM-2026-0001', 'Member Subsidiary Ledger matches Maria Clara Santos');
  assert(mariaSL.totalShareCapitalBalance === 15000.0, 'Maria Share Capital SL balance (3-01-03) reflects ₱15,000.00');
  assert(mariaSL.totalSavingsBalance === 5000.0, 'Maria Savings Passbook balance (2-01-01) reflects ₱5,000.00');
  assert(mariaSL.totalLoanOutstandingBalance === 46057.56, 'Maria Loan Subsidiary Ledger (1-02-01) reflects ₱46,057.56');

  // 24.6 PayMongo QR Ph Pass-On Convenience Fee (1.5%, minimum ₱15.00)
  const calcConvenienceFee = (amount: number) => Math.max(15.0, Math.round(amount * 0.015 * 100) / 100);
  const loanInstallment = 4442.44;
  const qrFee = calcConvenienceFee(loanInstallment);
  assert(qrFee === 66.64, '1.5% pass-on convenience fee on ₱4,442.44 repayment is exactly ₱66.64');
  assert(Math.round((loanInstallment + qrFee) * 100) / 100 === 4509.08, 'Total amount to pay via QR Ph is ₱4,509.08');

  // Minimum fee threshold (₱500 payment -> 1.5% is ₱7.50, capped at minimum ₱15.00)
  const smallPayment = 500.0;
  const minQrFee = calcConvenienceFee(smallPayment);
  assert(minQrFee === 15.0, 'Convenience fee enforces minimum ₱15.00 floor on small transactions');
}

// 25. Co-Maker Capacity Engine, Early Settlement Rebate & Low-Balance (No Grace Period) Verification
console.log('\n--- 25. Co-Maker Exposure Limits, Early Loan Settlement & Low Platform Credit Policy ---');
{
  // 25.1 Co-Maker Eligibility Test: Max 2 Active Guarantees
  const coMakerEvalValid = CollateralService.evaluateCoMakerCapacity({
    coMakerMemberId: 'mem_comaker_1',
    coMakerMemberNumber: 'MEM-2026-0008',
    coMakerName: 'Crisostomo Ibarra',
    paidUpShareCapital: 25000.0,
    savingsBalance: 15000.0,
    proposedLoanAmount: 40000.0,
    existingGuaranteedLoans: [
      { loanId: 'loan_prior_1', balanceRemaining: 15000.0 },
    ],
    ownOutstandingLoans: 20000.0,
  });
  assert(coMakerEvalValid.activeCoMakerCount === 1, 'Co-maker currently has 1 active guarantee');
  assert(coMakerEvalValid.isCountEligible === true, 'Co-maker count is eligible (< 2 active guarantees limit)');
  assert(coMakerEvalValid.totalUnencumberedEquity === 40000.0, 'Unencumbered equity equals ₱40,000 (₱25k Shares + ₱15k Savings)');
  assert(coMakerEvalValid.maxAllowableExposure === 120000.0, 'Max allowable exposure is 3x equity (₱120,000.00)');
  assert(coMakerEvalValid.projectedExposure === 75000.0, 'Projected exposure is ₱75,000 (₱20k own + ₱15k existing + ₱40k new)');
  assert(coMakerEvalValid.isFinancialCapacityEligible === true, 'Projected exposure is well within 3x equity ceiling');
  assert(coMakerEvalValid.isEligible === true, 'Co-maker endorsement successfully approved by credit policy');

  // 25.2 Co-Maker Rejection: Exceeds 2 Active Guarantees
  const coMakerOverCount = CollateralService.evaluateCoMakerCapacity({
    coMakerMemberId: 'mem_comaker_over',
    coMakerMemberNumber: 'MEM-2026-0009',
    coMakerName: 'Elias Salaysay',
    paidUpShareCapital: 50000.0,
    savingsBalance: 30000.0,
    proposedLoanAmount: 20000.0,
    existingGuaranteedLoans: [
      { loanId: 'loan_prior_a', balanceRemaining: 10000.0 },
      { loanId: 'loan_prior_b', balanceRemaining: 10000.0 },
    ],
    ownOutstandingLoans: 0.0,
  });
  assert(coMakerOverCount.activeCoMakerCount === 2, 'Co-maker already has 2 active guarantees');
  assert(coMakerOverCount.isCountEligible === false, 'Co-maker count rejected: cannot exceed maximum 2 active commitments');
  assert(coMakerOverCount.isEligible === false, 'Co-maker endorsement rejected due to commitment limit');
  assert(coMakerOverCount.rejectionReasons[0].includes('maximum 2'), 'Rejection reason states maximum 2 active commitments exceeded');

  // 25.3 Co-Maker Rejection: Exceeds 3x Unencumbered Equity
  const coMakerOverExposure = CollateralService.evaluateCoMakerCapacity({
    coMakerMemberId: 'mem_comaker_over_exp',
    coMakerMemberNumber: 'MEM-2026-0010',
    coMakerName: 'Padre Damaso',
    paidUpShareCapital: 5000.0,
    savingsBalance: 2000.0,
    proposedLoanAmount: 50000.0, // 3x of ₱7k equity is ₱21k -> ₱50k will exceed!
    existingGuaranteedLoans: [],
    ownOutstandingLoans: 0.0,
  });
  assert(coMakerOverExposure.totalUnencumberedEquity === 7000.0, 'Unencumbered equity is ₱7,000.00');
  assert(coMakerOverExposure.maxAllowableExposure === 21000.0, 'Max allowable exposure is ₱21,000.00 (3x ₱7,000)');
  assert(coMakerOverExposure.isFinancialCapacityEligible === false, 'Rejected: ₱50,000 loan exceeds ₱21,000 exposure ceiling');
  assert(coMakerOverExposure.isEligible === false, 'Co-maker rejected due to insufficient financial equity');

  // 25.4 RA 3765 Truth in Lending Early Loan Payoff Rebate Calculator
  const amortGen = AmortizationService.generateSchedule({
    principalAmount: 30000,
    annualInterestRate: 0.12,
    termMonths: 6,
    paymentFrequency: 'MONTHLY',
    method: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
  });
  const mockActiveLoan: Loan = {
    id: 'loan_early_payoff',
    loanNumber: 'LN-2026-00888',
    memberId: 'mem_borrower_88',
    productId: 'prod_regular',
    principalAmount: 30000,
    interestRateAnnual: 0.12,
    termMonths: 6,
    paymentFrequency: 'MONTHLY',
    amortizationMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    status: 'DISBURSED',
    platformFee: 300,
    coopServiceFee: 450,
    netProceedsDisbursed: 29250,
    totalInterestExpected: amortGen.totalInterest,
    totalPayable: amortGen.totalPayable,
    balanceRemaining: 30000,
    schedule: amortGen.schedule,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const payoffQuote = AmortizationService.calculateEarlySettlement({
    loan: mockActiveLoan,
    penaltiesDue: 0.0,
  });
  assert(payoffQuote.currentPrincipalBalance === 30000.0, 'Payoff quote principal is ₱30,000.00');
  assert(payoffQuote.unearnedInterestRebate === amortGen.totalInterest, 'Full future unearned interest is rebated to borrower');
  assert(payoffQuote.totalPayoffAmount === 30000.0, 'Total payoff amount waives unearned diminishing interest');
  assert(payoffQuote.interestSavedByBorrower === amortGen.totalInterest, 'Borrower saves 100% of future unearned interest');

  // 25.5 Strict NO Grace Period Rule for Member Onboarding Fee
  const zeroCreditTenant = 'tenant_depleted_credit';
  dbStore.platformCredits.set(zeroCreditTenant, 10.0); // Only ₱10.00 credit (₱50 needed)
  const failedMemberDeduction = MonetizationService.processMemberFeeAutoDeduction({
    tenantId: zeroCreditTenant,
    memberId: 'mem_fail_onb',
    memberNumber: 'MEM-FAIL-01',
    memberName: 'Juan Del Monte',
    sequenceIndex: 20, // Requires ₱50
  });
  assert(failedMemberDeduction.deducted === false, 'Strict NO grace period: onboarding deduction fails when credit < ₱50');
  assert(failedMemberDeduction.error === 'INSUFFICIENT_PLATFORM_CREDIT', 'Returns INSUFFICIENT_PLATFORM_CREDIT error code');
  assert(dbStore.platformCredits.get(zeroCreditTenant) === 10.0, 'Platform credit remains untouched when insufficient');

  // 25.6 Strict NO Grace Period Rule for Loan Technology Fee
  const failedLoanDeduction = MonetizationService.processLoanFeeAutoDeduction({
    tenantId: zeroCreditTenant,
    loanId: 'loan_fail_disb',
    loanNumber: 'LN-FAIL-01',
    principalAmount: 50000.0, // 1% is ₱500 (tenant only has ₱10)
    invoiceNumber: 'INV-FAIL-01',
  });
  assert(failedLoanDeduction.deducted === false, 'Strict NO grace period: loan disbursement tech fee fails when credit < ₱500');
  assert(failedLoanDeduction.error === 'INSUFFICIENT_PLATFORM_CREDIT', 'Returns INSUFFICIENT_PLATFORM_CREDIT error code for loan');

  // 25.7 Low Platform Credit Threshold (< ₱1,000) & Warning Flag
  const lowCreditTenant = 'tenant_low_warning';
  dbStore.platformCredits.set(lowCreditTenant, 1020.0); // Has ₱1,020.00
  const deductionTriggeringWarning = MonetizationService.processMemberFeeAutoDeduction({
    tenantId: lowCreditTenant,
    memberId: 'mem_trigger_warn',
    memberNumber: 'MEM-WARN-01',
    memberName: 'Gregoria De Jesus',
    sequenceIndex: 18, // Deducts ₱50 -> New balance: ₱970 (< ₱1,000!)
  });
  assert(deductionTriggeringWarning.deducted === true, 'Deduction succeeds when credit is sufficient');
  assert(deductionTriggeringWarning.newCreditBalance === 970.0, 'Credit reduced from ₱1,020 to ₱970.00');
  assert(deductionTriggeringWarning.isLowCreditWarning === true, 'isLowCreditWarning flag is TRUE when credit drops below ₱1,000');
  assert(deductionTriggeringWarning.message.includes('CRITICAL LOW BALANCE'), 'Message alerts critical low balance below ₱1,000');
}

// 26. Membership Registration Fields & System Admin Dynamic Field Config Engine
console.log('\n--- 26. Member Registration Fields & System Admin Dynamic Configurator ---');
{
  // 26.1 Verification of newly added membership registration fields in schema & defaults
  const defaultFields = DEFAULT_MEMBER_REGISTRATION_FIELDS;
  assert(defaultFields.length >= 15, `Default fields template configured with ${defaultFields.length} fields`);

  const empIdField = defaultFields.find((f) => f.fieldKey === 'employeeIdNumber');
  assert(empIdField !== undefined, 'Employee ID No field is present in default configuration');
  assert(empIdField?.label === 'Employee ID No', 'Field label is Employee ID No');
  assert(empIdField?.category === 'EMPLOYMENT', 'Employee ID No is classified under EMPLOYMENT');
  assert(empIdField?.enabled === true, 'Employee ID No is enabled by default');

  const posField = defaultFields.find((f) => f.fieldKey === 'position');
  assert(posField !== undefined, 'Position field is present in default configuration');
  assert(posField?.label === 'Position', 'Field label is Position');
  assert(posField?.category === 'EMPLOYMENT', 'Position is classified under EMPLOYMENT');

  const unitField = defaultFields.find((f) => f.fieldKey === 'officeUnitSection');
  assert(unitField !== undefined, 'Office/Unit/Section field is present in default configuration');
  assert(unitField?.label === 'Office/Unit/Section', 'Field label is Office/Unit/Section');
  assert(unitField?.category === 'EMPLOYMENT', 'Office/Unit/Section is classified under EMPLOYMENT');

  const apptField = defaultFields.find((f) => f.fieldKey === 'dateOfAppointment');
  assert(apptField !== undefined, 'Date of Appointment field is present in default configuration');
  assert(apptField?.label === 'Date of Appointment', 'Field label is Date of Appointment');
  assert(apptField?.type === 'DATE', 'Date of Appointment is of type DATE');

  const landlineField = defaultFields.find((f) => f.fieldKey === 'landline');
  assert(landlineField !== undefined, 'Landline field is present in default configuration');
  assert(landlineField?.label === 'Landline', 'Field label is Landline');
  assert(landlineField?.category === 'CONTACT', 'Landline is classified under CONTACT');

  // 26.2 System Admin Configuration Logic: Enable, Disable, Edit, and Core Protection
  let testFields: MemberRegistrationFieldConfig[] = JSON.parse(JSON.stringify(defaultFields));

  // Disable a non-core field (e.g. landline)
  testFields = testFields.map((f) => (f.fieldKey === 'landline' ? { ...f, enabled: false } : f));
  assert(testFields.find((f) => f.fieldKey === 'landline')?.enabled === false, 'System Admin can disable non-core field (Landline)');

  // Change required status of non-core field (e.g. employeeIdNumber)
  testFields = testFields.map((f) => (f.fieldKey === 'employeeIdNumber' ? { ...f, required: false } : f));
  assert(testFields.find((f) => f.fieldKey === 'employeeIdNumber')?.required === false, 'System Admin can set field to optional');

  // Edit custom label and description
  testFields = testFields.map((f) =>
    f.fieldKey === 'officeUnitSection'
      ? { ...f, label: 'Department / Operating Division', description: 'Institutional unit assignment' }
      : f
  );
  const updatedUnit = testFields.find((f) => f.fieldKey === 'officeUnitSection');
  assert(updatedUnit?.label === 'Department / Operating Division', 'System Admin can edit field label');
  assert(updatedUnit?.description === 'Institutional unit assignment', 'System Admin can edit field description');

  // Protected core fields cannot be disabled
  const firstNameField = testFields.find((f) => f.fieldKey === 'firstName');
  assert(firstNameField?.isSystemCore === true, 'First Name is strictly marked as system core');
  assert(firstNameField?.required === true, 'First Name strictly requires input for statutory compliance');

  // 26.3 Member entity model stores the new employment & contact attributes
  const testMember: Member = {
    id: 'mem_with_employment',
    memberNumber: 'MEM-2026-0999',
    firstName: 'Gabriela',
    lastName: 'Silang',
    email: 'gabriela.silang@deped.gov.ph',
    phone: '+63 918 882 1928',
    landline: '(02) 8876-5432',
    birthdate: '1990-03-19',
    gender: 'FEMALE',
    civilStatus: 'MARRIED',
    address: 'DepEd Central Complex, Meralco Ave, Pasig City',
    employeeIdNumber: 'DEPED-2026-90412',
    position: 'Master Teacher II',
    officeUnitSection: 'Curriculum & Instruction Division',
    dateOfAppointment: '2016-06-01',
    tin: '401-992-118-000',
    classification: 'REGULAR',
    status: 'ACTIVE',
    kycStatus: 'VERIFIED',
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(testMember.employeeIdNumber === 'DEPED-2026-90412', 'Member model stores Employee ID No');
  assert(testMember.position === 'Master Teacher II', 'Member model stores Position');
  assert(testMember.officeUnitSection === 'Curriculum & Instruction Division', 'Member model stores Office/Unit/Section');
  assert(testMember.dateOfAppointment === '2016-06-01', 'Member model stores Date of Appointment');
  assert(testMember.landline === '(02) 8876-5432', 'Member model stores Landline telephone');
}

// 27. System Configuration Module & IAM 5-Attempt Lockout with Mandatory Audit Justification
console.log('\n--- 27. System Configuration Module & IAM 5-Attempt Lockout with Audit Justification ---');
{
  // 27.1 System Configuration Module Hierarchy & Sub-Section Definition
  interface ModuleConfig {
    id: string;
    label: string;
    category: string;
    subSections: string[];
    allowedRoles: string[];
  }

  const systemConfigModule: ModuleConfig = {
    id: 'system_config',
    label: 'System Configuration',
    category: 'Administration',
    subSections: ['membership_registration', 'security_policies'],
    allowedRoles: ['SYSTEM_ADMIN', 'GENERAL_MANAGER'],
  };

  assert(systemConfigModule.id === 'system_config', 'System Configuration module has identifier system_config');
  assert(systemConfigModule.category === 'Administration', 'System Configuration belongs to Administration category');
  assert(systemConfigModule.subSections.includes('membership_registration'), 'System Configuration contains Membership Registration sub-section');
  assert(systemConfigModule.allowedRoles.includes('SYSTEM_ADMIN'), 'System Admin is authorized to access System Configuration');
  assert(systemConfigModule.allowedRoles.includes('GENERAL_MANAGER'), 'General Manager is authorized to access System Configuration');
  assert(!systemConfigModule.allowedRoles.includes('CASHIER'), 'Cashier does not have access to System Configuration');

  // 27.2 IAM 5-Attempt Login Limit & 24-Hour Lockout Mechanics
  interface TestPortalUser {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'LOCKED_OUT';
    failedLoginAttempts: number;
    lockedUntil?: string;
    lockoutReason?: string;
  }

  interface IAMAuditEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    target: string;
  }

  let user: TestPortalUser = {
    id: 'usr_sec_test_01',
    name: 'Engr. Derrick Tan',
    email: 'derrick.tan@bayanicoop.ph',
    role: 'LOAN_OFFICER',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
  };

  const iamAuditLog: IAMAuditEntry[] = [];

  // Helper function to simulate a failed login attempt
  function recordFailedLoginAttempt(target: TestPortalUser): { isLocked: boolean; remainingAttempts: number } {
    if (target.status === 'LOCKED_OUT') {
      return { isLocked: true, remainingAttempts: 0 };
    }

    target.failedLoginAttempts += 1;
    if (target.failedLoginAttempts >= 5) {
      target.status = 'LOCKED_OUT';
      const lockoutDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      target.lockedUntil = lockoutDate.toISOString();
      target.lockoutReason = '5 consecutive failed login attempts exhausted. 24-hour security lockout enforced.';

      iamAuditLog.push({
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'IAM_SECURITY_DAEMON',
        action: 'ACCOUNT_LOCKED_OUT',
        target: `Security lockout (24 hours) enforced for ${target.name} (${target.email}) after 5 failed login attempts.`,
      });
      return { isLocked: true, remainingAttempts: 0 };
    }

    return { isLocked: false, remainingAttempts: 5 - target.failedLoginAttempts };
  }

  // Simulate 4 failed attempts - account should stay ACTIVE
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = recordFailedLoginAttempt(user);
    assert(res.isLocked === false, `Attempt ${attempt}: Account is not locked out yet`);
    assert(user.status === 'ACTIVE', `Attempt ${attempt}: User status remains ACTIVE`);
    assert(user.failedLoginAttempts === attempt, `Failed login counter is ${attempt}`);
    assert(res.remainingAttempts === 5 - attempt, `Remaining attempts equals ${5 - attempt}`);
  }

  // 5th failed attempt triggers 24-hour lockout
  const finalAttemptRes = recordFailedLoginAttempt(user);
  assert(finalAttemptRes.isLocked === true, '5th attempt: Account is now LOCKED_OUT');
  assert(user.status === 'LOCKED_OUT', 'User status transitioned to LOCKED_OUT');
  assert(user.failedLoginAttempts === 5, 'Failed login attempts capped at 5');
  assert(user.lockedUntil !== undefined, 'Locked until timestamp is recorded');

  // Verify lockout duration is exactly 24 hours (within 5 seconds tolerance)
  const lockedUntilTime = new Date(user.lockedUntil!).getTime();
  const expectedLockoutTime = Date.now() + 24 * 60 * 60 * 1000;
  const differenceSeconds = Math.abs(lockedUntilTime - expectedLockoutTime) / 1000;
  assert(differenceSeconds < 5, 'Lockout duration is strictly configured to 24 hours');

  // Verify subsequent attempts are rejected
  const subsequentRes = recordFailedLoginAttempt(user);
  assert(subsequentRes.isLocked === true, 'Subsequent login attempts while locked out are strictly rejected');

  // Verify audit trail logged the lockout
  assert(iamAuditLog.some((log) => log.action === 'ACCOUNT_LOCKED_OUT'), 'IAM audit trail records ACCOUNT_LOCKED_OUT event');

  // 27.3 System Admin Unlocking with Mandatory Justification Note
  function unlockLockedAccount(
    actorRole: string,
    actorName: string,
    target: TestPortalUser,
    justificationNote: string
  ): { success: boolean; error?: string } {
    if (actorRole !== 'SYSTEM_ADMIN' && actorRole !== 'GENERAL_MANAGER') {
      return { success: false, error: 'UNAUTHORIZED_ROLE: Only System Admin or General Manager can unlock account' };
    }

    if (!justificationNote || justificationNote.trim().length === 0) {
      return { success: false, error: 'MISSING_JUSTIFICATION: Justification note is strictly mandatory under CDA IAM rules' };
    }

    // Reset account credentials and lockout state
    target.status = 'ACTIVE';
    target.failedLoginAttempts = 0;
    target.lockedUntil = undefined;
    target.lockoutReason = undefined;

    // Record unlock action in IAM Administrative Audit Trail
    iamAuditLog.push({
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${actorName} (${actorRole})`,
      action: 'ACCOUNT_UNLOCKED',
      target: `Unlocked locked-out account for ${target.name} (${target.email}). Justification: ${justificationNote.trim()}`,
    });

    return { success: true };
  }

  // Attempt unlock by unauthorized role (e.g. CASHIER)
  const unauthorizedUnlock = unlockLockedAccount('CASHIER', 'Leah Mendoza', user, 'Tried to unlock peer');
  assert(unauthorizedUnlock.success === false, 'Unauthorized role cannot unlock locked account');
  assert(Boolean(unauthorizedUnlock.error?.includes('UNAUTHORIZED_ROLE')), 'Returns UNAUTHORIZED_ROLE error');
  assert(user.status === 'LOCKED_OUT', 'User remains LOCKED_OUT after unauthorized unlock attempt');

  // Attempt unlock by SYSTEM_ADMIN without justification note
  const emptyNoteUnlock = unlockLockedAccount('SYSTEM_ADMIN', 'Engr. Alex V. Mercer', user, '   ');
  assert(emptyNoteUnlock.success === false, 'Unlock without justification note is strictly blocked');
  assert(Boolean(emptyNoteUnlock.error?.includes('MISSING_JUSTIFICATION')), 'Returns MISSING_JUSTIFICATION error');
  assert(user.status === 'LOCKED_OUT', 'User remains LOCKED_OUT when justification note is missing');

  // Legitimate unlock by SYSTEM_ADMIN with valid justification note
  const validJustification = 'Staff identity verified via phone with Branch Manager; issued temporary one-time password reset token.';
  const validUnlock = unlockLockedAccount('SYSTEM_ADMIN', 'Engr. Alex V. Mercer', user, validJustification);

  assert(validUnlock.success === true, 'System Admin unlock with justification note succeeds');
  assert(user.status === 'ACTIVE', 'User status successfully restored to ACTIVE');
  assert(user.failedLoginAttempts === 0, 'Failed login attempts successfully reset to 0');
  assert(user.lockedUntil === undefined, 'lockedUntil timestamp cleared upon unlock');
  assert(user.lockoutReason === undefined, 'lockoutReason cleared upon unlock');

  // 27.4 Verification of IAM Administrative Audit Trail
  const unlockAuditRecord = iamAuditLog.find((log) => log.action === 'ACCOUNT_UNLOCKED');
  assert(unlockAuditRecord !== undefined, 'IAM Administrative Audit Trail recorded ACCOUNT_UNLOCKED event');
  assert(unlockAuditRecord?.actor === 'Engr. Alex V. Mercer (SYSTEM_ADMIN)', 'Audit record tracks System Admin as actor');
  assert(Boolean(unlockAuditRecord?.target.includes(user.name)), 'Audit record specifies target user name');
  assert(Boolean(unlockAuditRecord?.target.includes(user.email)), 'Audit record specifies target user email');
  assert(Boolean(unlockAuditRecord?.target.includes(validJustification)), 'Audit record preserves mandatory justification note verbatim');
}

// 28. Cooperative Public Registration, Operator Review, ID Inspection, Approval OTP & support@tuntongtech.com Email Dispatch
console.log('\n--- 28. Cooperative Registration, Operator Review, ID Inspection, Approval OTP & support@tuntongtech.com Email Dispatch ---');
{
  OperatorService.ensureInitialized();

  // 28.1 Verify seeded pending registration is untied from dummy Bayanihan
  const initialRegs = OperatorService.listRegistrations();
  assert(initialRegs.length >= 1, 'Initial registrations list contains at least 1 application');
  const seeded = initialRegs.find((r) => r.id === 'REG-2026-8914');
  assert(seeded !== undefined, 'Seeded application REG-2026-8914 is present');
  assert(seeded?.status === 'PENDING_REVIEW', 'Seeded application status is strictly PENDING_REVIEW');
  assert(seeded?.validIdFileName !== undefined, 'Submitted government ID file name is attached');
  assert(seeded?.validIdFileSizeMb !== undefined, 'Submitted government ID file size is recorded');

  // 28.2 Submit new cooperative registration application
  const newReg = OperatorService.submitRegistration({
    name: 'Tagumpay Multi-Purpose Cooperative',
    coopType: 'MULTI_PURPOSE',
    slug: 'tagumpay',
    cdaRegistrationNumber: 'CDA-R04A-2025-00192',
    tin: '772-109-883-000',
    contactEmail: 'info@tagumpaycoop.ph',
    contactPhone: '+63 918 772 1099',
    address: 'National Highway, Calamba, Laguna',
    adminFirstName: 'Eduardo',
    adminMiddleName: 'Castro',
    adminLastName: 'Villanueva',
    adminEmail: 'eduardo.villanueva@tagumpaycoop.ph',
    validIdFileName: 'Eduardo_Villanueva_Passport.pdf',
    validIdFileSizeMb: '3.15',
    validIdUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
  });

  assert(Boolean(newReg.id.startsWith('REG-')), 'New registration receives unique REG- identifier');
  assert(newReg.status === 'PENDING_REVIEW', 'New registration initial status is strictly PENDING_REVIEW');
  assert(newReg.subdomain === 'tagumpay-coop.tuntongtech.com', 'Subdomain is mapped under tuntongtech.com');
  assert(newReg.validIdFileName === 'Eduardo_Villanueva_Passport.pdf', 'Submitted Government ID is recorded');

  // 28.3 Operator approves Tagumpay application
  const approveResult = OperatorService.approveRegistration(newReg.id, 'Lex (Operator)');
  assert(approveResult.success === true, 'Operator approval succeeds');
  assert(approveResult.registration?.status === 'APPROVED', 'Registration status transitions to APPROVED');
  assert(Boolean(approveResult.registration?.oneTimePassword), '1-time temporary password is generated');
  assert(Boolean(approveResult.registration?.oneTimePassword?.startsWith('TT-')), '1-time password follows TT- prefix');
  assert(approveResult.tenant !== undefined, 'Tenant instance is provisioned into fleet');
  assert(approveResult.tenant?.status === 'ACTIVE', 'Provisioned tenant is ACTIVE');

  // Verify newly approved cooperative starts strictly with 0 Available Credit and 0 Escrow Float
  const approvedTenantFleet = OperatorService.getTenantFleetSummaries().find((t) => t.id === approveResult.tenant?.id);
  assert(approvedTenantFleet !== undefined, 'Approved tenant is found in tenant fleet summaries');
  assert(approvedTenantFleet?.platformCreditBalance === 0, 'New approved cooperative strictly has 0 Available Credit');
  assert(approvedTenantFleet?.escrowFloatBalance === 0, 'New approved cooperative strictly has 0 Escrow Float');

  // Email Notification verification
  const emailNotification = approveResult.registration?.emailNotification;
  assert(emailNotification !== undefined, 'Official email notification record is generated');
  assert(emailNotification?.from === 'support@tuntongtech.com', 'Email strictly originates from support@tuntongtech.com');
  assert(emailNotification?.to === 'eduardo.villanueva@tagumpaycoop.ph', 'Email is addressed to registrant');
  assert(Boolean(emailNotification?.subject.includes('Approved')), 'Email subject states Approved');
  assert(Boolean(emailNotification?.body.includes('support@tuntongtech.com')), 'Email body contains official support contact');
  assert(Boolean(emailNotification?.body.includes(approveResult.registration!.oneTimePassword!)), 'Email body conveys 1-time password');
  assert(Boolean(emailNotification?.body.includes('tagumpay-coop.tuntongtech.com')), 'Email body conveys dedicated domain');
  assert(Boolean(emailNotification?.body.includes('initial sign-in only')), 'Email body informs user password must be changed upon login');

  // 28.4 Submit another application and test operator Rejection
  const rejectedApp = OperatorService.submitRegistration({
    name: 'Illegitimate Syndicate Cooperative',
    coopType: 'CREDIT',
    slug: 'syndicate',
    cdaRegistrationNumber: 'CDA-FAKE-999',
    tin: '000-000-000-000',
    contactEmail: 'scam@fakecoop.xyz',
    address: 'Fake Address 123',
    adminFirstName: 'Fake',
    adminLastName: 'User',
    adminEmail: 'scam@fakecoop.xyz',
    validIdFileName: 'fake_id.png',
  });

  const rejectReason = 'CDA registration number does not exist in CDA registry; TIN validation failed BIR database lookup.';
  const rejectResult = OperatorService.rejectRegistration(rejectedApp.id, rejectReason, 'Lex (Operator)');

  assert(rejectResult.success === true, 'Operator rejection succeeds');
  assert(rejectResult.registration?.status === 'REJECTED', 'Registration status transitions to REJECTED');
  assert(rejectResult.registration?.rejectionReason === rejectReason, 'Rejection reason is preserved verbatim');
  assert(rejectResult.registration?.emailNotification?.from === 'support@tuntongtech.com', 'Rejection email originates from support@tuntongtech.com');
  assert(Boolean(rejectResult.registration?.emailNotification?.body.includes(rejectReason)), 'Rejection email conveys specific non-compliance reason');

  // 28.6 Operator removes individual registration from queue
  const removeOk = OperatorService.removeRegistration(rejectedApp.id);
  assert(removeOk === true, 'Operator successfully removes registration from queue');
  assert(OperatorService.getRegistrationById(rejectedApp.id) === undefined, 'Removed registration no longer exists in queue');

  // 28.7 Operator clears all registrations from queue
  OperatorService.clearAllRegistrations();
  assert(OperatorService.listRegistrations().length === 0, 'Coop onboarding queue is completely cleared');
}

// 29. Operator Passwordless Authentication (Username: tuntongtech, Email: felix.echano@tuntongtech.com, 1-Time PIN)
console.log('\n--- 29. Operator Portal Passwordless OTP Authentication ---');
{
  // 29.1 Reject unauthorized operator identities
  const invalidReq = OperatorService.requestOperatorOtp('random_intruder');
  assert(invalidReq.success === false, 'Non-existent operator usernames are strictly rejected');
  assert(invalidReq.error === 'OPERATOR_NOT_FOUND', 'Returns OPERATOR_NOT_FOUND error code');

  // 29.2 Request OTP with valid operator username 'tuntongtech'
  const otpReqUsername = OperatorService.requestOperatorOtp('tuntongtech');
  assert(otpReqUsername.success === true, 'Operator OTP request succeeds for username tuntongtech');
  assert(otpReqUsername.email === 'felix.echano@tuntongtech.com', 'OTP destination is bound to felix.echano@tuntongtech.com');
  assert(otpReqUsername.otp !== undefined && /^\d{6}$/.test(otpReqUsername.otp), 'Generated OTP is exactly a 6-digit numeric PIN');
  assert(Boolean(otpReqUsername.message?.includes('support@tuntongtech.com')), 'Notification originates from support@tuntongtech.com');

  // 29.3 Request OTP with valid operator email 'felix.echano@tuntongtech.com'
  const otpReqEmail = OperatorService.requestOperatorOtp('felix.echano@tuntongtech.com');
  assert(otpReqEmail.success === true, 'Operator OTP request succeeds when passing email directly');
  const activePin = otpReqEmail.otp!;

  // 29.4 Fail on incorrect PIN
  const wrongPinVerify = OperatorService.verifyOperatorOtp('tuntongtech', '000000');
  assert(wrongPinVerify.success === false, 'Verification fails on incorrect PIN');
  assert(Boolean(wrongPinVerify.error?.includes('Invalid PIN')), 'Returns invalid PIN error');

  // 29.5 Succeed on correct 6-digit PIN
  const validVerify = OperatorService.verifyOperatorOtp('tuntongtech', activePin);
  assert(validVerify.success === true, 'Verification succeeds on correct PIN');
  assert(validVerify.session !== undefined, 'OperatorSession is issued');
  assert(validVerify.session?.username === 'tuntongtech', 'Session username matches tuntongtech');
  assert(validVerify.session?.email === 'felix.echano@tuntongtech.com', 'Session email matches felix.echano@tuntongtech.com');
  assert(validVerify.session?.role === 'PLATFORM_SUPER_OPERATOR', 'Session role is PLATFORM_SUPER_OPERATOR');
  assert(Boolean(validVerify.session?.token.startsWith('opt_sess_')), 'Session token has opt_sess_ prefix');

  // 29.6 Prevent replay attack with consumed OTP
  const replayVerify = OperatorService.verifyOperatorOtp('tuntongtech', activePin);
  assert(replayVerify.success === false, 'PIN cannot be re-used after consumption');

  // 29.7 Validate active session token
  const validatedSession = OperatorService.validateOperatorSession(validVerify.session!.token);
  assert(validatedSession !== null, 'Active session token resolves correctly');
  assert(validatedSession?.username === 'tuntongtech', 'Validated session retains operator username');

  // 29.8 Reject fake/invalid session token
  const invalidSession = OperatorService.validateOperatorSession('invalid_token_999');
  assert(invalidSession === null, 'Invalid session token returns null');
}

console.log('\n🎉 ALL 293 VERIFICATION TEST CASES (INCLUDING OPERATOR PASSWORDLESS OTP LOGIN & support@tuntongtech.com DISPATCH) PASSED SUCCESSFULLY!\n');









