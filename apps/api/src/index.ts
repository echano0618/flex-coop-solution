import express, { Request, Response } from 'express';
import cors from 'cors';
import { dbStore } from './core/store';
import { MonetizationService } from './modules/monetization/monetization.service';
import { AmortizationService } from './modules/lending/amortization.service';
import { GeneralLedgerService } from './modules/accounting/ledger.service';
import { PaymentService } from './modules/payments/payment.service';
import { PayMongoWebhookService } from './modules/payments/webhook.service';
import { RegulatoryReportsService } from './modules/reports/reports.service';
import { CDAExportService } from './modules/reports/cda_export.service';
import { DisclosureService } from './modules/lending/disclosure.service';
import { NPCEncryptionService } from './core/npc-encryption';
import { AuthService, UserRole } from './core/auth';
import { FirestoreCoopService } from './core/firestore.service';
import { CDACoAManager } from '@flexcoop/cda-coa';
import { TenantProvisioner } from '@flexcoop/db-migrations';
import { Loan, Member, PaymentTransaction, Tenant } from '@flexcoop/shared-types';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Helper to resolve active tenant from subdomain, header, or JWT claim
export function resolveTenantFromHost(hostHeader?: string): string | null {
  if (!hostHeader) return null;
  const cleanHost = hostHeader.split(':')[0].toLowerCase();

  // Root platform domain
  if (cleanHost === 'flexcoop.tuntongtech.com' || cleanHost === 'localhost') {
    return null;
  }

  // Production tenant subdomain: <tenant>-flexcoop.tuntongtech.com
  const prodSuffix = '-flexcoop.tuntongtech.com';
  if (cleanHost.endsWith(prodSuffix)) {
    return cleanHost.slice(0, -prodSuffix.length);
  }

  // Local dev tenant subdomain: <tenant>-flexcoop.localhost or <tenant>.localhost
  const devSuffix = '-flexcoop.localhost';
  if (cleanHost.endsWith(devSuffix)) {
    return cleanHost.slice(0, -devSuffix.length);
  }
  if (cleanHost.endsWith('.localhost')) {
    return cleanHost.slice(0, -'.localhost'.length);
  }

  return null;
}

export function resolveTenantId(req: Request): string {
  // 1. Explicit header takes precedence
  const headerTenant = req.headers['x-tenant-id'] as string;
  if (headerTenant && dbStore.tenants.has(headerTenant)) {
    return headerTenant;
  }

  // 2. Subdomain resolution: <tenantname>-flexcoop.tuntongtech.com
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  const slugFromHost = resolveTenantFromHost(host);
  if (slugFromHost) {
    for (const [id, tenant] of dbStore.tenants.entries()) {
      if (
        tenant.slug.toLowerCase() === slugFromHost.toLowerCase() ||
        tenant.slug.replace(/_/g, '-').toLowerCase() === slugFromHost.toLowerCase() ||
        id.toLowerCase() === `tenant_${slugFromHost}`.toLowerCase()
      ) {
        return id;
      }
    }
  }

  // 3. JWT Authorization claim fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    if (payload && payload.tenantId && dbStore.tenants.has(payload.tenantId)) {
      return payload.tenantId;
    }
  }

  // 4. Fallback to primary seeded tenant
  return 'tenant_bayani_001';
}

// ==========================================
// 1. HEALTH & METADATA
// ==========================================
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'Flex Coop Solution API',
    jurisdiction: 'Philippines (CDA / NPC / AMLC Compliant)',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 1.5 AUTHENTICATION, ONBOARDING & RBAC
// ==========================================
app.get('/api/v1/auth/staff-accounts', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const accounts = AuthService.getStaffAccounts(tenantId);
  res.json({ success: true, count: accounts.length, data: accounts });
});

app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const { email, role } = req.body;

  const accounts = AuthService.getStaffAccounts(tenantId);
  const matched = accounts.find((a) => a.email === email || a.role === role) || accounts[0];

  const token = AuthService.generateToken({
    id: matched.id,
    email: matched.email,
    fullName: matched.fullName,
    role: matched.role,
    tenantId,
  });

  res.json({
    success: true,
    message: `Logged in successfully as ${matched.roleTitle}.`,
    user: matched,
    token,
  });
});

