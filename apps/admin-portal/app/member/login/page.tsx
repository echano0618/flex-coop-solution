'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getApiBaseUrl } from '../../api-config';
import {
  resolveTenantCoop,
  setTenantMemberSession,
  getTenantMemberSession,
  setTenantAdminSession,
  TenantInfo,
} from '../../tenant-utils';

export default function MemberLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    slug: 'default',
    name: 'Cooperative Enterprise',
    isSubdomain: false,
    registrationNumber: 'CDA Registered',
    logoLetter: 'C',
    coopType: 'Multi-Purpose',
  });

  React.useEffect(() => {
    const info = resolveTenantCoop();
    setTenantInfo(info);

    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const prefillUser = params.get('username') || params.get('identifier');
        if (prefillUser) {
          setIdentifier(prefillUser);
        }

        const existing = getTenantMemberSession(info.slug);
        if (existing) {
          router.replace(info.slug && info.slug !== 'default' ? `/member?coop=${info.slug}` : '/member');
        }
      }
    } catch (e) {}
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const idInput = identifier.trim();
    const passwordInput = password.trim();

    if (!idInput || !passwordInput) {
      setErrorMessage('Please enter your Registered Email or Mobile Number, and your Password.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/member/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantInfo.slug,
        },
        body: JSON.stringify({
          identifier: idInput,
          password: passwordInput,
          pin: passwordInput,
          tenantSlug: tenantInfo.slug,
          targetPortal: 'MEMBER',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setTenantMemberSession(data.member, tenantInfo.slug, tenantInfo.name);
        // Single Sign-On: If this account has staff/admin privileges, simultaneously set admin session
        if (data.isStaff || data.user?.isStaff) {
          setTenantAdminSession(data.user || data.member, tenantInfo.slug, tenantInfo.name);
        }
        router.push(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member?coop=${tenantInfo.slug}` : '/member');
        return;
      }
      setIsLoading(false);
      setErrorMessage(data.error || 'Authentication failed. Please verify your email/mobile and password.');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Unable to connect to the cooperative authentication service. Please check your internet connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/40 text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Minimal Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-center pt-2 sm:pt-4">
        <div className="flex items-center space-x-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-600/20 shrink-0">
            {tenantInfo.logoLetter}
          </div>
          <div className="text-left">
            <h1 className="font-extrabold text-base text-slate-900 leading-tight">
              {tenantInfo.name}
            </h1>
            <div className="text-[11px] text-slate-500 font-mono">
              {tenantInfo.registrationNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white/95 backdrop-blur-md border border-emerald-100/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered email address or mobile number and password to access your account.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Email or Mobile
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. member@email.com or 09171234567"
                  required
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-sm mt-2"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Membership Application Section */}
          <div className="pt-5 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-500">
              Not yet a member of <strong>{tenantInfo.name}</strong>?
            </p>
            <Link
              href={tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member/register?coop=${tenantInfo.slug}` : '/member/register'}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs transition shadow-xs"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Apply for Membership Online</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Minimal Clean Footer */}
      <div className="max-w-md w-full mx-auto text-center pb-2 text-[11px] text-slate-400 space-y-1">
        <div>© 2026 {tenantInfo.name} • Regulated by the Cooperative Development Authority (CDA)</div>
      </div>
    </div>
  );
}
