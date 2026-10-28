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
  Member,
} from '@flexcoop/shared-types';
import { dbStore, PlatformPaymentMethod, PlatformCreditTopupRequest } from '../../core/store';
import { MailerService } from '../../core/mailer.service';
import { FirestoreCoopService } from '../../core/firestore.service';
import { AuthService } from '../../core/auth';

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
        environment: tenant.environment || 'production',
        tag: tenant.tag || '',
        tags: tenant.tags || (tenant.tag ? [tenant.tag] : []),
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
    const durationDays = broadcast.durationDays || 45;
    // Auto-expire after 45 days from broadcast date by default
    const expiresAt = broadcast.expiresAt || new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const record: SystemBroadcast = {
      ...broadcast,
      id: `bc_${Date.now()}`,
      targetType: broadcast.targetType || (broadcast.targetTag ? 'TAG' : 'ALL'),
      targetTag: (broadcast.targetTag || '').trim(),
      durationDays,
      autoExpireDays: 45,
      expiresAt,
      createdAt: new Date().toISOString(),
    };
    dbStore.systemBroadcasts.unshift(record);
    return record;
  }

  public static getActiveBroadcasts(): SystemBroadcast[] {
    const now = new Date().toISOString();
    return dbStore.systemBroadcasts.filter((b) => {
      if (!b.isActive) return false;
      if (b.expiresAt && b.expiresAt <= now) return false;
      if (b.scheduledDate && b.scheduledDate > now) return false;
      return true;
    });
  }

  public static async toggleBroadcastActiveAsync(id: string): Promise<SystemBroadcast | null> {
    let broadcast = dbStore.systemBroadcasts.find((b) => b.id === id);
    if (!broadcast) {
      const all = await this.listBroadcastsAsync();
      broadcast = all.find((b) => b.id === id);
    }
    if (!broadcast) return null;
    broadcast.isActive = !broadcast.isActive;
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveBroadcast(broadcast);
    } catch (err) {
      console.warn('[OPERATOR] toggleBroadcastActiveAsync firestore error:', err);
    }
    return broadcast;
  }

  public static async updateTenantDetailsAsync(
    tenantId: string,
    details: { environment?: 'production' | 'testing'; tag?: string }
  ): Promise<any> {
    this.ensureInitialized();
    let tenant = dbStore.tenants.get(tenantId);
    if (!tenant) {
      try {
        const fs = FirestoreCoopService.getInstance();
        const firestoreTenant = await fs.getTenant(tenantId);
        if (firestoreTenant) tenant = firestoreTenant;
      } catch {}
    }
    if (!tenant) return null;

    if (details.environment !== undefined) {
      tenant.environment = details.environment;
    }
    if (details.tag !== undefined) {
      const cleanTag = details.tag.trim();
      tenant.tag = cleanTag;
      tenant.tags = cleanTag ? [cleanTag] : [];
    }
    tenant.updatedAt = new Date().toISOString();
    dbStore.tenants.set(tenantId, tenant);

    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveTenant(tenant);
    } catch (err) {
      console.warn('[OPERATOR] updateTenantDetailsAsync firestore error:', err);
    }

    return tenant;
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

    // Provision declared General Manager as Member #1 of the cooperative
    const gmFullName = [reg.adminFirstName, reg.adminMiddleName, reg.adminLastName].filter(Boolean).join(' ');
    const gmMemberId = 'MEM-2026-0001';
    const gmMemberNumber = 'MEM-2026-0001';

    const gmMember: Member = {
      id: gmMemberId,
      memberNumber: gmMemberNumber,
      firstName: reg.adminFirstName,
      middleName: reg.adminMiddleName,
      lastName: reg.adminLastName,
      email: reg.adminEmail,
      phone: reg.contactPhone || '+63 900 000 0000',
      birthdate: '1985-01-01',
      gender: 'OTHER',
      civilStatus: 'SINGLE',
      address: reg.address || 'Philippines',
      tin: reg.tin,
      position: 'General Manager',
      classification: 'REGULAR',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.members.set(tenantId, [gmMember]);
    dbStore.loans.set(tenantId, []);
    dbStore.journalEntries.set(tenantId, []);

    if (process.env.NODE_ENV !== 'test') {
      try {
        const fsService = FirestoreCoopService.getInstance();
        fsService.saveMember(tenantId, gmMember).catch(() => {});
      } catch {}
    }

    // Provision ONLY the Primary Administrator from coop-register as the initial staff user
    const adminFullName = [reg.adminFirstName, reg.adminMiddleName, reg.adminLastName].filter(Boolean).join(' ') || reg.adminFirstName || 'Primary Administrator';
    const adminEmail = (reg.adminEmail || reg.contactEmail).trim().toLowerCase();
    const adminUsername = adminEmail.split('@')[0] || 'admin';
    const adminUserId = `usr_admin_${reg.slug}_01`;

    AuthService.addStaffAccount({
      id: adminUserId,
      email: adminEmail,
      fullName: adminFullName,
      role: 'GENERAL_MANAGER',
      tenantId: tenant.id,
      roleTitle: 'General Manager / Primary Administrator',
      status: 'ACTIVE',
      username: adminUsername,
    });

    // Initial Share Capital and Savings Account for the General Manager
    dbStore.shareAccounts.set(tenantId, [
      {
        id: `sha_${gmMemberId}`,
        memberId: gmMemberId,
        memberNumber: gmMemberNumber,
        memberName: gmFullName,
        sharesCount: 100,
        paidUpAmount: 10000,
        parValue: 100,
        subscribedShares: 100,
        subscribedAmount: 10000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ]);

    dbStore.savingsAccounts.set(tenantId, [
      {
        id: `sav_${gmMemberId}`,
        memberId: gmMemberId,
        memberNumber: gmMemberNumber,
        memberName: gmFullName,
        accountNumber: `SA-${reg.slug.toUpperCase()}-0001`,
        balance: 5000,
        interestRate: 0.02,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any,
    ]);

    // Create Email Notification payload from support@tuntongtech.com
    const emailSubject = `[Tuntong Tech] Congratulations! Your Cooperative Registration has been Approved (${reg.name})`;
    const emailBody = `Dear ${reg.adminFirstName} ${reg.adminLastName},

We are pleased to inform you that your cooperative onboarding application (${reg.id}) for "${reg.name}" has been officially APPROVED by Tuntong Tech.

Your dedicated cooperative instance has been provisioned and is now live under strict CDA double-entry and NPC data privacy compliance.

Official Cooperative Portals:
- Administrative Control Plane: https://${subdomain}/login
- Member Self-Service Portal: https://${subdomain}/member/login

Primary Administrator & Member Credentials:
- General Manager & Member ID: ${gmMemberNumber}
- Username (Email): ${reg.adminEmail}
- 1-Time Temporary Password: ${oneTimePassword}

NOTE: As the declared General Manager, you are automatically registered as Member #1 of "${reg.name}" and granted full access to the Cooperative Member Portal with initialized share capital and savings accounts.

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

  // ==========================================================================
  // CLOUD FIRESTORE OPERATOR ASYNC IMPLEMENTATIONS (PERSISTENT MULTI-INSTANCE)
  // ==========================================================================

  public static async listOperatorsAsync(): Promise<OperatorAccount[]> {
    try {
      const fs = FirestoreCoopService.getInstance();
      let ops = await fs.listOperators();
      if (ops.length === 0) {
        await fs.saveOperator(this.DEFAULT_OPERATOR);
        ops = [this.DEFAULT_OPERATOR];
      }
      return ops;
    } catch (err) {
      console.warn('[OPERATOR] listOperatorsAsync error, falling back:', err);
      return [this.DEFAULT_OPERATOR];
    }
  }

  public static async createOperatorAsync(operator: OperatorAccount): Promise<OperatorAccount> {
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveOperator(operator);
    } catch (err) {
      console.warn('[OPERATOR] createOperatorAsync error:', err);
    }
    return operator;
  }

  public static async deleteOperatorAsync(username: string): Promise<boolean> {
    try {
      const fs = FirestoreCoopService.getInstance();
      return await fs.deleteOperator(username);
    } catch (err) {
      console.warn('[OPERATOR] deleteOperatorAsync error:', err);
      return false;
    }
  }

  public static async requestOperatorOtpAsync(usernameOrEmail: string): Promise<OperatorOtpResponse> {
    const query = (usernameOrEmail || '').trim().toLowerCase();
    let op: OperatorAccount | null = null;

    try {
      const fs = FirestoreCoopService.getInstance();
      op = await fs.getOperator(query);
      if (!op && (query === this.DEFAULT_OPERATOR.username.toLowerCase() || query === this.DEFAULT_OPERATOR.email.toLowerCase())) {
        await fs.saveOperator(this.DEFAULT_OPERATOR);
        op = this.DEFAULT_OPERATOR;
      }
    } catch (err) {
      console.warn('[OPERATOR] getOperator firestore query error:', err);
      if (query === this.DEFAULT_OPERATOR.username.toLowerCase() || query === this.DEFAULT_OPERATOR.email.toLowerCase()) {
        op = this.DEFAULT_OPERATOR;
      }
    }

    if (!op) {
      return {
        success: false,
        message: 'Invalid operator username or email address.',
        error: 'OPERATOR_NOT_FOUND',
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Cache locally
    this.activeOtps.set(op.username, { otp, expiresAt, attempts: 0 });

    // Store in Cloud Firestore
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveOperatorOtp(op.username, {
        otp,
        expiresAt,
        attempts: 0,
        email: op.email,
      });
    } catch (err) {
      console.warn('[OPERATOR] saveOperatorOtp firestore error:', err);
    }

    const emailSubject = `[Tuntong Tech Operator] Your 1-Time Sign-In PIN: ${otp}`;
    const emailBody = `Dear ${op.name},\n\nA secure operator sign-in request was initiated for your Tuntong Tech Operator Control Plane account.\n\nYour One-Time PIN (OTP) is:\n\n    ${otp}\n\n• Security Details:\n- Operator Username: ${op.username}\n- Destination: ${op.email}\n- Validity: 10 minutes (expires at ${new Date(expiresAt).toLocaleTimeString()})\n\nIMPORTANT: Do not disclose this 6-digit PIN to anyone. Tuntong Tech support representatives will never ask for your authentication PIN.\n\nSincerely,\nTuntong Tech Security Desk\nsupport@tuntongtech.com\nhttps://tuntongtech.com`;

    console.log(`[OPERATOR OTP DISPATCH] PIN ${otp} sent to ${op.email} from support@tuntongtech.com`);

    try {
      const mailRes = await MailerService.sendMail({
        to: op.email,
        subject: emailSubject,
        text: emailBody,
      });
      if (!mailRes.success) {
        console.error('[MAILER ERROR] requestOperatorOtpAsync:', mailRes.error);
      }
    } catch (err) {
      console.error('[MAILER ERROR] requestOperatorOtpAsync caught:', err);
    }

    return {
      success: true,
      message: `A One-Time PIN has been dispatched to ${op.email} from support@tuntongtech.com.`,
      email: op.email,
      username: op.username,
      otp,
    };
  }

  public static async verifyOperatorOtpAsync(
    usernameOrEmail: string,
    inputOtp: string
  ): Promise<{ success: boolean; session?: OperatorSession; error?: string }> {
    const query = (usernameOrEmail || '').trim().toLowerCase();
    let op: OperatorAccount | null = null;

    try {
      const fs = FirestoreCoopService.getInstance();
      op = await fs.getOperator(query);
      if (!op && (query === this.DEFAULT_OPERATOR.username.toLowerCase() || query === this.DEFAULT_OPERATOR.email.toLowerCase())) {
        op = this.DEFAULT_OPERATOR;
      }
    } catch {
      if (query === this.DEFAULT_OPERATOR.username.toLowerCase() || query === this.DEFAULT_OPERATOR.email.toLowerCase()) {
        op = this.DEFAULT_OPERATOR;
      }
    }

    if (!op) {
      return { success: false, error: 'Invalid operator credentials.' };
    }

    let record = this.activeOtps.get(op.username);
    try {
      const fs = FirestoreCoopService.getInstance();
      const fsOtp = await fs.getOperatorOtp(op.username);
      if (fsOtp) {
        record = fsOtp;
      }
    } catch {}

    if (!record) {
      return { success: false, error: 'No active OTP request found. Please request a new PIN.' };
    }

    if (Date.now() > record.expiresAt) {
      this.activeOtps.delete(op.username);
      try {
        await FirestoreCoopService.getInstance().deleteOperatorOtp(op.username);
      } catch {}
      return { success: false, error: 'One-Time PIN has expired. Please request a new PIN.' };
    }

    if (record.attempts >= 5) {
      this.activeOtps.delete(op.username);
      try {
        await FirestoreCoopService.getInstance().deleteOperatorOtp(op.username);
      } catch {}
      return { success: false, error: 'Too many incorrect attempts. Please request a new PIN.' };
    }

    const cleanInput = (inputOtp || '').trim();
    if (cleanInput !== record.otp) {
      record.attempts += 1;
      this.activeOtps.set(op.username, record);
      try {
        await FirestoreCoopService.getInstance().saveOperatorOtp(op.username, { ...record, email: op.email });
      } catch {}
      return { success: false, error: `Invalid PIN. ${5 - record.attempts} attempt(s) remaining.` };
    }

    // OTP Verified!
    this.activeOtps.delete(op.username);
    try {
      await FirestoreCoopService.getInstance().deleteOperatorOtp(op.username);
    } catch {}

    const token = `opt_sess_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const session: OperatorSession = {
      token,
      username: op.username,
      name: op.name,
      email: op.email,
      role: op.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    this.activeSessions.set(token, session);
    try {
      await FirestoreCoopService.getInstance().saveOperatorSession(session);
    } catch (err) {
      console.warn('[OPERATOR] saveOperatorSession firestore error:', err);
    }

    return {
      success: true,
      session,
    };
  }

  public static async validateOperatorSessionAsync(token: string): Promise<OperatorSession | null> {
    if (!token) return null;
    let session = this.activeSessions.get(token);
    if (!session) {
      try {
        const fsSession = await FirestoreCoopService.getInstance().getOperatorSession(token);
        if (fsSession) {
          session = fsSession;
          this.activeSessions.set(token, session);
        }
      } catch {}
    }

    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.activeSessions.delete(token);
      try {
        await FirestoreCoopService.getInstance().deleteOperatorSession(token);
      } catch {}
      return null;
    }
    return session;
  }

  /**
   * Retrieves tenant fleet summaries grounded in Firebase Firestore
   */
  public static async getTenantFleetSummariesAsync(): Promise<TenantFleetSummary[]> {
    this.ensureInitialized();
    try {
      const fs = FirestoreCoopService.getInstance();
      const firestoreTenants = await fs.listTenants();

      if (firestoreTenants && firestoreTenants.length > 0) {
        // Sync into dbStore
        for (const t of firestoreTenants) {
          dbStore.tenants.set(t.id, t);
          if ((t as any).platformCreditBalance !== undefined) {
            dbStore.platformCredits.set(t.id, (t as any).platformCreditBalance);
          }
          if ((t as any).escrowFloatBalance !== undefined) {
            dbStore.escrowFloats?.set(t.id, (t as any).escrowFloatBalance);
          }
        }

        const summaries: TenantFleetSummary[] = [];
        for (const tenant of firestoreTenants) {
          let members: Member[] = [];
          try {
            members = await fs.listMembers(tenant.id);
          } catch {
            members = dbStore.members.get(tenant.id) || [];
          }
          if (members.length > 0) {
            dbStore.members.set(tenant.id, members);
          }

          let loans: any[] = [];
          try {
            loans = await fs.listLoans(tenant.id);
          } catch {
            loans = dbStore.loans.get(tenant.id) || [];
          }
          if (loans.length > 0) {
            dbStore.loans.set(tenant.id, loans);
          }

          const totalMembers = members.length;
          const activeMembers = members.filter((m) => m.status === 'ACTIVE' || m.kycStatus === 'VERIFIED').length;
          const pendingMembers = members.filter((m) => m.status === 'PENDING_APPROVAL').length;
          const freeTierMembers = Math.min(15, totalMembers);
          const billedMembers = Math.max(0, totalMembers - 15);

          const totalLoansDisbursed = loans.filter((l) => l.status === 'DISBURSED' || l.status === 'APPROVED').length;
          const totalLoanVolume = loans
            .filter((l) => l.status === 'DISBURSED' || l.status === 'APPROVED')
            .reduce((sum, l) => sum + (l.principalAmount || 0), 0);
          const totalTechFeesGenerated = Math.round(totalLoanVolume * 0.01 * 100) / 100;

          const creditBalance = (tenant as any).platformCreditBalance ?? dbStore.platformCredits.get(tenant.id) ?? 0.0;
          const escrowFloat = (tenant as any).escrowFloatBalance ?? dbStore.escrowFloats?.get(tenant.id) ?? 0.0;

          const storageUsedMb = Math.round((totalMembers * 0.4 + 45.0) * 10) / 10;
          let healthScore = 98;
          if (tenant.status === 'SUSPENDED') healthScore = 40;
          else if (creditBalance < 1000) healthScore = 82;

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
            storageQuotaMb: (tenant as any).storageQuotaMb || 10240,
            databaseSchema: `tenant_${tenant.slug}`,
            healthScore,
            environment: (tenant as any).environment || 'production',
            tag: (tenant as any).tag || '',
            tags: (tenant as any).tags || ((tenant as any).tag ? [(tenant as any).tag] : []),
            lastActiveAt: tenant.updatedAt || new Date().toISOString(),
            createdAt: tenant.createdAt,
          });
        }
        return summaries;
      }
    } catch (err) {
      console.warn('[OPERATOR] getTenantFleetSummariesAsync firestore error, falling back to local memory:', err);
    }
    return this.getTenantFleetSummaries();
  }

  /**
   * Adjusts platform credit with persistence to Firebase Firestore
   */
  public static async adjustPlatformCreditAsync(params: {
    tenantId: string;
    amount: number;
    type: PlatformCreditTransactionType;
    reference: string;
    notes: string;
    performedBy: string;
  }): Promise<{ success: boolean; newBalance: number; transaction: PlatformCreditTransaction }> {
    this.ensureInitialized();
    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        const tenantDoc = await fs.getTenant(params.tenantId);
        if (tenantDoc && (tenantDoc as any).platformCreditBalance !== undefined) {
          dbStore.platformCredits.set(params.tenantId, Number((tenantDoc as any).platformCreditBalance));
        }
      } catch {}
    }

    const res = this.adjustPlatformCredit(params);

    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        await fs.recordCreditTransaction(res.transaction);
        await fs.updateTenantCreditBalance(params.tenantId, res.newBalance);
      } catch (err) {
        console.warn('[OPERATOR] adjustPlatformCreditAsync firestore error:', err);
      }
    }

    return res;
  }

  /**
   * Updates tenant lifecycle status in Firebase Firestore
   */
  public static async updateTenantStatusAsync(tenantId: string, status: TenantStatus, reason?: string): Promise<boolean> {
    const updated = this.updateTenantStatus(tenantId, status, reason);
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.updateTenantStatus(tenantId, status, reason);
    } catch (err) {
      console.warn('[OPERATOR] updateTenantStatusAsync firestore error:', err);
    }
    return updated;
  }

  /**
   * System Broadcasts in Firebase Firestore
   */
  public static async createBroadcastAsync(broadcast: Omit<SystemBroadcast, 'id' | 'createdAt'>): Promise<SystemBroadcast> {
    const record = this.createBroadcast(broadcast);
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveBroadcast(record);
    } catch (err) {
      console.warn('[OPERATOR] createBroadcastAsync firestore error:', err);
    }
    return record;
  }

  public static async listBroadcastsAsync(): Promise<SystemBroadcast[]> {
    try {
      const fs = FirestoreCoopService.getInstance();
      const broadcasts = await fs.listBroadcasts();
      if (broadcasts && broadcasts.length > 0) {
        dbStore.systemBroadcasts = broadcasts;
        return broadcasts;
      }
    } catch (err) {
      console.warn('[OPERATOR] listBroadcastsAsync firestore error, falling back:', err);
    }
    return dbStore.systemBroadcasts;
  }

  /**
   * Platform Credit Transactions in Firebase Firestore
   */
  public static async listCreditTransactionsAsync(tenantId?: string): Promise<PlatformCreditTransaction[]> {
    try {
      const fs = FirestoreCoopService.getInstance();
      const txs = await fs.listCreditTransactions(tenantId);
      if (txs && txs.length > 0) {
        if (!tenantId) {
          dbStore.creditTransactions = txs;
        }
        return txs;
      }
    } catch (err) {
      console.warn('[OPERATOR] listCreditTransactionsAsync firestore error, falling back:', err);
    }
    return tenantId
      ? dbStore.creditTransactions.filter((tx) => tx.tenantId === tenantId)
      : dbStore.creditTransactions;
  }

  /**
   * Cooperative Registrations in Firebase Firestore
   */
  public static async listRegistrationsAsync(): Promise<CooperativeRegistration[]> {
    this.ensureInitialized();
    try {
      const fs = FirestoreCoopService.getInstance();
      const regs = await fs.listRegistrations();
      if (regs && regs.length > 0) {
        dbStore.coopRegistrations = regs;
        return regs;
      }
    } catch (err) {
      console.warn('[OPERATOR] listRegistrationsAsync firestore error, falling back:', err);
    }
    return this.listRegistrations();
  }

  public static async submitRegistrationAsync(
    data: Omit<CooperativeRegistration, 'id' | 'status' | 'submittedAt' | 'subdomain'>
  ): Promise<CooperativeRegistration> {
    const record = this.submitRegistration(data);
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveRegistration(record);
    } catch (err) {
      console.warn('[OPERATOR] submitRegistrationAsync firestore error:', err);
    }

    try {
      const confirmSubject = `[Tuntong Tech] Application Received: ${record.name} (${record.id})`;
      const confirmBody = `Dear ${record.adminFirstName} ${record.adminLastName},\n\n` +
        `Thank you for registering "${record.name}" with the Tuntong Tech Cooperative SaaS Platform.\n\n` +
        `Your cooperative registration application has been received and logged under reference ID:\n\n` +
        `    ${record.id}\n\n` +
        `• Application Summary:\n` +
        `- Cooperative Name: ${record.name}\n` +
        `- Type: ${record.coopType}\n` +
        `- Designated Subdomain: https://${record.subdomain}\n` +
        `- CDA Registration Number: ${record.cdaRegistrationNumber}\n` +
        `- Tax Identification Number (TIN): ${record.tin}\n` +
        `- Declared General Manager: ${record.adminFirstName} ${record.adminLastName}\n` +
        `- Status: PENDING COMPLIANCE REVIEW\n\n` +
        `Our compliance team is currently reviewing your application credentials. You will receive an official notification once your cooperative workspace is approved.\n\n` +
        `Sincerely,\n` +
        `Tuntong Tech Onboarding Desk\n` +
        `support@tuntongtech.com\n` +
        `https://tuntongtech.com`;

      await MailerService.sendMail({
        to: record.adminEmail,
        subject: confirmSubject,
        text: confirmBody,
      });
    } catch (mailErr) {
      console.error('[MAILER ERROR] submitRegistrationAsync confirmation error:', mailErr);
    }

    return record;
  }

  public static async approveRegistrationAsync(
    id: string,
    reviewedBy: string = 'Tuntong Tech Operator'
  ): Promise<{ success: boolean; registration?: CooperativeRegistration; tenant?: Tenant; error?: string }> {
    const res = this.approveRegistration(id, reviewedBy);
    if (!res.success || !res.registration || !res.tenant) {
      return res;
    }

    try {
      const fs = FirestoreCoopService.getInstance();
      // 1. Save updated registration document
      await fs.saveRegistration(res.registration);

      // 2. Provision tenant in Firestore
      await fs.saveTenant({
        ...res.tenant,
        platformCreditBalance: 0.0,
        escrowFloatBalance: 0.0,
      } as any);

      // 3. Seed CDA Chart of Accounts in Firestore
      await fs.seedTenant(res.tenant);

      // 4. Provision GM member in Firestore
      const gmMember = (dbStore.members.get(res.tenant.id) || [])[0];
      if (gmMember) {
        await fs.saveMember(res.tenant.id, gmMember);
      }

      // 5. Provision Primary Administrator staff credential in Firestore
      const adminFullName = [res.registration.adminFirstName, res.registration.adminMiddleName, res.registration.adminLastName].filter(Boolean).join(' ') || res.registration.adminFirstName || 'Primary Administrator';
      const adminEmail = (res.registration.adminEmail || res.registration.contactEmail).trim().toLowerCase();
      const adminUsername = adminEmail.split('@')[0] || 'admin';
      const adminUserId = `usr_admin_${res.registration.slug}_01`;

      await fs.saveMemberCredential(res.tenant.id, {
        id: adminUserId,
        tenantId: res.tenant.id,
        fullName: adminFullName,
        email: adminEmail,
        username: adminUsername,
        password: res.registration.oneTimePassword,
        pin: '123456',
        role: 'GENERAL_MANAGER',
        roleTitle: 'General Manager / Primary Administrator',
        isStaff: true,
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[OPERATOR] approveRegistrationAsync firestore provisioning warning:', err);
    }

    if (res.registration.emailNotification) {
      try {
        await MailerService.sendMail({
          to: res.registration.adminEmail,
          subject: res.registration.emailNotification.subject,
          text: res.registration.emailNotification.body,
        });
      } catch (mailErr) {
        console.error('[MAILER ERROR] approveRegistrationAsync mail error:', mailErr);
      }
    }

    return res;
  }

  public static async rejectRegistrationAsync(
    id: string,
    reason: string,
    reviewedBy: string = 'Tuntong Tech Operator'
  ): Promise<{ success: boolean; registration?: CooperativeRegistration; error?: string }> {
    const res = this.rejectRegistration(id, reason, reviewedBy);
    if (!res.success || !res.registration) {
      return res;
    }

    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveRegistration(res.registration);
    } catch (err) {
      console.warn('[OPERATOR] rejectRegistrationAsync firestore warning:', err);
    }

    if (res.registration.emailNotification) {
      try {
        await MailerService.sendMail({
          to: res.registration.adminEmail,
          subject: res.registration.emailNotification.subject,
          text: res.registration.emailNotification.body,
        });
      } catch (mailErr) {
        console.error('[MAILER ERROR] rejectRegistrationAsync mail error:', mailErr);
      }
    }

    return res;
  }

  public static async removeRegistrationAsync(id: string): Promise<boolean> {
    const removed = this.removeRegistration(id);
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.deleteRegistration(id);
    } catch (err) {
      console.warn('[OPERATOR] removeRegistrationAsync firestore warning:', err);
    }
    return removed;
  }

  public static async clearAllRegistrationsAsync(): Promise<void> {
    this.clearAllRegistrations();
    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.clearAllRegistrations();
    } catch (err) {
      console.warn('[OPERATOR] clearAllRegistrationsAsync firestore warning:', err);
    }
  }

  // --------------------------------------------------------------------------
  // Platform Payment Methods (Operator Bank Accounts)
  // --------------------------------------------------------------------------

  public static async listPaymentMethodsAsync(): Promise<PlatformPaymentMethod[]> {
    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        const methods = await fs.listPlatformPaymentMethods();
        if (methods && methods.length > 0) {
          dbStore.platformPaymentMethods = methods;
          return methods;
        }
      } catch (err) {
        console.warn('[OPERATOR] listPaymentMethodsAsync firestore fallback:', err);
      }
    }
    return dbStore.platformPaymentMethods;
  }

  public static async savePaymentMethodAsync(methodData: Partial<PlatformPaymentMethod> & { bankName: string; accountName: string; accountNumber: string }): Promise<PlatformPaymentMethod> {
    const id = methodData.id || `pm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const method: PlatformPaymentMethod = {
      id,
      type: methodData.type || 'BANK_TRANSFER',
      bankName: methodData.bankName.trim(),
      accountName: methodData.accountName.trim(),
      accountNumber: methodData.accountNumber.trim(),
      qrCodeUrl: methodData.qrCodeUrl,
      instructions: methodData.instructions || 'Transfer via InstaPay or PESONet. Reference number required.',
      status: methodData.status || 'ACTIVE',
      isDefault: methodData.isDefault || false,
      environment: methodData.environment || 'production',
      createdAt: methodData.createdAt || now,
      updatedAt: now,
      updatedBy: methodData.updatedBy || 'Platform Operator',
    };

    const existingIndex = dbStore.platformPaymentMethods.findIndex((m) => m.id === id);
    if (existingIndex >= 0) {
      dbStore.platformPaymentMethods[existingIndex] = method;
    } else {
      dbStore.platformPaymentMethods.unshift(method);
    }

    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        await fs.savePlatformPaymentMethod(method);
      } catch (err) {
        console.warn('[OPERATOR] savePaymentMethodAsync firestore warning:', err);
      }
    }

    return method;
  }

  public static async deletePaymentMethodAsync(id: string): Promise<boolean> {
    dbStore.platformPaymentMethods = dbStore.platformPaymentMethods.filter((m) => m.id !== id);
    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        return await fs.deletePlatformPaymentMethod(id);
      } catch (err) {
        console.warn('[OPERATOR] deletePaymentMethodAsync firestore warning:', err);
      }
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // Platform Credit Top-Up Requests & Verification
  // --------------------------------------------------------------------------

  public static async submitCreditTopupRequestAsync(params: {
    tenantId: string;
    amount: number;
    paymentMethodId: string;
    sourceBank: string;
    referenceNumber: string;
    notes?: string;
    requestedBy?: string;
  }): Promise<PlatformCreditTopupRequest> {
    this.ensureInitialized();
    const tenant = dbStore.tenants.get(params.tenantId);
    const tenantName = tenant?.name || params.tenantId;
    const tenantSlug = tenant?.slug || params.tenantId.replace('tenant_', '');

    // Get payment method details
    const methods = await this.listPaymentMethodsAsync();
    const method = methods.find((m) => m.id === params.paymentMethodId) || methods[0];
    const paymentMethodName = method ? `${method.bankName} (${method.accountNumber})` : 'Operator Bank Account';

    const id = `topup_req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const request: PlatformCreditTopupRequest = {
      id,
      tenantId: params.tenantId,
      tenantName,
      tenantSlug,
      amount: Math.round(params.amount * 100) / 100,
      paymentMethodId: params.paymentMethodId,
      paymentMethodName,
      sourceBank: params.sourceBank.trim(),
      referenceNumber: params.referenceNumber.trim(),
      notes: params.notes,
      status: 'PENDING_VERIFICATION',
      requestedAt: new Date().toISOString(),
      requestedBy: params.requestedBy || 'Cooperative Admin',
    };

    dbStore.creditTopupRequests.unshift(request);

    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        await fs.createCreditTopupRequest(request);
      } catch (err) {
        console.warn('[OPERATOR] submitCreditTopupRequestAsync firestore warning:', err);
      }
    }

    return request;
  }

  public static async listCreditTopupRequestsAsync(tenantId?: string): Promise<PlatformCreditTopupRequest[]> {
    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        const list = await fs.listCreditTopupRequests(tenantId);
        if (list && list.length > 0) {
          if (!tenantId) {
            dbStore.creditTopupRequests = list;
          }
          return list;
        }
      } catch (err) {
        console.warn('[OPERATOR] listCreditTopupRequestsAsync firestore fallback:', err);
      }
    }
    return tenantId ? dbStore.creditTopupRequests.filter((r) => r.tenantId === tenantId) : dbStore.creditTopupRequests;
  }

  public static async approveCreditTopupRequestAsync(
    requestId: string,
    reviewedBy: string = 'Platform Operator'
  ): Promise<{ success: boolean; request?: PlatformCreditTopupRequest; newBalance?: number; error?: string }> {
    let request = dbStore.creditTopupRequests.find((r) => r.id === requestId);
    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        const fsReq = await fs.getCreditTopupRequest(requestId);
        if (fsReq) request = fsReq;
      } catch {}
    }

    if (!request) {
      return { success: false, error: 'Top-up request not found.' };
    }

    if (request.status !== 'PENDING_VERIFICATION') {
      return { success: false, error: `Top-up request is already ${request.status}.` };
    }

    // Credit tenant platform credit balance
    const creditResult = await this.adjustPlatformCreditAsync({
      tenantId: request.tenantId,
      amount: request.amount,
      type: 'TOP_UP',
      reference: request.referenceNumber,
      notes: `Verified Refill via ${request.sourceBank} to ${request.paymentMethodName}`,
      performedBy: reviewedBy,
    });

    const now = new Date().toISOString();
    request.status = 'APPROVED';
    request.reviewedAt = now;
    request.reviewedBy = reviewedBy;

    // Update memory
    const idx = dbStore.creditTopupRequests.findIndex((r) => r.id === requestId);
    if (idx >= 0) dbStore.creditTopupRequests[idx] = request;

    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        await fs.updateCreditTopupRequest(requestId, {
          status: 'APPROVED',
          reviewedAt: now,
          reviewedBy,
        });
      } catch (err) {
        console.warn('[OPERATOR] approveCreditTopupRequestAsync firestore warning:', err);
      }
    }

    return {
      success: true,
      request,
      newBalance: creditResult.newBalance,
    };
  }

  public static async rejectCreditTopupRequestAsync(
    requestId: string,
    reason: string,
    reviewedBy: string = 'Platform Operator'
  ): Promise<{ success: boolean; request?: PlatformCreditTopupRequest; error?: string }> {
    let request = dbStore.creditTopupRequests.find((r) => r.id === requestId);
    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        const fsReq = await fs.getCreditTopupRequest(requestId);
        if (fsReq) request = fsReq;
      } catch {}
    }

    if (!request) {
      return { success: false, error: 'Top-up request not found.' };
    }

    if (request.status !== 'PENDING_VERIFICATION') {
      return { success: false, error: `Top-up request is already ${request.status}.` };
    }

    const now = new Date().toISOString();
    request.status = 'REJECTED';
    request.rejectionReason = reason;
    request.reviewedAt = now;
    request.reviewedBy = reviewedBy;

    const idx = dbStore.creditTopupRequests.findIndex((r) => r.id === requestId);
    if (idx >= 0) dbStore.creditTopupRequests[idx] = request;

    if (process.env.NODE_ENV !== 'test') {
      try {
        const fs = FirestoreCoopService.getInstance();
        await fs.updateCreditTopupRequest(requestId, {
          status: 'REJECTED',
          rejectionReason: reason,
          reviewedAt: now,
          reviewedBy,
        });
      } catch (err) {
        console.warn('[OPERATOR] rejectCreditTopupRequestAsync firestore warning:', err);
      }
    }

    return {
      success: true,
      request,
    };
  }
}


