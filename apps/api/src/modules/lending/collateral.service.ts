import { CollateralItem, CollateralType } from '@flexcoop/shared-types';

export class CollateralService {
  /**
   * Calculates Loan-to-Value (LTV) Ratio and compliance with cooperative credit policy
   */
  public static calculateLTV(loanAmount: number, appraisedValue: number): {
    ltvRatio: number;
    ltvPercentage: string;
    isCompliant: boolean;
    riskCategory: 'SAFE' | 'MARGINAL' | 'HIGH_RISK';
    recommendation: string;
  } {
    if (appraisedValue <= 0) {
      return {
        ltvRatio: 1.0,
        ltvPercentage: '100.0%',
        isCompliant: false,
        riskCategory: 'HIGH_RISK',
        recommendation: 'Invalid appraised value. Collateral re-appraisal required.',
      };
    }

    const ltvRatio = Math.round((loanAmount / appraisedValue) * 10000) / 10000;
    const ltvPercentage = `${(ltvRatio * 100).toFixed(1)}%`;

    if (ltvRatio <= 0.70) {
      return {
        ltvRatio,
        ltvPercentage,
        isCompliant: true,
        riskCategory: 'SAFE',
        recommendation: 'LTV is within conservative 70% threshold. Recommended for Credit Committee endorsement.',
      };
    } else if (ltvRatio <= 0.80) {
      return {
        ltvRatio,
        ltvPercentage,
        isCompliant: true,
        riskCategory: 'MARGINAL',
        recommendation: 'LTV is between 70% and 80%. Requires secondary co-maker endorsement or BOD special approval.',
      };
    } else {
      return {
        ltvRatio,
        ltvPercentage,
        isCompliant: false,
        riskCategory: 'HIGH_RISK',
        recommendation: 'LTV exceeds 80% prudential cap. Principal amount must be reduced or additional collateral pledged.',
      };
    }
  }

