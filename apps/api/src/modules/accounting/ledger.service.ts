import { CDAAccount, JournalEntry, JournalEntryLine } from '@flexcoop/shared-types';
import { CDACoAManager } from '@flexcoop/cda-coa';

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  category: string;
  debitTotal: number;
  creditTotal: number;
  netDebit: number;
  netCredit: number;
}

export class GeneralLedgerService {
  /**
   * Validates that journal entry is balanced and references valid CDA accounts
   */
  static validateEntry(lines: JournalEntryLine[]): { isValid: boolean; totalDebit: number; totalCredit: number; errors: string[] } {
    const errors: string[] = [];
    let totalDebit = 0;
    let totalCredit = 0;

    if (!lines || lines.length < 2) {
      errors.push('A valid double-entry journal entry must have at least 2 lines (1 debit, 1 credit).');
    }

    for (const line of lines) {
      if (!CDACoAManager.isPostableAccount(line.accountCode)) {
        errors.push(`Account code '${line.accountCode}' is not a valid or postable CDA account.`);
      }

      totalDebit += line.debit || 0;
      totalCredit += line.credit || 0;
    }

    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (totalDebit !== totalCredit) {
      errors.push(`Unbalanced entry! Total Debit (₱${totalDebit.toFixed(2)}) must equal Total Credit (₱${totalCredit.toFixed(2)}).`);
    }

    return {
      isValid: errors.length === 0,
      totalDebit,
      totalCredit,
      errors,
    };
  }

  /**
   * Automated Entry: Loan Disbursement with Upfront Platform & Coop Deductions
   */
  static buildDisbursementEntry(params: {
    loanId: string;
    loanNumber: string;
    grossPrincipal: number;
    platformFee: number;
    coopServiceFee: number;
    netProceeds: number;
    disbursementChannel: 'PLATFORM_ESCROW' | 'BANK' | 'CASH';
    userId: string;
  }): Omit<JournalEntry, 'id'> {
    const cashAccountCode =
      params.disbursementChannel === 'PLATFORM_ESCROW'
        ? '1-01-04' // Platform Escrow Settlement
        : params.disbursementChannel === 'BANK'
        ? '1-01-02' // Cash in Bank
        : '1-01-01'; // Cash on Hand

    const cashAccount = CDACoAManager.findByCode(cashAccountCode)!;
    const loanAccount = CDACoAManager.findByCode('1-02-01')!; // Loans Receivable - Regular
    const feePayableAccount = CDACoAManager.findByCode('2-02-02')!; // Platform Fee Payable
    const coopIncomeAccount = CDACoAManager.findByCode('4-01-02')!; // Service Fee Income

    const lines: JournalEntryLine[] = [
      {
        accountCode: loanAccount.code,
        accountName: loanAccount.name,
        debit: params.grossPrincipal,
        credit: 0,
        memo: `Gross loan receivable - ${params.loanNumber}`,
      },
      {
        accountCode: cashAccount.code,
        accountName: cashAccount.name,
        debit: 0,
        credit: params.netProceeds,
        memo: `Net proceeds disbursed to member`,
      },
    ];

    if (params.platformFee > 0) {
      lines.push({
        accountCode: feePayableAccount.code,
        accountName: feePayableAccount.name,
        debit: 0,
        credit: params.platformFee,
        memo: `Pass-through SaaS platform fee payable`,
      });
    }

    if (params.coopServiceFee > 0) {
      lines.push({
        accountCode: coopIncomeAccount.code,
        accountName: coopIncomeAccount.name,
        debit: 0,
        credit: params.coopServiceFee,
        memo: `Coop filing and service fee income`,
      });
    }

    const validation = this.validateEntry(lines);
    if (!validation.isValid) {
      throw new Error(`Failed to generate disbursement entry: ${validation.errors.join(', ')}`);
    }

    return {
      entryNumber: `JE-DISB-${Date.now().toString(36).toUpperCase()}`,
      postingDate: new Date().toISOString().split('T')[0],
      referenceType: 'LOAN_DISBURSEMENT',
      referenceId: params.loanId,
      description: `Disbursement of Loan ${params.loanNumber} (Net: ₱${params.netProceeds.toFixed(2)})`,
      lines,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      isBalanced: true,
      createdByUserId: params.userId,
      postedAt: new Date().toISOString(),
    };
  }

