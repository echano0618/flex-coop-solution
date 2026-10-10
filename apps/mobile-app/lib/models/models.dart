class LoanProductModel {
  final String id;
  final String name;
  final String code;
  final double minAmount;
  final double maxAmount;
  final double annualInterestRate;
  final int maxTermMonths;
  final double serviceFeeRate;
  final bool requiresCoMaker;

  const LoanProductModel({
    required this.id,
    required this.name,
    required this.code,
    required this.minAmount,
    required this.maxAmount,
    required this.annualInterestRate,
    required this.maxTermMonths,
    required this.serviceFeeRate,
    required this.requiresCoMaker,
  });
}

class LoanCalculationResult {
  final double grossPrincipal;
  final double platformFee;
  final double coopServiceFee;
  final double netProceeds;
  final double monthlyInstallment;
  final double totalInterest;
  final double totalPayable;
  final double effectiveInterestRate;

  const LoanCalculationResult({
    required this.grossPrincipal,
    required this.platformFee,
    required this.coopServiceFee,
    required this.netProceeds,
    required this.monthlyInstallment,
    required this.totalInterest,
    required this.totalPayable,
    required this.effectiveInterestRate,
  });
}

class AmortizationItemModel {
  final int installmentNumber;
  final String dueDate;
  final double principal;
  final double interest;
  final double total;
  final double endingBalance;
  final bool isPaid;

  const AmortizationItemModel({
    required this.installmentNumber,
    required this.dueDate,
    required this.principal,
    required this.interest,
    required this.total,
    required this.endingBalance,
    required this.isPaid,
  });
}
