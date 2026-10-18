import {
  OperatorOverviewMetrics,
  PlatformCreditTransaction,
  PlatformCreditTransactionType,
  SystemBroadcast,
  Tenant,
  TenantFleetSummary,
  TenantStatus,
  CooperativeRegistration,
  RegistrationStatus,
  RegistrationEmailNotification,
  OperatorAccount,
  OperatorSession,
  OperatorOtpResponse,
} from '@flexcoop/shared-types';
import { dbStore } from '../../core/store';
import { MailerService } from '../../core/mailer.service';

export class OperatorService {
  private static isInitialized = false;

  /**
   * Initializes default platform credit balances and seed tenants for the operator fleet
   */
  public static ensureInitialized() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    // Only seed mock demonstration tenant records in test environment
    if (process.env.NODE_ENV === 'test') {
      if (dbStore.tenants.size < 3) {
        const maharlikaId = 'tenant_maharlika_002';
        if (!dbStore.tenants.has(maharlikaId)) {
          const maharlika: Tenant = {
            id: maharlikaId,
            name: 'Maharlika Agrarian Reform Cooperative',
            slug: 'maharlika',
            cdaRegistrationNumber: 'CDA-R03-2023-01044',
            tin: '210-994-382-000',
            contactEmail: 'gm@maharlikacoop.ph',
            contactPhone: '+63 920 441 9901',
            adminFirstName: 'Danilo',
            adminLastName: 'Macapagal',
            address: 'Barangay San Fabian, Guimba, Nueva Ecija',
            billingMode: 'STANDARD_UNIFIED',
            status: 'ACTIVE',
            createdAt: '2026-02-01T08:00:00Z',
            updatedAt: '2026-02-01T08:00:00Z',
          };
          dbStore.tenants.set(maharlikaId, maharlika);
        }

        const silanganId = 'tenant_silangan_003';
        if (!dbStore.tenants.has(silanganId)) {
          const silangan: Tenant = {
            id: silanganId,
            name: 'Silangan Community Credit Cooperative',
            slug: 'silangan',
            cdaRegistrationNumber: 'CDA-R04A-2022-00412',
            tin: '118-204-559-000',
            contactEmail: 'manager@silangancoop.org',
            contactPhone: '+63 918 332 1092',
            adminFirstName: 'Corazon',
            adminLastName: 'Aquino-Santos',
            address: 'Poblacion 2, Silang, Cavite',
            billingMode: 'STANDARD_UNIFIED',
            status: 'ACTIVE',
            createdAt: '2026-03-10T08:00:00Z',
            updatedAt: '2026-03-10T08:00:00Z',
          };
          dbStore.tenants.set(silanganId, silangan);
        }
      }

      // Initialize default credit balances for test tenancies
      const tenantBayani = 'tenant_bayani_001';
      if (!dbStore.platformCredits.has(tenantBayani)) {
        dbStore.platformCredits.set(tenantBayani, 4250.0);
      }
      const tenantMaharlika = 'tenant_maharlika_002';
      if (!dbStore.platformCredits.has(tenantMaharlika)) {
        dbStore.platformCredits.set(tenantMaharlika, 350.0);
      }
      const tenantSilangan = 'tenant_silangan_003';
      if (!dbStore.platformCredits.has(tenantSilangan)) {
        dbStore.platformCredits.set(tenantSilangan, 8900.0);
      }

      // Seed test pending registration in test environment
      if (dbStore.coopRegistrations.length === 0) {
        dbStore.coopRegistrations.push({
          id: 'REG-2026-8914',
          name: 'Pag-asa Agricultural Development Cooperative',
          coopType: 'AGRICULTURAL',
          slug: 'pag-asa',
          subdomain: 'pag-asa-coop.tuntongtech.com',
          cdaRegistrationNumber: 'CDA-R02-2024-00814',
          tin: '401-829-105-000',
          contactEmail: 'contact@pagasacoop.ph',
          contactPhone: '+63 917 882 4410',
          address: 'Sitio Maligaya, Ilagan, Isabela',
          adminFirstName: 'Danilo',
          adminMiddleName: 'Ramos',
          adminLastName: 'Bautista',
          adminEmail: 'danilo.bautista@pagasacoop.ph',
          validIdFileName: 'Danilo_Bautista_National_ID.pdf',
          validIdFileSizeMb: '2.40',
          validIdUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
          status: 'PENDING_REVIEW',
          submittedAt: '2026-10-18T07:15:00Z',
        });
      }
    }
  }

  /**
   * Calculates comprehensive multi-tenant fleet summaries for the Operator Portal
   */
  public static getTenantFleetSummaries(): TenantFleetSummary[] {
    this.ensureInitialized();
    const summaries: TenantFleetSummary[] = [];

    for (const [tenantId, tenant] of dbStore.tenants.entries()) {
      const members = dbStore.members.get(tenantId) || [];
      const totalMembers = members.length;
      const activeMembers = members.filter((m) => m.status === 'ACTIVE' || m.kycStatus === 'VERIFIED').length;
      const pendingMembers = members.filter((m) => m.status === 'PENDING_APPROVAL').length;
      
      // Free Tier Rule: first 15 members free, sequence > 15 billed at ₱50
      const freeTierMembers = Math.min(15, totalMembers);
      const billedMembers = Math.max(0, totalMembers - 15);

      const loans = dbStore.loans.get(tenantId) || [];
      const totalLoansDisbursed = loans.filter((l) => l.status === 'DISBURSED' || l.status === 'APPROVED').length;
      const totalLoanVolume = loans
        .filter((l) => l.status === 'DISBURSED' || l.status === 'APPROVED')
        .reduce((sum, l) => sum + (l.principalAmount || 0), 0);
      
      // 1.0% Technology Fee generated
      const totalTechFeesGenerated = Math.round(totalLoanVolume * 0.01 * 100) / 100;

      const creditBalance = dbStore.platformCredits.get(tenantId) ?? 0.0;
      
      // Calculate escrow float for tenant
      let escrowFloat = dbStore.escrowFloats?.get(tenantId) ?? 0.0;
      if (!dbStore.escrowFloats?.has(tenantId)) {
        if (tenantId === 'tenant_bayani_001') {
          escrowFloat = 48470.0;
        } else if (tenantId === 'tenant_maharlika_002') {
          escrowFloat = 12100.0;
        } else if (tenantId === 'tenant_silangan_003') {
          escrowFloat = 26500.0;
        } else {
          escrowFloat = 0.0;
        }
      }

      // Storage estimate: based on KYC documents (capped at 5MB per upload)
      const kycCount = (dbStore.kycDocs.get(tenantId) || []).length;
      const storageUsedMb = Math.round((kycCount * 3.8 + totalMembers * 0.4 + 45.0) * 10) / 10;

      // Health score based on credit and status
      let healthScore = 98;
      if (tenant.status === 'SUSPENDED') {
        healthScore = 40;
      } else if (creditBalance < 1000) {
        healthScore = 82; // Low credit warning (< ₱1,000 threshold)
      }

      summaries.push({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        subdomain: `${tenant.slug}-coop.tuntongtech.com`,
        cdaRegistrationNumber: tenant.cdaRegistrationNumber,
        tin: tenant.tin,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        adminName: `${tenant.adminFirstName || 'Admin'} ${tenant.adminLastName || 'Officer'}`.trim(),
        billingMode: tenant.billingMode,
        status: tenant.status,
        totalMembers,
        activeMembers,
        pendingMembers,
        freeTierMembers,
        billedMembers,
        platformCreditBalance: creditBalance,
        escrowFloatBalance: escrowFloat,
        totalLoansDisbursed,
        totalLoanVolume,
        totalTechFeesGenerated,
        lastBillingDate: '2026-10-01',
        storageUsedMb,
        storageQuotaMb: 10240, // 10 GB quota
        databaseSchema: `tenant_${tenant.slug}`,
        healthScore,
        lastActiveAt: new Date().toISOString(),
        createdAt: tenant.createdAt,
      });
    }

    return summaries;
  }

  /**
   * Global Operator Overview Aggregates across the entire cooperative fleet
   */
  public static getOperatorOverviewMetrics(): OperatorOverviewMetrics {
    const fleet = this.getTenantFleetSummaries();

    const totalTenants = fleet.length;
    const activeTenants = fleet.filter((t) => t.status === 'ACTIVE').length;
    const suspendedTenants = fleet.filter((t) => t.status === 'SUSPENDED').length;
    const totalFleetMembers = fleet.reduce((sum, t) => sum + t.totalMembers, 0);
    const totalFleetLoanVolume = fleet.reduce((sum, t) => sum + t.totalLoanVolume, 0);
    const totalEscrowFloat = fleet.reduce((sum, t) => sum + t.escrowFloatBalance, 0);
    const totalPlatformCreditPool = fleet.reduce((sum, t) => sum + t.platformCreditBalance, 0);
    
    // Tech fee revenue (1% of loan volume + billed member fees @ ₱44.64 net base)
    const totalBilledMembers = fleet.reduce((sum, t) => sum + t.billedMembers, 0);
    const grossTechFee = Math.round(totalFleetLoanVolume * 0.01 + totalBilledMembers * 50);
    const netBase = Math.round((grossTechFee / 1.12) * 100) / 100;
    const outputVat = Math.round((grossTechFee - netBase) * 100) / 100;

    const totalStorageUsedMb = fleet.reduce((sum, t) => sum + t.storageUsedMb, 0);
    const totalStorageUsedGb = Math.round((totalStorageUsedMb / 1024) * 100) / 100;
    const lowCreditTenantsCount = fleet.filter((t) => t.platformCreditBalance < 1000).length;

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalFleetMembers,
      totalFleetLoanVolume,
      totalEscrowFloat,
      totalPlatformCreditPool,
      monthlyTechFeeRevenue: netBase,
      monthlyOutputVatPayable: outputVat,
      totalStorageUsedGb,
      lowCreditTenantsCount,
    };
  }

  /**
   * Adjusts a tenant's available platform credit balance
   */
  public static adjustPlatformCredit(params: {
    tenantId: string;
    amount: number;
    type: PlatformCreditTransactionType;
    reference: string;
    notes: string;
    performedBy: string;
  }): { success: boolean; newBalance: number; transaction: PlatformCreditTransaction } {
    this.ensureInitialized();
    const currentBalance = dbStore.platformCredits.get(params.tenantId) ?? 0;
    const newBalance = Math.round((currentBalance + params.amount) * 100) / 100;

    dbStore.platformCredits.set(params.tenantId, newBalance);

    const tenant = dbStore.tenants.get(params.tenantId);
    const tx: PlatformCreditTransaction = {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      tenantName: tenant?.name || params.tenantId,
      type: params.type,
      amount: params.amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      reference: params.reference,
      notes: params.notes,
      performedBy: params.performedBy,
      createdAt: new Date().toISOString(),
    };

    dbStore.creditTransactions.unshift(tx);

    return {
      success: true,
      newBalance,
      transaction: tx,
    };
  }

  /**
   * Updates tenant lifecycle status (ACTIVE, SUSPENDED, GRACE_PERIOD)
   */
  public static updateTenantStatus(tenantId: string, status: TenantStatus, reason?: string): boolean {
    this.ensureInitialized();
    const tenant = dbStore.tenants.get(tenantId);
    if (!tenant) return false;

    tenant.status = status;
    tenant.updatedAt = new Date().toISOString();
    dbStore.tenants.set(tenantId, tenant);
    return true;
  }

  /**
   * System Broadcast Management
   */
  public static createBroadcast(broadcast: Omit<SystemBroadcast, 'id' | 'createdAt'>): SystemBroadcast {
    const record: SystemBroadcast = {
      ...broadcast,
      id: `bc_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    dbStore.systemBroadcasts.unshift(record);
    return record;
  }

  public static getActiveBroadcasts(): SystemBroadcast[] {
    return dbStore.systemBroadcasts.filter((b) => b.isActive);
  }

  /**
   * Cooperative Registrations Onboarding & Governance
   */
  public static listRegistrations(): CooperativeRegistration[] {
    this.ensureInitialized();
    return dbStore.coopRegistrations;
  }

  public static getRegistrationById(id: string): CooperativeRegistration | undefined {
    this.ensureInitialized();
    return dbStore.coopRegistrations.find((r) => r.id === id);
  }

  public static submitRegistration(
    data: Omit<CooperativeRegistration, 'id' | 'status' | 'submittedAt' | 'subdomain'>
  ): CooperativeRegistration {
    this.ensureInitialized();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = `REG-2026-${randomSuffix}`;
    const subdomain = `${data.slug}-coop.tuntongtech.com`;

    const record: CooperativeRegistration = {
      ...data,
      id,
      subdomain,
      status: 'PENDING_REVIEW',
      submittedAt: new Date().toISOString(),
    };

    dbStore.coopRegistrations.unshift(record);
    return record;
  }

  public static approveRegistration(
    id: string,
    reviewedBy: string = 'Tuntong Tech Operator'
  ): { success: boolean; registration?: CooperativeRegistration; tenant?: Tenant; error?: string } {
    this.ensureInitialized();
    const reg = dbStore.coopRegistrations.find((r) => r.id === id);
    if (!reg) {
      return { success: false, error: 'Registration application not found.' };
    }
    if (reg.status === 'APPROVED') {
      return { success: false, error: 'Registration application is already approved.' };
    }

    // Generate secure 1-time password for admin initial sign-in
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randStr = '';
    for (let i = 0; i < 6; i++) {
      randStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const oneTimePassword = `TT-${randStr}#${Math.floor(10 + Math.random() * 90)}`;
    const subdomain = `${reg.slug}-coop.tuntongtech.com`;

    // Provision new tenant in live fleet
    const tenantId = `tenant_${reg.slug}_${Math.random().toString(36).substring(2, 6)}`;
    const tenant: Tenant = {
      id: tenantId,
      name: reg.name,
      slug: reg.slug,
      cdaRegistrationNumber: reg.cdaRegistrationNumber,
      tin: reg.tin,
      contactEmail: reg.contactEmail,
      contactPhone: reg.contactPhone || '+63 900 000 0000',
      adminFirstName: reg.adminFirstName,
      adminMiddleName: reg.adminMiddleName,
      adminLastName: reg.adminLastName,
      validIdUrl: reg.validIdUrl,
      address: reg.address || 'Philippines',
      billingMode: 'STANDARD_UNIFIED',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.tenants.set(tenantId, tenant);
    dbStore.platformCredits.set(tenantId, 0.0); // A new approved coop starts strictly with 0 Available Credit
    dbStore.escrowFloats.set(tenantId, 0.0);    // A new approved coop starts strictly with 0 Escrow Float
    dbStore.members.set(tenantId, []);
    dbStore.loans.set(tenantId, []);
    dbStore.journalEntries.set(tenantId, []);
    dbStore.shareAccounts.set(tenantId, []);
    dbStore.savingsAccounts.set(tenantId, []);

    // Create Email Notification payload from support@tuntongtech.com
    const emailSubject = `[Tuntong Tech] Congratulations! Your Cooperative Registration has been Approved (${reg.name})`;
    const emailBody = `Dear ${reg.adminFirstName} ${reg.adminLastName},

We are pleased to inform you that your cooperative onboarding application (${reg.id}) for "${reg.name}" has been officially APPROVED by Tuntong Tech.

Your dedicated cooperative instance has been provisioned and is now live under strict CDA double-entry and NPC data privacy compliance.

Official Cooperative Portal:
Domain: https://${subdomain}

Primary Administrator Login Credentials:
Username (Email): ${reg.adminEmail}
1-Time Temporary Password: ${oneTimePassword}

IMPORTANT SECURITY NOTICE: This 1-time password is valid for your initial sign-in only. You will be required to change your password immediately upon your first login.

If you have questions, require onboarding training, or need data migration assistance, please reach out to our engineering support desk at support@tuntongtech.com.

Sincerely,
Tuntong Tech Support Team
support@tuntongtech.com
https://tuntongtech.com`;

    const emailNotification: RegistrationEmailNotification = {
      from: 'support@tuntongtech.com',
      to: reg.adminEmail,
      subject: emailSubject,
      sentAt: new Date().toISOString(),
      body: emailBody,
      domain: `https://${subdomain}`,
      temporaryPassword: oneTimePassword,
    };

    reg.status = 'APPROVED';
    reg.reviewedAt = new Date().toISOString();
    reg.reviewedBy = reviewedBy;
    reg.oneTimePassword = oneTimePassword;
    reg.emailNotification = emailNotification;

    // Dispatch real email via Zoho SMTP
    MailerService.sendMail({
      to: reg.adminEmail,
      subject: emailSubject,
      text: emailBody,
    }).catch((err) => console.error('[MAILER ERROR] approveRegistration:', err));

    return {
      success: true,
      registration: reg,
      tenant,
    };
  }

  public static rejectRegistration(
    id: string,
    reason: string,
    reviewedBy: string = 'Tuntong Tech Operator'
  ): { success: boolean; registration?: CooperativeRegistration; error?: string } {
    this.ensureInitialized();
    const reg = dbStore.coopRegistrations.find((r) => r.id === id);
    if (!reg) {
      return { success: false, error: 'Registration application not found.' };
    }

    const emailSubject = `[Tuntong Tech] Update on your Cooperative Registration Application (${reg.name})`;
    const emailBody = `Dear ${reg.adminFirstName} ${reg.adminLastName},

Thank you for your application (${reg.id}) to onboard "${reg.name}" onto Tuntong Tech.

After reviewing your submitted credentials and government-issued identification, our compliance team is unable to approve your registration at this time due to the following reason:

${reason}

You may re-apply with the corrected documentation at https://coop.tuntongtech.com/coop-register or reply directly to support@tuntongtech.com if you require assistance.

Sincerely,
Tuntong Tech Compliance Team
support@tuntongtech.com
https://tuntongtech.com`;

    const emailNotification: RegistrationEmailNotification = {
      from: 'support@tuntongtech.com',
      to: reg.adminEmail,
      subject: emailSubject,
      sentAt: new Date().toISOString(),
      body: emailBody,
    };

    reg.status = 'REJECTED';
    reg.rejectionReason = reason;
    reg.reviewedAt = new Date().toISOString();
    reg.reviewedBy = reviewedBy;
    reg.emailNotification = emailNotification;

    // Dispatch real email via Zoho SMTP
    MailerService.sendMail({
      to: reg.adminEmail,
      subject: emailSubject,
      text: emailBody,
    }).catch((err) => console.error('[MAILER ERROR] rejectRegistration:', err));

    return {
      success: true,
      registration: reg,
    };
  }

  public static removeRegistration(id: string): boolean {
    this.ensureInitialized();
    const idx = dbStore.coopRegistrations.findIndex((r) => r.id === id);
    if (idx !== -1) {
      dbStore.coopRegistrations.splice(idx, 1);
      return true;
    }
    return false;
  }

  public static clearAllRegistrations(): void {
    this.ensureInitialized();
    dbStore.coopRegistrations = [];
  }

  public static readonly DEFAULT_OPERATOR: OperatorAccount = {
    username: 'tuntongtech',
    name: 'Felix Echano',
    email: 'felix.echano@tuntongtech.com',
    role: 'PLATFORM_SUPER_OPERATOR',
  };

  private static activeOtps: Map<string, { otp: string; expiresAt: number; attempts: number }> = new Map();
  private static activeSessions: Map<string, OperatorSession> = new Map();

  /**
   * Generates a 6-digit One-Time PIN (OTP) and dispatches an official login email from support@tuntongtech.com
   */
  public static requestOperatorOtp(usernameOrEmail: string): OperatorOtpResponse {
    const query = (usernameOrEmail || '').trim().toLowerCase();
    const op = this.DEFAULT_OPERATOR;

    if (query !== op.username.toLowerCase() && query !== op.email.toLowerCase()) {
      return {
        success: false,
        message: 'Invalid operator username or email address.',
        error: 'OPERATOR_NOT_FOUND',
      };
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.activeOtps.set(op.username, {
      otp,
      expiresAt,
      attempts: 0,
    });

    const emailSubject = `[Tuntong Tech Operator] Your 1-Time Sign-In PIN: ${otp}`;
    const emailBody = `Dear ${op.name},

A secure operator sign-in request was initiated for your Tuntong Tech Operator Control Plane account.

Your One-Time PIN (OTP) is:

    ${otp}

• Security Details:
- Operator Username: ${op.username}
- Destination: ${op.email}
- Validity: 10 minutes (expires at ${new Date(expiresAt).toLocaleTimeString()})

IMPORTANT: Do not disclose this 6-digit PIN to anyone. Tuntong Tech support representatives will never ask for your authentication PIN.

Sincerely,
Tuntong Tech Security Desk
support@tuntongtech.com
https://tuntongtech.com`;

    console.log(`[OPERATOR OTP DISPATCH] PIN ${otp} sent to ${op.email} from support@tuntongtech.com`);

    // Dispatch real email via Zoho SMTP
    MailerService.sendMail({
      to: op.email,
      subject: emailSubject,
      text: emailBody,
    }).catch((err) => console.error('[MAILER ERROR] requestOperatorOtp:', err));

    return {
      success: true,
      message: `A One-Time PIN has been dispatched to ${op.email} from support@tuntongtech.com.`,
      email: op.email,
      username: op.username,
      otp, // included for audit/test verification
    };
  }

  /**
   * Verifies the One-Time PIN and issues an authenticated OperatorSession
   */
  public static verifyOperatorOtp(
    usernameOrEmail: string,
    inputOtp: string
  ): { success: boolean; session?: OperatorSession; error?: string } {
    const query = (usernameOrEmail || '').trim().toLowerCase();
    const op = this.DEFAULT_OPERATOR;

    if (query !== op.username.toLowerCase() && query !== op.email.toLowerCase()) {
      return { success: false, error: 'Invalid operator credentials.' };
    }

    const record = this.activeOtps.get(op.username);
    if (!record) {
      return { success: false, error: 'No active OTP request found. Please request a new PIN.' };
    }

    if (Date.now() > record.expiresAt) {
      this.activeOtps.delete(op.username);
      return { success: false, error: 'One-Time PIN has expired. Please request a new PIN.' };
    }

    if (record.attempts >= 5) {
      this.activeOtps.delete(op.username);
      return { success: false, error: 'Too many incorrect attempts. Please request a new PIN.' };
    }

    const cleanInput = (inputOtp || '').trim();
    if (cleanInput !== record.otp) {
      record.attempts += 1;
      return { success: false, error: `Invalid PIN. ${5 - record.attempts} attempt(s) remaining.` };
    }

    // OTP Verified! Invalidate consumed OTP
    this.activeOtps.delete(op.username);

    // Issue Operator Session
    const token = `opt_sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const session: OperatorSession = {
      token,
      username: op.username,
      name: op.name,
      email: op.email,
      role: op.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24-hour operator session
    };

    this.activeSessions.set(token, session);

    return {
      success: true,
      session,
    };
  }

  /**
   * Validates an active operator session token
   */
  public static validateOperatorSession(token: string): OperatorSession | null {
    if (!token) return null;
    const session = this.activeSessions.get(token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.activeSessions.delete(token);
      return null;
    }
    return session;
  }
}