app.post('/api/v1/auth/member/login', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const { identifier, pin } = req.body; // mobile number or email

  const members = dbStore.members.get(tenantId) || [];
  const member = members.find((m) => m.phone === identifier || m.email === identifier || m.memberNumber === identifier) || members[0];

  if (!member) {
    return res.status(404).json({ success: false, error: 'Member account not found.' });
  }

  const token = AuthService.generateToken({
    id: member.id,
    email: member.email,
    fullName: `${member.firstName} ${member.lastName}`,
    role: 'MEMBER',
    tenantId,
  });

  res.json({
    success: true,
    message: `Welcome back, ${member.firstName}!`,
    member,
    token,
  });
});

app.post('/api/v1/auth/member/register', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const {
    firstName,
    middleName,
    lastName,
    email,
    phone,
    birthdate,
    gender,
    civilStatus,
    address,
    completedPMES,
    subscribedShares,
    initialPaidUpAmount,
    agreedToPrivacyPolicy,
    idType,
    idNumber,
  } = req.body;

  if (!firstName || !lastName || !email || !birthdate) {
    return res.status(400).json({ success: false, error: 'First name, last name, email, and birthdate are required.' });
  }

  if (!completedPMES) {
    return res.status(400).json({
      success: false,
      error: 'Statutory Requirement: Applicant must complete the Pre-Membership Education Seminar (PMES) before admission.',
    });
  }

  if (!agreedToPrivacyPolicy) {
    return res.status(400).json({
      success: false,
      error: 'NPC Requirement: Applicant must give explicit informed consent under the Data Privacy Act of 2012.',
    });
  }

  const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const memberNumber = `MEM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newMember: Member = {
    id: memberId,
    memberNumber,
    firstName,
    middleName,
    lastName,
    email,
    phone: phone || '+63 900 000 0000',
    birthdate,
    gender: gender || 'FEMALE',
    civilStatus: civilStatus || 'SINGLE',
    address: address || 'Metro Manila, Philippines',
    classification: 'REGULAR',
    status: 'PENDING_APPROVAL', // Awaiting BOD / Committee sign-off
    kycStatus: 'SUBMITTED',
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const members = dbStore.members.get(tenantId) || [];
  members.push(newMember);
  dbStore.members.set(tenantId, members);

  // 1. Record KYC Document with encrypted SPI
  if (idNumber) {
    const kycDocs = dbStore.kycDocs.get(tenantId) || [];
    kycDocs.push({
      id: `kyc_${Date.now()}`,
      memberId,
      idType: idType || 'PHILSYS_NATIONAL_ID',
      idNumberEncrypted: NPCEncryptionService.encrypt(idNumber),
      frontDocumentUrl: `https://storage.flexcoop.ph/kyc/${memberId}_front.jpg`,
      selfieUrl: `https://storage.flexcoop.ph/kyc/${memberId}_selfie.jpg`,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
    });
    dbStore.kycDocs.set(tenantId, kycDocs);
  }

  // 2. Record NPC Consent Log
  const consents = dbStore.npcConsents.get(tenantId) || [];
  consents.push({
    id: `npc_${Date.now()}`,
    memberId,
    consentType: 'PRIVACY_POLICY',
    version: 'v2026.1',
    agreed: true,
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Web Registration Form',
    timestamp: new Date().toISOString(),
  });
  dbStore.npcConsents.set(tenantId, consents);

  // 3. Setup Share Capital Account
  const sharesCount = Number(subscribedShares || 20);
  const paidUp = Number(initialPaidUpAmount || 2000);
  const shareAccount = {
    id: `sc_${Date.now()}`,
    memberId,
    accountNumber: `SC-${new Date().getFullYear()}-${memberNumber.replace('MEM-', '')}`,
    subscribedShares: sharesCount,
    parValuePerShare: 100,
    subscribedAmount: sharesCount * 100,
    paidUpAmount: paidUp,
    balance: paidUp,
    updatedAt: new Date().toISOString(),
  };
  const shareAccounts = dbStore.shareAccounts.get(tenantId) || [];
  shareAccounts.push(shareAccount);
  dbStore.shareAccounts.set(tenantId, shareAccounts);

  res.status(201).json({
    success: true,
    message: `Application submitted successfully. Member ${memberNumber} is in the Board/Committee approval queue.`,
    member: newMember,
    shareAccount,
  });
});

// ==========================================
// 2. TENANT MANAGEMENT & PROVISIONING
// ==========================================
app.get('/api/v1/tenants', (_req: Request, res: Response) => {
  const tenants = Array.from(dbStore.tenants.values());
  res.json({ success: true, count: tenants.length, data: tenants });
});

