import 'package:flutter/material.dart';

class EkycVerificationScreen extends StatefulWidget {
  const EkycVerificationScreen({super.key});

  @override
  State<EkycVerificationScreen> createState() => _EkycVerificationScreenState();
}

class _EkycVerificationScreenState extends State<EkycVerificationScreen> {
  String _selectedIdType = 'PHILSYS_NATIONAL_ID';
  final TextEditingController _idNumberController = TextEditingController(text: '1234-5678-9012-3456');
  bool _agreedToPrivacyPolicy = true;
  bool _frontIdCaptured = true;
  bool _selfieCaptured = true;
  bool _isSubmitting = false;

  final List<Map<String, String>> _idTypes = [
    {'code': 'PHILSYS_NATIONAL_ID', 'name': 'Philippine National ID (PhilSys)'},
    {'code': 'DRIVERS_LICENSE', 'name': 'LTO Driver\'s License'},
    {'code': 'UMID', 'name': 'Unified Multi-Purpose ID (UMID)'},
    {'code': 'PASSPORT', 'name': 'Philippine Passport'},
    {'code': 'POSTAL_ID', 'name': 'DFA / PHLPost Postal ID'},
  ];

  @override
  void dispose() {
    _idNumberController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('eKYC & Identity Verification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // NPC Notice Card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.privacy_tip_outlined, color: Colors.blue.shade900, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'NPC Compliance: Your Sensitive Personal Information (SPI) is protected with AES-256-GCM encryption pursuant to the Data Privacy Act of 2012 (RA 10173).',
                    style: TextStyle(fontSize: 11, color: Colors.blue.shade950, height: 1.3),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 1. Select ID Type
          const Text('1. Select Government Issued ID', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String>(
            value: _selectedIdType,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
            items: _idTypes.map((t) {
              return DropdownMenuItem<String>(
                value: t['code'],
                child: Text(t['name']!, style: const TextStyle(fontSize: 13)),
              );
            }).toList(),
            onChanged: (val) => setState(() => _selectedIdType = val!),
          ),
          const SizedBox(height: 16),

          // ID Number
          const Text('2. Government ID Number', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _idNumberController,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              prefixIcon: const Icon(Icons.badge_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              hintText: 'Enter ID Number',
            ),
          ),
          const SizedBox(height: 20),

          // Document Front Capture Box
          const Text('3. Government ID Document (Front)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _frontIdCaptured ? const Color(0xFF16A34A) : Colors.grey.shade400, width: _frontIdCaptured ? 2 : 1),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(_frontIdCaptured ? Icons.check_circle : Icons.camera_alt, color: _frontIdCaptured ? const Color(0xFF16A34A) : Colors.black45, size: 40),
                  const SizedBox(height: 8),
                  Text(_frontIdCaptured ? 'PhilSys National ID Captured' : 'Tap to Capture ID Front', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: _frontIdCaptured ? const Color(0xFF16A34A) : Colors.black54)),
                  Text(_frontIdCaptured ? 'File: philsys_front_encrypted.jpg (1.2 MB)' : 'Ensure text and photo are clearly visible', style: const TextStyle(fontSize: 11, color: Colors.black45)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Liveness Selfie Box
          const Text('4. Liveness Facial Selfie', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _selfieCaptured ? const Color(0xFF16A34A) : Colors.grey.shade400, width: _selfieCaptured ? 2 : 1),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(_selfieCaptured ? Icons.face : Icons.camera_front, color: _selfieCaptured ? const Color(0xFF16A34A) : Colors.black45, size: 40),
                  const SizedBox(height: 8),
                  Text(_selfieCaptured ? 'Liveness Selfie Verified' : 'Tap to Take Selfie', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: _selfieCaptured ? const Color(0xFF16A34A) : Colors.black54)),
                  Text(_selfieCaptured ? 'Match Score: 98.4% Confidence' : 'Look straight into camera with good lighting', style: const TextStyle(fontSize: 11, color: Colors.black45)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Explicit Consent
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _agreedToPrivacyPolicy,
            activeColor: const Color(0xFF16A34A),
            onChanged: (val) => setState(() => _agreedToPrivacyPolicy = val ?? false),
            title: const Text(
              'I give my free, specific, and informed consent to Bayani Multi-Purpose Cooperative to process my sensitive personal data for identity verification and credit scoring in compliance with the Data Privacy Act of 2012.',
              style: TextStyle(fontSize: 11, color: Colors.black87),
            ),
          ),
          const SizedBox(height: 20),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _agreedToPrivacyPolicy ? _submitEkyc : null,
              child: _isSubmitting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Submit eKYC Verification', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _submitEkyc() async {
    setState(() => _isSubmitting = true);
    await Future.delayed(const Duration(seconds: 1));
    setState(() => _isSubmitting = false);

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.verified_user, color: Color(0xFF16A34A), size: 48),
        title: const Text('eKYC Submitted Successfully', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text(
          'Your identity documents have been encrypted and submitted to the Compliance Officer. You can now access full cooperative lending services.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 12),
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
