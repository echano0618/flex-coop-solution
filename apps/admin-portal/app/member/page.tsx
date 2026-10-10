'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

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
    serviceFeeRate: 0.015,
    finesRateMonthly: 0.03,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 active co-maker in good standing with min ₱5,000 paid-up share capital. Co-maker must key in Member ID and sign solidary undertaking.',
    requiresCollateral: false,
    isActive: true,
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
    serviceFeeRate: 0.005,
    finesRateMonthly: 0.02,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 co-maker who has completed PMES and has active cooperative savings.',
    requiresCollateral: false,
    isActive: true,
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
    serviceFeeRate: 0.01,
    finesRateMonthly: 0.02,
    requiresCoMaker: false,
    minCoMakers: 0,
    coMakerRuleDescription: 'Co-maker optional; borrower must submit certificate of school matriculation.',
    requiresCollateral: false,
    isActive: true,
  },
];

export default function MemberPortalPage() {
  // Member Persona Switcher (Maria = Borrower, Juan = Co-Maker)
  const [currentPersona, setCurrentPersona] = useState<'maria' | 'juan'>('maria');

  const currentMember = currentPersona === 'maria'
    ? {
        id: 'mem_1',
        memberNumber: 'MEM-2026-0001',
        name: 'Maria Clara Santos',
        initials: 'MS',
        type: 'Regular Member',
        paidUpCapital: 15000,
        sharesCount: 150,
        savingsBalance: 5000,
        idType: 'PhilSys National ID (Encrypted SPI)',
      }
    : {
        id: 'mem_2',
        memberNumber: 'MEM-2026-0002',
        name: 'Juan Perez Dela Cruz',
        initials: 'JD',
        type: 'Regular Member',
        paidUpCapital: 10000,
        sharesCount: 100,
        savingsBalance: 2000,
        idType: "Driver's License (Encrypted SPI)",
      };

  const [activeTab, setActiveTab] = useState<'home' | 'apply' | 'pay' | 'comaker' | 'documents' | 'profile' | 'surplus' | 'collateral'>('home');

  // Co-Maker Endorsement Requests State
  const [endorsementRequests, setEndorsementRequests] = useState([
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
  ]);

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
            setSelectedProductId(parsed[0].id);
          }
        } catch (e) {
          console.error('Failed to parse loan products:', e);
        }
      }
    }

    fetch('http://localhost:4000/api/v1/loan-products')
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
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  const selectedProduct = loanProducts.find((p) => p.id === selectedProductId) || loanProducts[0] || DEFAULT_LOAN_PRODUCTS[0];

  // Member Loan Application State
  const [loanAmount, setLoanAmount] = useState<number>(50000);
  const [loanTerm, setLoanTerm] = useState<number>(12);
  const [coMaker, setCoMaker] = useState<string>('Juan Perez Dela Cruz (MEM-2026-0002)');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
  const [applicationSubmitted, setApplicationSubmitted] = useState<boolean>(false);

  // Repayment State
  const [repayChannel, setRepayChannel] = useState<'PAYMONGO_QRPH' | 'IN_PERSON'>('PAYMONGO_QRPH');
  const [repayAmount, setRepayAmount] = useState<number>(4442.44);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // Active Loan State
  const [loanBalance, setLoanBalance] = useState<number>(50000.0);

  // Share Capital & Savings Balances State
  const [paidUpCapital, setPaidUpCapital] = useState<number>(15000);
  const [sharesCount, setSharesCount] = useState<number>(150);
  const [savingsBalance, setSavingsBalance] = useState<number>(5000);

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
  const netProceeds = loanAmount - platformFee - coopServiceFee;

  // Monthly annuity installment
  const monthlyRate = annualRate / 12.0;
  const factor = Math.pow(1.0 + monthlyRate, loanTerm);
  const monthlyInstallment = Math.round(((loanAmount * (monthlyRate * factor)) / (factor - 1.0)) * 100) / 100;
  const totalInterest = Math.round(((monthlyInstallment * loanTerm) - loanAmount) * 100) / 100;
  const eir = Math.round((((totalInterest + platformFee + coopServiceFee) / netProceeds) / (loanTerm / 12.0)) * 10000) / 100;

  // Pass-On Fee for QR Ph
  const passOnFee = repayChannel === 'PAYMONGO_QRPH' ? Math.max(15.0, Math.round(repayAmount * 0.015 * 100) / 100) : 0.0;
  const totalCharge = Math.round((repayAmount + passOnFee) * 100) / 100;

  const handleSimulatePayment = () => {
    setPaymentSuccess(true);
    setLoanBalance((prev) => Math.max(0, Math.round((prev - (repayAmount - 500)) * 100) / 100)); // principal reduction
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              F
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 leading-tight">
                Bayani Multi-Purpose Cooperative
              </div>
              <div className="text-xs text-slate-500">Member Online Banking & Lending Portal</div>
            </div>
          </div>

          {/* Switch to Admin View, Register, and Member Badge */}
          <div className="flex items-center space-x-3">
            <Link
              href="/member/register"
              className="hidden md:inline-flex text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-lg items-center gap-1 transition-colors"
            >
              <span>+ Apply New Member</span>
            </Link>

            <Link
              href="/"
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <span>Switch to Admin Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Persona Switcher Pill */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold px-2">Account:</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentPersona('maria');
                  setEndorsementSuccessMsg('');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  currentPersona === 'maria'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Maria Clara (Borrower)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentPersona('juan');
                  setEndorsementSuccessMsg('');
                }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all relative ${
                  currentPersona === 'juan'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Juan Dela Cruz (Co-Maker)
                {endorsementRequests.some((r) => r.designatedCoMakerMemberNumber === 'MEM-2026-0002' && r.status === 'PENDING') && (
                  <span className="ml-1.5 bg-amber-400 text-amber-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    1
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                {currentMember.initials}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">{currentMember.name}</div>
                <div className="text-[11px] text-slate-500">{currentMember.memberNumber} • Regular</div>
              </div>
              <Link
                href="/member/login"
                title="Sign out of Member Portal"
                className="ml-1 text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded bg-rose-50 border border-rose-200 transition-colors"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
          {[
            { id: 'home', label: 'My Portfolio', icon: Wallet, highlight: false },
            { id: 'apply', label: 'Apply for Loan', icon: CreditCard, highlight: false },
            {
              id: 'comaker',
              label: `Co-Maker Endorsements ${
                endorsementRequests.filter(
                  (r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING'
                ).length > 0
                  ? `(${
                      endorsementRequests.filter(
                        (r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING'
                      ).length
                    })`
                  : ''
              }`,
              icon: Users,
              highlight:
                endorsementRequests.filter(
                  (r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING'
                ).length > 0,
            },
            { id: 'surplus', label: 'Dividends & Patronage (Art. 86)', icon: PieChart, highlight: false },
            { id: 'collateral', label: 'My Pledged Mortgages', icon: Scale, highlight: false },
            { id: 'pay', label: 'Pay via QR Ph', icon: QrCode, highlight: false },
            { id: 'documents', label: 'Truth in Lending & Promissory Note', icon: FileText, highlight: false },
            { id: 'profile', label: 'eKYC & Privacy (NPC)', icon: ShieldCheck, highlight: false },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : tab.highlight
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-bold'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: MY PORTFOLIO */}
        {activeTab === 'home' && (
          <div className="space-y-6">
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
                      Maria Clara Santos designated your Member ID (MEM-2026-0002) as loan co-maker. Your joint solidary acceptance is required before her loan is reviewed.
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

            {/* Member Greeting & eKYC Verified Banner */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Member Account</span>
                  <span className="bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                    CDA Good Standing
                  </span>
                </div>
                <h1 className="text-2xl font-black">Welcome, {currentMember.name.split(' ')[0]}!</h1>
                <p className="text-xs text-emerald-100/90 mt-1">
                  Member Number: <strong className="text-white">{currentMember.memberNumber}</strong> • Verified Identity: <strong className="text-white">{currentMember.idType}</strong>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('apply')}
                  className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  + Apply for Loan
                </button>
                <button
                  onClick={() => setActiveTab('pay')}
                  className="bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-400/50 transition-colors"
                >
                  Pay via QR Ph
                </button>
              </div>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Active Loan Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Loan Balance</span>
                    <span className="bg-blue-50 text-blue-800 font-bold text-[11px] px-2 py-0.5 rounded">LN-2026-00001</span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">
                    ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Regular Member Loan (12% p.a.)</div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-xs mb-3">
                    <span className="text-slate-500">Next Monthly Installment:</span>
                    <span className="font-bold text-slate-800">₱4,442.44</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('pay')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Settle via PayMongo QR Ph
                  </button>
                </div>
              </div>

              {/* Share Capital Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Paid-Up Share Capital</span>
                    <span className="bg-amber-50 text-amber-800 font-bold text-[11px] px-2 py-0.5 rounded">CDA Equity</span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">
                    ₱{paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{sharesCount} Shares @ ₱100.00 par value</div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-3 text-slate-600">
                  <div className="flex justify-between">
                    <span>Subscribed Capital:</span>
                    <span className="font-semibold text-slate-800">₱{((sharesCount + 50) * 100).toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Dividend Eligibility:</span>
                    <span>100% Active</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDepositModalType('SHARES');
                      setDepositSuccessResult(null);
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Purchase New Shares
                  </button>
                </div>
              </div>

              {/* Compulsory & Voluntary Savings Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Savings Account</span>
                    <span className="bg-emerald-50 text-emerald-800 font-bold text-[11px] px-2 py-0.5 rounded">3.0% Interest</span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">
                    ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Deposit Liabilities account (2-01-01)</div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-3 text-slate-600">
                  <div className="flex justify-between">
                    <span>Account Status:</span>
                    <span className="font-semibold text-emerald-700">ACTIVE & EARNING</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Collateral Leverage:</span>
                    <span className="font-semibold text-slate-800">Qualified for 3x loan</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDepositModalType('SAVINGS');
                      setDepositSuccessResult(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Deposit to Savings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPLY FOR LOAN */}
        {activeTab === 'apply' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
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
                  Co-maker <strong>Juan Perez Dela Cruz ({coMakerMemberIdInput})</strong> must log into their own account and accept the Joint & Solidary Liability Undertaking before this application can be pushed to the Loan Officer review pipeline.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => {
                      setCurrentPersona('juan');
                      setActiveTab('comaker');
                      setApplicationSubmitted(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" /> Switch to Juan Dela Cruz (Endorse Now)
                  </button>
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
                      {loanProducts.map((p) => {
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
                      })}
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

                  {requiresCoMaker && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-700 block">4. Designated Co-Maker Member ID</label>
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
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
                {currentPersona === 'maria' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPersona('juan');
                        setEndorsementSuccessMsg('');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors"
                    >
                      Switch to Juan Dela Cruz (MEM-2026-0002) Account
                    </button>
                  </div>
                )}
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
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
                        Pay cash directly at any Bayani Coop counter. Full ₱{repayAmount.toFixed(2)} goes to your loan with zero fees.
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
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
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
                  <strong>Bayani Multi-Purpose Cooperative</strong> (CDA Reg: CDA-NCR-2024-00921)
                </div>
                <div>
                  <span className="text-slate-500">Borrower: </span>
                  <strong>Maria Clara Santos</strong> (MEM-2026-0001)
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
                "FOR VALUE RECEIVED, I, MARIA CLARA SANTOS, promise to pay to the order of BAYANI MULTI-PURPOSE COOPERATIVE the sum of PESOS FIFTY THOUSAND (PHP 50,000.00) in 12 equal monthly installments of PHP 4,442.44. In case of default, a 3% monthly surcharge applies. Solidary liability acknowledged pursuant to the Cooperative Bylaws."
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE & PRIVACY */}
        {activeTab === 'profile' && (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Member Profile & NPC Data Privacy Compliance</h2>
              <p className="text-xs text-slate-500">Identity credentials protected with AES-256-GCM encryption pursuant to RA 10173.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">Maria Clara Santos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Membership Number:</span>
                  <span className="font-mono font-bold text-slate-900">MEM-2026-0001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified ID Type:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PhilSys National ID (Encrypted SPI)
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
                  Before distributing the net surplus, Bayani Multi-Purpose Cooperative deducted statutory reserves: General Reserve Fund (10%), Cooperative Education and Training Fund (10% - 5% Local, 5% Apex Federation), Community Development Fund (3%), and Optional Reserve Fund (7%). Pursuant to the Cooperative Code, these dividends are 100% tax-exempt.
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
          </div>
        )}

        {/* TAB: MY PLEDGED MORTGAGES & COLLATERALS */}
        {activeTab === 'collateral' && (
          <div className="space-y-6">
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 1 Pledged Asset Registered
                </span>
              </div>

              {/* Pledged Asset Card */}
              {currentPersona === 'maria' ? (
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
                      Original Certificate of Registration (CR) annotated with Chattel Mortgage in favor of Bayani Cooperative. Release of Chattel Mortgage will be executed upon loan payoff.
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
                      Bayani Multi-Purpose Cooperative • Member: <strong>Maria Clara Santos</strong>
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
                    const passOn = depositChannel === 'PAYMONGO_QRPH' ? Math.max(15, Math.round(principal * 0.015 * 100) / 100) : 0;
                    const total = principal + passOn;

                    return (
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Net Deposit / Capital Credit:</span>
                          <strong className="text-slate-900 font-mono">₱{principal.toFixed(2)}</strong>
                        </div>
                        {depositChannel === 'PAYMONGO_QRPH' && (
                          <div className="flex justify-between text-amber-700">
                            <span>Pass-On Gateway Convenience Fee:</span>
                            <span className="font-mono font-semibold">+ ₱{passOn.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-bold">
                          <span>Total Amount to Pay:</span>
                          <span className="text-emerald-700 font-mono text-base">₱{total.toFixed(2)}</span>
                        </div>

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
      </div>
    </div>
  );
}