  /**
   * Automated Entry: Loan Repayment Allocation (Cashier or PayMongo)
   */
  static buildRepaymentEntry(params: {
    loanId: string;
    loanNumber: string;
    grossReceived: number;
    principalPortion: number;
    interestPortion: number;
    penaltyPortion: number;
    passOnFee: number;
    channel: 'PAYMONGO_QRPH' | 'IN_PERSON_CASHIER';
    userId: string;
  }): Omit<JournalEntry, 'id'> {
    const cashCode = params.channel === 'PAYMONGO_QRPH' ? '1-01-05' : '1-01-01';
    const cashAccount = CDACoAManager.findByCode(cashCode)!;
    const loanAccount = CDACoAManager.findByCode('1-02-01')!;
    const interestAccount = CDACoAManager.findByCode('4-01-01')!;
    const penaltyAccount = CDACoAManager.findByCode('4-01-03')!;

    const lines: JournalEntryLine[] = [
      {
        accountCode: cashAccount.code,
        accountName: cashAccount.name,
        debit: params.grossReceived,
        credit: 0,
        memo: `Collection received via ${params.channel}`,
      },
    ];

    if (params.principalPortion > 0) {
      lines.push({
        accountCode: loanAccount.code,
        accountName: loanAccount.name,
        debit: 0,
        credit: params.principalPortion,
        memo: `Principal reduction - ${params.loanNumber}`,
      });
    }

    if (params.interestPortion > 0) {
      lines.push({
        accountCode: interestAccount.code,
        accountName: interestAccount.name,
        debit: 0,
        credit: params.interestPortion,
        memo: `Interest earned on loan`,
      });
    }

    if (params.penaltyPortion > 0) {
      lines.push({
        accountCode: penaltyAccount.code,
        accountName: penaltyAccount.name,
        debit: 0,
        credit: params.penaltyPortion,
        memo: `Fines and penalty charges`,
      });
    }

    if (params.passOnFee > 0) {
      const recoveryAccount = CDACoAManager.findByCode('4-02-02')!;
      lines.push({
        accountCode: recoveryAccount.code,
        accountName: recoveryAccount.name,
        debit: 0,
        credit: params.passOnFee,
        memo: `Pass-on gateway fee recovery`,
      });
    }

    const validation = this.validateEntry(lines);
    if (!validation.isValid) {
      throw new Error(`Failed to generate repayment entry: ${validation.errors.join(', ')}`);
    }

    return {
      entryNumber: `JE-PAY-${Date.now().toString(36).toUpperCase()}`,
      postingDate: new Date().toISOString().split('T')[0],
      referenceType: 'LOAN_REPAYMENT',
      referenceId: params.loanId,
      description: `Repayment on Loan ${params.loanNumber} (Total: ₱${params.grossReceived.toFixed(2)})`,
      lines,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      isBalanced: true,
      createdByUserId: params.userId,
      postedAt: new Date().toISOString(),
    };
  }

