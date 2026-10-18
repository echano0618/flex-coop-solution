import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore';
import {
  Tenant,
  Member,
  Loan,
  LoanProduct,
  JournalEntry,
  PlatformInvoice,
  PaymentTransaction,
  AMLCCoveredTransactionAlert,
  OperatorAccount,
  OperatorSession,
  CooperativeRegistration,
  PlatformCreditTransaction,
  SystemBroadcast,
} from '@flexcoop/shared-types';
import { CDACoAManager } from '@flexcoop/cda-coa';
import { PlatformPaymentMethod, PlatformCreditTopupRequest } from './store';

export class FirestoreCoopService {
  private static instance: FirestoreCoopService;
  private db: Firestore;

  private constructor() {
    if (getApps().length === 0) {
      const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        process.env.GCP_PROJECT ||
        'coop-solution';
      initializeApp({
        projectId,
      });
    }

    this.db = getFirestore();

    try {
      this.db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Ignore if already configured
    }
  }

  public static getInstance(): FirestoreCoopService {
    if (!FirestoreCoopService.instance) {
      FirestoreCoopService.instance = new FirestoreCoopService();
    }
    return FirestoreCoopService.instance;
  }

  public getFirestore(): Firestore {
    return this.db;
  }

  // --------------------------------------------------------------------------
  // Reference Helpers
  // --------------------------------------------------------------------------

  public tenantDoc(tenantId: string) {
    return this.db.collection('tenants').doc(tenantId);
  }

