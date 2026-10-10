import 'package:flutter/material.dart';

class QRPhPaymentScreen extends StatefulWidget {
  final double installmentAmount;
  final String loanNumber;

  const QRPhPaymentScreen({
    super.key,
    required this.installmentAmount,
    required this.loanNumber,
  });

  @override
  State<QRPhPaymentScreen> createState() => _QRPhPaymentScreenState();
}

class _QRPhPaymentScreenState extends State<QRPhPaymentScreen> {
  bool _isCheckingPayment = false;

  @override
  Widget build(BuildContext context) {
    // PayMongo pass-on convenience fee: 1.5% or min ₱15
    final double passOnFee = (widget.installmentAmount * 0.015) > 15.0
        ? widget.installmentAmount * 0.015
        : 15.0;
    final double totalCharge = widget.installmentAmount + passOnFee;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pay via PayMongo QR Ph', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // QR Ph Code Container
          Center(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 4)),
                ],
                border: Border.all(color: const Color(0xFF16A34A), width: 2),
              ),
              child: Column(
                children: [
                  Container(
                    width: 220,
                    height: 220,
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(
                      child: Icon(Icons.qr_code_2, size: 190, color: Colors.white),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.verified, color: Color(0xFF16A34A), size: 16),
                      SizedBox(width: 6),
                      Text('Official QR Ph Dynamic Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF14532D))),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text('Accepts GCash, Maya, BDO, BPI, UnionBank, RCBC', style: TextStyle(fontSize: 11, color: Colors.black54)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Charge Breakdown Card
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.grey.shade300),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('PAYMENT FOR: ${widget.loanNumber}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black54)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Loan Repayment Installment:', style: TextStyle(fontSize: 13, color: Colors.black87)),
                      Text('₱${widget.installmentAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Gateway Pass-On Fee (PayMongo):', style: TextStyle(fontSize: 12, color: Colors.orange)),
                      Text('+ ₱${passOnFee.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.orange)),
                    ],
                  ),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Amount Scanned / Charged:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      Text('₱${totalCharge.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF16A34A))),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // In-Person Counter Tip
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: const [
                Icon(Icons.storefront, color: Colors.black54, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Want to avoid the ₱${15} pass-on fee? Pay in cash or cheque directly at any Bayani Coop branch teller counter with zero convenience fees.',
                    style: TextStyle(fontSize: 11, color: Colors.black87),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.download),
                  label: const Text('Save QR'),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('QR Ph image saved to gallery.')),
                    );
                  },
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
                  onPressed: _isCheckingPayment ? null : _simulatePaymentWebhook,
                  child: _isCheckingPayment
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('I Have Sent Payment', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _simulatePaymentWebhook() async {
    setState(() => _isCheckingPayment = true);
    await Future.delayed(const Duration(seconds: 1)); // Simulate PayMongo webhook callback
    setState(() => _isCheckingPayment = false);

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 48),
        title: const Text('Payment Confirmed!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Your installment payment was received via PayMongo QR Ph and credited to your loan amortization ledger.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
              child: Column(
                children: const [
                  Text('Official Receipt: OR-2026-099182', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  SizedBox(height: 4),
                  Text('Allocated: Principal ₱3,942.44 • Interest ₱500.00', style: TextStyle(fontSize: 11, color: Colors.black54)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}
