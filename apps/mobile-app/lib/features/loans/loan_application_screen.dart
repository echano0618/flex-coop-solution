import 'package:flutter/material.dart';
import '../../models/models.dart';
import '../../services/loan_calculator_helper.dart';
import 'disclosure_viewer_screen.dart';

class LoanApplicationScreen extends StatefulWidget {
  const LoanApplicationScreen({super.key});

  @override
  State<LoanApplicationScreen> createState() => _LoanApplicationScreenState();
}

class _LoanApplicationScreenState extends State<LoanApplicationScreen> {
  final List<LoanProductModel> _products = const [
    LoanProductModel(
      id: 'prod_reg_01',
      name: 'Regular Member Loan',
      code: 'REG-01',
      minAmount: 5000,
      maxAmount: 250000,
      annualInterestRate: 0.12,
      maxTermMonths: 24,
      serviceFeeRate: 0.015,
      requiresCoMaker: true,
    ),
    LoanProductModel(
      id: 'prod_emerg_02',
      name: 'Emergency & Calamity Loan',
      code: 'EMERG-01',
      minAmount: 3000,
      maxAmount: 50000,
      annualInterestRate: 0.06,
      maxTermMonths: 12,
      serviceFeeRate: 0.005,
      requiresCoMaker: false,
    ),
  ];

  late LoanProductModel _selectedProduct;
  double _amount = 50000.0;
  int _termMonths = 12;
  bool _agreedToTerms = false;
  final TextEditingController _coMakerController = TextEditingController(text: 'Juan Perez Dela Cruz (MEM-2026-0002)');

  @override
  void initState() {
    super.initState();
    _selectedProduct = _products.first;
  }

  @override
  void dispose() {
    _coMakerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final calc = LoanCalculatorHelper.calculate(
      principal: _amount,
      annualRate: _selectedProduct.annualInterestRate,
      termMonths: _termMonths,
      coopServiceRate: _selectedProduct.serviceFeeRate,
      isPlatformEscrow: true,
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Apply for a Loan', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // 1. Select Product
          const Text('1. Select Loan Product', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87)),
          const SizedBox(height: 8),
          Column(
            children: _products.map((p) {
              final isSelected = p.id == _selectedProduct.id;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: isSelected ? const Color(0xFF16A34A) : Colors.grey.shade300, width: isSelected ? 2 : 1),
                  borderRadius: BorderRadius.circular(12),
                  color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
                ),
                child: ListTile(
                  title: Text(p.name, style: TextStyle(fontWeight: FontWeight.bold, color: isSelected ? const Color(0xFF14532D) : Colors.black87)),
                  subtitle: Text('${(p.annualInterestRate * 100).toStringAsFixed(1)}% p.a. • Up to ${p.maxTermMonths} months • Max ₱${p.maxAmount.toStringAsFixed(0)}'),
                  trailing: Radio<String>(
                    value: p.id,
                    groupValue: _selectedProduct.id,
                    activeColor: const Color(0xFF16A34A),
                    onChanged: (val) {
                      setState(() {
                        _selectedProduct = p;
                        if (_amount > p.maxAmount) _amount = p.maxAmount;
                        if (_termMonths > p.maxTermMonths) _termMonths = p.maxTermMonths;
                      });
                    },
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // 2. Loan Amount
          Text('2. Loan Amount: ₱${_amount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          Slider(
            value: _amount,
            min: _selectedProduct.minAmount,
            max: _selectedProduct.maxAmount,
            divisions: ((_selectedProduct.maxAmount - _selectedProduct.minAmount) / 5000).clamp(1, 100).toInt(),
            label: '₱${_amount.toStringAsFixed(0)}',
            activeColor: const Color(0xFF16A34A),
            onChanged: (val) {
              setState(() => _amount = val);
            },
          ),
          const SizedBox(height: 12),

          // 3. Term Selection
          const Text('3. Repayment Term', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [6, 12, 18, 24].where((t) => t <= _selectedProduct.maxTermMonths).map((t) {
              final isSelected = t == _termMonths;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: isSelected ? const Color(0xFF16A34A) : Colors.white,
                      foregroundColor: isSelected ? Colors.white : Colors.black87,
                      side: BorderSide(color: isSelected ? const Color(0xFF16A34A) : Colors.grey.shade300),
                    ),
                    onPressed: () => setState(() => _termMonths = t),
                    child: Text('$t mos'),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // 4. Live Calculation & Deductions Preview
          Card(
            elevation: 0,
            color: const Color(0xFFF8FAFC),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.grey.shade300),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('DISBURSEMENT & AMORTIZATION PREVIEW', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black54)),
                  const SizedBox(height: 12),
                  _buildPreviewRow('Requested Loan Principal:', '₱${calc.grossPrincipal.toStringAsFixed(2)}'),
                  const SizedBox(height: 6),
                  _buildPreviewRow('SaaS Pass-Through Fee (2% / min ₱100):', '- ₱${calc.platformFee.toStringAsFixed(2)}', color: Colors.green.shade800),
                  const SizedBox(height: 6),
                  _buildPreviewRow('Coop Filing & Service Fee (1.5%):', '- ₱${calc.coopServiceFee.toStringAsFixed(2)}', color: Colors.black54),
                  const Divider(height: 20),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Estimated Net Payout:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF14532D))),
                        Text('₱${calc.netProceeds.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF14532D))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildPreviewRow('Monthly Installment:', '₱${calc.monthlyInstallment.toStringAsFixed(2)} / mo', isBold: true),
                  const SizedBox(height: 4),
                  _buildPreviewRow('Effective Interest Rate (EIR):', '${calc.effectiveInterestRate.toStringAsFixed(2)}% p.a.'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Co-Maker Field
          if (_selectedProduct.requiresCoMaker) ...[
            const Text('4. Designated Co-Maker (Regular Member)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _coMakerController,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                prefixIcon: const Icon(Icons.person),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Statutory Acknowledgment Checkbox
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _agreedToTerms,
            activeColor: const Color(0xFF16A34A),
            onChanged: (val) => setState(() => _agreedToTerms = val ?? false),
            title: const Text(
              'I agree to the terms of the Cooperative Credit Policy and certify that all declarations are true pursuant to the Truth in Lending Act (RA 3765).',
              style: TextStyle(fontSize: 11, color: Colors.black87),
            ),
          ),
          const SizedBox(height: 16),

          // Submit / Review Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _agreedToTerms
                  ? () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => DisclosureViewerScreen(
                            product: _selectedProduct,
                            calculation: calc,
                            termMonths: _termMonths,
                            coMakerName: _coMakerController.text,
                          ),
                        ),
                      );
                    }
                  : null,
              child: const Text('Review Disclosure & Sign Promissory Note', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewRow(String label, String value, {Color? color, bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.black54)),
        Text(value, style: TextStyle(fontSize: 12, fontWeight: isBold ? FontWeight.bold : FontWeight.w600, color: color ?? Colors.black87)),
      ],
    );
  }
}