  public membersCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('members');
  }

  public applicationsCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('applications');
  }

  public credentialsCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('credentials');
  }

  public systemConfigDoc(tenantId: string) {
    return this.tenantDoc(tenantId).collection('system_config').doc('general');
  }

  public loansCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('loans');
  }

  public loanProductsCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('loan_products');
  }

  public journalEntriesCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('journal_entries');
  }

  public coaCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('chart_of_accounts');
  }

  public paymentsCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('payments');
  }

  public invoicesCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('invoices');
  }

  public amlcAlertsCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('amlc_alerts');
  }

  public operatorsCol() {
    return this.db.collection('operators');
  }

  public operatorOtpsCol() {
    return this.db.collection('operator_otps');
  }

  public operatorSessionsCol() {
    return this.db.collection('operator_sessions');
  }

  public coopRegistrationsCol() {
    return this.db.collection('coop_registrations');
  }

  public creditTransactionsCol() {
    return this.db.collection('platform_credit_transactions');
  }

  public broadcastsCol() {
    return this.db.collection('system_broadcasts');
  }

  public platformPaymentMethodsCol() {
    return this.db.collection('platform_payment_methods');
  }

  public creditTopupRequestsCol() {
    return this.db.collection('platform_credit_topups');
  }

  // --------------------------------------------------------------------------
  // Seeding & Tenant Setup
  // --------------------------------------------------------------------------

  public async seedTenant(tenant: Tenant): Promise<void> {
    const batch = this.db.batch();

    // 1. Tenant metadata document
    const tenantRef = this.tenantDoc(tenant.id);
    batch.set(tenantRef, tenant, { merge: true });

    // 2. CDA Standard Chart of Accounts (COA)
    const accounts = CDACoAManager.getDefaultAccounts();
    for (const acc of accounts) {
      const accRef = this.coaCol(tenant.id).doc(acc.code);
      batch.set(accRef, {
        ...acc,
        currentDebit: 0,
        currentCredit: 0,
        netBalance: 0,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    await batch.commit();
  }

  public async ensureFamilyTenantInitialized(): Promise<void> {
    try {
      const familyDoc = await this.tenantDoc('tenant_family').get();
      if (!familyDoc.exists) {
        const tenant: Tenant = {
          id: 'tenant_family',
          name: 'Family Multi-Purpose Cooperative',
          slug: 'family',
          cdaRegistrationNumber: 'CDA-NCR-2024-00892',
          tin: '009-887-123-000',
          contactEmail: 'admin@familycoop.ph',
          contactPhone: '+63 917 888 2468',
          address: 'Family Coop Building, Ortigas Center, Pasig City, Metro Manila',
          coopType: 'Multi-Purpose',
          adminFirstName: 'Felix',
          adminLastName: 'Echano',
          billingMode: 'STANDARD_UNIFIED',
          status: 'ACTIVE',
          createdAt: '2026-01-01T08:00:00.000Z',
          updatedAt: new Date().toISOString(),
        };
        (tenant as any).platformCreditBalance = 50000;
        (tenant as any).escrowFloatBalance = 0;
        await this.seedTenant(tenant);
      }
    } catch (err) {
      console.warn('Error checking family tenant initialization in Firestore:', err);
    }
  }

  // --------------------------------------------------------------------------
  // Members Management
  // --------------------------------------------------------------------------

  public async saveMember(tenantId: string, member: Member): Promise<void> {
    await this.membersCol(tenantId).doc(member.id).set(member, { merge: true });
  }

  public async getMember(tenantId: string, memberId: string): Promise<Member | null> {
    const doc = await this.membersCol(tenantId).doc(memberId).get();
    if (doc.exists) return doc.data() as Member;

    if (memberId === 'mem_gm_0001') {
      const gmDoc = await this.membersCol(tenantId).doc('MEM-2026-0001').get();
      if (gmDoc.exists) return gmDoc.data() as Member;
    }

    try {
      const q1 = await this.membersCol(tenantId).where('memberNumber', '==', memberId).limit(1).get();
      if (!q1.empty) return q1.docs[0].data() as Member;
    } catch {}

    try {
      const q2 = await this.membersCol(tenantId).where('memberNo', '==', memberId).limit(1).get();
      if (!q2.empty) return q2.docs[0].data() as Member;
    } catch {}

    return null;
  }

  public async listMembers(tenantId: string): Promise<Member[]> {
    const snapshot = await this.membersCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as Member);
  }

  // --------------------------------------------------------------------------
  // Loans Management
  // --------------------------------------------------------------------------

  public async saveLoan(tenantId: string, loan: Loan): Promise<void> {
    await this.loansCol(tenantId).doc(loan.id).set(loan, { merge: true });
  }

  public async getLoan(tenantId: string, loanId: string): Promise<Loan | null> {
    const doc = await this.loansCol(tenantId).doc(loanId).get();
    return doc.exists ? (doc.data() as Loan) : null;
  }

  public async listLoans(tenantId: string): Promise<Loan[]> {
    const snapshot = await this.loansCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as Loan);
  }

  public async updateLoanStatus(
    tenantId: string,
    loanId: string,
    status: Loan['status'],
    extraFields?: Partial<Loan>
  ): Promise<void> {
    await this.loansCol(tenantId).doc(loanId).update({
      status,
      ...extraFields,
      updatedAt: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // Atomic Double-Entry General Ledger (CDA Compliant)
  // --------------------------------------------------------------------------

  public async postBalancedJournalEntry(
    tenantId: string,
    entry: JournalEntry
  ): Promise<{ success: boolean; entryId: string; error?: string }> {
    // 1. Double-entry validation: Total Debits must strictly equal Total Credits
    const totalDebit = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Double-Entry Violation: Debit (₱${totalDebit}) does not equal Credit (₱${totalCredit})`);
    }

    // 2. Execute atomic Firestore Transaction
    return await this.db.runTransaction(async (transaction: Transaction) => {
      // Create journal entry record (Immutable)
      const entryRef = this.journalEntriesCol(tenantId).doc(entry.id);
      transaction.set(entryRef, {
        ...entry,
        totalDebit,
        totalCredit,
        isBalanced: true,
        postedAt: new Date().toISOString(),
      });

      // Atomically increment / update account balances in CDA COA
      for (const line of entry.lines) {
        const accRef = this.coaCol(tenantId).doc(line.accountCode);
        const accDoc = await transaction.get(accRef);

        if (accDoc.exists) {
          const data = accDoc.data()!;
          const newDebit = (data.currentDebit || 0) + (line.debit || 0);
          const newCredit = (data.currentCredit || 0) + (line.credit || 0);

          // Normal balance calculation (Assets & Expenses = Debit - Credit; Liabilities/Equity/Rev = Credit - Debit)
          const isDebitNormal = data.normalBalance === 'DEBIT';
          const netBalance = isDebitNormal ? newDebit - newCredit : newCredit - newDebit;

          transaction.update(accRef, {
            currentDebit: newDebit,
            currentCredit: newCredit,
            netBalance,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      return { success: true, entryId: entry.id };
    });
  }

  public async listJournalEntries(tenantId: string): Promise<JournalEntry[]> {
    const snapshot = await this.journalEntriesCol(tenantId).orderBy('date', 'desc').get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as JournalEntry);
  }

  // --------------------------------------------------------------------------
  // Repayments & Cashiering
  // --------------------------------------------------------------------------

  public async recordPayment(
    tenantId: string,
    payment: PaymentTransaction
  ): Promise<void> {
    await this.db.runTransaction(async (transaction: Transaction) => {
      // 1. Save payment record
      const paymentRef = this.paymentsCol(tenantId).doc(payment.id);
      transaction.set(paymentRef, payment);

      // 2. Reduce remaining balance on active loan
      const loanRef = this.loansCol(tenantId).doc(payment.loanId);
      const loanDoc = await transaction.get(loanRef);

      if (loanDoc.exists) {
        const currentLoan = loanDoc.data() as Loan;
        const newBalance = Math.max(0, currentLoan.balanceRemaining - payment.principalPortion);
        const isPaidOff = newBalance <= 0;

        transaction.update(loanRef, {
          balanceRemaining: newBalance,
          status: isPaidOff ? 'PAID_OFF' : currentLoan.status,
          updatedAt: new Date().toISOString(),
        });
      }
    });
  }

  // --------------------------------------------------------------------------
  // Invoices & Tax
  // --------------------------------------------------------------------------

  public async recordInvoice(tenantId: string, invoice: PlatformInvoice): Promise<void> {
    await this.invoicesCol(tenantId).doc(invoice.id).set(invoice);
  }

  public async listInvoices(tenantId: string): Promise<PlatformInvoice[]> {
    const snapshot = await this.invoicesCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as PlatformInvoice);
  }

  // --------------------------------------------------------------------------
  // AMLC Triggers
  // --------------------------------------------------------------------------

  public async recordAMLCAlert(tenantId: string, alert: AMLCCoveredTransactionAlert): Promise<void> {
    await this.amlcAlertsCol(tenantId).doc(alert.id).set(alert);
  }

  public async listAMLCAlerts(tenantId: string): Promise<AMLCCoveredTransactionAlert[]> {
    const snapshot = await this.amlcAlertsCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as AMLCCoveredTransactionAlert);
  }

  // --------------------------------------------------------------------------
  // Applications Management (Online PMES & eKYC Queue)
  // --------------------------------------------------------------------------

  public async saveApplication(tenantId: string, application: any): Promise<void> {
    await this.applicationsCol(tenantId).doc(application.id).set(application, { merge: true });
  }

  public async getApplication(tenantId: string, applicationId: string): Promise<any | null> {
    const doc = await this.applicationsCol(tenantId).doc(applicationId).get();
    return doc.exists ? doc.data() : null;
  }

  public async listApplications(tenantId: string): Promise<any[]> {
    const snapshot = await this.applicationsCol(tenantId).get();
    const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data());
    return list.sort((a, b) => new Date(b.dateSubmitted || 0).getTime() - new Date(a.dateSubmitted || 0).getTime());
  }

  public async updateApplicationStatus(
    tenantId: string,
    applicationId: string,
    status: string,
    notes?: string,
    reviewedBy?: string
  ): Promise<void> {
    await this.applicationsCol(tenantId).doc(applicationId).set(
      {
        status,
        reviewedBy: reviewedBy || 'Cooperative Administration',
        reviewNotes: notes || '',
        reviewDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  // --------------------------------------------------------------------------
  // Member Credentials Management (Strict Authentication)
  // --------------------------------------------------------------------------

  public async saveMemberCredential(tenantId: string, cred: any): Promise<void> {
    const username = (cred.username || '').toLowerCase().trim();
    const email = (cred.email || '').toLowerCase().trim();
    const id = username || email || cred.phone;

    await this.credentialsCol(tenantId).doc(id).set(
      {
        ...cred,
        username,
        email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async getMemberCredential(tenantId: string, identifier: string): Promise<any | null> {
    const idLower = identifier.toLowerCase().trim();

    // 1. Check direct doc by username
    const doc = await this.credentialsCol(tenantId).doc(idLower).get();
    if (doc.exists) return doc.data();

    // 2. Query by email
    const byEmail = await this.credentialsCol(tenantId).where('email', '==', idLower).limit(1).get();
    if (!byEmail.empty) return byEmail.docs[0].data();

    // 3. Query by phone
    const byPhone = await this.credentialsCol(tenantId).where('phone', '==', identifier.trim()).limit(1).get();
    if (!byPhone.empty) return byPhone.docs[0].data();

    return null;
  }

  // --------------------------------------------------------------------------
  // System Configuration (General Settings, Technology Fee, Share Capital)
  // --------------------------------------------------------------------------

  public async saveSystemConfig(tenantId: string, config: any): Promise<void> {
    await this.systemConfigDoc(tenantId).set(
      {
        ...config,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async getSystemConfig(tenantId: string): Promise<any | null> {
    const doc = await this.systemConfigDoc(tenantId).get();
    return doc.exists ? doc.data() : null;
  }

  // --------------------------------------------------------------------------
  // Tenant Fleet Management
  // --------------------------------------------------------------------------

  public async saveTenant(tenant: Tenant): Promise<void> {
    await this.tenantDoc(tenant.id).set(tenant, { merge: true });
  }

  public async getTenant(tenantId: string): Promise<Tenant | null> {
    const doc = await this.tenantDoc(tenantId).get();
    return doc.exists ? (doc.data() as Tenant) : null;
  }

  public async listTenants(): Promise<Tenant[]> {
    const snapshot = await this.db.collection('tenants').get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as Tenant);
  }

  // --------------------------------------------------------------------------
  // Ledger Clearance (Production Reset Support)
  // --------------------------------------------------------------------------

  public async clearTenantLedger(tenantId: string): Promise<void> {
    // Delete all journal entries
    const entries = await this.journalEntriesCol(tenantId).get();
    if (!entries.empty) {
      const batch = this.db.batch();
      entries.docs.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Reset Chart of Accounts balances
    const accounts = await this.coaCol(tenantId).get();
    if (!accounts.empty) {
      const coaBatch = this.db.batch();
      accounts.docs.forEach((doc: QueryDocumentSnapshot) => {
        coaBatch.update(doc.ref, {
          currentDebit: 0,
          currentCredit: 0,
          netBalance: 0,
          updatedAt: new Date().toISOString(),
        });
      });
      await coaBatch.commit();
    }
  }

  // --------------------------------------------------------------------------
  // Operator Control Plane & Security (Stored in Firebase Firestore)
  // --------------------------------------------------------------------------

  public async saveOperator(operator: OperatorAccount): Promise<void> {
    await this.operatorsCol().doc(operator.username.toLowerCase()).set({
      ...operator,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  public async getOperator(usernameOrEmail: string): Promise<OperatorAccount | null> {
    const q = (usernameOrEmail || '').toLowerCase().trim();
    const doc = await this.operatorsCol().doc(q).get();
    if (doc.exists) return doc.data() as OperatorAccount;
    const byEmail = await this.operatorsCol().where('email', '==', q).limit(1).get();
    if (!byEmail.empty) return byEmail.docs[0].data() as OperatorAccount;
    return null;
  }

  public async listOperators(): Promise<OperatorAccount[]> {
    const snapshot = await this.operatorsCol().get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as OperatorAccount);
  }

  public async deleteOperator(username: string): Promise<boolean> {
    const docRef = this.operatorsCol().doc(username.toLowerCase());
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }

  public async saveOperatorOtp(username: string, data: { otp: string; expiresAt: number; attempts: number; email: string }): Promise<void> {
    await this.operatorOtpsCol().doc(username.toLowerCase()).set({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  public async getOperatorOtp(username: string): Promise<{ otp: string; expiresAt: number; attempts: number; email: string } | null> {
    const doc = await this.operatorOtpsCol().doc(username.toLowerCase()).get();
    return doc.exists ? (doc.data() as any) : null;
  }

  public async deleteOperatorOtp(username: string): Promise<void> {
    await this.operatorOtpsCol().doc(username.toLowerCase()).delete();
  }

  public async saveOperatorSession(session: OperatorSession): Promise<void> {
    await this.operatorSessionsCol().doc(session.token).set(session);
  }

  public async getOperatorSession(token: string): Promise<OperatorSession | null> {
    const doc = await this.operatorSessionsCol().doc(token).get();
    return doc.exists ? (doc.data() as OperatorSession) : null;
  }

  public async deleteOperatorSession(token: string): Promise<void> {
    await this.operatorSessionsCol().doc(token).delete();
  }

  // --------------------------------------------------------------------------
  // Tenant Fleet Status & Platform Credit Balance
  // --------------------------------------------------------------------------

  public async updateTenantStatus(tenantId: string, status: string, reason?: string): Promise<void> {
    await this.tenantDoc(tenantId).set({
      status,
      statusReason: reason || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  public async updateTenantCreditBalance(tenantId: string, balance: number): Promise<void> {
    await this.tenantDoc(tenantId).set({
      platformCreditBalance: balance,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  // --------------------------------------------------------------------------
  // Cooperative Registrations (Onboarding Queue in Firebase Firestore)
  // --------------------------------------------------------------------------

  public async saveRegistration(reg: CooperativeRegistration): Promise<void> {
    await this.coopRegistrationsCol().doc(reg.id).set(reg, { merge: true });
  }

  public async getRegistration(id: string): Promise<CooperativeRegistration | null> {
    const doc = await this.coopRegistrationsCol().doc(id).get();
    return doc.exists ? (doc.data() as CooperativeRegistration) : null;
  }

  public async listRegistrations(): Promise<CooperativeRegistration[]> {
    const snapshot = await this.coopRegistrationsCol().get();
    const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as CooperativeRegistration);
    return list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  }

  public async deleteRegistration(id: string): Promise<boolean> {
    const ref = this.coopRegistrationsCol().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  public async clearAllRegistrations(): Promise<void> {
    const snapshot = await this.coopRegistrationsCol().get();
    if (snapshot.empty) return;
    const batch = this.db.batch();
    snapshot.docs.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
    await batch.commit();
  }

  // --------------------------------------------------------------------------
  // Platform Credit Ledger & Transactions (Firebase Firestore)
  // --------------------------------------------------------------------------

  public async recordCreditTransaction(tx: PlatformCreditTransaction): Promise<void> {
    await this.creditTransactionsCol().doc(tx.id).set(tx);
  }

  public async listCreditTransactions(tenantId?: string): Promise<PlatformCreditTransaction[]> {
    let query: any = this.creditTransactionsCol();
    if (tenantId) {
      query = query.where('tenantId', '==', tenantId);
    }
    const snapshot = await query.get();
    const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as PlatformCreditTransaction);
    return list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  // --------------------------------------------------------------------------
  // System Broadcasts (Firebase Firestore)
  // --------------------------------------------------------------------------

  public async saveBroadcast(broadcast: SystemBroadcast): Promise<void> {
    await this.broadcastsCol().doc(broadcast.id).set(broadcast, { merge: true });
  }

  public async listBroadcasts(onlyActive?: boolean): Promise<SystemBroadcast[]> {
    const snapshot = await this.broadcastsCol().get();
    let list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as SystemBroadcast);
    if (onlyActive) {
      const now = new Date().toISOString();
      list = list.filter((b) => b.isActive && (!b.expiresAt || b.expiresAt > now));
    }
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  public async deleteBroadcast(id: string): Promise<boolean> {
    const ref = this.broadcastsCol().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  // --------------------------------------------------------------------------
  // Platform Payment Methods (Operator Configured)
  // --------------------------------------------------------------------------

  public async listPlatformPaymentMethods(): Promise<PlatformPaymentMethod[]> {
    const snapshot = await this.platformPaymentMethodsCol().get();
    let list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as PlatformPaymentMethod);
    if (list.length === 0) {
      const defaultMethod: PlatformPaymentMethod = {
        id: 'pm_landbank_01',
        type: 'BANK_TRANSFER',
        bankName: 'Land Bank of the Philippines',
        accountName: 'Tuntong Technology Solutions Inc.',
        accountNumber: '0012-9981-22',
        instructions: 'Transfer via InstaPay or PESONet. Key-in your cooperative name or reference number in transfer details.',
        status: 'ACTIVE',
        isDefault: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        updatedBy: 'System Admin',
      };
      await this.savePlatformPaymentMethod(defaultMethod);
      list = [defaultMethod];
    }
    return list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0) || new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  public async savePlatformPaymentMethod(method: PlatformPaymentMethod): Promise<void> {
    await this.platformPaymentMethodsCol().doc(method.id).set(method, { merge: true });
  }

  public async deletePlatformPaymentMethod(id: string): Promise<boolean> {
    const ref = this.platformPaymentMethodsCol().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  // --------------------------------------------------------------------------
  // Platform Credit Top-Up Requests & Verification Queue
  // --------------------------------------------------------------------------

  public async createCreditTopupRequest(request: PlatformCreditTopupRequest): Promise<void> {
    await this.creditTopupRequestsCol().doc(request.id).set(request, { merge: true });
  }

  public async listCreditTopupRequests(tenantId?: string): Promise<PlatformCreditTopupRequest[]> {
    let query: any = this.creditTopupRequestsCol();
    if (tenantId) {
      query = query.where('tenantId', '==', tenantId);
    }
    const snapshot = await query.get();
    const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as PlatformCreditTopupRequest);
    return list.sort((a: any, b: any) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
  }

  public async getCreditTopupRequest(id: string): Promise<PlatformCreditTopupRequest | null> {
    const doc = await this.creditTopupRequestsCol().doc(id).get();
    return doc.exists ? (doc.data() as PlatformCreditTopupRequest) : null;
  }

  public async updateCreditTopupRequest(id: string, updates: Partial<PlatformCreditTopupRequest>): Promise<void> {
    await this.creditTopupRequestsCol().doc(id).set({
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
}