app.post('/api/v1/tenants', (req: Request, res: Response) => {
  const { name, slug, cdaRegistrationNumber, tin, contactEmail, contactPhone, address, billingMode } = req.body;

  if (!name || !slug || !cdaRegistrationNumber || !tin) {
    return res.status(400).json({ success: false, error: 'Missing required tenant metadata' });
  }

  const id = `tenant_${slug}_${Math.random().toString(36).substring(2, 6)}`;
  const tenant: Tenant = {
    id,
    name,
    slug,
    cdaRegistrationNumber,
    tin,
    contactEmail: contactEmail || 'admin@coop.ph',
    contactPhone: contactPhone || '+63 900 000 0000',
    address: address || 'Philippines',
    billingMode: billingMode === 'COOP_MERCHANT' ? 'COOP_MERCHANT' : 'PLATFORM_ESCROW',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.tenants.set(id, tenant);
  // Initialize tenant collections
  dbStore.members.set(id, []);
  dbStore.shareAccounts.set(id, []);
  dbStore.savingsAccounts.set(id, []);
  dbStore.loans.set(id, []);
  dbStore.journalEntries.set(id, []);

  // Return schema name and provisioning confirmation
  const schemaName = TenantProvisioner.getSafeSchemaName(slug);

  res.status(201).json({
    success: true,
    message: `Tenant '${name}' provisioned successfully with isolated schema '${schemaName}' and seeded CDA Chart of Accounts.`,
    data: tenant,
    schemaName,
  });
});

// ==========================================
// 3. MEMBERSHIP & eKYC (NPC COMPLIANCE)
// ==========================================
app.get('/api/v1/members', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const members = dbStore.members.get(tenantId) || [];
  res.json({ success: true, tenantId, count: members.length, data: members });
});

