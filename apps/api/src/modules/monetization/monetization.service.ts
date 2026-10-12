import { MemberOnboardingFeeCalculation, PlatformFeeCalculation, PlatformInvoice, TenantBillingMode } from '@flexcoop/shared-types';

export class MonetizationService {
  /**
   * Calculates the platform technology fee for an approved/disbursed loan.
   * Single Platform Billing Model Rule:
   * - 1.0% Technology Fee for every approved loan
   * Tax:
   * - 12% Output VAT decomposed (BIR Official Electronic Invoice Standard)
   */
  static calculatePlatformFee(loanAmount: number, billingMode: TenantBillingMode = 'STANDARD_UNIFIED'): PlatformFeeCalculation {
    if (loanAmount <= 0) {
      throw new Error('Loan amount must be greater than zero');
    }

    const feePercentage = 0.01; // Flat 1.0% Technology Fee
    let grossFee = Math.round(loanAmount * feePercentage * 100) / 100;
    const formula = `1.0% × ₱${loanAmount.toFixed(2)} = ₱${grossFee.toFixed(2)}`;

    // BIR Tax Decomposition (Gross inclusive of 12% Output VAT)
    // Net Base = Gross / 1.12
    // Output VAT = Gross - Net Base
    const netPlatformRevenue = Math.round((grossFee / 1.12) * 100) / 100;
    const vatAmount = Math.round((grossFee - netPlatformRevenue) * 100) / 100;

    return {
      loanAmount,
      billingMode,
      feePercentage,
      minimumFee: 0.0,
      grossFee,
      vatAmount,
      netPlatformRevenue,
      calculationFormula: formula,
    };
  }

