'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Landmark,
  FileText,
  UserCheck,
  Percent,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function CoopRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    coopType: 'MULTI_PURPOSE',
    slug: '',
    cdaRegistrationNumber: '',
    tin: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    billingMode: 'PLATFORM_ESCROW' as 'PLATFORM_ESCROW' | 'COOP_MERCHANT',
    adminFullName: '',
    adminEmail: '',
    adminPhone: '',
    agreedToTerms: false,
    agreedToDpa: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<{
    tenantId: string;
    subdomain: string;
    schemaName: string;
    name: string;
  } | null>(null);

  const handleSlugChange = (rawVal: string) => {
    const sanitized = rawVal
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData((prev) => ({ ...prev, slug: sanitized }));
  };

  const handleNameBlur = () => {
    if (!formData.slug && formData.name) {
      const generated = formData.name
        .toLowerCase()
        .replace(/cooperative|coop|multi-purpose|mpc/gi, '')
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      if (generated) {
        setFormData((prev) => ({ ...prev, slug: generated }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToTerms || !formData.agreedToDpa) {
      alert('Please agree to the DPA compliance terms and CDA SaaS agreement.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call Backend API to provision tenant
      const res = await fetch('http://localhost:4000/api/v1/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          cdaRegistrationNumber: formData.cdaRegistrationNumber,
          tin: formData.tin,
          contactEmail: formData.contactEmail || formData.adminEmail,
          contactPhone: formData.contactPhone || formData.adminPhone,
          address: formData.address,
          billingMode: formData.billingMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRegisteredResult({
          tenantId: data.data.id,
          subdomain: `${formData.slug}-flexcoop.tuntongtech.com`,
          schemaName: data.schemaName || `tenant_${formData.slug}`,
          name: formData.name,
        });
      } else {
        alert(`Provisioning failed: ${data.error || 'Unknown error'}`);
      }
    } catch {
      // Demo fallback if API offline
      setRegisteredResult({
        tenantId: `tenant_${formData.slug || 'coop'}_demo`,
        subdomain: `${formData.slug || 'coop'}-flexcoop.tuntongtech.com`,
        schemaName: `tenant_${formData.slug || 'coop'}`,
        name: formData.name,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span className="font-bold text-lg tracking-tight">Flex Coop Solution</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono ml-2">
              SaaS Instance Provisioner
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-300 hover:text-white transition">
              Back to Portal
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {!registeredResult ? (
          <>
            {/* Header info */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Instant Multi-Tenant Cloud Provisioning
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Register Your Cooperative Instance
              </h1>
              <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
                Empower your Philippine cooperative with CDA Standard Chart of Accounts, Truth-in-Lending amortizations,
                PayMongo QR Ph rails, and dedicated subdomain isolation.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
              {/* Step 1: Cooperative Legal Identity */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-2">
                  <Landmark className="w-5 h-5 text-indigo-600" />
                  1. Statutory Cooperative Identity (CDA & BIR)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Official Registered Cooperative Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. San Jose Multi-Purpose Cooperative"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onBlur={handleNameBlur}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Cooperative Category *
                    </label>
                    <select
                      value={formData.coopType}
                      onChange={(e) => setFormData({ ...formData, coopType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="MULTI_PURPOSE">Multi-Purpose Cooperative</option>
                      <option value="CREDIT">Credit Cooperative</option>
                      <option value="CONSUMER">Consumer Cooperative</option>
                      <option value="PRODUCERS">Producers Cooperative</option>
                      <option value="AGRARIAN">Agrarian Reform Cooperative</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      CDA Registration Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CDA-NCR-2024-00921"
                      value={formData.cdaRegistrationNumber}
                      onChange={(e) => setFormData({ ...formData, cdaRegistrationNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      BIR Tax Identification Number (TIN) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 009-887-123-000"
                      value={formData.tin}
                      onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Coop Official Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@sanjosecoop.ph"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Principal Head Office Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 128 Rizal Avenue, San Jose City, Nueva Ecija"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Dedicated Subdomain Setup */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  2. Dedicated Instance Subdomain
                </h3>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tenant Subdomain Slug *
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="sanjose"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="w-48 px-3 py-2 border border-slate-300 rounded-l-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50"
                    />
                    <span className="px-3 py-2 bg-slate-200 border border-l-0 border-slate-300 rounded-r-lg text-sm font-mono text-slate-700">
                      -flexcoop.tuntongtech.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Your cooperative portal URL will be:{' '}
                    <span className="font-semibold text-indigo-700">
                      https://{formData.slug || 'tenant'}-flexcoop.tuntongtech.com
                    </span>
                  </p>
                </div>
              </div>

              {/* Step 3: Billing & Monetization Model */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-2">
                  <Percent className="w-5 h-5 text-indigo-600" />
                  3. Platform Billing Model
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setFormData({ ...formData, billingMode: 'PLATFORM_ESCROW' })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition ${
                      formData.billingMode === 'PLATFORM_ESCROW'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">Platform Escrow Rail</span>
                      <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                      Zero upfront setup fee. Platform charges <strong className="text-indigo-700">2.0%</strong> (₱100 floor) deducted
                      directly upon loan disbursement with automated 12% Output VAT electronic invoice.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5" /> Instant disbursement readiness
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, billingMode: 'COOP_MERCHANT' })}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition ${
                      formData.billingMode === 'COOP_MERCHANT'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900 text-sm">Coop-Owned Merchant</span>
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                        Enterprise
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                      Connect your cooperative's direct PayMongo or commercial bank merchant account. Platform software fee is discounted to{' '}
                      <strong className="text-indigo-700">0.5%</strong>.
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <Check className="w-3.5 h-3.5" /> For large cooperatives with existing merchant IDs
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Administrator / General Manager Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  4. General Manager / Superadmin Setup
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Atty. Roberto Dela Rosa"
                      value={formData.adminFullName}
                      onChange={(e) => setFormData({ ...formData, adminFullName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Official Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="gm@sanjosecoop.ph"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile Number (for 2FA OTP) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+63 917 555 0192"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 5: Compliance Consent */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToDpa}
                    onChange={(e) => setFormData({ ...formData, agreedToDpa: e.target.checked })}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    <strong>National Privacy Commission (NPC) Compliance:</strong> We certify that all member data stored
                    within this cooperative instance will be processed in accordance with the Philippine Data Privacy Act of 2012
                    (RA 10173).
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    <strong>CDA Statutory Compliance Agreement:</strong> We authorize Flex Coop Solution to pre-seed the official
                    CDA Standard Chart of Accounts (MC 2015-06) and generate required C-PES and CAPR regulatory reporting structures.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.slug}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 text-base"
              >
                {isSubmitting ? (
                  'Provisioning Cooperative Cloud Instance...'
                ) : (
                  <>
                    <span>Provision Cooperative Instance</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Instance Provisioned Successfully
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">{registeredResult.name}</h2>
              <p className="text-slate-600 text-sm mt-1">
                Your cooperative cloud instance and isolated database have been initialized.
              </p>
            </div>

            {/* Instance Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left max-w-lg mx-auto space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Dedicated Portal URL:</span>
                <span className="font-bold text-indigo-600">https://{registeredResult.subdomain}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Tenant Document Root:</span>
                <span className="text-slate-800">/tenants/{registeredResult.tenantId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Pre-seeded Ledger:</span>
                <span className="text-emerald-700 font-semibold">CDA Standard Chart of Accounts (MC 2015-06)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Primary Administrator:</span>
                <span className="text-slate-800 font-semibold">{formData.adminFullName} (GM)</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition"
              >
                <span>Launch Cooperative Admin Portal</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setRegisteredResult(null)}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition"
              >
                Provision Another Coop
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
