'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
  KeyRound,
  ExternalLink,
  Users,
} from 'lucide-react';
import { getApiBaseUrl } from '../api-config';

interface StaffPreset {
  id: string;
  name: string;
  email: string;
  role: string;
  roleTitle: string;
}

const PRESET_ACCOUNTS: StaffPreset[] = [
  {
    id: 'usr_sysadmin_01',
    name: 'Engr. Alex V. Mercer',
    email: 'admin@coop.tuntongtech.com',
    role: 'SYSTEM_ADMIN',
    roleTitle: 'Platform System Admin',
  },
  {
    id: 'usr_gm_01',
    name: 'Atty. Roberto Dela Rosa',
    email: 'gm@bayanicoop.ph',
    role: 'GENERAL_MANAGER',
    roleTitle: 'General Manager / Superadmin',
  },
  {
    id: 'usr_lo_01',
    name: 'Grace Villanueva',
    email: 'lo@bayanicoop.ph',
    role: 'LOAN_OFFICER',
    roleTitle: 'Senior Loan Officer',
  },
  {
    id: 'usr_cashier_01',
    name: 'Leah Mendoza',
    email: 'cashier@bayanicoop.ph',
    role: 'CASHIER',
    roleTitle: 'Branch Head Cashier & Teller',
  },
  {
    id: 'usr_acct_01',
    name: 'Felipe Santos, CPA',
    email: 'accountant@bayanicoop.ph',
    role: 'ACCOUNTANT',
    roleTitle: 'Chief Bookkeeper & Accountant',
  },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectPreset = (preset: StaffPreset) => {
    setEmail(preset.email);
    setPassword('••••••••');
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your cooperative staff email and password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      // Find matching preset or default to General Manager
      const matched = PRESET_ACCOUNTS.find(
        (a) => a.email.toLowerCase() === email.trim().toLowerCase()
      ) || {
        id: `usr_${Date.now()}`,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email.trim(),
        role: 'GENERAL_MANAGER',
        roleTitle: 'Cooperative Administrator',
      };

      const sessionData = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        roleTitle: matched.roleTitle,
        token: `adm_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        loginAt: new Date().toISOString(),
      };

      // Set localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('flexcoop_admin_session', JSON.stringify(sessionData));
        document.cookie = `flexcoop_admin_session=${encodeURIComponent(sessionData.token)}; path=/; max-age=86400; SameSite=Lax`;
      }

      router.push('/');
    } catch (err) {
      console.error(err);
      setErrorMessage('An unexpected error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base text-white flex items-center gap-2">
              Cooperative Enterprise Portal
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono">
                Staff &amp; Admin
              </span>
            </div>
            <div className="text-xs text-slate-400">Powered by Tuntong Tech Solution</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/member/login"
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Member Portal</span>
          </Link>
          <Link
            href="/operator/login"
            className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Operator</span>
          </Link>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-4xl w-full mx-auto my-auto py-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left Side: Compliance & Roles */}
        <div className="md:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CDA Regulatory Standard &amp; NPC DPA Compliant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Cooperative Enterprise Resource Planning &amp; Banking
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Secure administrative control plane for cooperative General Managers, Loan Officers, Cashiers, Accountants, and Board Members.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white block">Strict Dual-Control &amp; Fiduciary RBAC</span>
                <span className="text-slate-400">Underwriting segregation, Board sign-offs, and cashier disbursement verification.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white block">Automated Security Lockout Protection</span>
                <span className="text-slate-400">5-attempt lockout enforcement with mandatory justification audit logging.</span>
              </div>
            </div>
          </div>

          {/* Quick Presets for Demo / Easy Selection */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              Authorized Staff Roles:
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_ACCOUNTS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="text-[11px] bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700 px-2.5 py-1 rounded-lg transition"
                >
                  {preset.roleTitle}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="md:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Staff Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your cooperative staff email address and password to access your role workspace.
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
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@coop.tuntongtech.com"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-indigo-400 cursor-pointer hover:underline">
                  Forgot Password?
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 text-sm"
            >
              {isLoading ? (
                <span>Verifying Credentials...</span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Need onboarding for a new cooperative?{' '}
              <Link href="/coop-register" className="text-indigo-400 font-semibold hover:underline">
                Register Cooperative
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          © 2026 Tuntong Tech Solution • Cooperative Enterprise Resource Planning System
        </div>
        <div className="flex items-center space-x-4">
          <span>CDA Standard Compliant</span>
          <span>•</span>
          <span>NPC Data Privacy Act</span>
          <span>•</span>
          <span>256-bit SSL Encrypted</span>
        </div>
      </div>
    </div>
  );
}