  /**
   * Automated Entry: Member Share Capital Paid-Up Contribution
   */
  static buildShareDepositEntry(params: {
    memberId: string;
    memberNumber: string;
    amount: number;
    userId: string;
  }): Omit<JournalEntry, 'id'> {
    const cashAccount = CDACoAManager.findByCode('1-01-01')!; // Cash on Hand
    const shareAccount = CDACoAManager.findByCode('3-01-03')!; // Paid-Up Share Capital - Common

    const lines: JournalEntryLine[] = [
      {
        accountCode: cashAccount.code,
        accountName: cashAccount.name,
        debit: params.amount,
        credit: 0,
        memo: `Share capital deposit from member ${params.memberNumber}`,
      },
      {
        accountCode: shareAccount.code,
        accountName: shareAccount.name,
        debit: 0,
        credit: params.amount,
        memo: `Paid-up share capital common contribution`,
      },
    ];

    const validation = this.validateEntry(lines);
    return {
      entryNumber: `JE-SHR-${Date.now().toString(36).toUpperCase()}`,
      postingDate: new Date().toISOString().split('T')[0],
      referenceType: 'SHARE_CAPITAL_DEPOSIT',
      referenceId: params.memberId,
      description: `Share Capital Paid-Up Contribution (Member: ${params.memberNumber})`,
      lines,
      totalDebit: validation.totalDebit,
      totalCredit: validation.totalCredit,
      isBalanced: true,
      createdByUserId: params.userId,
      postedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates Trial Balance across all posted journal entries
   */
  static generateTrialBalance(entries: JournalEntry[]): {
    items: TrialBalanceItem[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  } {
    const accountMap = new Map<string, { debit: number; credit: number }>();

    for (const entry of entries) {
      for (const line of entry.lines) {
        const current = accountMap.get(line.accountCode) || { debit: 0, credit: 0 };
        current.debit += line.debit || 0;
        current.credit += line.credit || 0;
        accountMap.set(line.accountCode, current);
      }
    }

    const items: TrialBalanceItem[] = [];
    let grandDebit = 0;
    let grandCredit = 0;

    for (const [code, totals] of accountMap.entries()) {
      const coa = CDACoAManager.findByCode(code);
      if (!coa) continue;

      const d = Math.round(totals.debit * 100) / 100;
      const c = Math.round(totals.credit * 100) / 100;

      let netDebit = 0;
      let netCredit = 0;

      if (coa.normalBalance === 'DEBIT') {
        const net = d - c;
        if (net >= 0) netDebit = net;
        else netCredit = Math.abs(net);
      } else {
        const net = c - d;
        if (net >= 0) netCredit = net;
        else netDebit = Math.abs(net);
      }

      items.push({
        accountCode: code,
        accountName: coa.name,
        category: coa.category,
        debitTotal: d,
        creditTotal: c,
        netDebit,
        netCredit,
      });

      grandDebit += netDebit;
      grandCredit += netCredit;
    }

    grandDebit = Math.round(grandDebit * 100) / 100;
    grandCredit = Math.round(grandCredit * 100) / 100;

    return {
      items: items.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
      totalDebit: grandDebit,
      totalCredit: grandCredit,
      isBalanced: grandDebit === grandCredit,
    };
  }

  /**
   * Generates Balance Sheet & Statement of Operations (Income Statement) compliant with CDA standards
   */
  static generateFinancialStatements(entries: JournalEntry[]): {
    balanceSheet: {
      assets: { items: TrialBalanceItem[]; total: number };
      liabilities: { items: TrialBalanceItem[]; total: number };
      equity: { items: TrialBalanceItem[]; total: number };
      totalLiabilitiesAndEquity: number;
      isBalanced: boolean;
    };
    incomeStatement: {
      revenues: { items: TrialBalanceItem[]; total: number };
      expenses: { items: TrialBalanceItem[]; total: number };
      netSurplus: number;
    };
  } {
    const tb = this.generateTrialBalance(entries);

    const assets = tb.items.filter((i) => i.category === 'ASSETS');
    const liabilities = tb.items.filter((i) => i.category === 'LIABILITIES');
    const equity = tb.items.filter((i) => i.category === 'EQUITY');
    const revenues = tb.items.filter((i) => i.category === 'REVENUE');
    const expenses = tb.items.filter((i) => i.category === 'EXPENSES');

    const totalAssets = Math.round(assets.reduce((sum, a) => sum + a.netDebit - a.netCredit, 0) * 100) / 100;
    const totalLiabilities = Math.round(liabilities.reduce((sum, l) => sum + l.netCredit - l.netDebit, 0) * 100) / 100;
    const baseEquity = Math.round(equity.reduce((sum, e) => sum + e.netCredit - e.netDebit, 0) * 100) / 100;

    const totalRevenues = Math.round(revenues.reduce((sum, r) => sum + r.netCredit - r.netDebit, 0) * 100) / 100;
    const totalExpenses = Math.round(expenses.reduce((sum, e) => sum + e.netDebit - e.netCredit, 0) * 100) / 100;
    const netSurplus = Math.round((totalRevenues - totalExpenses) * 100) / 100;

    const totalEquity = Math.round((baseEquity + netSurplus) * 100) / 100;
    const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;

    return {
      balanceSheet: {
        assets: { items: assets, total: totalAssets },
        liabilities: { items: liabilities, total: totalLiabilities },
        equity: { items: equity, total: totalEquity },
        totalLiabilitiesAndEquity,
        isBalanced: totalAssets === totalLiabilitiesAndEquity,
      },
      incomeStatement: {
        revenues: { items: revenues, total: totalRevenues },
        expenses: { items: expenses, total: totalExpenses },
        netSurplus,
      },
    };
  }
}