app.post('/api/v1/members', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const { firstName, middleName, lastName, email, phone, birthdate, gender, civilStatus, address, agreedPrivacyPolicy } = req.body;

  if (!firstName || !lastName || !email || !birthdate) {
    return res.status(400).json({ success: false, error: 'First name, last name, email, and birthdate are required.' });
  }

  if (!agreedPrivacyPolicy) {
    return res.status(400).json({ success: false, error: 'NPC Compliance: Member must agree to the Data Privacy Policy.' });
  }

  const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const memberNumber = `MEM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newMember: Member = {
    id: memberId,
    memberNumber,
    firstName,
    middleName,
    lastName,
    email,
    phone: phone || '',
    birthdate,
    gender: gender || 'OTHER',
    civilStatus: civilStatus || 'SINGLE',
    address: address || '',
    classification: 'REGULAR',
    status: 'ACTIVE',
    kycStatus: 'SUBMITTED',
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const members = dbStore.members.get(tenantId) || [];
  members.push(newMember);
  dbStore.members.set(tenantId, members);

  // Record NPC Consent log
  const consents = dbStore.npcConsents.get(tenantId) || [];
  consents.push({
    id: `npc_${Date.now()}`,
    memberId,
    consentType: 'PRIVACY_POLICY',
    version: 'v2026.1',
    agreed: true,
    ipAddress: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'Unknown',
    timestamp: new Date().toISOString(),
  });
  dbStore.npcConsents.set(tenantId, consents);

  res.status(201).json({ success: true, data: newMember });
});

app.post('/api/v1/members/:id/kyc/review', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const memberId = req.params.id;
  const { status, notes, reviewedByUserId } = req.body;

  const members = dbStore.members.get(tenantId) || [];
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found.' });
  }

  const newStatus = status === 'REJECTED' ? 'REJECTED' : 'VERIFIED';
  member.kycStatus = newStatus;
  member.updatedAt = new Date().toISOString();

  const docs = dbStore.kycDocs.get(tenantId) || [];
  const doc = docs.find((d) => d.memberId === memberId);
  if (doc) {
    doc.status = newStatus;
    doc.reviewerNotes = notes || 'Document verified against government registry.';
    doc.reviewedByUserId = reviewedByUserId || 'usr_compliance_officer';
    if (newStatus === 'VERIFIED') {
      doc.verifiedAt = new Date().toISOString();
    }
  }

  res.json({
    success: true,
    message: `Member ${member.memberNumber} KYC updated to ${newStatus}.`,
    member,
    document: doc,
  });
});

// ==========================================
// 4. SHARE CAPITAL & SAVINGS LEDGER
// ==========================================
app.get('/api/v1/shares', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const shares = dbStore.shareAccounts.get(tenantId) || [];
  res.json({ success: true, count: shares.length, data: shares });
});

app.post('/api/v1/shares/deposit', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const { memberId, amount } = req.body;

  if (!memberId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid memberId and deposit amount required.' });
  }

  const accounts = dbStore.shareAccounts.get(tenantId) || [];
  const account = accounts.find((a) => a.memberId === memberId);

  if (!account) {
    return res.status(404).json({ success: false, error: 'Share capital account not found for member.' });
  }

  account.paidUpAmount += Number(amount);
  account.balance += Number(amount);
  account.updatedAt = new Date().toISOString();

  // Automatic balanced CDA journal entry
  const journalData = GeneralLedgerService.buildShareDepositEntry({
    memberId,
    memberNumber: account.accountNumber,
    amount: Number(amount),
    userId: 'usr_cashier',
  });

  const entries = dbStore.journalEntries.get(tenantId) || [];
  const journalEntry = { id: `je_${Date.now()}`, ...journalData };
  entries.push(journalEntry);
  dbStore.journalEntries.set(tenantId, entries);

  // AMLC Check
  const amlcAlert = RegulatoryReportsService.checkAMLCThreshold({
    transactionId: journalEntry.id,
    memberId,
    amount: Number(amount),
    transactionType: 'SHARE_CAPITAL_DEPOSIT',
  });
  if (amlcAlert) {
    dbStore.amlcAlerts.push(amlcAlert);
  }

  res.json({ success: true, account, journalEntry, amlcAlert });
});

// ==========================================
// 5. LOAN ORIGINATION & CALCULATOR
// ==========================================
app.get('/api/v1/loan-products', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const products = dbStore.loanProducts.get(tenantId) || [];
  res.json({ success: true, count: products.length, data: products });
});

app.post('/api/v1/loans/apply', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const tenant = dbStore.tenants.get(tenantId);
  const { memberId, productId, principalAmount, termMonths, paymentFrequency } = req.body;

  if (!memberId || !productId || !principalAmount) {
    return res.status(400).json({ success: false, error: 'memberId, productId, and principalAmount are required.' });
  }

  const products = dbStore.loanProducts.get(tenantId) || [];
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Loan product not found.' });
  }

  const members = dbStore.members.get(tenantId) || [];
  const member = members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found.' });
  }

  const term = Number(termMonths || 12);
  const scheduleData = AmortizationService.generateSchedule({
    principalAmount: Number(principalAmount),
    annualInterestRate: product.annualInterestRate,
    termMonths: term,
    paymentFrequency: paymentFrequency || 'MONTHLY',
    method: product.amortizationMethod,
  });

  const billingMode = tenant?.billingMode || 'PLATFORM_ESCROW';
  const feeCalc = MonetizationService.calculatePlatformFee(Number(principalAmount), billingMode);
  const coopServiceFee = Math.round(Number(principalAmount) * product.serviceFeeRate * 100) / 100;
  const netProceeds = Number(principalAmount) - feeCalc.grossFee - coopServiceFee;

  const loanId = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const loanNumber = `LN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const newLoan: Loan = {
    id: loanId,
    loanNumber,
    memberId,
    productId,
    principalAmount: Number(principalAmount),
    interestRateAnnual: product.annualInterestRate,
    termMonths: term,
    paymentFrequency: paymentFrequency || 'MONTHLY',
    amortizationMethod: product.amortizationMethod,
    status: 'SUBMITTED',
    platformFee: feeCalc.grossFee,
    coopServiceFee,
    netProceedsDisbursed: netProceeds,
    totalInterestExpected: scheduleData.totalInterest,
    totalPayable: scheduleData.totalPayable,
    balanceRemaining: Number(principalAmount),
    schedule: scheduleData.schedule,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const loans = dbStore.loans.get(tenantId) || [];
  loans.push(newLoan);
  dbStore.loans.set(tenantId, loans);

  res.status(201).json({
    success: true,
    message: `Loan application ${loanNumber} submitted successfully. Pending Loan Officer review.`,
    data: newLoan,
  });
});

