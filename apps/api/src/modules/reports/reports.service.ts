import { AMLCCoveredTransactionAlert, DelinquencyAgingItem, DelinquencyAgingReport, Loan } from '@flexcoop/shared-types';

export class RegulatoryReportsService {
  /**
   * Generates Portfolio At Risk (PAR) Aging Analysis (Mandatory CDA Report)
   */
  static generateDelinquencyAging(loans: Loan[], asOfDate: Date = new Date()): DelinquencyAgingReport {
    const details: DelinquencyAgingItem[] = [];
    let totalOutstanding = 0;
    let totalPastDue = 0;

    let bucketTotals = {
      current: 0,
      par1_30: 0,
      par31_60: 0,
      par61_90: 0,
      parOver90: 0,
    };

    const asOfTime = asOfDate.getTime();

    for (const loan of loans) {
      if (loan.status !== 'DISBURSED' && loan.status !== 'DEFAULTED' && loan.status !== 'RESTRUCTURED') {
        continue;
      }

      totalOutstanding += loan.balanceRemaining;

      // Find unpaid installments
      let maxDaysPastDue = 0;
      let principalOverdue = 0;
      let interestOverdue = 0;

      for (const item of loan.schedule) {
        if (!item.isPaid) {
          const dueTime = new Date(item.dueDate).getTime();
          if (dueTime < asOfTime) {
            const diffDays = Math.floor((asOfTime - dueTime) / (1000 * 60 * 60 * 24));
            if (diffDays > maxDaysPastDue) {
              maxDaysPastDue = diffDays;
            }
            principalOverdue += item.principalAmount - item.paidPrincipal;
            interestOverdue += item.interestAmount - item.paidInterest;
          }
        }
      }

      let bucket: 'CURRENT' | 'PAR_1_30' | 'PAR_31_60' | 'PAR_61_90' | 'PAR_OVER_90' = 'CURRENT';

      if (maxDaysPastDue === 0) {
        bucket = 'CURRENT';
        bucketTotals.current += loan.balanceRemaining;
      } else if (maxDaysPastDue <= 30) {
        bucket = 'PAR_1_30';
        bucketTotals.par1_30 += loan.balanceRemaining;
        totalPastDue += loan.balanceRemaining;
      } else if (maxDaysPastDue <= 60) {
        bucket = 'PAR_31_60';
        bucketTotals.par31_60 += loan.balanceRemaining;
        totalPastDue += loan.balanceRemaining;
      } else if (maxDaysPastDue <= 90) {
        bucket = 'PAR_61_90';
        bucketTotals.par61_90 += loan.balanceRemaining;
        totalPastDue += loan.balanceRemaining;
      } else {
        bucket = 'PAR_OVER_90';
        bucketTotals.parOver90 += loan.balanceRemaining;
        totalPastDue += loan.balanceRemaining;
      }

      const totalOverdue = Math.round((principalOverdue + interestOverdue) * 100) / 100;

      details.push({
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        memberNumber: `MEM-${loan.memberId.substring(0, 6)}`,
        memberName: 'Member Account',
        principalOverdue: Math.round(principalOverdue * 100) / 100,
        interestOverdue: Math.round(interestOverdue * 100) / 100,
        penalties: 0,
        totalOverdue,
        daysPastDue: maxDaysPastDue,
        bucket,
      });
    }

    const parRatio = totalOutstanding > 0 ? (totalPastDue / totalOutstanding) * 100 : 0;

    return {
      asOfDate: asOfDate.toISOString().split('T')[0],
      totalOutstandingPortfolio: Math.round(totalOutstanding * 100) / 100,
      totalPastDuePortfolio: Math.round(totalPastDue * 100) / 100,
      portfolioAtRiskRatio: Math.round(parRatio * 100) / 100,
      buckets: {
        current: Math.round(bucketTotals.current * 100) / 100,
        par1_30: Math.round(bucketTotals.par1_30 * 100) / 100,
        par31_60: Math.round(bucketTotals.par31_60 * 100) / 100,
        par61_90: Math.round(bucketTotals.par61_90 * 100) / 100,
        parOver90: Math.round(bucketTotals.parOver90 * 100) / 100,
      },
      details,
    };
  }

  /**
   * AMLC Covered Transaction Monitor (Checks for transactions >= ₱500,000.00)
   */
  static checkAMLCThreshold(params: {
    transactionId: string;
    memberId: string;
    amount: number;
    transactionType: string;
  }): AMLCCoveredTransactionAlert | null {
    if (params.amount >= 500_000.0) {
      return {
        id: `amlc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        transactionId: params.transactionId,
        memberId: params.memberId,
        amount: params.amount,
        transactionType: params.transactionType,
        flaggedAt: new Date().toISOString(),
        status: 'PENDING_REVIEW',
      };
    }
    return null;
  }
}
