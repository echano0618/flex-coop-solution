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
  Fingerprint,
} from 'lucide-react';
import { getApiBaseUrl } from '../../api-config';
import {
  resolveTenantCoop,
  setTenantMemberSession,
  getTenantMemberSession,
  setTenantAdminSession,
  clearTenantAdminSession,
  TenantInfo,
  base64UrlToUint8Array,
} from '../../tenant-utils';

export default function MemberLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [biometricsMember, setBiometricsMember] = useState<{
    id?: string;
    memberNumber?: string;
    name?: string;
    identifier?: string;
    credentialId?: string;
    rpId?: string;
  } | null>(null);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState<boolean>(false);
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

        // Detect saved biometric login session for device
        const bioKey = `flexcoop_biometrics_enabled_${info.slug}`;
        const memberKey = `flexcoop_biometrics_member_${info.slug}`;
        const bioEnabled = localStorage.getItem(bioKey) === 'true';
        const savedMember = localStorage.getItem(memberKey);
        if (bioEnabled && savedMember) {
          try {
            const parsed = JSON.parse(savedMember);
            if (parsed && (parsed.identifier || parsed.memberNumber || parsed.id)) {
              setBiometricsMember(parsed);
              setHasBiometrics(true);
            }
          } catch {}
        }

        const existing = getTenantMemberSession(info.slug);
        if (existing) {
          router.replace(info.slug && info.slug !== 'default' ? `/member?coop=${info.slug}` : '/member');
        }
      }
    } catch (e) {}
  }, [router]);

  const handleBiometricLogin = async () => {
    if (!biometricsMember) return;
    setErrorMessage('');
    setIsBioAuthenticating(true);

    try {
      // 1. Invoke device biometric prompt (WebAuthn credentials get)
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const getPublicKey: any = {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname,
          };

          if (biometricsMember.credentialId) {
            try {
              getPublicKey.allowCredentials = [
                {
                  type: 'public-key',
                  id: base64UrlToUint8Array(biometricsMember.credentialId),
                  transports: ['internal'],
                },
              ];
            } catch (convErr) {
              console.warn('Error converting credentialId:', convErr);
            }
          }

          await navigator.credentials.get({
            publicKey: getPublicKey,
          });
        } catch (credErr: any) {
          console.warn('WebAuthn get error:', credErr);
          setIsBioAuthenticating(false);
          if (biometricsMember.identifier) {
            setIdentifier(biometricsMember.identifier);
          }
          const errName = credErr?.name || '';
          const errMsg = String(credErr?.message || '').toLowerCase();
          if (errName === 'NotAllowedError' && (errMsg.includes('cancel') || errMsg.includes('abort'))) {
            setErrorMessage('Biometric verification cancelled.');
          } else {
            setErrorMessage(
              'No biometric passkey found on this device. Please sign in with your password below, then re-enable Touch ID / Face ID under More.'
            );
          }
          return;
        }
      }

      // 2. Perform authenticated biometric login via API
      const bioId = biometricsMember.identifier || biometricsMember.memberNumber || biometricsMember.id || 'mem_0001';
      const res = await fetch(`${getApiBaseUrl()}/auth/member/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantInfo.slug,
        },
        body: JSON.stringify({
          identifier: bioId,
          biometricAuth: true,
          tenantSlug: tenantInfo.slug,
          targetPortal: 'MEMBER',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setTenantMemberSession(data.member, tenantInfo.slug, tenantInfo.name);
        if (data.isStaff || data.user?.isStaff) {
          setTenantAdminSession(data.user || data.member, tenantInfo.slug, tenantInfo.name);
        } else {
          clearTenantAdminSession(tenantInfo.slug);
        }
        router.push(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member?coop=${tenantInfo.slug}` : '/member');
        return;
      }

      setIsBioAuthenticating(false);
      setErrorMessage(data.error || 'Biometric authentication failed. Please enter your password manually.');
    } catch (err: any) {
      setIsBioAuthenticating(false);
      setErrorMessage('Unable to verify biometrics. Please use your password to sign in.');
    }
  };

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
        } else {
          clearTenantAdminSession(tenantInfo.slug);
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

          {hasBiometrics && biometricsMember && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isLoading || isBioAuthenticating}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2.5 shadow-md shadow-slate-900/10 text-xs cursor-pointer group"
              >
                {isBioAuthenticating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Touch ID / Face ID...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Sign In with Device Biometrics ({biometricsMember.name || 'Member'})</span>
                  </>
                )}
              </button>

              <div className="flex justify-between items-center px-1 text-[11px] text-slate-400">
                <span>Touch ID / Face ID saved</span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem(`flexcoop_biometrics_enabled_${tenantInfo.slug}`);
                      localStorage.removeItem(`flexcoop_biometrics_member_${tenantInfo.slug}`);
                      setHasBiometrics(false);
                      setBiometricsMember(null);
                      setErrorMessage('');
                    } catch {}
                  }}
                  className="text-slate-500 hover:text-rose-600 underline transition"
                >
                  Reset biometrics on this device
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or sign in with password</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
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