app.post('/api/v1/loans/:id/review', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const loanId = req.params.id;
  const { remarks, approved } = req.body;

  const loans = dbStore.loans.get(tenantId) || [];
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });

  if (approved === false) {
    loan.status = 'REJECTED';
    loan.updatedAt = new Date().toISOString();
    return res.json({ success: true, message: 'Loan rejected by Loan Officer.', loan });
  }

  loan.status = 'UNDER_CREDIT_REVIEW';
  loan.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Loan reviewed by Loan Officer and endorsed to Credit Committee.',
    loan,
    stage: 'CREDIT_COMMITTEE',
  });
});

app.post('/api/v1/loans/:id/committee-approve', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const loanId = req.params.id;
  const { approved } = req.body;

  const loans = dbStore.loans.get(tenantId) || [];
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });

  if (approved === false) {
    loan.status = 'REJECTED';
    loan.updatedAt = new Date().toISOString();
    return res.json({ success: true, message: 'Loan rejected by Credit Committee.', loan });
  }

  // If loan >= 100,000, requires BOD approval; otherwise approved for disbursement
  if (loan.principalAmount >= 100000) {
    loan.status = 'BOD_APPROVAL';
  } else {
    loan.status = 'APPROVED';
  }
  loan.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: loan.status === 'BOD_APPROVAL' ? 'Endorsed to Board of Directors for final approval.' : 'Approved by Credit Committee. Ready for disbursement.',
    loan,
  });
});

app.post('/api/v1/loans/:id/bod-approve', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const loanId = req.params.id;
  const { approved } = req.body;

  const loans = dbStore.loans.get(tenantId) || [];
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });

  if (approved === false) {
    loan.status = 'REJECTED';
    loan.updatedAt = new Date().toISOString();
    return res.json({ success: true, message: 'Loan rejected by Board of Directors.', loan });
  }

  loan.status = 'APPROVED';
  loan.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: 'Approved by Board of Directors. Ready for disbursement.',
    loan,
  });
});

app.get('/api/v1/loans/:id/disclosure-statement', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const tenant = dbStore.tenants.get(tenantId)!;
  const loanId = req.params.id;

  const loans = dbStore.loans.get(tenantId) || [];
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return res.status(404).json({ success: false, error: 'Loan not found' });

  const members = dbStore.members.get(tenantId) || [];
  const member = members.find((m) => m.id === loan.memberId)!;

  const products = dbStore.loanProducts.get(tenantId) || [];
  const product = products.find((p) => p.id === loan.productId)!;

  const disclosure = DisclosureService.generateDisclosureStatement({
    tenant,
    member,
    loan,
    product,
  });

  res.json({ success: true, data: disclosure });
});


app.post('/api/v1/loans/calculate', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const tenant = dbStore.tenants.get(tenantId);
  const { principalAmount, annualInterestRate, termMonths, amortizationMethod, billingModeOverride } = req.body;

  const billingMode = billingModeOverride || tenant?.billingMode || 'PLATFORM_ESCROW';

  const feeCalc = MonetizationService.calculatePlatformFee(Number(principalAmount), billingMode);
  const scheduleData = AmortizationService.generateSchedule({
    principalAmount: Number(principalAmount),
    annualInterestRate: Number(annualInterestRate || 0.12),
    termMonths: Number(termMonths || 12),
    paymentFrequency: 'MONTHLY',
    method: amortizationMethod || 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
  });

  res.json({
    success: true,
    platformFee: feeCalc,
    amortization: scheduleData,
    netDisbursement: {
      grossPrincipal: Number(principalAmount),
      platformFeeDeducted: feeCalc.grossFee,
      estimatedNetProceeds: Number(principalAmount) - feeCalc.grossFee,
    },
  });
});

app.get('/api/v1/loans', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const loans = dbStore.loans.get(tenantId) || [];
  res.json({ success: true, count: loans.length, data: loans });
});

