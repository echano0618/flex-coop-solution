'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  GraduationCap,
  User,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  Camera,
  FileCheck,
  Award,
  Sparkles,
  HelpCircle,
  QrCode,
  DollarSign,
} from 'lucide-react';

export default function MemberRegisterPage() {
  const router = useRouter();

  // Step wizard: 1: PMES -> 2: Personal Profile -> 3: eKYC & Privacy -> 4: Share Capital
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: PMES State
  const [pmesQuiz1, setPmesQuiz1] = useState<string>('');
  const [pmesQuiz2, setPmesQuiz2] = useState<string>('');
  const [pmesCertified, setPmesCertified] = useState<boolean>(false);

  // Step 2: Personal Details
  const [firstName, setFirstName] = useState<string>('Clara');
  const [middleName, setMiddleName] = useState<string>('Bautista');
  const [lastName, setLastName] = useState<string>('Magdalo');
  const [email, setEmail] = useState<string>('clara.magdalo@gmail.com');
  const [phone, setPhone] = useState<string>('09191234567');
  const [birthdate, setBirthdate] = useState<string>('1994-08-15');
  const [gender, setGender] = useState<'FEMALE' | 'MALE'>('FEMALE');
  const [civilStatus, setCivilStatus] = useState<'SINGLE' | 'MARRIED' | 'WIDOWED'>('SINGLE');
  const [tin, setTin] = useState<string>('321-456-789-000');
  const [address, setAddress] = useState<string>('Brgy. San Antonio, Pasig City, Metro Manila');
  const [occupation, setOccupation] = useState<string>('Microenterprise Retailer / Baker');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(35000);

  // Step 3: eKYC & NPC Privacy Consent
  const [idType, setIdType] = useState<string>('PHILSYS_NATIONAL_ID');
  const [idNumber, setIdNumber] = useState<string>('1234-5678-9012-3456');
  const [idFrontUploaded, setIdFrontUploaded] = useState<boolean>(true);
  const [selfieUploaded, setSelfieUploaded] = useState<boolean>(true);
  const [npcConsent, setNpcConsent] = useState<boolean>(true);

  // Step 4: Share Capital Subscription
  const [subscribedShares, setSubscribedShares] = useState<number>(50); // 50 shares @ ₱100 = ₱5,000
  const [initialDeposit, setInitialDeposit] = useState<number>(1000); // ₱1,000 minimum paid-up
  const [paymentMethod, setPaymentMethod] = useState<'QRPH' | 'CASHIER'>('QRPH');
  const [signatureAgreed, setSignatureAgreed] = useState<boolean>(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [applicationId, setApplicationId] = useState<string>('');

  const parValuePerShare = 100;
  const totalSubscribedAmount = subscribedShares * parValuePerShare;

  const handleVerifyPmes = () => {
    if (pmesQuiz1 === 'service' && pmesQuiz2 === 'patronage') {
      setPmesCertified(true);
    } else {
      alert('Please select the correct answers according to Cooperative Principles (RA 9520).');
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setApplicationId(`APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setStep(5); // Success step
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-emerald-500/20">
            F
          </div>
          <div>
            <div className="font-bold text-base text-white flex items-center gap-2">
              Bayani Multi-Purpose Cooperative
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                Statutory Member Onboarding
              </span>
            </div>
            <div className="text-xs text-slate-400">Pursuant to Republic Act No. 9520 (Philippine Cooperative Code)</div>
          </div>
        </div>

        <Link
          href="/member/login"
          className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <span>Existing Member Login</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto my-8">
        {step !== 5 && (
          <div className="mb-8">
            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 text-xs">
              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2 sm:gap-3 ${
                  step === 1
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : step > 1
                    ? 'bg-slate-800 border-slate-700 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'
                  }`}
                >
                  {step > 1 ? '✓' : '1'}
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-semibold leading-tight">Statutory PMES</div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">Education Seminar</div>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2 sm:gap-3 ${
                  step === 2
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : step > 2
                    ? 'bg-slate-800 border-slate-700 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'
                  }`}
                >
                  {step > 2 ? '✓' : '2'}
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-semibold leading-tight">Personal Profile</div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">Member KYC Data</div>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2 sm:gap-3 ${
                  step === 3
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : step > 3
                    ? 'bg-slate-800 border-slate-700 text-emerald-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > 3 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'
                  }`}
                >
                  {step > 3 ? '✓' : '3'}
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-semibold leading-tight">eKYC & Privacy</div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">ID & NPC Consent</div>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2 sm:gap-3 ${
                  step === 4
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 4 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'
                  }`}
                >
                  4
                </div>
                <div className="text-center sm:text-left">
                  <div className="font-semibold leading-tight">Share Capital</div>
                  <div className="text-[10px] text-slate-400 hidden sm:block">Subscription Pledge</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: PMES (Pre-Membership Education Seminar) */}
        {step === 1 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Pre-Membership Education Seminar (PMES)</h2>
                <p className="text-xs text-slate-400">
                  Mandatory under Republic Act No. 9520 Art. 26: All prospective members must understand cooperative principles before admission.
                </p>
              </div>
            </div>

            {/* Video / Course Briefing Box */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Module 1: Principles of Cooperativism
                </span>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono">
                  Duration: Self-Paced
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  A cooperative is an autonomous and duly registered association of persons with a common bond of interest, who have voluntarily joined together to achieve their lawful common social or economic ends.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong>Voluntary and Open Membership:</strong> Open to all persons able to use their services and willing to accept member responsibilities.</li>
                  <li><strong>Democratic Member Control:</strong> One member, one vote policy regardless of the number of share capital owned.</li>
                  <li><strong>Member Economic Participation:</strong> Members contribute equitably to, and democratically control, the capital of their cooperative.</li>
                  <li><strong>Autonomy and Independence:</strong> Cooperatives are self-help organizations controlled by their members.</li>
                </ul>
              </div>
            </div>

            {/* Knowledge Check / Interactive Quiz */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Statutory Comprehension Verification
              </h3>

              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-medium text-slate-200">
                  1. What is the fundamental operational philosophy of a cooperative compared to a commercial bank?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="q1"
                      value="profit"
                      checked={pmesQuiz1 === 'profit'}
                      onChange={(e) => setPmesQuiz1(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Maximizing profit and returns for outside equity shareholders</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="q1"
                      value="service"
                      checked={pmesQuiz1 === 'service'}
                      onChange={(e) => setPmesQuiz1(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-emerald-300">
                      Mutual aid and service to members, where net surplus is returned via dividends and patronage refunds
                    </span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-medium text-slate-200">
                  2. Under the cooperative voting system, how many votes does a regular member have?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="q2"
                      value="shares"
                      checked={pmesQuiz2 === 'shares'}
                      onChange={(e) => setPmesQuiz2(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>One vote for every 100 shares of stock held</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer">
                    <input
                      type="radio"
                      name="q2"
                      value="patronage"
                      checked={pmesQuiz2 === 'patronage'}
                      onChange={(e) => setPmesQuiz2(e.target.value)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-emerald-300">
                      Strictly One Member, One Vote regardless of share capital equity
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Verification Button */}
            {!pmesCertified ? (
              <button
                type="button"
                onClick={handleVerifyPmes}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Verify Quiz & Issue PMES Certificate</span>
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PMES Certificate of Completion Generated</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-mono border border-emerald-700">
                    CERT-PMES-2026-8812
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Congratulations! You have successfully passed the PMES comprehension check. You are now eligible to proceed to personal profile submission.
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/30"
                >
                  <span>Proceed to Step 2: Personal Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PERSONAL & CONTACT INFORMATION */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(3);
            }}
            className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Personal & Contact Profile</h2>
                <p className="text-xs text-slate-400">
                  Required for cooperative membership registry and credit worthiness assessment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Civil Status *</label>
                <select
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number (+63) *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Complete Residential Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tax Identification Number (TIN)</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Occupation / Business</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Est. Monthly Income (₱)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to PMES</span>
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-700/30"
              >
                <span>Proceed to Step 3: eKYC & Privacy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: eKYC & NPC DATA PRIVACY CONSENT */}
        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!npcConsent) {
                alert('You must accept the Data Privacy terms under RA 10173 to proceed.');
                return;
              }
              setStep(4);
            }}
            className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Identity Verification & eKYC</h2>
                <p className="text-xs text-slate-400">
                  Government ID document capture and cryptographic protection under the Data Privacy Act of 2012.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Government ID Type *</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PHILSYS_NATIONAL_ID">Philippine National ID (PhilSys)</option>
                  <option value="DRIVERS_LICENSE">LTO Driver's License</option>
                  <option value="UMID">Unified Multi-Purpose ID (UMID)</option>
                  <option value="PASSPORT">Philippine Passport</option>
                  <option value="POSTAL_ID">DFA / PHLPost Postal ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ID Serial / Card Number *</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                  placeholder="e.g. 1234-5678-9012-3456"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Simulated Document Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-2">
                <Camera className="w-6 h-6 text-emerald-400" />
                <div className="text-xs font-bold text-white">Front ID Document Photo</div>
                <div className="text-[11px] text-slate-400">Clear snapshot showing photo and date of birth</div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Captured (id_front_sample.jpg)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 flex flex-col items-center justify-center text-center space-y-2">
                <Camera className="w-6 h-6 text-emerald-400" />
                <div className="text-xs font-bold text-white">Live Facial Liveness Selfie</div>
                <div className="text-[11px] text-slate-400">Neutral expression, eye level liveness audit</div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified (selfie_sample.jpg)
                </span>
              </div>
            </div>

            {/* NPC Consent Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Lock className="w-4 h-4" />
                <span>NPC Circular 16-01 & RA 10173 Informed Consent</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                By ticking below, I explicitly authorize Bayani Multi-Purpose Cooperative to collect, record, organize, store, and process my Sensitive Personal Information (SPI) solely for membership validation, statutory reporting to the Cooperative Development Authority (CDA), Anti-Money Laundering Council (AMLC), and Credit Information Corporation (CIC). All data at rest is encrypted with AES-256-GCM.
              </p>
              <label className="flex items-start gap-2.5 pt-1 text-xs text-white font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={npcConsent}
                  onChange={(e) => setNpcConsent(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>I provide full informed consent under the Philippine Data Privacy Act of 2012.</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Profile</span>
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-700/30"
              >
                <span>Proceed to Step 4: Share Capital</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: SHARE CAPITAL SUBSCRIPTION & PLEDGE */}
        {step === 4 && (
          <form onSubmit={handleFinalSubmit} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Share Capital Subscription & Initial Paid-Up</h2>
                <p className="text-xs text-slate-400">
                  Cooperative equity ownership. Shares earn annual dividends and patronage refunds based on coop surplus.
                </p>
              </div>
            </div>

            {/* Subscription Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-900/60 p-5 rounded-xl border border-slate-700/60">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Number of Subscribed Shares (Min: 50 Shares)
                  </label>
                  <input
                    type="number"
                    min={50}
                    step={10}
                    value={subscribedShares}
                    onChange={(e) => setSubscribedShares(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Par Value: ₱{parValuePerShare}.00 per share
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Paid-Up Deposit Amount (Min: ₱1,000.00)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Capital Summary */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Equity Commitment Summary
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                  <span className="text-slate-400">Subscribed Capital ({subscribedShares} shares):</span>
                  <span className="font-mono font-bold text-white">₱{totalSubscribedAmount.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-800">
                  <span className="text-slate-400">Initial Paid-Up Capital:</span>
                  <span className="font-mono font-bold text-emerald-400">₱{initialDeposit.toLocaleString()}.00</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-slate-400">Remaining Unpaid Subscription:</span>
                  <span className="font-mono text-slate-300">
                    ₱{Math.max(0, totalSubscribedAmount - initialDeposit).toLocaleString()}.00
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  * Remaining subscription payable in monthly installments through savings or automatic payroll/e-wallet deductions.
                </div>
              </div>
            </div>

            {/* Payment Rail for Paid-Up */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Payment Channel for Initial Paid-Up Capital
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'QRPH'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payrail"
                    checked={paymentMethod === 'QRPH'}
                    onChange={() => setPaymentMethod('QRPH')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold">PayMongo Dynamic QR Ph</div>
                      <div className="text-[10px] text-slate-400">GCash, Maya, ShopeePay, BDO, BPI</div>
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'CASHIER'
                      ? 'bg-emerald-950/50 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payrail"
                    checked={paymentMethod === 'CASHIER'}
                    onChange={() => setPaymentMethod('CASHIER')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold">Over-The-Counter Branch Cashier</div>
                      <div className="text-[10px] text-slate-400">Pay cash in branch during orientation</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Digital Signature Confirmation */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-slate-300 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={signatureAgreed}
                  onChange={(e) => setSignatureAgreed(e.target.checked)}
                  required
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  I solemnly declare that the facts stated herein are true and correct, and I pledge to abide by the Articles of Cooperation and By-laws of Bayani Multi-Purpose Cooperative.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to eKYC</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/30"
              >
                {isSubmitting ? (
                  <span>Submitting Application...</span>
                ) : (
                  <>
                    <span>Submit Membership Application</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 5: APPLICATION SUBMITTED SUCCESS STATE */}
        {step === 5 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-10 space-y-6 shadow-2xl text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full">
                Application Reference: {applicationId}
              </span>
              <h2 className="text-2xl font-black text-white">Membership Application Submitted!</h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Thank you, <strong>{firstName} {lastName}</strong>! Your application, PMES certificate, and eKYC documents have been forwarded to the Bayani Cooperative Membership Committee.
              </p>
            </div>

            {/* Approval Pipeline Roadmap */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-left space-y-3">
              <div className="text-xs font-bold text-slate-200">Statutory Approval Roadmap:</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. PMES Statutory Seminar Completed & Verified</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2. eKYC & NPC Data Privacy Audit Passed</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center text-[10px]">●</div>
                  <span>3. Membership Committee & BOD Sign-off (In Review)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="w-4 h-4 rounded-full border-2 border-slate-600"></div>
                  <span>4. Member ID Card Issuance & Share Capital Ledger Booking</span>
                </div>
              </div>
            </div>

            {/* Quick Demo Fast-Track Button */}
            <div className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => router.push('/member')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30"
              >
                <span>Instant Demo: Fast-Track Approval & Enter Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/member/login"
                className="block text-xs text-slate-400 hover:text-white transition-colors"
              >
                Return to Member Login Screen
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 Bayani Multi-Purpose Cooperative • CDA Registered • Regulated under RA 9520 & RA 10173
      </div>
    </div>
  );
}
