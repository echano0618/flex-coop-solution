import { Loan, LoanProduct, Member, Tenant } from '@flexcoop/shared-types';

export interface DisclosureStatement {
  documentId: string;
  cooperativeName: string;
  cdaRegistration: string;
  tin: string;
  address: string;
  borrowerName: string;
  borrowerMemberNo: string;
  borrowerAddress: string;
  loanNumber: string;
  productName: string;
  grossLoanAmount: number;
  // Deductions from proceeds:
  deductions: {
    platformProcessingFee: number;
    coopServiceFilingFee: number;
    documentaryStampTax: number;
    totalDeductions: number;
  };
  netDisbursedProceeds: number;
  annualInterestRatePercent: number;
  effectiveInterestRatePercent: number;
  termMonths: number;
  paymentFrequency: string;
  totalInterestCharge: number;
  totalPayableAmount: number;
  amortizationSummary: {
    monthlyInstallment: number;
    firstDueDate: string;
    finalDueDate: string;
  };
  truthInLendingNotice: string;
  promissoryNoteText: string;
}

export class DisclosureService {
  /**
   * Generates a Truth in Lending Act (RA 3765) compliant Disclosure Statement
   * and legally binding Cooperative Promissory Note text.
   */
  static generateDisclosureStatement(params: {
    tenant: Tenant;
    member: Member;
    loan: Loan;
    product: LoanProduct;
  }): DisclosureStatement {
    const { tenant, member, loan, product } = params;

    const totalDeductions = loan.platformFee + loan.coopServiceFee;
    const netProceeds = loan.principalAmount - totalDeductions;

    // Approximate Effective Interest Rate (EIR) per annum considering net proceeds
    const eir =
      netProceeds > 0
        ? Math.round((((loan.totalInterestExpected + totalDeductions) / netProceeds) / (loan.termMonths / 12)) * 10000) / 100
        : loan.interestRateAnnual * 100;

    const firstDue = loan.schedule.length > 0 ? loan.schedule[0].dueDate : 'N/A';
    const lastDue = loan.schedule.length > 0 ? loan.schedule[loan.schedule.length - 1].dueDate : 'N/A';
    const monthlyInstallment = loan.schedule.length > 0 ? loan.schedule[0].totalInstallment : 0;

    const borrowerFullName = `${member.firstName} ${member.middleName ? member.middleName + ' ' : ''}${member.lastName}`;

    const truthInLendingNotice =
      'NOTICE TO BORROWER: YOU ARE ENTITLED TO A COPY OF THIS DISCLOSURE STATEMENT PRIOR TO THE CONSUMMATION OF THE LOAN TRANSACTION IN COMPLIANCE WITH REPUBLIC ACT NO. 3765 (TRUTH IN LENDING ACT) AND RELEVANT COOPERATIVE DEVELOPMENT AUTHORITY (CDA) MEMORANDUM CIRCULARS.';

    const promissoryNoteText = `PROMISSORY NOTE & LOAN AGREEMENT
For value received, I/we, ${borrowerFullName.toUpperCase()} (Member No. ${member.memberNumber}), promise to pay to the order of ${tenant.name.toUpperCase()} (CDA Reg: ${tenant.cdaRegistrationNumber}), the principal sum of PESOS: ${loan.principalAmount.toLocaleString(
      'en-PH',
      { minimumFractionDigits: 2 }
    )} (PHP ${loan.principalAmount.toFixed(2)}) together with interest at the rate of ${(loan.interestRateAnnual * 100).toFixed(
      2
    )}% per annum, payable in ${loan.termMonths} monthly installments.

In case of default in the payment of any installment when due, a penalty of ${(product.finesRateMonthly * 100).toFixed(
      2
    )}% per month shall be imposed on the overdue amount.

Agreed and electronically acknowledged pursuant to RA 8792 (Electronic Commerce Act) and the Cooperative Bylaws.`;

    return {
      documentId: `DISC-${loan.loanNumber}`,
      cooperativeName: tenant.name,
      cdaRegistration: tenant.cdaRegistrationNumber,
      tin: tenant.tin,
      address: tenant.address,
      borrowerName: borrowerFullName,
      borrowerMemberNo: member.memberNumber,
      borrowerAddress: member.address,
      loanNumber: loan.loanNumber,
      productName: product.name,
      grossLoanAmount: loan.principalAmount,
      deductions: {
        platformProcessingFee: loan.platformFee,
        coopServiceFilingFee: loan.coopServiceFee,
        documentaryStampTax: 0,
        totalDeductions,
      },
      netDisbursedProceeds: netProceeds,
      annualInterestRatePercent: loan.interestRateAnnual * 100,
      effectiveInterestRatePercent: eir,
      termMonths: loan.termMonths,
      paymentFrequency: loan.paymentFrequency,
      totalInterestCharge: loan.totalInterestExpected,
      totalPayableAmount: loan.totalPayable,
      amortizationSummary: {
        monthlyInstallment,
        firstDueDate: firstDue,
        finalDueDate: lastDue,
      },
      truthInLendingNotice,
      promissoryNoteText,
    };
  }
}
