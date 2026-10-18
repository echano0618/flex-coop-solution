/**
 * Cooperative Tax & Statutory Exemption Service
 * Implements Philippine Tax Code (NIRC) & Republic Act No. 9520 (Philippine Cooperative Code of 2008)
 * - RA 9520 Articles 60 & 61: Statutory Tax & Duty Exemptions
 * - BIR Revenue Regulations No. 20-2001 & RR No. 7-2012: Joint Rules for Cooperatives
 * - Category A vs. Category B based on the ₱10,000,000 Accumulated Reserves Threshold
 * - Withholding Agent Duties (BIR Forms 1601-C, 1601-EQ, 2307)
 * - Annual Information Return for Tax-Exempt Organizations (BIR Form 1702-EX)
 */

export type CounterpartyType = 'MEMBER' | 'NON_MEMBER' | 'VENDOR' | 'EMPLOYEE';

export type CooperativeTxType =
  | 'SHARE_CAPITAL_SUBSCRIPTION'
  | 'SAVINGS_DEPOSIT'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_INTEREST_COLLECTION'
  | 'INTEREST_ON_SHARE_CAPITAL' // Dividend
  | 'PATRONAGE_REFUND'
  | 'STAFF_SALARY_PAYROLL'
  | 'OFFICE_RENTAL_EXPENSE'
  | 'PROFESSIONAL_AUDIT_LEGAL_FEE'
  | 'BANK_DEPOSIT_INTEREST_INCOME';

export interface CooperativeTaxProfile {
  tenantId: string;
  cooperativeName: string;
  tin: string;
  cdaRegistrationNo: string;
  cdaGoodStandingCertNo: string;
  cdaGoodStandingExpiry: string;
  hasActiveCdaGoodStanding: boolean;
  birTaxExemptionCertNo: string;
  birTaxExemptionExpiry: string;
  hasActiveBirExemption: boolean;
  accumulatedReservesAndUndividedSavings: number;
  reserveThresholdLimit: number; // ₱10,000,000 statutory threshold
  taxCategory: 'CATEGORY_A' | 'CATEGORY_B';
  categoryDescription: string;
  memberTransactionsTaxStatus: string;
  nonMemberTransactionsTaxStatus: string;
  withholdingAgentMandate: string;
}

export interface TaxAssessmentLine {
  taxName: string;
  taxCode: string;
  ratePercent: number;
  taxableBase: number;
  taxDue: number;
  isExempt: boolean;
  legalBasis: string;
}

export interface TransactionTaxEvaluation {
  counterpartyType: CounterpartyType;
  transactionType: CooperativeTxType;
  grossAmount: number;
  isFullyTaxExempt: boolean;
  applicableTaxes: TaxAssessmentLine[];
  netCooperativeAmount: number;
  statutoryExemptionNotice: string;
  officialReceiptInscription: string;
  birFilingFormRequired?: string;
}

export class CooperativeTaxService {
  public static readonly RESERVE_THRESHOLD = 10_000_000.0; // ₱10,000,000 (RA 9520 Art 61)

  /**
   * Computes the cooperative's statutory tax profile and categorization.
   */
  static getCooperativeTaxProfile(params: {
    tenantId: string;
    cooperativeName?: string;
    tin?: string;
    cdaRegistrationNo?: string;
    cdaGoodStandingCertNo?: string;
    cdaGoodStandingExpiry?: string;
    birTaxExemptionCertNo?: string;
    birTaxExemptionExpiry?: string;
    accumulatedReserves: number;
  }): CooperativeTaxProfile {
    const isCategoryA = params.accumulatedReserves <= this.RESERVE_THRESHOLD;
    const taxCategory = isCategoryA ? 'CATEGORY_A' : 'CATEGORY_B';

    return {
      tenantId: params.tenantId,
      cooperativeName: params.cooperativeName || 'Cooperative Enterprise',
      tin: params.tin || '009-887-123-000',
      cdaRegistrationNo: params.cdaRegistrationNo || '9520-10028472',
      cdaGoodStandingCertNo: params.cdaGoodStandingCertNo || 'CGS-2026-NCR-0442',
      cdaGoodStandingExpiry: params.cdaGoodStandingExpiry || '2026-12-31',
      hasActiveCdaGoodStanding: true,
      birTaxExemptionCertNo: params.birTaxExemptionCertNo || 'BIR-CTE-2024-008129',
      birTaxExemptionExpiry: params.birTaxExemptionExpiry || '2027-12-31',
      hasActiveBirExemption: true,
      accumulatedReservesAndUndividedSavings: params.accumulatedReserves,
      reserveThresholdLimit: this.RESERVE_THRESHOLD,
      taxCategory,
      categoryDescription: isCategoryA
        ? 'Category A: Accumulated reserves <= ₱10M. 100% Tax-Exempt on member transactions; Exempt from Income Tax on non-member transactions.'
        : 'Category B: Accumulated reserves > ₱10M. Exempt on member transactions; Subject to regular Corporate Income Tax and 12% VAT on non-member transactions.',
      memberTransactionsTaxStatus: '100% EXEMPT from Income Tax, 12% VAT, Percentage Tax, and Documentary Stamp Tax (RA 9520 Art. 60).',
      nonMemberTransactionsTaxStatus: isCategoryA
        ? 'Exempt from Income Tax; subject to VAT only if non-member sales exceed ₱3,000,000 VAT threshold.'
        : 'Subject to 25% Regular Corporate Income Tax (RCIT) and 12% VAT on transactions with non-members.',
      withholdingAgentMandate: 'Must act as Withholding Agent for compensation (Form 1601-C) and professional/rental fees (Form 1601-EQ).',
    };
  }