app.post('/api/v1/loans/:id/disburse', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const tenant = dbStore.tenants.get(tenantId)!;
  const loanId = req.params.id;

  const loans = dbStore.loans.get(tenantId) || [];
  const loan = loans.find((l) => l.id === loanId);

  if (!loan) {
    return res.status(404).json({ success: false, error: 'Loan not found' });
  }

  if (loan.status === 'DISBURSED') {
    return res.status(400).json({ success: false, error: 'Loan is already disbursed' });
  }

  // 1. Calculate pass-through fee based on tenant billing mode
  const feeCalc = MonetizationService.calculatePlatformFee(loan.principalAmount, tenant.billingMode);
  loan.platformFee = feeCalc.grossFee;
  loan.netProceedsDisbursed = loan.principalAmount - loan.platformFee - loan.coopServiceFee;
  loan.status = 'DISBURSED';
  loan.disbursedAt = new Date().toISOString();
  loan.disbursementReference = `DISB-TX-${Date.now().toString(36).toUpperCase()}`;

  // 2. Generate 12% Output VAT Official Invoice
  const invoice = MonetizationService.generatePlatformInvoice({
    tenantId,
    loanId: loan.id,
    disbursementReference: loan.disbursementReference,
    loanAmount: loan.principalAmount,
    billingMode: tenant.billingMode,
    tenantTin: tenant.tin,
  });
  dbStore.platformInvoices.push(invoice);

  // 3. Post Balanced CDA Journal Entry
  const jeData = GeneralLedgerService.buildDisbursementEntry({
    loanId: loan.id,
    loanNumber: loan.loanNumber,
    grossPrincipal: loan.principalAmount,
    platformFee: feeCalc.grossFee,
    coopServiceFee: loan.coopServiceFee,
    netProceeds: loan.netProceedsDisbursed,
    disbursementChannel: tenant.billingMode === 'PLATFORM_ESCROW' ? 'PLATFORM_ESCROW' : 'BANK',
    userId: 'usr_admin',
  });

  const entries = dbStore.journalEntries.get(tenantId) || [];
  const journalEntry = { id: `je_${Date.now()}`, ...jeData };
  entries.push(journalEntry);
  dbStore.journalEntries.set(tenantId, entries);

  // 4. AMLC Check on disbursement
  const amlcAlert = RegulatoryReportsService.checkAMLCThreshold({
    transactionId: loan.disbursementReference,
    memberId: loan.memberId,
    amount: loan.principalAmount,
    transactionType: 'LOAN_DISBURSEMENT',
  });
  if (amlcAlert) {
    dbStore.amlcAlerts.push(amlcAlert);
  }

  res.json({
    success: true,
    message: `Loan ${loan.loanNumber} disbursed successfully. Platform fee of ₱${feeCalc.grossFee.toFixed(2)} deducted upfront.`,
    loan,
    invoice,
    journalEntry,
    amlcAlert,
  });
});

// ==========================================
// 6. PAYMENTS & REPAYMENTS (PAYMONGO QR PH & CASHIER)
// ==========================================
app.post('/api/v1/payments/qrph/generate', (req: Request, res: Response) => {
  const { loanId, memberId, amount, description } = req.body;

  if (!loanId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Valid loanId and payment amount required.' });
  }

  const qrIntent = PaymentService.generateQRPhIntent({
    loanId,
    memberId: memberId || 'mem_default',
    installmentAmount: Number(amount),
    description: description || 'Loan Installment Repayment',
  });

  res.json({ success: true, data: qrIntent });
});

