'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Wallet,
  PiggyBank,
  CreditCard,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Plus,
  X,
  Landmark,
  Printer,
  BookOpen,
  Users,
  Clock,
  UserCheck,
  AlertTriangle,
  PieChart,
  Scale,
  Lock,
  Percent,
  LayoutDashboard,
  Menu,
  ArrowLeft,
  Smartphone,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { getApiBaseUrl } from '../api-config';
import {
  resolveTenantCoop,
  getTenantMemberSession,
  getTenantAdminSession,
  clearTenantMemberSession,
  resolveGeneralManager,
  isTestCoopTenant,
  purgeTenantDummyRecords,
  TenantInfo,
} from '../tenant-utils';

const DEFAULT_LOAN_PRODUCTS = [
  {
    id: 'prod_regular',
    code: 'REGULAR_LOAN',
    name: 'Regular Member Loan',
    type: 'REGULAR',
    minAmount: 10000,
    maxAmount: 100000,
    annualInterestRate: 0.12,
    minTermMonths: 6,
    maxTermMonths: 24,
    amortizationMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    advanceInterestOption: 'NONE',
    succeedingMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    fixedMonthlyInstallment: true,
    serviceFeeRate: 0.015,
    finesRateMonthly: 0.03,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 active co-maker in good standing with min ₱5,000 paid-up share capital. Co-maker must key in Member ID and sign solidary undertaking.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
    optionalFees: [
      { id: 'opt_fee_1', name: 'Documentary Stamp Tax (DST)', type: 'PERCENTAGE', value: 0.75 },
      { id: 'opt_fee_2', name: 'Loan Protection Insurance', type: 'FIXED', value: 500 },
    ],
  },
  {
    id: 'prod_emergency',
    code: 'EMERGENCY_PLUS',
    name: 'Emergency Relief Loan Plus',
    type: 'EMERGENCY',
    minAmount: 5000,
    maxAmount: 50000,
    annualInterestRate: 0.06,
    minTermMonths: 3,
    maxTermMonths: 12,
    amortizationMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    advanceInterestOption: 'NONE',
    succeedingMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    fixedMonthlyInstallment: true,
    serviceFeeRate: 0.005,
    finesRateMonthly: 0.02,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 co-maker who has completed PMES and has active cooperative savings.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
    optionalFees: [
      { id: 'opt_fee_1', name: 'Documentary Stamp Tax (DST)', type: 'PERCENTAGE', value: 0.75 },
    ],
  },
  {
    id: 'prod_educational',
    code: 'EDUCATIONAL_LOAN',
    name: 'Educational Assistance Loan',
    type: 'EDUCATIONAL',
    minAmount: 10000,
    maxAmount: 50000,
    annualInterestRate: 0.08,
    minTermMonths: 6,
    maxTermMonths: 18,
    amortizationMethod: 'STRAIGHT_LINE',
    advanceInterestOption: 'FIRST_YEAR',
    succeedingMethod: 'STRAIGHT_LINE',
    fixedMonthlyInstallment: true,
    serviceFeeRate: 0.01,
    finesRateMonthly: 0.02,
    requiresCoMaker: false,
    minCoMakers: 0,
    coMakerRuleDescription: 'Co-maker optional; borrower must submit certificate of school matriculation.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
    optionalFees: [
      { id: 'opt_fee_1', name: 'Documentary Stamp Tax (DST)', type: 'PERCENTAGE', value: 0.75 },
      { id: 'opt_fee_2', name: 'Student Assistance Insurance', type: 'FIXED', value: 350 },
    ],
  },
];

