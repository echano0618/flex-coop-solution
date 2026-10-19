import { AmortizationMethod, AmortizationScheduleItem, PaymentFrequency } from '@flexcoop/shared-types';

export class AmortizationService {
  /**
   * Generates amortization schedule based on method and terms
   */
  static generateSchedule(params: {
    principalAmount: number;
    annualInterestRate: number; // e.g., 0.12 for 12%
    termMonths?: number;
    termWeeks?: number;
    termUnit?: 'MONTHS' | 'WEEKS';
    weeklyPaymentFrequency?: 'EVERY_WEEK' | 'EVERY_OTHER_WEEK';
    paymentFrequency?: PaymentFrequency;
    method: AmortizationMethod;
    startDate?: Date;
    firstDueDate?: Date | string;
    mandatoryShareAmount?: number;
    mandatorySharePaymentTreatment?: 'UPFRONT_DEDUCTION' | 'INCLUDED_IN_LOAN_PAYMENT';
  }): {
    schedule: AmortizationScheduleItem[];
    totalInterest: number;
    totalPayable: number;
    mandatoryShareTotal?: number;
  } {
    const { principalAmount, annualInterestRate, method } = params;
    const startDate = params.startDate || new Date();
    const isWeeks = params.termUnit === 'WEEKS';
    const isBiWeekly = isWeeks && params.weeklyPaymentFrequency === 'EVERY_OTHER_WEEK';

    // Calculate number of installments (n) and periodic interest rate (r)
    let n = 12;
    let periodicRate = annualInterestRate / 12;
    let intervalDays = 30;

    if (isWeeks) {
      const rawWeeks = params.termWeeks || (params.termMonths ? params.termMonths * 4 : 12);
      if (isBiWeekly) {
        n = Math.max(1, Math.ceil(rawWeeks / 2));
        periodicRate = annualInterestRate / 26; // 26 bi-weekly periods per year
        intervalDays = 14;
      } else {
        n = Math.max(1, rawWeeks);
        periodicRate = annualInterestRate / 52; // 52 weekly periods per year
        intervalDays = 7;
      }
    } else {
      n = Math.max(1, params.termMonths || 12);
      periodicRate = annualInterestRate / 12; // 12 monthly periods per year
      intervalDays = 30;
    }

    // Mandatory Share Capital contribution included in installments
    const isShareAmortized =
      params.mandatorySharePaymentTreatment === 'INCLUDED_IN_LOAN_PAYMENT' &&
      Number(params.mandatoryShareAmount || 0) > 0;
    const totalShare = isShareAmortized ? Number(params.mandatoryShareAmount) : 0;
    const perInstallmentShare = isShareAmortized ? Math.round((totalShare / n) * 100) / 100 : 0;

    let schedule: AmortizationScheduleItem[] = [];
    let totalInterest = 0;
    let accumulatedShare = 0;
    let balance = principalAmount;

    // Helper to calculate due date for installment i (1-indexed)
    const computeDueDate = (i: number): string => {
      if (params.firstDueDate) {
        const first = new Date(params.firstDueDate);
        if (i === 1) return first.toISOString().split('T')[0];
        if (isWeeks) {
          const d = new Date(first.getTime() + (i - 1) * intervalDays * 86400000);
          return d.toISOString().split('T')[0];
        } else {
          const d = new Date(first);
          d.setMonth(d.getMonth() + (i - 1));
          return d.toISOString().split('T')[0];
        }
      }
      if (isWeeks) {
        const d = new Date(startDate.getTime() + i * intervalDays * 86400000);
        return d.toISOString().split('T')[0];
      }
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      return d.toISOString().split('T')[0];
    };

    if (method === 'STRAIGHT_LINE') {
      const fixedPrincipal = Math.round((principalAmount / n) * 100) / 100;
      const fixedInterest = Math.round((principalAmount * periodicRate) * 100) / 100;

      for (let i = 1; i <= n; i++) {
        const dueDate = computeDueDate(i);
        const isLast = i === n;
        const principal = isLast ? balance : fixedPrincipal;
        const interest = fixedInterest;
        const shareContrib = isShareAmortized
          ? (isLast ? Math.round((totalShare - accumulatedShare) * 100) / 100 : perInstallmentShare)
          : 0;
        accumulatedShare += shareContrib;

        const total = Math.round((principal + interest + shareContrib) * 100) / 100;
        const ending = Math.max(0, Math.round((balance - principal) * 100) / 100);

        schedule.push({
          installmentNumber: i,
          dueDate,
          beginningBalance: balance,
          principalAmount: principal,
          interestAmount: interest,
          mandatoryShareAmount: shareContrib > 0 ? shareContrib : undefined,
          totalInstallment: total,
          endingBalance: ending,
          paidPrincipal: 0,
          paidInterest: 0,
          paidPenalties: 0,
          isPaid: false,
        });

        totalInterest += interest;
        balance = ending;
      }
    } else if (method === 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT') {
      // Annuity formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
      const pmt =
        periodicRate === 0
          ? principalAmount / n
          : (principalAmount * (periodicRate * Math.pow(1 + periodicRate, n))) /
            (Math.pow(1 + periodicRate, n) - 1);

      for (let i = 1; i <= n; i++) {
        const dueDate = computeDueDate(i);
        const interest = Math.round(balance * periodicRate * 100) / 100;
        const isLast = i === n;
        const principal = isLast ? balance : Math.round((pmt - interest) * 100) / 100;
        const shareContrib = isShareAmortized
          ? (isLast ? Math.round((totalShare - accumulatedShare) * 100) / 100 : perInstallmentShare)
          : 0;
        accumulatedShare += shareContrib;

        const total = Math.round((principal + interest + shareContrib) * 100) / 100;
        const ending = Math.max(0, Math.round((balance - principal) * 100) / 100);

        schedule.push({
          installmentNumber: i,
          dueDate,
          beginningBalance: balance,
          principalAmount: principal,
          interestAmount: interest,
          mandatoryShareAmount: shareContrib > 0 ? shareContrib : undefined,
          totalInstallment: total,
          endingBalance: ending,
          paidPrincipal: 0,
          paidInterest: 0,
          paidPenalties: 0,
          isPaid: false,
        });

        totalInterest += interest;
        balance = ending;
      }
    } else {
      // DIMINISHING_BALANCE_EQUAL_PRINCIPAL
      const fixedPrincipal = Math.round((principalAmount / n) * 100) / 100;

      for (let i = 1; i <= n; i++) {
        const dueDate = computeDueDate(i);
        const interest = Math.round(balance * periodicRate * 100) / 100;
        const isLast = i === n;
        const principal = isLast ? balance : fixedPrincipal;
        const shareContrib = isShareAmortized
          ? (isLast ? Math.round((totalShare - accumulatedShare) * 100) / 100 : perInstallmentShare)
          : 0;
        accumulatedShare += shareContrib;

        const total = Math.round((principal + interest + shareContrib) * 100) / 100;
        const ending = Math.max(0, Math.round((balance - principal) * 100) / 100);

        schedule.push({
          installmentNumber: i,
          dueDate,
          beginningBalance: balance,
          principalAmount: principal,
          interestAmount: interest,
          mandatoryShareAmount: shareContrib > 0 ? shareContrib : undefined,
          totalInstallment: total,
          endingBalance: ending,
          paidPrincipal: 0,
          paidInterest: 0,
          paidPenalties: 0,
          isPaid: false,
        });

        totalInterest += interest;
        balance = ending;
      }
    }

    totalInterest = Math.round(totalInterest * 100) / 100;
    const totalPayable = Math.round((principalAmount + totalInterest + totalShare) * 100) / 100;

    return {
      schedule,
      totalInterest,
      totalPayable,
      mandatoryShareTotal: totalShare > 0 ? totalShare : undefined,
    };
  }

