import 'dart:math';
import '../models/models.dart';

class LoanCalculatorHelper {
  static LoanCalculationResult calculate({
    required double principal,
    required double annualRate,
    required int termMonths,
    required double coopServiceRate,
    bool isPlatformEscrow = true,
  }) {
    // 1. Upfront Platform Pass-Through Fee (2% min ₱100 in Escrow, 0.5% in Merchant)
    final double platformFee = isPlatformEscrow
        ? max(principal * 0.02, 100.0)
        : principal * 0.005;

    // 2. Coop internal filing / service fee
    final double coopServiceFee = principal * coopServiceRate;

    // 3. Net proceeds disbursed to borrower
    final double netProceeds = principal - platformFee - coopServiceFee;

    // 4. Monthly amortization annuity calculation: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    final double monthlyRate = annualRate / 12.0;
    double monthlyInstallment = 0.0;
    double totalInterest = 0.0;

    if (monthlyRate == 0) {
      monthlyInstallment = principal / termMonths;
      totalInterest = 0.0;
    } else {
      final double factor = pow(1.0 + monthlyRate, termMonths).toDouble();
      monthlyInstallment = (principal * (monthlyRate * factor)) / (factor - 1.0);
      totalInterest = (monthlyInstallment * termMonths) - principal;
    }

    final double totalPayable = principal + totalInterest;

    // 5. Effective Interest Rate (EIR)
    final double totalBorrowerCost = totalInterest + platformFee + coopServiceFee;
    final double eir = netProceeds > 0
        ? (totalBorrowerCost / netProceeds) / (termMonths / 12.0) * 100.0
        : annualRate * 100.0;

    return LoanCalculationResult(
      grossPrincipal: principal,
      platformFee: platformFee,
      coopServiceFee: coopServiceFee,
      netProceeds: netProceeds,
      monthlyInstallment: monthlyInstallment,
      totalInterest: totalInterest,
      totalPayable: totalPayable,
      effectiveInterestRate: eir,
    );
  }

  static List<AmortizationItemModel> generateSchedule({
    required double principal,
    required double annualRate,
    required int termMonths,
    required DateTime startDate,
  }) {
    final double monthlyRate = annualRate / 12.0;
    final double factor = pow(1.0 + monthlyRate, termMonths).toDouble();
    final double pmt = (principal * (monthlyRate * factor)) / (factor - 1.0);

    double balance = principal;
    final List<AmortizationItemModel> items = [];

    for (int i = 1; i <= termMonths; i++) {
      final dueDate = DateTime(startDate.year, startDate.month + i, startDate.day);
      final double interest = balance * monthlyRate;
      final bool isLast = i == termMonths;
      final double principalPortion = isLast ? balance : pmt - interest;
      final double total = principalPortion + interest;
      final double ending = max(0.0, balance - principalPortion);

      items.add(AmortizationItemModel(
        installmentNumber: i,
        dueDate: '${dueDate.year}-${dueDate.month.toString().padLeft(2, '0')}-${dueDate.day.toString().padLeft(2, '0')}',
        principal: principalPortion,
        interest: interest,
        total: total,
        endingBalance: ending,
        isPaid: false,
      ));

      balance = ending;
    }

    return items;
  }
}