export default function MemberPortalPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    slug: 'default',
    name: 'Cooperative Enterprise',
    isSubdomain: false,
    registrationNumber: 'CDA Registered',
    logoLetter: 'C',
    coopType: 'Multi-Purpose',
  });

  // Authentication Guard: Redirect unauthenticated visitors to /member/login with tenant scoping
  useEffect(() => {
    const info = resolveTenantCoop();
    setTenantInfo(info);

    try {
      if (typeof window !== 'undefined') {
        const auth = getTenantMemberSession(info.slug);
        const admin = getTenantAdminSession(info.slug);
        if (auth || admin) {
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Member auth check error:', e);
    }
    setIsCheckingAuth(false);
    router.replace(info.slug && info.slug !== 'default' ? `/member/login?coop=${info.slug}` : '/member/login');
  }, [router]);

  const handleMemberSignOut = () => {
    clearTenantMemberSession(tenantInfo.slug);
    router.replace(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member/login?coop=${tenantInfo.slug}` : '/member/login');
  };

  // Member Persona Switcher (Maria = Borrower, Juan = Co-Maker)
  const [currentPersona, setCurrentPersona] = useState<'maria' | 'juan'>('maria');
  const [customMember, setCustomMember] = useState<any>(null);

  // Load authenticated member or General Manager profile
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const info = resolveTenantCoop();
        const isTestTenant = isTestCoopTenant(info.slug);

        if (!isTestTenant) {
          purgeTenantDummyRecords(info.slug);
        }

        const auth = getTenantMemberSession(info.slug);
        const admin = getTenantAdminSession(info.slug);

        if (auth) {
          try {
            const parsed = auth;
            if (parsed && (parsed.firstName || parsed.name)) {
              const fullName = parsed.name || `${parsed.firstName} ${parsed.lastName || ''}`.trim();
              const initials = ((parsed.firstName?.[0] || '') + (parsed.lastName?.[0] || '') || fullName.slice(0, 2)).toUpperCase();
              setCustomMember({
                id: parsed.id || 'mem_0001',
                memberNumber: parsed.memberNumber || 'MEM-2026-0001',
                name: fullName,
                initials: initials || 'MB',
                type: parsed.position ? `${parsed.position} (Regular Member)` : (parsed.type || 'Regular Member'),
                paidUpCapital: parsed.paidUpCapital !== undefined ? parsed.paidUpCapital : (isTestTenant ? 25000 : 0),
                sharesCount: parsed.sharesCount !== undefined ? parsed.sharesCount : (isTestTenant ? 250 : 0),
                savingsBalance: parsed.savingsBalance !== undefined ? parsed.savingsBalance : 0,
                idType: parsed.idType || 'PhilSys Verified Member ID',
              });
              return;
            }
          } catch {}
        }

        if (admin) {
          try {
            const parsedAdmin = admin;
            if (parsedAdmin && parsedAdmin.name) {
              const fullName = parsedAdmin.name;
              const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              setCustomMember({
                id: parsedAdmin.id || 'mem_gm_0001',
                memberNumber: 'MEM-2026-0001',
                name: fullName,
                initials: initials || 'GM',
                type: 'General Manager (Regular Member)',
                paidUpCapital: 10000,
                sharesCount: 100,
                savingsBalance: isTestTenant ? 5000 : 0,
                idType: 'CDA General Manager Verified PhilSys ID',
              });
              return;
            }
          } catch {}
        }

        const gm = resolveGeneralManager(info.slug);
        if (gm && gm.name) {
          const initials = gm.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
          setCustomMember({
            id: 'mem_gm_0001',
            memberNumber: 'MEM-2026-0001',
            name: gm.name,
            initials: initials || 'GM',
            type: 'General Manager (Regular Member)',
            paidUpCapital: 10000,
            sharesCount: 100,
            savingsBalance: isTestTenant ? 5000 : 0,
            idType: 'CDA General Manager Verified PhilSys ID',
          });
          return;
        }
      }
    } catch (e) {
      console.warn('Member state parse error:', e);
    }
  }, []);

  const gmInfo = resolveGeneralManager(tenantInfo.slug);
  const gmInitials = gmInfo.name
    ? gmInfo.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'GM';

  const currentMember = customMember || {
    id: 'mem_gm_0001',
    memberNumber: 'MEM-2026-0001',
    name: gmInfo.name || 'General Manager',
    initials: gmInitials || 'GM',
    type: 'General Manager (Regular Member)',
    paidUpCapital: 10000,
    sharesCount: 100,
    savingsBalance: isTestCoopTenant(tenantInfo.slug) ? 5000 : 0,
    idType: 'CDA General Manager Verified PhilSys ID',
  };

  const [activeTab, setActiveTab] = useState<'home' | 'passbook' | 'more' | 'apply' | 'pay' | 'comaker' | 'documents' | 'profile' | 'surplus' | 'collateral'>('home');

  // PWA Installation Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert('To install on iOS: tap the Share icon in Safari (box with up arrow) and select "Add to Home Screen". On Android/Chrome: tap browser menu (⋮) and select "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Co-Maker Endorsement Requests State
  const [endorsementRequests, setEndorsementRequests] = useState(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return [];
      }
    }
    return [
      {
        id: 'req_001',
        loanId: 'loan_maria_001',
        loanNumber: 'LN-2026-00001',
        borrowerName: 'Maria Clara Santos',
        borrowerMemberNumber: 'MEM-2026-0001',
        designatedCoMakerMemberNumber: 'MEM-2026-0002',
        productName: 'Regular Member Loan',
        principalAmount: 50000,
        termMonths: 12,
        monthlyInstallment: 4442.44,
        status: 'PENDING' as 'PENDING' | 'ACCEPTED' | 'DECLINED',
        requestedAt: '2026-10-10 09:30 AM',
        respondedAt: null as string | null,
      },
    ];
  });

  // Designated Co-Maker Member ID input when applying
  const [coMakerMemberIdInput, setCoMakerMemberIdInput] = useState<string>('MEM-2026-0002');
  const [coMakerError, setCoMakerError] = useState<string>('');
  const [solidaryAgreed, setSolidaryAgreed] = useState<boolean>(false);
  const [endorsementSuccessMsg, setEndorsementSuccessMsg] = useState<string>('');

  // Cooperative Loan Products State with localStorage & API Synchronization
  const [loanProducts, setLoanProducts] = useState<any[]>(DEFAULT_LOAN_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_regular');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flexcoop_loan_products');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLoanProducts(parsed);
            const activeOnes = parsed.filter((p: any) => p.isActive !== false && p.status !== 'INACTIVE');
            if (activeOnes.length > 0) {
              setSelectedProductId(activeOnes[0].id);
            }
          }
        } catch (e) {
          console.error('Failed to parse loan products:', e);
        }
      }
    }

    fetch(`${getApiBaseUrl()}/loan-products`)
      .then((r) => r.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLoanProducts((prev) => {
            const map = new Map();
            res.data.forEach((p: any) => map.set(p.code || p.id, p));
            prev.forEach((p: any) => {
              if (!map.has(p.code || p.id)) map.set(p.code || p.id, p);
            });
            const merged = Array.from(map.values());
            const activeOnes = merged.filter((p: any) => p.isActive !== false && p.status !== 'INACTIVE');
            if (activeOnes.length > 0 && !activeOnes.some((p: any) => p.id === selectedProductId)) {
              setSelectedProductId(activeOnes[0].id);
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Show only ACTIVE products to members for new loan applications
  const activeLoanProducts = loanProducts.filter((p) => p.isActive !== false && p.status !== 'INACTIVE');
  const selectedProduct =
    activeLoanProducts.find((p) => p.id === selectedProductId) ||
    activeLoanProducts[0] ||
    loanProducts[0] ||
    DEFAULT_LOAN_PRODUCTS[0];

  // Member Loan Application State
  const [loanAmount, setLoanAmount] = useState<number>(50000);
  const [loanTerm, setLoanTerm] = useState<number>(12);
  const [coMaker, setCoMaker] = useState<string>('Co-Maker Member (MEM-2026-0002)');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
  const [applicationSubmitted, setApplicationSubmitted] = useState<boolean>(false);

  // Loan Settlement & Disbursement Details State
  const [settlementChannel, setSettlementChannel] = useState<'BANK_TRANSFER' | 'E_WALLET' | 'CASH_COUNTER'>('BANK_TRANSFER');
  const [settlementInstitution, setSettlementInstitution] = useState<string>('Land Bank of the Philippines');
  const [settlementAccountNumber, setSettlementAccountNumber] = useState<string>('1092-8374-65');
  const [settlementAccountName, setSettlementAccountName] = useState<string>('');
  const [submittedSettlementRecord, setSubmittedSettlementRecord] = useState<{
    channel: 'BANK_TRANSFER' | 'E_WALLET' | 'CASH_COUNTER';
    institutionName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);

  useEffect(() => {
    setSettlementAccountName(currentMember.name);
  }, [currentPersona, currentMember.name]);

  // Repayment State
  const [repayChannel, setRepayChannel] = useState<'PAYMONGO_QRPH' | 'IN_PERSON'>('PAYMONGO_QRPH');
  const [repayAmount, setRepayAmount] = useState<number>(4442.44);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Active Loan State (Zero in production; sample demonstration in test instance)
  const [loanBalance, setLoanBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return 0.0;
      }
    }
    return 50000.0;
  });

  // Share Capital & Savings Balances State
  const [paidUpCapital, setPaidUpCapital] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return 10000;
      }
    }
    return 15000;
  });
  const [sharesCount, setSharesCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return 100;
      }
    }
    return 150;
  });
  const [savingsBalance, setSavingsBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return 0; // Strictly zero in production
      }
    }
    return 5000;
  });

  // Keep balances synchronized with authenticated member
  useEffect(() => {
    if (customMember) {
      if (customMember.paidUpCapital !== undefined) setPaidUpCapital(Number(customMember.paidUpCapital));
      if (customMember.sharesCount !== undefined) setSharesCount(Number(customMember.sharesCount));
      if (customMember.savingsBalance !== undefined) setSavingsBalance(Number(customMember.savingsBalance));
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        setLoanBalance(0.0);
      }
    }
  }, [customMember]);

  // Self-Service Deposit / Share Purchase Modal State
  const [depositModalType, setDepositModalType] = useState<'SHARES' | 'SAVINGS' | null>(null);
  const [depositSharesCount, setDepositSharesCount] = useState<number>(10); // 10 shares @ ₱100 = ₱1,000
  const [depositSavingsAmount, setDepositSavingsAmount] = useState<number>(1000);
  const [depositChannel, setDepositChannel] = useState<'PAYMONGO_QRPH' | 'IN_PERSON_SLIP'>('PAYMONGO_QRPH');
  const [depositSuccessResult, setDepositSuccessResult] = useState<{
    type: string;
    amount: number;
    reference: string;
    channel: string;
    sharesAdded?: number;
  } | null>(null);

  // Dynamic Calculations for Loan Application
  const annualRate = selectedProduct.annualInterestRate || 0.12;
  const minPrincipal = selectedProduct.minAmount || 5000;
  const maxPrincipal = selectedProduct.maxAmount || 100000;
  const requiresCoMaker = Boolean(selectedProduct.requiresCoMaker);
  const coMakerRuleText = selectedProduct.coMakerRuleDescription || 'Requires active co-maker endorsement with joint solidary liability.';

  const platformFee = Math.max(loanAmount * 0.02, 100.0);
  const coopServiceFee = loanAmount * (selectedProduct.serviceFeeRate || 0.015);

  let advanceInterest = 0;
  if (selectedProduct.advanceInterestOption === 'FIRST_YEAR') {
    advanceInterest = Math.round(loanAmount * annualRate * (Math.min(12, loanTerm) / 12.0) * 100) / 100;
  } else if (selectedProduct.advanceInterestOption === 'ENTIRE_LOAN') {
    advanceInterest = Math.round(loanAmount * annualRate * (loanTerm / 12.0) * 100) / 100;
  }

  let optionalFeesTotal = 0;
  if (Array.isArray(selectedProduct.optionalFees)) {
    optionalFeesTotal = selectedProduct.optionalFees.reduce((acc: number, f: any) => {
      if (f.type === 'PERCENTAGE') {
        return acc + Math.round(loanAmount * (Number(f.value) / 100) * 100) / 100;
      }
      return acc + (Number(f.value) || 0);
    }, 0);
  }

  const netProceeds = Math.max(0, loanAmount - platformFee - coopServiceFee - advanceInterest - optionalFeesTotal);

  // Monthly annuity installment
  const monthlyRate = annualRate / 12.0;
  const factor = Math.pow(1.0 + monthlyRate, loanTerm);
  const monthlyInstallment = Math.round(((loanAmount * (monthlyRate * factor)) / (factor - 1.0)) * 100) / 100;
  const totalInterest = Math.round(((monthlyInstallment * loanTerm) - loanAmount) * 100) / 100;
  const eir = Math.round((((totalInterest + platformFee + coopServiceFee + advanceInterest + optionalFeesTotal) / netProceeds) / (loanTerm / 12.0)) * 10000) / 100;

  // Pass-On Fee for QR Ph
  const passOnFee = repayChannel === 'PAYMONGO_QRPH' ? Math.max(15.0, Math.round(repayAmount * 0.015 * 100) / 100) : 0.0;
  const totalCharge = Math.round((repayAmount + passOnFee) * 100) / 100;

  const handleSimulatePayment = () => {
    setPaymentSuccess(true);
    setLoanBalance((prev) => Math.max(0, Math.round((prev - (repayAmount - 500)) * 100) / 100)); // principal reduction
  };

  // Option 4: Digital Passbook & Subsidiary Ledger State
  const [passbookSubTab, setPassbookSubTab] = useState<'shares' | 'savings' | 'loan'>('shares');
  const [showPassbookStatementModal, setShowPassbookStatementModal] = useState<boolean>(false);
  const [passbookPayModal, setPassbookPayModal] = useState<{
    open: boolean;
    type: 'LOAN' | 'SAVINGS' | 'SHARES';
    amount: number;
    description: string;
  }>({
    open: false,
    type: 'LOAN',
    amount: 4442.44,
    description: 'Monthly Loan Amortization Installment #2',
  });
  const [passbookReceipt, setPassbookReceipt] = useState<{
    orNumber: string;
    date: string;
    time: string;
    accountCode: string;
    accountName: string;
    baseAmount: number;
    convenienceFee: number;
    totalAmount: number;
    newBalance: number;
    reference: string;
    description: string;
  } | null>(null);

  // Dynamic Subsidiary Ledger Entries State
  const [mariaShareLedger, setMariaShareLedger] = useState([
    {
      date: '2026-01-15',
      ref: 'OR-2026-0012',
      particulars: 'Initial Subscription & Paid-Up Capital (PMES Admission)',
      shares: 100,
      debit: 0,
      credit: 10000,
      balance: 10000,
    },
    {
      date: '2026-02-15',
      ref: 'OR-2026-0199',
      particulars: 'Voluntary Capital Build-Up (50 Shares @ ₱100 Par)',
      shares: 50,
      debit: 0,
      credit: 5000,
      balance: 15000,
    },
  ]);

  const [mariaSavingsLedger, setMariaSavingsLedger] = useState([
    {
      date: '2026-01-15',
      ref: 'OR-2026-0013',
      particulars: 'Opening Compulsory Savings Account (2-01-01)',
      debit: 0,
      credit: 2000,
      balance: 2000,
    },
    {
      date: '2026-02-01',
      ref: 'OR-2026-0341',
      particulars: 'Monthly PMES Mandatory Savings Deposit',
      debit: 0,
      credit: 1000,
      balance: 3000,
    },
    {
      date: '2026-02-15',
      ref: 'OR-2026-0498',
      particulars: 'Voluntary Savings Top-Up via PayMongo QR Ph Rail',
      debit: 0,
      credit: 2000,
      balance: 5000,
    },
  ]);

  const [mariaLoanLedger, setMariaLoanLedger] = useState([
    {
      date: '2026-01-20',
      ref: 'DISB-TX-LN001',
      particulars: 'Disbursement of Regular Member Loan (12 Mos @ 12% p.a.)',
      principal: 50000,
      interest: 0,
      debit: 50000,
      credit: 0,
      balance: 50000,
    },
    {
      date: '2026-02-20',
      ref: 'OR-2026-0992181',
      particulars: 'Installment #1 Repayment via QR Ph (Principal ₱3,942.44 + Interest ₱500)',
      principal: 3942.44,
      interest: 500,
      debit: 0,
      credit: 3942.44,
      balance: 46057.56,
    },
  ]);

  const [juanShareLedger, setJuanShareLedger] = useState([
    {
      date: '2026-01-18',
      ref: 'OR-2026-0035',
      particulars: 'Initial Subscription & Paid-Up Capital (100 Shares)',
      shares: 100,
      debit: 0,
      credit: 10000,
      balance: 10000,
    },
  ]);

  const [juanSavingsLedger, setJuanSavingsLedger] = useState([
    {
      date: '2026-01-18',
      ref: 'OR-2026-0036',
      particulars: 'Opening Compulsory Savings Account (2-01-01)',
      debit: 0,
      credit: 2000,
      balance: 2000,
    },
  ]);

  const [prodShareLedger, setProdShareLedger] = useState<{
    date: string;
    ref: string;
    particulars: string;
    shares: number;
    debit: number;
    credit: number;
    balance: number;
  }[]>([]);

  const [prodSavingsLedger, setProdSavingsLedger] = useState<{
    date: string;
    ref: string;
    particulars: string;
    debit: number;
    credit: number;
    balance: number;
  }[]>([]);

  const isTestTenant = isTestCoopTenant(tenantInfo.slug);

  const activeShareLedger = isTestTenant
    ? (currentPersona === 'maria' ? mariaShareLedger : juanShareLedger)
    : (prodShareLedger.length > 0
        ? prodShareLedger
        : paidUpCapital > 0 ? [
            {
              date: '2026-01-20',
              ref: 'OR-SHR-2026-001',
              particulars: 'Initial Subscription & Paid-Up Capital Contribution',
              shares: sharesCount || Math.floor(paidUpCapital / 100),
              debit: 0,
              credit: paidUpCapital,
              balance: paidUpCapital,
            },
          ] : []);

  const activeSavingsLedger = isTestTenant
    ? (currentPersona === 'maria' ? mariaSavingsLedger : juanSavingsLedger)
    : (prodSavingsLedger.length > 0
        ? prodSavingsLedger
        : savingsBalance > 0 ? [
            {
              date: '2026-01-20',
              ref: 'OR-SAV-2026-001',
              particulars: 'Opening Compulsory Savings Account (2-01-01)',
              debit: 0,
              credit: savingsBalance,
              balance: savingsBalance,
            },
          ] : []);

  const activeLoanLedger = isTestTenant
    ? (currentPersona === 'maria' ? mariaLoanLedger : [])
    : (loanBalance > 0 ? [
        {
          date: '2026-02-01',
          ref: 'DISB-TX-LN001',
          particulars: 'Disbursement of Loan Proceeds via Escrow',
          principal: loanBalance,
          interest: 0,
          debit: loanBalance,
          credit: 0,
          balance: loanBalance,
        },
      ] : []);

  // Convenience Fee Calculator for PayMongo QR Ph (1.5%, minimum ₱15.00)
  const calculateConvenienceFee = (amount: number) => {
    return Math.max(15.0, Math.round(amount * 0.015 * 100) / 100);
  };

  const handleExecutePassbookPayment = (type: 'LOAN' | 'SAVINGS' | 'SHARES', amount: number) => {
    const fee = calculateConvenienceFee(amount);
    const total = Math.round((amount + fee) * 100) / 100;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString();
    const orNum = `OR-${now.getFullYear()}-QR${Math.floor(10000 + Math.random() * 90000)}`;

    if (type === 'LOAN') {
      const interestPart = 460.58;
      const principalPart = Math.max(0, Math.round((amount - interestPart) * 100) / 100);
      const newBal = Math.max(0, Math.round((loanBalance - principalPart) * 100) / 100);
      setLoanBalance(newBal);

      setMariaLoanLedger((prev) => [
        ...prev,
        {
          date: dateStr,
          ref: orNum,
          particulars: `Installment #2 Repayment via PayMongo QR Ph (Principal ₱${principalPart.toFixed(2)} + Interest ₱${interestPart.toFixed(2)})`,
          principal: principalPart,
          interest: interestPart,
          debit: 0,
          credit: principalPart,
          balance: newBal,
        },
      ]);

      setPassbookReceipt({
        orNumber: orNum,
        date: dateStr,
        time: timeStr,
        accountCode: '1-02-01',
        accountName: 'Loans Receivable - Regular',
        baseAmount: amount,
        convenienceFee: fee,
        totalAmount: total,
        newBalance: newBal,
        reference: 'LN-2026-00001',
        description: 'Monthly Loan Amortization Payment',
      });
    } else if (type === 'SAVINGS') {
      const newBal = Math.round((savingsBalance + amount) * 100) / 100;
      setSavingsBalance(newBal);

      if (isTestTenant) {
        if (currentPersona === 'maria') {
          setMariaSavingsLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Voluntary Savings Deposit via PayMongo QR Ph Rail`,
              debit: 0,
              credit: amount,
              balance: newBal,
            },
          ]);
        } else {
          setJuanSavingsLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Voluntary Savings Deposit via PayMongo QR Ph Rail`,
              debit: 0,
              credit: amount,
              balance: newBal,
            },
          ]);
        }
      } else {
        setProdSavingsLedger((prev) => [
          ...prev,
          {
            date: dateStr,
            ref: orNum,
            particulars: `Voluntary Savings Deposit via PayMongo QR Ph Rail`,
            debit: 0,
            credit: amount,
            balance: newBal,
          },
        ]);
      }

      setPassbookReceipt({
        orNumber: orNum,
        date: dateStr,
        time: timeStr,
        accountCode: '2-01-01',
        accountName: 'Savings Deposits - Voluntary',
        baseAmount: amount,
        convenienceFee: fee,
        totalAmount: total,
        newBalance: newBal,
        reference: isTestTenant ? (currentPersona === 'maria' ? 'SAV-2026-0001' : 'SAV-2026-0002') : `SAV-${currentMember.memberNumber || '001'}`,
        description: 'Voluntary Member Savings Deposit',
      });
    } else if (type === 'SHARES') {
      const newShares = Math.floor(amount / 100);
      const newPaidUp = Math.round((paidUpCapital + amount) * 100) / 100;
      setPaidUpCapital(newPaidUp);
      setSharesCount((prev) => prev + newShares);

      if (isTestTenant) {
        if (currentPersona === 'maria') {
          setMariaShareLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Capital Build-Up (+${newShares} Shares @ ₱100 Par) via QR Ph`,
              shares: newShares,
              debit: 0,
              credit: amount,
              balance: newPaidUp,
            },
          ]);
        } else {
          setJuanShareLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Capital Build-Up (+${newShares} Shares @ ₱100 Par) via QR Ph`,
              shares: newShares,
              debit: 0,
              credit: amount,
              balance: newPaidUp,
            },
          ]);
        }
      } else {
        setProdShareLedger((prev) => [
          ...prev,
          {
            date: dateStr,
            ref: orNum,
            particulars: `Capital Build-Up (+${newShares} Shares) via QR Ph`,
            shares: newShares,
            debit: 0,
            credit: amount,
            balance: newPaidUp,
          },
        ]);
      }

      setPassbookReceipt({
        orNumber: orNum,
        date: dateStr,
        time: timeStr,
        accountCode: '3-01-03',
        accountName: 'Paid-Up Share Capital - Common',
        baseAmount: amount,
        convenienceFee: fee,
        totalAmount: total,
        newBalance: newPaidUp,
        reference: isTestTenant ? (currentPersona === 'maria' ? 'SC-2026-0001' : 'SC-2026-0002') : `SC-${currentMember.memberNumber || '001'}`,
        description: 'Paid-Up Share Capital Build-Up Deposit',
      });
    }

    setPassbookPayModal({ open: false, type: 'LOAN', amount: 0, description: '' });
  };

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Verifying Member Authorization...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Institutional Top Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
              {tenantInfo.logoLetter}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider truncate">
                Official Member Online Banking Facility
              </div>
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight truncate" title={tenantInfo.name}>
                {tenantInfo.name}
              </h1>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                Reg # {tenantInfo.registrationNumber}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={tenantInfo.slug && tenantInfo.slug !== 'default' ? `/?coop=${tenantInfo.slug}` : '/'}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition"
            >
              <span>Admin Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleMemberSignOut}
              className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with Safe Bottom Padding for Mobile Navigation Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 sm:pt-6 pb-28 sm:pb-32">

        {/* TAB 1: MY PORTFOLIO (Dashboard) */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Pending Co-Maker Notice Banner */}
            {endorsementRequests.some(
              (r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING'
            ) && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-950 text-sm">You have a Pending Co-Maker Endorsement Request!</span>
                    <p className="text-amber-800 mt-0.5">
                      {(() => {
                        const req = endorsementRequests.find(
                          (r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING'
                        );
                        return `${req?.borrowerName || 'A member'} designated your Member ID (${currentMember.memberNumber}) as loan co-maker. Your joint solidary acceptance is required before the loan is reviewed.`;
                      })()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('comaker')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-sm shrink-0"
                >
                  Review Request & Sign
                </button>
              </div>
            )}

            {/* Member Account Card with Financial Overview (Moved from More) */}
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-extrabold text-xl flex items-center justify-center shrink-0 shadow-inner">
                  {currentMember.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Member Account</span>
                    <span className="bg-emerald-500/30 text-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                      CDA Good Standing
                    </span>
                  </div>
                  <h2 className="text-xl font-bold truncate text-white">{currentMember.name}</h2>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {currentMember.memberNumber} • Regular Member
                  </p>
                </div>
              </div>

              {/* Financial Quick Glance */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-emerald-700/50 text-center">
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">Share Capital</div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">
                    ₱{paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">Savings</div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">
                    ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">Loan Balance</div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">
                    ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quick Actions
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold">Self-Service</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* Deposit Savings */}
                <button
                  type="button"
                  onClick={() => {
                    setDepositModalType('SAVINGS');
                    setDepositSuccessResult(null);
                  }}
                  className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 bg-slate-50/70 transition-all text-center group"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                    Deposit Savings
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">3% p.a. Compounded</span>
                </button>

                {/* Purchase Share */}
                <button
                  type="button"
                  onClick={() => {
                    setDepositModalType('SHARES');
                    setDepositSuccessResult(null);
                  }}
                  className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 bg-slate-50/70 transition-all text-center group"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-tight">
                    Purchase Share
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">Capital Build-Up</span>
                </button>

                {/* Apply for Loan */}
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 bg-slate-50/70 transition-all text-center group"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">
                    Apply for Loan
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">Diminishing Rate</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DIGITAL PASSBOOK & MEMBER SUBSIDIARY LEDGER (OPTION 4) */}
        {activeTab === 'passbook' && (
          <div className="space-y-6">
            {/* CDA Certified Digital Passbook Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 border-b border-slate-700/60 pb-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Certified CDA Digital Passbook</span>
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>PhilSys KYC Verified</span>
                    </span>
                    <span className="text-slate-400 text-xs font-mono">
                      CDA Reg: CDA-NCR-2024-00921 • TIN: 004-912-340-000
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {currentMember.name}&apos;s Official Subsidiary Ledger
                  </h1>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Compliant with CDA Standard Chart of Accounts (MC 2015-06) and Republic Act No. 9520. All share capital, savings liabilities, and loan amortizations are verified against the cooperative general ledger.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowPassbookStatementModal(true)}
                    className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-100 rounded-xl font-bold text-xs border border-slate-600 shadow-sm flex items-center gap-1.5 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Official Statement (SOA)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (passbookSubTab === 'loan') {
                        setPassbookPayModal({
                          open: true,
                          type: 'LOAN',
                          amount: 4442.44,
                          description: 'Monthly Loan Amortization Installment #2',
                        });
                      } else if (passbookSubTab === 'savings') {
                        setPassbookPayModal({
                          open: true,
                          type: 'SAVINGS',
                          amount: 1000,
                          description: 'Voluntary Savings Deposit',
                        });
                      } else {
                        setPassbookPayModal({
                          open: true,
                          type: 'SHARES',
                          amount: 1000,
                          description: 'Capital Build-Up (10 Shares @ ₱100 Par)',
                        });
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-950/20 flex items-center gap-1.5 transition"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Pay via QR Ph Rail</span>
                  </button>
                </div>
              </div>

              {/* Passbook Identification Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Passbook Number:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {currentMember.memberNumber ? `PB-${(currentMember.memberNumber || '').replace(/\D/g, '') || '0001'}` : 'PB-2026-0001'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Member ID:</span>
                  <span className="font-mono font-bold text-emerald-300 text-sm">{currentMember.memberNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Membership Class:</span>
                  <span className="font-semibold text-white">Regular (Good Standing)</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registered PSGC Address:</span>
                  <span className="font-semibold text-white truncate block">Region III • San Jose, Nueva Ecija</span>
                </div>
              </div>
            </div>

            {/* 3 Subsidiary Ledger Balances Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Share Capital SL (3-01-03) */}
              <div
                onClick={() => setPassbookSubTab('shares')}
                className={`p-6 rounded-2xl border transition cursor-pointer ${
                  passbookSubTab === 'shares'
                    ? 'bg-amber-50/50 border-amber-400 shadow-md ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Paid-Up Share Capital</span>
                  <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    GL 3-01-03
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-slate-900 mt-2">
                  ₱{paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>{sharesCount} shares @ ₱100.00 par</span>
                  <span className="text-amber-800 font-bold">Dividend Eligible</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-900 font-semibold">
                  <span>Click to view ledger</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Savings Passbook (2-01-01) */}
              <div
                onClick={() => setPassbookSubTab('savings')}
                className={`p-6 rounded-2xl border transition cursor-pointer ${
                  passbookSubTab === 'savings'
                    ? 'bg-emerald-50/50 border-emerald-400 shadow-md ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Savings Deposits Passbook</span>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                    GL 2-01-01
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-slate-900 mt-2">
                  ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>Compulsory + Voluntary</span>
                  <span className="text-emerald-700 font-bold">3.0% p.a. Interest</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                  <span>Click to view passbook</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card 3: Loans Receivable (1-02-01) */}
              <div
                onClick={() => setPassbookSubTab('loan')}
                className={`p-6 rounded-2xl border transition cursor-pointer ${
                  passbookSubTab === 'loan'
                    ? 'bg-indigo-50/50 border-indigo-400 shadow-md ring-2 ring-indigo-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Outstanding Loan Balance</span>
                  <span className="font-mono text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                    GL 1-02-01
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-slate-900 mt-2">
                  ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>{loanBalance > 0 ? 'LN-2026-00001 (Regular Loan)' : 'No Active Borrowings'}</span>
                  <span className={loanBalance > 0 ? 'text-indigo-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {loanBalance > 0 ? 'Installment Active' : 'Clean Credit'}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-900 font-semibold">
                  <span>Click to view amortization</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Sub-Ledger Detailed Statements Panel */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Sub-ledger Tabs Navigation */}
              <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setPassbookSubTab('shares')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      passbookSubTab === 'shares'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Share Capital Ledger (3-01-03)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassbookSubTab('savings')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      passbookSubTab === 'savings'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <PiggyBank className="w-3.5 h-3.5" />
                    <span>Savings Passbook (2-01-01)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassbookSubTab('loan')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      passbookSubTab === 'loan'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Loan Amortization & SL (1-02-01)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (passbookSubTab === 'loan') {
                        setPassbookPayModal({
                          open: true,
                          type: 'LOAN',
                          amount: 4442.44,
                          description: 'Monthly Loan Amortization Installment #2',
                        });
                      } else if (passbookSubTab === 'savings') {
                        setPassbookPayModal({
                          open: true,
                          type: 'SAVINGS',
                          amount: 1000,
                          description: 'Voluntary Savings Deposit',
                        });
                      } else {
                        setPassbookPayModal({
                          open: true,
                          type: 'SHARES',
                          amount: 1000,
                          description: 'Capital Build-Up (10 Shares @ ₱100 Par)',
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {passbookSubTab === 'shares'
                        ? 'Purchase Shares (+QR Ph)'
                        : passbookSubTab === 'savings'
                        ? 'Deposit Savings (+QR Ph)'
                        : 'Pay Installment (+QR Ph)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* SUB-LEDGER 1: SHARE CAPITAL (3-01-03) */}
              {passbookSubTab === 'shares' && (
                <div className="p-6 space-y-6">
                  {/* Share Capital Target & Subscription Summary */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div>
                      <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
                        <span>Paid-Up Common Stock Subscription</span>
                        <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono">
                          ₱100.00 Par Value
                        </span>
                      </div>
                      <p className="text-amber-800 mt-1">
                        Subscribed Shares: <strong>{(sharesCount + 50)} shares (₱{((sharesCount + 50) * 100).toLocaleString()}.00)</strong> • Paid-Up: <strong>{sharesCount} shares (₱{paidUpCapital.toLocaleString()}.00)</strong>
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] font-bold text-amber-900 uppercase">Paid-Up Ratio</div>
                      <div className="text-xl font-black text-amber-900 font-mono">
                        {Math.round((paidUpCapital / ((sharesCount + 50) * 100)) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Share Capital Ledger Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Posting Date</th>
                          <th className="p-3.5">OR / Ref No.</th>
                          <th className="p-3.5">Transaction Particulars</th>
                          <th className="p-3.5 text-center">Shares</th>
                          <th className="p-3.5 text-right">Debit (DR)</th>
                          <th className="p-3.5 text-right">Credit (CR)</th>
                          <th className="p-3.5 text-right">Running Paid-Up Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {activeShareLedger.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-sans text-xs">
                              No share capital transactions recorded yet. Initial transactions will appear once paid-up capital contribution is confirmed.
                            </td>
                          </tr>
                        ) : (
                          activeShareLedger.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-amber-50/20 transition">
                              <td className="p-3.5 text-slate-500 font-sans">{tx.date}</td>
                              <td className="p-3.5 font-bold text-slate-900">{tx.ref}</td>
                              <td className="p-3.5 font-sans font-medium text-slate-800">{tx.particulars}</td>
                              <td className="p-3.5 text-center font-bold text-amber-800">+{tx.shares}</td>
                              <td className="p-3.5 text-right text-slate-400">₱{tx.debit.toFixed(2)}</td>
                              <td className="p-3.5 text-right font-bold text-emerald-700">
                                ₱{tx.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3.5 text-right font-black text-slate-900">
                                ₱{tx.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                    <div>
                      💡 <strong>Statutory Note (RA 9520 Art. 86):</strong> Interest on Share Capital (ISC) is calculated based on the monthly average paid-up share capital balance and is 100% exempt from Philippine withholding tax.
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-LEDGER 2: SAVINGS PASSBOOK (2-01-01) */}
              {passbookSubTab === 'savings' && (
                <div className="p-6 space-y-6">
                  {/* Savings Account Summary */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div>
                      <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                        <span>Deposit Liabilities Account (2-01-01)</span>
                        <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded font-mono">
                          Active & Earning
                        </span>
                      </div>
                      <p className="text-emerald-800 mt-1">
                        Annual Yield: <strong>3.0% per annum</strong> compounded quarterly • Acts as <strong>3x Loan Leverage</strong>
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] font-bold text-emerald-900 uppercase">Available Withdrawable</div>
                      <div className="text-xl font-black text-emerald-900 font-mono">
                        ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Savings Passbook Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Posting Date</th>
                          <th className="p-3.5">OR / Ref No.</th>
                          <th className="p-3.5">Transaction Particulars</th>
                          <th className="p-3.5 text-right">Debit (Withdrawal)</th>
                          <th className="p-3.5 text-right">Credit (Deposit)</th>
                          <th className="p-3.5 text-right">Running Savings Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {activeSavingsLedger.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
                              No savings deposit transactions recorded yet. Deposits made via Cashier or QR Ph will appear here automatically.
                            </td>
                          </tr>
                        ) : (
                          activeSavingsLedger.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-emerald-50/20 transition">
                              <td className="p-3.5 text-slate-500 font-sans">{tx.date}</td>
                              <td className="p-3.5 font-bold text-slate-900">{tx.ref}</td>
                              <td className="p-3.5 font-sans font-medium text-slate-800">{tx.particulars}</td>
                              <td className="p-3.5 text-right text-slate-400">₱{tx.debit.toFixed(2)}</td>
                              <td className="p-3.5 text-right font-bold text-emerald-700">
                                ₱{tx.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3.5 text-right font-black text-slate-900">
                                ₱{tx.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    💡 <strong>Cooperative Security:</strong> Savings deposits can be directly top-up via PayMongo QR Ph (InstaPay/GCash/Maya) with instant credit and official electronic receipt.
                  </div>
                </div>
              )}

              {/* SUB-LEDGER 3: LOANS RECEIVABLE & AMORTIZATION (1-02-01) */}
              {passbookSubTab === 'loan' && (
                <div className="p-6 space-y-6">
                  {isTestTenant && currentPersona === 'maria' && loanBalance > 0 ? (
                    <>
                      {/* Active Loan Details Card */}
                      <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-indigo-200 text-indigo-950 font-bold px-2 py-0.5 rounded text-[11px]">
                              LN-2026-00001
                            </span>
                            <strong className="text-sm text-slate-900">Regular Member Loan (12 Mos @ 12.0% p.a.)</strong>
                          </div>
                          <p className="text-slate-600 mt-1">
                            Disbursed: Jan 20, 2026 • Maturity: Jan 20, 2027 • Diminishing Balance Equal Monthly Installment
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Monthly Installment</div>
                            <div className="text-base font-black text-indigo-900 font-mono">₱4,442.44</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Remaining Principal</div>
                            <div className="text-base font-black text-indigo-900 font-mono">
                              ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Loan Subsidiary Ledger Transactions Table */}
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                          Subsidiary Ledger Activity (1-02-01)
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3.5">Posting Date</th>
                                <th className="p-3.5">Ref No.</th>
                                <th className="p-3.5">Particulars</th>
                                <th className="p-3.5 text-right">Debit (Disbursement)</th>
                                <th className="p-3.5 text-right">Credit (Principal Repaid)</th>
                                <th className="p-3.5 text-right">Principal Outstanding Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                              {mariaLoanLedger.map((tx, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/20 transition">
                                  <td className="p-3.5 text-slate-500 font-sans">{tx.date}</td>
                                  <td className="p-3.5 font-bold text-slate-900">{tx.ref}</td>
                                  <td className="p-3.5 font-sans font-medium text-slate-800">{tx.particulars}</td>
                                  <td className="p-3.5 text-right font-bold text-rose-700">
                                    {tx.debit > 0 ? `₱${tx.debit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00'}
                                  </td>
                                  <td className="p-3.5 text-right font-bold text-emerald-700">
                                    {tx.credit > 0 ? `₱${tx.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00'}
                                  </td>
                                  <td className="p-3.5 text-right font-black text-slate-900">
                                    ₱{tx.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Complete 12-Month Amortization Schedule Table */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Full Diminishing Balance Amortization Schedule
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium">12.0% Annual Rate (1.0% / month)</span>
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-80 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                              <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Due Date</th>
                                <th className="p-3 text-right">Principal</th>
                                <th className="p-3 text-right">Interest (1%)</th>
                                <th className="p-3 text-right">Total Installment</th>
                                <th className="p-3 text-right">Ending Principal</th>
                                <th className="p-3 text-center">Payment Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                              {[
                                { seq: 1, due: '2026-02-20', pr: 3942.44, in: 500.0, tot: 4442.44, bal: 46057.56, status: 'PAID' },
                                { seq: 2, due: '2026-03-20', pr: 3981.86, in: 460.58, tot: 4442.44, bal: 42075.7, status: loanBalance < 46000 ? 'PAID' : 'DUE_NOW' },
                                { seq: 3, due: '2026-04-20', pr: 4021.68, in: 420.76, tot: 4442.44, bal: 38054.02, status: 'UPCOMING' },
                                { seq: 4, due: '2026-05-20', pr: 4061.9, in: 380.54, tot: 4442.44, bal: 33992.12, status: 'UPCOMING' },
                                { seq: 5, due: '2026-06-20', pr: 4102.52, in: 339.92, tot: 4442.44, bal: 29889.6, status: 'UPCOMING' },
                                { seq: 6, due: '2026-07-20', pr: 4143.55, in: 298.9, tot: 4442.44, bal: 25746.05, status: 'UPCOMING' },
                                { seq: 7, due: '2026-08-20', pr: 4184.99, in: 257.46, tot: 4442.44, bal: 21561.06, status: 'UPCOMING' },
                                { seq: 8, due: '2026-09-20', pr: 4226.84, in: 215.61, tot: 4442.44, bal: 17334.22, status: 'UPCOMING' },
                                { seq: 9, due: '2026-10-20', pr: 4269.11, in: 173.34, tot: 4442.44, bal: 13065.11, status: 'UPCOMING' },
                                { seq: 10, due: '2026-11-20', pr: 4311.8, in: 130.65, tot: 4442.44, bal: 8753.31, status: 'UPCOMING' },
                                { seq: 11, due: '2026-12-20', pr: 4354.92, in: 87.53, tot: 4442.44, bal: 4398.39, status: 'UPCOMING' },
                                { seq: 12, due: '2027-01-20', pr: 4398.39, in: 43.98, tot: 4442.37, bal: 0.0, status: 'UPCOMING' },
                              ].map((row) => (
                                <tr key={row.seq} className={row.status === 'DUE_NOW' ? 'bg-amber-50/50 font-bold' : ''}>
                                  <td className="p-3 text-slate-500 font-sans">{row.seq}</td>
                                  <td className="p-3 font-sans font-medium text-slate-900">{row.due}</td>
                                  <td className="p-3 text-right">₱{row.pr.toFixed(2)}</td>
                                  <td className="p-3 text-right text-amber-700">₱{row.in.toFixed(2)}</td>
                                  <td className="p-3 text-right font-black text-slate-900">₱{row.tot.toFixed(2)}</td>
                                  <td className="p-3 text-right text-slate-600">₱{row.bal.toFixed(2)}</td>
                                  <td className="p-3 text-center">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        row.status === 'PAID'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : row.status === 'DUE_NOW'
                                          ? 'bg-amber-200 text-amber-950 animate-pulse'
                                          : 'bg-slate-100 text-slate-500'
                                      }`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Zero Active Borrowings */
                    <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
                      <h3 className="font-bold text-base text-slate-800">Zero Active Borrowings</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        {currentMember.name} ({currentMember.memberNumber}) has clean credit standing with no outstanding loan obligations. Member is eligible to co-make or apply for up to 3x their share capital.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('apply')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
                        >
                          Apply for New Loan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: APPLY FOR LOAN */}
        {activeTab === 'apply' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Digital Loan Application & Amortization Calculator</h2>
              <p className="text-xs text-slate-500">Transparent pass-through loan processing fee deduction and net member disbursement preview.</p>
            </div>

            {applicationSubmitted ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Application Awaiting Co-Maker Endorsement</h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your application for <strong>₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> has been created with status:{' '}
                  <span className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                    PENDING_CO_MAKER_ACCEPTANCE
                  </span>.
                  <br /><br />
                  Co-maker <strong>{coMaker || `Member (${coMakerMemberIdInput})`}</strong> must log into their own account and accept the Joint & Solidary Liability Undertaking before this application can be pushed to the Loan Officer review pipeline.
                </p>

                {submittedSettlementRecord && (
                  <div className="max-w-md mx-auto bg-white p-4 rounded-xl border border-emerald-300 text-left space-y-2 text-xs shadow-2xs">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Landmark className="w-4 h-4 text-emerald-700" />
                      Disbursement Settlement Details
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-semibold text-slate-800">
                        {submittedSettlementRecord.channel === 'BANK_TRANSFER'
                          ? 'Bank Transfer (InstaPay / PESONet)'
                          : submittedSettlementRecord.channel === 'E_WALLET'
                          ? 'E-Wallet (GCash / Maya)'
                          : 'Cash Counter Pick-Up (OTC)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Institution / Bank:</span>
                      <span className="font-semibold text-slate-900">{submittedSettlementRecord.institutionName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account / Mobile Number:</span>
                      <span className="font-mono font-bold text-emerald-800">{submittedSettlementRecord.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account Name:</span>
                      <span className="font-semibold text-slate-900">{submittedSettlementRecord.accountName}</span>
                    </div>
                  </div>
                )}
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="bg-white text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-slate-50"
                  >
                    View RA 3765 Disclosure Statement
                  </button>
                  <button
                    onClick={() => {
                      setApplicationSubmitted(false);
                      setActiveTab('home');
                    }}
                    className="bg-white text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-slate-50"
                  >
                    Back to Portfolio
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Controls */}
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">1. Select Loan Product / Offer</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {activeLoanProducts.length === 0 ? (
                        <div className="col-span-2 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                          No active loan products are currently available for new applications. Please contact the cooperative office.
                        </div>
                      ) : (
                        activeLoanProducts.map((p) => {
                          const isSelected = selectedProductId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                if (loanAmount > p.maxAmount) setLoanAmount(p.maxAmount);
                                if (loanAmount < p.minAmount) setLoanAmount(p.minAmount);
                                if (loanTerm > p.maxTermMonths) setLoanTerm(p.maxTermMonths);
                              }}
                              className={`p-3 rounded-xl border text-left transition-colors relative ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold">{p.name}</span>
                                <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                                  {p.code}
                                </span>
                              </div>
                              <div className="text-[11px] font-normal text-slate-500 mt-1">
                                {(p.annualInterestRate * 100).toFixed(1)}% p.a. • Up to {p.maxTermMonths} mos
                              </div>
                              <div className="text-[10px] text-emerald-700 font-medium mt-1">
                                ₱{p.minAmount.toLocaleString()} - ₱{p.maxAmount.toLocaleString()}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">2. Desired Loan Principal</label>
                      <span className="text-sm font-black text-emerald-700">₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <input
                      type="range"
                      min={minPrincipal}
                      max={maxPrincipal}
                      step={5000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>₱{minPrincipal.toLocaleString()}.00</span>
                      <span>Max ₱{maxPrincipal.toLocaleString()}.00</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">3. Repayment Term</label>
                    <div className="flex gap-2">
                      {[3, 6, 12, 18, 24, 36].filter((t) => t >= (selectedProduct.minTermMonths || 1) && t <= (selectedProduct.maxTermMonths || 36)).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setLoanTerm(t)}
                          className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-colors ${
                            loanTerm === t
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {t} Months
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Disbursement & Settlement Details */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-800" />
                      <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        4. Disbursement & Settlement Details
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Specify the payout account where your approved loan proceeds will be directly credited.
                    </p>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Settlement Channel</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'BANK_TRANSFER', label: 'Bank Transfer', sub: 'InstaPay / PESONet' },
                          { id: 'E_WALLET', label: 'E-Wallet', sub: 'GCash / Maya' },
                          { id: 'CASH_COUNTER', label: 'Cash Counter', sub: 'Branch OTC' },
                        ].map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => {
                              setSettlementChannel(ch.id as any);
                              if (ch.id === 'BANK_TRANSFER' && !settlementInstitution) {
                                setSettlementInstitution('Land Bank of the Philippines');
                              } else if (ch.id === 'E_WALLET') {
                                setSettlementInstitution('GCash');
                              } else if (ch.id === 'CASH_COUNTER') {
                                setSettlementInstitution('Cooperative Branch Cashier Counter');
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              settlementChannel === ch.id
                                ? 'border-emerald-600 bg-white font-bold text-emerald-950 shadow-xs'
                                : 'border-emerald-200 bg-emerald-50/40 text-emerald-800 hover:bg-white'
                            }`}
                          >
                            <div className="text-xs">{ch.label}</div>
                            <div className="text-[10px] text-emerald-700 font-normal">{ch.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {settlementChannel !== 'CASH_COUNTER' ? (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1">
                            {settlementChannel === 'BANK_TRANSFER' ? 'Bank / Institution Name' : 'E-Wallet Provider'}
                          </label>
                          {settlementChannel === 'BANK_TRANSFER' ? (
                            <select
                              value={settlementInstitution}
                              onChange={(e) => setSettlementInstitution(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="Land Bank of the Philippines">Land Bank of the Philippines</option>
                              <option value="BDO Unibank">BDO Unibank</option>
                              <option value="Bank of the Philippine Islands (BPI)">Bank of the Philippine Islands (BPI)</option>
                              <option value="Metrobank">Metrobank</option>
                              <option value="UnionBank of the Philippines">UnionBank of the Philippines</option>
                              <option value="Security Bank">Security Bank</option>
                              <option value="RCBC">RCBC</option>
                              <option value="Philippine National Bank (PNB)">Philippine National Bank (PNB)</option>
                              <option value="Other Commercial / Rural Bank">Other Commercial / Rural Bank</option>
                            </select>
                          ) : (
                            <select
                              value={settlementInstitution}
                              onChange={(e) => setSettlementInstitution(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="GCash">GCash</option>
                              <option value="Maya (PayMaya)">Maya (PayMaya)</option>
                              <option value="GrabPay Philippines">GrabPay Philippines</option>
                            </select>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-semibold text-slate-700 text-xs mb-1">
                              {settlementChannel === 'BANK_TRANSFER' ? 'Bank Account Number' : 'E-Wallet Mobile Number'}
                            </label>
                            <input
                              type="text"
                              required
                              value={settlementAccountNumber}
                              onChange={(e) => setSettlementAccountNumber(e.target.value)}
                              placeholder={settlementChannel === 'BANK_TRANSFER' ? 'e.g. 1092837465' : 'e.g. 09171234567'}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 text-xs mb-1">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              required
                              value={settlementAccountName}
                              onChange={(e) => setSettlementAccountName(e.target.value)}
                              placeholder="Name on account"
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-emerald-200 rounded-lg text-slate-700 text-xs leading-relaxed">
                        <strong>Cash Counter Pick-Up:</strong> Loan disbursement voucher will be issued for in-person cash collection at the cooperative branch cashier. Valid government ID and signature required.
                      </div>
                    )}
                  </div>

                  {requiresCoMaker && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-700 block">5. Designated Co-Maker Member ID</label>
                        <span className="text-[11px] text-amber-700 font-semibold">Mandatory Joint Solidary Rule</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. MEM-2026-0002"
                        value={coMakerMemberIdInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoMakerMemberIdInput(val);
                          if (val.trim().toUpperCase() === currentMember.memberNumber.toUpperCase()) {
                            setCoMakerError('❌ You cannot designate yourself as your own co-maker. Please key in another member ID.');
                          } else {
                            setCoMakerError('');
                          }
                        }}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none ${
                          coMakerError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        }`}
                      />
                      {coMakerError ? (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{coMakerError}</p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Key in the Co-Maker&apos;s Member ID (e.g. <strong>MEM-2026-0002</strong>). The co-maker must accept on their own account before your loan proceeds to underwriting.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="accent-emerald-600 mt-0.5"
                      />
                      <span>
                        I certify that I have read the Truth in Lending Act (RA 3765) disclosure terms and promise to pay the principal and interest when due.
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={!agreedToTerms || Boolean(coMakerError)}
                    onClick={() => {
                      if (requiresCoMaker) {
                        if (!coMakerMemberIdInput.trim()) {
                          setCoMakerError('Co-maker Member ID is required.');
                          return;
                        }
                        if (coMakerMemberIdInput.trim().toUpperCase() === currentMember.memberNumber.toUpperCase()) {
                          setCoMakerError('You cannot designate yourself as your own co-maker.');
                          return;
                        }
                      }
                      setSubmittedSettlementRecord({
                        channel: settlementChannel,
                        institutionName: settlementChannel === 'CASH_COUNTER' ? 'Cooperative Branch Cashier Counter' : settlementInstitution,
                        accountNumber: settlementChannel === 'CASH_COUNTER' ? 'OTC-CASHIER-PICKUP' : settlementAccountNumber,
                        accountName: settlementAccountName || currentMember.name,
                      });
                      setApplicationSubmitted(true);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs py-3.5 rounded-xl shadow-sm transition-colors"
                  >
                    Submit Loan Application
                  </button>
                </div>

                {/* Calculation Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                      Transparent Upfront Deduction Breakdown
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Requested Principal Amount:</span>
                        <span className="font-bold text-slate-900">₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between text-emerald-800">
                        <span>SaaS Pass-Through Fee (2% / min ₱100):</span>
                        <span className="font-bold">- ₱{platformFee.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>Coop Filing & Service Fee:</span>
                        <span className="font-bold">- ₱{coopServiceFee.toFixed(2)}</span>
                      </div>

                      {advanceInterest > 0 && (
                        <div className="flex justify-between text-blue-800 font-semibold">
                          <span>
                            Advance Interest ({selectedProduct.advanceInterestOption === 'FIRST_YEAR' ? '1st Year' : 'Entire Loan'}):
                          </span>
                          <span className="font-bold">- ₱{advanceInterest.toFixed(2)}</span>
                        </div>
                      )}

                      {optionalFeesTotal > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Pass-Through Optional Fees:</span>
                          <span className="font-bold">- ₱{optionalFeesTotal.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-3 flex justify-between items-center bg-emerald-100/70 p-3 rounded-xl border border-emerald-200">
                        <div>
                          <div className="text-[11px] font-bold text-emerald-950 uppercase">Net Disbursed Proceeds</div>
                          <div className="text-xs text-emerald-800">Direct transfer to bank / wallet / cash</div>
                        </div>
                        <div className="text-xl font-black text-emerald-950">
                          ₱{netProceeds.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Monthly Amortization:</span>
                          <span className="font-bold text-slate-900">₱{monthlyInstallment.toFixed(2)} / month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Interest Charge:</span>
                          <span className="font-semibold text-slate-800">₱{totalInterest.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Effective Interest Rate (EIR):</span>
                          <span className="font-bold text-emerald-700">{eir.toFixed(2)}% p.a.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                    💡 <strong>CDA Compliance:</strong> Every deduction is accounted for under standard CDA account codes and issued an electronic official sales invoice with 12% Output VAT breakdown.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CO-MAKER ENDORSEMENTS */}
        {activeTab === 'comaker' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Co-Maker Endorsements & Solidary Guarantees</h2>
                <p className="text-xs text-slate-500">
                  Review and execute legally binding Joint and Solidary Liability Undertakings (RA 3765 & RA 9520) for fellow cooperative members.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-mono font-semibold">
                Viewing as: {currentMember.memberNumber}
              </span>
            </div>

            {endorsementSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{endorsementSuccessMsg}</span>
              </div>
            )}

            {/* List of Requests for Currently Logged-in Member */}
            {endorsementRequests.filter((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber).length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <Users className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-base text-slate-700">No Co-Maker Requests for {currentMember.name}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You currently have no pending endorsement requests designating your Member ID (<strong>{currentMember.memberNumber}</strong>).
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {endorsementRequests
                  .filter((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber)
                  .map((req) => (
                    <div
                      key={req.id}
                      className={`p-6 border rounded-2xl space-y-4 ${
                        req.status === 'ACCEPTED'
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : req.status === 'DECLINED'
                          ? 'border-rose-300 bg-rose-50/40'
                          : 'border-amber-300 bg-amber-50/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="text-[11px] font-mono text-slate-500">Application Reference: {req.loanNumber}</div>
                          <h3 className="text-base font-bold text-slate-900">
                            Principal Borrower: {req.borrowerName} ({req.borrowerMemberNumber})
                          </h3>
                          <div className="text-xs text-slate-600">
                            Loan Product: {req.productName} • Term: {req.termMonths} Months
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              req.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : req.status === 'DECLINED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {req.status === 'ACCEPTED'
                              ? '✓ ENDORSED & BOUND'
                              : req.status === 'DECLINED'
                              ? 'DECLINED'
                              : 'PENDING YOUR ACCEPTANCE'}
                          </span>
                        </div>
                      </div>

                      {/* Loan Amortization Figures */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <div className="text-slate-400 font-medium">Principal Amount</div>
                          <div className="text-sm font-black text-slate-900">
                            ₱{req.principalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Monthly Installment</div>
                          <div className="text-sm font-black text-emerald-700">
                            ₱{req.monthlyInstallment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Requested On</div>
                          <div className="font-semibold text-slate-700">{req.requestedAt}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Your Legal Undertaking</div>
                          <div className="font-semibold text-amber-800">Joint & Solidary Co-Maker</div>
                        </div>
                      </div>

                      {/* Legal Statutory Statement */}
                      <div className="p-4 bg-white border border-slate-300 rounded-xl text-xs space-y-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Statutory Undertaking (RA 3765 & Article 58, RA 9520)
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          &ldquo;I hereby unconditionally bind myself JOINTLY AND SOLIDARILY with the principal borrower for the prompt payment of all loan principal, interest, and penalties when due. In the event of default or non-payment, the cooperative is authorized to apply my share capital and savings deposits to the satisfaction of this debt without prior court proceeding.&rdquo;
                        </p>
                      </div>

                      {/* Decision Controls */}
                      {req.status === 'PENDING' ? (
                        <div className="pt-2 space-y-3">
                          <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={solidaryAgreed}
                              onChange={(e) => setSolidaryAgreed(e.target.checked)}
                              className="accent-emerald-600 mt-0.5"
                            />
                            <span>
                              I have read and voluntarily accept <strong>Joint & Solidary Liability</strong> for this loan application.
                            </span>
                          </label>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              disabled={!solidaryAgreed}
                              onClick={() => {
                                setEndorsementRequests((prev) =>
                                  prev.map((item) =>
                                    item.id === req.id
                                      ? { ...item, status: 'ACCEPTED', respondedAt: new Date().toLocaleTimeString() }
                                      : item
                                  )
                                );
                                setEndorsementSuccessMsg(
                                  `Co-maker endorsement executed successfully! Application ${req.loanNumber} has been advanced to the Loan Officer review pipeline.`
                                );
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Accept & Endorse (Push to Next Process)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEndorsementRequests((prev) =>
                                  prev.map((item) =>
                                    item.id === req.id
                                      ? { ...item, status: 'DECLINED', respondedAt: new Date().toLocaleTimeString() }
                                      : item
                                  )
                                );
                                setEndorsementSuccessMsg(
                                  `You declined co-maker endorsement for Application ${req.loanNumber}. The borrower will be notified.`
                                );
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
                            >
                              Decline Request
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-600 pt-1 flex items-center gap-1.5">
                          {req.status === 'ACCEPTED' ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Solidary Undertaking confirmed and registered on your account. Application pushed to Loan Officer.
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" /> Request was declined.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAY VIA PAYMONGO QR PH */}
        {activeTab === 'pay' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Loan Repayment & PayMongo QR Ph Terminal</h2>
              <p className="text-xs text-slate-500">Fast, secure payments via GCash, Maya, BDO, BPI, or over-the-counter branch teller.</p>
            </div>

            {paymentSuccess ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950">Repayment Confirmed!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Your payment of <strong>₱{repayAmount.toFixed(2)}</strong> has been processed and credited to your loan amortization ledger.
                </p>
                <div className="text-xs font-mono bg-white p-3 rounded-lg border border-emerald-200 max-w-sm mx-auto text-left space-y-1">
                  <div>Official Receipt: <strong>OR-2026-992182</strong></div>
                  <div>Principal Reduction: <strong>₱{(repayAmount - 500).toFixed(2)}</strong></div>
                  <div>Interest Income: <strong>₱500.00</strong></div>
                  <div>Remaining Loan Balance: <strong>₱{loanBalance.toFixed(2)}</strong></div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setActiveTab('home');
                    }}
                    className="bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-emerald-800"
                  >
                    Return to Portfolio
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Repayment Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Repayment Installment Amount (₱)</label>
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(Math.max(100, Number(e.target.value)))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRepayChannel('PAYMONGO_QRPH')}
                        className={`p-3.5 border rounded-xl text-left text-xs transition-colors ${
                          repayChannel === 'PAYMONGO_QRPH'
                            ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <QrCode className="w-4 h-4 text-emerald-600" /> PayMongo QR Ph
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">Pass-on convenience fee applies</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRepayChannel('IN_PERSON')}
                        className={`p-3.5 border rounded-xl text-left text-xs transition-colors ${
                          repayChannel === 'IN_PERSON'
                            ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-emerald-600" /> Branch Teller
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">₱0.00 convenience fee</div>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Loan Credit:</span>
                      <span className="font-bold text-slate-900">₱{repayAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-700">
                      <span>Pass-On Gateway Fee:</span>
                      <span className="font-bold">+ ₱{passOnFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                      <span>Total Amount to Pay:</span>
                      <span className="text-emerald-700">₱{totalCharge.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-colors"
                  >
                    Simulate Payment Settlement
                  </button>
                </div>

                {/* QR Ph Code Display */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center">
                  {repayChannel === 'PAYMONGO_QRPH' ? (
                    <>
                      <div className="w-52 h-52 bg-white border-2 border-emerald-600 rounded-2xl p-4 shadow-md flex flex-col items-center justify-center">
                        <div className="w-44 h-44 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-mono p-2 text-center">
                          [Official QR Ph Payload]
                          <br />
                          ₱{totalCharge.toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-4 font-bold text-slate-900 text-sm">PayMongo Dynamic QR Ph Code</div>
                      <div className="text-xs text-slate-500 max-w-xs mt-1">
                        Scan with GCash, Maya, BDO, BPI, UnionBank, or any InstaPay-enabled mobile app.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <div className="font-bold text-slate-900 text-sm">In-Person Counter Cashiering</div>
                      <div className="text-xs text-slate-500 max-w-xs mt-1">
                        Pay cash directly at any cooperative counter. Full ₱{repayAmount.toFixed(2)} goes to your loan with zero fees.
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRUTH IN LENDING & PROMISSORY NOTE */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Republic Act No. 3765 • Truth in Lending Disclosure</h2>
                <p className="text-xs text-slate-500">Statutory loan disclosure statement & legally binding promissory note.</p>
              </div>
              <button
                type="button"
                onClick={() => alert('Downloaded RA3765_Disclosure_LN-2026-00001.pdf to your device.')}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF Copy
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500">Document No: </span>
                  <span className="font-mono font-bold text-slate-900">DISC-LN-2026-00001</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                  VERIFIED & SIGNED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500">Creditor: </span>
                  <strong>{tenantInfo.name || 'Cooperative Enterprise'}</strong> (CDA Regulated)
                </div>
                <div>
                  <span className="text-slate-500">Borrower: </span>
                  <strong>{currentMember.name}</strong> ({currentMember.memberNumber})
                </div>
                <div>
                  <span className="text-slate-500">Gross Loan Principal: </span>
                  <strong>₱50,000.00</strong>
                </div>
                <div>
                  <span className="text-slate-500">Effective Interest Rate (EIR): </span>
                  <strong className="text-emerald-700">15.50% per annum</strong>
                </div>
                <div>
                  <span className="text-slate-500">SaaS Platform Processing Fee: </span>
                  <strong>₱1,000.00 (2.0%)</strong>
                </div>
                <div>
                  <span className="text-slate-500">Coop Service & Filing Fee: </span>
                  <strong>₱750.00 (1.5%)</strong>
                </div>
                <div className="col-span-2 p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-950 font-bold flex justify-between items-center">
                  <span>Net Disbursed Proceeds to Borrower:</span>
                  <span className="text-base font-black">₱48,250.00</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed">
                <div className="font-bold text-slate-900 uppercase mb-1">PROMISSORY NOTE & LOAN AGREEMENT SUMMARY</div>
                {`"FOR VALUE RECEIVED, I, ${currentMember.name.toUpperCase()}, promise to pay to the order of ${(tenantInfo.name || 'THE COOPERATIVE').toUpperCase()} the sum of PESOS FIFTY THOUSAND (PHP 50,000.00) in 12 equal monthly installments of PHP 4,442.44. In case of default, a 3% monthly surcharge applies. Solidary liability acknowledged pursuant to the Cooperative Bylaws."`}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE & PRIVACY */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Member Profile & NPC Data Privacy Compliance</h2>
              <p className="text-xs text-slate-500">Identity credentials protected with AES-256-GCM encryption pursuant to RA 10173.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{currentMember.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Membership Number:</span>
                  <span className="font-mono font-bold text-slate-900">{currentMember.memberNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified ID Type:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {currentMember.idType || 'PhilSys National ID (Encrypted SPI)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Encrypted ID Hash:</span>
                  <span className="font-mono text-slate-400">****-****-3456 (AES-256-GCM)</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  National Privacy Commission (NPC) Audit Record
                </div>
                <div className="text-emerald-800">
                  Consent Version: <strong>v2026.1</strong> • Logged IP: <strong>120.29.74.12</strong> • Timestamp: <strong>2026-01-20T09:05:00Z</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ANNUAL DIVIDENDS & PATRONAGE REFUND (ART. 86 RA 9520) */}
        {activeTab === 'surplus' && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            {!isTestTenant ? (
              <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <PieChart className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  No Allocated Dividends or Patronage Refund for Current Period
                </h2>
                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Net surplus distribution (Interest on Share Capital & Patronage Refund pursuant to RA 9520 Art. 86) is determined following the close of the cooperative fiscal year and formally ratified during the Annual General Assembly.
                </p>
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-mono">
                    <span>Fiscal Status: Operational (No Vouchers Issued)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Official Voucher Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-2xl shadow-sm">
                    F
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      Official Annual Dividend & Patronage Refund Statement
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pursuant to Article 86 of Republic Act No. 9520 (Philippine Cooperative Code) & CDA Guidelines
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 block w-fit ml-auto">
                    {currentPersona === 'maria' ? 'Voucher: CDA-SURP-2025-001' : 'Voucher: CDA-SURP-2025-002'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Fiscal Year Ended Dec 31, 2025</span>
                </div>
              </div>

              {/* Member Identification & Statutory Tranche */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Member Name:</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{currentMember.name}</strong>
                  <span className="text-slate-500 font-mono text-[11px]">{currentMember.memberNumber}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Capital Contribution:</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">
                    ₱{currentMember.paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-slate-500 text-[11px]">{currentMember.sharesCount} Common Shares @ ₱100 Par</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Statutory Tranche:</span>
                  <strong className="text-emerald-700 text-sm block mt-0.5">70.0% Distributable Pool</strong>
                  <span className="text-slate-500 text-[11px]">30% Statutory Reserves Cleared</span>
                </div>
              </div>

              {/* Calculation Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interest on Share Capital (ISC)</span>
                    <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">5.0% Return</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    ₱{currentPersona === 'maria' ? '750.00' : '500.00'}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pro-rata dividend yield earned on paid-up common stock equity.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patronage Refund (PR)</span>
                    <span className="bg-amber-50 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded">3.5% Refund</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    ₱{currentPersona === 'maria' ? '435.75' : '343.00'}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Refund based on ₱{currentPersona === 'maria' ? '12,450.00' : '9,800.00'} total loan interest & purchases.
                  </p>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Net Surplus Payout</span>
                    <span className="bg-emerald-200 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded">CREDITED</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    ₱{currentPersona === 'maria' ? '1,185.75' : '843.00'}
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Directly credited to Voluntary Savings Account (2-01-01) on Jan 15, 2026.
                  </p>
                </div>
              </div>

              {/* Statutory Disclosures */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Statutory Deductions Compliance (RA 9520 Art. 86)
                </div>
                <p className="text-[11px] leading-relaxed">
                  Before distributing the net surplus, the Cooperative deducted statutory reserves: General Reserve Fund (10%), Cooperative Education and Training Fund (10% - 5% Local, 5% Apex Federation), Community Development Fund (3%), and Optional Reserve Fund (7%). Pursuant to the Cooperative Code, these dividends are 100% tax-exempt.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => alert('Printing Official Dividend Statement...')}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Dividend Statement
                </button>
                <button
                  type="button"
                  onClick={() => alert('Downloading official tax-exempt voucher PDF...')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download Certificate (PDF)
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB: MY PLEDGED MORTGAGES & COLLATERALS */}
        {activeTab === 'collateral' && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-600" />
                    My Pledged Mortgages & Collateral Registry
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official registry of pledged Real Estate Mortgages (REM) and Chattel Mortgages securing your active cooperative credit lines.
                  </p>
                </div>

                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {isTestTenant ? '1 Pledged Asset Registered' : '0 Pledged Assets Registered'}
                </span>
              </div>

              {/* Pledged Asset Card */}
              {!isTestTenant ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Scale className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No Pledged Collateral Registered</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You currently have no encumbered real estate mortgages (REM) or chattel mortgages registered under your cooperative account.
                  </p>
                </div>
              ) : currentPersona === 'maria' ? (
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/70 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2.5 py-0.5 rounded border border-indigo-200 uppercase">
                        REAL ESTATE MORTGAGE
                      </span>
                      <strong className="text-base text-slate-900">
                        180 sqm Residential Lot & 2-Storey House in Fairview, Quezon City
                      </strong>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-700" /> ENCUMBERED TO COOP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transfer Certificate of Title</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">TCT-004-2019004812</strong>
                      <span className="text-[11px] text-slate-500">Quezon City Registry of Deeds</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appraised Fair Market Value</span>
                      <strong className="font-mono text-slate-900 text-sm block mt-0.5">₱1,800,000.00</strong>
                      <span className="text-[11px] text-emerald-700">70% Max Allowable: ₱1,260,000</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Active Loan</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">LN-2026-0001 (₱1,000,000)</strong>
                      <span className="text-[11px] text-emerald-700 font-bold">LTV: 55.6% (SAFE)</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registry of Deeds Entry</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">Entry # 2026-0049182</strong>
                      <span className="text-[11px] text-slate-500">Annotated Feb 15, 2026</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
                    <p className="text-[11px]">
                      Owner&apos;s Duplicate Certificate of Title is deposited in the cooperative fireproof vault. Upon full settlement of your loan balance, a Cancellation of Real Estate Mortgage will be executed.
                    </p>
                    <button
                      type="button"
                      onClick={() => alert('Discharge request noted. Discharge is available once the remaining balance is paid in full.')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition shrink-0"
                    >
                      Request Cancellation Notice
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/70 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded border border-amber-200 uppercase">
                        CHATTEL MORTGAGE
                      </span>
                      <strong className="text-base text-slate-900">
                        2023 Isuzu D-Max 3.0 4x4 Double Cab Utility Pickup
                      </strong>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-700" /> ENCUMBERED TO COOP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plate / MV File Number</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">NFP-8812</strong>
                      <span className="text-[11px] text-slate-500">CR No: 1301-0098231</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appraised Fair Market Value</span>
                      <strong className="font-mono text-slate-900 text-sm block mt-0.5">₱1,200,000.00</strong>
                      <span className="text-[11px] text-amber-800">60% Max Allowable: ₱720,000</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Active Loan</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">LN-2026-0002 (₱650,000)</strong>
                      <span className="text-[11px] text-emerald-700 font-bold">LTV: 54.2% (SAFE)</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LTO Encumbrance Annotation</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">Entry # CM-2026-0812</strong>
                      <span className="text-[11px] text-slate-500">Annotated Feb 18, 2026</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
                    <p className="text-[11px]">
                      Original Certificate of Registration (CR) annotated with Chattel Mortgage in favor of the Cooperative. Release of Chattel Mortgage will be executed upon loan payoff.
                    </p>
                    <button
                      type="button"
                      onClick={() => alert('Chattel release notice: Available after principal settlement.')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition shrink-0"
                    >
                      Request Release Slip
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MORE SERVICES & ACCOUNT (Mobile PWA Hub) */}
        {activeTab === 'more' && (
          <div className="space-y-6">
            {/* Cooperative Name & Identity Header (Moved from Header) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3.5">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
                  {tenantInfo.logoLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Republic of the Philippines • CDA Registered
                  </div>
                  <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                    {tenantInfo.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Member Online Banking &amp; Lending Portal • Reg # {tenantInfo.registrationNumber}
                  </p>
                </div>
              </div>

              {/* Active Logged-In Member Badge */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentMember.initials}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{currentMember.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{currentMember.memberNumber} • Regular Member</div>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  CDA Good Standing
                </span>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cooperative Services & Tools
                </h3>
                <span className="text-[11px] text-slate-400">All Modules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Apply for Loan */}
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Apply for Loan
                      </h4>
                      <p className="text-[11px] text-slate-500">Amortization calculator & net proceeds preview</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* Co-Maker Endorsements */}
                <button
                  type="button"
                  onClick={() => setActiveTab('comaker')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                      {endorsementRequests.some((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING') && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                          1
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                          Co-Maker Endorsements
                        </h4>
                        {endorsementRequests.some((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING') && (
                          <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                            Action Req.
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Review pending solidary undertakings (RA 9520)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                </button>

                {/* Annual Dividends & Patronage (Art. 86) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('surplus')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Dividends & Patronage (Art. 86)
                      </h4>
                      <p className="text-[11px] text-slate-500">Statutory net surplus distribution statement</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* My Pledged Mortgages & Collateral Registry */}
                <button
                  type="button"
                  onClick={() => setActiveTab('collateral')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                        My Pledged Mortgages
                      </h4>
                      <p className="text-[11px] text-slate-500">Registry of pledged REM and Chattel Mortgages</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                </button>

                {/* Pay via QR Ph Terminal */}
                <button
                  type="button"
                  onClick={() => setActiveTab('pay')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Pay via QR Ph
                      </h4>
                      <p className="text-[11px] text-slate-500">Instant repayment via GCash, Maya, or Bank Apps</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* Statutory Documents & Promissory Note */}
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Truth in Lending Documents
                      </h4>
                      <p className="text-[11px] text-slate-500">RA 3765 statutory disclosure & promissory note</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* eKYC & Privacy Profile */}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        eKYC & Privacy Profile
                      </h4>
                      <p className="text-[11px] text-slate-500">National ID encryption & NPC compliance record</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>
              </div>
            </div>

            {/* PWA Mobile App Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-emerald-950">Install Progressive Web App (PWA)</h4>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded">Fast & Offline</span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Add Flex Coop to your mobile home screen for instant biometric login and offline passbook access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallPwa}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-1.5 w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                {isInstallable ? 'Install to Home Screen' : 'Install App Guide'}
              </button>
            </div>

            {/* Account & Navigation Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account & Navigation Settings
              </h3>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/member/register"
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold text-center transition"
                >
                  + Apply for New Membership
                </Link>
                <Link
                  href="/"
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
                >
                  <span>Switch to Admin Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={handleMemberSignOut}
                  title="Sign out of Member Portal"
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SELF-SERVICE DEPOSIT & SHARE PURCHASE MODAL */}
        {depositModalType && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => {
                    setDepositModalType(null);
                    setDepositSuccessResult(null);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow">
                    F
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight leading-tight">
                      {depositModalType === 'SHARES' ? 'Purchase Cooperative Shares' : 'Deposit to Savings'}
                    </h3>
                    <div className="text-[11px] text-slate-300">
                      Cooperative Member Services • Member: <strong>{currentMember.name}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {!depositSuccessResult ? (
                <div className="p-6 space-y-5 text-xs">
                  {depositModalType === 'SHARES' ? (
                    /* Share Purchase Controls */
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <BookOpen className="w-4 h-4 text-amber-700" /> Capital Build-Up (Common Stock)
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                          Par value is fixed at <strong>₱100.00 / share</strong>. Purchasing shares increases your voting equity and annual dividend allocation under RA 9520.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Select Shares to Purchase:
                        </label>
                        <div className="flex gap-2 mb-2">
                          {[5, 10, 20, 50].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setDepositSharesCount(num)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                                depositSharesCount === num
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              +{num} shs
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={depositSharesCount}
                            onChange={(e) => setDepositSharesCount(Math.max(1, Number(e.target.value)))}
                            className="w-24 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                          <span className="text-slate-500">shares × ₱100.00 =</span>
                          <strong className="text-slate-900 font-mono text-sm">
                            ₱{(depositSharesCount * 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Savings Deposit Controls */
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <PiggyBank className="w-4 h-4 text-emerald-700" /> Member Voluntary Savings
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                          Earns <strong>3.0% interest per annum</strong> credited semi-annually. Acts as loan collateral leverage (up to 3x loan entitlement).
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Select Deposit Amount:
                        </label>
                        <div className="flex gap-2 mb-2">
                          {[500, 1000, 2000, 5000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setDepositSavingsAmount(amt)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                                depositSavingsAmount === amt
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              ₱{amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="100"
                            step="100"
                            value={depositSavingsAmount}
                            onChange={(e) => setDepositSavingsAmount(Math.max(100, Number(e.target.value)))}
                            className="w-32 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Channel Choice */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Fulfillment Method:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDepositChannel('PAYMONGO_QRPH')}
                        className={`p-3 border rounded-xl text-left transition ${
                          depositChannel === 'PAYMONGO_QRPH'
                            ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>Self-Service QR Ph</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          Instant credit via GCash, Maya, or any InstaPay bank app.
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDepositChannel('IN_PERSON_SLIP')}
                        className={`p-3 border rounded-xl text-left transition ${
                          depositChannel === 'IN_PERSON_SLIP'
                            ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Landmark className="w-4 h-4 text-emerald-600" />
                          <span>In-Person Teller</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          Generate deposit slip for cashier counter (₱0 fee).
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Summary & Execution */}
                  {(() => {
                    const principal = depositModalType === 'SHARES' ? depositSharesCount * 100 : depositSavingsAmount;
                    const passOn = depositChannel === 'PAYMONGO_QRPH' ? Math.round(principal * 0.015 * 100) / 100 : 0;
                    const total = principal + passOn;

                    return (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Net Deposit / Capital Credit:</span>
                          <strong className="text-slate-900 font-mono">₱{principal.toFixed(2)}</strong>
                        </div>
                        {depositChannel === 'PAYMONGO_QRPH' && (
                          <div className="flex justify-between text-amber-700">
                            <span>Gateway Convenience Fee (1.5%):</span>
                            <span className="font-mono font-semibold">+ ₱{passOn.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-bold">
                          <span>Total Amount to Pay:</span>
                          <span className="text-emerald-700 font-mono text-base">₱{total.toFixed(2)}</span>
                        </div>
                        {depositChannel === 'PAYMONGO_QRPH' && depositModalType === 'SHARES' && (
                          <div className="text-[10px] text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-200">
                            Share Capital paid via QR Ph is credited directly to the Cooperative&apos;s Platform Escrow account (`1-01-05`).
                          </div>
                        )}

                        {depositChannel === 'PAYMONGO_QRPH' ? (
                          <button
                            type="button"
                            onClick={() => {
                              const refNo = `QR-TX-${Date.now().toString(36).toUpperCase()}`;
                              if (depositModalType === 'SHARES') {
                                setPaidUpCapital((prev) => prev + principal);
                                setSharesCount((prev) => prev + depositSharesCount);
                              } else {
                                setSavingsBalance((prev) => prev + principal);
                              }
                              setDepositSuccessResult({
                                type: depositModalType === 'SHARES' ? 'Share Capital Purchase' : 'Savings Deposit',
                                amount: principal,
                                reference: refNo,
                                channel: 'PayMongo QR Ph (Instant Self-Service)',
                                sharesAdded: depositModalType === 'SHARES' ? depositSharesCount : undefined,
                              });
                            }}
                            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                          >
                            <QrCode className="w-4 h-4" />
                            <span>Simulate Instant QR Ph Settlement</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const refNo = `DEP-${depositModalType === 'SHARES' ? 'SHR' : 'SAV'}-${Math.floor(10000 + Math.random() * 90000)}`;
                              setDepositSuccessResult({
                                type: depositModalType === 'SHARES' ? 'Share Capital Purchase Slip' : 'Savings Deposit Slip',
                                amount: principal,
                                reference: refNo,
                                channel: 'In-Person Branch Teller Counter',
                                sharesAdded: depositModalType === 'SHARES' ? depositSharesCount : undefined,
                              });
                            }}
                            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Generate In-Person Counter Deposit Slip</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Success / Receipt Screen */
                <div className="p-6 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{depositSuccessResult.type}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {depositSuccessResult.channel.includes('Instant')
                        ? 'Transaction settled and credited to your account!'
                        : 'Deposit slip generated! Present at any coop cashier counter.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left font-mono text-xs space-y-2">
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-sans">Reference Number:</span>
                      <strong className="text-indigo-600">{depositSuccessResult.reference}</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-sans">Amount:</span>
                      <strong className="text-slate-900">
                        ₱{depositSuccessResult.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    {depositSuccessResult.sharesAdded && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-slate-500 font-sans">New Shares Issued:</span>
                        <strong className="text-amber-800">+{depositSuccessResult.sharesAdded} Common Shares</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Channel:</span>
                      <span className="text-emerald-700 font-sans font-semibold">{depositSuccessResult.channel}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => alert(`Printing transaction slip ${depositSuccessResult.reference}...`)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositModalType(null);
                        setDepositSuccessResult(null);
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: PASSBOOK DYNAMIC QR PH PAYMENT MODAL */}
        {passbookPayModal.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setPassbookPayModal({ open: false, type: 'LOAN', amount: 0, description: '' })}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow">
                    F
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight leading-tight">
                      PayMongo QR Ph Repayment & Deposit Terminal
                    </h3>
                    <div className="text-[11px] text-slate-300">
                      Cooperative Payment Terminal • Member: <strong>{currentMember.name}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5 text-xs">
                {/* Account Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Payment Destination:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPassbookPayModal((prev) => ({
                          ...prev,
                          type: 'LOAN',
                          amount: 4442.44,
                          description: 'Monthly Loan Amortization Installment #2',
                        }))
                      }
                      className={`p-3 rounded-xl border text-center transition ${
                        passbookPayModal.type === 'LOAN'
                          ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-950 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                      <span>Loan Repayment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPassbookPayModal((prev) => ({
                          ...prev,
                          type: 'SAVINGS',
                          amount: 1000,
                          description: 'Voluntary Member Savings Deposit',
                        }))
                      }
                      className={`p-3 rounded-xl border text-center transition ${
                        passbookPayModal.type === 'SAVINGS'
                          ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <PiggyBank className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      <span>Savings Deposit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPassbookPayModal((prev) => ({
                          ...prev,
                          type: 'SHARES',
                          amount: 1000,
                          description: 'Capital Build-Up (10 Shares @ ₱100 Par)',
                        }))
                      }
                      className={`p-3 rounded-xl border text-center transition ${
                        passbookPayModal.type === 'SHARES'
                          ? 'border-amber-600 bg-amber-50/80 font-bold text-amber-950 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                      <span>Share Capital</span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Amount to Credit (₱):
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={passbookPayModal.amount}
                    onChange={(e) =>
                      setPassbookPayModal((prev) => ({
                        ...prev,
                        amount: Math.max(100, Number(e.target.value)),
                      }))
                    }
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold font-mono text-base text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Dynamic Fee Calculation Breakdown */}
                {(() => {
                  const fee = calculateConvenienceFee(passbookPayModal.amount);
                  const total = Math.round((passbookPayModal.amount + fee) * 100) / 100;

                  return (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Net Account Credit:</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₱{passbookPayModal.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-amber-800">
                        <span className="flex items-center gap-1">
                          <span>Pass-On QR Ph Convenience Fee (1.5%):</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">Min ₱15</span>
                        </span>
                        <span className="font-mono font-bold">+ ₱{fee.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                        <span>Total to Scan & Pay:</span>
                        <span className="font-mono text-emerald-700 text-base">₱{total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* QR Graphic and Payload Simulation */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                  <div className="w-40 h-40 bg-white border-2 border-emerald-600 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center">
                    <div className="w-32 h-32 bg-slate-950 rounded-xl flex items-center justify-center text-white text-[10px] font-mono p-2 text-center">
                      [PayMongo QR Ph]
                      <br />
                      ₱{(passbookPayModal.amount + calculateConvenienceFee(passbookPayModal.amount)).toFixed(2)}
                      <br />
                      InstaPay / GCash
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Scan with GCash, Maya, BDO, BPI, UnionBank, or any InstaPay-enabled mobile banking app.
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleExecutePassbookPayment(passbookPayModal.type, passbookPayModal.amount)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Execute Instant PayMongo QR Ph Payment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: OFFICIAL CDA & BIR ELECTRONIC RECEIPT */}
        {passbookReceipt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Receipt Header */}
              <div className="bg-emerald-800 text-white p-6 text-center space-y-1">
                <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">
                  Republic of the Philippines • CDA Registered
                </div>
                <h3 className="font-black text-lg">Official Electronic Receipt</h3>
                <div className="text-xs text-emerald-100 font-mono">
                  Cooperative Electronic Receipt • Official Transaction
                </div>
              </div>

              {/* Receipt Content */}
              <div className="p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Official Receipt No:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{passbookReceipt.orNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date & Timestamp:</span>
                  <span className="font-medium text-slate-800 font-mono">{passbookReceipt.date} {passbookReceipt.time}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Member Name:</span>
                  <strong className="text-slate-900">{currentMember.name}</strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Member Number:</span>
                  <span className="font-mono text-slate-700">{currentMember.memberNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Credited CDA Account:</span>
                  <span className="font-mono text-indigo-700 font-bold">
                    {passbookReceipt.accountCode} ({passbookReceipt.accountName})
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Amount:</span>
                    <span>₱{passbookReceipt.baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800">
                    <span>Convenience Fee (1.5%):</span>
                    <span>₱{passbookReceipt.convenienceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-sm text-slate-900">
                    <span>Total Amount Paid:</span>
                    <span className="text-emerald-700">₱{passbookReceipt.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                  <div className="text-[11px] text-emerald-800 font-bold">New Account Running Balance:</div>
                  <div className="text-xl font-black font-mono text-emerald-950">
                    ₱{passbookReceipt.newBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                  This electronic receipt is issued pursuant to BIR Revenue Regulations and Cooperative Development Authority Memorandum Circular 2015-06. Retain for official record.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => alert(`Official Receipt ${passbookReceipt.orNumber} saved to PDF.`)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassbookReceipt(null)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: CERTIFIED CDA MEMBER STATEMENT OF ACCOUNT (SOA) */}
        {showPassbookStatementModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              {/* Statement Toolbar */}
              <div className="bg-slate-900 text-white p-4 px-6 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wider">Certified Member Statement of Account</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassbookStatementModal(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Certificate Sheet */}
              <div className="p-8 sm:p-10 space-y-6 text-slate-800 text-xs">
                {/* Official Letterhead */}
                <div className="text-center border-b border-slate-300 pb-6 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Republic of the Philippines • Cooperative Development Authority
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Cooperative Enterprise
                  </h2>
                  <div className="text-slate-600 text-xs font-medium">
                    CDA Registration: <strong>CDA-NCR-2024-00921</strong> • BIR TIN: <strong>004-912-340-000</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Main Office: 456 Katipunan Avenue, Loyola Heights, Quezon City, Metro Manila
                  </div>
                </div>

                {/* Document Title Banner */}
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    Official Member Subsidiary Ledger Statement of Account
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                    As of October 12, 2026 • Reference: SOA-2026-{currentMember.memberNumber.replace('MEM-', '')}
                  </div>
                </div>

                {/* Member Profile Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Member Name:</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{currentMember.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Member ID:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">{currentMember.memberNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Classification:</span>
                    <span className="font-semibold text-emerald-800 block mt-0.5">Regular Member (Good Standing)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">PhilSys KYC Status:</span>
                    <span className="font-semibold text-emerald-700 block mt-0.5">Verified Compliant</span>
                  </div>
                </div>

                {/* Financial Position Matrix */}
                <div className="border border-slate-300 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-3">CDA Account Classification</th>
                        <th className="p-3">Account Code</th>
                        <th className="p-3">Sub-Ledger Balance</th>
                        <th className="p-3">Statutory Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      <tr>
                        <td className="p-3 font-sans font-bold text-slate-900">Paid-Up Share Capital (Common)</td>
                        <td className="p-3 text-slate-600">3-01-03</td>
                        <td className="p-3 font-bold text-slate-900">
                          ₱{paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-sans text-emerald-700 font-bold">{sharesCount} Shares @ ₱100 Par (Dividend Active)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-bold text-slate-900">Deposit Liabilities (Savings)</td>
                        <td className="p-3 text-slate-600">2-01-01</td>
                        <td className="p-3 font-bold text-slate-900">
                          ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-sans text-emerald-700 font-bold">3.0% Annual Interest Compounded</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-sans font-bold text-slate-900">Loans Receivable (Regular)</td>
                        <td className="p-3 text-slate-600">1-02-01</td>
                        <td className="p-3 font-bold text-indigo-900">
                          ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-sans text-indigo-700 font-bold">
                          {loanBalance > 0 ? 'Installment Due: Mar 20, 2026' : 'No Active Obligations'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Certification Affirmation */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed">
                  I hereby certify that the foregoing balances are true and correct transcripts of the Subsidiary Ledgers of the Cooperative as maintained under the Standard Chart of Accounts prescribed by the Cooperative Development Authority.
                </div>

                {/* Signatories Block */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-300 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">{currentMember.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">Cooperative Member</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">{gmInfo.name || 'General Manager'}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">General Manager</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">Chief Accountant</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">Certified Public Accountant</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM NAVIGATION BAR (Mobile PWA) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl pt-2 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          {/* 1. Dashboard (My Portfolio) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'home'
                ? 'text-emerald-700 font-bold bg-emerald-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <LayoutDashboard className={`w-6 h-6 mb-1 ${activeTab === 'home' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
            <span className="text-[11px] leading-tight">Dashboard</span>
          </button>

          {/* 2. Passbook (Digital Passbook & SL) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('passbook');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'passbook'
                ? 'text-emerald-700 font-bold bg-emerald-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <BookOpen className={`w-6 h-6 mb-1 ${activeTab === 'passbook' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
            <span className="text-[11px] leading-tight">Passbook</span>
          </button>

          {/* 3. More (All Other Services & Settings) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('more');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab !== 'home' && activeTab !== 'passbook'
                ? 'text-emerald-700 font-bold bg-emerald-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Menu className={`w-6 h-6 mb-1 ${activeTab !== 'home' && activeTab !== 'passbook' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
              {endorsementRequests.some((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING') && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  1
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
