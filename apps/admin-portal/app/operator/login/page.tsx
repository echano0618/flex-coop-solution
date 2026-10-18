'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Shield,
  ShieldCheck,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from 'lucide-react';
import { getApiBaseUrl } from '../../api-config';
import type { OperatorSession } from '@flexcoop/shared-types';

export default function OperatorLoginPage() {
  const router = useRouter();
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [authStep, setAuthStep] = useState<'IDENTIFIER' | 'OTP'>('IDENTIFIER');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // If already logged in, redirect straight to /operator
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tuntong_operator_session');
      if (stored) {
        const parsed: OperatorSession = JSON.parse(stored);
        if (parsed && parsed.token && new Date(parsed.expiresAt).getTime() > Date.now()) {
          router.replace('/operator');
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
  }, [router]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authIdentifier.trim()) {
      setAuthError('Please enter your operator username or email.');
      return;
    }

    setAuthError(null);
    setAuthSuccessMsg(null);
    setIsSendingOtp(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: authIdentifier.trim() }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setAuthError(`Server error (${res.status}). Please try again.`);
        return;
      }

      if (!res.ok || !data.success) {
        setAuthError(
          data.error === 'OPERATOR_NOT_FOUND'
            ? 'Invalid operator credentials. Access denied.'
            : (data.error || 'Failed to dispatch One-Time PIN.')
        );
        return;
      }

      setAuthStep('OTP');
      setAuthSuccessMsg('A 6-digit One-Time PIN has been dispatched to the registered operator email.');
    } catch (err: any) {
      console.error(err);
      setAuthError('Connection error contacting Tuntong Tech Auth Service. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpInput.trim()) {
      setAuthError('Please enter the 6-digit PIN sent to your email.');
      return;
    }

    setAuthError(null);
    setIsVerifyingOtp(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrEmail: authIdentifier.trim(),
          otp: otpInput.trim(),
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setAuthError(`Server error (${res.status}). Please try again.`);
        return;
      }

      if (!res.ok || !data.success) {
        setAuthError(data.error || 'Invalid or expired PIN. Please try again.');
        return;
      }

      // Store authenticated session
      if (typeof window !== 'undefined') {
        localStorage.setItem('tuntong_operator_session', JSON.stringify(data.session));
        document.cookie = `tuntong_operator_session=${encodeURIComponent(data.session.token)}; path=/; max-age=86400; SameSite=Lax`;
      }

      router.push('/operator');
    } catch (err: any) {
      console.error(err);
      setAuthError('Verification service error. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient aesthetic background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand & Security Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 flex items-center justify-center text-white font-black shadow-xl shadow-indigo-500/20 mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-mono font-bold tracking-wider uppercase mt-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Operator Control Plane</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tuntong Tech Solution</h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            SaaS Multi-Tenant Fleet &amp; Infrastructure Control. Passwordless sign-in via email One-Time PIN.
          </p>
        </div>

        {/* Operator Authentication Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur space-y-5">
          {/* Error Notification */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {/* Success Notification */}
          {authSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-600/50 text-emerald-200 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{authSuccessMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Username/Email */}
          {authStep === 'IDENTIFIER' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Operator Username or Email</label>
                <input
                  type="text"
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  placeholder="Enter operator username or email"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 transition-colors"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-500">
                  A 6-digit One-Time PIN will be dispatched to your authorized email address.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending PIN...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send One-Time Sign-In PIN</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Enter 6-digit PIN */
            <div className="space-y-4">
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Enter 6-Digit One-Time PIN</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('IDENTIFIER');
                        setOtpInput('');
                        setAuthError(null);
                      }}
                      className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors underline"
                    >
                      Change Username
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3.5 py-3 text-center font-mono text-2xl font-black tracking-[0.4em] text-emerald-400 placeholder-slate-700 transition-colors"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 text-center">
                    Please enter the 6-digit PIN dispatched to your email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpInput.length < 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying PIN...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify PIN &amp; Access Portal</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={isSendingOtp}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                  <span>Resend New PIN</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-300 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Coop Admin Portal</span>
            </Link>
            <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">
              v1.0.0 Prod
            </span>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Fiduciary Operator Session • Encrypted with TLS 1.3</span>
        </div>
      </div>
    </div>
  );
}