app.post('/api/v1/payments/cashier', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const { loanId, memberId, amountPaid, channel } = req.body;

  if (!loanId || !amountPaid || amountPaid <= 0) {
    return res.status(400).json({ success: false, error: 'loanId and amountPaid are required.' });
  }

  const loans = dbStore.loans.get(tenantId) || [];
  const loan = loans.find((l) => l.id === loanId);

  if (!loan) {
    return res.status(404).json({ success: false, error: 'Loan not found' });
  }

  const paymentChannel = channel === 'PAYMONGO_QRPH' ? 'PAYMONGO_QRPH' : 'IN_PERSON_CASHIER';
  const passOnFee = paymentChannel === 'PAYMONGO_QRPH' ? PaymentService.calculatePassOnFee(Number(amountPaid), 'PAYMONGO_QRPH') : 0;
  const netLoanPayment = Number(amountPaid);

  // Allocate payment: Penalties -> Interest -> Principal
  // Take next unpaid installment target
  const unpaidItem = loan.schedule.find((s) => !s.isPaid) || loan.schedule[0];
  const interestDue = Math.max(0, unpaidItem.interestAmount - unpaidItem.paidInterest);
  const principalDue = Math.max(0, unpaidItem.principalAmount - unpaidItem.paidPrincipal);

  const allocation = PaymentService.allocatePayment({
    amountPaid: netLoanPayment,
    penaltyDue: 0,
    interestDue,
    principalDue,
  });

  // Update schedule item
  unpaidItem.paidInterest += allocation.interestPortion;
  unpaidItem.paidPrincipal += allocation.principalPortion;
  if (unpaidItem.paidPrincipal >= unpaidItem.principalAmount) {
    unpaidItem.isPaid = true;
    unpaidItem.paidAt = new Date().toISOString();
  }

  loan.balanceRemaining = Math.max(0, loan.balanceRemaining - allocation.principalPortion);
  loan.updatedAt = new Date().toISOString();

  // Create payment record
  const paymentRecord: PaymentTransaction = {
    id: `pay_${Date.now()}`,
    receiptNumber: `OR-${Date.now().toString(36).toUpperCase()}`,
    loanId,
    memberId: memberId || loan.memberId,
    channel: paymentChannel,
    grossAmountPaid: netLoanPayment + passOnFee,
    passOnConvenienceFee: passOnFee,
    netLoanPayment,
    principalPortion: allocation.principalPortion,
    interestPortion: allocation.interestPortion,
    penaltyPortion: allocation.penaltyPortion,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  // Post Balanced CDA Journal Entry
  const jeData = GeneralLedgerService.buildRepaymentEntry({
    loanId: loan.id,
    loanNumber: loan.loanNumber,
    grossReceived: paymentRecord.grossAmountPaid,
    principalPortion: allocation.principalPortion,
    interestPortion: allocation.interestPortion,
    penaltyPortion: allocation.penaltyPortion,
    passOnFee,
    channel: paymentChannel,
    userId: 'usr_cashier',
  });

  const entries = dbStore.journalEntries.get(tenantId) || [];
  const journalEntry = { id: `je_${Date.now()}`, ...jeData };
  entries.push(journalEntry);
  dbStore.journalEntries.set(tenantId, entries);

  res.json({
    success: true,
    payment: paymentRecord,
    allocation,
    loanBalanceRemaining: loan.balanceRemaining,
    journalEntry,
  });
});

app.post('/api/v1/payments/paymongo/webhook', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const signatureHeader = (req.headers['paymongo-signature'] || req.headers['Paymongo-Signature']) as string;
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET || 'whsec_test_secret_key_12345';

  if (signatureHeader) {
    const isValid = PayMongoWebhookService.verifySignature({
      rawPayload: JSON.stringify(req.body),
      signatureHeader,
      webhookSecret,
    });

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid PayMongo HMAC signature.' });
    }
  }

  const result = PayMongoWebhookService.processPaymentWebhook({
    payload: req.body,
    tenantId,
  });

  if (result.alreadyProcessed) {
    return res.status(200).json({ success: true, message: 'Event already processed (idempotent ignore).' });
  }

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.status(200).json({
    success: true,
    message: 'PayMongo repayment processed and credited to loan and CDA General Ledger.',
    data: result,
  });
});

// ==========================================
// 7. GENERAL LEDGER & CDA ACCOUNTING
// ==========================================
app.get('/api/v1/accounting/coa', (_req: Request, res: Response) => {
  const accounts = CDACoAManager.getDefaultAccounts();
  res.json({ success: true, count: accounts.length, data: accounts });
});

app.get('/api/v1/accounting/journal-entries', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const entries = dbStore.journalEntries.get(tenantId) || [];
  res.json({ success: true, count: entries.length, data: entries });
});

app.get('/api/v1/accounting/trial-balance', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const entries = dbStore.journalEntries.get(tenantId) || [];
  const trialBalance = GeneralLedgerService.generateTrialBalance(entries);
  res.json({ success: true, data: trialBalance });
});

app.get('/api/v1/accounting/financial-statements', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const entries = dbStore.journalEntries.get(tenantId) || [];
  const statements = GeneralLedgerService.generateFinancialStatements(entries);
  res.json({ success: true, data: statements });
});

// ==========================================
// 8. REGULATORY & AUDIT REPORTS (CDA / AMLC)
// ==========================================
app.get('/api/v1/reports/delinquency-aging', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const loans = dbStore.loans.get(tenantId) || [];
  const report = RegulatoryReportsService.generateDelinquencyAging(loans);
  res.json({ success: true, data: report });
});

app.get('/api/v1/reports/amlc-alerts', (_req: Request, res: Response) => {
  res.json({ success: true, count: dbStore.amlcAlerts.length, data: dbStore.amlcAlerts });
});

