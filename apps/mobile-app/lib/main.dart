import 'package:flutter/material.dart';
import 'features/loans/loan_application_screen.dart';
import 'features/onboarding/ekyc_screen.dart';
import 'features/payments/qrph_payment_screen.dart';

void main() {
  runApp(const FlexCoopApp());
}

class FlexCoopApp extends StatelessWidget {
  const FlexCoopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flex Coop Member App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF16A34A), // Emerald green
          primary: const Color(0xFF16A34A),
        ),
        useMaterial3: true,
      ),
      home: const MemberHomeScreen(),
    );
  }
}

class MemberHomeScreen extends StatefulWidget {
  const MemberHomeScreen({super.key});

  @override
  State<MemberHomeScreen> createState() => _MemberHomeScreenState();
}

class _MemberHomeScreenState extends State<MemberHomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Bayani Multi-Purpose Coop',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              'CDA Reg: CDA-NCR-2024-00921',
              style: TextStyle(fontSize: 11, color: Colors.black54),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          DashboardTab(),
          LoansTab(),
          SavingsTab(),
          ProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), label: 'Loans'),
          NavigationDestination(icon: Icon(Icons.savings_outlined), label: 'Shares & Savings'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Account'),
        ],
      ),
    );
  }
}

/// TAB 1: DASHBOARD
class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Member Greeting & KYC Status Card
        Card(
          elevation: 0,
          color: Colors.green.shade50,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.green.shade700,
                  radius: 24,
                  child: const Text('MS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Maria Clara Santos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('MEM-2026-0001 • Regular Member', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    ],
                  ),
                ),
                InkWell(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(builder: (context) => const EkycVerificationScreen()));
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.green.shade600,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified_user, color: Colors.white, size: 14),
                        SizedBox(width: 4),
                        Text('eKYC Verified', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Quick Actions Row
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.add_circle_outline, size: 18),
                label: const Text('Apply Loan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const LoanApplicationScreen()));
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.badge_outlined, size: 18),
                label: const Text('Verify eKYC', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const EkycVerificationScreen()));
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Active Loan Summary Card
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Active Loan Balance', style: TextStyle(fontSize: 13, color: Colors.black54)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                      child: Text('LN-2026-00001', style: TextStyle(fontSize: 11, color: Colors.blue.shade800, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text('₱50,000.00', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF14532D))),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Next Due Date: Mar 01, 2026', style: TextStyle(fontSize: 12, color: Colors.black54)),
                    Text('Installment: ₱4,442.44', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('Pay via PayMongo QR Ph'),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const QRPhPaymentScreen(
                            installmentAmount: 4442.44,
                            loanNumber: 'LN-2026-00001',
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Balances Grid
        Row(
          children: [
            Expanded(
              child: Card(
                elevation: 0,
                color: Colors.amber.shade50,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: const Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Paid-Up Share Capital', style: TextStyle(fontSize: 11, color: Colors.black54)),
                      SizedBox(height: 6),
                      Text('₱15,000.00', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Card(
                elevation: 0,
                color: Colors.blue.shade50,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: const Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Compulsory Savings', style: TextStyle(fontSize: 11, color: Colors.black54)),
                      SizedBox(height: 6),
                      Text('₱5,000.00', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// TAB 2: LOANS
class LoansTab extends StatelessWidget {
  const LoansTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Loan Portfolio', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            TextButton.icon(
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Apply'),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const LoanApplicationScreen()));
              },
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          elevation: 1,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const CircleAvatar(backgroundColor: Color(0xFFDCFCE7), child: Icon(Icons.monetization_on, color: Color(0xFF16A34A))),
            title: const Text('Regular Member Loan (LN-2026-00001)', style: TextStyle(fontWeight: FontWeight.bold)),
            subtitle: const Text('12% p.a. • 12 Months • Disbursed via Escrow'),
            trailing: const Text('₱50,000.00', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const QRPhPaymentScreen(
                    installmentAmount: 4442.44,
                    loanNumber: 'LN-2026-00001',
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

/// TAB 3: SHARES & SAVINGS
class SavingsTab extends StatelessWidget {
  const SavingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Text('Shares & Savings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        SizedBox(height: 12),
        ListTile(
          title: Text('Common Share Capital (Paid-Up)'),
          subtitle: Text('150 Shares @ ₱100.00 par value'),
          trailing: Text('₱15,000.00', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        Divider(),
        ListTile(
          title: Text('Compulsory Savings Deposit'),
          subtitle: Text('Earns 3.0% interest p.a.'),
          trailing: Text('₱5,000.00', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}

/// TAB 4: PROFILE & NPC CONSENT
class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Member Profile & Privacy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ListTile(
          leading: const Icon(Icons.shield),
          title: const Text('Data Privacy Consent (NPC)'),
          subtitle: const Text('Consent recorded: Jan 20, 2026 (IP: 120.29.74.12)'),
          trailing: const Icon(Icons.check_circle, color: Colors.green),
        ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.badge),
          title: const Text('Verified Government ID'),
          subtitle: const Text('PhilSys National ID (Encrypted SPI)'),
          trailing: const Icon(Icons.verified, color: Colors.blue),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const EkycVerificationScreen()));
          },
        ),
      ],
    );
  }
}
