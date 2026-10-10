'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function MemberLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('09171234567');
  const [pin, setPin] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const demoAccounts = [
    {
      name: 'Maria Clara Santos',
      memberNo: 'MEM-2026-0001',
      identifier: '09171234567',
      pin: '123456',
      role: 'Regular Member (Active Loan)',
      paidUp: '₱15,000.00',
    },
    {
      name: 'Juan Perez Dela Cruz',
      memberNo: 'MEM-2026-0002',
      identifier: '09189876543',
      pin: '123456',
      role: 'Regular Member (Co-Maker)',
      paidUp: '₱10,000.00',
    },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // In a real app we store JWT to localStorage / cookies
      router.push('/member');
    }, 600);
  };

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setIdentifier(acc.identifier);
    setPin(acc.pin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-emerald-500/20">
            F
          </div>
          <div>
            <div className="font-bold text-base text-white flex items-center gap-2">
              Bayani Multi-Purpose Cooperative
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                CDA Reg: 2024-00921
              </span>
            </div>
            <div className="text-xs text-slate-400">Powered by Flex Coop Solution</div>
          </div>
        </div>

        <Link
          href="/"
          className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-600/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <span>Staff / Admin Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Body */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Info & Value Prop */}
        <div className="md:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Cooperative Banking & Online Services</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Manage your savings, loans & dividends anytime.
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Welcome to the official member online facility of Bayani Multi-Purpose Cooperative. Check your share capital, apply for regular and emergency loans, download Truth in Lending disclosures, and pay via QR Ph.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white block">BSP & CDA Standard Accounting</span>
                <span className="text-slate-400">Diminishing balance interest and pass-through loan processing fees.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white block">NPC Data Privacy Act Protected</span>
                <span className="text-slate-400">All Sensitive Personal Information is encrypted with AES-256-GCM.</span>
              </div>
            </div>
          </div>

          {/* New Member Callout */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
            <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              Not yet a cooperative member?
            </div>
            <p className="text-xs text-slate-400">
              Complete the online Pre-Membership Education Seminar (PMES) and submit your eKYC application in under 5 minutes.
            </p>
            <Link
              href="/member/register"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors mt-1 shadow-md shadow-emerald-700/30"
            >
              <span>Apply for Membership</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="md:col-span-6 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Member Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered mobile number or email and 6-digit MPIN.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Registered Mobile Number or Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 09171234567 or email"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  6-Digit MPIN / Password
                </label>
                <a href="#help" onClick={(e) => { e.preventDefault(); alert('For PIN resets, visit your branch teller or contact support@bayanicoop.ph'); }} className="text-[11px] text-emerald-400 hover:underline">
                  Forgot MPIN?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 text-sm"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Member Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-slate-700/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>One-Click Test Accounts (Demo Sandbox)</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.memberNo}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                    identifier === acc.identifier
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{acc.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {acc.memberNo} • {acc.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Auto Fill
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          © 2026 Bayani Multi-Purpose Cooperative. Registered with Cooperative Development Authority (CDA).
        </div>
        <div className="flex items-center space-x-4">
          <span className="hover:text-slate-400 cursor-pointer">Terms & Conditions</span>
          <span>•</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy Notice (RA 10173)</span>
          <span>•</span>
          <span className="hover:text-slate-400 cursor-pointer">CDA Citizen's Charter</span>
        </div>
      </div>
    </div>
  );
}
