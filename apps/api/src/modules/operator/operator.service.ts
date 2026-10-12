import {
  OperatorOverviewMetrics,
  PlatformCreditTransaction,
  PlatformCreditTransactionType,
  SystemBroadcast,
  Tenant,
  TenantFleetSummary,
  TenantStatus,
} from '@flexcoop/shared-types';
import { dbStore } from '../../core/store';

export class OperatorService {
  /**
   * Initializes default platform credit balances and seed tenants for the operator fleet
   */
  public static ensureInitialized() {
    // Seed additional tenant instances if only 1 exists
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

    // Initialize default credit balances
    const tenantBayani = 'tenant_bayani_001';
    if (!dbStore.platformCredits.has(tenantBayani)) {
      dbStore.platformCredits.set(tenantBayani, 4250.0);
    }
    const tenantMaharlika = 'tenant_maharlika_002';
    if (!dbStore.platformCredits.has(tenantMaharlika)) {
      dbStore.platformCredits.set(tenantMaharlika, 350.0); // Low credit warning demo
    }
    const tenantSilangan = 'tenant_silangan_003';
    if (!dbStore.platformCredits.has(tenantSilangan)) {
      dbStore.platformCredits.set(tenantSilangan, 8900.0);
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

      const creditBalance = dbStore.platformCredits.get(tenantId) ?? 1000.0;
      
      // Calculate escrow float for tenant
      // For Bayani, standard escrow float demo is ₱48,470.00
      let escrowFloat = 0;
      if (tenantId === 'tenant_bayani_001') {
        escrowFloat = 48470.0;
      } else if (tenantId === 'tenant_maharlika_002') {
        escrowFloat = 12100.0;
      } else {
        escrowFloat = 26500.0;
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
}
