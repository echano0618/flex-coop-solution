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
import { dbStore, PlatformPaymentMethod, PlatformCreditTopupRequest } from './store';

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

  public isConfigured(): boolean {
    return !!(
      process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_CONFIG ||
      process.env.K_SERVICE ||
      process.env.NODE_ENV === 'production'
    );
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

  public shareTransactionsCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('share_transactions');
  }

  public bankTransferRequestsCol(tenantId: string) {
    return this.tenantDoc(tenantId).collection('bank_transfer_requests');
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
    if (!this.isConfigured()) return;
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
    if (!this.isConfigured()) return;
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
    if (!this.isConfigured()) return;
    await this.membersCol(tenantId).doc(member.id).set(member, { merge: true });
  }

  public async updateMember(tenantId: string, memberId: string, updates: Record<string, any>): Promise<void> {
    if (!this.isConfigured()) return;
    await this.membersCol(tenantId).doc(memberId).set(updates, { merge: true });
  }

  public async getMember(tenantId: string, memberId: string): Promise<Member | null> {
    if (!this.isConfigured()) return null;
    const cleanId = (memberId || '').trim();
    if (!cleanId) return null;

    const doc = await this.membersCol(tenantId).doc(cleanId).get();
    if (doc.exists) return { ...(doc.data() as any), id: doc.id } as Member;

    if (cleanId === 'mem_gm_0001' || cleanId.toLowerCase() === 'admin' || cleanId.toLowerCase() === 'gm') {
      const gmDoc = await this.membersCol(tenantId).doc('MEM-2026-0001').get();
      if (gmDoc.exists) return { ...(gmDoc.data() as any), id: gmDoc.id } as Member;
    }

    if (cleanId === 'MEM-2026-0001') {
      const gmDoc2 = await this.membersCol(tenantId).doc('mem_gm_0001').get();
      if (gmDoc2.exists) return { ...(gmDoc2.data() as any), id: gmDoc2.id } as Member;
    }

    try {
      const q1 = await this.membersCol(tenantId).where('memberNumber', '==', cleanId).limit(1).get();
      if (!q1.empty) return { ...(q1.docs[0].data() as any), id: q1.docs[0].id } as Member;
    } catch {}

    try {
      const q2 = await this.membersCol(tenantId).where('memberNo', '==', cleanId).limit(1).get();
      if (!q2.empty) return { ...(q2.docs[0].data() as any), id: q2.docs[0].id } as Member;
    } catch {}

    try {
      const q3 = await this.membersCol(tenantId).where('email', '==', cleanId.toLowerCase()).limit(1).get();
      if (!q3.empty) return { ...(q3.docs[0].data() as any), id: q3.docs[0].id } as Member;
    } catch {}

    return null;
  }

  public async listMembers(tenantId: string): Promise<Member[]> {
    if (!this.isConfigured()) return [];
    try {
      const snapshot = await this.membersCol(tenantId).get();
      return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ ...(doc.data() as any), id: doc.id } as Member));
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Loans Management
  // --------------------------------------------------------------------------

  public async saveLoan(tenantId: string, loan: Loan): Promise<void> {
    if (!this.isConfigured()) return;
    await this.loansCol(tenantId).doc(loan.id).set(loan, { merge: true });
  }

  public async getLoan(tenantId: string, loanId: string): Promise<Loan | null> {
    if (!this.isConfigured()) return null;
    try {
      const doc = await this.loansCol(tenantId).doc(loanId).get();
      if (doc.exists) return doc.data() as Loan;
    } catch {}

    try {
      const q = await this.loansCol(tenantId).where('loanNumber', '==', loanId).limit(1).get();
      if (!q.empty) return q.docs[0].data() as Loan;
    } catch {}

    return null;
  }

  public async listLoans(tenantId: string): Promise<Loan[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.loansCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as Loan);
  }

  public async updateLoanStatus(
    tenantId: string,
    loanId: string,
    status: Loan['status'],
    extraFields?: Partial<Loan>
  ): Promise<void> {
    if (!this.isConfigured()) return;
    const updatePayload = {
      status,
      ...extraFields,
      updatedAt: new Date().toISOString(),
    };
    try {
      await this.loansCol(tenantId).doc(loanId).update(updatePayload);
      return;
    } catch (err) {
      // If doc(loanId) does not exist, attempt query by loanNumber
      try {
        const q = await this.loansCol(tenantId).where('loanNumber', '==', loanId).limit(1).get();
        if (!q.empty) {
          await q.docs[0].ref.update(updatePayload);
          return;
        }
      } catch {}
    }
  }

  // --------------------------------------------------------------------------
  // Loan Products & Credit Facilities (Persisted in /tenants/{tenantId}/loan_products)
  // --------------------------------------------------------------------------

  public async saveLoanProduct(tenantId: string, product: LoanProduct | any): Promise<void> {
    if (!this.isConfigured()) return;
    const prodId = product.id || `prod_${(product.code || 'loan').toLowerCase()}_${Date.now()}`;
    await this.loanProductsCol(tenantId).doc(prodId).set(
      {
        ...product,
        id: prodId,
        tenantId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async getLoanProduct(tenantId: string, productId: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.loanProductsCol(tenantId).doc(productId).get();
    return doc.exists ? doc.data() : null;
  }

  public async listLoanProducts(tenantId: string): Promise<any[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.loanProductsCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data());
  }

  public async updateLoanProduct(
    tenantId: string,
    productId: string,
    updates: Partial<LoanProduct> | any
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.loanProductsCol(tenantId).doc(productId).set(
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async deleteLoanProduct(tenantId: string, productId: string): Promise<void> {
    if (!this.isConfigured()) return;
    await this.loanProductsCol(tenantId).doc(productId).delete();
  }

  // --------------------------------------------------------------------------
  // Atomic Double-Entry General Ledger (CDA Compliant)
  // --------------------------------------------------------------------------

  public async postBalancedJournalEntry(
    tenantId: string,
    entry: JournalEntry
  ): Promise<{ success: boolean; entryId: string; error?: string }> {
    if (!this.isConfigured()) return { success: true, entryId: entry.id };
    // 1. Double-entry validation: Total Debits must strictly equal Total Credits
    const totalDebit = entry.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = entry.lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Double-Entry Violation: Debit (₱${totalDebit}) does not equal Credit (₱${totalCredit})`);
    }

    // 2. Execute atomic Firestore Transaction
    return await this.db.runTransaction(async (transaction: Transaction) => {
      // 2.1 READ ALL ACCOUNTS FIRST (Firestore requires all reads before writes)
      const accountUpdates: { ref: any; updates: any }[] = [];
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

          accountUpdates.push({
            ref: accRef,
            updates: {
              currentDebit: newDebit,
              currentCredit: newCredit,
              netBalance,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      }

      // 2.2 EXECUTE ALL WRITES
      const entryRef = this.journalEntriesCol(tenantId).doc(entry.id);
      transaction.set(entryRef, {
        ...entry,
        totalDebit,
        totalCredit,
        isBalanced: true,
        postedAt: new Date().toISOString(),
      });

      for (const acc of accountUpdates) {
        transaction.update(acc.ref, acc.updates);
      }

      return { success: true, entryId: entry.id };
    });
  }

  public async postJournalEntry(tenantId: string, entry: any): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await this.postBalancedJournalEntry(tenantId, entry);
    } catch (err) {
      console.warn(`[FirestoreCoopService] postBalancedJournalEntry warning, saving directly:`, err);
      await this.journalEntriesCol(tenantId).doc(entry.id).set({
        ...entry,
        isBalanced: true,
        postedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }

  public async listJournalEntries(tenantId: string): Promise<JournalEntry[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.journalEntriesCol(tenantId).get();
    const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as JournalEntry);
    return list.sort(
      (a: any, b: any) =>
        new Date(b.postedAt || b.postingDate || b.date || 0).getTime() -
        new Date(a.postedAt || a.postingDate || a.date || 0).getTime()
    );
  }

  public async deleteLoan(tenantId: string, loanId: string): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await this.loansCol(tenantId).doc(loanId).delete();
    } catch {}
    try {
      const q = await this.loansCol(tenantId).where('loanNumber', '==', loanId).get();
      for (const doc of q.docs) {
        await doc.ref.delete();
      }
    } catch {}
    try {
      const q2 = await this.loansCol(tenantId).where('id', '==', loanId).get();
      for (const doc of q2.docs) {
        await doc.ref.delete();
      }
    } catch {}
  }

  public async deleteJournalEntry(tenantId: string, entryId: string): Promise<void> {
    if (!this.isConfigured()) return;
    await this.journalEntriesCol(tenantId).doc(entryId).delete();
  }

  public async rebuildChartOfAccounts(tenantId: string, entries: JournalEntry[]): Promise<void> {
    if (!this.isConfigured()) return;
    const accountsSnap = await this.coaCol(tenantId).get();
    if (accountsSnap.empty) return;

    const totalsMap = new Map<string, { debit: number; credit: number }>();
    for (const entry of entries) {
      for (const line of entry.lines || []) {
        const cur = totalsMap.get(line.accountCode) || { debit: 0, credit: 0 };
        cur.debit = Math.round((cur.debit + Number(line.debit || 0)) * 100) / 100;
        cur.credit = Math.round((cur.credit + Number(line.credit || 0)) * 100) / 100;
        totalsMap.set(line.accountCode, cur);
      }
    }

    const batch = this.db.batch();
    const nowIso = new Date().toISOString();
    accountsSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      const code = data.code || doc.id;
      const totals = totalsMap.get(code) || { debit: 0, credit: 0 };
      const isDebitNormal = data.normalBalance === 'DEBIT';
      const netBalance = Math.round((isDebitNormal ? totals.debit - totals.credit : totals.credit - totals.debit) * 100) / 100;
      batch.update(doc.ref, {
        currentDebit: totals.debit,
        currentCredit: totals.credit,
        netBalance,
        updatedAt: nowIso,
      });
    });
    await batch.commit();
  }

  // --------------------------------------------------------------------------
  // Repayments & Cashiering
  // --------------------------------------------------------------------------

  public async recordPayment(
    tenantId: string,
    payment: PaymentTransaction
  ): Promise<void> {
    if (!this.isConfigured()) return;
    await this.db.runTransaction(async (transaction: Transaction) => {
      // 1. READ LOAN RECORD FIRST (Firestore requires all reads before writes)
      const loanRef = this.loansCol(tenantId).doc(payment.loanId);
      const loanDoc = await transaction.get(loanRef);

      // 2. EXECUTE ALL WRITES
      const paymentRef = this.paymentsCol(tenantId).doc(payment.id);
      transaction.set(paymentRef, payment);

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
    if (!this.isConfigured()) return;
    await this.invoicesCol(tenantId).doc(invoice.id).set(invoice);
  }

  public async listInvoices(tenantId: string): Promise<PlatformInvoice[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.invoicesCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as PlatformInvoice);
  }

  // --------------------------------------------------------------------------
  // Share Capital Transactions
  // --------------------------------------------------------------------------

  public async recordShareTransaction(tenantId: string, txn: any): Promise<void> {
    if (!this.isConfigured()) return;
    const docId = txn.id || `stx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await this.shareTransactionsCol(tenantId).doc(docId).set(
      {
        ...txn,
        id: docId,
        createdAt: txn.createdAt || new Date().toISOString(),
      },
      { merge: true }
    );
  }

  public async syncShareTransactionsFromJournalEntries(tenantId: string): Promise<number> {
    if (!this.isConfigured()) return 0;
    try {
      const journalSnap = await this.journalEntriesCol(tenantId).where('referenceType', '==', 'SHARE_CAPITAL_DEPOSIT').get();
      if (journalSnap.empty) return 0;

      const existingSnap = await this.shareTransactionsCol(tenantId).get();
      const existingIds = new Set(existingSnap.docs.map((d: any) => d.id));
      const existingJournalIds = new Set(existingSnap.docs.map((d: any) => d.data().journalEntryId));

      let backfilledCount = 0;
      for (const doc of journalSnap.docs) {
        const je = doc.data();
        const expectedStxId = `stx_${je.id}`;
        if (!existingIds.has(expectedStxId) && !existingJournalIds.has(je.id)) {
          const shareLine = (je.lines || []).find((l: any) => l.subledgerType === 'SHARE_CAPITAL' || (l.credit && l.credit > 0)) || (je.lines || [])[0];
          const amount = je.totalCredit || je.totalDebit || (shareLine ? shareLine.credit : 0) || 0;
          const memberId = je.referenceId || (shareLine ? shareLine.memberId : '') || '';
          const memberNumber = (shareLine ? shareLine.memberNumber : '') || '';
          const memberName = (shareLine ? shareLine.memberName : '') || '';
          const sharesCount = Math.round(Number(amount) / 100);

          await this.shareTransactionsCol(tenantId).doc(expectedStxId).set({
            id: expectedStxId,
            memberId,
            memberNumber,
            memberName,
            amount: Number(amount),
            sharesCount,
            channel: je.channel || 'IN_PERSON_CASHIER',
            receiptNumber: je.receiptNumber || `OR-SHR-${je.id}`,
            journalEntryId: je.id,
            classification: Number(amount) >= 5000 ? 'REGULAR' : 'ASSOCIATE',
            createdAt: je.postedAt || je.postingDate || new Date().toISOString(),
          }, { merge: true });
          backfilledCount++;
        }
      }
      return backfilledCount;
    } catch (err) {
      console.warn('syncShareTransactionsFromJournalEntries warning:', err);
      return 0;
    }
  }

  public async listShareTransactions(tenantId: string, memberId?: string): Promise<any[]> {
    if (!this.isConfigured()) return [];
    await this.syncShareTransactionsFromJournalEntries(tenantId);
    const snapshot = await this.shareTransactionsCol(tenantId).get();
    let records = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    if (memberId) {
      const target = String(memberId).trim().toLowerCase();
      records = records.filter(
        (t: any) =>
          String(t.memberId || '').trim().toLowerCase() === target ||
          String(t.memberNumber || '').trim().toLowerCase() === target
      );
    }
    return records.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  // --------------------------------------------------------------------------
  // Bank Transfer Payment Verification Requests
  // --------------------------------------------------------------------------

  public async saveBankTransferRequest(tenantId: string, req: any): Promise<void> {
    if (!this.isConfigured()) return;
    await this.bankTransferRequestsCol(tenantId).doc(req.id).set(req, { merge: true });
  }

  public async getBankTransferRequest(tenantId: string, id: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.bankTransferRequestsCol(tenantId).doc(id).get();
    return doc.exists ? doc.data() : null;
  }

  public async listBankTransferRequests(tenantId: string, status?: string): Promise<any[]> {
    if (!this.isConfigured()) return [];
    let q: any = this.bankTransferRequestsCol(tenantId);
    if (status) {
      q = q.where('status', '==', status);
    }
    const snapshot = await q.get();
    const list = snapshot.docs.map((d: any) => d.data());
    return list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  public async updateBankTransferRequest(tenantId: string, id: string, updates: any): Promise<void> {
    if (!this.isConfigured()) return;
    await this.bankTransferRequestsCol(tenantId).doc(id).set(updates, { merge: true });
  }

  // --------------------------------------------------------------------------
  // AMLC Triggers
  // --------------------------------------------------------------------------

  public async recordAMLCAlert(tenantId: string, alert: AMLCCoveredTransactionAlert): Promise<void> {
    if (!this.isConfigured()) return;
    await this.amlcAlertsCol(tenantId).doc(alert.id).set(alert);
  }

  public async listAMLCAlerts(tenantId: string): Promise<AMLCCoveredTransactionAlert[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.amlcAlertsCol(tenantId).get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as AMLCCoveredTransactionAlert);
  }

  // --------------------------------------------------------------------------
  // Applications Management (Online PMES & eKYC Queue)
  // --------------------------------------------------------------------------

  public async saveApplication(tenantId: string, application: any): Promise<void> {
    if (!this.isConfigured()) return;
    await this.applicationsCol(tenantId).doc(application.id).set(application, { merge: true });
  }

  public async getApplication(tenantId: string, applicationId: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.applicationsCol(tenantId).doc(applicationId).get();
    return doc.exists ? doc.data() : null;
  }

  public async listApplications(tenantId: string): Promise<any[]> {
    if (!this.isConfigured()) return [];
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
    if (!this.isConfigured()) return;
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
  // Member Credentials Management (Strict Authentication: Single Entry by Registered Email)
  // --------------------------------------------------------------------------

  public async saveMemberCredential(tenantId: string, cred: any): Promise<void> {
    const rawEmail = cred.email || (cred.username && cred.username.includes('@') ? cred.username : '');
    const email = (rawEmail || '').toLowerCase().trim();
    const docKey = email || (cred.memberNumber || cred.memberId || cred.username || '').toLowerCase().trim();
    if (!docKey) {
      console.warn('saveMemberCredential skipped: missing registered identifier for', cred);
      return;
    }

    const payload = {
      ...cred,
      username: cred.username || email || docKey,
      email: email || cred.email,
      memberNumber: cred.memberNumber,
      memberId: cred.memberId,
      updatedAt: new Date().toISOString(),
    };

    // 1. In-memory cache in dbStore for fast lookup and offline resilience
    if (!dbStore.memberCredentials.has(tenantId)) {
      dbStore.memberCredentials.set(tenantId, new Map());
    }
    const tenantCreds = dbStore.memberCredentials.get(tenantId)!;
    tenantCreds.set(docKey, payload);
    if (email) tenantCreds.set(email, payload);
    if (cred.memberNumber) tenantCreds.set(cred.memberNumber.toLowerCase().trim(), payload);
    if (cred.memberId) tenantCreds.set(cred.memberId.toLowerCase().trim(), payload);
    if (cred.username) tenantCreds.set(cred.username.toLowerCase().trim(), payload);

    if (!this.isConfigured()) return;

    try {
      // Primary save by docKey
      await this.credentialsCol(tenantId).doc(docKey).set(payload, { merge: true });

      // Also mirror to email doc if email exists and docKey was different
      if (email && docKey !== email) {
        await this.credentialsCol(tenantId).doc(email).set(payload, { merge: true });
      }
      // Also mirror to memberNumber doc if memberNumber exists
      if (cred.memberNumber && docKey !== cred.memberNumber.toLowerCase().trim()) {
        await this.credentialsCol(tenantId).doc(cred.memberNumber.toLowerCase().trim()).set(payload, { merge: true });
      }
    } catch (err) {
      // Graceful fallback when Firestore ADC is unconfigured locally
    }
  }

  public async getMemberCredential(tenantId: string, identifier: string): Promise<any | null> {
    const idTrim = (identifier || '').trim();
    const idLower = idTrim.toLowerCase();
    if (!idLower) return null;

    // 1. Check in-memory store cache first
    const memCreds = dbStore.memberCredentials.get(tenantId);
    if (memCreds) {
      if (memCreds.has(idLower)) return memCreds.get(idLower);
      if (memCreds.has(idTrim)) return memCreds.get(idTrim);
    }

    if (!this.isConfigured()) return null;

    try {
      // 1. Check direct doc by identifier (email, username, or memberNumber)
      const doc = await this.credentialsCol(tenantId).doc(idLower).get();
      if (doc.exists) return doc.data();

      // 2. Query by email field
      const byEmail = await this.credentialsCol(tenantId).where('email', '==', idLower).limit(1).get();
      if (!byEmail.empty) return byEmail.docs[0].data();

      // 3. Query by memberNumber
      const byMemberNo = await this.credentialsCol(tenantId).where('memberNumber', '==', idTrim).limit(1).get();
      if (!byMemberNo.empty) return byMemberNo.docs[0].data();

      // 4. Query by memberId
      const byMemberId = await this.credentialsCol(tenantId).where('memberId', '==', idTrim).limit(1).get();
      if (!byMemberId.empty) return byMemberId.docs[0].data();

      // 5. Query by username
      const byUsername = await this.credentialsCol(tenantId).where('username', '==', idLower).limit(1).get();
      if (!byUsername.empty) return byUsername.docs[0].data();

      // 6. Query by phone
      const byPhone = await this.credentialsCol(tenantId).where('phone', '==', idTrim).limit(1).get();
      if (!byPhone.empty) return byPhone.docs[0].data();
    } catch (err) {
      // Graceful fallback when Firestore ADC is unconfigured locally
      return null;
    }

    return null;
  }

  // --------------------------------------------------------------------------
  // System Configuration (General Settings, Technology Fee, Share Capital)
  // --------------------------------------------------------------------------

  public async saveSystemConfig(tenantId: string, config: any): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      await this.systemConfigDoc(tenantId).set(
        {
          ...config,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {}
  }

  public async getSystemConfig(tenantId: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    try {
      const doc = await this.systemConfigDoc(tenantId).get();
      return doc.exists ? doc.data() : null;
    } catch {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Tenant Fleet Management
  // --------------------------------------------------------------------------

  public async saveTenant(tenant: Tenant): Promise<void> {
    if (!this.isConfigured()) return;
    await this.tenantDoc(tenant.id).set(tenant, { merge: true });
  }

  public async getTenant(tenantId: string): Promise<Tenant | null> {
    if (!this.isConfigured()) return null;
    try {
      const doc = await this.tenantDoc(tenantId).get();
      return doc.exists ? (doc.data() as Tenant) : null;
    } catch {
      return null;
    }
  }

  public async listTenants(): Promise<Tenant[]> {
    if (!this.isConfigured()) return [];
    try {
      const snapshot = await this.db.collection('tenants').get();
      return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as Tenant);
    } catch {
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Ledger Clearance (Production Reset Support)
  // --------------------------------------------------------------------------

  public async clearTenantLedger(tenantId: string): Promise<void> {
    if (!this.isConfigured()) return;
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
    if (!this.isConfigured()) return;
    await this.operatorsCol().doc(operator.username.toLowerCase()).set({
      ...operator,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  public async getOperator(usernameOrEmail: string): Promise<OperatorAccount | null> {
    if (!this.isConfigured()) return null;
    const q = (usernameOrEmail || '').toLowerCase().trim();
    const doc = await this.operatorsCol().doc(q).get();
    if (doc.exists) return doc.data() as OperatorAccount;
    const byEmail = await this.operatorsCol().where('email', '==', q).limit(1).get();
    if (!byEmail.empty) return byEmail.docs[0].data() as OperatorAccount;
    return null;
  }

  public async listOperators(): Promise<OperatorAccount[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.operatorsCol().get();
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as OperatorAccount);
  }

  public async deleteOperator(username: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const docRef = this.operatorsCol().doc(username.toLowerCase());
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  }

  public async saveOperatorOtp(username: string, data: { otp: string; expiresAt: number; attempts: number; email: string }): Promise<void> {
    if (!this.isConfigured()) return;
    await this.operatorOtpsCol().doc(username.toLowerCase()).set({
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  public async getOperatorOtp(username: string): Promise<{ otp: string; expiresAt: number; attempts: number; email: string } | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.operatorOtpsCol().doc(username.toLowerCase()).get();
    return doc.exists ? (doc.data() as any) : null;
  }

  public async deleteOperatorOtp(username: string): Promise<void> {
    if (!this.isConfigured()) return;
    await this.operatorOtpsCol().doc(username.toLowerCase()).delete();
  }

  public async saveOperatorSession(session: OperatorSession): Promise<void> {
    if (!this.isConfigured()) return;
    await this.operatorSessionsCol().doc(session.token).set(session);
  }

  public async getOperatorSession(token: string): Promise<OperatorSession | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.operatorSessionsCol().doc(token).get();
    return doc.exists ? (doc.data() as OperatorSession) : null;
  }

  public async deleteOperatorSession(token: string): Promise<void> {
    if (!this.isConfigured()) return;
    await this.operatorSessionsCol().doc(token).delete();
  }

  // --------------------------------------------------------------------------
  // Tenant Fleet Status & Platform Credit Balance
  // --------------------------------------------------------------------------

  public async updateTenantStatus(tenantId: string, status: string, reason?: string): Promise<void> {
    if (!this.isConfigured()) return;
    await this.tenantDoc(tenantId).set({
      status,
      statusReason: reason || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  public async updateTenantCreditBalance(tenantId: string, balance: number): Promise<void> {
    if (!this.isConfigured()) return;
    await this.tenantDoc(tenantId).set({
      platformCreditBalance: balance,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  // --------------------------------------------------------------------------
  // Cooperative Registrations (Onboarding Queue in Firebase Firestore)
  // --------------------------------------------------------------------------

  public async saveRegistration(reg: CooperativeRegistration): Promise<void> {
    if (!this.isConfigured()) return;
    await this.coopRegistrationsCol().doc(reg.id).set(reg, { merge: true });
  }

  public async getRegistration(id: string): Promise<CooperativeRegistration | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.coopRegistrationsCol().doc(id).get();
    return doc.exists ? (doc.data() as CooperativeRegistration) : null;
  }

  public async listRegistrations(): Promise<CooperativeRegistration[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.coopRegistrationsCol().get();
    const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as CooperativeRegistration);
    return list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  }

  public async deleteRegistration(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const ref = this.coopRegistrationsCol().doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }

  public async clearAllRegistrations(): Promise<void> {
    if (!this.isConfigured()) return;
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
    if (!this.isConfigured()) return;
    await this.creditTransactionsCol().doc(tx.id).set(tx);
  }

  public async listCreditTransactions(tenantId?: string): Promise<PlatformCreditTransaction[]> {
    if (!this.isConfigured()) return [];
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
    if (!this.isConfigured()) return;
    await this.broadcastsCol().doc(broadcast.id).set(broadcast, { merge: true });
  }

  public async listBroadcasts(onlyActive?: boolean): Promise<SystemBroadcast[]> {
    if (!this.isConfigured()) return [];
    const snapshot = await this.broadcastsCol().get();
    let list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as SystemBroadcast);
    if (onlyActive) {
      const now = new Date().toISOString();
      list = list.filter((b) => b.isActive && (!b.expiresAt || b.expiresAt > now));
    }
    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  public async deleteBroadcast(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
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
    if (!this.isConfigured()) return [];
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
    if (!this.isConfigured()) return;
    await this.platformPaymentMethodsCol().doc(method.id).set(method, { merge: true });
  }

  public async deletePlatformPaymentMethod(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
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
    if (!this.isConfigured()) return;
    await this.creditTopupRequestsCol().doc(request.id).set(request, { merge: true });
  }

  public async listCreditTopupRequests(tenantId?: string): Promise<PlatformCreditTopupRequest[]> {
    if (!this.isConfigured()) return [];
    let query: any = this.creditTopupRequestsCol();
    if (tenantId) {
      query = query.where('tenantId', '==', tenantId);
    }
    const snapshot = await query.get();
    const list = snapshot.docs.map((doc: QueryDocumentSnapshot) => doc.data() as PlatformCreditTopupRequest);
    return list.sort((a: any, b: any) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
  }

  public async getCreditTopupRequest(id: string): Promise<PlatformCreditTopupRequest | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.creditTopupRequestsCol().doc(id).get();
    return doc.exists ? (doc.data() as PlatformCreditTopupRequest) : null;
  }

  public async updateCreditTopupRequest(id: string, updates: Partial<PlatformCreditTopupRequest>): Promise<void> {
    if (!this.isConfigured()) return;
    await this.creditTopupRequestsCol().doc(id).set({
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  // --------------------------------------------------------------------------
  // Platform Configuration (PayMongo, Gateway Credentials)
  // --------------------------------------------------------------------------

  public platformConfigCol() {
    return this.db.collection('platform_config');
  }

  public async getPlatformConfig(configId: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    const doc = await this.platformConfigCol().doc(configId).get();
    return doc.exists ? doc.data() : null;
  }

  public async savePlatformConfig(configId: string, data: any): Promise<void> {
    if (!this.isConfigured()) return;
    await this.platformConfigCol().doc(configId).set({
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }

  public tenantPaymongoDoc(tenantId: string) {
    return this.tenantDoc(tenantId).collection('system_config').doc('paymongo');
  }

  public async getTenantPaymongoConfig(tenantId: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    try {
      const doc = await this.tenantPaymongoDoc(tenantId).get();
      return doc.exists ? doc.data() : null;
    } catch {
      return null;
    }
  }

  public async saveTenantPaymongoConfig(tenantId: string, data: any): Promise<void> {
    if (!this.isConfigured()) return;
    await this.tenantPaymongoDoc(tenantId).set({
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
}