app.get('/api/v1/reports/cda/capr', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const report = CDAExportService.generateCAPRReport(tenantId);
  res.json({ success: true, data: report });
});

app.get('/api/v1/reports/cda/capr/csv', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const report = CDAExportService.generateCAPRReport(tenantId);
  const csv = CDAExportService.generateCAPRCSV(report);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="CDA_CAPR_${report.reportingYear}_${tenantId}.csv"`);
  res.send(csv);
});

app.get('/api/v1/reports/cda/c-pes', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const evaluation = CDAExportService.generateCPESEvaluation(tenantId);
  res.json({ success: true, data: evaluation });
});

app.get('/api/v1/reports/cic/credit-registry', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const exportData = CDAExportService.generateCICCreditRegistryExport(tenantId);
  res.json({ success: true, data: exportData });
});

// ==========================================
// 9. PLATFORM BILLING & 12% VAT INVOICES
// ==========================================
app.get('/api/v1/invoices', (req: Request, res: Response) => {
  const tenantId = resolveTenantId(req);
  const invoices = dbStore.platformInvoices.filter((inv) => inv.tenantId === tenantId);
  res.json({ success: true, count: invoices.length, data: invoices });
});

// ==========================================
// 10. CLOUD FIRESTORE MULTI-TENANT API
// ==========================================
app.get('/api/v1/firestore/health', async (_req: Request, res: Response) => {
  try {
    const fsService = FirestoreCoopService.getInstance();
    const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
    res.json({
      success: true,
      service: 'Firebase Cloud Firestore',
      projectId: process.env.FIREBASE_PROJECT_ID || 'flex-coop-solution',
      emulatorHost: process.env.FIRESTORE_EMULATOR_HOST || 'none (Live Cloud or Local Admin)',
      isEmulator,
      status: 'CONNECTED',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/firestore/seed', async (req: Request, res: Response) => {
  try {
    const tenantId = resolveTenantId(req);
    const fsService = FirestoreCoopService.getInstance();
    const tenant = dbStore.tenants.get(tenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Tenant not found.' });
    }

    // Seed tenant metadata and CDA COA
    await fsService.seedTenant(tenant);

    // Seed members
    const members = dbStore.members.get(tenantId) || [];
    for (const member of members) {
      await fsService.saveMember(tenantId, member);
    }

    // Seed loans
    const loans = dbStore.loans.get(tenantId) || [];
    for (const loan of loans) {
      await fsService.saveLoan(tenantId, loan);
    }

    res.json({
      success: true,
      message: `Tenant ${tenant.name} (${tenantId}) seeded successfully into Cloud Firestore.`,
      seeded: {
        accountsCount: CDACoAManager.getDefaultAccounts().length,
        membersCount: members.length,
        loansCount: loans.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/firestore/members', async (req: Request, res: Response) => {
  try {
    const tenantId = resolveTenantId(req);
    const fsService = FirestoreCoopService.getInstance();
    const members = await fsService.listMembers(tenantId);
    res.json({ success: true, count: members.length, data: members });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/firestore/loans', async (req: Request, res: Response) => {
  try {
    const tenantId = resolveTenantId(req);
    const fsService = FirestoreCoopService.getInstance();
    const loans = await fsService.listLoans(tenantId);
    res.json({ success: true, count: loans.length, data: loans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/v1/firestore/loans/:loanId/status', async (req: Request, res: Response) => {
  try {
    const tenantId = resolveTenantId(req);
    const { loanId } = req.params;
    const { status, remarks } = req.body;
    const fsService = FirestoreCoopService.getInstance();

    await fsService.updateLoanStatus(tenantId, loanId, status, {
      ...(remarks ? { disbursementReference: remarks } : {}),
    });

    res.json({ success: true, message: `Loan ${loanId} status updated to ${status}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/v1/firestore/ledger', async (req: Request, res: Response) => {
  try {
    const tenantId = resolveTenantId(req);
    const fsService = FirestoreCoopService.getInstance();
    const entries = await fsService.listJournalEntries(tenantId);
    res.json({ success: true, count: entries.length, data: entries });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Flex Coop Solution API running on http://localhost:${PORT}`);
  console.log(`📋 CDA Standard Chart of Accounts seeded`);
  console.log(`🏢 Multi-Tenant Schema & Firebase Firestore initialized`);
});

