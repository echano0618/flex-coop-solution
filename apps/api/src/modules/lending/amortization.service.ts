import { AmortizationMethod, AmortizationScheduleItem, PaymentFrequency } from '@flexcoop/shared-types';

export class AmortizationService {
  /**
   * Generates amortization schedule based on method and terms
   */
  static generateSchedule(params: {
    principalAmount: number;
    annualInterestRate: number; // e.g., 0.12 for 12%
    termMonths: number;
    paymentFrequency: PaymentFrequency;
    method: AmortizationMethod;
    startDate?: Date;
  }): {
    schedule: AmortizationScheduleItem[];
    totalInterest: number;
    totalPayable: number;
  } {
    const { principalAmount, annualInterestRate, termMonths, method } = params;
    const startDate = params.startDate || new Date();

    // Standard monthly period assumption for cooperative term
    const monthlyRate = annualInterestRate / 12;
    let schedule: AmortizationScheduleItem[] = [];
    let totalInterest = 0;

    let balance = principalAmount;

    if (method === 'STRAIGHT_LINE') {
      const fixedMonthlyPrincipal = Math.round((principalAmount / termMonths) * 100) / 100;
      const fixedMonthlyInterest = Math.round((principalAmount * monthlyRate) * 100) / 100;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        // Adjust last month rounding
        const isLast = i === termMonths;
        const principal = isLast ? balance : fixedMonthlyPrincipal;
        const interest = fixedMonthlyInterest;
        const total = Math.round((principal + interest) * 100) / 100;
        const ending = Math.max(0, Math.round((balance - principal) * 100) / 100);

        schedule.push({
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          beginningBalance: balance,
          principalAmount: principal,
          interestAmount: interest,
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
        monthlyRate === 0
          ? principalAmount / termMonths
          : (principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
            (Math.pow(1 + monthlyRate, termMonths) - 1);

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interest = Math.round(balance * monthlyRate * 100) / 100;
        const isLast = i === termMonths;
        const principal = isLast ? balance : Math.round((pmt - interest) * 100) / 100;
        const total = Math.round((principal + interest) * 100) / 100;
        const ending = Math.max(0, Math.round((balance - principal) * 100) / 100);

        schedule.push({
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          beginningBalance: balance,
          principalAmount: principal,
          interestAmount: interest,
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
      const fixedMonthlyPrincipal = Math.round((principalAmount / termMonths) * 100) / 100;

      for (let i = 1; i <= termMonths; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const interest = Math.round(balance * monthlyRate * 100) / 100;
        const isLast = i === termMonths;
        const principal = isLast ? balance : fixedMonthlyPrincipal;
        const total = Math.round((principal + interest) * 100) / 100;
        const ending = Math.max(0, Math.round((balance - principal) * 100) / 100);

        schedule.push({
          installmentNumber: i,
          dueDate: dueDate.toISOString().split('T')[0],
          beginningBalance: balance,
          principalAmount: principal,
          interestAmount: interest,
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
    const totalPayable = Math.round((principalAmount + totalInterest) * 100) / 100;

    return {
      schedule,
      totalInterest,
      totalPayable,
    };
  }
}
