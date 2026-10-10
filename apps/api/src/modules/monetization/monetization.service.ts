import { PlatformFeeCalculation, PlatformInvoice, TenantBillingMode } from '@flexcoop/shared-types';

export class MonetizationService {
  /**
   * Calculates the platform pass-through loan processing fee based on tenant's billing mode.
   * Rule:
   * - Platform Escrow: max(2.0% of loan amount, ₱100.00)
   * - Coop-Owned Merchant: 0.5% of loan amount
   * Tax:
   * - 12% Output VAT decomposed (BIR Official Invoice Standard)
   */
  static calculatePlatformFee(loanAmount: number, billingMode: TenantBillingMode): PlatformFeeCalculation {
    if (loanAmount <= 0) {
      throw new Error('Loan amount must be greater than zero');
    }

    let feePercentage: number;
    let minimumFee: number;
    let grossFee: number;
    let formula: string;

    if (billingMode === 'PLATFORM_ESCROW') {
      feePercentage = 0.02; // 2.0%
      minimumFee = 100.0; // ₱100 floor
      const calculated = loanAmount * feePercentage;
      grossFee = Math.max(calculated, minimumFee);
      formula = `max(2.0% × ₱${loanAmount.toFixed(2)}, ₱100.00) = ₱${grossFee.toFixed(2)}`;
    } else {
      feePercentage = 0.005; // 0.5%
      minimumFee = 0.0;
      grossFee = loanAmount * feePercentage;
      formula = `0.5% × ₱${loanAmount.toFixed(2)} = ₱${grossFee.toFixed(2)}`;
    }

    grossFee = Math.round(grossFee * 100) / 100;

    // BIR Tax Decomposition (Gross inclusive of 12% Output VAT)
    // Net Base = Gross / 1.12
    // Output VAT = Gross - Net Base
    const netPlatformRevenue = Math.round((grossFee / 1.12) * 100) / 100;
    const vatAmount = Math.round((grossFee - netPlatformRevenue) * 100) / 100;

    return {
      loanAmount,
      billingMode,
      feePercentage,
      minimumFee,
      grossFee,
      vatAmount,
      netPlatformRevenue,
      calculationFormula: formula,
    };
  }

  /**
   * Generates a BIR-compliant electronic Sales Invoice / Billing Statement for the platform fee
   */
  static generatePlatformInvoice(params: {
    tenantId: string;
    loanId: string;
    disbursementReference: string;
    loanAmount: number;
    billingMode: TenantBillingMode;
    tenantTin: string;
  }): PlatformInvoice {
    const fee = this.calculatePlatformFee(params.loanAmount, params.billingMode);
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tenantId: params.tenantId,
      invoiceNumber,
      loanId: params.loanId,
      disbursementReference: params.disbursementReference,
      billingMode: params.billingMode,
      grossLoanAmount: params.loanAmount,
      grossFeeAmount: fee.grossFee,
      vatAmount: fee.vatAmount,
      netRevenue: fee.netPlatformRevenue,
      birTin: params.tenantTin,
      status: 'DEDUCTED',
      issuedAt: new Date().toISOString(),
    };
  }
}