  /**
   * Generates a BIR-compliant electronic Sales Invoice / Billing Statement for the loan platform fee
   */
  static generatePlatformInvoice(params: {
    tenantId: string;
    loanId: string;
    disbursementReference: string;
    loanAmount: number;
    billingMode?: TenantBillingMode;
    tenantTin: string;
  }): PlatformInvoice {
    const billingMode = params.billingMode || 'STANDARD_UNIFIED';
    const fee = this.calculatePlatformFee(params.loanAmount, billingMode);
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tenantId: params.tenantId,
      invoiceNumber,
      loanId: params.loanId,
      disbursementReference: params.disbursementReference,
      billingMode,
      grossLoanAmount: params.loanAmount,
      grossFeeAmount: fee.grossFee,
      vatAmount: fee.vatAmount,
      netRevenue: fee.netPlatformRevenue,
      birTin: params.tenantTin,
      status: 'DEDUCTED',
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * Calculates the platform fee charged to the cooperative per member.
   * Single Platform Billing Model Rule:
   * - First 15 members: FREE (₱0.00)
   * - After first 15 members (sequence > 15): ₱50.00 per new member
   * BIR Output VAT decomposition:
   * Gross = ₱50.00
   * Net Platform Base = ₱50.00 / 1.12 = ₱44.64
   * 12% Output VAT = ₱5.36
   */
  static calculateMemberOnboardingFee(memberSequenceIndex: number = 16): MemberOnboardingFeeCalculation {
    if (memberSequenceIndex <= 15) {
      return {
        memberSequenceIndex,
        isFreeTier: true,
        grossFee: 0.0,
        vatAmount: 0.0,
        netPlatformRevenue: 0.0,
        formula: `Member #${memberSequenceIndex} within first 15 free members tier: ₱0.00`,
      };
    }

    const grossFee = 50.0;
    const netPlatformRevenue = Math.round((grossFee / 1.12) * 100) / 100;
    const vatAmount = Math.round((grossFee - netPlatformRevenue) * 100) / 100;

    return {
      memberSequenceIndex,
      isFreeTier: false,
      grossFee,
      vatAmount,
      netPlatformRevenue,
      formula: `Member #${memberSequenceIndex} exceeds free tier: ₱50.00 (₱44.64 Net Base + ₱5.36 12% Output VAT)`,
    };
  }

  /**
   * Generates a BIR electronic invoice for member onboarding billed to the cooperative
   */
  static generateMemberOnboardingInvoice(params: {
    tenantId: string;
    memberId: string;
    memberNumber: string;
    memberName: string;
    tenantTin: string;
    memberSequenceIndex?: number;
  }) {
    const fee = this.calculateMemberOnboardingFee(params.memberSequenceIndex ?? 16);
    const invoiceNumber = `INV-ONB-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: `inv_onb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tenantId: params.tenantId,
      invoiceNumber,
      memberId: params.memberId,
      memberNumber: params.memberNumber,
      memberName: params.memberName,
      grossFeeAmount: fee.grossFee,
      vatAmount: fee.vatAmount,
      netRevenue: fee.netPlatformRevenue,
      isFreeTier: fee.isFreeTier,
      birTin: params.tenantTin,
      status: 'BILLED_TO_COOP',
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * Automatically executes member onboarding fee deduction from tenant's platform credit
   * Rules:
   * - First 15 members: FREE (₱0.00)
   * - 16th and subsequent members: ₱50.00 auto-deducted from platform credit
   */
  static processMemberFeeAutoDeduction(params: {
    tenantId: string;
    memberId: string;
    memberNumber: string;
    memberName: string;
    sequenceIndex: number;
    tenantTin?: string;
  }) {
    // Dynamic import to prevent any circular dependency
    const { OperatorService } = require('../operator/operator.service');
    const { dbStore } = require('../../core/store');

    const feeCalc = this.calculateMemberOnboardingFee(params.sequenceIndex);
    const invoice = this.generateMemberOnboardingInvoice({
      tenantId: params.tenantId,
      memberId: params.memberId,
      memberNumber: params.memberNumber,
      memberName: params.memberName,
      tenantTin: params.tenantTin || '000-000-000-000',
      memberSequenceIndex: params.sequenceIndex,
    });

    if (feeCalc.isFreeTier || feeCalc.grossFee <= 0) {
      return {
        deducted: false,
        isFreeTier: true,
        feeAmount: 0.0,
        feeCalculation: feeCalc,
        invoice,
        message: `Member #${params.sequenceIndex} falls within the first 15 free members tier. No credit deducted.`,
      };
    }

    // Check available credit balance: strictly NO grace period
    const currentBalance = dbStore.platformCredits.get(params.tenantId) ?? 0;
    if (currentBalance < feeCalc.grossFee) {
      return {
        deducted: false,
        isFreeTier: false,
        feeAmount: feeCalc.grossFee,
        feeCalculation: feeCalc,
        invoice,
        currentCreditBalance: currentBalance,
        error: 'INSUFFICIENT_PLATFORM_CREDIT',
        message: `Insufficient platform credit balance (₱${currentBalance.toFixed(2)}). Required: ₱${feeCalc.grossFee.toFixed(2)}. No grace period permitted. Cooperative must top up Platform Credit immediately.`,
      };
    }

    // Auto-deduct ₱50 from tenant's prepaid platform credit
    const adjustResult = OperatorService.adjustPlatformCredit({
      tenantId: params.tenantId,
      amount: -feeCalc.grossFee,
      type: 'FEE_DEDUCTION',
      reference: invoice.invoiceNumber,
      notes: `Platform Onboarding Fee (₱50.00) for Member #${params.sequenceIndex} (${params.memberName})`,
      performedBy: 'SYSTEM_BILLING_AUTOMATION',
    });

    const isLowCredit = adjustResult.newBalance < 1000.0;

    return {
      deducted: true,
      isFreeTier: false,
      feeAmount: feeCalc.grossFee,
      feeCalculation: feeCalc,
      invoice,
      newCreditBalance: adjustResult.newBalance,
      transaction: adjustResult.transaction,
      isLowCreditWarning: isLowCredit,
      message: `₱${feeCalc.grossFee.toFixed(2)} platform fee automatically deducted from platform credit for Member #${params.sequenceIndex}. New balance: ₱${adjustResult.newBalance.toFixed(2)}${isLowCredit ? ' ⚠️ CRITICAL LOW BALANCE: Credit below ₱1,000 threshold!' : ''}`,
    };
  }

  /**
   * Automatically executes 1.0% loan technology fee deduction from tenant's platform credit upon loan disbursement
   */
  static processLoanFeeAutoDeduction(params: {
    tenantId: string;
    loanId: string;
    loanNumber: string;
    principalAmount: number;
    invoiceNumber: string;
  }) {
    const { OperatorService } = require('../operator/operator.service');
    const { dbStore } = require('../../core/store');

    const feeCalc = this.calculatePlatformFee(params.principalAmount);

    // Check available credit balance: strictly NO grace period
    const currentBalance = dbStore.platformCredits.get(params.tenantId) ?? 0;
    if (currentBalance < feeCalc.grossFee) {
      return {
        deducted: false,
        feeAmount: feeCalc.grossFee,
        feeCalculation: feeCalc,
        currentCreditBalance: currentBalance,
        error: 'INSUFFICIENT_PLATFORM_CREDIT',
        message: `Insufficient platform credit balance (₱${currentBalance.toFixed(2)}). Required: ₱${feeCalc.grossFee.toFixed(2)} for Loan ${params.loanNumber}. No grace period permitted. Cooperative must top up Platform Credit before disbursement.`,
      };
    }

    // Auto-deduct 1.0% tech fee from tenant's prepaid platform credit
    const adjustResult = OperatorService.adjustPlatformCredit({
      tenantId: params.tenantId,
      amount: -feeCalc.grossFee,
      type: 'FEE_DEDUCTION',
      reference: params.invoiceNumber,
      notes: `1.0% Loan Technology Fee for Loan ${params.loanNumber} (Principal: ₱${params.principalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })})`,
      performedBy: 'SYSTEM_BILLING_AUTOMATION',
    });

    const isLowCredit = adjustResult.newBalance < 1000.0;

    return {
      deducted: true,
      feeAmount: feeCalc.grossFee,
      feeCalculation: feeCalc,
      newCreditBalance: adjustResult.newBalance,
      transaction: adjustResult.transaction,
      isLowCreditWarning: isLowCredit,
      message: `₱${feeCalc.grossFee.toFixed(2)} (1.0% technology fee) automatically deducted from platform credit for Loan ${params.loanNumber}. New balance: ₱${adjustResult.newBalance.toFixed(2)}${isLowCredit ? ' ⚠️ CRITICAL LOW BALANCE: Credit below ₱1,000 threshold!' : ''}`,
    };
  }
}
