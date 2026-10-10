import 'dart:convert';
import 'package:http/http.dart' as http;

class CoopApiService {
  static const String baseUrl = 'http://localhost:4000/api/v1';
  static const String defaultTenantId = 'tenant_bayani_001';

  /// Check API & Firestore health
  static Future<Map<String, dynamic>> checkHealth() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/firestore/health'),
        headers: {'X-Tenant-ID': defaultTenantId},
      ).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (_) {
      // Offline fallback
    }
    return {
      'status': 'offline_mode',
      'service': 'Firebase Cloud Firestore (Local Cached)',
    };
  }

  /// Submit loan application to backend / Firestore
  static Future<Map<String, dynamic>> submitLoanApplication({
    required String memberId,
    required double principalAmount,
    required int termMonths,
    required String productType,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/lending/calculate'),
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': defaultTenantId,
        },
        body: jsonEncode({
          'principalAmount': principalAmount,
          'annualRate': productType == 'REGULAR' ? 0.12 : 0.06,
          'termMonths': termMonths,
          'method': productType == 'REGULAR'
              ? 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT'
              : 'STRAIGHT_LINE',
          'billingMode': 'PLATFORM_ESCROW',
        }),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (_) {
      // Offline fallback
    }

    // Local calculation fallback
    final platformFee = (principalAmount * 0.02) < 100 ? 100.0 : (principalAmount * 0.02);
    final netDisbursed = principalAmount - platformFee - (principalAmount * 0.015);
    return {
      'success': true,
      'netProceeds': netDisbursed,
      'platformFee': platformFee,
      'isOfflineSimulation': true,
    };
  }

  /// Generate PayMongo QR Ph code payload
  static Future<Map<String, dynamic>> generateQRPhPayload({
    required double installmentAmount,
    required String loanId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/payments/qrph/generate'),
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': defaultTenantId,
        },
        body: jsonEncode({
          'loanId': loanId,
          'amount': installmentAmount,
        }),
      ).timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (_) {
      // Offline fallback
    }

    final passOnFee = (installmentAmount * 0.015) < 15 ? 15.0 : (installmentAmount * 0.015);
    return {
      'success': true,
      'grossAmount': installmentAmount + passOnFee,
      'passOnFee': passOnFee,
      'qrCodeString': '00020101021226...PAYMONGO_QRPH_${installmentAmount.toInt()}',
    };
  }
}
