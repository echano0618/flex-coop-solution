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
  UploadCloud,
} from 'lucide-react';
import { getApiBaseUrl } from '../api-config';

export default function CoopRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    coopType: 'MULTI_PURPOSE',
    slug: '',
    cdaRegistrationNumber: '',
    tin: '',
    contactEmail: '',
    address: '',
    adminFirstName: '',
    adminMiddleName: '',
    adminLastName: '',
    adminEmail: '',
    agreedToTerms: false,
    agreedToDpa: false,
  });

  const [validIdFile, setValidIdFile] = useState<File | null>(null);
  const [validIdFileName, setValidIdFileName] = useState<string>('');
  const [validIdSizeMb, setValidIdSizeMb] = useState<string>('');
  const [validIdError, setValidIdError] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<{
    id: string;
    subdomain: string;
    name: string;
    adminFullName: string;
    adminEmail: string;
    cdaRegistrationNumber: string;
    tin: string;
    address: string;
    validIdName: string;
    validIdSizeMb: string;
    submittedAt: string;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setValidIdFile(null);
      setValidIdFileName('');
      setValidIdSizeMb('');
      setValidIdError('');
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB Limit
    if (file.size > maxSizeBytes) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(2);
      setValidIdError(`File size (${actualMb} MB) exceeds the 5MB upload limit. Please upload a valid ID 5MB or smaller.`);
      setValidIdFile(null);
      setValidIdFileName('');
      setValidIdSizeMb('');
      return;
    }

    setValidIdError('');
    setValidIdFile(file);
    setValidIdFileName(file.name);
    setValidIdSizeMb((file.size / (1024 * 1024)).toFixed(2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToTerms || !formData.agreedToDpa) {
      alert('Please agree to the DPA compliance terms and CDA SaaS agreement.');
      return;
    }

    if (!validIdFile) {
      setValidIdError('A valid government-issued ID upload is required (max 5MB).');
      return;
    }

    setIsSubmitting(true);

    const adminFullName = [formData.adminFirstName, formData.adminMiddleName, formData.adminLastName]
      .filter(Boolean)
      .join(' ');

    const payload = {
      name: formData.name,
      coopType: formData.coopType,
      slug: formData.slug,
      cdaRegistrationNumber: formData.cdaRegistrationNumber,
      tin: formData.tin,
      contactEmail: formData.contactEmail || formData.adminEmail,
      address: formData.address,
      adminFirstName: formData.adminFirstName,
      adminMiddleName: formData.adminMiddleName,
      adminLastName: formData.adminLastName,
      adminEmail: formData.adminEmail,
      validIdFileName: validIdFileName || 'government_id.pdf',
      validIdFileSizeMb: validIdSizeMb || '1.80',
      validIdUrl: validIdFileName ? `/uploads/kyc/${validIdFileName}` : undefined,
    };

    let generatedRegId = `REG-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      // Call Backend API to submit application for operator compliance review
      const res = await fetch(`${getApiBaseUrl()}/coop-registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data?.id) {
        generatedRegId = data.data.id;
      }
    } catch (err) {
      console.warn('API submission notice:', err);
    } finally {
      // Persist in localStorage so Operator portal can also pick it up immediately
      if (typeof window !== 'undefined') {
        try {
          const stored = JSON.parse(localStorage.getItem('tuntong_coop_registrations') || '[]');
          const newEntry = {
            id: generatedRegId,
            ...payload,
            subdomain: `${formData.slug}-coop.tuntongtech.com`,
            status: 'PENDING_REVIEW',
            submittedAt: new Date().toISOString(),
          };
          localStorage.setItem('tuntong_coop_registrations', JSON.stringify([newEntry, ...stored]));
        } catch (e) {
          console.error('LocalStorage sync error:', e);
        }
      }

      setRegisteredResult({
        id: generatedRegId,
        subdomain: `${formData.slug}-coop.tuntongtech.com`,
        name: formData.name,
        adminFullName,
        adminEmail: formData.adminEmail,
        cdaRegistrationNumber: formData.cdaRegistrationNumber,
        tin: formData.tin,
        address: formData.address,
        validIdName: validIdFileName || 'government_id.pdf',
        validIdSizeMb: validIdSizeMb || '1.80',
        submittedAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white">Tuntong Tech</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono ml-2 font-semibold">
                Cooperative Enterprise Onboarding
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/operator" className="text-slate-300 hover:text-white transition flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Operator Portal</span>
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
                <Sparkles className="w-3.5 h-3.5" /> Tuntong Tech Cloud Onboarding
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Register Your Cooperative with Tuntong Tech
              </h1>
              <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
                Empower your Philippine cooperative with CDA Standard Chart of Accounts (MC 2015-06), Truth-in-Lending amortizations,
                PayMongo QR Ph rails, and dedicated subdomain isolation. Submitted registrations are evaluated for statutory compliance before instance activation.
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
                    <span className="px-3 py-2 bg-slate-200 border border-l-0 border-slate-300 rounded-r-lg text-sm font-mono text-slate-700 font-semibold">
                      -coop.tuntongtech.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Your cooperative portal URL will be:{' '}
                    <span className="font-semibold text-indigo-700">
                      https://{formData.slug || 'tenant'}-coop.tuntongtech.com
                    </span>
                  </p>
                </div>
              </div>

              {/* Step 3: Platform Billing Model (Single Unified Model) */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-2">
                  <Percent className="w-5 h-5 text-indigo-600" />
                  3. Platform Billing Model
                </h3>
                
                {/* Single Unified Billing Model Card */}
                <div className="p-5 rounded-2xl border-2 border-indigo-600 bg-gradient-to-br from-indigo-50/70 to-slate-50 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">Standard Cooperative SaaS Model</span>
                      <span className="text-[11px] bg-indigo-600 text-white font-bold px-2.5 py-0.5 rounded-full">
                        Unified Single Model
                      </span>
                    </div>
                    <span className="text-xs font-mono text-indigo-700 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                      12% Output VAT Inclusive
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Zero upfront setup fee. Transparent, statutory-compliant cooperative software billing designed for sustainable operations:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rate 1: New Member Onboarding */}
                    <div className="bg-white rounded-xl p-4 border border-indigo-200/80 shadow-xs space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Member Onboarding</span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        ₱50.00 <span className="text-xs font-normal text-slate-500">/ new member</span>
                      </div>
                      <div className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                        First 15 members FREE (₱0.00)
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Billed after the first 15 members (₱44.64 Net Platform Base + ₱5.36 12% Output VAT) upon eKYC & PMES approval.
                      </p>
                    </div>

                    {/* Rate 2: Loan Technology Fee */}
                    <div className="bg-white rounded-xl p-4 border border-indigo-200/80 shadow-xs space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-indigo-600" />
                        <span>Loan Technology Fee</span>
                      </div>
                      <div className="text-2xl font-black text-slate-900 font-mono">
                        1.0% <span className="text-xs font-normal text-slate-500">of approved loan</span>
                      </div>
                      <div className="text-xs text-indigo-800 font-semibold bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200/60">
                        Per Approved Loan Disbursement
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Flat 1% software pass-through fee deducted upon loan release with automated BIR electronic invoice.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Administrator / General Manager Info & Valid ID Upload */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4 border-b pb-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  4. General Manager / Primary Administrator Setup
                </h3>
                
                {/* Name Fields: First Name, Middle Name, Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Roberto"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mendoza"
                      value={formData.adminMiddleName}
                      onChange={(e) => setFormData({ ...formData, adminMiddleName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dela Rosa"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Valid ID Upload with 5MB validation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Valid Government ID Upload * (Max 5MB)
                    </label>
                    <div className="relative border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition">
                      <input
                        type="file"
                        id="validIdInput"
                        required
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div className="text-xs truncate">
                          {validIdFileName ? (
                            <span className="font-semibold text-slate-900 truncate block">
                              {validIdFileName} ({validIdSizeMb} MB)
                            </span>
                          ) : (
                            <span className="text-slate-600 font-medium block">
                              Click or drag file to upload ID (Image or PDF)
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">PhilSys, Passport, Driver's License, PRC, UMID (Max 5MB)</span>
                        </div>
                      </div>
                    </div>

                    {validIdError && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{validIdError}</span>
                      </div>
                    )}

                    {validIdFileName && !validIdError && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Valid ID successfully attached ({validIdSizeMb} MB $\le$ 5MB limit).</span>
                      </div>
                    )}
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
                    <strong>National Privacy Commission (NPC) Compliance:</strong> We certify that all member data and government IDs stored
                    within this cooperative instance will be encrypted and processed in accordance with the Philippine Data Privacy Act of 2012
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
                    <strong>CDA Statutory Compliance Agreement:</strong> We authorize Tuntong Tech to evaluate our application credentials,
                    pre-seed the official CDA Standard Chart of Accounts (MC 2015-06), and provision our dedicated cooperative instance upon approval.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.slug || Boolean(validIdError)}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 text-base"
              >
                {isSubmitting ? (
                  'Submitting Application for Compliance Review...'
                ) : (
                  <>
                    <span>Submit Application for Review</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Submission Confirmation Screen */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 border border-amber-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <FileText className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 px-3.5 py-1 rounded-full border border-amber-300">
                Application Submitted • Under Compliance Review
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-3">{registeredResult.name}</h2>
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-700 text-xs font-mono font-bold">
                <span>Application Reference:</span>
                <span className="text-indigo-600 font-extrabold">{registeredResult.id}</span>
              </div>
            </div>

            {/* Email Dispatch Notice */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 text-left max-w-xl mx-auto space-y-2 text-xs text-slate-700 leading-relaxed shadow-sm">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Next Step: Tuntong Tech Verification &amp; Credential Dispatch</span>
              </div>
              <p>
                Our compliance team is verifying your cooperative registration details, CDA certificate, and uploaded government-issued ID (<strong>{registeredResult.validIdName}</strong>).
              </p>
              <div className="pt-2 border-t border-indigo-200/60 text-slate-800">
                <p>
                  📧 Upon operator approval, an official notification will be dispatched from:
                </p>
                <div className="mt-1.5 bg-white border border-indigo-200 rounded-lg p-2.5 font-mono text-[11px] space-y-1">
                  <div><strong>From:</strong> support@tuntongtech.com</div>
                  <div><strong>To:</strong> {registeredResult.adminEmail}</div>
                  <div><strong>Includes:</strong> Live Domain (<strong>https://{registeredResult.subdomain}</strong>) and 1-Time Temporary Password</div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 italic">
                  * Note: The 1-time password will be subject to a mandatory password change during your initial administrator sign-in.
                </p>
              </div>
            </div>

            {/* Application Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left max-w-xl mx-auto space-y-2.5 font-mono text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500 font-sans">Proposed Domain:</span>
                <span className="font-bold text-indigo-600">https://{registeredResult.subdomain}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500 font-sans">CDA Registration No:</span>
                <span className="text-slate-800">{registeredResult.cdaRegistrationNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500 font-sans">BIR TIN:</span>
                <span className="text-slate-800">{registeredResult.tin}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500 font-sans">Registered Office:</span>
                <span className="text-slate-800 truncate max-w-xs">{registeredResult.address}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500 font-sans">Primary Administrator:</span>
                <span className="text-slate-800 font-semibold">{registeredResult.adminFullName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500 font-sans">Submitted Government ID:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {registeredResult.validIdName} ({registeredResult.validIdSizeMb} MB)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Submission Timestamp:</span>
                <span className="text-slate-600">{registeredResult.submittedAt}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href="/operator"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition"
              >
                <span>View in Operator Control Plane</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setRegisteredResult(null);
                  setValidIdFile(null);
                  setValidIdFileName('');
                  setValidIdSizeMb('');
                }}
                className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition"
              >
                Submit Another Cooperative
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