  /**
   * Evaluates tax applicability for a specific transaction under RA 9520 and the NIRC.
   */
  static evaluateTransactionTax(params: {
    counterpartyType: CounterpartyType;
    transactionType: CooperativeTxType;
    grossAmount: number;
    accumulatedReserves?: number;
    isNonMemberVatRegistered?: boolean;
  }): TransactionTaxEvaluation {
    const reserves = params.accumulatedReserves ?? 250_000.0;
    const isCategoryA = reserves <= this.RESERVE_THRESHOLD;
    const isMember = params.counterpartyType === 'MEMBER';
    const lines: TaxAssessmentLine[] = [];

    let isFullyTaxExempt = true;
    let statutoryNotice = '';
    let receiptInscription = '';
    let birForm: string | undefined = undefined;

    switch (params.transactionType) {
      case 'SHARE_CAPITAL_SUBSCRIPTION':
      case 'SAVINGS_DEPOSIT':
        // Pure equity / savings - 100% exempt from VAT and DST
        lines.push({
          taxName: 'Value-Added Tax (VAT)',
          taxCode: 'VAT-EXEMPT',
          ratePercent: 0,
          taxableBase: params.grossAmount,
          taxDue: 0,
          isExempt: true,
          legalBasis: 'RA 9520 Art. 60 / NIRC Sec. 109(1)(L)',
        });
        lines.push({
          taxName: 'Documentary Stamp Tax (DST)',
          taxCode: 'DST-EXEMPT',
          ratePercent: 0,
          taxableBase: params.grossAmount,
          taxDue: 0,
          isExempt: true,
          legalBasis: 'RA 9520 Art. 60 / NIRC Sec. 199',
        });
        statutoryNotice = 'Exempt from VAT, Percentage Tax, and DST under RA 9520 Article 60.';
        receiptInscription = 'TAX-EXEMPT TRANSACTION (RA 9520 ART. 60 / BIR CTE NO. BIR-CTE-2024-008129)';
        break;

      case 'LOAN_DISBURSEMENT':
        // Member Promissory Note DST Exemption
        lines.push({
          taxName: 'Documentary Stamp Tax (DST) on Promissory Notes',
          taxCode: isMember ? 'DST-EXEMPT' : 'DST-TAXABLE',
          ratePercent: isMember ? 0 : 0.75, // ₱1.50 per ₱200 if non-member
          taxableBase: params.grossAmount,
          taxDue: isMember ? 0 : Math.round((params.grossAmount / 200) * 1.5 * 100) / 100,
          isExempt: isMember,
          legalBasis: isMember ? 'NIRC Sec. 199(a) / RA 9520 Art. 60' : 'NIRC Sec. 179',
        });
        isFullyTaxExempt = isMember;
        statutoryNotice = isMember
          ? 'Loan promissory note is exempt from Documentary Stamp Tax under NIRC Sec. 199 and RA 9520.'
          : 'Non-member loan promissory note is subject to standard DST under NIRC Sec. 179.';
        receiptInscription = isMember
          ? 'DST-EXEMPT PROMISSORY NOTE (RA 9520 ART. 60 & NIRC SEC. 199)'
          : 'SUBJECT TO APPLICABLE DOCUMENTARY STAMP TAX';
        break;

      case 'LOAN_INTEREST_COLLECTION':
        if (isMember) {
          lines.push({
            taxName: '12% Value-Added Tax / Gross Receipts Tax',
            taxCode: 'VAT-EXEMPT',
            ratePercent: 0,
            taxableBase: params.grossAmount,
            taxDue: 0,
            isExempt: true,
            legalBasis: 'RA 9520 Art. 60 / BIR RR 7-2012',
          });
          lines.push({
            taxName: 'Corporate Income Tax (CIT)',
            taxCode: 'CIT-EXEMPT',
            ratePercent: 0,
            taxableBase: params.grossAmount,
            taxDue: 0,
            isExempt: true,
            legalBasis: 'RA 9520 Art. 60 / BIR CTE Valid',
          });
          statutoryNotice = 'Interest income from members is 100% exempt from Income Tax and 12% VAT.';
          receiptInscription = 'OFFICIAL RECEIPT: TAX-EXEMPT UNDER RA 9520 ART. 60 / BIR CTE 2024-008129';
        } else {
          // Non-member interest collection
          isFullyTaxExempt = false;
          const incomeTaxRate = isCategoryA ? 0 : 25; // 25% RCIT for Category B
          const vatRate = isCategoryA ? 0 : 12; // 12% VAT for Category B
          lines.push({
            taxName: 'Corporate Income Tax on Non-Members',
            taxCode: isCategoryA ? 'CIT-EXEMPT' : 'RCIT-25',
            ratePercent: incomeTaxRate,
            taxableBase: params.grossAmount,
            taxDue: Math.round(params.grossAmount * (incomeTaxRate / 100) * 100) / 100,
            isExempt: isCategoryA,
            legalBasis: isCategoryA ? 'RA 9520 Art. 61(1) (Reserves <= ₱10M)' : 'RA 9520 Art. 61(2) (Reserves > ₱10M)',
          });
          lines.push({
            taxName: '12% Output Value-Added Tax',
            taxCode: isCategoryA ? 'VAT-EXEMPT' : 'VAT-12',
            ratePercent: vatRate,
            taxableBase: params.grossAmount,
            taxDue: Math.round(params.grossAmount * (vatRate / 100) * 100) / 100,
            isExempt: isCategoryA,
            legalBasis: isCategoryA ? 'NIRC Sec. 109' : 'NIRC Sec. 106',
          });
          statutoryNotice = isCategoryA
            ? 'Category A: Non-member interest income exempt from Income Tax.'
            : 'Category B: Non-member interest income subject to 25% CIT and 12% VAT.';
          receiptInscription = isCategoryA
            ? 'TAX-EXEMPT UNDER RA 9520 ART. 61(1)'
            : 'TAXABLE NON-MEMBER RECEIPT (VATABLE)';
        }
        break;

      case 'INTEREST_ON_SHARE_CAPITAL':
      case 'PATRONAGE_REFUND':
        // Member dividends: 100% exempt from income tax and withholding tax (BIR Ruling No. 138-2019)
        lines.push({
          taxName: 'Withholding Tax on Member Dividends',
          taxCode: 'WTAX-EXEMPT',
          ratePercent: 0,
          taxableBase: params.grossAmount,
          taxDue: 0,
          isExempt: true,
          legalBasis: 'RA 9520 Art. 60 / BIR Ruling 138-2019 / RR 7-2012',
        });
        statutoryNotice = 'Interest on Share Capital (ISC) and Patronage Refunds are exempt from withholding tax in the hands of members.';
        receiptInscription = 'TAX-EXEMPT DIVIDEND DISTRIBUTION (RA 9520 ART. 60)';
        break;

      case 'STAFF_SALARY_PAYROLL':
        // Withholding Tax on Compensation (Cooperative acts as Withholding Agent)
        isFullyTaxExempt = false;
        // Standard progressive estimation (e.g., minimum wage exempt, taxable above threshold)
        const isTaxableSalary = params.grossAmount > 20_833.0; // approx ₱250k annual threshold
        const wtcAmount = isTaxableSalary ? Math.round((params.grossAmount - 20_833) * 0.15 * 100) / 100 : 0;
        lines.push({
          taxName: 'Withholding Tax on Compensation (WTC)',
          taxCode: 'BIR-FORM-1601C',
          ratePercent: isTaxableSalary ? 15 : 0,
          taxableBase: params.grossAmount,
          taxDue: wtcAmount,
          isExempt: !isTaxableSalary,
          legalBasis: 'NIRC Sec. 79 (Cooperative acts as withholding agent)',
        });
        statutoryNotice = 'Cooperatives MUST withhold tax on employee compensation under NIRC Section 79.';
        receiptInscription = 'PAYROLL DISBURSEMENT (BIR FORM 1601-C MANDATE)';
        birForm = 'BIR Form 1601-C (Monthly Remittance of Taxes Withheld on Compensation)';
        break;

      case 'OFFICE_RENTAL_EXPENSE':
        // Expanded Withholding Tax (EWT) on real estate rental (5%)
        isFullyTaxExempt = false;
        const ewtRentAmount = Math.round(params.grossAmount * 0.05 * 100) / 100;
        lines.push({
          taxName: 'Expanded Withholding Tax on Real Property Rental (5%)',
          taxCode: 'WI-100',
          ratePercent: 5,
          taxableBase: params.grossAmount,
          taxDue: ewtRentAmount,
          isExempt: false,
          legalBasis: 'RR 2-98 as amended / BIR Form 1601-EQ',
        });
        statutoryNotice = 'Cooperative must withhold 5% EWT on office rentals and issue BIR Form 2307 to lessor.';
        receiptInscription = 'LESSOR PAYMENT NET OF 5% EWT (BIR FORM 2307 ATTACHED)';
        birForm = 'BIR Form 1601-EQ / Certificate 2307';
        break;

      case 'PROFESSIONAL_AUDIT_LEGAL_FEE':
        // Expanded Withholding Tax (EWT) on professional fees (2% / 5% / 10%)
        isFullyTaxExempt = false;
        const ewtProfAmount = Math.round(params.grossAmount * 0.05 * 100) / 100;
        lines.push({
          taxName: 'Creditable Withholding Tax on Professional Fees (5%)',
          taxCode: 'WI-010',
          ratePercent: 5,
          taxableBase: params.grossAmount,
          taxDue: ewtProfAmount,
          isExempt: false,
          legalBasis: 'RR 11-2018 / NIRC Sec. 57',
        });
        statutoryNotice = 'Cooperative must withhold 5% EWT on professional CPAs/legal services and issue BIR Form 2307.';
        receiptInscription = 'PROFESSIONAL FEE NET OF 5% EWT (BIR FORM 2307 ATTACHED)';
        birForm = 'BIR Form 1601-EQ / Certificate 2307';
        break;

      case 'BANK_DEPOSIT_INTEREST_INCOME':
        // Final Tax of 20% deducted by commercial bank
        isFullyTaxExempt = false;
        const finalTaxBank = Math.round(params.grossAmount * 0.20 * 100) / 100;
        lines.push({
          taxName: 'Final Withholding Tax on Bank Deposits (20%)',
          taxCode: 'FINAL-20',
          ratePercent: 20,
          taxableBase: params.grossAmount,
          taxDue: finalTaxBank,
          isExempt: false,
          legalBasis: 'NIRC Sec. 24(B)(1) (Commercial Banks; exempt if in Coop Federation/Bank)',
        });
        statutoryNotice = 'Interest on deposits in commercial banks is subject to 20% final withholding tax.';
        receiptInscription = 'NET BANK INTEREST AFTER 20% FINAL WITHHOLDING TAX';
        break;
    }

    const totalTaxDue = lines.reduce((acc, l) => acc + l.taxDue, 0);
    const netCooperativeAmount = params.grossAmount - totalTaxDue;

    return {
      counterpartyType: params.counterpartyType,
      transactionType: params.transactionType,
      grossAmount: params.grossAmount,
      isFullyTaxExempt,
      applicableTaxes: lines,
      netCooperativeAmount,
      statutoryExemptionNotice: statutoryNotice,
      officialReceiptInscription: receiptInscription,
      birFilingFormRequired: birForm,
    };
  }