  /**
   * Generates early payoff settlement quote under RA 3765 (Truth in Lending)
   * Waives unearned diminishing interest and rebates future installments.
   */
  static calculateEarlySettlement(params: {
    loan: import('@flexcoop/shared-types').Loan;
    settlementDate?: Date;
    penaltiesDue?: number;
  }): import('@flexcoop/shared-types').EarlyLoanSettlementQuote {
    const { loan } = params;
    const settlementDate = params.settlementDate || new Date();
    const penaltiesDue = Math.max(0, params.penaltiesDue || 0);

    const currentPrincipalBalance = loan.balanceRemaining;

    // Remaining unearned future interest across unpaid installments
    let futureUnearnedInterest = 0;
    for (const item of loan.schedule) {
      if (!item.isPaid) {
        futureUnearnedInterest += Math.max(0, item.interestAmount - item.paidInterest);
      }
    }
    futureUnearnedInterest = Math.round(futureUnearnedInterest * 100) / 100;

    // In a diminishing balance schedule, early pre-termination waives future unearned interest
    const unearnedInterestRebate = futureUnearnedInterest;
    const accruedInterestToDate = 0.0; // Any unpaid accrued interest up to settlement date

    const totalPayoffAmount = Math.round((currentPrincipalBalance + accruedInterestToDate + penaltiesDue) * 100) / 100;

    return {
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      memberId: loan.memberId,
      settlementDate: settlementDate.toISOString().split('T')[0],
      currentPrincipalBalance,
      accruedInterestToDate,
      unearnedInterestRebate,
      penaltiesDue,
      totalPayoffAmount,
      originalTotalInterest: loan.totalInterestExpected,
      interestSavedByBorrower: unearnedInterestRebate,
    };
  }
}

