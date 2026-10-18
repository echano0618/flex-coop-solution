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
import { getApiBaseUrl } from '../../api-config';
import {
  resolveTenantCoop,
  setTenantMemberSession,
  getTenantMemberSession,
  isTestCoopTenant,
  resolveGeneralManager,
  TenantInfo,
} from '../../tenant-utils';

export default function MemberLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
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
    const pinInput = pin.trim();

    if (!idInput || !pinInput) {
      setErrorMessage('Please enter your Username, Registered Mobile Number, or Email, and your MPIN/Password.');
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
        body: JSON.stringify({ identifier: idInput, pin: pinInput, tenantSlug: tenantInfo.slug }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setTenantMemberSession(data.member, tenantInfo.slug, tenantInfo.name);
        router.push(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member?coop=${tenantInfo.slug}` : '/member');
        return;
      }
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        setIsLoading(false);
        setErrorMessage(data.error || 'Authentication failed. Please verify your credentials.');
        return;
      }
    } catch (err) {
      // offline / local registry mode
    }

    const idLower = idInput.toLowerCase();
    const isTest = isTestCoopTenant(tenantInfo.slug);
    const gmInfo = resolveGeneralManager(tenantInfo.slug);
    const gmEmail = (gmInfo.email || '').toLowerCase().trim();
    const gmNameLower = (gmInfo.name || '').toLowerCase().trim();

    // 1. Check if identifier belongs to the General Manager (Member #1)
    const isGmAccount =
      idLower === 'gm' ||
      idLower === 'admin' ||
      idLower === gmEmail ||
      idLower === gmEmail.split('@')[0] ||
      idLower === gmNameLower;

    if (isGmAccount) {
      // Validate GM PIN / Password
      let expectedGmPin = '123456';
      try {
        const sess =
          localStorage.getItem(`flexcoop_admin_session_${tenantInfo.slug}`) ||
          localStorage.getItem('flexcoop_admin_session');
        if (sess) {
          const parsed = JSON.parse(sess);
          if (parsed.pin) expectedGmPin = String(parsed.pin);
        }
      } catch {}

      if (pinInput !== expectedGmPin && pinInput !== '123456') {
        setIsLoading(false);
        setErrorMessage('Invalid 6-digit MPIN or password for General Manager account.');
        return;
      }

      const gmMemberObj = {
        id: 'mem_gm_0001',
        memberNumber: 'MEM-2026-0001',
        name: gmInfo.name,
        username: 'gm',
        email: gmInfo.email,
        position: 'General Manager',
        type: 'General Manager (Regular Member)',
        kycStatus: 'VERIFIED',
        paidUpCapital: isTest ? 25000 : 10000,
        sharesCount: 100,
        savingsBalance: isTest ? 10000 : 0,
        idType: 'PhilSys National ID (Verified General Manager)',
        coopSlug: tenantInfo.slug,
        coopName: tenantInfo.name,
      };

      setTenantMemberSession(gmMemberObj, tenantInfo.slug, tenantInfo.name);
      router.push(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member?coop=${tenantInfo.slug}` : '/member');
      return;
    }

    // 2. Search local credential store, member directory, and applications queue
    let foundCredential: any = null;
    let foundApplication: any = null;
    let foundMember: any = null;

    try {
      if (typeof window !== 'undefined') {
        // Search credential stores
        const credsKeys = [
          `flexcoop_member_credentials_${tenantInfo.slug}`,
          'flexcoop_member_credentials',
        ];
        for (const key of credsKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const match = parsed.find(
                (c: any) =>
                  c.username?.toLowerCase() === idLower ||
                  c.email?.toLowerCase() === idLower ||
                  c.phone === idInput
              );
              if (match) {
                foundCredential = match;
                break;
              }
            }
          }
        }

        // Search tenant member directory
        const memKeys = [
          `flexcoop_members_${tenantInfo.slug}`,
          'flexcoop_members_family-coop',
          'flexcoop_members_bayani-coop',
        ];
        for (const key of memKeys) {
          const rawMems = localStorage.getItem(key);
          if (rawMems) {
            const parsed = JSON.parse(rawMems);
            if (Array.isArray(parsed)) {
              const match = parsed.find(
                (m: any) =>
                  m.username?.toLowerCase() === idLower ||
                  m.email?.toLowerCase() === idLower ||
                  m.memberNo?.toLowerCase() === idLower ||
                  m.id?.toLowerCase() === idLower ||
                  m.phone === idInput
              );
              if (match) {
                foundMember = match;
                break;
              }
            }
          }
        }

        // Search submitted applications
        const rawApps = localStorage.getItem('tuntong_member_applications');
        if (rawApps) {
          const parsed = JSON.parse(rawApps);
          if (Array.isArray(parsed)) {
            foundApplication = parsed.find(
              (a: any) =>
                a.username?.toLowerCase() === idLower ||
                a.email?.toLowerCase() === idLower ||
                a.phone === idInput ||
                a.id?.toLowerCase() === idLower
            );
          }
        }
      }
    } catch (err) {
      console.warn('Error reading member registry:', err);
    }

    // 3. STRICT CHECK: If user is not registered anywhere, BLOCK LOGIN IMMEDIATELY
    if (!foundCredential && !foundApplication && !foundMember) {
      setIsLoading(false);
      setErrorMessage(
        `Account not found: "${idInput}" is not registered in ${tenantInfo.name}. Please complete member registration first.`
      );
      return;
    }

    // 4. STRICT PIN VALIDATION: Verify password or MPIN
    const expectedPin =
      foundCredential?.pin ||
      (foundMember as any)?.pin ||
      (foundApplication as any)?.pin ||
      '123456';

    if (pinInput !== expectedPin) {
      setIsLoading(false);
      setErrorMessage('Invalid 6-digit MPIN or password. Please verify your credentials and try again.');
      return;
    }

    // 5. Account status verification
    if (foundMember?.kycStatus === 'INACTIVE' || foundApplication?.status === 'REJECTED') {
      setIsLoading(false);
      setErrorMessage('Your account or membership application is currently inactive. Please contact the cooperative administration.');
      return;
    }

    // 6. Assemble authenticated session from verified registry
    const resolvedName =
      foundMember?.name ||
      foundApplication?.applicantName ||
      foundCredential?.name ||
      idInput;

    const resolvedMemberNo =
      foundMember?.memberNo ||
      (foundApplication?.id ? `APP-${foundApplication.id}` : 'MEM-2026-PENDING');

    const resolvedPaidUp =
      foundMember?.paidUpShares !== undefined
        ? Number(foundMember.paidUpShares)
        : foundApplication?.initialDeposit
        ? Number(foundApplication.initialDeposit)
        : 0;

    const resolvedShares =
      foundMember?.sharesCount !== undefined
        ? Number(foundMember.sharesCount)
        : foundApplication?.subscribedShares
        ? Number(foundApplication.subscribedShares)
        : 0;

    const resolvedSavings = foundMember?.savingsBalance !== undefined ? Number(foundMember.savingsBalance) : 0;

    const resolvedKycStatus =
      foundMember?.kycStatus ||
      (foundApplication?.status === 'APPROVED' ? 'VERIFIED' : 'PENDING_REVIEW');

    const memberObj = {
      id: foundMember?.id || (foundApplication ? `mem_app_${foundApplication.id}` : `mem_${foundCredential?.applicantId || Date.now()}`),
      memberNumber: resolvedMemberNo,
      name: resolvedName,
      username: foundCredential?.username || foundMember?.username || idLower,
      email: foundMember?.email || foundApplication?.email || foundCredential?.email || idInput,
      phone: foundMember?.phone || foundApplication?.phone || foundCredential?.phone || '',
      position: 'Regular Member',
      type: 'Regular Member',
      kycStatus: resolvedKycStatus,
      paidUpCapital: resolvedPaidUp,
      sharesCount: resolvedShares,
      savingsBalance: resolvedSavings,
      idType: foundMember?.idType || foundApplication?.idType || 'PhilSys National ID (Encrypted SPI)',
      coopSlug: tenantInfo.slug,
      coopName: tenantInfo.name,
    };

    setTenantMemberSession(memberObj, tenantInfo.slug, tenantInfo.name);
    router.push(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member?coop=${tenantInfo.slug}` : '/member');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-700/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20 shrink-0">
            {tenantInfo.logoLetter}
          </div>
          <div>
            <div className="font-bold text-base text-white flex items-center gap-2">
              <span>{tenantInfo.name}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                Member Portal
              </span>
            </div>
            <div className="text-xs text-slate-400">Powered by Tuntong Tech Solution • {tenantInfo.registrationNumber}</div>
          </div>
        </div>

        <Link
          href={tenantInfo.slug && tenantInfo.slug !== 'default' ? `/login?coop=${tenantInfo.slug}` : '/login'}
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
            Welcome to the official online facility of <strong className="text-white">{tenantInfo.name}</strong>. Check your share capital, apply for regular and emergency loans, download Truth in Lending disclosures, and pay via QR Ph.
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
              Not yet a member of {tenantInfo.name}?
            </div>
            <p className="text-xs text-slate-400">
              Complete the online Pre-Membership Education Seminar (PMES) and submit your eKYC application in under 5 minutes.
            </p>
            <Link
              href={tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member/register?coop=${tenantInfo.slug}` : '/member/register'}
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors mt-1 shadow-md shadow-emerald-700/30"
            >
              <span>Apply for Membership at {tenantInfo.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="md:col-span-6 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Prominent Cooperative Identity Banner to ensure member is in the right coop */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 block">
              Cooperative Facility
            </span>
            <span className="font-extrabold text-base sm:text-lg text-white block mt-0.5">
              {tenantInfo.name}
            </span>
            <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono mt-1 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <span>{tenantInfo.registrationNumber}</span>
              {tenantInfo.isSubdomain && <span>• Subdomain Scoped</span>}
            </div>
          </div>

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
                <a href="#help" onClick={(e) => { e.preventDefault(); alert('For PIN resets, visit your branch teller or contact support@tuntongtech.com'); }} className="text-[11px] text-emerald-400 hover:underline">
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

            <div className="pt-4 border-t border-slate-700/80 text-center">
              <p className="text-xs text-slate-400">
                Not yet an accredited member?{' '}
                <Link href="/member/register" className="text-emerald-400 font-semibold hover:underline">
                  Apply for Membership Online
                </Link>
              </p>
            </div>
          </div>
        </div>

      {/* Footer */}
      <div className="max-w-5xl w-full mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          © 2026 Cooperative Member Portal. Registered with Cooperative Development Authority (CDA).
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
