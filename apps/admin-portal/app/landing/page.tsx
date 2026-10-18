'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Landmark,
  Users,
  CreditCard,
  Sparkles,
  HelpCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  ChevronRight,
  Layers,
  Shield,
  BookOpen,
  QrCode,
  Lock,
  Scale,
  Database,
  FileCheck,
} from 'lucide-react';
import { getApiBaseUrl } from '../api-config';

interface CooperativeItem {
  id: string;
  name: string;
  slug: string;
  cdaRegistrationNumber: string;
  tin?: string;
  address?: string;
  coopType?: string;
  status?: string;
}

export default function CooperativeLandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [cooperatives, setCooperatives] = useState<CooperativeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch approved live cooperatives from API and localStorage
  useEffect(() => {
    const fetchCoops = async () => {
      setIsLoading(true);
      const itemsMap = new Map<string, CooperativeItem>();

      try {
        const res = await fetch(`${getApiBaseUrl()}/tenants`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            json.data.forEach((t: any) => {
              if (t.slug) {
                itemsMap.set(t.slug, {
                  id: t.id || `tenant_${t.slug}`,
                  name: t.name,
                  slug: t.slug,
                  cdaRegistrationNumber: t.cdaRegistrationNumber || 'CDA Registered',
                  tin: t.tin,
                  address: t.address || 'Philippines',
                  coopType: t.coopType || 'Multi-Purpose',
                  status: t.status || 'ACTIVE',
                });
              }
            });
          }
        }
      } catch (err) {
        console.warn('API fetch for cooperatives fallback:', err);
      } finally {
        setIsLoading(false);
      }

      // Check localStorage for approved registrations
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('tuntong_coop_registrations');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              parsed
                .filter((r: any) => r.status === 'APPROVED' && r.slug)
                .forEach((r: any) => {
                  if (!itemsMap.has(r.slug)) {
                    itemsMap.set(r.slug, {
                      id: r.id || `reg_${r.slug}`,
                      name: r.name,
                      slug: r.slug,
                      cdaRegistrationNumber: r.cdaRegistrationNumber || 'CDA Registered',
                      tin: r.tin,
                      address: r.address || 'Philippines',
                      coopType: r.coopType || 'Multi-Purpose',
                      status: 'ACTIVE',
                    });
                  }
                });
            }
          }
        }
      } catch (e) {
        console.error(e);
      }

      setCooperatives(Array.from(itemsMap.values()));
    };

    fetchCoops();
  }, []);

  // Filter cooperatives based on search query
  const filteredCooperatives = useMemo(() => {
    if (!searchQuery.trim()) {
      return cooperatives;
    }
    const q = searchQuery.toLowerCase().trim();
    return cooperatives.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.cdaRegistrationNumber && c.cdaRegistrationNumber.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.coopType && c.coopType.toLowerCase().includes(q))
    );
  }, [searchQuery, cooperatives]);

  // Construct URLs dynamically for subdomain or path routing
  const getMemberPortalUrl = (coopSlug: string) => {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      if (host.includes('tuntongtech.com')) {
        return `https://${coopSlug}-coop.tuntongtech.com/member/login`;
      }
      return `/member/login?coop=${coopSlug}`;
    }
    return `/member/login?coop=${coopSlug}`;
  };

  const getAdminPortalUrl = (coopSlug: string) => {
    if (typeof window !== 'undefined') {
      const host = window.location.host;
      if (host.includes('tuntongtech.com')) {
        return `https://${coopSlug}-coop.tuntongtech.com/login`;
      }
      return `/login?coop=${coopSlug}`;
    }
    return `/login?coop=${coopSlug}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base text-white">
                Coop Solution
              </div>
              <div className="text-[11px] text-slate-400">Powered by Tuntong Tech</div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <a
              href="#directory"
              className="hidden lg:flex items-center text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <span>Directory</span>
            </a>

            <a
              href="#privacy"
              className="hidden md:flex items-center text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <span>Privacy Policy</span>
            </a>

            <a
              href="#terms"
              className="hidden md:flex items-center text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <span>Terms of Service</span>
            </a>

            <a
              href="https://cda.gov.ph"
              target="_blank"
              rel="noreferrer"
              className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <span>CDA Website</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://tuntongtech.com"
              target="_blank"
              rel="noreferrer"
              className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <span>Tuntong Tech</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <Link
              href="/coop-register"
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <span>Register Cooperative</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800/80">
        {/* Glow ambient backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -top-10 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Philippine Cooperative Digital Banking &amp; Regulatory Cloud</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Find your cooperative &amp; manage your savings, loans &amp; passbook online.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to the official Tuntong Tech Cooperative Portal. Search for your accredited cooperative below to access your digital member passbook, apply for loans, or access the administrative control plane.
          </p>

          {/* Quick Regulatory Pillars */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CDA MC 2015-06 Double Entry Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>NPC Data Privacy Act (RA 10173) Certified</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 SPI Encryption</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COOPERATIVE SEARCH & DIRECTORY SECTION */}
      <section id="directory" className="py-12 sm:py-16 px-4 max-w-7xl mx-auto w-full space-y-8 flex-1">
        {/* Search Header */}
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase text-emerald-400 tracking-wider font-bold">
            <Search className="w-3.5 h-3.5" />
            <span>Cooperative Directory Lookup</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Select Your Cooperative
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Type the name of your cooperative, municipality, province, or CDA registration number.
          </p>

          {/* Search Input Bar */}
          <div className="relative mt-2">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Bayani, Tagumpay, Calamba, CDA-NCR..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 shadow-xl transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Search Results Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredCooperatives.length}</strong> accredited{' '}
              {filteredCooperatives.length === 1 ? 'cooperative' : 'cooperatives'}
            </span>
            {searchQuery && (
              <span className="text-slate-500">
                Filtered by: &ldquo;<strong className="text-emerald-400">{searchQuery}</strong>&rdquo;
              </span>
            )}
          </div>

          {filteredCooperatives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCooperatives.map((coop) => (
                <div
                  key={coop.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-lg hover:shadow-emerald-950/20 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-emerald-950/60 border border-slate-700 group-hover:border-emerald-600/50 flex items-center justify-center text-emerald-400 shrink-0 transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        {coop.coopType || 'Accredited Coop'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-emerald-300 transition-colors">
                        {coop.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                        <span className="text-emerald-400 font-semibold">{coop.cdaRegistrationNumber}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{coop.address || 'Philippines'}</span>
                    </div>
                  </div>

                  {/* Action Buttons for this Coop */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-2">
                    <a
                      href={getMemberPortalUrl(coop.slug)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-700/20"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Member Portal Login</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </a>

                    <a
                      href={getAdminPortalUrl(coop.slug)}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Staff / Admin Sign In</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-base">
                  {searchQuery ? `No cooperative found matching "${searchQuery}"` : 'No accredited cooperatives registered yet'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {searchQuery
                    ? 'Is your cooperative not registered yet? Submit your cooperative application online today to join the multi-tenant network.'
                    : 'Be the first to onboard your cooperative on the platform and launch your digital member banking experience.'}
                </p>
              </div>
              <Link
                href="/coop-register"
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl transition shadow-md shadow-emerald-700/30"
              >
                <span>Register Cooperative</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. NEW COOPERATIVE REGISTRATION SECTION */}
      <section className="py-14 sm:py-20 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-t border-b border-slate-800/80 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
              <Layers className="w-3.5 h-3.5" />
              <span>Digital Cooperative Transformation</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Modernize your cooperative operations with Tuntong Tech Solution
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Empower your officers and members with an automated, regulatory-compliant ERP. Includes statutory CDA chart of accounts, automated loan underwriting with diminishing balance, PayMongo QR Ph member deposits, and full NPC data privacy compliance.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">CDA Standard Chart of Accounts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Loan Origination &amp; Amortization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Member Passbook &amp; QR Ph Deposits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Strict Dual-Control RBAC Security</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 space-y-5 text-center shadow-2xl backdrop-blur">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Building2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white text-lg">Onboard Your Cooperative</h3>
              <p className="text-xs text-slate-400">
                Submit your CDA certificate, TIN, and primary administrator details for operator onboarding.
              </p>
            </div>

            <Link
              href="/coop-register"
              className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Start Cooperative Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-[11px] text-slate-500">
              No setup fee. 100 free members included on registration.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY POLICY SECTION */}
      <section id="privacy" className="py-16 sm:py-24 px-4 max-w-7xl mx-auto w-full space-y-10 border-t border-slate-800/80 scroll-mt-20">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Republic Act No. 10173 • National Privacy Commission (NPC)</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Privacy Policy &amp; Data Protection Protocol
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            This Privacy Policy governs the processing, encryption, and protection of member personal information and sensitive financial records across all tenant cooperatives operating within the Flex Coop Solution cloud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Legal Framework & Roles */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. Legal Basis &amp; Entity Roles</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with RA 10173 (Data Privacy Act of 2012) and NPC Circulars:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li><strong className="text-slate-200">Personal Information Controller (PIC):</strong> The subscribing cooperative maintains autonomous ownership and controller responsibility for member and officer data.</li>
              <li><strong className="text-slate-200">Personal Information Processor (PIP):</strong> Tuntong Tech Solution operates the multi-tenant cloud infrastructure under strict organizational and technical safeguards.</li>
            </ul>
          </div>

          {/* Card 2: Sensitive Personal Information Collected */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Scope of Data Collected</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We process data necessary for cooperative banking and statutory compliance:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li><strong className="text-slate-200">KYC &amp; Identification:</strong> Full legal name, birth date, civil status, Tax Identification Number (TIN), PhilSys Card Number / Government IDs, and proof of address.</li>
              <li><strong className="text-slate-200">PMES Undertakings:</strong> Pre-Membership Education Seminar records, biometric photo verification, and designated beneficiaries.</li>
              <li><strong className="text-slate-200">Subsidiary Ledgers:</strong> Share capital subscriptions, savings, time deposits, loan contracts, and official payment receipts.</li>
            </ul>
          </div>

          {/* Card 3: Lawful Purpose of Processing */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. Lawful Purpose &amp; Processing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Member information is processed strictly for legitimate operational purposes:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li>Maintenance of the Official Cooperative Member Masterlist pursuant to CDA Article 26 of RA 9520.</li>
              <li>Autonomous credit scoring, loan underwriting, and diminishing balance amortization calculations.</li>
              <li>Anti-Money Laundering Council (AMLC) risk screening and compliance under Republic Act No. 9160.</li>
              <li>Reconciliation of double-entry financial journals pursuant to CDA MC 2015-06.</li>
            </ul>
          </div>

          {/* Card 4: Cryptographic Security & RBAC */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">4. Encryption &amp; Security Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise-grade defense-in-depth safeguards protecting every transaction:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li><strong className="text-slate-200">AES-256-GCM Encryption:</strong> Sensitive Personal Information (PhilSys numbers, government IDs) is encrypted at rest at the field level.</li>
              <li><strong className="text-slate-200">TLS 1.3 in Transit:</strong> All API and web communications enforce TLS 1.3 transport security.</li>
              <li><strong className="text-slate-200">Multi-Tenant Isolation:</strong> Strict logical tenant barriers prevent cross-tenant data leakage.</li>
              <li><strong className="text-slate-200">Dual-Control RBAC:</strong> Least-privilege access enforced across General Manager, Loan Officer, Cashier, and BOD roles.</li>
            </ul>
          </div>

          {/* Card 5: Member Rights Under RA 10173 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">5. Member Data Subject Rights</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cooperative members exercise full statutory rights under Section 16 of RA 10173:
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li><strong className="text-slate-200">Right to Access:</strong> View your digital member passbook, share capital, and loan ledgers in real time.</li>
              <li><strong className="text-slate-200">Right to Rectification:</strong> Request correction of inaccurate personal records through your cooperative administrator.</li>
              <li><strong className="text-slate-200">Right to Erasure:</strong> Request data deletion for non-statutory records, subject to mandatory 10-year financial audit holds.</li>
              <li><strong className="text-slate-200">Right to Redress:</strong> File complaints directly with the National Privacy Commission (privacy.gov.ph).</li>
            </ul>
          </div>

          {/* Card 6: Retention & DPO Contact */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-emerald-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">6. Statutory Retention &amp; DPO</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Financial journals, subsidiary ledgers, and official receipts are retained for a minimum of ten (10) years as mandated by CDA and BIR rules.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs">
              <div className="text-slate-300 font-semibold">Data Protection Officer (DPO) Contact:</div>
              <div className="text-emerald-400 font-mono">privacy@tuntongtech.com</div>
              <div className="text-[11px] text-slate-500">Tuntong Tech Solution • Manila, Philippines</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TERMS OF SERVICE SECTION */}
      <section id="terms" className="py-16 sm:py-24 px-4 max-w-7xl mx-auto w-full space-y-10 border-t border-slate-800/80 scroll-mt-20">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Landmark className="w-4 h-4 text-indigo-400" />
            <span>Republic Act No. 9520 • CDA MC 2015-06 Accounting Standard</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Terms of Service &amp; Platform Governance
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            These Terms of Service govern the onboarding, operational boundaries, double-entry ledger integrity, and digital banking rails for all cooperatives subscribing to the Flex Coop Solution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Term 1: Statutory Governance */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. Statutory Governance &amp; CDA Law</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Flex Coop Solution operates in strict compliance with Republic Act No. 9520 (Philippine Cooperative Code of 2008), Cooperative Development Authority (CDA) Memorandum Circulars, and the regulatory frameworks of the Republic of the Philippines.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribing cooperatives warrant that all operations on this platform conform to their registered Articles of Cooperation and By-Laws.
            </p>
          </div>

          {/* Term 2: SaaS Boundary & Fiduciary Autonomy */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Technology Provider Boundary</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tuntong Tech Solution provides multi-tenant cloud software infrastructure. Tuntong Tech is a technology provider, not a cooperative, bank, or depository financial institution.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Each subscribing cooperative maintains exclusive fiduciary control, financial sovereignty, and legal liability over its member capital, loan approvals, interest rates, and statutory CDA reporting.
            </p>
          </div>

          {/* Term 3: Cooperative Accreditation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. Onboarding &amp; Accreditation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Eligibility to operate a tenant on this platform requires a valid CDA Registration Certificate and a BIR Tax Identification Number (TIN).
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              General Managers declared during onboarding represent that they are duly authorized by their Board of Directors. The platform reserves the right to suspend any tenant involved in fraudulent activities.
            </p>
          </div>

          {/* Term 4: Immutable Accounting & Non-Repudiation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">4. Immutable Double-Entry Ledger</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pursuant to CDA MC 2015-06, all transactions enforce standard double-entry bookkeeping. General ledger journal entries, invoices, and official receipts are immutable once committed.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct modification or retroactive deletion of posted entries is strictly prohibited. Corrections must be recorded via audited adjusting journal entries.
            </p>
          </div>

          {/* Term 5: Truth in Lending & Diminishing Balance */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">5. Loan Underwriting &amp; Dual Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In accordance with RA 3765 (Truth in Lending Act), all loan facilities disclose total finance charges and amortization schedules calculated strictly on a diminishing balance basis.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dual-control governance is mandatory: Loan Officers underwrite, Credit Committee members recommend, the Board of Directors approves, and Cashiers execute disbursements.
            </p>
          </div>

          {/* Term 6: Payment Settlement & Escrow Float */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-indigo-500/30 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">6. QR Ph Rails &amp; Escrow Float</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Member digital deposits and loan repayments utilize BSP-regulated payment networks (PayMongo QR Ph).
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              To guarantee real-time settlement and SMS notification delivery, cooperatives must maintain an active escrow/settlement balance (minimum ₱1,000 platform credit threshold).
            </p>
          </div>
        </div>
      </section>

      {/* 7. REGULATORY PARTNERS & RELATED LINKS SECTION */}
      <section className="py-12 sm:py-16 px-4 max-w-7xl mx-auto w-full space-y-8 border-t border-slate-800/80">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono uppercase text-indigo-400 font-bold tracking-wider">
            Institutional Governance &amp; Regulatory Partners
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">Related Official Portals</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* CDA Link Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                  Regulatory Agency
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Cooperative Development Authority (CDA)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The sole government agency of the Republic of the Philippines mandated to register, regulate, and supervise cooperatives under Republic Act No. 9520.
              </p>
            </div>

            <a
              href="https://cda.gov.ph"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-700"
            >
              <span>Visit Official CDA Website (cda.gov.ph)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tuntong Tech Link Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Platform Technology Provider
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Tuntong Tech Solution</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Architect and operator of the Flex Coop multi-tenant platform, engineering high-availability core banking and statutory compliance software for Philippine financial institutions.
              </p>
            </div>

            <a
              href="https://tuntongtech.com"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition border border-slate-700"
            >
              <span>Visit Tuntong Tech (tuntongtech.com)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>© 2026 Tuntong Tech Solution • Built for Philippine Cooperatives compliant with CDA RA 9520 &amp; NPC RA 10173</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a href="#directory" className="hover:text-slate-300 transition">
              Directory
            </a>
            <span>•</span>
            <a href="#privacy" className="hover:text-slate-300 transition">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="#terms" className="hover:text-slate-300 transition">
              Terms of Service
            </a>
            <span>•</span>
            <a href="https://cda.gov.ph" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">
              CDA Portal
            </a>
            <span>•</span>
            <a href="https://tuntongtech.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">
              Tuntong Tech
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