  /**
   * Prepares the BIR Form 1702-EX (Annual Information Return for Tax-Exempt Organizations) breakdown.
   */
  static generateBir1702ExSummary(params: {
    taxableYear: number;
    memberGrossReceipts: number;
    nonMemberGrossReceipts: number;
    accumulatedReserves: number;
  }) {
    const isCategoryA = params.accumulatedReserves <= this.RESERVE_THRESHOLD;
    const exemptIncome = params.memberGrossReceipts + (isCategoryA ? params.nonMemberGrossReceipts : 0);
    const taxableIncome = isCategoryA ? 0 : params.nonMemberGrossReceipts;
    const taxDue = isCategoryA ? 0 : Math.round(taxableIncome * 0.25 * 100) / 100;

    return {
      taxableYear: params.taxableYear,
      birFormName: 'BIR Form 1702-EX (Annual Information Return for Tax-Exempt Organizations)',
      filingDeadline: `April 15, ${params.taxableYear + 1}`,
      cdaCertGoodStandingAttached: true,
      birCertTaxExemptionAttached: true,
      memberGrossReceipts: params.memberGrossReceipts,
      nonMemberGrossReceipts: params.nonMemberGrossReceipts,
      totalGrossReceipts: params.memberGrossReceipts + params.nonMemberGrossReceipts,
      exemptGrossReceipts: exemptIncome,
      taxableGrossReceipts: taxableIncome,
      effectiveTaxRate: isCategoryA ? '0% (Category A - 100% Exempt)' : '25% (Category B Non-Member Portion)',
      taxDue,
      statutoryLegalBasis: 'RA 9520 Articles 60 & 61 / NIRC Section 30 / BIR RR 7-2012',
    };
  }
}
