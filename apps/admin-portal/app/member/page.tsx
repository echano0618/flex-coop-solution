'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export default function MemberPortalPage() {
  const [activeTab, setActiveTab] = useState<'home' | 'apply' | 'pay' | 'documents' | 'profile'>('home');

  // Member Loan Application State
  const [loanProduct, setLoanProduct] = useState<'REGULAR' | 'EMERGENCY'>('REGULAR');
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

  // Calculations for Loan Application
  const annualRate = loanProduct === 'REGULAR' ? 0.12 : 0.06;
  const platformFee = Math.max(loanAmount * 0.02, 100.0);
  const coopServiceFee = loanAmount * (loanProduct === 'REGULAR' ? 0.015 : 0.005);
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

            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                MS
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">Maria Clara Santos</div>
                <div className="text-[11px] text-slate-500">MEM-2026-0001 • Regular</div>
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
            { id: 'home', label: 'My Portfolio', icon: Wallet },
            { id: 'apply', label: 'Apply for Loan', icon: CreditCard },
            { id: 'pay', label: 'Pay via QR Ph', icon: QrCode },
            { id: 'documents', label: 'Truth in Lending & Promissory Note', icon: FileText },
            { id: 'profile', label: 'eKYC & Privacy (NPC)', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
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
            {/* Member Greeting & eKYC Verified Banner */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Member Account</span>
                  <span className="bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/40">
                    CDA Good Standing
                  </span>
                </div>
                <h1 className="text-2xl font-black">Welcome, Maria Clara!</h1>
                <p className="text-xs text-emerald-100/90 mt-1">
                  Member Number: <strong className="text-white">MEM-2026-0001</strong> • Verified Identity: <strong className="text-white">PhilSys National ID</strong>
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
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">₱15,000.00</div>
                  <div className="text-xs text-slate-500 mt-1">150 Shares @ ₱100.00 par value</div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Subscribed Shares:</span>
                    <span className="font-semibold text-slate-800">200 Shares (₱20,000.00)</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Dividend & Patronage Eligibility:</span>
                    <span>100% Active</span>
                  </div>
                </div>
              </div>

              {/* Compulsory Savings Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compulsory Savings</span>
                    <span className="bg-emerald-50 text-emerald-800 font-bold text-[11px] px-2 py-0.5 rounded">3.0% Interest</span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-2">₱5,000.00</div>
                  <div className="text-xs text-slate-500 mt-1">Deposit Liabilities account (2-01-01)</div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Account Status:</span>
                    <span className="font-semibold text-emerald-700">ACTIVE & EARNING</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Collateral Leverage:</span>
                    <span className="font-semibold text-slate-800">Qualified for 3x loan</span>
                  </div>
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
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950">Loan Application Submitted!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Your application for <strong>₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> has been submitted. It is now in the <strong>Loan Officer Review</strong> queue of the approval matrix.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-emerald-800"
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
                    <label className="text-xs font-bold text-slate-700 block mb-2">1. Select Loan Product</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLoanProduct('REGULAR')}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          loanProduct === 'REGULAR'
                            ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="text-sm">Regular Member Loan</div>
                        <div className="text-xs font-normal text-slate-500 mt-1">12.0% p.a. • Up to 24 mos</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLoanProduct('EMERGENCY')}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          loanProduct === 'EMERGENCY'
                            ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="text-sm">Emergency Loan</div>
                        <div className="text-xs font-normal text-slate-500 mt-1">6.0% p.a. • Up to 12 mos</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">2. Desired Loan Principal</label>
                      <span className="text-sm font-black text-emerald-700">₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <input
                      type="range"
                      min={5000}
                      max={loanProduct === 'REGULAR' ? 250000 : 50000}
                      step={5000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                      <span>₱5,000.00</span>
                      <span>Max ₱{loanProduct === 'REGULAR' ? '250,000.00' : '50,000.00'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">3. Repayment Term</label>
                    <div className="flex gap-2">
                      {[6, 12, 18, 24].filter((t) => (loanProduct === 'EMERGENCY' ? t <= 12 : true)).map((t) => (
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

                  {loanProduct === 'REGULAR' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">4. Designated Co-Maker (Regular Member)</label>
                      <input
                        type="text"
                        value={coMaker}
                        onChange={(e) => setCoMaker(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
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
                    disabled={!agreedToTerms}
                    onClick={() => setApplicationSubmitted(true)}
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
      </div>
    </div>
  );
}
