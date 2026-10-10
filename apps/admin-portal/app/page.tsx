'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Calculator,
  QrCode,
  BookOpen,
  FileText,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Download,
  ChevronDown,
  ShieldAlert,
  Check,
  Lock,
  UserCheck,
} from 'lucide-react';

interface StaffAccount {
  id: string;
  role: 'GENERAL_MANAGER' | 'LOAN_OFFICER' | 'CREDIT_COMMITTEE' | 'BOD' | 'CASHIER' | 'ACCOUNTANT' | 'COMPLIANCE_OFFICER';
  roleTitle: string;
  name: string;
  initials: string;
  color: string;
  description: string;
  allowedTabs: Array<'overview' | 'members' | 'los' | 'calculator' | 'cashier' | 'accounting' | 'invoices' | 'reports'>;
}

const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'usr_gm_01',
    role: 'GENERAL_MANAGER',
    roleTitle: 'General Manager / Superadmin',
    name: 'Atty. Roberto Dela Rosa',
    initials: 'RD',
    color: 'bg-indigo-600',
    description: 'Full statutory administrative & override access across all cooperative modules.',
    allowedTabs: ['overview', 'members', 'los', 'calculator', 'cashier', 'accounting', 'invoices', 'reports'],
  },
  {
    id: 'usr_lo_01',
    role: 'LOAN_OFFICER',
    roleTitle: 'Senior Loan Officer',
    name: 'Grace Villanueva',
    initials: 'GV',
    color: 'bg-blue-600',
    description: 'Underwrites member applications, verifies credit & co-makers, calculates amortizations.',
    allowedTabs: ['overview', 'members', 'los', 'calculator'],
  },
  {
    id: 'usr_crecom_01',
    role: 'CREDIT_COMMITTEE',
    roleTitle: 'Credit Committee Chairperson',
    name: 'Engr. Manuel Reyes',
    initials: 'MR',
    color: 'bg-amber-600',
    description: 'Reviews loan appraisals, verifies collateral, endorses to Board.',
    allowedTabs: ['overview', 'los', 'calculator'],
  },
  {
    id: 'usr_bod_01',
    role: 'BOD',
    roleTitle: 'Board of Directors Chairman',
    name: 'Dr. Corazon Aquino-Cruz',
    initials: 'CA',
    color: 'bg-purple-600',
    description: 'Authorizes credit facilities requiring Board policy resolutions.',
    allowedTabs: ['overview', 'los', 'calculator', 'reports'],
  },
  {
    id: 'usr_cashier_01',
    role: 'CASHIER',
    roleTitle: 'Branch Head Cashier & Teller',
    name: 'Leah Mendoza',
    initials: 'LM',
    color: 'bg-emerald-600',
    description: 'Executes approved cash disbursements, processes over-the-counter payments & receipts.',
    allowedTabs: ['overview', 'los', 'cashier'],
  },
  {
    id: 'usr_acct_01',
    role: 'ACCOUNTANT',
    roleTitle: 'Chief Bookkeeper & Accountant',
    name: 'Felipe Santos, CPA',
    initials: 'FS',
    color: 'bg-teal-600',
    description: 'Manages CDA Standard Chart of Accounts, General Ledger, and BIR Tax Invoices.',
    allowedTabs: ['overview', 'accounting', 'invoices', 'reports', 'calculator'],
  },
  {
    id: 'usr_dpo_01',
    role: 'COMPLIANCE_OFFICER',
    roleTitle: 'Compliance Officer & DPO',
    name: 'Atty. Cristina Gomez',
    initials: 'CG',
    color: 'bg-rose-600',
    description: 'Audits NPC Data Privacy, AMLA covered transactions, and CDA/CIC statutory reports.',
    allowedTabs: ['overview', 'members', 'reports'],
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'los' | 'calculator' | 'cashier' | 'accounting' | 'invoices' | 'reports'>('overview');
  const [currentStaff, setCurrentStaff] = useState<StaffAccount>(STAFF_ACCOUNTS[0]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SYNCED'>('IDLE');

  const handleSyncFirestore = () => {
    setFirestoreSyncStatus('SYNCING');
    setTimeout(() => {
      setFirestoreSyncStatus('SYNCED');
      setTimeout(() => setFirestoreSyncStatus('IDLE'), 3500);
    }, 700);
  };

  // LOS Workflow Simulation State
  const [loanStatus, setLoanStatus] = useState<string>('SUBMITTED');
  const [showDisclosureModal, setShowDisclosureModal] = useState<boolean>(false);

  // Members Simulation State
  const [members, setMembers] = useState([
    {
      id: 'mem_1',
      memberNo: 'MEM-2026-0001',
      name: 'Maria Clara Santos',
      email: 'maria.santos@gmail.com',
      classification: 'REGULAR',
      kycStatus: 'VERIFIED',
      idType: 'PhilSys National ID (Encrypted SPI)',
      paidUpShares: 15000,
      npcConsent: 'Agreed (IP: 120.29.74.12)',
    },
    {
      id: 'mem_2',
      memberNo: 'MEM-2026-0002',
      name: 'Juan Perez Dela Cruz',
      email: 'juan.delacruz@yahoo.com',
      classification: 'REGULAR',
      kycStatus: 'VERIFIED',
      idType: 'Driver\'s License (Encrypted SPI)',
      paidUpShares: 10000,
      npcConsent: 'Agreed (IP: 180.191.22.45)',
    },
  ]);

  // Interactive Loan Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(12);
  const [calcTerm, setCalcTerm] = useState<number>(12);
  const [calcMethod, setCalcMethod] = useState<'DIMINISHING_BALANCE_EQUAL_INSTALLMENT' | 'STRAIGHT_LINE'>('DIMINISHING_BALANCE_EQUAL_INSTALLMENT');
  const [calcBillingMode, setCalcBillingMode] = useState<'PLATFORM_ESCROW' | 'COOP_MERCHANT'>('PLATFORM_ESCROW');

  // Pass-through platform fee math
  const platformFee =
    calcBillingMode === 'PLATFORM_ESCROW'
      ? Math.max(calcAmount * 0.02, 100)
      : calcAmount * 0.005;
  const netPlatformRevenue = Math.round((platformFee / 1.12) * 100) / 100;
  const vatAmount = Math.round((platformFee - netPlatformRevenue) * 100) / 100;
  const coopServiceFee = Math.round(calcAmount * 0.015 * 100) / 100;
  const netDisbursed = calcAmount - platformFee - coopServiceFee;

  // PayMongo QR Ph Pass-On Math
  const [paymentAmount, setPaymentAmount] = useState<number>(4500);
  const [paymentChannel, setPaymentChannel] = useState<'PAYMONGO_QRPH' | 'IN_PERSON_CASHIER'>('PAYMONGO_QRPH');
  const passOnFee = paymentChannel === 'PAYMONGO_QRPH' ? Math.max(15, Math.round(paymentAmount * 0.015 * 100) / 100) : 0;
  const totalCharge = paymentAmount + passOnFee;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              F
            </div>
            <div>
              <div className="font-bold text-lg leading-tight flex items-center gap-2">
                Flex Coop Solution
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  CDA Compliant
                </span>
              </div>
              <div className="text-xs text-slate-500">Enterprise SaaS Cooperative Banking & Lending</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Member Portal Quick Links */}
            <div className="hidden lg:flex items-center space-x-1 border-r border-slate-200 pr-3">
              <Link
                href="/member/login"
                className="text-xs font-semibold text-slate-700 hover:text-emerald-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Member Login
              </Link>
              <Link
                href="/member/register"
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                + Member Onboarding
              </Link>
              <Link
                href="/coop-register"
                className="text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors ml-1"
              >
                + Register New Coop
              </Link>
            </div>

            <Link
              href="/member"
              className="text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Member Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Active Tenant Badge */}
            <div className="hidden xl:flex items-center space-x-2.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-900 leading-tight">Bayani Cooperative</div>
                <div className="text-emerald-800 font-mono text-[10px] font-semibold">bayani-flexcoop.tuntongtech.com</div>
              </div>
            </div>

            {/* Cloud Firestore Database Badge & Sync */}
            <div className="hidden lg:flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <div>
                <div className="font-semibold text-amber-950 leading-tight">Cloud Firestore</div>
                <div className="text-amber-800 font-mono text-[10px]">/tenants/tenant_bayani_001/</div>
              </div>
              <button
                type="button"
                onClick={handleSyncFirestore}
                disabled={firestoreSyncStatus === 'SYNCING'}
                className="ml-1 text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold px-2 py-0.5 rounded transition-colors disabled:opacity-50"
              >
                {firestoreSyncStatus === 'SYNCING' ? 'Syncing...' : firestoreSyncStatus === 'SYNCED' ? '✓ Synced' : 'Sync'}
              </button>
            </div>

            {/* Interactive Staff Role Switcher (RBAC) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs transition-all shadow-sm"
              >
                <div className={`w-7 h-7 rounded-full ${currentStaff.color} text-white font-bold flex items-center justify-center text-[10px] shadow-sm`}>
                  {currentStaff.initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-slate-900 leading-tight flex items-center gap-1">
                    <span>{currentStaff.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">{currentStaff.roleTitle}</div>
                </div>
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-84 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Staff Role-Based Access (RBAC)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      CDA MC 2015-06
                    </span>
                  </div>
                  {STAFF_ACCOUNTS.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setCurrentStaff(staff);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 text-xs transition-colors ${
                        currentStaff.id === staff.id
                          ? 'bg-emerald-50 border border-emerald-300 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full ${staff.color} text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-sm`}>
                        {staff.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center justify-between">
                          <span className="truncate">{staff.name}</span>
                          {currentStaff.id === staff.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700">{staff.roleTitle}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{staff.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs with Permission Indicators */}
        <div className="flex space-x-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Executive Dashboard', icon: Landmark },
            { id: 'members', label: 'Members & eKYC', icon: Users },
            { id: 'los', label: 'LOS Approval Matrix', icon: CreditCard },
            { id: 'calculator', label: 'Loan Calculator & Fees', icon: Calculator },
            { id: 'cashier', label: 'Cashier & PayMongo QR Ph', icon: QrCode },
            { id: 'accounting', label: 'CDA General Ledger', icon: BookOpen },
            { id: 'invoices', label: 'Tax & Invoices (12% VAT)', icon: FileText },
            { id: 'reports', label: 'CDA & CIC Mandatory Reports', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasPermission = currentStaff.allowedTabs.includes(tab.id as any);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : hasPermission
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 opacity-80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {!hasPermission && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    View-Only
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cloud Firestore Sync Confirmation Banner */}
        {firestoreSyncStatus === 'SYNCED' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 mb-6 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Cloud Firestore Synchronized:</strong> 59 CDA Chart of Accounts, 2 Member Profiles, and Active Loan Documents are up to date under path <code className="font-mono text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">/tenants/tenant_bayani_001/</code>.
              </span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-mono px-2 py-0.5 rounded font-bold">
              Status: 200 OK
            </span>
          </div>
        )}

        {/* Segregation of Duties Notice Banner (if active tab is restricted for active staff) */}
        {!currentStaff.allowedTabs.includes(activeTab) && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 mb-6 flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>Statutory Segregation of Duties Notice (CDA MC 2015-06)</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-mono">
                  Read-Only Mode for {currentStaff.roleTitle}
                </span>
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed">
                You are currently viewing this module as <strong>{currentStaff.name} ({currentStaff.roleTitle})</strong>. 
                Under standard Cooperative Governance regulations, action items in this module are reserved for authorized fiduciary roles. 
                Switch to the appropriate staff role via the header dropdown to simulate authoring or approving actions.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Loan Portfolio</div>
                <div className="text-2xl font-bold text-slate-900 mt-2">₱50,000.00</div>
                <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 1 Active Loan (0 Defaults)
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paid-Up Share Capital</div>
                <div className="text-2xl font-bold text-slate-900 mt-2">₱25,000.00</div>
                <div className="text-xs text-slate-500 font-medium mt-1">2 Regular Members Registered</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Platform Pass-Through Fees</div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">₱1,000.00</div>
                <div className="text-xs text-slate-500 font-medium mt-1">₱107.14 Output VAT Remitted</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Portfolio At Risk (PAR)</div>
                <div className="text-2xl font-bold text-slate-900 mt-2">0.00%</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">CDA Target: &lt; 5.0%</div>
              </div>
            </div>

            {/* Architecture & Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Philippine Regulatory Compliance Architecture
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></span>
                    <div>
                      <div className="font-semibold text-slate-800">CDA Standard Chart of Accounts (COA)</div>
                      <div className="text-xs text-slate-500">
                        Strict double-entry validation using standard codes: Assets (1-xx), Liabilities (2-xx), Equity (3-xx), Revenue (4-xx), Expenses (5-xx).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></span>
                    <div>
                      <div className="font-semibold text-slate-800">NPC (Data Privacy Act of 2012)</div>
                      <div className="text-xs text-slate-500">
                        Consent logs with IP & UserAgent audit records; AES-256-GCM field encryption for SPI (PhilSys National ID, TIN, birthdates).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></span>
                    <div>
                      <div className="font-semibold text-slate-800">AMLC Covered Transaction Triggers</div>
                      <div className="text-xs text-slate-500">
                        Automated threshold flagging for cash transactions $\ge ₱500,000.00$ within a single banking day.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Percent className="w-5 h-5 text-emerald-600" />
                  Dual Monetization & Pass-Through Engine
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-lg">
                    <div className="flex justify-between font-semibold text-emerald-950">
                      <span>Platform Escrow Mode (Active)</span>
                      <span className="text-emerald-700">2.0% (Min ₱100.00)</span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1">
                      Platform handles escrow settlement. Processing fee is deducted upfront from loan disbursement proceeds.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 bg-slate-50 rounded-lg">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Coop-Owned Merchant Mode</span>
                      <span className="text-slate-600">0.5% (No Floor)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Cooperative connects their own PayMongo/banking merchant account. Platform takes 0.5% fee.
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded">
                    <strong>Tax Rule:</strong> All platform processing fees are inclusive of <strong>12% Output VAT</strong> and generate an electronic Sales Invoice with BIR compliance metadata.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MEMBERS */}
        {activeTab === 'members' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cooperative Membership & eKYC Directory</h2>
                <p className="text-xs text-slate-500">NPC Data Privacy Act compliant member records with encrypted sensitive personal information (SPI).</p>
              </div>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                + Register New Member
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Member No</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">eKYC & SPI ID</th>
                    <th className="p-3 text-right">Paid-Up Shares (₱)</th>
                    <th className="p-3">NPC Consent</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-medium">{m.memberNo}</td>
                      <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                      <td className="p-3"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">{m.classification}</span></td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{m.idType}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">{m.paidUpShares.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{m.npcConsent}</td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: LOS APPROVAL MATRIX */}
        {activeTab === 'los' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Loan Origination System (LOS) - Multi-Tier Approval Matrix</h2>
                <p className="text-xs text-slate-500">Pipeline: Loan Officer Triage $\rightarrow$ Credit Committee $\rightarrow$ Board of Directors $\rightarrow$ Net Proceeds Disbursement.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowDisclosureModal(true)}
                className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" /> View RA 3765 Disclosure & Promissory Note
              </button>
            </div>

            {/* Application Card */}
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <div className="text-xs font-mono text-slate-500">Application: LN-2026-00001</div>
                  <div className="text-base font-bold text-slate-900">Maria Clara Santos (Regular Member)</div>
                  <div className="text-xs text-slate-600">Product: Regular Member Loan • 12% p.a. • 12 Months term</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-slate-500 font-semibold">Principal Requested</div>
                  <div className="text-2xl font-black text-slate-900">₱50,000.00</div>
                </div>
              </div>

              {/* Stepper Pipeline with Granular RBAC Guards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Step 1: Loan Officer */}
                <div className={`p-4 rounded-lg border ${
                  ['UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus)
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">1. Loan Officer</span>
                    {['UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus) ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Endorsed</span>
                    ) : (
                      <span className="text-amber-600">Pending Review</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Credit scoring & co-maker capability verified.</p>
                  {loanStatus === 'SUBMITTED' && (
                    <div>
                      {currentStaff.role === 'LOAN_OFFICER' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() => setLoanStatus('UNDER_CREDIT_REVIEW')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 rounded transition-colors shadow-sm"
                        >
                          Endorse to Committee
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Only Loan Officers or General Manager may endorse applications"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Loan Officer
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Credit Committee */}
                <div className={`p-4 rounded-lg border ${
                  ['BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus)
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">2. Credit Committee</span>
                    {['BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus) ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Approved</span>
                    ) : (
                      <span className="text-slate-400">Waiting</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Capacity to pay & collateral evaluation.</p>
                  {loanStatus === 'UNDER_CREDIT_REVIEW' && (
                    <div>
                      {currentStaff.role === 'CREDIT_COMMITTEE' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() => setLoanStatus('BOD_APPROVAL')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 rounded transition-colors shadow-sm"
                        >
                          Approve & Escalate to BOD
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Requires Credit Committee Chairperson or General Manager"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Credit Committee
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Board of Directors */}
                <div className={`p-4 rounded-lg border ${
                  ['APPROVED', 'DISBURSED'].includes(loanStatus)
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">3. Board of Directors</span>
                    {['APPROVED', 'DISBURSED'].includes(loanStatus) ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Approved</span>
                    ) : (
                      <span className="text-slate-400">Waiting</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Resolution & authority sign-off.</p>
                  {loanStatus === 'BOD_APPROVAL' && (
                    <div>
                      {currentStaff.role === 'BOD' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() => setLoanStatus('APPROVED')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 rounded transition-colors shadow-sm"
                        >
                          BOD Final Sign-Off
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Requires Board of Directors or General Manager resolution"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Board Chairman
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 4: Disbursement */}
                <div className={`p-4 rounded-lg border ${
                  loanStatus === 'DISBURSED'
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">4. Disbursement</span>
                    {loanStatus === 'DISBURSED' ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Disbursed</span>
                    ) : (
                      <span className="text-slate-400">Locked</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Deducts 2% fee & issues 12% VAT invoice.</p>
                  {loanStatus === 'APPROVED' && (
                    <div>
                      {currentStaff.role === 'CASHIER' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() => setLoanStatus('DISBURSED')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded transition-colors shadow-sm"
                        >
                          Execute Disbursement
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Under CDA MC 2015-06, only bonded Cashiers or GM may disburse cash proceeds"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Branch Cashier
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Statutory Segregation of Duties Guidance Footnote */}
              <div className="text-[11px] text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>
                  <strong>CDA Circular 2015-06 Segregation of Duties:</strong> Loan Officers & CreCom members cannot disburse funds; Cashiers cannot approve loans.
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold text-[10px]">
                  Active Role: {currentStaff.roleTitle}
                </span>
              </div>
            </div>

            {/* Disclosure Statement Modal */}
            {showDisclosureModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div>
                      <div className="text-xs uppercase font-bold text-emerald-700">Republic Act No. 3765 • Truth in Lending Act</div>
                      <h3 className="text-lg font-bold text-slate-900">Disclosure Statement on Loan/Credit Transaction</h3>
                      <div className="text-xs text-slate-500">Bayani Multi-Purpose Cooperative • CDA-NCR-2024-00921</div>
                    </div>
                    <button
                      onClick={() => setShowDisclosureModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-xs space-y-3 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between">
                      <span className="font-semibold">Borrower:</span>
                      <span>MARIA CLARA SANTOS (MEM-2026-0001)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">1. Loan Principal:</span>
                      <span className="font-bold text-slate-900">₱50,000.00</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 space-y-1 pl-4">
                      <div className="flex justify-between text-slate-600">
                        <span>a. SaaS Pass-Through Processing Fee (2%):</span>
                        <span>₱1,000.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>b. Coop Service and Filing Fee (1.5%):</span>
                        <span>₱750.00</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-emerald-900">
                      <span>2. Net Disbursed Proceeds (1 minus Deductions):</span>
                      <span className="text-emerald-800 text-sm">₱48,250.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">3. Effective Interest Rate (EIR):</span>
                      <span>15.50% per annum</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 leading-relaxed border border-slate-200">
                    <div className="font-bold mb-1 uppercase">Promissory Note & Loan Agreement Summary</div>
                    "FOR VALUE RECEIVED, I promise to pay to the order of BAYANI MULTI-PURPOSE COOPERATIVE the sum of PESOS FIFTY THOUSAND (PHP 50,000.00) in 12 equal monthly installments. Default in payment incurs 3% monthly surcharge. Joint and solidary liability acknowledged pursuant to the Cooperative Code."
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowDisclosureModal(false)}
                      className="bg-slate-900 text-white text-xs font-medium px-5 py-2.5 rounded-lg hover:bg-slate-800"
                    >
                      Close Statement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Loan Calculator & Pass-Through Monetization Simulator</h2>
              <p className="text-xs text-slate-500">Simulate upfront platform deductions, coop service fees, net member proceeds, and monthly amortization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Gross Loan Amount (₱)</label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(1000, Number(e.target.value)))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Interest Rate (%)</label>
                    <input
                      type="number"
                      value={calcRate}
                      onChange={(e) => setCalcRate(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Term (Months)</label>
                    <input
                      type="number"
                      value={calcTerm}
                      onChange={(e) => setCalcTerm(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Monetization Channel</label>
                  <select
                    value={calcBillingMode}
                    onChange={(e) => setCalcBillingMode(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="PLATFORM_ESCROW">Platform Escrow (2% of loan or ₱100 floor)</option>
                    <option value="COOP_MERCHANT">Coop-Owned Merchant Account (0.5%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amortization Method</label>
                  <select
                    value={calcMethod}
                    onChange={(e) => setCalcMethod(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="DIMINISHING_BALANCE_EQUAL_INSTALLMENT">Diminishing Balance (Equal Installment / Annuity)</option>
                    <option value="STRAIGHT_LINE">Straight-Line Method</option>
                  </select>
                </div>
              </div>

              {/* Output Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-600">Disbursement & Fee Breakdown</h3>

                <div className="space-y-2 text-sm border-b border-slate-200 pb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gross Loan Principal:</span>
                    <span className="font-semibold text-slate-900">₱{calcAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Pass-Through Platform Fee ({calcBillingMode === 'PLATFORM_ESCROW' ? '2% / min ₱100' : '0.5%'}):
                    </span>
                    <span className="font-semibold">- ₱{platformFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-slate-500 text-xs pl-4">
                    <span>↳ 12% Output VAT Decomposed:</span>
                    <span>₱{vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs pl-4">
                    <span>↳ Net Platform Revenue:</span>
                    <span>₱{netPlatformRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Coop Internal Service Fee (1.5%):</span>
                    <span className="font-semibold">- ₱{coopServiceFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-lg">
                  <div className="text-xs uppercase font-bold text-emerald-900">Net Proceeds Disbursed to Member:</div>
                  <div className="text-2xl font-extrabold text-emerald-950 mt-1">
                    ₱{netDisbursed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-emerald-800 mt-1">
                    Direct payout via Platform Escrow or Cash Counter
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CASHIER & PAYMONGO QR PH */}
        {activeTab === 'cashier' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cashier Repayments & PayMongo QR Ph Rail</h2>
              <p className="text-xs text-slate-500">Supports dynamic PayMongo QR Ph with pass-on fees, or in-person cash payments at ₱0 convenience fee.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Payment Controls */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Repayment Installment Amount (₱)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Math.max(100, Number(e.target.value)))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('PAYMONGO_QRPH')}
                      className={`p-3 border rounded-lg text-left text-xs ${
                        paymentChannel === 'PAYMONGO_QRPH'
                          ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <QrCode className="w-4 h-4 text-emerald-600" /> PayMongo QR Ph
                      </div>
                      <div className="text-slate-500 font-normal">Pass-on convenience fee applies</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChannel('IN_PERSON_CASHIER')}
                      className={`p-3 border rounded-lg text-left text-xs ${
                        paymentChannel === 'IN_PERSON_CASHIER'
                          ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Landmark className="w-4 h-4 text-emerald-600" /> Over-The-Counter
                      </div>
                      <div className="text-slate-500 font-normal">₱0.00 convenience fee</div>
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Loan Repayment Credit:</span>
                    <span className="font-semibold text-slate-900">₱{paymentAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Pass-On Convenience Fee:</span>
                    <span className="font-semibold">+ ₱{passOnFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                    <span>Total Amount Charged to Member:</span>
                    <span className="text-emerald-700">₱{totalCharge.toFixed(2)}</span>
                  </div>

                  {/* Cashier Execution Guard */}
                  <div className="pt-2">
                    {currentStaff.role === 'CASHIER' || currentStaff.role === 'GENERAL_MANAGER' ? (
                      <button
                        type="button"
                        onClick={() => alert(`Official Receipt (OR) generated successfully!\nAmount: ₱${paymentAmount.toFixed(2)}\nCashier: ${currentStaff.name}\nAccount: 1-01-01 (Cash on Hand)`)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Post Payment & Issue Official Receipt (OR)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="Segregation of Duties: Only bonded Cashiers or GM may handle collections"
                        className="w-full bg-slate-200 text-slate-500 text-xs font-medium py-2 rounded-lg cursor-not-allowed border border-slate-300"
                      >
                        Payment Posting Restricted to Cashier
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Ph Live Code Box */}
              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center">
                {paymentChannel === 'PAYMONGO_QRPH' ? (
                  <>
                    <div className="w-48 h-48 bg-white border-2 border-emerald-600 rounded-lg p-3 shadow-md flex flex-col items-center justify-center">
                      <div className="w-36 h-36 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-mono p-2 text-center">
                        [QR Ph Code Payload]
                        <br />
                        ₱{totalCharge.toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-4 font-bold text-slate-900 text-sm">PayMongo Dynamic QR Ph Code</div>
                    <div className="text-xs text-slate-500 max-w-xs mt-1">
                      Scannable via GCash, Maya, BDO, BPI, UnionBank, or any InstaPay-enabled banking app.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                      <Landmark className="w-8 h-8" />
                    </div>
                    <div className="font-bold text-slate-900 text-sm">In-Person Counter Cashiering</div>
                    <div className="text-xs text-slate-500 max-w-xs mt-1">
                      Member pays cash/check directly at the cooperative branch. Full ₱{paymentAmount.toFixed(2)} is credited to loan amortization with zero convenience fees.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CDA GENERAL LEDGER */}
        {activeTab === 'accounting' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">CDA Standard General Ledger & Trial Balance</h2>
              <p className="text-xs text-slate-500">Live double-entry balances adhering to the standard Cooperative Development Authority chart of accounts.</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">CDA Code</th>
                    <th className="p-3">Account Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Debit (₱)</th>
                    <th className="p-3 text-right">Credit (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-mono font-medium">1-01-01</td>
                    <td className="p-3">Cash on Hand (Cashier Counter)</td>
                    <td className="p-3 text-slate-500">ASSETS</td>
                    <td className="p-3 text-right font-medium">15,000.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">1-02-01</td>
                    <td className="p-3">Loans Receivable - Regular</td>
                    <td className="p-3 text-slate-500">ASSETS</td>
                    <td className="p-3 text-right font-medium">50,000.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">1-01-04</td>
                    <td className="p-3">Platform Escrow Settlement Account</td>
                    <td className="p-3 text-slate-500">ASSETS</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">48,250.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">2-02-02</td>
                    <td className="p-3">Platform Loan Processing Fee Payable</td>
                    <td className="p-3 text-slate-500">LIABILITIES</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">1,000.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">4-01-02</td>
                    <td className="p-3">Service and Filing Fees Income</td>
                    <td className="p-3 text-slate-500">REVENUE</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">750.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">3-01-03</td>
                    <td className="p-3">Paid-Up Share Capital - Common</td>
                    <td className="p-3 text-slate-500">EQUITY</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">15,000.00</td>
                  </tr>
                </tbody>
                <tfoot className="bg-emerald-50 border-t-2 border-emerald-500 font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="p-3 text-right uppercase">Trial Balance Grand Total:</td>
                    <td className="p-3 text-right text-emerald-800">₱65,000.00</td>
                    <td className="p-3 text-right text-emerald-800">₱65,000.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg font-medium">
              <CheckCircle2 className="w-4 h-4" />
              General Ledger is Balanced! Sum of all debits equals sum of all credits.
            </div>
          </div>
        )}

        {/* TAB 5: TAX & INVOICES */}
        {activeTab === 'invoices' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Electronic Tax Invoices (12% Output VAT)</h2>
              <p className="text-xs text-slate-500">Automated BIR sales invoices generated upon upfront loan fee deduction.</p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 space-y-4 max-w-xl">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Official Electronic Sales Invoice</div>
                  <div className="text-base font-bold text-slate-900">INV-2026-00918</div>
                  <div className="text-xs text-slate-500">Ref: DISB-TX-ESCROW-992182</div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                  DEDUCTED UPFRONT
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Customer (Cooperative):</span>
                  <span className="font-semibold text-slate-800">Bayani Multi-Purpose Cooperative</span>
                </div>
                <div className="flex justify-between">
                  <span>BIR TIN:</span>
                  <span className="font-mono">009-887-123-000</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Loan Amount Disbursed:</span>
                  <span>₱50,000.00</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Gross Processing Fee (2.0%):</span>
                  <span>₱1,000.00</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-3">
                  <span>VATable Sales (Net of VAT):</span>
                  <span>₱892.86</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-3">
                  <span>12% Output VAT:</span>
                  <span>₱107.14</span>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount Remitted:</span>
                <span className="text-emerald-700">₱1,000.00</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CDA & CIC MANDATORY REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mandatory Regulatory Compliance & Reporting (CDA & CIC)</h2>
                <p className="text-xs text-slate-500">Official statutory filings: CDA Annual Progress Report (CAPR), C-PES Standards, and RA 9510 CIC Credit Registry.</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => alert('Downloaded CDA_CAPR_2026_tenant_bayani_001.csv')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export CDA CAPR (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => alert('Downloaded CIC_Credit_Registry_RA9510.csv')}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export CIC Credit Data
                </button>
              </div>
            </div>

            {/* C-PES Performance Standards Evaluation Card */}
            <div className="p-6 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-200 pb-3">
                <div>
                  <div className="text-xs uppercase font-bold text-emerald-800">Cooperative Performance Evaluation System (C-PES)</div>
                  <h3 className="text-base font-extrabold text-emerald-950">Composite Evaluation Rating: 85.0 / 100</h3>
                  <div className="text-xs text-emerald-700">Standard CDA Rating: <strong>EXCELLENT</strong> • Certificate of Good Standing Qualified</div>
                </div>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  CDA COMPLIANT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">1. Asset Quality</div>
                  <div className="text-sm font-black text-slate-900 mt-1">PAR 0.00%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">25.0 / 25 pts (Target &le; 5%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">2. Solvency</div>
                  <div className="text-sm font-black text-slate-900 mt-1">Net Worth 78.5%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">25.0 / 25 pts (Target &ge; 20%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">3. Liquidity</div>
                  <div className="text-sm font-black text-slate-900 mt-1">Cash Ratio 300%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">20.0 / 20 pts (Target &ge; 15%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">4. Efficiency</div>
                  <div className="text-sm font-black text-slate-900 mt-1">Expense Ratio 0%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">15.0 / 15 pts (Target &le; 40%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">5. Profitability</div>
                  <div className="text-sm font-black text-slate-900 mt-1">ROE Active</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">15.0 / 15 pts (Target &ge; 8%)</div>
                </div>
              </div>
            </div>

            {/* CAPR Summary & Statutory Reserves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CAPR Box */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  CDA Annual Progress Report (CAPR) Structure
                </h3>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Total Registered Membership:</span>
                    <strong className="text-slate-900">2 Regular (100% Active)</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Total Paid-Up Share Capital:</span>
                    <strong className="text-slate-900">₱25,000.00 (Common)</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Active Loan Portfolio:</span>
                    <strong className="text-slate-900">₱50,000.00 (0 Defaults)</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Collection Efficiency:</span>
                    <strong className="text-emerald-700">98.5%</strong>
                  </div>
                </div>
              </div>

              {/* Statutory Reserves Box */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Statutory Reserve Allocations (RA 9520 Art. 86)
                </h3>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>General Reserve Fund (Min 10%):</span>
                    <strong className="text-slate-900">10.0% Allocation</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Education & Training Fund (CETF):</span>
                    <strong className="text-slate-900">10.0% Allocation</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Community Development Fund (CDF):</span>
                    <strong className="text-slate-900">3.0% Min Allocation</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Optional Reserve Fund:</span>
                    <strong className="text-slate-900">7.0% Max Allocation</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
