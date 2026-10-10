import { SurplusDistributionResult, MemberSurplusVoucher, JournalEntryLine } from '@flexcoop/shared-types';

export interface SurplusCalculationInput {
  fiscalYear: number;
  grossRevenue: number;
  totalExpenses: number;
  generalReserveFundRate?: number; // Minimum 10%
  cetfRate?: number; // Maximum 10% (50% local, 50% apex)
  communityDevFundRate?: number; // Minimum 3%
  optionalFundRate?: number; // Maximum 7%
  shareCapitalInterestRatio?: number; // Typically 60% of distributable surplus
  members: Array<{
    memberId: string;
    memberNumber: string;
    memberName: string;
    paidUpShareCapital: number;
    interestPaidOnLoans: number;
  }>;
}

export class NetSurplusService {
  /**
   * Calculates statutory net surplus distribution according to Article 86 of RA 9520 (Philippine Cooperative Code)
   */
  public static calculateNetSurplus(input: SurplusCalculationInput): SurplusDistributionResult {
    const netSurplus = Math.max(0, Math.round((input.grossRevenue - input.totalExpenses) * 100) / 100);

    const grfRate = input.generalReserveFundRate ?? 0.10; // Min 10%
    const cetfRate = input.cetfRate ?? 0.10; // Max 10%
    const cdfRate = input.communityDevFundRate ?? 0.03; // Min 3%
    const optRate = input.optionalFundRate ?? 0.07; // Max 7%

    const generalReserveFund = Math.round(netSurplus * grfRate * 100) / 100;
    const cetfTotal = Math.round(netSurplus * cetfRate * 100) / 100;
    const cetfLocalFund = Math.round(cetfTotal * 0.50 * 100) / 100;
    const cetfApexFund = Math.round((cetfTotal - cetfLocalFund) * 100) / 100;
    const communityDevelopmentFund = Math.round(netSurplus * cdfRate * 100) / 100;
    const optionalFund = Math.round(netSurplus * optRate * 100) / 100;

    const totalStatutoryReserves = Math.round(
      (generalReserveFund + cetfTotal + communityDevelopmentFund + optionalFund) * 100
    ) / 100;

    const distributableSurplus = Math.max(0, Math.round((netSurplus - totalStatutoryReserves) * 100) / 100);

    const iscRatio = input.shareCapitalInterestRatio ?? 0.60;
    const totalInterestOnShareCapital = Math.round(distributableSurplus * iscRatio * 100) / 100;
    const totalPatronageRefund = Math.round((distributableSurplus - totalInterestOnShareCapital) * 100) / 100;

    const totalPaidUpCapital = input.members.reduce((acc, m) => acc + m.paidUpShareCapital, 0);
    const totalInterestPaid = input.members.reduce((acc, m) => acc + m.interestPaidOnLoans, 0);

    const memberAllocations: MemberSurplusVoucher[] = input.members.map((m) => {
      const isc =
        totalPaidUpCapital > 0
          ? Math.round(((m.paidUpShareCapital / totalPaidUpCapital) * totalInterestOnShareCapital) * 100) / 100
          : 0;

      const pr =
        totalInterestPaid > 0
          ? Math.round(((m.interestPaidOnLoans / totalInterestPaid) * totalPatronageRefund) * 100) / 100
          : 0;

      return {
        memberId: m.memberId,
        memberNumber: m.memberNumber,
        memberName: m.memberName,
        paidUpShareCapital: m.paidUpShareCapital,
        interestPaidOnLoans: m.interestPaidOnLoans,
        interestOnShareCapital: isc,
        patronageRefund: pr,
        totalSurplusPayable: Math.round((isc + pr) * 100) / 100,
      };
    });

    return {
      id: `surplus_${input.fiscalYear}_${Date.now()}`,
      fiscalYear: input.fiscalYear,
      netSurplus,
      generalReserveFund,
      cetfLocalFund,
      cetfApexFund,
      communityDevelopmentFund,
      optionalFund,
      totalStatutoryReserves,
      distributableSurplus,
      totalInterestOnShareCapital,
      totalPatronageRefund,
      memberAllocations,
      status: 'PROPOSED',
    };
  }

  /**
   * Builds CDA Standard Double-Entry General Ledger Voucher for Net Surplus Distribution
   * Ensures Total Debit == Total Credit
   */
  public static buildSurplusDistributionEntry(
    surplus: SurplusDistributionResult,
    userId: string
  ): {
    voucherNumber: string;
    description: string;
    lines: JournalEntryLine[];
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    userId: string;
    postedAt: string;
  } {
    const lines: JournalEntryLine[] = [];

    // 1. Debit Undivided Net Surplus (3-03-01)
    lines.push({
      accountCode: '3-03-01',
      accountName: 'Undivided Net Surplus',
      debit: surplus.netSurplus,
      credit: 0,
    });

    // 2. Credit Statutory Reserves
    // General Reserve Fund (3-02-01)
    if (surplus.generalReserveFund > 0) {
      lines.push({
        accountCode: '3-02-01',
        accountName: 'General Reserve Fund',
        debit: 0,
        credit: surplus.generalReserveFund,
      });
    }

    // Cooperative Education and Training Fund (2-04-01)
    const totalCetf = Math.round((surplus.cetfLocalFund + surplus.cetfApexFund) * 100) / 100;
    if (totalCetf > 0) {
      lines.push({
        accountCode: '2-04-01',
        accountName: 'Cooperative Education & Training Fund (CETF)',
        debit: 0,
        credit: totalCetf,
      });
    }

    // Community Development Fund (2-04-02)
    if (surplus.communityDevelopmentFund > 0) {
      lines.push({
        accountCode: '2-04-02',
        accountName: 'Community Development Fund',
        debit: 0,
        credit: surplus.communityDevelopmentFund,
      });
    }

    // Optional Reserve Fund (3-02-02)
    if (surplus.optionalFund > 0) {
      lines.push({
        accountCode: '3-02-02',
        accountName: 'Optional Reserve Fund',
        debit: 0,
        credit: surplus.optionalFund,
      });
    }

    // 3. Credit Payables to Members (Distributable portion)
    // Interest on Share Capital Payable (2-03-01)
    if (surplus.totalInterestOnShareCapital > 0) {
      lines.push({
        accountCode: '2-03-01',
        accountName: 'Interest on Share Capital (ISC) Payable',
        debit: 0,
        credit: surplus.totalInterestOnShareCapital,
      });
    }

    // Patronage Refund Payable (2-03-02)
    if (surplus.totalPatronageRefund > 0) {
      lines.push({
        accountCode: '2-03-02',
        accountName: 'Patronage Refund (PR) Payable',
        debit: 0,
        credit: surplus.totalPatronageRefund,
      });
    }

    const totalDebit = Math.round(lines.reduce((acc, l) => acc + l.debit, 0) * 100) / 100;
    const totalCredit = Math.round(lines.reduce((acc, l) => acc + l.credit, 0) * 100) / 100;
    const isBalanced = totalDebit === totalCredit;

    return {
      voucherNumber: `JV-SURPLUS-${surplus.fiscalYear}`,
      description: `Annual Net Surplus Distribution for FY ${surplus.fiscalYear} pursuant to Art. 86 RA 9520`,
      lines,
      isBalanced,
      totalDebit,
      totalCredit,
      userId,
      postedAt: new Date().toISOString(),
    };
  }
}
