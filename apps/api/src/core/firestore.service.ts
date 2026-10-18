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
} from '@flexcoop/shared-types';
import { CDACoAManager } from '@flexcoop/cda-coa';

export class FirestoreCoopService {
  private static instance: FirestoreCoopService;
  private db: Firestore;

  private constructor() {
    if (getApps().length === 0) {
      const projectId = process.env.FIREBASE_PROJECT_ID || 'flex-coop-solution';
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

  // --------------------------------------------------------------------------
  // Members Management
  // --------------------------------------------------------------------------

  public async saveMember(tenantId: string, member: Member): Promise<void> {
    await this.membersCol(tenantId).doc(member.id).set(member, { merge: true });
  }

  public async getMember(tenantId: string, memberId: string): Promise<Member | null> {
    const doc = await this.membersCol(tenantId).doc(memberId).get();
    return doc.exists ? (doc.data() as Member) : null;
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
}
