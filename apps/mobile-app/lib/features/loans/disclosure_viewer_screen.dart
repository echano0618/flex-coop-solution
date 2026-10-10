import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/loan_calculator_helper.dart';

class DisclosureViewerScreen extends StatefulWidget {
  final LoanProductModel product;
  final LoanCalculationResult calculation;
  final int termMonths;
  final String coMakerName;

  const DisclosureViewerScreen({
    super.key,
    required this.product,
    required this.calculation,
    required this.termMonths,
    required this.coMakerName,
  });

  @override
  State<DisclosureViewerScreen> createState() => _DisclosureViewerScreenState();
}

class _DisclosureViewerScreenState extends State<DisclosureViewerScreen> {
  bool _isDigitallySigned = false;
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final schedule = LoanCalculatorHelper.generateSchedule(
      principal: widget.calculation.grossPrincipal,
      annualRate: widget.product.annualInterestRate,
      termMonths: widget.termMonths,
      startDate: DateTime.now(),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Truth in Lending Disclosure', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf),
            tooltip: 'Download Official PDF Copy',
            onPressed: () => _downloadPDF(context),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Statutory Banner
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.amber.shade300),
            ),
            child: Row(
              children: [
                Icon(Icons.shield_outlined, color: Colors.amber.shade900, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Republic Act No. 3765 (Truth in Lending Act) Mandatory Disclosure Statement prior to loan consummation.',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amber.shade950),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Header Information
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade300),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('CREDITOR: Bayani Multi-Purpose Cooperative', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Text('CDA Reg No: CDA-NCR-2024-00921 • TIN: 009-887-123-000', style: TextStyle(fontSize: 11, color: Colors.black54)),
                  Divider(height: 16),
                  Text('BORROWER: Maria Clara Santos (MEM-2026-0001)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Text('Address: 12 Rizal St, Barangay Central, Quezon City', style: TextStyle(fontSize: 11, color: Colors.black54)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Loan Particulars Table
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade300),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('LOAN PARTICULARS & CHARGES', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black54)),
                  const SizedBox(height: 12),
                  _buildDataRow('1. Gross Loan Principal:', '₱${widget.calculation.grossPrincipal.toStringAsFixed(2)}', isBold: true),
                  const SizedBox(height: 6),
                  _buildDataRow('   a. SaaS Pass-Through Processing Fee:', '- ₱${widget.calculation.platformFee.toStringAsFixed(2)}', color: Colors.green.shade800),
                  const SizedBox(height: 4),
                  _buildDataRow('   b. Coop Filing & Service Fee:', '- ₱${widget.calculation.coopServiceFee.toStringAsFixed(2)}'),
                  const Divider(height: 16),
                  _buildDataRow('2. Net Disbursed Proceeds (1 minus a, b):', '₱${widget.calculation.netProceeds.toStringAsFixed(2)}', isBold: true, color: const Color(0xFF14532D)),
                  const Divider(height: 16),
                  _buildDataRow('3. Nominal Interest Rate:', '${(widget.product.annualInterestRate * 100).toStringAsFixed(1)}% p.a.'),
                  const SizedBox(height: 6),
                  _buildDataRow('4. Effective Interest Rate (EIR):', '${widget.calculation.effectiveInterestRate.toStringAsFixed(2)}% p.a.', isBold: true),
                  const SizedBox(height: 6),
                  _buildDataRow('5. Total Finance Charges / Interest:', '₱${widget.calculation.totalInterest.toStringAsFixed(2)}'),
                  const SizedBox(height: 6),
                  _buildDataRow('6. Total Amount Payable:', '₱${widget.calculation.totalPayable.toStringAsFixed(2)}', isBold: true),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Amortization Schedule Preview
          const Text('Amortization Schedule Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: schedule.take(4).map((s) {
                return ListTile(
                  dense: true,
                  title: Text('Installment #${s.installmentNumber} • Due ${s.dueDate}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  subtitle: Text('Principal: ₱${s.principal.toStringAsFixed(2)} • Interest: ₱${s.interest.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11)),
                  trailing: Text('₱${s.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF14532D))),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),

          // Promissory Note Text
          Card(
            color: Colors.grey.shade50,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade300)),
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('PROMISSORY NOTE & LOAN AGREEMENT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text(
                    'FOR VALUE RECEIVED, I promise to pay to the order of BAYANI MULTI-PURPOSE COOPERATIVE the sum of PESOS in monthly installments. In case of default, a 3% monthly surcharge applies. Joint and solidary liability acknowledged with designated co-maker pursuant to the Philippine Cooperative Code.',
                    style: TextStyle(fontSize: 11, height: 1.4, color: Colors.black87),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Action Buttons: PDF Download & Submit Application
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.download),
                  label: const Text('Download PDF'),
                  onPressed: () => _downloadPDF(context),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: _isSubmitting ? null : () => _submitApplication(context),
                  child: _isSubmitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Sign & Submit Application', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildDataRow(String label, String value, {Color? color, bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.black87)),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: isBold ? FontWeight.bold : FontWeight.w600, color: color ?? Colors.black87)),
      ],
    );
  }

  void _downloadPDF(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 48),
        title: const Text('PDF Document Generated', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Your official Truth in Lending Disclosure Statement & Promissory Note has been compiled:'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
              child: const Text('📄 RA3765_Disclosure_LN-2026-00001.pdf\nSize: 142 KB\nDigital Signature: SHA-256 Verified', style: TextStyle(fontSize: 11, fontFamily: 'monospace')),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          FilledButton.icon(
            icon: const Icon(Icons.share, size: 16),
            label: const Text('Share / Save'),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Document saved to device Downloads folder.')),
              );
            },
          ),
        ],
      ),
    );
  }

  void _submitApplication(BuildContext context) async {
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 1)); // Simulate API call to /loans/apply
    setState(() => _isSubmitting = false);

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.task_alt, color: Color(0xFF16A34A), size: 48),
        title: const Text('Application Submitted!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'Your loan application (LN-2026-00001) has been endorsed to the Loan Officer for credit scoring and co-maker verification pursuant to the cooperative approval matrix.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12),
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
            onPressed: () {
              Navigator.pop(ctx); // Close dialog
              Navigator.pop(context); // Close disclosure screen
              Navigator.pop(context); // Close application screen
            },
            child: const Text('Return to Home'),
          ),
        ],
      ),
    );
  }
}
