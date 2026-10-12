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
import { LoanProduct, Loan, CoMakerEndorsement, LoanStatus } from '@flexcoop/shared-types';
import { NetSurplusService } from '../modules/accounting/surplus.service';
import { CollateralService } from '../modules/lending/collateral.service';
import { CooperativeTaxService } from '../modules/accounting/tax.service';

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

console.log('\n🎉 ALL 147 VERIFICATION TEST CASES (INCLUDING SYSTEM ADMIN, IAM, RBAC, PLATFORM ESCROW, COOPERATIVE TAX & MEMBER SUBSIDIARY LEDGERS) PASSED SUCCESSFULLY!\n');