  /**
   * Builds and validates a registered collateral item
   */
  public static createCollateralItem(input: {
    tenantId: string;
    memberId: string;
    memberNumber: string;
    memberName?: string;
    type: CollateralType;
    description: string;
    appraisedValue: number;
    assessedValue?: number;
    tctNumber?: string;
    registryOfDeedsLocation?: string;
    lotAreaSqm?: number;
    vehicleMakeModel?: string;
    plateNumber?: string;
    engineNumber?: string;
    chassisNumber?: string;
    ltoOrCrNumber?: string;
    notaryPublic?: string;
    notes?: string;
  }): CollateralItem {
    const assessedValue = input.assessedValue || Math.round(input.appraisedValue * 0.8 * 100) / 100;

    // Standard LTV thresholds: 70% for Real Estate, 60% for Chattel (vehicles), 90% for Deposit Hold
    const maxLTV =
      input.type === 'REAL_ESTATE_MORTGAGE'
        ? 0.70
        : input.type === 'CHATTEL_MORTGAGE'
        ? 0.60
        : 0.90;

    const maxAllowableLoanAmount = Math.round(input.appraisedValue * maxLTV * 100) / 100;

    return {
      id: `col_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId: input.tenantId,
      memberId: input.memberId,
      memberNumber: input.memberNumber,
      memberName: input.memberName,
      type: input.type,
      description: input.description,
      appraisedValue: input.appraisedValue,
      assessedValue,
      maxLoanToValueRatio: maxLTV,
      maxAllowableLoanAmount,
      encumbranceStatus: 'UNENCUMBERED',
      tctNumber: input.tctNumber,
      registryOfDeedsLocation: input.registryOfDeedsLocation,
      lotAreaSqm: input.lotAreaSqm,
      vehicleMakeModel: input.vehicleMakeModel,
      plateNumber: input.plateNumber,
      engineNumber: input.engineNumber,
      chassisNumber: input.chassisNumber,
      ltoOrCrNumber: input.ltoOrCrNumber,
      notaryPublic: input.notaryPublic,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Registers mortgage encumbrance against an approved loan
   */
  public static encumber(
    collateral: CollateralItem,
    loanId: string,
    loanNumber: string,
    registrationDate?: string
  ): CollateralItem {
    return {
      ...collateral,
      encumbranceStatus: 'REGISTERED_MORTGAGE',
      linkedLoanId: loanId,
      linkedLoanNumber: loanNumber,
      registrationDate: registrationDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Discharges or releases mortgage upon full loan repayment
   */
  public static discharge(collateral: CollateralItem): CollateralItem {
    return {
      ...collateral,
      encumbranceStatus: 'DISCHARGED',
      linkedLoanId: undefined,
      linkedLoanNumber: undefined,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates Co-Maker Capacity under Cooperative Credit Risk Policy:
   * 1. Max 2 active co-maker commitments per member
   * 2. Total Direct & Guaranteed exposure cannot exceed 3x (Paid-Up Capital + Savings)
   */
  public static evaluateCoMakerCapacity(params: {
    coMakerMemberId: string;
    coMakerMemberNumber: string;
    coMakerName: string;
    paidUpShareCapital: number;
    savingsBalance: number;
    proposedLoanAmount: number;
    existingGuaranteedLoans?: Array<{ loanId: string; balanceRemaining: number }>;
    ownOutstandingLoans?: number;
    maxAllowedCoMakers?: number;
  }): import('@flexcoop/shared-types').CoMakerCapacityEvaluation {
    const maxAllowedCoMakerCount = params.maxAllowedCoMakers ?? 2;
    const activeGuarantees = params.existingGuaranteedLoans || [];
    const activeCoMakerCount = activeGuarantees.length;
    const isCountEligible = activeCoMakerCount < maxAllowedCoMakerCount;

    const guaranteedLoansBalance = activeGuarantees.reduce((acc, g) => acc + g.balanceRemaining, 0);
    const ownOutstandingLoans = params.ownOutstandingLoans || 0;
    const totalDirectAndContingentExposure = Math.round((ownOutstandingLoans + guaranteedLoansBalance) * 100) / 100;

    const totalUnencumberedEquity = Math.round((params.paidUpShareCapital + params.savingsBalance) * 100) / 100;
    const maxAllowableExposure = Math.round(totalUnencumberedEquity * 3 * 100) / 100;

    const projectedExposure = Math.round((totalDirectAndContingentExposure + params.proposedLoanAmount) * 100) / 100;
    const isFinancialCapacityEligible = projectedExposure <= maxAllowableExposure;

    const rejectionReasons: string[] = [];
    if (!isCountEligible) {
      rejectionReasons.push(
        `Co-maker already has ${activeCoMakerCount} active guaranteed loans (Cooperative policy allows maximum ${maxAllowedCoMakerCount}).`
      );
    }
    if (!isFinancialCapacityEligible) {
      rejectionReasons.push(
        `Projected exposure of ₱${projectedExposure.toLocaleString('en-PH', { minimumFractionDigits: 2 })} exceeds 3x unencumbered equity limit of ₱${maxAllowableExposure.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (Paid-Up: ₱${params.paidUpShareCapital.toLocaleString()}, Savings: ₱${params.savingsBalance.toLocaleString()}).`
      );
    }

    const isEligible = isCountEligible && isFinancialCapacityEligible;

    return {
      coMakerMemberId: params.coMakerMemberId,
      coMakerMemberNumber: params.coMakerMemberNumber,
      coMakerName: params.coMakerName,
      activeCoMakerCount,
      maxAllowedCoMakerCount,
      ownOutstandingLoans,
      guaranteedLoansBalance,
      totalDirectAndContingentExposure,
      paidUpShareCapital: params.paidUpShareCapital,
      savingsBalance: params.savingsBalance,
      totalUnencumberedEquity,
      maxAllowableExposure,
      proposedLoanAmount: params.proposedLoanAmount,
      projectedExposure,
      isCountEligible,
      isFinancialCapacityEligible,
      isEligible,
      rejectionReasons,
    };
  }
}

