'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Wallet,
  PiggyBank,
  CreditCard,
  QrCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Download,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Plus,
  X,
  Search,
  Landmark,
  Banknote,
  Calculator,
  Printer,
  BookOpen,
  Users,
  Clock,
  Calendar,
  UserCheck,
  AlertTriangle,
  PieChart,
  Scale,
  Lock,
  Percent,
  LayoutDashboard,
  Menu,
  ArrowLeft,
  Smartphone,
  Sparkles,
  LogOut,
  RefreshCw,
  Check,
  ClipboardList,
  FileCheck,
  Ban,
  XCircle,
  Fingerprint,
  Eye,
  EyeOff,
  KeyRound,
  Coins,
} from 'lucide-react';
import { getApiBaseUrl } from '../api-config';
import {
  resolveTenantCoop,
  getTenantMemberSession,
  setTenantMemberSession,
  getTenantAdminSession,
  clearTenantMemberSession,
  clearTenantAdminSession,
  resolveGeneralManager,
  isTestCoopTenant,
  purgeTenantDummyRecords,
  TenantInfo,
  uint8ArrayToBase64Url,
} from '../tenant-utils';

function matchesMember(app: any, member: { id?: string; memberNumber?: string; memberNo?: string; name?: string }): boolean {
  if (!app || !member) return false;
  const normalizeCode = (val: any) =>
    String(val || '')
      .trim()
      .toUpperCase()
      .replace(/[-_ ]/g, '')
      .replace(/^(MEM\d{0,4})0+/, '$1');

  const appId = String(app.memberId || '').trim();
  const memId = String(member.id || '').trim();
  const memNoRaw = String(member.memberNumber || member.memberNo || '').trim();
  const appNoRaw = String(app.memberNo || app.memberNumber || '').trim();

  if (appId && (appId === memId || (memNoRaw && normalizeCode(appId) === normalizeCode(memNoRaw)))) {
    return true;
  }

  // If both the loan and the member have explicit member numbers, they MUST match.
  // Do NOT fall through to name matching if the member numbers belong to different members!
  if (appNoRaw && memNoRaw) {
    return normalizeCode(appNoRaw) === normalizeCode(memNoRaw);
  }

  // If app.memberId looks like a member code or member ID and we have member identifiers that don't match it, reject.
  if (appId && (memId || memNoRaw)) {
    const normAppId = normalizeCode(appId);
    const normMemId = normalizeCode(memId);
    const normMemNo = normalizeCode(memNoRaw);
    if (normAppId === normMemId || (normMemNo && normAppId === normMemNo)) {
      return true;
    }
    if (appNoRaw || appId.toUpperCase().startsWith('MEM')) {
      return false;
    }
  }

  // Fallback only when member ID/number is missing on the loan record: require exact full name match (never surname/substring)
  const appName = String(app.memberName || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const memName = String(member.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (appName && memName && appName === memName) {
    return true;
  }
  return false;
}


const DEFAULT_LOAN_PRODUCTS = [
  {
    id: 'prod_regular',
    code: 'REGULAR_LOAN',
    name: 'Regular Member Loan',
    type: 'REGULAR',
    minAmount: 10000,
    maxAmount: 100000,
    annualInterestRate: 0.12,
    minTermMonths: 6,
    maxTermMonths: 24,
    amortizationMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    advanceInterestOption: 'NONE',
    succeedingMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    fixedMonthlyInstallment: true,
    serviceFeeRate: 0.015,
    finesRateMonthly: 0.03,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 active co-maker in good standing with min ₱5,000 paid-up share capital. Co-maker must key in Member ID and sign solidary undertaking.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
    optionalFees: [
      { id: 'opt_fee_1', name: 'Documentary Stamp Tax (DST)', type: 'PERCENTAGE', value: 0.75 },
      { id: 'opt_fee_2', name: 'Loan Protection Insurance', type: 'FIXED', value: 500 },
    ],
  },
  {
    id: 'prod_emergency',
    code: 'EMERGENCY_PLUS',
    name: 'Emergency Relief Loan Plus',
    type: 'EMERGENCY',
    minAmount: 5000,
    maxAmount: 50000,
    annualInterestRate: 0.06,
    minTermMonths: 3,
    maxTermMonths: 12,
    amortizationMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    advanceInterestOption: 'NONE',
    succeedingMethod: 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
    fixedMonthlyInstallment: true,
    serviceFeeRate: 0.005,
    finesRateMonthly: 0.02,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 co-maker who has completed PMES and has active cooperative savings.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
    optionalFees: [
      { id: 'opt_fee_1', name: 'Documentary Stamp Tax (DST)', type: 'PERCENTAGE', value: 0.75 },
    ],
  },
  {
    id: 'prod_educational',
    code: 'EDUCATIONAL_LOAN',
    name: 'Educational Assistance Loan',
    type: 'EDUCATIONAL',
    minAmount: 10000,
    maxAmount: 50000,
    annualInterestRate: 0.08,
    minTermMonths: 6,
    maxTermMonths: 18,
    amortizationMethod: 'STRAIGHT_LINE',
    advanceInterestOption: 'FIRST_YEAR',
    succeedingMethod: 'STRAIGHT_LINE',
    fixedMonthlyInstallment: true,
    serviceFeeRate: 0.01,
    finesRateMonthly: 0.02,
    requiresCoMaker: false,
    minCoMakers: 0,
    coMakerRuleDescription: 'Co-maker optional; borrower must submit certificate of school matriculation.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
    optionalFees: [
      { id: 'opt_fee_1', name: 'Documentary Stamp Tax (DST)', type: 'PERCENTAGE', value: 0.75 },
      { id: 'opt_fee_2', name: 'Student Assistance Insurance', type: 'FIXED', value: 350 },
    ],
  },
];

function numberToWordsPesos(amount: number): string {
  const rounded = Math.floor(amount);
  if (rounded <= 0) return 'PESOS ZERO';
  const units = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' HUNDRED ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + units[n % 10] : '') + ' ';
    } else if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  if (rounded >= 1000000) {
    const millions = Math.floor(rounded / 1000000);
    words += convertGroup(millions) + ' MILLION ';
  }
  const thousands = Math.floor((rounded % 1000000) / 1000);
  if (thousands > 0) {
    words += convertGroup(thousands) + ' THOUSAND ';
  }
  const remainder = rounded % 1000;
  if (remainder > 0) {
    words += convertGroup(remainder) + ' ';
  }

  return `PESOS ${words.trim()}`;
}

function formatLoanStatus(status: string): string {
  switch (status) {
    case 'PENDING_CO_MAKER_ACCEPTANCE':
      return 'Awaiting Co-Maker Endorsement';
    case 'CO_MAKER_DECLINED':
      return 'Co-Maker Declined';
    case 'SUBMITTED':
      return 'Submitted to LOS';
    case 'UNDER_CREDIT_REVIEW':
      return 'Under Credit Review';
    case 'BOD_APPROVAL':
      return 'BOD Policy Review';
    case 'APPROVED':
      return 'Approved (Ready for Disbursal)';
    case 'DISBURSED':
      return 'Proceeds Disbursed';
    case 'REJECTED':
      return 'Application Declined';
    case 'CANCELLED':
      return 'Application Cancelled';
    default:
      return status ? status.replace(/_/g, ' ') : 'Under Review';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'PENDING_CO_MAKER_ACCEPTANCE':
      return 'bg-amber-100 text-amber-900 border border-amber-300';
    case 'CO_MAKER_DECLINED':
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-900 border border-rose-300';
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-900 border border-blue-300';
    case 'UNDER_CREDIT_REVIEW':
      return 'bg-indigo-100 text-indigo-900 border border-indigo-300';
    case 'BOD_APPROVAL':
      return 'bg-purple-100 text-purple-900 border border-purple-300';
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
    case 'DISBURSED':
      return 'bg-teal-100 text-teal-900 border border-teal-300';
    default:
      return 'bg-slate-100 text-slate-800 border border-slate-300';
  }
}

function pickNumber(...values: any[]): number {
  for (const v of values) {
    if (v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function formatScheduleDate(value: any): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

function getLoanScheduleRows(loan: any, currentBalance: number = 50000) {
  const r2 = (n: number) => Math.round(n * 100) / 100;

  // 1. Use the persisted schedule from the API (AmortizationScheduleItem) when it carries real values
  if (Array.isArray(loan?.schedule) && loan.schedule.length > 0) {
    let dueNowAssigned = false;
    const mapped = loan.schedule.map((item: any, idx: number) => {
      const pr = pickNumber(item.principalAmount, item.principalPayment, item.principal, item.pr);
      const inn = pickNumber(item.interestAmount, item.interestPayment, item.interest, item.in);
      const share = pickNumber(item.mandatoryShareAmount);
      const tot = pickNumber(item.totalInstallment, item.totalPayment, item.monthlyInstallment, item.tot) || pr + inn + share;
      const bal = pickNumber(item.endingBalance, item.remainingBalance, item.bal);
      const isPaid = item.isPaid === true || item.status === 'PAID';
      let status = isPaid ? 'PAID' : 'UPCOMING';
      if (!isPaid && !dueNowAssigned) {
        status = 'DUE_NOW';
        dueNowAssigned = true;
      }
      return {
        seq: item.installmentNumber || item.period || item.seq || idx + 1,
        due: formatScheduleDate(item.dueDate || item.due || item.paymentDate),
        pr: r2(pr),
        in: r2(inn),
        tot: r2(tot),
        bal: r2(bal),
        status,
      };
    });
    const hasValues = mapped.some((r: any) => r.pr > 0 || r.in > 0 || r.tot > 0);
    if (hasValues) return mapped;
  }

  // 2. Recompute from the loan terms (supports monthly and weekly products)
  const principal = pickNumber(loan?.principalAmount, loan?.amount, loan?.requestedAmount, currentBalance) || 50000;
  const annualRate = pickNumber(loan?.annualRate, loan?.interestRateAnnual, loan?.annualInterestRate) || 0.12;
  const isWeekly = loan?.termUnit === 'WEEKS' || loan?.paymentFrequency === 'WEEKLY';
  const everyOtherWeek = loan?.weeklyPaymentFrequency === 'EVERY_OTHER_WEEK';

  let periods: number;
  let periodRate: number;
  let periodDays = 0;
  if (isWeekly) {
    const weeks = pickNumber(loan?.termWeeks, loan?.term) || 12;
    const step = everyOtherWeek ? 2 : 1;
    periods = Math.max(1, Math.ceil(weeks / step));
    periodRate = (annualRate / 52) * step;
    periodDays = 7 * step;
  } else {
    periods = Math.max(1, pickNumber(loan?.termMonths, loan?.term) || 12);
    periodRate = annualRate / 12;
  }

  const isStraightLine = String(loan?.amortizationMethod || '').startsWith('STRAIGHT');
  const levelPayment =
    periodRate > 0
      ? (principal * periodRate * Math.pow(1 + periodRate, periods)) / (Math.pow(1 + periodRate, periods) - 1)
      : principal / periods;

  const start = new Date(loan?.firstDueDate || loan?.disbursedAt || loan?.approvedAt || loan?.createdAt || Date.now());
  const firstDueGiven = Boolean(loan?.firstDueDate);

  let remaining = principal;
  let dueNowAssigned = false;
  const rows = [];
  for (let i = 1; i <= periods; i++) {
    const interest = isStraightLine ? principal * periodRate : remaining * periodRate;
    let pr = isStraightLine ? principal / periods : levelPayment - interest;
    if (i === periods) pr = remaining;
    remaining = Math.max(0, remaining - pr);

    const due = new Date(start);
    const offset = firstDueGiven ? i - 1 : i;
    if (isWeekly) {
      due.setDate(due.getDate() + periodDays * offset);
    } else {
      due.setMonth(due.getMonth() + offset);
    }

    const existingItem = Array.isArray(loan?.schedule) ? loan.schedule[i - 1] : null;
    const isPaid = Boolean(
      existingItem?.isPaid === true ||
      existingItem?.status === 'PAID' ||
      (Array.isArray(loan?.repayments) &&
        loan.repayments.some((rep: any) => Number(rep.installmentNumber || rep.seq) === i))
    );
    let status = isPaid ? 'PAID' : 'UPCOMING';
    if (!isPaid && !dueNowAssigned) {
      status = 'DUE_NOW';
      dueNowAssigned = true;
    }

    rows.push({
      seq: i,
      due: formatScheduleDate(due),
      pr: r2(pr),
      in: r2(interest),
      tot: r2(pr + interest),
      bal: r2(remaining),
      status,
    });
  }
  return rows;
}

function getLoanLedgerTransactions(loan: any, currentBalance: number = 50000, existingTxs: any[] = []) {
  if (existingTxs && existingTxs.length > 0) {
    return existingTxs;
  }
  const principal = Number(loan?.amount || loan?.principalAmount || currentBalance || 50000);
  const disbDate = loan?.disbursedAt
    ? new Date(loan.disbursedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Oct 19, 2026';
  const disbRef = loan?.disbursementReference || loan?.loanNumber || `DISB-TX-${loan?.id?.slice(0, 6) || '001'}`;

  const baseEntry = {
    date: disbDate,
    ref: disbRef,
    particulars: `Initial Loan Proceeds Disbursed (${loan?.productName || 'Regular Member Loan'})`,
    debit: principal,
    credit: 0,
    balance: principal,
  };

  if (Array.isArray(loan?.repayments) && loan.repayments.length > 0) {
    return [baseEntry, ...loan.repayments];
  }

  // Synthesize repayment entries from any PAID schedule rows if repayments array wasn't populated yet
  const scheduleRows = getLoanScheduleRows(loan, currentBalance);
  const paidRows = scheduleRows.filter((r: any) => r.status === 'PAID');
  if (paidRows.length > 0) {
    let runningBal = principal;
    const synthesized = paidRows.map((r: any) => {
      runningBal = Math.max(0, Math.round((runningBal - Number(r.pr || 0)) * 100) / 100);
      return {
        date: r.due,
        ref: `OR-PAID-${r.seq}`,
        particulars: `Installment #${r.seq} Repayment via PayMongo QR Ph (Principal ₱${Number(r.pr || 0).toFixed(2)} + Interest ₱${Number(r.in || 0).toFixed(2)})`,
        principal: Number(r.pr || 0),
        interest: Number(r.in || 0),
        debit: 0,
        credit: Number(r.pr || 0),
        balance: runningBal,
      };
    });
    return [baseEntry, ...synthesized];
  }

  return [baseEntry];
}

export default function MemberPortalPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    slug: 'default',
    name: 'Cooperative Enterprise',
    isSubdomain: false,
    registrationNumber: 'CDA Registered',
    logoLetter: 'C',
    coopType: 'Multi-Purpose',
  });

  // Authentication Guard: Redirect unauthenticated visitors to /member/login with tenant scoping
  useEffect(() => {
    const info = resolveTenantCoop();
    setTenantInfo(info);

    try {
      if (typeof window !== 'undefined') {
        const auth = getTenantMemberSession(info.slug);
        const admin = getTenantAdminSession(info.slug);
        if (auth || admin) {
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Member auth check error:', e);
    }
    setIsCheckingAuth(false);
    router.replace(info.slug && info.slug !== 'default' ? `/member/login?coop=${info.slug}` : '/member/login');
  }, [router]);

  const handleMemberSignOut = () => {
    clearTenantMemberSession(tenantInfo.slug);
    clearTenantAdminSession(tenantInfo.slug);
    router.replace(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member/login?coop=${tenantInfo.slug}` : '/member/login');
  };

  // Member Persona Switcher (Maria = Borrower, Juan = Co-Maker)
  const [currentPersona, setCurrentPersona] = useState<'maria' | 'juan'>('maria');
  const [customMember, setCustomMember] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const info = resolveTenantCoop();
        const isTestTenant = isTestCoopTenant(info.slug);
        const auth = getTenantMemberSession(info.slug);
        if (auth) {
          let fullName = auth.name || `${auth.firstName || ''} ${auth.lastName || ''}`.trim() || auth.email || 'Cooperative Member';
          if (fullName.toUpperCase() === 'ECHANO0618') {
            fullName = 'Felix II Echano';
          }
          const initials = ((auth.firstName?.[0] || '') + (auth.lastName?.[0] || '') || fullName.slice(0, 2)).toUpperCase();
          const classification = auth.classification || 'ASSOCIATE';
          const isDividendEligible = auth.isDividendEligible !== undefined ? Boolean(auth.isDividendEligible) : (classification === 'REGULAR');
          return {
            id: auth.id || auth.email || '',
            memberNumber: auth.memberNumber || auth.memberNo || '',
            email: auth.email || '',
            name: fullName,
            initials: initials || 'MB',
            classification: classification,
            isDividendEligible: isDividendEligible,
            type: auth.position ? `${auth.position} (${classification === 'REGULAR' ? 'Regular Member' : 'Associate Member'})` : (classification === 'REGULAR' ? 'Regular Member' : 'Associate Member'),
            paidUpCapital: auth.paidUpCapital !== undefined ? Number(auth.paidUpCapital) : (isTestTenant ? 25000 : 0),
            sharesCount: auth.sharesCount !== undefined ? Number(auth.sharesCount) : (isTestTenant ? 250 : 0),
            subscribedShares: auth.subscribedShares !== undefined ? Number(auth.subscribedShares) : (isTestTenant ? 250 : 50),
            sharePaymentStatus: auth.sharePaymentStatus || 'PARTIALLY_PAID',
            savingsBalance: auth.savingsBalance !== undefined ? Number(auth.savingsBalance) : 0,
            loanBalance: 0,
            idType: auth.idType || 'PhilSys Verified Member ID',
          };
        }
      } catch {}
    }
    return null;
  });

  // Load authenticated member or General Manager profile
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const info = resolveTenantCoop();
        const isTestTenant = isTestCoopTenant(info.slug);

        if (!isTestTenant) {
          purgeTenantDummyRecords(info.slug);
        }

        const auth = getTenantMemberSession(info.slug);
        const admin = getTenantAdminSession(info.slug);

        if (auth) {
          try {
            const parsed = auth;
            if (parsed) {
              let fullName = parsed.name || `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || parsed.email || 'Cooperative Member';
              if (fullName.toUpperCase() === 'ECHANO0618') {
                fullName = 'Felix II Echano';
              }
              const initials = ((parsed.firstName?.[0] || '') + (parsed.lastName?.[0] || '') || fullName.slice(0, 2)).toUpperCase();
              const classification = parsed.classification || 'ASSOCIATE';
              const isDividendEligible = parsed.isDividendEligible !== undefined ? Boolean(parsed.isDividendEligible) : (classification === 'REGULAR');
              setCustomMember({
                id: parsed.id || parsed.email || '',
                memberNumber: parsed.memberNumber || parsed.memberNo || '',
                email: parsed.email || '',
                name: fullName,
                initials: initials || 'MB',
                classification: classification,
                isDividendEligible: isDividendEligible,
                type: parsed.position ? `${parsed.position} (${classification === 'REGULAR' ? 'Regular Member' : 'Associate Member'})` : (classification === 'REGULAR' ? 'Regular Member' : 'Associate Member'),
                paidUpCapital: parsed.paidUpCapital !== undefined ? Number(parsed.paidUpCapital) : (isTestTenant ? 25000 : 0),
                sharesCount: parsed.sharesCount !== undefined ? Number(parsed.sharesCount) : (isTestTenant ? 250 : 0),
                subscribedShares: parsed.subscribedShares !== undefined ? Number(parsed.subscribedShares) : (isTestTenant ? 250 : 50),
                sharePaymentStatus: parsed.sharePaymentStatus || 'PARTIALLY_PAID',
                savingsBalance: parsed.savingsBalance !== undefined ? Number(parsed.savingsBalance) : 0,
                loanBalance: 0,
                idType: parsed.idType || 'PhilSys Verified Member ID',
              });
            }
          } catch {}
        } else if (admin) {
          try {
            const parsedAdmin = admin;
            if (parsedAdmin && parsedAdmin.name) {
              let fullName = parsedAdmin.name;
              if (fullName.toUpperCase() === 'ECHANO0618') {
                fullName = 'Felix II Echano';
              }
              const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              setCustomMember({
                id: parsedAdmin.id || 'MEM-2026-0001',
                memberNumber: parsedAdmin.memberNumber || parsedAdmin.memberNo || 'MEM-2026-0001',
                name: fullName,
                initials: initials || 'GM',
                classification: 'REGULAR',
                isDividendEligible: true,
                type: 'General Manager (Regular Member)',
                paidUpCapital: isTestTenant ? 10000 : 0,
                sharesCount: isTestTenant ? 100 : 0,
                savingsBalance: 0,
                loanBalance: 0,
                idType: 'CDA General Manager Verified PhilSys ID',
              });
            }
          } catch {}
        } else {
          const gm = resolveGeneralManager(info.slug);
          if (gm && gm.name) {
            let gmName = gm.name;
            if (gmName.toUpperCase() === 'ECHANO0618') {
              gmName = 'Felix II Echano';
            }
            const initials = gmName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            setCustomMember({
              id: 'MEM-2026-0001',
              memberNumber: 'MEM-2026-0001',
              name: gmName,
              initials: initials || 'GM',
              type: 'General Manager (Regular Member)',
              paidUpCapital: isTestTenant ? 10000 : 0,
              sharesCount: isTestTenant ? 100 : 0,
              savingsBalance: 0,
              loanBalance: 0,
              idType: 'CDA General Manager Verified PhilSys ID',
            });
          }
        }

        // Live Database Sync: Query Cloud Firestore to get the authoritative member profile
        fetch(`${getApiBaseUrl()}/members?coop=${info.slug}`)
          .then((r) => r.json())
          .then((res) => {
            if (res.success && Array.isArray(res.data) && res.data.length > 0) {
              // Populate Member Directory strictly with Selfie, First Name, and Last Name sorted alphabetically
              try {
                const dirList = res.data.map((m: any) => {
                  let first = m.firstName || '';
                  let last = m.lastName || '';
                  if (!first && !last && m.name) {
                    const parts = m.name.trim().split(/\s+/);
                    if (parts.length > 1) {
                      last = parts.pop() || '';
                      first = parts.join(' ');
                    } else {
                      first = parts[0] || 'Member';
                      last = '';
                    }
                  }
                  return {
                    id: m.id || `${first}-${last}`,
                    firstName: first || 'Member',
                    lastName: last || '',
                    selfieUrl: m.selfieUrl || m.selfiePreview || m.avatarUrl || null,
                  };
                });
                dirList.sort((a: any, b: any) => {
                  const firstCmp = (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' });
                  if (firstCmp !== 0) return firstCmp;
                  return (a.lastName || '').localeCompare(b.lastName || '', undefined, { sensitivity: 'base' });
                });
                setDirectoryMembers(dirList);
              } catch {}

              // Identity is resolved strictly from the authenticated session.
              // A member session always takes precedence over a (possibly stale) admin session.
              const identitySource: any = auth || admin || {};
              const userId = String(identitySource.id || '').toLowerCase().trim();
              const userEmail = String(identitySource.email || '').toLowerCase().trim();
              const userMemberNo = String(identitySource.memberNumber || identitySource.memberNo || '').toUpperCase().trim();
              const normalizeNo = (v: string) => v.replace(/[-_ ]/g, '').toUpperCase();

              const byId = userId
                ? res.data.find((m: any) => String(m.id || '').toLowerCase().trim() === userId)
                : undefined;
              const byEmail = userEmail
                ? res.data.find((m: any) => String(m.email || '').toLowerCase().trim() === userEmail)
                : undefined;
              const byMemberNo = userMemberNo
                ? res.data.find((m: any) => {
                    const mNo = String(m.memberNumber || m.memberNo || '').toUpperCase().trim();
                    return !!mNo && normalizeNo(mNo) === normalizeNo(userMemberNo);
                  })
                : undefined;

              let matched = byId || byEmail || byMemberNo;

              // Only an admin-only session (no member session) may fall back to the General Manager record.
              if (!matched && !auth && admin) {
                matched = res.data.find(
                  (m: any) =>
                    m.position === 'General Manager' ||
                    m.id === 'mem_gm_0001' ||
                    String(m.memberNumber || '').endsWith('-0001')
                );
              }

              if (matched) {
                const fullName = matched.name || `${matched.firstName || ''} ${matched.lastName || ''}`.trim();
                const initials = (
                  (matched.firstName?.[0] || '') + (matched.lastName?.[0] || '') || fullName.slice(0, 2)
                ).toUpperCase();

                const resolvedSavings = matched.savingsBalance !== undefined ? Number(matched.savingsBalance) : 0;
                const classification = matched.classification || (matched.position === 'General Manager' ? 'REGULAR' : 'ASSOCIATE');
                const isDividendEligible = matched.isDividendEligible !== undefined ? Boolean(matched.isDividendEligible) : (classification === 'REGULAR');

                setCustomMember((prev: any) => ({
                  id: matched.id || prev?.id || 'MEM-2026-0001',
                  memberNumber: matched.memberNumber || matched.memberNo || prev?.memberNumber || 'MEM-2026-0001',
                  name: fullName,
                  initials: initials || 'GM',
                  classification: classification,
                  isDividendEligible: isDividendEligible,
                  type: matched.position ? `${matched.position} (${classification === 'REGULAR' ? 'Regular Member' : 'Associate Member'})` : (classification === 'REGULAR' ? 'Regular Member' : 'Associate Member'),
                  paidUpCapital: matched.paidUpShares !== undefined ? Number(matched.paidUpShares) : (isTestTenant ? 10000 : 0),
                  sharesCount: matched.sharesCount !== undefined ? Number(matched.sharesCount) : (isTestTenant ? 100 : 0),
                  subscribedShares: matched.subscribedShares !== undefined ? Number(matched.subscribedShares) : (isTestTenant ? 100 : 50),
                  sharePaymentStatus: matched.sharePaymentStatus || (matched.paidUpShares >= ((matched.subscribedShares || 50) * 100) ? 'FULLY_PAID' : 'PARTIALLY_PAID'),
                  savingsBalance: resolvedSavings,
                  loanBalance: matched.loanBalance !== undefined ? Number(matched.loanBalance) : 0,
                  idType: matched.idType || 'PhilSys National ID (Verified Member)',
                }));
                setSavingsBalance(resolvedSavings);
                if (matched.loanBalance !== undefined) {
                  setLoanBalance(Number(matched.loanBalance));
                }
                if (auth) {
                  try {
                    const updatedAuth = {
                      ...auth,
                      savingsBalance: resolvedSavings,
                      loanBalance: matched.loanBalance !== undefined ? Number(matched.loanBalance) : 0,
                      paidUpShares: matched.paidUpShares !== undefined ? Number(matched.paidUpShares) : auth.paidUpShares,
                      sharesCount: matched.sharesCount !== undefined ? Number(matched.sharesCount) : auth.sharesCount,
                      subscribedShares: matched.subscribedShares !== undefined ? Number(matched.subscribedShares) : auth.subscribedShares,
                      sharePaymentStatus: matched.sharePaymentStatus || auth.sharePaymentStatus,
                    };
                    setTenantMemberSession(updatedAuth, info.slug, info.name);
                  } catch {}
                }
              }
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.warn('Member state parse error:', e);
    }
  }, []);

  const gmInfo = resolveGeneralManager(tenantInfo.slug);
  const gmInitials = gmInfo.name
    ? gmInfo.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'GM';

  const currentMember = customMember || {
    id: 'MEM-2026-0001',
    memberNumber: 'MEM-2026-0001',
    name: gmInfo.name || 'General Manager',
    initials: gmInitials || 'GM',
    selfieUrl: '/avatars/MEM-2026-0001.jpg',
    selfiePreview: '/avatars/MEM-2026-0001.jpg',
    classification: 'ASSOCIATE',
    isDividendEligible: false,
    type: 'Associate Member',
    paidUpCapital: isTestCoopTenant(tenantInfo.slug) ? 10000 : 0,
    sharesCount: isTestCoopTenant(tenantInfo.slug) ? 100 : 0,
    subscribedShares: isTestCoopTenant(tenantInfo.slug) ? 100 : 50,
    sharePaymentStatus: 'PARTIALLY_PAID',
    savingsBalance: 0,
    loanBalance: 0,
    idType: 'CDA Verified Associate Member PhilSys ID',
  };

  const isTestTenant = isTestCoopTenant(tenantInfo.slug);

  const [activeTab, setActiveTab] = useState<'home' | 'passbook' | 'members' | 'more' | 'apply' | 'pay' | 'comaker' | 'documents' | 'profile' | 'surplus' | 'collateral' | 'applications'>('home');
  const [memberLoanApplications, setMemberLoanApplications] = useState<any[]>([]);
  const [isRefreshingLoans, setIsRefreshingLoans] = useState<boolean>(false);
  const [selectedLoanForDisclosure, setSelectedLoanForDisclosure] = useState<any | null>(null);
  const [disclosureBackTab, setDisclosureBackTab] = useState<'home' | 'apply' | 'applications' | 'more'>('home');

  // PWA Installation Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert('To install on iOS: tap the Share icon in Safari (box with up arrow) and select "Add to Home Screen". On Android/Chrome: tap browser menu (⋮) and select "Install App".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Co-Maker Endorsement Requests State
  const [endorsementRequests, setEndorsementRequests] = useState(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return [];
      }
    }
    return [
      {
        id: 'req_001',
        loanId: 'loan_maria_001',
        loanNumber: 'LN-2026-00001',
        borrowerName: 'Maria Clara Santos',
        borrowerMemberNumber: 'MEM-2026-0001',
        designatedCoMakerMemberNumber: 'MEM-2026-0002',
        productName: 'Regular Member Loan',
        principalAmount: 50000,
        termMonths: 12,
        monthlyInstallment: 4442.44,
        status: 'PENDING' as 'PENDING' | 'ACCEPTED' | 'DECLINED',
        requestedAt: '2026-10-10 09:30 AM',
        respondedAt: null as string | null,
      },
    ];
  });

  // Designated Co-Maker Member ID input when applying
  const [coMakerMemberIdInput, setCoMakerMemberIdInput] = useState<string>('MEM-2026-0002');
  const [coMakerError, setCoMakerError] = useState<string>('');
  const [solidaryAgreed, setSolidaryAgreed] = useState<boolean>(false);
  const [endorsementSuccessMsg, setEndorsementSuccessMsg] = useState<string>('');

  // Cooperative Loan Products State with localStorage & API Synchronization
  const [loanProducts, setLoanProducts] = useState<any[]>(DEFAULT_LOAN_PRODUCTS);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_regular');

  useEffect(() => {
    const tenantInfo = resolveTenantCoop();
    const storageKey = `flexcoop_loan_products_${tenantInfo.slug}`;

    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLoanProducts(parsed);
          const activeOnes = parsed.filter((p: any) => p.isActive !== false && p.status !== 'INACTIVE');
          if (activeOnes.length > 0 && !activeOnes.some((p: any) => p.id === selectedProductId)) {
            setSelectedProductId(activeOnes[0].id);
          }
        }
      }
    } catch {}

    fetch(`${getApiBaseUrl()}/loan-products?coop=${tenantInfo.slug}`, {
      headers: { 'x-tenant-slug': tenantInfo.slug },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setLoanProducts(res.data);
          try {
            localStorage.setItem(storageKey, JSON.stringify(res.data));
          } catch {}
          const activeOnes = res.data.filter((p: any) => p.isActive !== false && p.status !== 'INACTIVE');
          if (activeOnes.length > 0 && !activeOnes.some((p: any) => p.id === selectedProductId)) {
            setSelectedProductId(activeOnes[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Show only ACTIVE and eligible products to members for new loan applications, deduplicated by code/name
  const activeLoanProducts = (() => {
    const rawActive = loanProducts.filter((p) => {
      if (p.isActive === false || p.status === 'INACTIVE') return false;
      if (p.availability === 'SPECIFIC_MEMBERS') {
        if (p.eligibleMemberScope === 'REGULAR_ONLY') {
          return currentMember.classification === 'REGULAR';
        }
        if (p.eligibleMemberScope === 'ASSOCIATE_ONLY') {
          return currentMember.classification === 'ASSOCIATE';
        }
        if (p.eligibleMemberScope === 'SPECIFIC_LIST' || Array.isArray(p.eligibleMemberIds)) {
          const memberIds = p.eligibleMemberIds || [];
          const curId = (currentMember.id || '').trim().toLowerCase();
          const curNo = (currentMember.memberNumber || '').trim().toLowerCase();
          return memberIds.some((id: string) => {
            const normalized = (id || '').trim().toLowerCase();
            return normalized === curId || normalized === curNo;
          });
        }
      }
      return true;
    });
    const seen = new Set<string>();
    const deduplicated: any[] = [];
    for (const p of rawActive) {
      const key = (p.code || p.name || p.id || '').trim().toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(p);
      }
    }
    return deduplicated;
  })();

  const selectedProduct =
    activeLoanProducts.find((p) => p.id === selectedProductId) ||
    activeLoanProducts[0] ||
    loanProducts[0] ||
    DEFAULT_LOAN_PRODUCTS[0];

  // Member Loan Application State
  const [loanCalculationBasis, setLoanCalculationBasis] = useState<'PRINCIPAL' | 'AMORTIZATION'>('PRINCIPAL');
  const [loanAmount, setLoanAmount] = useState<number>(50000);
  const [desiredAmortization, setDesiredAmortization] = useState<number>(4442);
  const [loanTerm, setLoanTerm] = useState<number>(12);
  const [loanTermWeeks, setLoanTermWeeks] = useState<number>(12);
  const [coMaker, setCoMaker] = useState<string>('Co-Maker Member (MEM-2026-0002)');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);
  const [applicationSubmitted, setApplicationSubmitted] = useState<boolean>(false);
  const [submittedLoanId, setSubmittedLoanId] = useState<string>('');
  const [isSubmittingLoan, setIsSubmittingLoan] = useState<boolean>(false);

  // Loan Settlement & Disbursement Details State
  const [settlementChannel, setSettlementChannel] = useState<'BANK_TRANSFER' | 'E_WALLET' | 'CASH_COUNTER'>('BANK_TRANSFER');
  const [settlementInstitution, setSettlementInstitution] = useState<string>('Land Bank of the Philippines');
  const [settlementAccountNumber, setSettlementAccountNumber] = useState<string>('1092-8374-65');
  const [settlementAccountName, setSettlementAccountName] = useState<string>('');
  const [submittedSettlementRecord, setSubmittedSettlementRecord] = useState<{
    channel: 'BANK_TRANSFER' | 'E_WALLET' | 'CASH_COUNTER';
    institutionName: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);

  useEffect(() => {
    setSettlementAccountName(currentMember.name);
  }, [currentPersona, currentMember.name]);

  // Repayment State
  const [repayChannel, setRepayChannel] = useState<'PAYMONGO_QRPH' | 'BANK_TRANSFER'>('PAYMONGO_QRPH');
  const [repayAmount, setRepayAmount] = useState<number>(4442.44);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [loanBankReferenceInput, setLoanBankReferenceInput] = useState<string>('');
  const [loanBankTransferNotes, setLoanBankTransferNotes] = useState<string>('');
  const [isSubmittingLoanBankTransfer, setIsSubmittingLoanBankTransfer] = useState<boolean>(false);
  const [loanBankTransferPendingResult, setLoanBankTransferPendingResult] = useState<{ reference: string; amount: number; bankName: string } | null>(null);

  // Active Loan State (Synchronized strictly with the authenticated member's own active loans)
  const [loanBalance, setLoanBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const info = resolveTenantCoop();
        const auth = getTenantMemberSession(info.slug) || getTenantAdminSession(info.slug);
        if (!auth) return 0.0;
        const memberObj = {
          id: auth.id || auth.email || '',
          memberNumber: auth.memberNumber || auth.memberNo || '',
          name: auth.name || `${auth.firstName || ''} ${auth.lastName || ''}`.trim(),
        };
        const storageKey = `flexcoop_loan_applications_${info.slug}`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const apps = JSON.parse(raw);
          if (Array.isArray(apps)) {
            const disbursed = apps.filter((a: any) => {
              const st = String(a.status || '').toUpperCase();
              if (!['DISBURSED', 'RELEASED', 'ACTIVE', 'APPROVED', 'APPROVED_FOR_RELEASE', 'FOR_DISBURSEMENT'].includes(st)) return false;
              return matchesMember(a, memberObj);
            });
            if (disbursed.length > 0) {
              return disbursed.reduce(
                (sum: number, l: any) =>
                  sum + (l.balanceRemaining !== undefined && Number(l.balanceRemaining) > 0 ? Number(l.balanceRemaining) : Number(l.principalAmount || l.amount || 0)),
                0
              );
            }
          }
        }
      } catch {}
    }
    return 0.0;
  });

  // Share Capital & Savings Balances State
  const [paidUpCapital, setPaidUpCapital] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return 0; // Strictly zero in clean/production instances
      }
    }
    return 15000;
  });
  const [sharesCount, setSharesCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return 0; // Strictly zero in clean/production instances
      }
    }
    return 150;
  });
  const [subscribedShares, setSubscribedShares] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const info = resolveTenantCoop();
      if (!isTestCoopTenant(info.slug)) {
        return 50; // CDA standard minimum pledge for regular membership
      }
    }
    return 150;
  });
  const [savingsBalance, setSavingsBalance] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const info = resolveTenantCoop();
        const savingsEnabled = localStorage.getItem(`flexcoop_savings_deposit_enabled_${info.slug}`) === 'true';
        if (!savingsEnabled) return 0;
        const auth = getTenantMemberSession(info.slug) || getTenantAdminSession(info.slug);
        if (auth && auth.savingsBalance !== undefined) {
          return Number(auth.savingsBalance);
        }
      } catch {}
    }
    return 0;
  });

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState<boolean>(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  // Device Biometrics Authentication State
  const [isBiometricsSupported, setIsBiometricsSupported] = useState<boolean>(true);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(false);
  const [biometricsLoading, setBiometricsLoading] = useState<boolean>(false);
  const [biometricsNotice, setBiometricsNotice] = useState<string | null>(null);

  // Keep share capital & savings balances synchronized with authenticated member
  useEffect(() => {
    if (customMember) {
      if (customMember.paidUpCapital !== undefined) setPaidUpCapital(Number(customMember.paidUpCapital));
      if (customMember.sharesCount !== undefined) setSharesCount(Number(customMember.sharesCount));
      if (customMember.subscribedShares !== undefined) setSubscribedShares(Number(customMember.subscribedShares));
      if (customMember.savingsBalance !== undefined) setSavingsBalance(Number(customMember.savingsBalance));
    }
  }, [customMember]);

  // Load authoritative share transactions from Firestore
  useEffect(() => {
    if (isTestTenant) return;
    const memId = currentMember?.id || currentMember?.memberNumber;
    if (!memId) return;

    fetch(`/api/v1/shares/transactions?memberId=${encodeURIComponent(memId)}`, {
      headers: { 'x-tenant-id': tenantInfo.slug },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          let runningBalance = 0;
          const sortedAsc = [...json.data].sort((a: any, b: any) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
          const mapped = sortedAsc.map((tx: any) => {
            runningBalance += Number(tx.amount || 0);
            const d = tx.createdAt ? new Date(tx.createdAt) : new Date();
            const dateStr = d.toLocaleDateString('en-CA');
            return {
              date: dateStr,
              ref: tx.receiptNumber || tx.journalEntryId || 'OR-SHR',
              particulars: tx.particulars || `Share Capital Deposit (+${tx.sharesCount || Math.round(tx.amount / 100)} shares)`,
              shares: Number(tx.sharesCount || Math.round(tx.amount / 100)),
              debit: 0,
              credit: Number(tx.amount || 0),
              balance: runningBalance,
            };
          });
          if (paidUpCapital > runningBalance) {
            const missingAmount = paidUpCapital - runningBalance;
            const missingShares = Math.round(missingAmount / 100);
            const isGm = currentMember.memberNumber === 'MEM-2026-0001' || currentMember.id === 'MEM-2026-0001';
            const initEntry = {
              date: isGm ? '2026-01-15' : '2026-10-19',
              ref: `OR-SHR-INIT-${currentMember.memberNumber || '001'}`,
              particulars: isGm
                ? 'Initial Subscription & Paid-Up Capital (PMES Admission & Statutory GM Undertaking)'
                : `Initial Subscription & PMES Admission Deposit (${missingShares} Shares @ ₱100 Par)`,
              shares: missingShares,
              debit: 0,
              credit: missingAmount,
              balance: missingAmount,
            };
            mapped.unshift(initEntry);
            let reRunBal = 0;
            mapped.forEach((entry) => {
              reRunBal += entry.credit - entry.debit;
              entry.balance = reRunBal;
            });
          }
          setProdShareLedger(mapped.reverse());
        } else if (paidUpCapital > 0) {
          const isGm = currentMember.memberNumber === 'MEM-2026-0001' || currentMember.id === 'MEM-2026-0001';
          const initEntry = {
            date: isGm ? '2026-01-15' : '2026-10-19',
            ref: `OR-SHR-INIT-${currentMember.memberNumber || '001'}`,
            particulars: isGm
              ? 'Initial Subscription & Paid-Up Capital (PMES Admission & Statutory GM Undertaking)'
              : `Initial Subscription & PMES Admission Deposit (${Math.round(paidUpCapital / 100)} Shares @ ₱100 Par)`,
            shares: Math.round(paidUpCapital / 100),
            debit: 0,
            credit: paidUpCapital,
            balance: paidUpCapital,
          };
          setProdShareLedger([initEntry]);
        }
      })
      .catch((err) => console.warn('Failed to load member share transactions:', err));
  }, [currentMember?.id, currentMember?.memberNumber, tenantInfo.slug, isTestTenant, paidUpCapital]);

  // Synchronize device biometrics state for current tenant
  useEffect(() => {
    try {
      const bioKey = `flexcoop_biometrics_enabled_${tenantInfo.slug}`;
      const isEnabled = localStorage.getItem(bioKey) === 'true';
      setIsBiometricsEnabled(isEnabled);
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        setIsBiometricsSupported(true);
      }
    } catch {}
  }, [tenantInfo.slug]);

  // Self-Service Deposit / Share Purchase Modal State
  const [depositModalType, setDepositModalType] = useState<'SHARES' | 'SAVINGS' | null>(null);
  const [depositSharesCount, setDepositSharesCount] = useState<number>(10); // 10 shares @ ₱100 = ₱1,000
  const [depositSavingsAmount, setDepositSavingsAmount] = useState<number>(1000);
  const [depositChannel, setDepositChannel] = useState<'PAYMONGO_QRPH' | 'BANK_TRANSFER'>('PAYMONGO_QRPH');
  const [bankReferenceInput, setBankReferenceInput] = useState<string>('');
  const [isSubmittingDirectShare, setIsSubmittingDirectShare] = useState<boolean>(false);
  const [coopPaymentOptions, setCoopPaymentOptions] = useState<any>(null);

  // Members Directory State (Showing strictly Selfie, First Name, Last Name sorted alphabetically)
  const [directoryMembers, setDirectoryMembers] = useState<Array<{
    id: string;
    firstName: string;
    lastName: string;
    selfieUrl?: string;
    selfiePreview?: string | null;
  }>>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState<boolean>(false);
  const [directorySearchQuery, setDirectorySearchQuery] = useState<string>('');

  useEffect(() => {
    const slug = tenantInfo.slug || 'default';
    fetch(`${getApiBaseUrl()}/coop/payment-options`, {
      headers: { 'x-tenant-slug': slug },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setCoopPaymentOptions(data.data);
        }
      })
      .catch(() => {});
  }, [tenantInfo.slug]);

  const [depositSuccessResult, setDepositSuccessResult] = useState<{
    type: string;
    amount: number;
    reference: string;
    channel: string;
    sharesAdded?: number;
    isPendingConfirmation?: boolean;
  } | null>(null);

  // Real PayMongo Payment Intent & Live QR Ph State
  const [paymongoActivePayment, setPaymongoActivePayment] = useState<{
    paymentIntentId: string;
    clientKey: string;
    qrImageUrl: string;
    checkoutUrl?: string;
    checkoutLinkId?: string;
    expiresAt: string;
    totalAmount: number;
    principalAmount: number;
    convenienceFee: number;
    sharesCount: number;
  } | null>(null);
  const [isGeneratingPaymongo, setIsGeneratingPaymongo] = useState<boolean>(false);
  const [isVerifyingPaymongo, setIsVerifyingPaymongo] = useState<boolean>(false);

  const handleInitiatePaymongoShares = async () => {
    setIsGeneratingPaymongo(true);
    try {
      const targetTenantSlug = tenantInfo.slug || 'family-coop';
      const targetTenantId = (currentMember as any)?.tenantId || `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;
      const res = await fetch(`${getApiBaseUrl()}/shares/paymongo/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetTenantSlug,
          'x-tenant-id': targetTenantId,
        },
        body: JSON.stringify({
          memberId: currentMember.id,
          sharesCount: depositSharesCount,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setPaymongoActivePayment(json.data);
      } else {
        alert(json.error || 'Failed to initialize PayMongo payment. Please try again.');
      }
    } catch (err: any) {
      alert(`Network error connecting to PayMongo gateway: ${err.message}`);
    } finally {
      setIsGeneratingPaymongo(false);
    }
  };

  const shareVerifyInFlightRef = useRef(false);
  const handleVerifyAndCompletePaymongoShares = async () => {
    if (!paymongoActivePayment || shareVerifyInFlightRef.current) return;
    shareVerifyInFlightRef.current = true;
    setIsVerifyingPaymongo(true);
    try {
      const targetTenantSlug = tenantInfo.slug || 'family-coop';
      const targetTenantId = (currentMember as any)?.tenantId || `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;
      const res = await fetch(`${getApiBaseUrl()}/shares/paymongo/verify-and-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetTenantSlug,
          'x-tenant-id': targetTenantId,
        },
        body: JSON.stringify({
          memberId: currentMember.id,
          sharesCount: paymongoActivePayment.sharesCount,
          amount: paymongoActivePayment.principalAmount,
          paymentIntentId: paymongoActivePayment.paymentIntentId,
          checkoutLinkId: paymongoActivePayment.checkoutLinkId,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const addedAmount = paymongoActivePayment.principalAmount;
        const addedShares = paymongoActivePayment.sharesCount;
        // Use the authoritative balances persisted in the database (never increment locally only)
        const serverPaidUp = json.member?.paidUpShares;
        const serverShares = json.member?.sharesCount;
        const serverSubscribed = json.member?.subscribedShares;
        const serverSharePaymentStatus = json.member?.sharePaymentStatus;
        const serverClassification = json.member?.classification || json.classification;
        const serverIsDividendEligible = json.member?.isDividendEligible !== undefined ? json.member?.isDividendEligible : (serverClassification === 'REGULAR');

        if (serverPaidUp !== undefined && serverPaidUp !== null) {
          setPaidUpCapital(Number(serverPaidUp));
          setSharesCount(Number(serverShares || Math.round(Number(serverPaidUp) / 100)));
          if (serverSubscribed !== undefined) setSubscribedShares(Number(serverSubscribed));
          setCustomMember((prev: any) =>
            prev ? {
              ...prev,
              paidUpCapital: Number(serverPaidUp),
              paidUpShares: Number(serverPaidUp),
              sharesCount: Number(serverShares || 0),
              subscribedShares: serverSubscribed !== undefined ? Number(serverSubscribed) : prev.subscribedShares,
              sharePaymentStatus: serverSharePaymentStatus || prev.sharePaymentStatus,
              ...(serverClassification ? {
                classification: serverClassification,
                isDividendEligible: serverIsDividendEligible,
                type: prev.position ? `${prev.position} (${serverClassification === 'REGULAR' ? 'Regular Member' : 'Associate Member'})` : (serverClassification === 'REGULAR' ? 'Regular Member' : 'Associate Member'),
              } : {}),
            } : prev
          );
        } else if (!json.duplicate) {
          setPaidUpCapital((prev) => prev + addedAmount);
          setSharesCount((prev) => prev + addedShares);
        }

        // Update local session
        try {
          const auth = getTenantMemberSession(tenantInfo.slug);
          if (auth) {
            setTenantMemberSession({
              ...auth,
              paidUpShares: serverPaidUp !== undefined ? Number(serverPaidUp) : (auth.paidUpShares + addedAmount),
              sharesCount: serverShares !== undefined ? Number(serverShares) : (auth.sharesCount + addedShares),
              subscribedShares: serverSubscribed !== undefined ? Number(serverSubscribed) : auth.subscribedShares,
              sharePaymentStatus: serverSharePaymentStatus || auth.sharePaymentStatus,
              ...(serverClassification ? { classification: serverClassification, isDividendEligible: serverIsDividendEligible } : {}),
            }, tenantInfo.slug, tenantInfo.name);
          }
        } catch {}

        setDepositSuccessResult({
          type: 'Share Capital Purchase',
          amount: addedAmount,
          reference: json.receiptNumber || `OR-SHR-${Date.now().toString(36).toUpperCase()}`,
          channel: 'PayMongo QR Ph / Online Gateway',
          sharesAdded: addedShares,
        });
        setPaymongoActivePayment(null);
      } else {
        alert(json.error || 'Payment verification could not be completed.');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      shareVerifyInFlightRef.current = false;
      setIsVerifyingPaymongo(false);
    }
  };

  const handleBankTransferShareDeposit = async () => {
    if (!bankReferenceInput || !bankReferenceInput.trim()) {
      alert('Please enter your Bank Transfer Reference / Trace Number for admin verification.');
      return;
    }

    setIsSubmittingDirectShare(true);
    try {
      const targetTenantSlug = tenantInfo.slug || 'family-coop';
      const targetTenantId = (currentMember as any)?.tenantId || `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;
      const amount = depositSharesCount * 100;

      const res = await fetch(`${getApiBaseUrl()}/payments/bank-transfer/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetTenantSlug,
          'x-tenant-id': targetTenantId,
        },
        body: JSON.stringify({
          type: 'SHARE_PURCHASE',
          memberId: currentMember.id,
          memberNumber: currentMember.memberNumber,
          memberName: currentMember.name,
          amount,
          sharesCount: depositSharesCount,
          bankName: coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank of the Philippines',
          referenceNumber: bankReferenceInput.trim(),
          notes: `Capital Build-Up: ${depositSharesCount} Common Shares @ ₱100.00 par value`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDepositSuccessResult({
          type: 'Share Purchase (Awaiting Confirmation)',
          amount,
          reference: json.data?.referenceNumber || bankReferenceInput.trim(),
          channel: `${coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank'} Transfer (Pending Admin Confirmation)`,
          sharesAdded: depositSharesCount,
          isPendingConfirmation: true,
        });
        setBankReferenceInput('');
      } else {
        alert(json.error || 'Failed to submit bank transfer request.');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSubmittingDirectShare(false);
    }
  };

  const handleBankTransferSavingsDeposit = async () => {
    if (!bankReferenceInput || !bankReferenceInput.trim()) {
      alert('Please enter your Bank Transfer Reference / Trace Number for admin verification.');
      return;
    }

    setIsSubmittingDirectShare(true);
    try {
      const targetTenantSlug = tenantInfo.slug || 'family-coop';
      const targetTenantId = (currentMember as any)?.tenantId || `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;
      const amount = depositSavingsAmount;

      const res = await fetch(`${getApiBaseUrl()}/payments/bank-transfer/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetTenantSlug,
          'x-tenant-id': targetTenantId,
        },
        body: JSON.stringify({
          type: 'SAVINGS_DEPOSIT',
          memberId: currentMember.id,
          memberNumber: currentMember.memberNumber,
          memberName: currentMember.name,
          amount,
          bankName: coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank of the Philippines',
          referenceNumber: bankReferenceInput.trim(),
          notes: 'Voluntary Member Savings Deposit',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setDepositSuccessResult({
          type: 'Savings Deposit (Awaiting Confirmation)',
          amount,
          reference: json.data?.referenceNumber || bankReferenceInput.trim(),
          channel: `${coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank'} Transfer (Pending Admin Confirmation)`,
          isPendingConfirmation: true,
        });
        setBankReferenceInput('');
      } else {
        alert(json.error || 'Failed to submit bank transfer deposit.');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSubmittingDirectShare(false);
    }
  };

  const handleSubmitLoanBankTransfer = async () => {
    if (!loanBankReferenceInput || !loanBankReferenceInput.trim()) {
      alert('Please enter the Bank Transfer Reference / Trace Number for verification.');
      return;
    }

    setIsSubmittingLoanBankTransfer(true);
    try {
      const targetTenantSlug = tenantInfo.slug || 'family-coop';
      const targetTenantId = (currentMember as any)?.tenantId || `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;

      const res = await fetch(`${getApiBaseUrl()}/payments/bank-transfer/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': targetTenantSlug,
          'x-tenant-id': targetTenantId,
        },
        body: JSON.stringify({
          type: 'LOAN_PAYMENT',
          memberId: currentMember.id,
          memberNumber: currentMember.memberNumber,
          memberName: currentMember.name,
          amount: repayAmount,
          loanId: 'LOAN-ACTIVE-001',
          loanNumber: 'LN-2026-00001',
          bankName: coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank of the Philippines',
          referenceNumber: loanBankReferenceInput.trim(),
          notes: loanBankTransferNotes.trim() || 'Loan Amortization Repayment',
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setLoanBankTransferPendingResult({
          reference: json.data?.referenceNumber || loanBankReferenceInput.trim(),
          amount: repayAmount,
          bankName: coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank of the Philippines',
        });
        setLoanBankReferenceInput('');
        setLoanBankTransferNotes('');
      } else {
        alert(json.error || 'Failed to submit loan bank transfer payment.');
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSubmittingLoanBankTransfer(false);
    }
  };

  // Helper to load and sort member directory alphabetically
  const loadDirectoryMembers = async () => {
    setIsLoadingDirectory(true);
    try {
      const slug = tenantInfo.slug || 'family-coop';
      const res = await fetch(`${getApiBaseUrl()}/members?coop=${slug}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const dirList = json.data.map((m: any) => {
          let first = m.firstName || '';
          let last = m.lastName || '';
          if (!first && !last && m.name) {
            const parts = m.name.trim().split(/\s+/);
            if (parts.length > 1) {
              last = parts.pop() || '';
              first = parts.join(' ');
            } else {
              first = parts[0] || 'Member';
              last = '';
            }
          }
          return {
            id: m.id || `${first}-${last}`,
            firstName: first || 'Member',
            lastName: last || '',
            selfieUrl: m.selfieUrl || m.selfiePreview || m.avatarUrl || null,
          };
        });
        dirList.sort((a: any, b: any) => {
          const firstCmp = (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' });
          if (firstCmp !== 0) return firstCmp;
          return (a.lastName || '').localeCompare(b.lastName || '', undefined, { sensitivity: 'base' });
        });
        setDirectoryMembers(dirList);
      }
    } catch (err) {
      console.error('Failed to load member directory:', err);
    } finally {
      setIsLoadingDirectory(false);
    }
  };

  const filteredDirectoryMembers = useMemo(() => {
    const query = directorySearchQuery.trim().toLowerCase();
    const list = query
      ? directoryMembers.filter(
          (m) =>
            m.firstName.toLowerCase().includes(query) ||
            m.lastName.toLowerCase().includes(query)
        )
      : directoryMembers;

    return [...list].sort((a, b) => {
      const firstCmp = (a.firstName || '').localeCompare(b.firstName || '', undefined, { sensitivity: 'base' });
      if (firstCmp !== 0) return firstCmp;
      return (a.lastName || '').localeCompare(b.lastName || '', undefined, { sensitivity: 'base' });
    });
  }, [directoryMembers, directorySearchQuery]);

  useEffect(() => {
    if (activeTab === 'members' && directoryMembers.length === 0) {
      loadDirectoryMembers();
    }
  }, [activeTab]);

  // Real-time automatic background payment status polling for QR Ph & Checkout Link
  useEffect(() => {
    if (!paymongoActivePayment?.paymentIntentId) return;

    let isDisposed = false;
    const interval = setInterval(async () => {
      try {
        const targetTenantSlug = tenantInfo.slug || 'family-coop';
        const targetTenantId = (currentMember as any)?.tenantId || `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;
        const linkQuery = paymongoActivePayment.checkoutLinkId ? `?linkId=${paymongoActivePayment.checkoutLinkId}` : '';
        const res = await fetch(
          `${getApiBaseUrl()}/shares/paymongo/status/${paymongoActivePayment.paymentIntentId}${linkQuery}`,
          {
            headers: {
              'x-tenant-slug': targetTenantSlug,
              'x-tenant-id': targetTenantId,
            },
          }
        );
        const data = await res.json();
        if (!isDisposed && data.success && data.isPaid) {
          clearInterval(interval);
          handleVerifyAndCompletePaymongoShares();
        }
      } catch (err) {
        // Polling retry
      }
    }, 2500);

    return () => {
      isDisposed = true;
      clearInterval(interval);
    };
  }, [paymongoActivePayment, tenantInfo.slug]);

  // Dynamic Calculations for Loan Application
  const annualRate = selectedProduct.annualInterestRate || 0.12;
  const minPrincipal = selectedProduct.minAmount || 5000;
  const maxPrincipal = selectedProduct.maxAmount || 100000;
  const requiresCoMaker = Boolean(selectedProduct.requiresCoMaker);
  const coMakerRuleText = selectedProduct.coMakerRuleDescription || 'Requires active co-maker endorsement with joint solidary liability.';

  // Term unit & payment frequency calculations
  const isWeeks = selectedProduct.termUnit === 'WEEKS';
  const isBiWeekly = isWeeks && selectedProduct.weeklyPaymentFrequency === 'EVERY_OTHER_WEEK';
  const periodsPerYear = isWeeks ? (isBiWeekly ? 26.0 : 52.0) : 12.0;
  const effectiveTermPeriods = isWeeks
    ? (isBiWeekly ? Math.max(1, Math.ceil(loanTermWeeks / 2)) : Math.max(1, loanTermWeeks))
    : Math.max(1, loanTerm);
  const periodicRate = annualRate / periodsPerYear;

  // Helper functions for Principal vs Periodic Amortization calculation
  const computePrincipalFromAmortization = (
    totalAmort: number,
    periods: number,
    pRate: number,
    shareAmort = 0
  ): number => {
    const netAmort = Math.max(0, totalAmort - shareAmort);
    if (pRate === 0) return Math.round(netAmort * periods * 100) / 100;
    const f = Math.pow(1.0 + pRate, periods);
    if (f <= 1.0) return Math.round(netAmort * periods * 100) / 100;
    const factor = (pRate * f) / (f - 1.0);
    let p = netAmort / factor;
    let pRounded = Math.round(p * 100) / 100;
    let derived = Math.round(pRounded * factor * 100) / 100;
    let diff = Math.round((netAmort - derived) * 100) / 100;
    if (diff !== 0) {
      pRounded = Math.round((pRounded + (diff / factor)) * 100) / 100;
    }
    return pRounded;
  };

  const computeAmortizationFromPrincipal = (principal: number, periods: number, pRate: number): number => {
    if (pRate === 0) return Math.round((principal / periods) * 100) / 100;
    const f = Math.pow(1.0 + pRate, periods);
    if (f <= 1.0) return Math.round((principal / periods) * 100) / 100;
    return Math.round(((principal * (pRate * f)) / (f - 1.0)) * 100) / 100;
  };

  // Technology Fee Treatment (Online Single Database Config: Pass-Through vs OPEX)
  const [techFeeTreatment, setTechFeeTreatment] = useState<'PASS_THROUGH' | 'OPEX'>('PASS_THROUGH');
  // PayMongo Gateway Fee Enabled & Treatment (PASS_THROUGH vs OPEX, no ₱15 minimum floor)
  const [paymongoFeeEnabled, setPaymongoFeeEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const tenant = resolveTenantCoop();
        const cached =
          localStorage.getItem(`flexcoop_paymongo_fee_enabled_${tenant.slug}`) ??
          localStorage.getItem('flexcoop_paymongo_fee_enabled_global');
        if (cached !== null) {
          return cached !== 'false';
        }
      } catch {}
    }
    return true;
  });
  const [paymongoFeeTreatment, setPaymongoFeeTreatment] = useState<'PASS_THROUGH' | 'OPEX'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const tenant = resolveTenantCoop();
        const cachedEnabled =
          localStorage.getItem(`flexcoop_paymongo_fee_enabled_${tenant.slug}`) ??
          localStorage.getItem('flexcoop_paymongo_fee_enabled_global');
        if (cachedEnabled === 'false') return 'OPEX';
        const cached =
          localStorage.getItem(`flexcoop_paymongo_fee_treatment_${tenant.slug}`) ||
          localStorage.getItem('flexcoop_paymongo_fee_treatment_global');
        if (cached === 'OPEX' || cached === 'PASS_THROUGH') {
          return cached;
        }
      } catch {}
    }
    return 'PASS_THROUGH';
  });
  const [coopFilingFeeEnabled, setCoopFilingFeeEnabled] = useState<boolean>(true);
  const [coopFilingFeeRatePercent, setCoopFilingFeeRatePercent] = useState<number>(1.5);
  const [savingsDepositEnabled, setSavingsDepositEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const tenant = resolveTenantCoop();
        const cached = localStorage.getItem(`flexcoop_savings_deposit_enabled_${tenant.slug}`);
        if (cached !== null) {
          return cached === 'true';
        }
      } catch {}
    }
    return false; // Safe default false prevents button and card flickering on refresh
  });

  useEffect(() => {
    const resolvedSlug =
      tenantInfo.slug && tenantInfo.slug !== 'default'
        ? tenantInfo.slug
        : resolveTenantCoop().slug || 'family-coop';
    const targetTenantId = `tenant_${resolvedSlug.replace(/[-_]coop$/, '')}`;

    fetch(`${getApiBaseUrl()}/system-config?coop=${resolvedSlug}`, {
      headers: {
        'x-tenant-slug': resolvedSlug,
        'x-tenant-id': targetTenantId,
      },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.success && res.data) {
          if (res.data.techFeeTreatment) setTechFeeTreatment(res.data.techFeeTreatment);
          if (res.data.coopFilingFeeEnabled !== undefined) setCoopFilingFeeEnabled(Boolean(res.data.coopFilingFeeEnabled));
          if (res.data.coopFilingFeeRatePercent !== undefined) setCoopFilingFeeRatePercent(Number(res.data.coopFilingFeeRatePercent));
          if (res.data.paymongoFeeEnabled !== undefined) {
            const feeEn = Boolean(res.data.paymongoFeeEnabled);
            setPaymongoFeeEnabled(feeEn);
            try {
              localStorage.setItem(`flexcoop_paymongo_fee_enabled_${resolvedSlug}`, String(feeEn));
              localStorage.setItem('flexcoop_paymongo_fee_enabled_global', String(feeEn));
            } catch {}
          }
          if (res.data.paymongoFeeTreatment === 'OPEX' || res.data.paymongoFeeTreatment === 'PASS_THROUGH') {
            setPaymongoFeeTreatment(res.data.paymongoFeeTreatment);
            try {
              localStorage.setItem(`flexcoop_paymongo_fee_treatment_${resolvedSlug}`, res.data.paymongoFeeTreatment);
              localStorage.setItem('flexcoop_paymongo_fee_treatment_global', res.data.paymongoFeeTreatment);
            } catch {}
          }
          if (res.data.savingsDepositEnabled !== undefined) {
            const enabled = Boolean(res.data.savingsDepositEnabled);
            setSavingsDepositEnabled(enabled);
            try {
              localStorage.setItem(`flexcoop_savings_deposit_enabled_${resolvedSlug}`, String(enabled));
            } catch {}
          }
        }
      })
      .catch(() => {});

    fetch(`${getApiBaseUrl()}/tenant/paymongo-public-config?coop=${resolvedSlug}`, {
      headers: {
        'x-tenant-slug': resolvedSlug,
        'x-tenant-id': targetTenantId,
      },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.success && res.data) {
          const isFeeEnabled =
            res.data.feeEnabled !== undefined
              ? Boolean(res.data.feeEnabled)
              : res.data.isEnabled !== undefined
              ? Boolean(res.data.isEnabled)
              : true;
          const treatment =
            !isFeeEnabled || res.data.feeTreatment === 'OPEX' ? 'OPEX' : 'PASS_THROUGH';
          setPaymongoFeeEnabled(isFeeEnabled);
          setPaymongoFeeTreatment(treatment);
          try {
            localStorage.setItem(`flexcoop_paymongo_fee_enabled_${resolvedSlug}`, String(isFeeEnabled));
            localStorage.setItem('flexcoop_paymongo_fee_enabled_global', String(isFeeEnabled));
            localStorage.setItem(`flexcoop_paymongo_fee_treatment_${resolvedSlug}`, treatment);
            localStorage.setItem('flexcoop_paymongo_fee_treatment_global', treatment);
          } catch {}
        }
      })
      .catch(() => {});

    // React in real time when admin toggles savings deposit or PayMongo fee configuration in another tab
    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key && e.key.includes('flexcoop_savings_deposit_enabled')) {
        const val = e.newValue === 'true';
        setSavingsDepositEnabled(val);
      }
      if (e.key && e.key.includes('flexcoop_paymongo_fee_enabled')) {
        const enabledVal = e.newValue !== 'false';
        setPaymongoFeeEnabled(enabledVal);
        if (!enabledVal) setPaymongoFeeTreatment('OPEX');
      }
      if (e.key && e.key.includes('flexcoop_paymongo_fee_treatment')) {
        if (e.newValue === 'OPEX' || e.newValue === 'PASS_THROUGH') {
          setPaymongoFeeTreatment(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [tenantInfo.slug]);

  // Fetch member's submitted loans from localStorage & backend API
  const fetchMemberLoanApplications = React.useCallback(async (showLoading = false) => {
    if (showLoading) setIsRefreshingLoans(true);
    const tenant = resolveTenantCoop();
    const storageKey = `flexcoop_loan_applications_${tenant.slug}`;
    let apps: any[] = [];

    // 1. Initial cached applications from localStorage
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          apps = parsed;
        }
      }
    } catch {}

    // 2. Fetch from Backend API (Authoritative)
    try {
      const res = await fetch(`${getApiBaseUrl()}/loans?coop=${tenant.slug}`);
      if (res.ok) {
        const resJson = await res.json();
        const apiLoans = Array.isArray(resJson) ? resJson : Array.isArray(resJson?.data) ? resJson.data : null;
        if (apiLoans !== null) {
          const existingMap = new Map<string, any>();
          apps.forEach((a) => {
            const key = a.loanNumber || a.id;
            if (key) existingMap.set(key, a);
          });
          apps = apiLoans.map((a: any) => {
            const key = a.loanNumber || a.id;
            const existing = key ? existingMap.get(key) || {} : {};
            return { ...existing, ...a };
          });
          try {
            localStorage.setItem(storageKey, JSON.stringify(apps));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Backend loans fetch warning:', err);
    } finally {
      if (showLoading) setIsRefreshingLoans(false);
    }

    // Filter for current member using robust normalized matching
    const filtered = apps.filter((app: any) => {
      return matchesMember(app, currentMember);
    });

    // Sort newest first
    filtered.sort((a, b) => {
      const timeA = new Date(a.submittedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.submittedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    setMemberLoanApplications(filtered);

    // Synchronize loan balance strictly with the member's own active disbursed or approved loans
    const activeLoans = filtered.filter((app: any) =>
      ['DISBURSED', 'RELEASED', 'ACTIVE', 'APPROVED', 'APPROVED_FOR_RELEASE', 'FOR_DISBURSEMENT'].includes(
        String(app.status || '').toUpperCase()
      )
    );
    if (activeLoans.length > 0) {
      const totalBalance = activeLoans.reduce((sum: number, loan: any) => {
        const bal =
          loan.balanceRemaining !== undefined && Number(loan.balanceRemaining) > 0
            ? Number(loan.balanceRemaining)
            : Number(loan.principalAmount || loan.amount || 0);
        return sum + bal;
      }, 0);
      setLoanBalance(totalBalance);
    } else {
      setLoanBalance(0);
    }
  }, [currentMember.id, currentMember.memberNumber, currentMember.name]);

  useEffect(() => {
    fetchMemberLoanApplications();

    // Auto-polling every 4 seconds to sync status changes from Admin Portal in real time
    const interval = setInterval(() => {
      fetchMemberLoanApplications(false);
    }, 4000);

    // Cross-tab storage listener to react instantly when admin changes status in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.includes('flexcoop_loan_applications')) {
        fetchMemberLoanApplications(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchMemberLoanApplications]);

  const isTechFeePassThrough = techFeeTreatment === 'PASS_THROUGH';
  const techFeeAmount = Math.round(loanAmount * 0.01 * 100) / 100;
  const memberTechFeeDeduction = isTechFeePassThrough ? techFeeAmount : 0;
  const coopServiceFee = coopFilingFeeEnabled
    ? Math.round(loanAmount * (coopFilingFeeRatePercent / 100) * 100) / 100
    : 0;

  // Mandatory Share Capital Purchase
  const mandatorySharePrice = 100; // Par value per share
  const mandatoryShareQty = selectedProduct.mandatoryShareQuantity || 10;
  const mandatoryShareTotal = selectedProduct.mandatorySharePurchaseEnabled ? (mandatoryShareQty * mandatorySharePrice) : 0;
  const isUpfrontShareDeduction = Boolean(selectedProduct.mandatorySharePurchaseEnabled) && selectedProduct.mandatorySharePaymentTreatment !== 'INCLUDED_IN_LOAN_PAYMENT';
  const isInstallmentSharePayment = Boolean(selectedProduct.mandatorySharePurchaseEnabled) && selectedProduct.mandatorySharePaymentTreatment === 'INCLUDED_IN_LOAN_PAYMENT';
  const shareAmortizationPerPeriod = isInstallmentSharePayment ? Math.round((mandatoryShareTotal / effectiveTermPeriods) * 100) / 100 : 0;
  const upfrontShareDeductionAmount = isUpfrontShareDeduction ? mandatoryShareTotal : 0;

  let advanceInterest = 0;
  if (selectedProduct.advanceInterestOption === 'FIRST_YEAR') {
    const yearFraction = isWeeks ? Math.min(52, loanTermWeeks) / 52.0 : Math.min(12, loanTerm) / 12.0;
    advanceInterest = Math.round(loanAmount * annualRate * yearFraction * 100) / 100;
  } else if (selectedProduct.advanceInterestOption === 'ENTIRE_LOAN') {
    const yearFraction = isWeeks ? loanTermWeeks / 52.0 : loanTerm / 12.0;
    advanceInterest = Math.round(loanAmount * annualRate * yearFraction * 100) / 100;
  }

  let optionalFeesTotal = 0;
  if (Array.isArray(selectedProduct.optionalFees)) {
    optionalFeesTotal = selectedProduct.optionalFees.reduce((acc: number, f: any) => {
      if (f.type === 'PERCENTAGE') {
        return acc + Math.round(loanAmount * (Number(f.value) / 100) * 100) / 100;
      }
      return acc + (Number(f.value) || 0);
    }, 0);
  }

  const netProceeds = Math.max(0, loanAmount - memberTechFeeDeduction - coopServiceFee - advanceInterest - optionalFeesTotal - upfrontShareDeductionAmount);

  // Periodic annuity installment
  const periodicFactor = Math.pow(1.0 + periodicRate, effectiveTermPeriods);
  const calculatedBaseInstallment = Math.round(((loanAmount * (periodicRate * periodicFactor)) / (periodicFactor - 1.0)) * 100) / 100;
  const isAmortizationMode = loanCalculationBasis === 'AMORTIZATION';
  const targetBaseInstallment = isInstallmentSharePayment ? Math.max(0, desiredAmortization - shareAmortizationPerPeriod) : desiredAmortization;
  const basePeriodicInstallment = isAmortizationMode
    ? targetBaseInstallment
    : calculatedBaseInstallment;
  const monthlyInstallment = isAmortizationMode
    ? desiredAmortization
    : (basePeriodicInstallment + shareAmortizationPerPeriod);
  const totalInterest = Math.max(0, Math.round(((basePeriodicInstallment * effectiveTermPeriods) - loanAmount) * 100) / 100);
  const totalDeductions = memberTechFeeDeduction + coopServiceFee + advanceInterest + optionalFeesTotal + upfrontShareDeductionAmount;
  // Actual EIR based on the loan tenure (not annualized / not p.a.)
  const eirTenure = Math.round(((totalInterest + totalDeductions) / Math.max(1, netProceeds)) * 10000) / 100;
  const eir = eirTenure;

  // Pass-On Fee for QR Ph (1.5%, no ₱15 minimum floor, respects PASS_THROUGH vs OPEX)
  const passOnFee =
    repayChannel === 'PAYMONGO_QRPH' && paymongoFeeTreatment === 'PASS_THROUGH'
      ? Math.round(repayAmount * 0.015 * 100) / 100
      : 0.0;
  const totalCharge = Math.round((repayAmount + passOnFee) * 100) / 100;

  const handleSimulatePayment = () => {
    setPaymentSuccess(true);
    setLoanBalance((prev) => Math.max(0, Math.round((prev - (repayAmount - 500)) * 100) / 100)); // principal reduction
  };

  // Option 4: Digital Passbook & Subsidiary Ledger State
  const [passbookSubTab, setPassbookSubTab] = useState<'shares' | 'savings' | 'loan'>('shares');
  useEffect(() => {
    if (!savingsDepositEnabled && passbookSubTab === 'savings') {
      setPassbookSubTab('shares');
    }
  }, [savingsDepositEnabled, passbookSubTab]);
  const [showPassbookStatementModal, setShowPassbookStatementModal] = useState<boolean>(false);
  const [passbookPayModal, setPassbookPayModal] = useState<{
    open: boolean;
    type: 'LOAN' | 'SAVINGS' | 'SHARES';
    amount: number;
    description: string;
    lockedAmount?: boolean;
    loanId?: string;
    loanNumber?: string;
    installmentNumber?: number;
    dueDate?: string;
    principalPortion?: number;
    interestPortion?: number;
    qrImageUrl?: string;
    paymentIntentId?: string;
    checkoutUrl?: string;
    checkoutLinkId?: string;
    convenienceFeeOverride?: number;
    isGeneratingQr?: boolean;
    isVerifyingPayment?: boolean;
    verificationError?: string | null;
  }>({
    open: false,
    type: 'LOAN',
    amount: 4442.44,
    description: 'Monthly Loan Amortization Installment #2',
  });
  const [passbookReceipt, setPassbookReceipt] = useState<{
    orNumber: string;
    date: string;
    time: string;
    accountCode: string;
    accountName: string;
    baseAmount: number;
    convenienceFee: number;
    totalAmount: number;
    newBalance: number;
    reference: string;
    description: string;
  } | null>(null);

  // Dynamic Subsidiary Ledger Entries State
  const [mariaShareLedger, setMariaShareLedger] = useState([
    {
      date: '2026-01-15',
      ref: 'OR-2026-0012',
      particulars: 'Initial Subscription & Paid-Up Capital (PMES Admission)',
      shares: 100,
      debit: 0,
      credit: 10000,
      balance: 10000,
    },
    {
      date: '2026-02-15',
      ref: 'OR-2026-0199',
      particulars: 'Voluntary Capital Build-Up (50 Shares @ ₱100 Par)',
      shares: 50,
      debit: 0,
      credit: 5000,
      balance: 15000,
    },
  ]);

  const [mariaSavingsLedger, setMariaSavingsLedger] = useState([
    {
      date: '2026-01-15',
      ref: 'OR-2026-0013',
      particulars: 'Opening Compulsory Savings Account (2-01-01)',
      debit: 0,
      credit: 2000,
      balance: 2000,
    },
    {
      date: '2026-02-01',
      ref: 'OR-2026-0341',
      particulars: 'Monthly PMES Mandatory Savings Deposit',
      debit: 0,
      credit: 1000,
      balance: 3000,
    },
    {
      date: '2026-02-15',
      ref: 'OR-2026-0498',
      particulars: 'Voluntary Savings Top-Up via PayMongo QR Ph Rail',
      debit: 0,
      credit: 2000,
      balance: 5000,
    },
  ]);

  const [mariaLoanLedger, setMariaLoanLedger] = useState([
    {
      date: '2026-01-20',
      ref: 'DISB-TX-LN001',
      particulars: 'Disbursement of Regular Member Loan (12 Mos @ 12% p.a.)',
      principal: 50000,
      interest: 0,
      debit: 50000,
      credit: 0,
      balance: 50000,
    },
    {
      date: '2026-02-20',
      ref: 'OR-2026-0992181',
      particulars: 'Installment #1 Repayment via QR Ph (Principal ₱3,942.44 + Interest ₱500)',
      principal: 3942.44,
      interest: 500,
      debit: 0,
      credit: 3942.44,
      balance: 46057.56,
    },
  ]);

  const [juanShareLedger, setJuanShareLedger] = useState([
    {
      date: '2026-01-18',
      ref: 'OR-2026-0035',
      particulars: 'Initial Subscription & Paid-Up Capital (100 Shares)',
      shares: 100,
      debit: 0,
      credit: 10000,
      balance: 10000,
    },
  ]);

  const [juanSavingsLedger, setJuanSavingsLedger] = useState([
    {
      date: '2026-01-18',
      ref: 'OR-2026-0036',
      particulars: 'Opening Compulsory Savings Account (2-01-01)',
      debit: 0,
      credit: 2000,
      balance: 2000,
    },
  ]);

  const [prodShareLedger, setProdShareLedger] = useState<{
    date: string;
    ref: string;
    particulars: string;
    shares: number;
    debit: number;
    credit: number;
    balance: number;
  }[]>([]);

  const [prodSavingsLedger, setProdSavingsLedger] = useState<{
    date: string;
    ref: string;
    particulars: string;
    debit: number;
    credit: number;
    balance: number;
  }[]>([]);

  const activeShareLedger = isTestTenant
    ? (currentPersona === 'maria' ? mariaShareLedger : juanShareLedger)
    : (prodShareLedger.length > 0
        ? prodShareLedger
        : paidUpCapital > 0 ? [
            {
              date: '2026-01-20',
              ref: 'OR-SHR-2026-001',
              particulars: 'Initial Subscription & Paid-Up Capital Contribution',
              shares: sharesCount || Math.floor(paidUpCapital / 100),
              debit: 0,
              credit: paidUpCapital,
              balance: paidUpCapital,
            },
          ] : []);

  const activeSavingsLedger = isTestTenant
    ? (currentPersona === 'maria' ? mariaSavingsLedger : juanSavingsLedger)
    : (prodSavingsLedger.length > 0
        ? prodSavingsLedger
        : savingsBalance > 0 ? [
            {
              date: '2026-01-20',
              ref: 'OR-SAV-2026-001',
              particulars: 'Opening Compulsory Savings Account (2-01-01)',
              debit: 0,
              credit: savingsBalance,
              balance: savingsBalance,
            },
          ] : []);

  const activeLoanLedger = isTestTenant
    ? (currentPersona === 'maria' ? mariaLoanLedger : [])
    : (loanBalance > 0 ? [
        {
          date: '2026-02-01',
          ref: 'DISB-TX-LN001',
          particulars: 'Disbursement of Loan Proceeds via Escrow',
          principal: loanBalance,
          interest: 0,
          debit: loanBalance,
          credit: 0,
          balance: loanBalance,
        },
      ] : []);

  // Convenience Fee Calculator for PayMongo QR Ph (1.5%, NO minimum ₱15 floor; 0 when OPEX or Gateway Fee disabled)
  const calculateConvenienceFee = (amount: number) => {
    if (!paymongoFeeEnabled || paymongoFeeTreatment === 'OPEX') return 0.0;
    if (passbookPayModal.convenienceFeeOverride !== undefined) {
      return passbookPayModal.convenienceFeeOverride;
    }
    return Math.round(amount * 0.015 * 100) / 100;
  };

  const generatePassbookQrPhIntent = async (params: {
    loanId: string;
    installmentNumber: number;
    dueDate: string;
    dueAmount: number;
    principalAmount?: number;
    interestAmount?: number;
  }) => {
    const resolvedSlug =
      tenantInfo.slug && tenantInfo.slug !== 'default'
        ? tenantInfo.slug
        : resolveTenantCoop().slug || 'family-coop';
    const targetTenantId =
      (currentMember as any)?.tenantId && (currentMember as any)?.tenantId !== 'tenant_default'
        ? (currentMember as any)?.tenantId
        : `tenant_${resolvedSlug.replace(/[-_]coop$/, '')}`;

    // Refresh latest PayMongo public config before generating intent
    let currentFeeEnabled = paymongoFeeEnabled;
    let currentFeeTreatment = paymongoFeeTreatment;
    try {
      const cfgRes = await fetch(`${getApiBaseUrl()}/tenant/paymongo-public-config?coop=${resolvedSlug}`, {
        headers: {
          'x-tenant-slug': resolvedSlug,
          'x-tenant-id': targetTenantId,
        },
      });
      const cfgJson = await cfgRes.json();
      if (cfgRes.ok && cfgJson.success && cfgJson.data) {
        currentFeeEnabled =
          cfgJson.data.feeEnabled !== undefined
            ? Boolean(cfgJson.data.feeEnabled)
            : cfgJson.data.isEnabled !== undefined
            ? Boolean(cfgJson.data.isEnabled)
            : true;
        currentFeeTreatment =
          !currentFeeEnabled || cfgJson.data.feeTreatment === 'OPEX' ? 'OPEX' : 'PASS_THROUGH';
        setPaymongoFeeEnabled(currentFeeEnabled);
        setPaymongoFeeTreatment(currentFeeTreatment);
      }
    } catch {}

    const res = await fetch(
      `${getApiBaseUrl()}/loans/${encodeURIComponent(params.loanId)}/paymongo/create-intent?coop=${resolvedSlug}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': resolvedSlug,
          'x-tenant-id': targetTenantId,
        },
        body: JSON.stringify({
          memberId: currentMember.id,
          installmentNumber: params.installmentNumber,
          dueDate: params.dueDate,
          amount: params.dueAmount,
          dueAmount: params.dueAmount,
          principalAmount: params.principalAmount,
          interestAmount: params.interestAmount,
          feeTreatment: currentFeeTreatment,
          feeEnabled: currentFeeEnabled,
        }),
      }
    );
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      const respFeeEnabled = json.data.feeEnabled !== undefined ? Boolean(json.data.feeEnabled) : currentFeeEnabled;
      const respTreatment =
        !respFeeEnabled || json.data.feeTreatment === 'OPEX' ? 'OPEX' : 'PASS_THROUGH';
      setPaymongoFeeEnabled(respFeeEnabled);
      setPaymongoFeeTreatment(respTreatment);
      setPassbookPayModal((prev) => ({
        ...prev,
        qrImageUrl: json.data.qrImageUrl || '',
        paymentIntentId: json.data.paymentIntentId || '',
        checkoutUrl: json.data.checkoutUrl || '',
        checkoutLinkId: json.data.checkoutLinkId || '',
        convenienceFeeOverride:
          json.data.convenienceFee !== undefined ? Number(json.data.convenienceFee) : undefined,
        isGeneratingQr: false,
        verificationError: null,
      }));
      return true;
    }
    return false;
  };

  const handleOpenLoanPayNow = async (loan: any, dueRow: any) => {
    const dueAmt = Math.round(Number(dueRow?.tot || 4442.44) * 100) / 100;
    const prAmt = Math.round(Number(dueRow?.pr || Math.max(0, dueAmt - 460.58)) * 100) / 100;
    const inAmt = Math.round(Number(dueRow?.in || Math.max(0, dueAmt - prAmt)) * 100) / 100;
    const instNum = Number(dueRow?.seq || 1);
    const dueStr = String(dueRow?.due || new Date().toISOString().slice(0, 10));
    const targetLoanId = loan?.id || loan?.loanNumber || 'LN-2026-00001';
    const targetLoanNumber = loan?.loanNumber || loan?.id || 'LN-2026-00001';
    const desc = `Installment #${instNum} Due ${dueStr} (${loan?.productName || 'Member Loan'})`;

    setPassbookPayModal({
      open: true,
      type: 'LOAN',
      amount: dueAmt,
      description: desc,
      lockedAmount: true,
      loanId: targetLoanId,
      loanNumber: targetLoanNumber,
      installmentNumber: instNum,
      dueDate: dueStr,
      principalPortion: prAmt,
      interestPortion: inAmt,
      isGeneratingQr: true,
      isVerifyingPayment: false,
      verificationError: null,
    });

    try {
      const ok = await generatePassbookQrPhIntent({
        loanId: targetLoanId,
        installmentNumber: instNum,
        dueDate: dueStr,
        dueAmount: dueAmt,
        principalAmount: prAmt,
        interestAmount: inAmt,
      });
      if (ok) return;
    } catch {}
    setPassbookPayModal((prev) => ({ ...prev, isGeneratingQr: false }));
  };

  // Ensure a real PayMongo QR Ph image is generated if passbookPayModal is opened from Passbook tab without one
  useEffect(() => {
    if (
      passbookPayModal.open &&
      !passbookPayModal.isGeneratingQr &&
      !passbookPayModal.qrImageUrl &&
      !passbookPayModal.paymentIntentId &&
      passbookPayModal.amount > 0
    ) {
      setPassbookPayModal((prev) => ({ ...prev, isGeneratingQr: true, verificationError: null }));
      generatePassbookQrPhIntent({
        loanId: passbookPayModal.loanId || `PB-${passbookPayModal.type}`,
        installmentNumber: passbookPayModal.installmentNumber || 1,
        dueDate: passbookPayModal.dueDate || new Date().toISOString().slice(0, 10),
        dueAmount: passbookPayModal.amount,
        principalAmount: passbookPayModal.principalPortion,
        interestAmount: passbookPayModal.interestPortion,
      })
        .catch(() => {})
        .finally(() => {
          setPassbookPayModal((prev) => ({ ...prev, isGeneratingQr: false }));
        });
    }
  }, [passbookPayModal.open, passbookPayModal.type, passbookPayModal.amount]);

  // Automatic background polling of PayMongo QR Ph payment status while passbookPayModal is open
  useEffect(() => {
    if (!passbookPayModal.open || !passbookPayModal.paymentIntentId) return;
    const intentId = passbookPayModal.paymentIntentId;
    if (!intentId.startsWith('pi_') || intentId.startsWith('pi_qrph_')) return;

    const resolvedSlug =
      tenantInfo.slug && tenantInfo.slug !== 'default'
        ? tenantInfo.slug
        : resolveTenantCoop().slug || 'family-coop';
    const targetTenantId =
      (currentMember as any)?.tenantId && (currentMember as any)?.tenantId !== 'tenant_default'
        ? (currentMember as any)?.tenantId
        : `tenant_${resolvedSlug.replace(/[-_]coop$/, '')}`;

    let isCancelled = false;
    const interval = setInterval(async () => {
      if (isCancelled) return;
      try {
        const linkQuery = passbookPayModal.checkoutLinkId
          ? `&linkId=${encodeURIComponent(passbookPayModal.checkoutLinkId)}`
          : '';
        const res = await fetch(
          `${getApiBaseUrl()}/shares/paymongo/status/${encodeURIComponent(intentId)}?coop=${resolvedSlug}${linkQuery}`,
          {
            headers: {
              'x-tenant-slug': resolvedSlug,
              'x-tenant-id': targetTenantId,
            },
          }
        );
        const json = await res.json();
        if (!isCancelled && res.ok && json.success && json.data?.isPaid === true) {
          clearInterval(interval);
          const payType = passbookPayModal.type;
          const payAmt = passbookPayModal.amount;
          setPassbookPayModal((prev) => ({
            ...prev,
            open: false,
            isVerifyingPayment: false,
            verificationError: null,
          }));
          handleExecutePassbookPayment(payType, payAmt);
        }
      } catch {}
    }, 4000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [passbookPayModal.open, passbookPayModal.paymentIntentId, passbookPayModal.checkoutLinkId]);

  const handleVerifyAndCompletePassbookPayment = async () => {
    const intentId = passbookPayModal.paymentIntentId;
    const linkId = passbookPayModal.checkoutLinkId;

    if (!intentId || !intentId.startsWith('pi_') || intentId.startsWith('pi_qrph_')) {
      setPassbookPayModal((prev) => ({
        ...prev,
        verificationError:
          'PayMongo QR Ph payment session is still initializing or has not been paid yet. Please scan the PayMongo QR Ph code and complete your payment first.',
      }));
      return;
    }

    setPassbookPayModal((prev) => ({
      ...prev,
      isVerifyingPayment: true,
      verificationError: null,
    }));

    try {
      const resolvedSlug =
        tenantInfo.slug && tenantInfo.slug !== 'default'
          ? tenantInfo.slug
          : resolveTenantCoop().slug || 'family-coop';
      const targetTenantId =
        (currentMember as any)?.tenantId && (currentMember as any)?.tenantId !== 'tenant_default'
          ? (currentMember as any)?.tenantId
          : `tenant_${resolvedSlug.replace(/[-_]coop$/, '')}`;

      const linkQuery = linkId ? `&linkId=${encodeURIComponent(linkId)}` : '';
      const res = await fetch(
        `${getApiBaseUrl()}/shares/paymongo/status/${encodeURIComponent(intentId)}?coop=${resolvedSlug}${linkQuery}`,
        {
          headers: {
            'x-tenant-slug': resolvedSlug,
            'x-tenant-id': targetTenantId,
          },
        }
      );
      const json = await res.json();

      if (!res.ok || !json.success || json.data?.isPaid !== true) {
        const statusStr = json?.data?.status || 'awaiting_payment';
        setPassbookPayModal((prev) => ({
          ...prev,
          isVerifyingPayment: false,
          verificationError: `PayMongo payment has not been confirmed yet (Status: ${statusStr}). Please scan the QR Ph code above and complete the payment in your banking or e-wallet app before clicking Complete.`,
        }));
        return;
      }

      const payType = passbookPayModal.type;
      const payAmt = passbookPayModal.amount;
      setPassbookPayModal((prev) => ({
        ...prev,
        open: false,
        isVerifyingPayment: false,
        verificationError: null,
      }));
      await handleExecutePassbookPayment(payType, payAmt);
    } catch (err: any) {
      setPassbookPayModal((prev) => ({
        ...prev,
        isVerifyingPayment: false,
        verificationError:
          err?.message || 'Unable to verify PayMongo payment status. Please ensure payment is completed and try again.',
      }));
    }
  };

  // Persist a verified PayMongo passbook Savings / Shares payment to the cooperative database before reflecting it on-device
  const persistPassbookPayment = async (kind: 'SAVINGS' | 'SHARES', amount: number): Promise<any | null> => {
    try {
      const targetTenantSlug =
        tenantInfo.slug && tenantInfo.slug !== 'default' ? tenantInfo.slug : resolveTenantCoop().slug || 'family-coop';
      const targetTenantId =
        (currentMember as any)?.tenantId && (currentMember as any)?.tenantId !== 'tenant_default'
          ? (currentMember as any)?.tenantId
          : `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;
      const url =
        kind === 'SHARES'
          ? `${getApiBaseUrl()}/shares/paymongo/verify-and-complete?coop=${targetTenantSlug}`
          : `${getApiBaseUrl()}/savings/deposit?coop=${targetTenantSlug}`;
      const body =
        kind === 'SHARES'
          ? {
              memberId: currentMember.id,
              sharesCount: Math.floor(amount / 100),
              amount,
              paymentIntentId: passbookPayModal.paymentIntentId,
              checkoutLinkId: passbookPayModal.checkoutLinkId,
            }
          : {
              memberId: currentMember.id,
              amount,
              savingsType: 'VOLUNTARY',
              channel: 'PAYMONGO_QRPH',
              passOnFee: calculateConvenienceFee(amount),
              paymentIntentId: passbookPayModal.paymentIntentId,
              checkoutLinkId: passbookPayModal.checkoutLinkId,
            };
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-slug': targetTenantSlug, 'x-tenant-id': targetTenantId },
        body: JSON.stringify(body),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) {
        alert(j.error || 'Your payment could not be recorded in the cooperative database. No changes were applied.');
        return null;
      }
      return j;
    } catch (e: any) {
      alert(`Network error while recording payment: ${e?.message || 'unknown error'}. No changes were applied.`);
      return null;
    }
  };

  const handleExecutePassbookPayment = async (type: 'LOAN' | 'SAVINGS' | 'SHARES', amount: number) => {
    const fee = calculateConvenienceFee(amount);
    const total = Math.round((amount + fee) * 100) / 100;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString();
    const orNum = `OR-${now.getFullYear()}-QR${Math.floor(10000 + Math.random() * 90000)}`;

    if (type === 'LOAN') {
      const ACTIVE_LOAN_STATUSES = ['DISBURSED', 'RELEASED', 'ACTIVE', 'APPROVED', 'APPROVED_FOR_RELEASE', 'FOR_DISBURSEMENT'];
      const targetLoan =
        memberLoanApplications.find(
          (app: any) =>
            (passbookPayModal.loanId && (app.id === passbookPayModal.loanId || app.loanNumber === passbookPayModal.loanId)) ||
            (passbookPayModal.loanNumber && (app.loanNumber === passbookPayModal.loanNumber || app.id === passbookPayModal.loanNumber))
        ) ||
        memberLoanApplications.find((app: any) => app.status === 'DISBURSED') ||
        memberLoanApplications.find((app: any) => ACTIVE_LOAN_STATUSES.includes(String(app.status || '').toUpperCase()));

      const effectiveBal =
        pickNumber(targetLoan?.balanceRemaining, targetLoan?.principalAmount, targetLoan?.amount, loanBalance) || loanBalance;
      const computedRows = targetLoan ? getLoanScheduleRows(targetLoan, effectiveBal) : [];
      const nextDueRow = computedRows.find((r: any) => r.status !== 'PAID');

      const instNum = passbookPayModal.installmentNumber || nextDueRow?.seq || 2;
      const interestPart =
        passbookPayModal.interestPortion !== undefined
          ? passbookPayModal.interestPortion
          : nextDueRow?.in !== undefined
          ? Number(nextDueRow.in)
          : 460.58;
      const principalPart =
        passbookPayModal.principalPortion !== undefined
          ? passbookPayModal.principalPortion
          : nextDueRow?.pr !== undefined
          ? Number(nextDueRow.pr)
          : Math.max(0, Math.round((amount - interestPart) * 100) / 100);

      const localNewBal = Math.max(0, Math.round((effectiveBal - principalPart) * 100) / 100);
      const loanRef = targetLoan?.loanNumber || targetLoan?.id || passbookPayModal.loanNumber || 'LN-2026-00001';

      // 1. Persist repayment to the cooperative database FIRST (Firestore loan schedule, balance, borrower loanBalance, CDA GL).
      //    The device only reflects the payment after the server confirms it was saved.
      let serverBalance: number | undefined;
      try {
        const targetTenantSlug =
          tenantInfo.slug && tenantInfo.slug !== 'default'
            ? tenantInfo.slug
            : resolveTenantCoop().slug || 'family-coop';
        const targetTenantId =
          (currentMember as any)?.tenantId && (currentMember as any)?.tenantId !== 'tenant_default'
            ? (currentMember as any)?.tenantId
            : `tenant_${targetTenantSlug.replace(/[-_]coop$/, '')}`;
        const repayRes = await fetch(
          `${getApiBaseUrl()}/loans/${encodeURIComponent(targetLoan?.id || loanRef)}/repay?coop=${targetTenantSlug}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-slug': targetTenantSlug,
              'x-tenant-id': targetTenantId,
            },
            body: JSON.stringify({
              memberId: currentMember.id,
              installmentNumber: instNum,
              dueAmount: amount,
              principalAmount: principalPart,
              interestAmount: interestPart,
              convenienceFee: fee,
              feeTreatment: !paymongoFeeEnabled || paymongoFeeTreatment === 'OPEX' ? 'OPEX' : 'PASS_THROUGH',
              paymentIntentId: passbookPayModal.paymentIntentId,
              checkoutLinkId: passbookPayModal.checkoutLinkId,
              orNumber: orNum,
            }),
          }
        );
        const repayJson = await repayRes.json().catch(() => ({}));
        if (!repayRes.ok || !repayJson.success) {
          alert(
            repayJson.error ||
              'Your loan payment could not be recorded in the cooperative database. No changes were applied. Please try again or contact the cooperative office.'
          );
          return;
        }
        if (repayJson.loanBalanceRemaining !== undefined && repayJson.loanBalanceRemaining !== null) {
          serverBalance = Number(repayJson.loanBalanceRemaining);
        }
      } catch (repayErr: any) {
        alert(`Network error while recording loan payment: ${repayErr?.message || 'unknown error'}. No changes were applied.`);
        return;
      }

      const newBal = serverBalance !== undefined ? serverBalance : localNewBal;
      const newRepaymentEntry = {
        date: dateStr,
        ref: orNum,
        installmentNumber: instNum,
        particulars: `Installment #${instNum} Repayment via PayMongo QR Ph (Principal ₱${principalPart.toFixed(2)} + Interest ₱${interestPart.toFixed(2)})`,
        principal: principalPart,
        interest: interestPart,
        convenienceFee: fee,
        totalPaid: total,
        debit: 0,
        credit: principalPart,
        balance: newBal,
      };

      setLoanBalance(newBal);
      setMariaLoanLedger((prev) => [...prev, newRepaymentEntry]);

      // Update memberLoanApplications and localStorage so Passbook Amortization Schedule & Admin Portal reflect PAID immediately
      const applyLoanUpdate = (loanItem: any) => {
        const rows = getLoanScheduleRows(loanItem, effectiveBal);
        const updatedSchedule = rows.map((r: any) => {
          const isTarget = Number(r.seq) === Number(instNum);
          const alreadyPaid = r.status === 'PAID' || isTarget;
          return {
            installmentNumber: r.seq,
            dueDate: r.due,
            principalAmount: r.pr,
            interestAmount: r.in,
            totalInstallment: r.tot,
            endingBalance: r.bal,
            isPaid: alreadyPaid,
            status: alreadyPaid ? 'PAID' : 'UPCOMING',
            ...(isTarget ? { paidAt: now.toISOString(), paymentReference: orNum } : {}),
          };
        });
        const existingRepayments = Array.isArray(loanItem.repayments) ? loanItem.repayments : [];
        return {
          ...loanItem,
          balanceRemaining: newBal,
          schedule: updatedSchedule,
          repayments: [...existingRepayments, newRepaymentEntry],
          status: newBal <= 0 ? 'PAID' : loanItem.status,
          updatedAt: now.toISOString(),
        };
      };

      setMemberLoanApplications((prev) =>
        prev.map((app: any) => {
          if (targetLoan && (app.id === targetLoan.id || app.loanNumber === targetLoan.loanNumber)) {
            return applyLoanUpdate(app);
          }
          return app;
        })
      );

      try {
        const storageKey = `flexcoop_loan_applications_${tenantInfo.slug}`;
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const updatedAll = parsed.map((app: any) => {
              if (targetLoan && (app.id === targetLoan.id || app.loanNumber === targetLoan.loanNumber)) {
                return applyLoanUpdate(app);
              }
              return app;
            });
            localStorage.setItem(storageKey, JSON.stringify(updatedAll));
          }
        }
      } catch {}

      setPassbookReceipt({
        orNumber: orNum,
        date: dateStr,
        time: timeStr,
        accountCode: '1-02-01',
        accountName: 'Loans Receivable - Regular',
        baseAmount: amount,
        convenienceFee: fee,
        totalAmount: total,
        newBalance: newBal,
        reference: loanRef,
        description: `Installment #${instNum} Loan Amortization Payment`,
      });
    } else if (type === 'SAVINGS') {
      const persisted = await persistPassbookPayment('SAVINGS', amount);
      if (!persisted) return;
      const newBal =
        persisted.member?.savingsBalance !== undefined
          ? Number(persisted.member.savingsBalance)
          : Math.round((savingsBalance + amount) * 100) / 100;
      setSavingsBalance(newBal);

      if (isTestTenant) {
        if (currentPersona === 'maria') {
          setMariaSavingsLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Voluntary Savings Deposit via PayMongo QR Ph Rail`,
              debit: 0,
              credit: amount,
              balance: newBal,
            },
          ]);
        } else {
          setJuanSavingsLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Voluntary Savings Deposit via PayMongo QR Ph Rail`,
              debit: 0,
              credit: amount,
              balance: newBal,
            },
          ]);
        }
      } else {
        setProdSavingsLedger((prev) => [
          ...prev,
          {
            date: dateStr,
            ref: orNum,
            particulars: `Voluntary Savings Deposit via PayMongo QR Ph Rail`,
            debit: 0,
            credit: amount,
            balance: newBal,
          },
        ]);
      }

      setPassbookReceipt({
        orNumber: orNum,
        date: dateStr,
        time: timeStr,
        accountCode: '2-01-01',
        accountName: 'Savings Deposits - Voluntary',
        baseAmount: amount,
        convenienceFee: fee,
        totalAmount: total,
        newBalance: newBal,
        reference: isTestTenant ? (currentPersona === 'maria' ? 'SAV-2026-0001' : 'SAV-2026-0002') : `SAV-${currentMember.memberNumber || '001'}`,
        description: 'Voluntary Member Savings Deposit',
      });
    } else if (type === 'SHARES') {
      const persisted = await persistPassbookPayment('SHARES', amount);
      if (!persisted) return;
      const newShares = Math.floor(amount / 100);
      const newPaidUp =
        persisted.member?.paidUpShares !== undefined
          ? Number(persisted.member.paidUpShares)
          : Math.round((paidUpCapital + amount) * 100) / 100;
      setPaidUpCapital(newPaidUp);
      if (persisted.member?.sharesCount !== undefined) {
        setSharesCount(Number(persisted.member.sharesCount));
      } else if (!persisted.duplicate) {
        setSharesCount((prev) => prev + newShares);
      }

      if (isTestTenant) {
        if (currentPersona === 'maria') {
          setMariaShareLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Capital Build-Up (+${newShares} Shares @ ₱100 Par) via QR Ph`,
              shares: newShares,
              debit: 0,
              credit: amount,
              balance: newPaidUp,
            },
          ]);
        } else {
          setJuanShareLedger((prev) => [
            ...prev,
            {
              date: dateStr,
              ref: orNum,
              particulars: `Capital Build-Up (+${newShares} Shares @ ₱100 Par) via QR Ph`,
              shares: newShares,
              debit: 0,
              credit: amount,
              balance: newPaidUp,
            },
          ]);
        }
      } else {
        setProdShareLedger((prev) => [
          ...prev,
          {
            date: dateStr,
            ref: orNum,
            particulars: `Capital Build-Up (+${newShares} Shares) via QR Ph`,
            shares: newShares,
            debit: 0,
            credit: amount,
            balance: newPaidUp,
          },
        ]);
      }

      setPassbookReceipt({
        orNumber: orNum,
        date: dateStr,
        time: timeStr,
        accountCode: '3-01-03',
        accountName: 'Paid-Up Share Capital - Common',
        baseAmount: amount,
        convenienceFee: fee,
        totalAmount: total,
        newBalance: newPaidUp,
        reference: isTestTenant ? (currentPersona === 'maria' ? 'SC-2026-0001' : 'SC-2026-0002') : `SC-${currentMember.memberNumber || '001'}`,
        description: 'Paid-Up Share Capital Build-Up Deposit',
      });
    }

    setPassbookPayModal({ open: false, type: 'LOAN', amount: 0, description: '' });
  };

  const handleToggleBiometrics = async () => {
    setBiometricsNotice(null);
    const bioKey = `flexcoop_biometrics_enabled_${tenantInfo.slug}`;
    const userKey = `flexcoop_biometrics_member_${tenantInfo.slug}`;

    if (isBiometricsEnabled) {
      try {
        localStorage.removeItem(bioKey);
        localStorage.removeItem(userKey);
        setIsBiometricsEnabled(false);
        setBiometricsNotice('Device biometrics disabled for this cooperative account.');
        setTimeout(() => setBiometricsNotice(null), 4000);
      } catch (err: any) {
        setBiometricsNotice('Failed to disable biometrics.');
      }
      return;
    }

    setBiometricsLoading(true);
    try {
      let credentialId: string | null = null;
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        const isPlatformAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
        if (!isPlatformAvailable) {
          setBiometricsNotice('Touch ID / Face ID / Windows Hello is not available or configured on this device/browser.');
          setBiometricsLoading(false);
          return;
        }

        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const userIdBytes = new TextEncoder().encode(currentMember.id || currentMember.memberNumber || 'mem_default');

        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: {
              name: tenantInfo.name || 'Cooperative Enterprise',
              id: window.location.hostname,
            },
            user: {
              id: userIdBytes,
              name: currentMember.email || currentMember.memberNumber || 'member',
              displayName: currentMember.name || 'Coop Member',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },
              { alg: -257, type: 'public-key' },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              residentKey: 'required',
              requireResidentKey: true,
              userVerification: 'preferred',
            },
            timeout: 60000,
          },
        })) as any;

        if (cred && cred.rawId) {
          credentialId = uint8ArrayToBase64Url(cred.rawId);
        }
      }

      const bioPayload = {
        id: currentMember.id,
        memberNumber: currentMember.memberNumber,
        name: currentMember.name,
        identifier: currentMember.email || currentMember.mobile || currentMember.memberNumber || 'mem_0001',
        credentialId: credentialId,
        rpId: typeof window !== 'undefined' ? window.location.hostname : undefined,
        enabledAt: new Date().toISOString(),
      };

      localStorage.setItem(bioKey, 'true');
      localStorage.setItem(userKey, JSON.stringify(bioPayload));
      setIsBiometricsEnabled(true);
      setBiometricsNotice('Device biometrics (Touch ID / Face ID) successfully enabled on this device!');
      setTimeout(() => setBiometricsNotice(null), 5000);
    } catch (err: any) {
      if (err?.name === 'NotAllowedError') {
        setBiometricsNotice('Biometric setup was cancelled or timed out.');
      } else {
        setBiometricsNotice('Could not enable biometrics: ' + (err.message || 'Device authentication error'));
      }
    } finally {
      setBiometricsLoading(false);
    }
  };

  const handleExecuteChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    const cur = currentPasswordInput.trim();
    const next = newPasswordInput.trim();
    const conf = confirmPasswordInput.trim();

    if (!cur || !next || !conf) {
      setPasswordChangeError('All fields are required.');
      return;
    }
    if (next.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters.');
      return;
    }
    if (next !== conf) {
      setPasswordChangeError('New password and confirmation password do not match.');
      return;
    }

    setPasswordChangeLoading(true);
    try {
      const id = currentMember.memberNumber || currentMember.email || currentMember.name || 'mem_0001';
      const res = await fetch(`${getApiBaseUrl()}/auth/member/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantInfo.slug,
        },
        body: JSON.stringify({
          identifier: id,
          email: currentMember.email,
          memberNumber: currentMember.memberNumber,
          memberId: currentMember.id,
          currentPassword: cur,
          newPassword: next,
          currentPin: cur,
          newPin: next,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordChangeSuccess('Your password has been updated successfully.');
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPasswordChangeSuccess(null);
        }, 1800);
      } else {
        setPasswordChangeError(data.error || 'Failed to update password. Please verify your current password.');
      }
    } catch (err: any) {
      setPasswordChangeError(err.message || 'Network error updating password.');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Verifying Member Authorization...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Main Body with Safe Bottom Padding for Mobile Navigation Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 sm:pt-6 pb-28 sm:pb-32">

        {/* TAB 1: MY PORTFOLIO (Dashboard) */}
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Pending Co-Maker Notice Banner */}
            {endorsementRequests.some(
              (r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING'
            ) && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-950 text-sm">You have a Pending Co-Maker Endorsement Request!</span>
                    <p className="text-amber-800 mt-0.5">
                      {(() => {
                        const req = endorsementRequests.find(
                          (r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING'
                        );
                        return `${req?.borrowerName || 'A member'} designated your Member ID (${currentMember.memberNumber}) as loan co-maker. Your joint solidary acceptance is required before the loan is reviewed.`;
                      })()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('comaker')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-sm shrink-0"
                >
                  Review Request & Sign
                </button>
              </div>
            )}

            {/* Member Account Card with Financial Overview (Moved from More) */}
            <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold truncate text-white">{currentMember.name}</h2>
                  <div className="text-xs text-slate-300 font-mono mt-0.5">
                    {currentMember.memberNumber}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border ${
                  currentMember.classification === 'REGULAR'
                    ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/40'
                    : 'bg-amber-500/30 text-amber-100 border-amber-400/40'
                }`}>
                  {currentMember.classification === 'REGULAR' ? 'Regular Member' : 'Associate Member'}
                </span>
              </div>

              {/* Financial Quick Glance */}
              <div className={`grid ${savingsDepositEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-5 pt-4 border-t border-emerald-700/50 text-center`}>
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">Share Capital</div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">
                    ₱{paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
                {savingsDepositEnabled && (
                  <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                    <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">Savings</div>
                    <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">
                      ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}
                <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm">
                  <div className="text-[10px] uppercase font-semibold text-emerald-200 tracking-wider">Loan Balance</div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono mt-0.5">
                    ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>

            {/* Initial Share Capital Payment Alert for Verified Member with Pending Initial Share Capital */}
            {paidUpCapital === 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          Action Required: Settle Initial Share Capital
                        </h3>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                          Verified • Pledge Pending
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Your membership application has been approved! Settle your pledged initial share capital to activate your account, qualify for loans, and earn annual dividends.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDepositModalType('SHARES');
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 shrink-0 flex items-center justify-center gap-1.5 transition"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Initial Share Capital</span>
                  </button>
                </div>
              </div>
            )}

            {/* Active Loan Next Payment Due Date & Due Amount Reminder with PayMongo QR Ph "Pay Now" */}
            {(() => {
              const ACTIVE_LOAN_STATUSES = ['DISBURSED', 'RELEASED', 'ACTIVE', 'APPROVED', 'APPROVED_FOR_RELEASE', 'FOR_DISBURSEMENT'];
              const activeDisbursedLoan =
                memberLoanApplications.find(
                  (app: any) =>
                    app.status === 'DISBURSED' &&
                    matchesMember(app, currentMember) &&
                    Number(app.balanceRemaining ?? app.amount ?? 1) > 0
                ) ||
                memberLoanApplications.find(
                  (app: any) =>
                    ACTIVE_LOAN_STATUSES.includes(String(app.status || '').toUpperCase()) &&
                    matchesMember(app, currentMember) &&
                    Number(app.balanceRemaining ?? app.amount ?? 1) > 0
                );
              if (!activeDisbursedLoan) return null;

              const effectiveBal = pickNumber(
                activeDisbursedLoan?.balanceRemaining,
                activeDisbursedLoan?.principalAmount,
                activeDisbursedLoan?.amount
              );
              if (effectiveBal <= 0) return null;

              const scheduleRows = getLoanScheduleRows(activeDisbursedLoan, effectiveBal);
              const nextDueRow = scheduleRows.find((r: any) => r.status !== 'PAID');
              if (!nextDueRow) return null;

              const loanRef = activeDisbursedLoan?.loanNumber || activeDisbursedLoan?.id || 'LN-2026-00001';
              const productName = activeDisbursedLoan?.productName || 'Regular Member Loan';
              const dueAmount = Number(nextDueRow.tot || 0);
              const prAmount = Number(nextDueRow.pr || 0);
              const inAmount = Number(nextDueRow.in || 0);
              const paidCount = scheduleRows.filter((r: any) => r.status === 'PAID').length;

              return (
                <div className="bg-gradient-to-r from-amber-50 via-white to-emerald-50/70 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-amber-200/90 text-amber-950 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-400">
                            Upcoming Loan Payment Reminder
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {loanRef}
                          </span>
                          <span className="text-xs font-semibold text-emerald-800">
                            • {productName}
                          </span>
                        </div>
                        <div className="text-sm sm:text-base font-extrabold text-slate-900">
                          Next Payment Due Date:{' '}
                          <span className="text-amber-800 underline decoration-amber-400 underline-offset-4">
                            {nextDueRow.due}
                          </span>{' '}
                          <span className="text-xs font-semibold text-slate-500">
                            (Installment #{nextDueRow.seq} of {scheduleRows.length} • {paidCount} Paid)
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Principal: <strong className="font-mono text-slate-800">₱{prAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> + Interest: <strong className="font-mono text-amber-800">₱{inAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> • Remaining Principal Balance: <strong className="font-mono text-slate-900">₱{effectiveBal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-amber-200/80 shrink-0">
                      <div className=" sm:text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Exact Amount Due
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800">
                          ₱{dueAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLoanPayNow(activeDisbursedLoan, nextDueRow)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-700/20 transition flex items-center gap-2 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Pay Now (QR Ph)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Action Buttons Section */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quick Actions
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold">Self-Service</span>
              </div>

              <div className={`grid ${savingsDepositEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 sm:gap-3`}>
                {/* Deposit Savings (Removes completely when disabled) */}
                {savingsDepositEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setDepositModalType('SAVINGS');
                      setDepositSuccessResult(null);
                    }}
                    className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 bg-slate-50/70 transition-all text-center group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                      Deposit Savings
                    </span>
                    <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">3% p.a. Compounded</span>
                  </button>
                )}

                {/* Purchase Share */}
                <button
                  type="button"
                  onClick={() => {
                    setDepositModalType('SHARES');
                    setDepositChannel('PAYMONGO_QRPH');
                    setPaymongoActivePayment(null);
                    setDepositSuccessResult(null);
                  }}
                  className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 bg-slate-50/70 transition-all text-center group"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-xs">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-tight">
                    Purchase Share
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">Capital Build-Up</span>
                </button>

                {/* Apply for Loan */}
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 bg-slate-50/70 transition-all text-center group"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-tight">
                    Apply for Loan
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">Diminishing Rate</span>
                </button>
              </div>
            </div>

            {/* Active Loan Applications & Underwriting Pipeline (Dashboard Section) */}
            {memberLoanApplications.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        My Submitted Loan Applications
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Real-time underwriting evaluation &amp; approval status
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('applications')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
                  >
                    <span>View All ({memberLoanApplications.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {memberLoanApplications.slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-xs">
                              {app.loanNumber || app.id}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-semibold text-slate-800 text-xs">
                              {app.productName || 'Loan Product'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Filed on {app.submittedAt || 'Recent'}
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${getStatusBadgeClass(app.status)}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {formatLoanStatus(app.status)}
                          </span>
                        </div>
                      </div>

                      {/* Rejection / Cancellation Alert on Dashboard Card */}
                      {app.status === 'REJECTED' && (
                        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            <strong>Application Declined:</strong> Underwriting evaluation did not approve this loan.
                            {app.rejectionRemarks ? ` Remarks: ${app.rejectionRemarks}` : ''}
                          </span>
                        </div>
                      )}
                      {app.status === 'CANCELLED' && (
                        <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 text-[11px] flex items-center gap-2">
                          <Ban className="w-4 h-4 text-slate-500 shrink-0" />
                          <span>
                            <strong>Application Cancelled:</strong> This loan application has been cancelled and voided.
                            {app.cancellationRemarks ? ` Remarks: ${app.cancellationRemarks}` : ''}
                          </span>
                        </div>
                      )}

                      {/* Key metrics */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-white rounded-lg border border-slate-200/80 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Principal</span>
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            ₱{(Number(app.amount || app.principalAmount || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Term</span>
                          <span className="font-bold text-slate-900 text-xs">
                            {app.termMonths || 12} Mos
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase block">Monthly</span>
                          <span className="font-bold text-emerald-800 font-mono text-xs">
                            ₱{(Number(app.monthlyAmortization || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoanForDisclosure(app);
                            setDisclosureBackTab('home');
                            setActiveTab('documents');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>RA 3765 Disclosure</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoanForDisclosure(app);
                            setActiveTab('applications');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          <span>Track Status</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: DIGITAL PASSBOOK & MEMBER SUBSIDIARY LEDGER (OPTION 4) */}
        {activeTab === 'passbook' && (
          <div className="space-y-6">
            {/* Subsidiary Ledger Balances Bar */}
            <div className={`grid grid-cols-1 ${savingsDepositEnabled ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5`}>
              {/* Card 1: Share Capital SL (3-01-03) */}
              <div
                onClick={() => setPassbookSubTab('shares')}
                className={`p-6 rounded-2xl border transition cursor-pointer ${
                  passbookSubTab === 'shares'
                    ? 'bg-amber-50/50 border-amber-400 shadow-md ring-2 ring-amber-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Paid-Up Share Capital</span>
                  <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    GL 3-01-03
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-slate-900 mt-2">
                  ₱{paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>{sharesCount} shares @ ₱100.00 par</span>
                  <span className="text-amber-800 font-bold">Dividend Eligible</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-900 font-semibold">
                  <span>Click to view ledger</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card 2: Savings Passbook (2-01-01) */}
              {savingsDepositEnabled && (
                <div
                  onClick={() => setPassbookSubTab('savings')}
                  className={`p-6 rounded-2xl border transition cursor-pointer ${
                    passbookSubTab === 'savings'
                      ? 'bg-emerald-50/50 border-emerald-400 shadow-md ring-2 ring-emerald-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Savings Deposits Passbook</span>
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      GL 2-01-01
                    </span>
                  </div>
                  <div className="text-3xl font-black font-mono text-slate-900 mt-2">
                    ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>Compulsory + Voluntary</span>
                    <span className="text-emerald-700 font-bold">3.0% p.a. Interest</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                    <span>Click to view passbook</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* Card 3: Loans Receivable (1-02-01) */}
              <div
                onClick={() => setPassbookSubTab('loan')}
                className={`p-6 rounded-2xl border transition cursor-pointer ${
                  passbookSubTab === 'loan'
                    ? 'bg-indigo-50/50 border-indigo-400 shadow-md ring-2 ring-indigo-400/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Outstanding Loan Balance</span>
                  <span className="font-mono text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                    GL 1-02-01
                  </span>
                </div>
                <div className="text-3xl font-black font-mono text-slate-900 mt-2">
                  ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>{loanBalance > 0 ? 'LN-2026-00001 (Regular Loan)' : 'No Active Borrowings'}</span>
                  <span className={loanBalance > 0 ? 'text-indigo-700 font-bold' : 'text-emerald-700 font-bold'}>
                    {loanBalance > 0 ? 'Installment Active' : 'Clean Credit'}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-900 font-semibold">
                  <span>Click to view amortization</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Sub-Ledger Detailed Statements Panel */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Sub-ledger Tabs Navigation */}
              <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setPassbookSubTab('shares')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      passbookSubTab === 'shares'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Share Capital Ledger (3-01-03)</span>
                  </button>

                  {savingsDepositEnabled && (
                    <button
                      type="button"
                      onClick={() => setPassbookSubTab('savings')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                        passbookSubTab === 'savings'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>Savings Passbook (2-01-01)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setPassbookSubTab('loan')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      passbookSubTab === 'loan'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Loan Amortization & SL (1-02-01)</span>
                  </button>
                </div>

                {passbookSubTab === 'savings' && savingsDepositEnabled && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPassbookPayModal({
                          open: true,
                          type: 'SAVINGS',
                          amount: 1000,
                          description: 'Voluntary Savings Deposit',
                        });
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Deposit Savings (+QR Ph)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SUB-LEDGER 1: SHARE CAPITAL (3-01-03) */}
              {passbookSubTab === 'shares' && (() => {
                const effectiveSubscribed = Math.max(subscribedShares || 50, sharesCount || 0);
                const totalSubscribedAmount = effectiveSubscribed * 100;
                const unpaidPledgeAmount = Math.max(0, totalSubscribedAmount - paidUpCapital);
                const unpaidPledgeShares = Math.max(0, effectiveSubscribed - sharesCount);
                const paidUpRatio = totalSubscribedAmount > 0 ? Math.min(100, Math.round((paidUpCapital / totalSubscribedAmount) * 100)) : 100;
                const isPledgeFullyPaid = unpaidPledgeAmount === 0;

                return (
                  <div className="p-6 space-y-6">
                    {/* Share Capital Target & Subscription Summary */}
                    <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div>
                        <div className="font-bold text-amber-950 text-sm flex items-center gap-2">
                          <span>Common Stock Subscription & Paid-Up Capital</span>
                          <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono">
                            ₱100.00 Par Value
                          </span>
                          {isPledgeFullyPaid ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> FULLY PAID PLEDGE
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-300">
                              PARTIALLY PAID PLEDGE
                            </span>
                          )}
                        </div>
                        <p className="text-amber-800 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>Subscribed Shares: <strong>{effectiveSubscribed} shares (₱{totalSubscribedAmount.toLocaleString()}.00)</strong></span>
                          <span>•</span>
                          <span>Paid-Up: <strong>{sharesCount} shares (₱{paidUpCapital.toLocaleString()}.00)</strong></span>
                          {unpaidPledgeAmount > 0 ? (
                            <>
                              <span>•</span>
                              <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                Unpaid Pledge Balance: ₱{unpaidPledgeAmount.toLocaleString()}.00 ({unpaidPledgeShares} shares)
                              </span>
                            </>
                          ) : (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">
                                Subscription Pledge 100% Settled
                              </span>
                            </>
                          )}
                        </p>
                        {unpaidPledgeAmount > 0 && (
                          <div className="mt-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDepositModalType('SHARES');
                                setDepositSharesCount(unpaidPledgeShares);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg transition shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle Unpaid Pledge ({unpaidPledgeShares} shares / ₱{unpaidPledgeAmount.toLocaleString()}.00)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="sm:text-right shrink-0">
                        <div className="text-[10px] font-bold text-amber-900 uppercase">Paid-Up Ratio</div>
                        <div className="text-2xl font-black text-amber-900 font-mono">
                          {paidUpRatio}%
                        </div>
                        <div className="text-[10px] text-amber-700 font-medium">
                          {isPledgeFullyPaid ? 'Pledge 100% Settled' : `₱${unpaidPledgeAmount.toLocaleString()} to complete`}
                        </div>
                      </div>
                    </div>

                    {/* Share Capital Ledger Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Posting Date</th>
                            <th className="p-3.5">OR / Ref No.</th>
                            <th className="p-3.5">Transaction Particulars</th>
                            <th className="p-3.5 text-center">Shares</th>
                            <th className="p-3.5 text-right">Debit (DR)</th>
                            <th className="p-3.5 text-right">Credit (CR)</th>
                            <th className="p-3.5 text-right">Running Paid-Up</th>
                            <th className="p-3.5 text-right">Unpaid Pledge Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          {/* Opening Capital Subscription Pledge Commitment */}
                          <tr className="bg-amber-50/40 text-amber-950 font-medium">
                            <td className="p-3.5 text-slate-500 font-sans">Initial</td>
                            <td className="p-3.5 font-bold text-amber-900">SUB-PLEDGE</td>
                            <td className="p-3.5 font-sans">
                              Capital Subscription Pledge Commitment ({effectiveSubscribed} Shares @ ₱100 Par)
                            </td>
                            <td className="p-3.5 text-center font-bold text-amber-900">{effectiveSubscribed} (Pledged)</td>
                            <td className="p-3.5 text-right text-slate-400">₱0.00</td>
                            <td className="p-3.5 text-right text-slate-400">₱0.00</td>
                            <td className="p-3.5 text-right font-black text-slate-900">₱0.00</td>
                            <td className="p-3.5 text-right font-bold text-rose-700">
                              ₱{totalSubscribedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>

                          {activeShareLedger.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400 font-sans text-xs">
                                No share capital deposits recorded yet. Payments applied towards the subscription pledge will appear here.
                              </td>
                            </tr>
                          ) : (
                            activeShareLedger.map((tx, idx) => {
                              const remainingPledge = Math.max(0, totalSubscribedAmount - tx.balance);
                              return (
                                <tr key={idx} className="hover:bg-amber-50/20 transition">
                                  <td className="p-3.5 text-slate-500 font-sans">{tx.date}</td>
                                  <td className="p-3.5 font-bold text-slate-900">{tx.ref}</td>
                                  <td className="p-3.5 font-sans font-medium text-slate-800">{tx.particulars}</td>
                                  <td className="p-3.5 text-center font-bold text-amber-800">+{tx.shares}</td>
                                  <td className="p-3.5 text-right text-slate-400">₱{tx.debit.toFixed(2)}</td>
                                  <td className="p-3.5 text-right font-bold text-emerald-700">
                                    ₱{tx.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3.5 text-right font-black text-slate-900">
                                    ₱{tx.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="p-3.5 text-right font-bold">
                                    {remainingPledge === 0 ? (
                                      <span className="text-emerald-700">₱0.00 (Fully Settled)</span>
                                    ) : (
                                      <span className="text-amber-800">
                                        ₱{remainingPledge.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                      <div>
                        💡 <strong>Statutory Note (RA 9520 Art. 86):</strong> Interest on Share Capital (ISC) is calculated based on the monthly average paid-up share capital balance and is 100% exempt from Philippine withholding tax. Payments prioritize paying down the unpaid subscription pledge first.
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SUB-LEDGER 2: SAVINGS PASSBOOK (2-01-01) */}
              {savingsDepositEnabled && passbookSubTab === 'savings' && (
                <div className="p-6 space-y-6">
                  {/* Savings Account Summary */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div>
                      <div className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                        <span>Deposit Liabilities Account (2-01-01)</span>
                        <span className="bg-emerald-200 text-emerald-900 text-[10px] px-2 py-0.5 rounded font-mono">
                          Active & Earning
                        </span>
                      </div>
                      <p className="text-emerald-800 mt-1">
                        Annual Yield: <strong>3.0% per annum</strong> compounded quarterly • Acts as <strong>3x Loan Leverage</strong>
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="text-[10px] font-bold text-emerald-900 uppercase">Available Withdrawable</div>
                      <div className="text-xl font-black text-emerald-900 font-mono">
                        ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Savings Passbook Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Posting Date</th>
                          <th className="p-3.5">OR / Ref No.</th>
                          <th className="p-3.5">Transaction Particulars</th>
                          <th className="p-3.5 text-right">Debit (Withdrawal)</th>
                          <th className="p-3.5 text-right">Credit (Deposit)</th>
                          <th className="p-3.5 text-right">Running Savings Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                        {activeSavingsLedger.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
                              No savings deposit transactions recorded yet. Deposits made via Cashier or QR Ph will appear here automatically.
                            </td>
                          </tr>
                        ) : (
                          activeSavingsLedger.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-emerald-50/20 transition">
                              <td className="p-3.5 text-slate-500 font-sans">{tx.date}</td>
                              <td className="p-3.5 font-bold text-slate-900">{tx.ref}</td>
                              <td className="p-3.5 font-sans font-medium text-slate-800">{tx.particulars}</td>
                              <td className="p-3.5 text-right text-slate-400">₱{tx.debit.toFixed(2)}</td>
                              <td className="p-3.5 text-right font-bold text-emerald-700">
                                ₱{tx.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3.5 text-right font-black text-slate-900">
                                ₱{tx.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                    💡 <strong>Cooperative Security:</strong> Savings deposits can be directly top-up via PayMongo QR Ph (InstaPay/GCash/Maya) with instant credit and official electronic receipt.
                  </div>
                </div>
              )}

              {/* SUB-LEDGER 3: LOANS RECEIVABLE & AMORTIZATION (1-02-01) */}
              {passbookSubTab === 'loan' && (
                <div className="p-6 space-y-6">
                  {(() => {
                    const ACTIVE_LOAN_STATUSES = ['DISBURSED', 'RELEASED', 'ACTIVE', 'APPROVED', 'APPROVED_FOR_RELEASE', 'FOR_DISBURSEMENT'];
                    const activeDisbursedLoan =
                      memberLoanApplications.find((app: any) => app.status === 'DISBURSED' && matchesMember(app, currentMember)) ||
                      memberLoanApplications.find(
                        (app: any) =>
                          ACTIVE_LOAN_STATUSES.includes(String(app.status || '').toUpperCase()) &&
                          matchesMember(app, currentMember)
                      );
                    const hasActiveLoan = Boolean(activeDisbursedLoan || (isTestTenant && !customMember && currentPersona === 'maria' && loanBalance > 0));

                    if (!hasActiveLoan) {
                      return (
                        /* Zero Active Borrowings */
                        <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
                          <h3 className="font-bold text-base text-slate-800">Zero Active Borrowings</h3>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            {currentMember.name} ({currentMember.memberNumber}) has clean credit standing with no outstanding loan obligations. Member is eligible to co-make or apply for up to 3x their share capital.
                          </p>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab('apply')}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition"
                            >
                              Apply for New Loan
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const effectiveBal =
                      pickNumber(
                        activeDisbursedLoan?.balanceRemaining,
                        activeDisbursedLoan?.principalAmount,
                        activeDisbursedLoan?.amount,
                        loanBalance
                      ) || 50000;
                    const loanScheduleRows = getLoanScheduleRows(activeDisbursedLoan, effectiveBal);
                    const defaultMariaLedger = (isTestTenant && currentPersona === 'maria' && !activeDisbursedLoan) ? mariaLoanLedger : [];
                    const loanLedgerRows = getLoanLedgerTransactions(activeDisbursedLoan, effectiveBal, defaultMariaLedger);
                    const isWeeklyLoan =
                      activeDisbursedLoan?.termUnit === 'WEEKS' ||
                      activeDisbursedLoan?.paymentFrequency === 'WEEKLY' ||
                      activeDisbursedLoan?.paymentFrequency === 'BI_WEEKLY';
                    const isBiWeeklyLoan =
                      isWeeklyLoan &&
                      (activeDisbursedLoan?.weeklyPaymentFrequency === 'EVERY_OTHER_WEEK' ||
                        activeDisbursedLoan?.paymentFrequency === 'BI_WEEKLY');
                    const installmentLabel = isWeeklyLoan
                      ? isBiWeeklyLoan
                        ? 'Bi-Weekly Installment'
                        : 'Weekly Installment'
                      : 'Monthly Installment';
                    const monthlyInstallment =
                      (loanScheduleRows[0]?.tot > 0 ? loanScheduleRows[0].tot : 0) ||
                      pickNumber(
                        activeDisbursedLoan?.periodicInstallment,
                        activeDisbursedLoan?.monthlyAmortization,
                        activeDisbursedLoan?.monthlyPayment
                      ) ||
                      4442.44;
                    const annualRateVal =
                      pickNumber(
                        activeDisbursedLoan?.annualRate,
                        activeDisbursedLoan?.interestRateAnnual,
                        activeDisbursedLoan?.annualInterestRate
                      ) || 0.12;
                    const termLabel = isWeeklyLoan
                      ? `${pickNumber(activeDisbursedLoan?.termWeeks, activeDisbursedLoan?.term) || 12} Wks`
                      : `${pickNumber(activeDisbursedLoan?.termMonths, activeDisbursedLoan?.term) || 12} Mos`;
                    const loanTitle = `${activeDisbursedLoan?.productName || 'Regular Member Loan'} (${termLabel} @ ${(annualRateVal * 100).toFixed(1)}% p.a.)`;
                    const loanRef = activeDisbursedLoan?.loanNumber || activeDisbursedLoan?.id || 'LN-2026-00001';
                    const rawDisbDate =
                      activeDisbursedLoan?.disbursedAt ||
                      activeDisbursedLoan?.approvedAt ||
                      activeDisbursedLoan?.updatedAt ||
                      activeDisbursedLoan?.createdAt;
                    const disbDateFormatted = rawDisbDate
                      ? new Date(rawDisbDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Oct 19, 2026';
                    const statusDateLabel = activeDisbursedLoan?.status === 'DISBURSED' ? 'Disbursed' : 'Approved';

                    return (
                      <>
                        {/* Active Loan Details Card */}
                        <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono bg-indigo-200 text-indigo-950 font-bold px-2 py-0.5 rounded text-[11px]">
                                {loanRef}
                              </span>
                              <strong className="text-sm text-slate-900">{loanTitle}</strong>
                            </div>
                            <p className="text-slate-600 mt-1">
                              {statusDateLabel}: {disbDateFormatted} • Diminishing Balance Equal {installmentLabel}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold">{installmentLabel}</div>
                              <div className="text-base font-black text-indigo-900 font-mono">
                                ₱{Number(monthlyInstallment).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold">Remaining Principal</div>
                              <div className="text-base font-black text-indigo-900 font-mono">
                                ₱{effectiveBal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Loan Subsidiary Ledger Transactions Table */}
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
                            Subsidiary Ledger Activity (1-02-01)
                          </h3>
                          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="p-3.5">Posting Date</th>
                                  <th className="p-3.5">Ref No.</th>
                                  <th className="p-3.5">Particulars</th>
                                  <th className="p-3.5 text-right">Debit (Disbursement)</th>
                                  <th className="p-3.5 text-right">Credit (Principal Repaid)</th>
                                  <th className="p-3.5 text-right">Principal Outstanding Balance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                {loanLedgerRows.map((tx: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-indigo-50/20 transition">
                                    <td className="p-3.5 text-slate-500 font-sans">{tx.date}</td>
                                    <td className="p-3.5 font-bold text-slate-900">{tx.ref}</td>
                                    <td className="p-3.5 font-sans font-medium text-slate-800">{tx.particulars}</td>
                                    <td className="p-3.5 text-right font-bold text-rose-700">
                                      {tx.debit > 0 ? `₱${tx.debit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00'}
                                    </td>
                                    <td className="p-3.5 text-right font-bold text-emerald-700">
                                      {tx.credit > 0 ? `₱${tx.credit.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00'}
                                    </td>
                                    <td className="p-3.5 text-right font-black text-slate-900">
                                      ₱{tx.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Complete Diminishing Balance Amortization Schedule Table */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                              Full Diminishing Balance Amortization Schedule
                            </h3>
                            <span className="text-[11px] text-slate-500 font-medium">Equal {installmentLabel}</span>
                          </div>
                          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-80 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                                <tr>
                                  <th className="p-3">#</th>
                                  <th className="p-3">Due Date</th>
                                  <th className="p-3 text-right">Principal</th>
                                  <th className="p-3 text-right">Interest</th>
                                  <th className="p-3 text-right">Total Installment</th>
                                  <th className="p-3 text-right">Ending Principal</th>
                                  <th className="p-3 text-center">Payment Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                                {loanScheduleRows.map((row: any) => (
                                  <tr key={row.seq} className={row.status === 'DUE_NOW' ? 'bg-amber-50/50 font-bold' : ''}>
                                    <td className="p-3 text-slate-500 font-sans">{row.seq}</td>
                                    <td className="p-3 font-sans font-medium text-slate-900">{row.due}</td>
                                    <td className="p-3 text-right">₱{Number(row.pr).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right text-amber-700">₱{Number(row.in).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right font-black text-slate-900">₱{Number(row.tot).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-right text-slate-600">₱{Number(row.bal).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-center">
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                          row.status === 'PAID'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : row.status === 'DUE_NOW'
                                            ? 'bg-amber-200 text-amber-950 animate-pulse'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}
                                      >
                                        {row.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MEMBERS DIRECTORY (SHOWING ONLY SELFIE, FIRST NAME, AND LAST NAME - SORTED ALPHABETICALLY) */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100 w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>

              {/* Search bar for members */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={directorySearchQuery}
                  onChange={(e) => setDirectorySearchQuery(e.target.value)}
                  placeholder="Search by first or last name..."
                  className="w-full pl-10 pr-8 py-2.5 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800 font-medium transition"
                />
                {directorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setDirectorySearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Members Grid (Displaying ONLY Selfie, First Name, and Last Name) */}
            {isLoadingDirectory ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Loading members directory...</p>
              </div>
            ) : filteredDirectoryMembers.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No members found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {directorySearchQuery ? `No members matching "${directorySearchQuery}"` : 'No cooperative members currently registered.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredDirectoryMembers.map((mem) => {
                  const initials = `${(mem.firstName?.[0] || 'M')}${(mem.lastName?.[0] || '')}`.toUpperCase();
                  const photoUrl = mem.selfieUrl || mem.selfiePreview;

                  return (
                    <div
                      key={mem.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group"
                    >
                      {/* Selfie / Photo */}
                      <div className="relative mb-3">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={`${mem.firstName} ${mem.lastName}`}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-emerald-500/30 group-hover:border-emerald-600 transition-colors shadow-sm"
                          />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-200/80 text-emerald-800 font-black text-xl sm:text-2xl flex items-center justify-center shadow-xs group-hover:border-emerald-500 transition-colors">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* First Name & Last Name ONLY (Privacy-First Policy) */}
                      <div className="w-full">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate" title={mem.firstName}>
                          {mem.firstName}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium truncate mt-0.5" title={mem.lastName}>
                          {mem.lastName}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPLY FOR LOAN */}
        {activeTab === 'apply' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Digital Loan Application & Amortization Calculator</h2>
              <p className="text-xs text-slate-500">Transparent pass-through loan processing fee deduction and net member disbursement preview.</p>
            </div>

            {applicationSubmitted ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className={`w-16 h-16 ${requiresCoMaker ? 'bg-amber-500' : 'bg-emerald-600'} text-white rounded-full flex items-center justify-center mx-auto shadow-md`}>
                  {requiresCoMaker ? <Clock className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                </div>
                <div>
                  <div className="text-[11px] font-mono font-bold text-slate-500 bg-white inline-block px-2.5 py-0.5 rounded border border-slate-200 mb-2">
                    Application #{submittedLoanId || 'LN-2026-PENDING'}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {requiresCoMaker ? 'Application Awaiting Co-Maker Endorsement' : 'Loan Application Submitted Successfully!'}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your application for <strong>₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> has been recorded with status:{' '}
                  <span className={`font-mono ${requiresCoMaker ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'} px-2 py-0.5 rounded font-bold`}>
                    {requiresCoMaker ? 'PENDING_CO_MAKER_ACCEPTANCE' : 'SUBMITTED'}
                  </span>.
                  <br /><br />
                  {requiresCoMaker ? (
                    <>
                      Co-maker <strong>{coMaker || `Member (${coMakerMemberIdInput})`}</strong> must log into their own account and accept the Joint &amp; Solidary Liability Undertaking before this application can be pushed to the Loan Officer review pipeline.
                    </>
                  ) : (
                    <>
                      Your application has been received and routed to the cooperative Loan Origination System (LOS). The Loan Officer will review your requirements for Credit Committee triage.
                    </>
                  )}
                </p>

                {submittedSettlementRecord && (
                  <div className="max-w-md mx-auto bg-white p-4 rounded-xl border border-emerald-300 text-left space-y-2 text-xs shadow-2xs">
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Landmark className="w-4 h-4 text-emerald-700" />
                      Disbursement Settlement Details
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Method:</span>
                      <span className="font-semibold text-slate-800">
                        {submittedSettlementRecord.channel === 'BANK_TRANSFER'
                          ? 'Bank Transfer (InstaPay / PESONet)'
                          : submittedSettlementRecord.channel === 'E_WALLET'
                          ? 'E-Wallet (GCash / Maya)'
                          : 'Cash Counter Pick-Up (OTC)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Institution / Bank:</span>
                      <span className="font-semibold text-slate-900">{submittedSettlementRecord.institutionName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account / Mobile Number:</span>
                      <span className="font-mono font-bold text-emerald-800">{submittedSettlementRecord.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Account Name:</span>
                      <span className="font-semibold text-slate-900">{submittedSettlementRecord.accountName}</span>
                    </div>
                  </div>
                )}
                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDisclosureBackTab('apply');
                      setActiveTab('documents');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View RA 3765 Disclosure Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('applications');
                    }}
                    className="bg-white text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Track Loan Status</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApplicationSubmitted(false);
                      setActiveTab('home');
                    }}
                    className="bg-white text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Back to Portfolio
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Controls */}
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">1. Select Loan Product / Offer</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {activeLoanProducts.length === 0 ? (
                        <div className="col-span-2 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
                          No active loan products are currently available for new applications. Please contact the cooperative office.
                        </div>
                      ) : (
                        activeLoanProducts.map((p) => {
                          const isSelected = selectedProductId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                const pRate = p.annualInterestRate || 0.12;
                                const pMin = p.minAmount || 5000;
                                const pMax = p.maxAmount || 100000;
                                const pIsWeeks = p.termUnit === 'WEEKS';
                                const pIsBiWeekly = pIsWeeks && p.weeklyPaymentFrequency === 'EVERY_OTHER_WEEK';
                                const pPeriodsPerYear = pIsWeeks ? (pIsBiWeekly ? 26.0 : 52.0) : 12.0;
                                let resolvedWeeks = loanTermWeeks;
                                let resolvedMonths = loanTerm;

                                if (pIsWeeks) {
                                  const minW = p.minTermWeeks || 4;
                                  const maxW = p.maxTermWeeks || 52;
                                  if (resolvedWeeks > maxW) resolvedWeeks = maxW;
                                  if (resolvedWeeks < minW) resolvedWeeks = minW;
                                  setLoanTermWeeks(resolvedWeeks);
                                } else {
                                  const minM = p.minTermMonths || 1;
                                  const maxM = p.maxTermMonths || 36;
                                  if (resolvedMonths > maxM) resolvedMonths = maxM;
                                  if (resolvedMonths < minM) resolvedMonths = minM;
                                  setLoanTerm(resolvedMonths);
                                }

                                const pTermPeriods = pIsWeeks
                                  ? (pIsBiWeekly ? Math.max(1, Math.ceil(resolvedWeeks / 2)) : Math.max(1, resolvedWeeks))
                                  : Math.max(1, resolvedMonths);
                                const pPeriodicRate = pRate / pPeriodsPerYear;

                                if (loanCalculationBasis === 'AMORTIZATION') {
                                  let targetAmort = desiredAmortization;
                                  if (pIsWeeks && targetAmort > 3500) {
                                    targetAmort = 1000;
                                    setDesiredAmortization(1000);
                                  } else if (!pIsWeeks && targetAmort < 1500) {
                                    targetAmort = 4442;
                                    setDesiredAmortization(4442);
                                  }
                                  const pMandatoryShareQty = p.mandatoryShareQuantity || 10;
                                  const pMandatoryShareTotal = p.mandatorySharePurchaseEnabled ? (pMandatoryShareQty * 100) : 0;
                                  const pIsInstallmentShare = Boolean(p.mandatorySharePurchaseEnabled) && p.mandatorySharePaymentTreatment === 'INCLUDED_IN_LOAN_PAYMENT';
                                  const pShareAmort = pIsInstallmentShare ? Math.round((pMandatoryShareTotal / pTermPeriods) * 100) / 100 : 0;
                                  const computed = computePrincipalFromAmortization(targetAmort, pTermPeriods, pPeriodicRate, pShareAmort);
                                  setLoanAmount(computed);
                                } else {
                                  if (loanAmount > pMax) setLoanAmount(pMax);
                                  if (loanAmount < pMin) setLoanAmount(pMin);
                                }
                              }}
                              className={`p-3 rounded-xl border text-left transition-colors relative ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold">{p.name}</span>
                                <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
                                  {p.code}
                                </span>
                              </div>
                              <div className="text-[11px] font-normal text-slate-500 mt-1">
                                {(p.annualInterestRate * 100).toFixed(1)}% p.a. •{' '}
                                {p.termUnit === 'WEEKS'
                                  ? `Up to ${p.maxTermWeeks || 52} wks (${p.weeklyPaymentFrequency === 'EVERY_OTHER_WEEK' ? 'Bi-Weekly' : 'Weekly'})`
                                  : `Up to ${p.maxTermMonths} mos`}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-medium mt-1">
                                ₱{p.minAmount.toLocaleString()} - ₱{p.maxAmount.toLocaleString()}
                              </div>
                              {p.mandatorySharePurchaseEnabled && (
                                <div className="text-[9px] font-semibold text-purple-700 mt-1 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 w-fit">
                                  ★ Mandatory Share ({p.mandatoryShareQuantity || 10} shares • {p.mandatorySharePaymentTreatment === 'INCLUDED_IN_LOAN_PAYMENT' ? 'Installments' : 'Upfront'})
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Step 2: Loan Calculation Basis & Amount */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">2. Loan Calculation Basis</label>
                      <span className="text-[11px] font-semibold text-emerald-800">
                        {loanCalculationBasis === 'PRINCIPAL'
                          ? 'Principal-Driven'
                          : (isWeeks ? 'Weekly Budget-Driven' : 'Monthly Budget-Driven')}
                      </span>
                    </div>

                    {/* Mode Toggle */}
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setLoanCalculationBasis('PRINCIPAL');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          loanCalculationBasis === 'PRINCIPAL'
                            ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Desired Principal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoanCalculationBasis('AMORTIZATION');
                          const initialAmort = isWeeks ? 1000 : 4442;
                          setDesiredAmortization(initialAmort);
                          const computed = computePrincipalFromAmortization(initialAmort, effectiveTermPeriods, periodicRate, shareAmortizationPerPeriod);
                          setLoanAmount(computed);
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          loanCalculationBasis === 'AMORTIZATION'
                            ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>{isWeeks ? (isBiWeekly ? 'Bi-Weekly Amortization' : 'Weekly Amortization') : 'Monthly Amortization'}</span>
                      </button>
                    </div>

                    {loanCalculationBasis === 'PRINCIPAL' ? (
                      /* Option A: Desired Loan Principal */
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-700">Enter Loan Principal:</span>
                          <span className="text-sm font-black text-emerald-700 font-mono">
                            ₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={minPrincipal}
                          max={maxPrincipal}
                          step={1000}
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Min: ₱{minPrincipal.toLocaleString()}.00</span>
                          <span>Max: ₱{maxPrincipal.toLocaleString()}.00</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-xs">
                          <span className="text-slate-500">
                            Resulting {isWeeks ? (isBiWeekly ? 'Bi-Weekly' : 'Weekly') : 'Monthly'} Amortization:
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            ₱{monthlyInstallment.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / {isWeeks ? (isBiWeekly ? '2 wks' : 'wk') : 'mo'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Option B: Desired Amortization */
                      <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3.5">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-emerald-950">
                              Target {isWeeks ? (isBiWeekly ? 'Bi-Weekly' : 'Weekly') : 'Monthly'} Payment Budget:
                            </span>
                            <span className="text-sm font-black text-emerald-800 font-mono">
                              ₱{desiredAmortization.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / {isWeeks ? (isBiWeekly ? '2 wks' : 'wk') : 'mo'}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800">
                            Slide or pick your target {isWeeks ? (isBiWeekly ? 'bi-weekly' : 'weekly') : 'monthly'} repayment capacity. We compute the maximum loan principal for you.
                          </p>
                        </div>

                        <input
                          type="range"
                          min={isWeeks ? 200 : 500}
                          max={Math.max(isWeeks ? 5000 : 25000, Math.ceil(computeAmortizationFromPrincipal(maxPrincipal, effectiveTermPeriods, periodicRate) / 50) * 50)}
                          step={isWeeks ? 50 : 100}
                          value={desiredAmortization}
                          onChange={(e) => {
                            const newAmort = Number(e.target.value);
                            setDesiredAmortization(newAmort);
                            const computed = computePrincipalFromAmortization(newAmort, effectiveTermPeriods, periodicRate, shareAmortizationPerPeriod);
                            setLoanAmount(computed);
                          }}
                          className="w-full accent-emerald-600"
                        />

                        {/* Quick Stepper Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {(isWeeks
                            ? [500, 1000, 1500, 2000, 2500, 3000]
                            : [2000, 3000, 4500, 6000, 8000, 10000]
                          ).map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => {
                                setDesiredAmortization(amt);
                                const computed = computePrincipalFromAmortization(amt, effectiveTermPeriods, periodicRate, shareAmortizationPerPeriod);
                                setLoanAmount(computed);
                              }}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition ${
                                desiredAmortization === amt
                                  ? 'bg-emerald-700 text-white border-emerald-700'
                                  : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                              }`}
                            >
                              ₱{amt.toLocaleString()}/{isWeeks ? (isBiWeekly ? '2 wks' : 'wk') : 'mo'}
                            </button>
                          ))}
                        </div>

                        {/* Computed Loan Principal Result Card */}
                        <div className="p-3.5 bg-white border-2 border-emerald-400 rounded-xl flex items-center justify-between shadow-xs">
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Computed Loan Principal
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              Budget: <strong>₱{desiredAmortization.toLocaleString()}/{isWeeks ? (isBiWeekly ? '2 wks' : 'wk') : 'mo'}</strong> • {isWeeks ? `${loanTermWeeks} wks` : `${loanTerm} mos`} @ {(annualRate * 100).toFixed(1)}% p.a.
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-black text-emerald-700 font-mono">
                              ₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-emerald-800 font-semibold">
                              Principal Applied
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Repayment Term */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700">
                        3. Repayment Term {isWeeks ? `(Weeks • ${isBiWeekly ? 'Bi-Weekly Payment' : 'Weekly Payment'})` : '(Months • Monthly Payment)'}
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-800 font-mono">
                        {isWeeks ? `${loanTermWeeks} Weeks (${effectiveTermPeriods} Installments)` : `${loanTerm} Months`}
                      </span>
                    </div>

                    {isWeeks ? (
                      <div className="flex flex-wrap gap-2">
                        {[4, 8, 12, 16, 24, 36, 52].filter((w) => w >= (selectedProduct.minTermWeeks || 4) && w <= (selectedProduct.maxTermWeeks || 52)).map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => {
                              setLoanTermWeeks(w);
                              if (loanCalculationBasis === 'AMORTIZATION') {
                                const periods = isBiWeekly ? Math.max(1, Math.ceil(w / 2)) : Math.max(1, w);
                                const shareAmort = isInstallmentSharePayment ? Math.round((mandatoryShareTotal / periods) * 100) / 100 : 0;
                                const computed = computePrincipalFromAmortization(desiredAmortization, periods, periodicRate, shareAmort);
                                setLoanAmount(computed);
                              }
                            }}
                            className={`flex-1 min-w-[65px] py-2 rounded-lg border text-xs font-bold transition-colors ${
                              loanTermWeeks === w
                                ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {w} Wks
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        {[3, 6, 12, 18, 24, 36].filter((t) => t >= (selectedProduct.minTermMonths || 1) && t <= (selectedProduct.maxTermMonths || 36)).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setLoanTerm(t);
                              if (loanCalculationBasis === 'AMORTIZATION') {
                                const shareAmort = isInstallmentSharePayment ? Math.round((mandatoryShareTotal / t) * 100) / 100 : 0;
                                const computed = computePrincipalFromAmortization(desiredAmortization, t, annualRate / 12.0, shareAmort);
                                setLoanAmount(computed);
                              }
                            }}
                            className={`flex-1 py-2.5 rounded-lg border text-xs font-bold transition-colors ${
                              loanTerm === t
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {t} Months
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Step 4: Disbursement & Settlement Details */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-800" />
                      <label className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        4. Disbursement & Settlement Details
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Specify the payout account where your approved loan proceeds will be directly credited.
                    </p>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5">Settlement Channel</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'BANK_TRANSFER', label: 'Bank Transfer', sub: 'InstaPay / PESONet' },
                          { id: 'E_WALLET', label: 'E-Wallet', sub: 'GCash / Maya' },
                          { id: 'CASH_COUNTER', label: 'Cash Counter', sub: 'Branch OTC' },
                        ].map((ch) => (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => {
                              setSettlementChannel(ch.id as any);
                              if (ch.id === 'BANK_TRANSFER' && !settlementInstitution) {
                                setSettlementInstitution('Land Bank of the Philippines');
                              } else if (ch.id === 'E_WALLET') {
                                setSettlementInstitution('GCash');
                              } else if (ch.id === 'CASH_COUNTER') {
                                setSettlementInstitution('Cooperative Branch Cashier Counter');
                              }
                            }}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              settlementChannel === ch.id
                                ? 'border-emerald-600 bg-white font-bold text-emerald-950 shadow-xs'
                                : 'border-emerald-200 bg-emerald-50/40 text-emerald-800 hover:bg-white'
                            }`}
                          >
                            <div className="text-xs">{ch.label}</div>
                            <div className="text-[10px] text-emerald-700 font-normal">{ch.sub}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {settlementChannel !== 'CASH_COUNTER' ? (
                      <div className="space-y-2.5 pt-1">
                        <div>
                          <label className="block font-semibold text-slate-700 text-xs mb-1">
                            {settlementChannel === 'BANK_TRANSFER' ? 'Bank / Institution Name' : 'E-Wallet Provider'}
                          </label>
                          {settlementChannel === 'BANK_TRANSFER' ? (
                            <select
                              value={settlementInstitution}
                              onChange={(e) => setSettlementInstitution(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="Land Bank of the Philippines">Land Bank of the Philippines</option>
                              <option value="BDO Unibank">BDO Unibank</option>
                              <option value="Bank of the Philippine Islands (BPI)">Bank of the Philippine Islands (BPI)</option>
                              <option value="Metrobank">Metrobank</option>
                              <option value="UnionBank of the Philippines">UnionBank of the Philippines</option>
                              <option value="Security Bank">Security Bank</option>
                              <option value="RCBC">RCBC</option>
                              <option value="Philippine National Bank (PNB)">Philippine National Bank (PNB)</option>
                              <option value="Other Commercial / Rural Bank">Other Commercial / Rural Bank</option>
                            </select>
                          ) : (
                            <select
                              value={settlementInstitution}
                              onChange={(e) => setSettlementInstitution(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="GCash">GCash</option>
                              <option value="Maya (PayMaya)">Maya (PayMaya)</option>
                              <option value="GrabPay Philippines">GrabPay Philippines</option>
                            </select>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-semibold text-slate-700 text-xs mb-1">
                              {settlementChannel === 'BANK_TRANSFER' ? 'Bank Account Number' : 'E-Wallet Mobile Number'}
                            </label>
                            <input
                              type="text"
                              required
                              value={settlementAccountNumber}
                              onChange={(e) => setSettlementAccountNumber(e.target.value)}
                              placeholder={settlementChannel === 'BANK_TRANSFER' ? 'e.g. 1092837465' : 'e.g. 09171234567'}
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 text-xs mb-1">
                              Account Holder Name
                            </label>
                            <input
                              type="text"
                              required
                              value={settlementAccountName}
                              onChange={(e) => setSettlementAccountName(e.target.value)}
                              placeholder="Name on account"
                              className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white border border-emerald-200 rounded-lg text-slate-700 text-xs leading-relaxed">
                        <strong>Cash Counter Pick-Up:</strong> Loan disbursement voucher will be issued for in-person cash collection at the cooperative branch cashier. Valid government ID and signature required.
                      </div>
                    )}
                  </div>

                  {requiresCoMaker && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-700 block">5. Designated Co-Maker Member ID</label>
                        <span className="text-[11px] text-amber-700 font-semibold">Mandatory Joint Solidary Rule</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. MEM-2026-0002"
                        value={coMakerMemberIdInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCoMakerMemberIdInput(val);
                          if (val.trim().toUpperCase() === currentMember.memberNumber.toUpperCase()) {
                            setCoMakerError('❌ You cannot designate yourself as your own co-maker. Please key in another member ID.');
                          } else {
                            setCoMakerError('');
                          }
                        }}
                        className={`w-full border rounded-lg px-3 py-2 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 outline-none ${
                          coMakerError ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                        }`}
                      />
                      {coMakerError ? (
                        <p className="text-[11px] text-rose-600 mt-1 font-medium">{coMakerError}</p>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1">
                          Key in the Co-Maker&apos;s Member ID (e.g. <strong>MEM-2026-0002</strong>). The co-maker must accept on their own account before your loan proceeds to underwriting.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="accent-emerald-600 mt-0.5"
                      />
                      <span>
                        I certify that I have read the Truth in Lending Act (RA 3765) disclosure terms and promise to pay the principal and interest when due.
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={!agreedToTerms || Boolean(coMakerError) || isSubmittingLoan}
                    onClick={async () => {
                      if (requiresCoMaker) {
                        if (!coMakerMemberIdInput.trim()) {
                          setCoMakerError('Co-maker Member ID is required.');
                          return;
                        }
                        if (coMakerMemberIdInput.trim().toUpperCase() === currentMember.memberNumber.toUpperCase()) {
                          setCoMakerError('You cannot designate yourself as your own co-maker.');
                          return;
                        }
                      }

                      setIsSubmittingLoan(true);

                      const settlementRecord = {
                        channel: settlementChannel,
                        institutionName: settlementChannel === 'CASH_COUNTER' ? 'Cooperative Branch Cashier Counter' : settlementInstitution,
                        accountNumber: settlementChannel === 'CASH_COUNTER' ? 'OTC-CASHIER-PICKUP' : settlementAccountNumber,
                        accountName: settlementAccountName || currentMember.name,
                      };
                      setSubmittedSettlementRecord(settlementRecord);

                      const tenantInfo = resolveTenantCoop();
                      const newLoanId = `LN-2026-${Math.floor(10000 + Math.random() * 90000)}`;
                      const initialStatus = requiresCoMaker ? 'PENDING_CO_MAKER_ACCEPTANCE' : 'SUBMITTED';

                      const newLoanApp: any = {
                        id: newLoanId,
                        loanNumber: newLoanId,
                        memberId: currentMember.id,
                        memberName: currentMember.name,
                        memberNo: currentMember.memberNumber,
                        memberClassification: currentMember.classification === 'REGULAR' ? 'Regular Member' : 'Associate Member',
                        productId: selectedProduct.id,
                        productName: selectedProduct.name,
                        productCode: selectedProduct.code,
                        annualRate: annualRate,
                        interestRateAnnual: annualRate,
                        termMonths: isWeeks ? Math.ceil(loanTermWeeks / 4) : loanTerm,
                        termWeeks: isWeeks ? loanTermWeeks : undefined,
                        termUnit: selectedProduct.termUnit || 'MONTHS',
                        weeklyPaymentFrequency: selectedProduct.weeklyPaymentFrequency || 'EVERY_WEEK',
                        paymentFrequency: isWeeks ? (isBiWeekly ? 'BI_WEEKLY' : 'WEEKLY') : 'MONTHLY',
                        mandatorySharePurchaseEnabled: Boolean(selectedProduct.mandatorySharePurchaseEnabled),
                        mandatoryShareQuantity: mandatoryShareQty,
                        mandatoryShareAmount: mandatoryShareTotal,
                        mandatorySharePaymentTreatment: selectedProduct.mandatorySharePaymentTreatment || 'UPFRONT_DEDUCTION',
                        shareAmortizationPerPeriod: shareAmortizationPerPeriod,
                        principalAmount: loanAmount,
                        amount: loanAmount,
                        purpose: selectedProduct.name,
                        calculationBasis: loanCalculationBasis,
                        monthlyAmortization: monthlyInstallment,
                        periodicInstallment: monthlyInstallment,
                        techFeeDeduction: memberTechFeeDeduction,
                        coopServiceFee: coopServiceFee,
                        advanceInterest: advanceInterest,
                        optionalFeesTotal: optionalFeesTotal,
                        upfrontShareDeduction: upfrontShareDeductionAmount,
                        netProceeds: netProceeds,
                        effectiveInterestRate: eir,
                        totalInterest: totalInterest,
                        coMakerId: requiresCoMaker ? coMakerMemberIdInput.trim() : undefined,
                        coMakerName: requiresCoMaker ? (coMaker || `Member (${coMakerMemberIdInput.trim()})`) : undefined,
                        coMakerNo: requiresCoMaker ? coMakerMemberIdInput.trim() : undefined,
                        settlement: settlementRecord,
                        advanceInterestOption: selectedProduct.advanceInterestOption || 'NONE',
                        succeedingMethod: selectedProduct.succeedingMethod || 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT',
                        fixedMonthlyInstallment: selectedProduct.fixedMonthlyInstallment !== false,
                        submissionSource: 'MEMBER_SELF_SERVICE',
                        submittedBy: `${currentMember.name} (Member Self-Service)`,
                        submittedAt: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                        status: initialStatus,
                        coopSlug: tenantInfo.slug,
                      };

                      setSubmittedLoanId(newLoanId);
                      setSelectedLoanForDisclosure(newLoanApp);
                      setMemberLoanApplications((prev) => [newLoanApp, ...prev.filter((a) => a.id !== newLoanId)]);

                      // 1. Immediately persist to localStorage for cross-portal sharing
                      try {
                        const storageKey = `flexcoop_loan_applications_${tenantInfo.slug}`;
                        const existingRaw = localStorage.getItem(storageKey);
                        const existingApps = existingRaw ? JSON.parse(existingRaw) : [];
                        const updatedApps = [newLoanApp, ...(Array.isArray(existingApps) ? existingApps.filter((a: any) => a.id !== newLoanId) : [])];
                        localStorage.setItem(storageKey, JSON.stringify(updatedApps));
                        localStorage.setItem(`flexcoop_active_loan_application_${tenantInfo.slug}`, JSON.stringify(newLoanApp));
                      } catch {}

                      // 2. Submit to backend API & Firestore
                      try {
                        await fetch(`${getApiBaseUrl()}/loans/apply?coop=${tenantInfo.slug}`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-tenant-slug': tenantInfo.slug,
                          },
                          body: JSON.stringify(newLoanApp),
                        });
                      } catch (err) {
                        console.warn('Loan submission API sync warning:', err);
                      } finally {
                        setIsSubmittingLoan(false);
                        setApplicationSubmitted(true);
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs py-3.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmittingLoan ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <span>Submit Loan Application</span>
                    )}
                  </button>
                </div>

                {/* Calculation Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                      Transparent Upfront Deduction Breakdown
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Requested Principal Amount:</span>
                        <span className="font-bold text-slate-900">₱{loanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex justify-between text-emerald-800">
                        <span>Technology Fee (1%){!isTechFeePassThrough ? ' (Coop OPEX Absorbed)' : ''}:</span>
                        <span className="font-bold">
                          {isTechFeePassThrough ? `- ₱${techFeeAmount.toFixed(2)}` : '₱0.00 (Coop OPEX)'}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-600">
                        <span>Coop Filing & Service Fee ({coopFilingFeeEnabled ? `${coopFilingFeeRatePercent}%` : 'Disabled'}):</span>
                        <span className="font-bold">
                          {coopFilingFeeEnabled ? `- ₱${coopServiceFee.toFixed(2)}` : '₱0.00 (Waived)'}
                        </span>
                      </div>

                      {advanceInterest > 0 && (
                        <div className="flex justify-between text-blue-800 font-semibold">
                          <span>
                            Advance Interest ({selectedProduct.advanceInterestOption === 'FIRST_YEAR' ? '1st Year' : 'Entire Loan'}):
                          </span>
                          <span className="font-bold">- ₱{advanceInterest.toFixed(2)}</span>
                        </div>
                      )}

                      {optionalFeesTotal > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Pass-Through Optional Fees:</span>
                          <span className="font-bold">- ₱{optionalFeesTotal.toFixed(2)}</span>
                        </div>
                      )}

                      {isUpfrontShareDeduction && (
                        <div className="flex justify-between text-purple-800 font-semibold">
                          <span>
                            Mandatory Share Capital ({mandatoryShareQty} shares @ ₱{mandatorySharePrice}):
                          </span>
                          <span className="font-bold">- ₱{mandatoryShareTotal.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-200 pt-3 flex justify-between items-center bg-emerald-100/70 p-3 rounded-xl border border-emerald-200">
                        <div>
                          <div className="text-[11px] font-bold text-emerald-950 uppercase">Net Disbursed Proceeds</div>
                          <div className="text-xs text-emerald-800">
                            {isUpfrontShareDeduction ? 'Credited to account (net of share capital & fees)' : 'Direct transfer to bank / wallet / cash'}
                          </div>
                        </div>
                        <div className="text-xl font-black text-emerald-950">
                          ₱{netProceeds.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-600">
                            {isWeeks ? (isBiWeekly ? 'Bi-Weekly Installment:' : 'Weekly Installment:') : 'Monthly Amortization:'}
                          </span>
                          <span className="font-bold text-slate-900">
                            ₱{monthlyInstallment.toFixed(2)} / {isWeeks ? (isBiWeekly ? '2 wks' : 'wk') : 'month'}
                          </span>
                        </div>
                        {isInstallmentSharePayment && (
                          <div className="text-[11px] text-purple-700 flex justify-between bg-purple-50 p-1.5 rounded border border-purple-200">
                            <span>Includes Share Capital installment:</span>
                            <span className="font-semibold">+ ₱{shareAmortizationPerPeriod.toFixed(2)}/period</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Interest Charge:</span>
                          <span className="font-semibold text-slate-800">₱{totalInterest.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Effective Interest Rate (EIR):</span>
                          <span className="font-bold text-emerald-700">
                            {eirTenure.toFixed(2)}% ({isWeeks ? `${loanTermWeeks} Wks` : `${loanTerm} Mos`} Tenure)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                    💡 <strong>CDA Compliance:</strong> Every deduction is accounted for under standard CDA account codes and issued an electronic official sales invoice with 12% Output VAT breakdown.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CO-MAKER ENDORSEMENTS */}
        {activeTab === 'comaker' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Co-Maker Endorsements & Solidary Guarantees</h2>
                <p className="text-xs text-slate-500">
                  Review and execute legally binding Joint and Solidary Liability Undertakings (RA 3765 & RA 9520) for fellow cooperative members.
                </p>
              </div>
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-mono font-semibold">
                Viewing as: {currentMember.memberNumber}
              </span>
            </div>

            {endorsementSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{endorsementSuccessMsg}</span>
              </div>
            )}

            {/* List of Requests for Currently Logged-in Member */}
            {endorsementRequests.filter((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber).length === 0 ? (
              <div className="p-12 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <Users className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-base text-slate-700">No Co-Maker Requests for {currentMember.name}</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You currently have no pending endorsement requests designating your Member ID (<strong>{currentMember.memberNumber}</strong>).
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {endorsementRequests
                  .filter((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber)
                  .map((req) => (
                    <div
                      key={req.id}
                      className={`p-6 border rounded-2xl space-y-4 ${
                        req.status === 'ACCEPTED'
                          ? 'border-emerald-300 bg-emerald-50/40'
                          : req.status === 'DECLINED'
                          ? 'border-rose-300 bg-rose-50/40'
                          : 'border-amber-300 bg-amber-50/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="text-[11px] font-mono text-slate-500">Application Reference: {req.loanNumber}</div>
                          <h3 className="text-base font-bold text-slate-900">
                            Principal Borrower: {req.borrowerName} ({req.borrowerMemberNumber})
                          </h3>
                          <div className="text-xs text-slate-600">
                            Loan Product: {req.productName} • Term: {req.termMonths} Months
                          </div>
                        </div>

                        <div className="sm:text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              req.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : req.status === 'DECLINED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {req.status === 'ACCEPTED'
                              ? '✓ ENDORSED & BOUND'
                              : req.status === 'DECLINED'
                              ? 'DECLINED'
                              : 'PENDING YOUR ACCEPTANCE'}
                          </span>
                        </div>
                      </div>

                      {/* Loan Amortization Figures */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                        <div>
                          <div className="text-slate-400 font-medium">Principal Amount</div>
                          <div className="text-sm font-black text-slate-900">
                            ₱{req.principalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Monthly Installment</div>
                          <div className="text-sm font-black text-emerald-700">
                            ₱{req.monthlyInstallment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Requested On</div>
                          <div className="font-semibold text-slate-700">{req.requestedAt}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-medium">Your Legal Undertaking</div>
                          <div className="font-semibold text-amber-800">Joint & Solidary Co-Maker</div>
                        </div>
                      </div>

                      {/* Legal Statutory Statement */}
                      <div className="p-4 bg-white border border-slate-300 rounded-xl text-xs space-y-2">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          Statutory Undertaking (RA 3765 & Article 58, RA 9520)
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          &ldquo;I hereby unconditionally bind myself JOINTLY AND SOLIDARILY with the principal borrower for the prompt payment of all loan principal, interest, and penalties when due. In the event of default or non-payment, the cooperative is authorized to apply my share capital and savings deposits to the satisfaction of this debt without prior court proceeding.&rdquo;
                        </p>
                      </div>

                      {/* Decision Controls */}
                      {req.status === 'PENDING' ? (
                        <div className="pt-2 space-y-3">
                          <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={solidaryAgreed}
                              onChange={(e) => setSolidaryAgreed(e.target.checked)}
                              className="accent-emerald-600 mt-0.5"
                            />
                            <span>
                              I have read and voluntarily accept <strong>Joint & Solidary Liability</strong> for this loan application.
                            </span>
                          </label>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              disabled={!solidaryAgreed}
                              onClick={() => {
                                setEndorsementRequests((prev) =>
                                  prev.map((item) =>
                                    item.id === req.id
                                      ? { ...item, status: 'ACCEPTED', respondedAt: new Date().toLocaleTimeString() }
                                      : item
                                  )
                                );
                                setEndorsementSuccessMsg(
                                  `Co-maker endorsement executed successfully! Application ${req.loanNumber} has been advanced to the Loan Officer review pipeline.`
                                );
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Accept & Endorse (Push to Next Process)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEndorsementRequests((prev) =>
                                  prev.map((item) =>
                                    item.id === req.id
                                      ? { ...item, status: 'DECLINED', respondedAt: new Date().toLocaleTimeString() }
                                      : item
                                  )
                                );
                                setEndorsementSuccessMsg(
                                  `You declined co-maker endorsement for Application ${req.loanNumber}. The borrower will be notified.`
                                );
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors"
                            >
                              Decline Request
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-semibold text-slate-600 pt-1 flex items-center gap-1.5">
                          {req.status === 'ACCEPTED' ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Solidary Undertaking confirmed and registered on your account. Application pushed to Loan Officer.
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4" /> Request was declined.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAY VIA PAYMONGO QR PH */}
        {activeTab === 'pay' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Loan Repayment & PayMongo QR Ph Terminal</h2>
              <p className="text-xs text-slate-500">Fast, secure payments via QR Ph (GCash, Maya, Bank Apps) or Cooperative Bank Transfer.</p>
            </div>

            {loanBankTransferPendingResult ? (
              <div className="p-8 text-center bg-blue-50 border border-blue-200 rounded-2xl space-y-4">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-blue-950">Bank Transfer Submitted!</h3>
                <p className="text-xs text-blue-800 max-w-md mx-auto">
                  Your loan repayment of <strong>₱{loanBankTransferPendingResult.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong> has been submitted.
                  A confirmation from the admin portal is necessary before posting to your loan ledger.
                </p>
                <div className="text-xs font-mono bg-white p-3 rounded-lg border border-blue-200 max-w-sm mx-auto text-left space-y-1">
                  <div>Status: <strong className="text-amber-700">PENDING ADMIN CONFIRMATION</strong></div>
                  <div>Bank Reference: <strong>{loanBankTransferPendingResult.reference}</strong></div>
                  <div>Bank: <strong>{loanBankTransferPendingResult.bankName}</strong></div>
                  <div>Amount: <strong>₱{loanBankTransferPendingResult.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong></div>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setLoanBankTransferPendingResult(null);
                      setActiveTab('home');
                    }}
                    className="bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-blue-800 cursor-pointer"
                  >
                    Return to Portfolio
                  </button>
                </div>
              </div>
            ) : paymentSuccess ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950">Repayment Confirmed!</h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  Your payment of <strong>₱{repayAmount.toFixed(2)}</strong> has been processed and credited to your loan amortization ledger.
                </p>
                <div className="text-xs font-mono bg-white p-3 rounded-lg border border-emerald-200 max-w-sm mx-auto text-left space-y-1">
                  <div>Official Receipt: <strong>OR-2026-992182</strong></div>
                  <div>Principal Reduction: <strong>₱{(repayAmount - 500).toFixed(2)}</strong></div>
                  <div>Interest Income: <strong>₱500.00</strong></div>
                  <div>Remaining Loan Balance: <strong>₱{loanBalance.toFixed(2)}</strong></div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setActiveTab('home');
                    }}
                    className="bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg hover:bg-emerald-800"
                  >
                    Return to Portfolio
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Repayment Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Repayment Installment Amount (₱)</label>
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(Math.max(100, Number(e.target.value)))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRepayChannel('PAYMONGO_QRPH')}
                        className={`p-3.5 border rounded-xl text-left text-xs transition-colors ${
                          repayChannel === 'PAYMONGO_QRPH'
                            ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-950 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <QrCode className="w-4 h-4 text-emerald-600" /> PayMongo QR Ph
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">Pass-on convenience fee applies</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRepayChannel('BANK_TRANSFER')}
                        className={`p-3.5 border rounded-xl text-left text-xs transition-colors ${
                          repayChannel === 'BANK_TRANSFER'
                            ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-950 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Landmark className="w-4 h-4 text-blue-600" /> Bank Transfer
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">Admin verification required</div>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Loan Credit:</span>
                      <span className="font-bold text-slate-900">₱{repayAmount.toFixed(2)}</span>
                    </div>
                    {repayChannel === 'PAYMONGO_QRPH' && (
                      <div className="flex justify-between text-amber-700">
                        <span>Pass-On Gateway Fee:</span>
                        <span className="font-bold">+ ₱{passOnFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                      <span>Total Amount to Pay:</span>
                      <span className="text-emerald-700">₱{(repayChannel === 'PAYMONGO_QRPH' ? totalCharge : repayAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  {repayChannel === 'PAYMONGO_QRPH' ? (
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      Simulate Payment Settlement
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isSubmittingLoanBankTransfer}
                      onClick={handleSubmitLoanBankTransfer}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmittingLoanBankTransfer ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting for Admin Confirmation...</span>
                        </>
                      ) : (
                        <>
                          <Landmark className="w-4 h-4" />
                          <span>Submit Bank Transfer for Admin Confirmation</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Right Column: QR Ph Code or Official Bank Transfer Form */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center">
                  {repayChannel === 'PAYMONGO_QRPH' ? (
                    <>
                      <div className="w-52 h-52 bg-white border-2 border-emerald-600 rounded-2xl p-4 shadow-md flex flex-col items-center justify-center">
                        <div className="w-44 h-44 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-mono p-2 text-center">
                          [Official QR Ph Payload]
                          <br />
                          ₱{totalCharge.toFixed(2)}
                        </div>
                      </div>
                      <div className="mt-4 font-bold text-slate-900 text-sm">PayMongo Dynamic QR Ph Code</div>
                      <div className="text-xs text-slate-500 max-w-xs mt-1">
                        Scan with GCash, Maya, BDO, BPI, UnionBank, or any InstaPay-enabled mobile app.
                      </div>
                    </>
                  ) : (
                    <div className="w-full space-y-4 text-left">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 mb-1">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">Official Bank Transfer Instructions</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Transfer your loan installment directly to the cooperative's bank account, then submit your reference number below.
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Bank:</span>
                          <strong className="text-slate-900">{coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank of the Philippines'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Account Name:</span>
                          <strong className="text-slate-900">{coopPaymentOptions?.bankTransfer?.accountName || tenantInfo.name}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">Account Number:</span>
                          <strong className="text-blue-700 font-mono">{coopPaymentOptions?.bankTransfer?.accountNumber || '0012-9981-22'}</strong>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Transfer Reference / Trace No. (Required):
                          </label>
                          <input
                            type="text"
                            value={loanBankReferenceInput}
                            onChange={(e) => setLoanBankReferenceInput(e.target.value)}
                            placeholder="e.g. LBP-TX-987654321"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Notes / Remarks (Optional):
                          </label>
                          <input
                            type="text"
                            value={loanBankTransferNotes}
                            onChange={(e) => setLoanBankTransferNotes(e.target.value)}
                            placeholder="e.g. Installment settlement"
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-medium"
                          />
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Admin Confirmation Required:</strong> A confirmation from the admin portal is necessary before posting this loan payment to your ledger.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: MY SUBMITTED LOAN APPLICATIONS & STATUS TRACKER */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">My Loan Applications &amp; Status</h2>
                <p className="text-xs text-slate-500">Track real-time underwriting progress, co-maker solidary verification, and disbursement schedules.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchMemberLoanApplications(true)}
                  disabled={isRefreshingLoans}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                  title="Refresh loan application status from server"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLoans ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                  <span>{isRefreshingLoans ? 'Syncing...' : 'Refresh Status'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Apply for New Loan
                </button>
              </div>
            </div>

            {memberLoanApplications.length === 0 ? (
              <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Submitted Loan Applications Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  You currently have no active or historical loan applications on record. Apply online in minutes with our transparent amortization calculator.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('apply')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
                  >
                    Apply for a Loan Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {memberLoanApplications.map((app) => {
                  const principal = Number(app.amount || app.principalAmount || 0);
                  const term = Number(app.termMonths || 12);
                  const rate = Number(app.annualRate ?? app.interestRateAnnual ?? 0.12);
                  const installment = Number(app.monthlyAmortization || app.monthlyInstallment || 0);
                  const net = Number(app.netProceeds || (principal - (app.techFeeDeduction || 0) - (app.coopServiceFee || 0)));

                  const isCoMakerReq = Boolean(app.requiresCoMaker || app.coMakerName || app.coMakerId);
                  const creditReviewDone = ['BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(app.status);
                  const bodApprovalDone = ['APPROVED', 'DISBURSED'].includes(app.status);
                  const disbursedDone = app.status === 'DISBURSED';

                  return (
                    <div
                      key={app.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5"
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-sm">
                              {app.loanNumber || app.id}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-bold text-emerald-800 text-sm">
                              {app.productName || 'Loan Product'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Applied on: <strong>{app.submittedAt || 'Recent'}</strong> • Borrower: <strong>{app.memberName || currentMember.name}</strong>
                          </div>
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getStatusBadgeClass(app.status)}`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            {formatLoanStatus(app.status)}
                          </span>
                        </div>
                      </div>

                      {/* Rejection / Cancellation Notice Banner */}
                      {app.status === 'REJECTED' && (
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-3 shadow-xs">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-bold text-rose-950 text-sm">Loan Application Declined / Rejected</div>
                            <p className="text-xs text-rose-800 leading-relaxed">
                              This loan application was evaluated and declined during the cooperative credit review process. For questions or to submit an appeal, please contact the cooperative credit committee or management.
                            </p>
                            {(app.rejectionRemarks || app.disbursementReference) && (
                              <div className="mt-1.5 p-2.5 rounded-lg bg-white/90 border border-rose-200 text-rose-950 text-xs">
                                <span className="font-bold">Review Remarks:</span> {app.rejectionRemarks || app.disbursementReference}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {app.status === 'CANCELLED' && (
                        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-xs flex items-start gap-3 shadow-xs">
                          <Ban className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-bold text-slate-950 text-sm">Loan Application Cancelled</div>
                            <p className="text-xs text-slate-700 leading-relaxed">
                              This loan application has been cancelled and voided.
                            </p>
                            {(app.cancellationRemarks || app.disbursementReference) && (
                              <div className="mt-1.5 p-2.5 rounded-lg bg-white/90 border border-slate-200 text-slate-900 text-xs">
                                <span className="font-bold">Cancellation Remarks:</span> {app.cancellationRemarks || app.disbursementReference}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 5-Stage Visual Workflow Pipeline */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Underwriting Evaluation Pipeline
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          {/* Step 1: Application Filed */}
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase text-emerald-700">Step 1</div>
                              <div className="truncate">Filed</div>
                            </div>
                          </div>

                          {/* Step 2: Co-Maker Endorsement */}
                          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                            !isCoMakerReq
                              ? 'bg-slate-100 border-slate-200 text-slate-600'
                              : app.status === 'PENDING_CO_MAKER_ACCEPTANCE'
                              ? 'bg-amber-50 border-amber-300 text-amber-900'
                              : app.status === 'CO_MAKER_DECLINED'
                              ? 'bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          }`}>
                            {!isCoMakerReq ? (
                              <Check className="w-4 h-4 text-slate-500 shrink-0" />
                            ) : app.status === 'PENDING_CO_MAKER_ACCEPTANCE' ? (
                              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : app.status === 'CO_MAKER_DECLINED' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase text-slate-500">Step 2</div>
                              <div className="truncate">{!isCoMakerReq ? 'Self-Secured' : 'Co-Maker'}</div>
                            </div>
                          </div>

                          {/* Step 3: Credit Evaluation */}
                          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                            app.status === 'REJECTED'
                              ? 'bg-rose-50 border-rose-300 text-rose-900'
                              : creditReviewDone
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : app.status === 'UNDER_CREDIT_REVIEW'
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {app.status === 'REJECTED' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : creditReviewDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : app.status === 'UNDER_CREDIT_REVIEW' ? (
                              <Clock className="w-4 h-4 text-indigo-600 shrink-0 animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase text-slate-500">Step 3</div>
                              <div className="truncate">{app.status === 'REJECTED' ? 'Declined' : 'Credit Triage'}</div>
                            </div>
                          </div>

                          {/* Step 4: Board Approval */}
                          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${
                            bodApprovalDone
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : app.status === 'BOD_APPROVAL'
                              ? 'bg-purple-50 border-purple-300 text-purple-900'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {bodApprovalDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : app.status === 'BOD_APPROVAL' ? (
                              <Clock className="w-4 h-4 text-purple-600 shrink-0 animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase text-slate-500">Step 4</div>
                              <div className="truncate">Approval</div>
                            </div>
                          </div>

                          {/* Step 5: Proceeds Disbursal */}
                          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold col-span-2 sm:col-span-1 ${
                            disbursedDone
                              ? 'bg-teal-50 border-teal-300 text-teal-900'
                              : 'bg-white border-slate-200 text-slate-400'
                          }`}>
                            {disbursedDone ? (
                              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="text-[10px] uppercase text-slate-500">Step 5</div>
                              <div className="truncate">Disbursal</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Detail Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Gross Principal</span>
                          <span className="font-bold font-mono text-slate-900 text-sm">
                            ₱{principal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Monthly Amortization</span>
                          <span className="font-bold font-mono text-emerald-800 text-sm">
                            ₱{installment.toLocaleString('en-PH', { minimumFractionDigits: 2 })} / mo
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold block">Repayment Term</span>
                          <span className="font-bold text-slate-900 text-sm">
                            {term} Months
                          </span>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                          <span className="text-[10px] text-emerald-800 uppercase font-semibold block">Net Disbursed Proceeds</span>
                          <span className="font-bold font-mono text-emerald-950 text-sm">
                            ₱{net.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Co-Maker and Settlement Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Co-Maker Card */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-500" /> Co-Maker Solidary Signer
                          </div>
                          {isCoMakerReq ? (
                            <div className="text-slate-600">
                              <div>Name: <strong>{app.coMakerName || 'Designated Co-Maker'}</strong></div>
                              {app.coMakerNo && <div>Member ID: <span className="font-mono">{app.coMakerNo}</span></div>}
                              <div className="mt-1">
                                Status:{' '}
                                <span className={`font-semibold ${
                                  app.status === 'PENDING_CO_MAKER_ACCEPTANCE'
                                    ? 'text-amber-700'
                                    : app.status === 'CO_MAKER_DECLINED'
                                    ? 'text-rose-700'
                                    : 'text-emerald-700'
                                }`}>
                                  {app.status === 'PENDING_CO_MAKER_ACCEPTANCE'
                                    ? 'Awaiting Co-Maker Portal Sign-off'
                                    : app.status === 'CO_MAKER_DECLINED'
                                    ? 'Declined by Co-Maker'
                                    : 'Joint Solidary Liability Undertaking Signed'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-500">
                              No co-maker required. Application qualified under self-secured borrowing policy.
                            </div>
                          )}
                        </div>

                        {/* Settlement Destination Card */}
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Banknote className="w-3.5 h-3.5 text-slate-500" /> Disbursement Settlement
                          </div>
                          {app.settlement ? (
                            <div className="text-slate-600">
                              <div>Channel: <strong>{app.settlement.channel || 'BANK_TRANSFER'}</strong></div>
                              <div>Institution: <strong>{app.settlement.institutionName || 'Land Bank'}</strong></div>
                              <div>Account No: <span className="font-mono font-bold text-emerald-800">{app.settlement.accountNumber || '—'}</span></div>
                              <div>Account Name: <strong>{app.settlement.accountName || app.memberName}</strong></div>
                            </div>
                          ) : (
                            <div className="text-slate-500">
                              Disbursement via cooperative cash counter / over-the-counter teller.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoanForDisclosure(app);
                            setDisclosureBackTab('applications');
                            setActiveTab('documents');
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View RA 3765 Disclosure Statement</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRUTH IN LENDING & PROMISSORY NOTE */}
        {activeTab === 'documents' && (() => {
          const activeDisclosureLoan = selectedLoanForDisclosure || (memberLoanApplications.length > 0 ? memberLoanApplications[0] : null) || {
            id: submittedLoanId || 'LN-2026-DRAFT',
            loanNumber: submittedLoanId || 'LN-2026-DRAFT',
            memberName: currentMember.name,
            memberNo: currentMember.memberNumber,
            productName: selectedProduct.name,
            amount: loanAmount,
            principalAmount: loanAmount,
            annualRate: annualRate,
            termMonths: isWeeks ? Math.ceil(loanTermWeeks / 4) : loanTerm,
            termWeeks: isWeeks ? loanTermWeeks : undefined,
            termUnit: selectedProduct.termUnit || 'MONTHS',
            weeklyPaymentFrequency: selectedProduct.weeklyPaymentFrequency || 'EVERY_WEEK',
            paymentFrequency: isWeeks ? (isBiWeekly ? 'BI_WEEKLY' : 'WEEKLY') : 'MONTHLY',
            monthlyAmortization: monthlyInstallment,
            periodicInstallment: monthlyInstallment,
            techFeeDeduction: memberTechFeeDeduction,
            coopServiceFee: coopServiceFee,
            advanceInterest: advanceInterest,
            netProceeds: netProceeds,
            effectiveInterestRate: eir,
            status: 'SUBMITTED',
          };

          const discIsWeeks = (activeDisclosureLoan.termUnit || selectedProduct.termUnit) === 'WEEKS' || Boolean(activeDisclosureLoan.termWeeks);
          const discIsBiWeekly = (activeDisclosureLoan.weeklyPaymentFrequency || selectedProduct.weeklyPaymentFrequency) === 'EVERY_OTHER_WEEK';
          const discTermWeeks = Number(activeDisclosureLoan.termWeeks || (discIsWeeks ? loanTermWeeks : 0));
          const discPrincipal = Number(activeDisclosureLoan.principalAmount || activeDisclosureLoan.amount || 50000);
          const discTerm = Number(activeDisclosureLoan.termMonths || 12);
          const discInstallmentsCount = discIsWeeks ? (discIsBiWeekly ? Math.ceil(discTermWeeks / 2) : discTermWeeks) : discTerm;
          const discFrequencyLabel = discIsWeeks ? (discIsBiWeekly ? 'bi-weekly' : 'weekly') : 'monthly';
          const discAnnualRate = Number(activeDisclosureLoan.annualRate ?? activeDisclosureLoan.interestRateAnnual ?? 0.12);
          const discInstallment = Number(activeDisclosureLoan.periodicInstallment || activeDisclosureLoan.monthlyAmortization || activeDisclosureLoan.monthlyInstallment || (() => {
            const mRate = discAnnualRate / 12.0;
            const f = Math.pow(1.0 + mRate, discTerm);
            return Math.round(((discPrincipal * (mRate * f)) / (f - 1.0)) * 100) / 100;
          })());
          const discTechFee = Number(activeDisclosureLoan.techFeeDeduction ?? Math.round(discPrincipal * 0.01 * 100) / 100);
          const discCoopFee = Number(activeDisclosureLoan.coopServiceFee ?? (coopFilingFeeEnabled ? Math.round(discPrincipal * (coopFilingFeeRatePercent / 100) * 100) / 100 : 0));
          const discAdvanceInterest = Number(activeDisclosureLoan.advanceInterest ?? 0);
          const discNetProceeds = Number(activeDisclosureLoan.netProceeds ?? Math.max(0, discPrincipal - discTechFee - discCoopFee - discAdvanceInterest));
          const discEir = Number(activeDisclosureLoan.effectiveInterestRate ?? 15.5);
          const discDocNo = `DISC-${activeDisclosureLoan.loanNumber || activeDisclosureLoan.id || 'LN-2026-00001'}`;
          const discBorrower = `${activeDisclosureLoan.memberName || currentMember.name} (${activeDisclosureLoan.memberNo || currentMember.memberNumber})`;
          const discCreditor = tenantInfo.name || 'Cooperative Enterprise';
          const discPromissoryWords = numberToWordsPesos(discPrincipal);

          return (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <button
                type="button"
                onClick={() => setActiveTab(disclosureBackTab)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                {disclosureBackTab === 'applications'
                  ? 'Back to My Applications'
                  : disclosureBackTab === 'apply'
                  ? 'Back to Application Form'
                  : disclosureBackTab === 'more'
                  ? 'Back to More Services'
                  : 'Back to Portfolio'}
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Republic Act No. 3765 • Truth in Lending Disclosure</h2>
                  <p className="text-xs text-slate-500">Statutory loan disclosure statement &amp; legally binding promissory note.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>

              {/* Application Selector if member has multiple applications */}
              {memberLoanApplications.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600 font-medium">Viewing Disclosure for Application:</span>
                  <select
                    value={activeDisclosureLoan.id}
                    onChange={(e) => {
                      const found = memberLoanApplications.find((a) => a.id === e.target.value);
                      if (found) setSelectedLoanForDisclosure(found);
                    }}
                    className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {memberLoanApplications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.loanNumber || app.id} — ₱{(Number(app.amount || app.principalAmount || 0)).toLocaleString()} ({app.productName || 'Loan'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-500">Document No: </span>
                    <span className="font-mono font-bold text-slate-900">{discDocNo}</span>
                  </div>
                  <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                    activeDisclosureLoan.status === 'DISBURSED' || activeDisclosureLoan.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-900'
                  }`}>
                    {activeDisclosureLoan.status === 'DISBURSED'
                      ? 'DISBURSED & VERIFIED'
                      : activeDisclosureLoan.status === 'APPROVED'
                      ? 'APPROVED & VERIFIED'
                      : 'DIGITALLY EXECUTED'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                  <div>
                    <span className="text-slate-500">Creditor: </span>
                    <strong>{discCreditor}</strong> (CDA Regulated)
                  </div>
                  <div>
                    <span className="text-slate-500">Borrower: </span>
                    <strong>{discBorrower}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Loan Product: </span>
                    <strong>{activeDisclosureLoan.productName || 'Cooperative Loan'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Repayment Term: </span>
                    <strong>
                      {discIsWeeks
                        ? `${discTermWeeks} Weeks (${discInstallmentsCount} ${discIsBiWeekly ? 'Bi-Weekly' : 'Weekly'} Installments)`
                        : `${discTerm} Monthly Installments`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Gross Loan Principal: </span>
                    <strong className="text-slate-900 font-mono text-sm">₱{discPrincipal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Nominal Annual Interest Rate: </span>
                    <strong className="text-slate-900">{(discAnnualRate * 100).toFixed(2)}% per annum</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Effective Interest Rate (EIR): </span>
                    <strong className="text-emerald-700">{discEir.toFixed(2)}% (Loan Tenure)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">
                      {discIsWeeks
                        ? (discIsBiWeekly ? 'Bi-Weekly Installment Amortization: ' : 'Weekly Installment Amortization: ')
                        : 'Monthly Installment Amortization: '}
                    </span>
                    <strong className="text-slate-900 font-mono">
                      ₱{discInstallment.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {discIsWeeks ? (discIsBiWeekly ? '2 wks' : 'wk') : 'mo'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">SaaS Platform Processing Fee: </span>
                    <strong>₱{discTechFee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (1.0%)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Coop Service &amp; Filing Fee: </span>
                    <strong>₱{discCoopFee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({coopFilingFeeRatePercent.toFixed(1)}%)</strong>
                  </div>
                  {discAdvanceInterest > 0 && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-slate-500">Advance Interest Deducted: </span>
                      <strong className="text-slate-900 font-mono">₱{discAdvanceInterest.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                  <div className="col-span-1 sm:col-span-2 p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-950 font-bold flex justify-between items-center">
                    <span>Net Disbursed Proceeds to Borrower:</span>
                    <span className="text-base font-black font-mono">₱{discNetProceeds.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed">
                  <div className="font-bold text-slate-900 uppercase mb-1">PROMISSORY NOTE &amp; LOAN AGREEMENT SUMMARY</div>
                  {`"FOR VALUE RECEIVED, I, ${(activeDisclosureLoan.memberName || currentMember.name).toUpperCase()}, promise to pay to the order of ${discCreditor.toUpperCase()} the sum of ${discPromissoryWords} (PHP ${discPrincipal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) in ${discInstallmentsCount} equal ${discFrequencyLabel} installments of PHP ${discInstallment.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. In case of default, a 3% monthly surcharge applies. Solidary liability acknowledged pursuant to the Cooperative Bylaws."`}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 5: PROFILE & PRIVACY */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Member Profile & NPC Data Privacy Compliance</h2>
              <p className="text-xs text-slate-500">Identity credentials protected with AES-256-GCM encryption pursuant to RA 10173.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name:</span>
                  <span className="font-bold text-slate-900">{currentMember.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Membership Number:</span>
                  <span className="font-mono font-bold text-slate-900">{currentMember.memberNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verified ID Type:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {currentMember.idType || 'PhilSys National ID (Encrypted SPI)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Encrypted ID Hash:</span>
                  <span className="font-mono text-slate-400">****-****-3456 (AES-256-GCM)</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  National Privacy Commission (NPC) Audit Record
                </div>
                <div className="text-emerald-800">
                  Consent Version: <strong>v2026.1</strong> • Logged IP: <strong>120.29.74.12</strong> • Timestamp: <strong>2026-01-20T09:05:00Z</strong>
                </div>
              </div>

              {/* Account Security & Password Settings */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      Account Security &amp; Password
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Your password protects your digital passbook, savings withdrawals, and loan transactions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordChangeError(null);
                      setPasswordChangeSuccess(null);
                      setCurrentPasswordInput('');
                      setNewPasswordInput('');
                      setConfirmPasswordInput('');
                      setShowChangePasswordModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ANNUAL DIVIDENDS & PATRONAGE REFUND (ART. 86 RA 9520) */}
        {activeTab === 'surplus' && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>

            {(currentMember.classification === 'ASSOCIATE' || !currentMember.isDividendEligible) && (
              <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span>Associate Member Statutory Notice (RA 9520 Art. 26)</span>
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Non-Dividend Eligible
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Under Article 26 of Republic Act No. 9520 (Philippine Cooperative Code), <strong>Associate Members</strong> have the right to patronize the services and products of the cooperative, but do not possess voting rights and are not eligible to receive annual dividend distributions or interest on share capital.
                  </p>
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                    <strong className="block text-amber-950 font-semibold">Path to Regular Membership &amp; Dividend Entitlement:</strong>
                    <p>
                      Associate members may petition the Board of Directors for reclassification to <strong>Regular Member</strong> upon: (1) completing the Pre-Membership Education Seminar (PMES), (2) meeting the required minimum subscribed and paid-up share capital threshold, and (3) maintaining continuous active patronage of cooperative services for at least one (1) year.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {!isTestTenant ? (
              <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <PieChart className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  No Allocated Dividends or Patronage Refund for Current Period
                </h2>
                <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Net surplus distribution (Interest on Share Capital & Patronage Refund pursuant to RA 9520 Art. 86) is determined following the close of the cooperative fiscal year and formally ratified during the Annual General Assembly.
                </p>
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-mono">
                    <span>Fiscal Status: Operational (No Vouchers Issued)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Official Voucher Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-2xl shadow-sm">
                    F
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      Official Annual Dividend & Patronage Refund Statement
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pursuant to Article 86 of Republic Act No. 9520 (Philippine Cooperative Code) & CDA Guidelines
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 block w-fit ml-auto">
                    {currentPersona === 'maria' ? 'Voucher: CDA-SURP-2025-001' : 'Voucher: CDA-SURP-2025-002'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1 block">Fiscal Year Ended Dec 31, 2025</span>
                </div>
              </div>

              {/* Member Identification & Statutory Tranche */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Member Name:</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{currentMember.name}</strong>
                  <span className="text-slate-500 font-mono text-[11px]">{currentMember.memberNumber}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Capital Contribution:</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">
                    ₱{currentMember.paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-slate-500 text-[11px]">{currentMember.sharesCount} Common Shares @ ₱100 Par</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Statutory Tranche:</span>
                  <strong className="text-emerald-700 text-sm block mt-0.5">70.0% Distributable Pool</strong>
                  <span className="text-slate-500 text-[11px]">30% Statutory Reserves Cleared</span>
                </div>
              </div>

              {/* Calculation Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interest on Share Capital (ISC)</span>
                    <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded">5.0% Return</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    ₱{currentPersona === 'maria' ? '750.00' : '500.00'}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pro-rata dividend yield earned on paid-up common stock equity.
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patronage Refund (PR)</span>
                    <span className="bg-amber-50 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded">3.5% Refund</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    ₱{currentPersona === 'maria' ? '435.75' : '343.00'}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Refund based on ₱{currentPersona === 'maria' ? '12,450.00' : '9,800.00'} total loan interest & purchases.
                  </p>
                </div>

                <div className="border border-emerald-200 bg-emerald-50/60 rounded-xl p-5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Net Surplus Payout</span>
                    <span className="bg-emerald-200 text-emerald-900 font-bold text-[10px] px-2 py-0.5 rounded">CREDITED</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    ₱{currentPersona === 'maria' ? '1,185.75' : '843.00'}
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Directly credited to Voluntary Savings Account (2-01-01) on Jan 15, 2026.
                  </p>
                </div>
              </div>

              {/* Statutory Disclosures */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Statutory Deductions Compliance (RA 9520 Art. 86)
                </div>
                <p className="text-[11px] leading-relaxed">
                  Before distributing the net surplus, the Cooperative deducted statutory reserves: General Reserve Fund (10%), Cooperative Education and Training Fund (10% - 5% Local, 5% Apex Federation), Community Development Fund (3%), and Optional Reserve Fund (7%). Pursuant to the Cooperative Code, these dividends are 100% tax-exempt.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => alert('Printing Official Dividend Statement...')}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Print Dividend Statement
                </button>
                <button
                  type="button"
                  onClick={() => alert('Downloading official tax-exempt voucher PDF...')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download Certificate (PDF)
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB: MY PLEDGED MORTGAGES & COLLATERALS */}
        {activeTab === 'collateral' && (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setActiveTab('more')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to More Services
            </button>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-600" />
                    My Pledged Mortgages & Collateral Registry
                  </h2>
                  <p className="text-xs text-slate-500">
                    Official registry of pledged Real Estate Mortgages (REM) and Chattel Mortgages securing your active cooperative credit lines.
                  </p>
                </div>

                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {isTestTenant ? '1 Pledged Asset Registered' : '0 Pledged Assets Registered'}
                </span>
              </div>

              {/* Pledged Asset Card */}
              {!isTestTenant ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Scale className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No Pledged Collateral Registered</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    You currently have no encumbered real estate mortgages (REM) or chattel mortgages registered under your cooperative account.
                  </p>
                </div>
              ) : currentPersona === 'maria' ? (
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/70 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2.5 py-0.5 rounded border border-indigo-200 uppercase">
                        REAL ESTATE MORTGAGE
                      </span>
                      <strong className="text-base text-slate-900">
                        180 sqm Residential Lot & 2-Storey House in Fairview, Quezon City
                      </strong>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-700" /> ENCUMBERED TO COOP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transfer Certificate of Title</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">TCT-004-2019004812</strong>
                      <span className="text-[11px] text-slate-500">Quezon City Registry of Deeds</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appraised Fair Market Value</span>
                      <strong className="font-mono text-slate-900 text-sm block mt-0.5">₱1,800,000.00</strong>
                      <span className="text-[11px] text-emerald-700">70% Max Allowable: ₱1,260,000</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Active Loan</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">LN-2026-0001 (₱1,000,000)</strong>
                      <span className="text-[11px] text-emerald-700 font-bold">LTV: 55.6% (SAFE)</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registry of Deeds Entry</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">Entry # 2026-0049182</strong>
                      <span className="text-[11px] text-slate-500">Annotated Feb 15, 2026</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
                    <p className="text-[11px]">
                      Owner&apos;s Duplicate Certificate of Title is deposited in the cooperative fireproof vault. Upon full settlement of your loan balance, a Cancellation of Real Estate Mortgage will be executed.
                    </p>
                    <button
                      type="button"
                      onClick={() => alert('Discharge request noted. Discharge is available once the remaining balance is paid in full.')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition shrink-0"
                    >
                      Request Cancellation Notice
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/70 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded border border-amber-200 uppercase">
                        CHATTEL MORTGAGE
                      </span>
                      <strong className="text-base text-slate-900">
                        2023 Isuzu D-Max 3.0 4x4 Double Cab Utility Pickup
                      </strong>
                    </div>
                    <span className="bg-emerald-100 text-emerald-900 font-bold text-[10px] px-2.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-700" /> ENCUMBERED TO COOP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plate / MV File Number</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">NFP-8812</strong>
                      <span className="text-[11px] text-slate-500">CR No: 1301-0098231</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appraised Fair Market Value</span>
                      <strong className="font-mono text-slate-900 text-sm block mt-0.5">₱1,200,000.00</strong>
                      <span className="text-[11px] text-amber-800">60% Max Allowable: ₱720,000</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Linked Active Loan</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">LN-2026-0002 (₱650,000)</strong>
                      <span className="text-[11px] text-emerald-700 font-bold">LTV: 54.2% (SAFE)</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">LTO Encumbrance Annotation</span>
                      <strong className="font-mono text-slate-900 block mt-0.5">Entry # CM-2026-0812</strong>
                      <span className="text-[11px] text-slate-500">Annotated Feb 18, 2026</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 gap-2">
                    <p className="text-[11px]">
                      Original Certificate of Registration (CR) annotated with Chattel Mortgage in favor of the Cooperative. Release of Chattel Mortgage will be executed upon loan payoff.
                    </p>
                    <button
                      type="button"
                      onClick={() => alert('Chattel release notice: Available after principal settlement.')}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-xs transition shrink-0"
                    >
                      Request Release Slip
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: MORE SERVICES & ACCOUNT (Mobile PWA Hub) */}
        {activeTab === 'more' && (
          <div className="space-y-6">
            {/* Cooperative Name & Identity Header (Moved from Header) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3.5">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
                  {tenantInfo.logoLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Republic of the Philippines • CDA Registered
                  </div>
                  <h2 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                    {tenantInfo.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Member Online Banking &amp; Lending Portal • Reg # {tenantInfo.registrationNumber}
                  </p>
                </div>
              </div>

              {/* Active Logged-In Member Badge */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {currentMember.initials}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{currentMember.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{currentMember.memberNumber} • Regular Member</div>
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  CDA Good Standing
                </span>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cooperative Services & Tools
                </h3>
                <span className="text-[11px] text-slate-400">All Modules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cooperative Members Directory */}
                <button
                  type="button"
                  onClick={() => setActiveTab('members')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Members Directory
                      </h4>
                      <p className="text-[11px] text-slate-500">Alphabetical roster of cooperative members</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>
                {/* My Loan Applications & Status */}
                <button
                  type="button"
                  onClick={() => setActiveTab('applications')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ClipboardList className="w-5 h-5" />
                      {memberLoanApplications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                          {memberLoanApplications.length}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                          My Loan Applications
                        </h4>
                        {memberLoanApplications.length > 0 && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                            {memberLoanApplications.length} Filed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Track review pipeline, approvals &amp; status</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* Apply for Loan */}
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Apply for Loan
                      </h4>
                      <p className="text-[11px] text-slate-500">Amortization calculator & net proceeds preview</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* Co-Maker Endorsements */}
                <button
                  type="button"
                  onClick={() => setActiveTab('comaker')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Users className="w-5 h-5" />
                      {endorsementRequests.some((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING') && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                          1
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                          Co-Maker Endorsements
                        </h4>
                        {endorsementRequests.some((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING') && (
                          <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                            Action Req.
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Review pending solidary undertakings (RA 9520)</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
                </button>

                {/* Annual Dividends & Patronage (Art. 86) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('surplus')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Dividends & Patronage (Art. 86)
                      </h4>
                      <p className="text-[11px] text-slate-500">Statutory net surplus distribution statement</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* My Pledged Mortgages & Collateral Registry */}
                <button
                  type="button"
                  onClick={() => setActiveTab('collateral')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                        My Pledged Mortgages
                      </h4>
                      <p className="text-[11px] text-slate-500">Registry of pledged REM and Chattel Mortgages</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
                </button>

                {/* Statutory Documents & Promissory Note */}
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        Truth in Lending Documents
                      </h4>
                      <p className="text-[11px] text-slate-500">RA 3765 statutory disclosure & promissory note</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>

                {/* eKYC & Privacy Profile */}
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        eKYC & Privacy Profile
                      </h4>
                      <p className="text-[11px] text-slate-500">National ID encryption & NPC compliance record</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                </button>
              </div>
            </div>

            {/* Device Biometrics Authentication Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                    <Fingerprint className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900">Device Biometrics (Touch ID / Face ID)</h4>
                      {isBiometricsEnabled ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Enabled on this device
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Not Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enable Touch ID, Face ID, or Windows Hello on this device for instant 1-tap sign in without entering your password every time.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleBiometrics}
                  disabled={biometricsLoading}
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto ${
                    isBiometricsEnabled
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{biometricsLoading ? 'Configuring...' : isBiometricsEnabled ? 'Disable Biometrics' : 'Enable Device Biometrics'}</span>
                </button>
              </div>

              {biometricsNotice && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  biometricsNotice.includes('enabled')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{biometricsNotice}</span>
                </div>
              )}
            </div>

            {/* PWA Mobile App Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-emerald-950">Install Progressive Web App (PWA)</h4>
                    <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-1.5 py-0.2 rounded">Fast & Offline</span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Add Flex Coop to your mobile home screen for instant biometric login and offline passbook access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallPwa}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-sm shrink-0 flex items-center gap-1.5 w-full sm:w-auto justify-center"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                {isInstallable ? 'Install to Home Screen' : 'Install App Guide'}
              </button>
            </div>

            {/* Account & Navigation Settings */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Account & Navigation Settings
              </h3>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordChangeError(null);
                    setPasswordChangeSuccess(null);
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                    setShowChangePasswordModal(true);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold text-center transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Change Password</span>
                </button>
                <button
                  type="button"
                  onClick={handleMemberSignOut}
                  title="Sign out of Member Portal"
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SELF-SERVICE DEPOSIT & SHARE PURCHASE MODAL */}
        {depositModalType && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Sticky Modal Header with Prominent Close Button */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow shrink-0">
                    {tenantInfo.logoLetter || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base tracking-tight leading-tight truncate">
                      {depositModalType === 'SHARES' ? 'Purchase Cooperative Shares' : 'Deposit to Savings'}
                    </h3>
                    <div className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                      Cooperative Member Services • <strong>{currentMember.name}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDepositModalType(null);
                    setPaymongoActivePayment(null);
                    setDepositSuccessResult(null);
                  }}
                  className="p-2 -mr-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700 shadow-sm cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!depositSuccessResult ? (
                depositModalType === 'SAVINGS' && !savingsDepositEnabled ? (
                  <div className="p-8 text-center space-y-4 overflow-y-auto flex-1">
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">Deposit Savings Feature Disabled</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Cooperative administration has currently disabled new savings deposits. Please contact cooperative management for inquiries.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDepositModalType(null)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">
                  {depositModalType === 'SHARES' ? (
                    /* Share Purchase Controls */
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <BookOpen className="w-4 h-4 text-amber-700" /> Capital Build-Up (Common Stock)
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                          Par value is fixed at <strong>₱100.00 / share</strong>. Purchasing shares increases your voting equity and annual dividend allocation under RA 9520.
                        </p>
                      </div>

                      {/* Subscription Pledge Allocation Breakdown */}
                      {(() => {
                        const effectiveSub = Math.max(subscribedShares || 50, sharesCount || 0);
                        const curUnpaidPledge = Math.max(0, (effectiveSub * 100) - paidUpCapital);
                        const curUnpaidPledgeShares = Math.max(0, effectiveSub - sharesCount);
                        const depositNum = depositSharesCount * 100;
                        const appliedToPledge = Math.min(depositNum, curUnpaidPledge);
                        const excessPledge = Math.max(0, depositNum - curUnpaidPledge);
                        const appliedShares = Math.min(depositSharesCount, curUnpaidPledgeShares);
                        const excessShares = Math.max(0, depositSharesCount - appliedShares);
                        const remainingAfter = Math.max(0, curUnpaidPledge - appliedToPledge);

                        return (
                          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] space-y-1.5 text-amber-950">
                            <div className="font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5 text-amber-700" />
                                {curUnpaidPledge > 0 ? 'Pledge Pay-Down Priority (RA 9520)' : 'Additional Capital Build-Up'}
                              </span>
                              {curUnpaidPledge > 0 ? (
                                <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  ₱{curUnpaidPledge.toLocaleString()} Unpaid Pledge
                                </span>
                              ) : (
                                <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  Pledge 100% Settled
                                </span>
                              )}
                            </div>
                            {curUnpaidPledge > 0 ? (
                              <>
                                <p className="text-slate-600">
                                  Your deposit will <strong className="text-amber-900">prioritize paying down your unpaid subscription pledge first</strong> before expanding your total subscribed shares:
                                </p>
                                <div className="bg-white/80 rounded-lg p-2 border border-amber-200/60 font-mono space-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600 font-sans">Applied to Unpaid Pledge:</span>
                                    <strong className="text-emerald-700">₱{appliedToPledge.toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({appliedShares} shares)</strong>
                                  </div>
                                  {excessPledge > 0 && (
                                    <div className="flex justify-between text-blue-700">
                                      <span className="font-sans">New Additional Capital:</span>
                                      <strong>+₱{excessPledge.toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({excessShares} shares)</strong>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-slate-700 pt-1 border-t border-amber-100">
                                    <span className="font-sans">Pledge Remaining After:</span>
                                    <strong className={remainingAfter === 0 ? 'text-emerald-700 font-bold' : 'text-rose-700'}>
                                      {remainingAfter === 0 ? '₱0.00 (100% Fully Paid!)' : `₱${remainingAfter.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (${Math.floor(remainingAfter / 100)} shares)`}
                                    </strong>
                                  </div>
                                </div>
                                {curUnpaidPledgeShares > 0 && curUnpaidPledgeShares !== depositSharesCount && (
                                  <button
                                    type="button"
                                    onClick={() => setDepositSharesCount(curUnpaidPledgeShares)}
                                    className="w-full mt-1 py-1 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] transition"
                                  >
                                    Set to Pay Exactly Remaining Pledge ({curUnpaidPledgeShares} shares / ₱{curUnpaidPledge.toLocaleString()})
                                  </button>
                                )}
                              </>
                            ) : (
                              <p className="text-slate-600">
                                You have already fully settled your subscription pledge of {effectiveSub} shares. This deposit will build up additional voting equity and dividend entitlement.
                              </p>
                            )}
                          </div>
                        );
                      })()}

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Select Shares to Purchase:
                        </label>
                        <div className="flex gap-2 mb-2">
                          {[5, 10, 20, 50].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setDepositSharesCount(num)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                                depositSharesCount === num
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              +{num} shs
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={depositSharesCount}
                            onChange={(e) => setDepositSharesCount(Math.max(1, Number(e.target.value)))}
                            className="w-24 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                          />
                          <span className="text-slate-500">shares × ₱100.00 =</span>
                          <strong className="text-slate-900 font-mono text-sm">
                            ₱{(depositSharesCount * 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Savings Deposit Controls */
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <PiggyBank className="w-4 h-4 text-emerald-700" /> Member Voluntary Savings
                        </div>
                        <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                          Earns <strong>3.0% interest per annum</strong> credited semi-annually. Acts as loan collateral leverage (up to 3x loan entitlement).
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Select Deposit Amount:
                        </label>
                        <div className="flex gap-2 mb-2">
                          {[500, 1000, 2000, 5000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setDepositSavingsAmount(amt)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition ${
                                depositSavingsAmount === amt
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              ₱{amt.toLocaleString()}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="100"
                            step="100"
                            value={depositSavingsAmount}
                            onChange={(e) => setDepositSavingsAmount(Math.max(100, Number(e.target.value)))}
                            className="w-32 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymongoActivePayment ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                        <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                          <QrCode className="w-4 h-4" />
                          <span>Official PayMongo QR Ph Terminal</span>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full border border-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                          <span>Auto-detecting payment in real time...</span>
                        </div>

                        {/* Real PayMongo QR Image */}
                        <div className="w-52 h-52 bg-white border-4 border-emerald-600 rounded-2xl p-2 shadow-lg flex items-center justify-center">
                          {paymongoActivePayment.qrImageUrl ? (
                            <img
                              src={paymongoActivePayment.qrImageUrl}
                              alt="PayMongo QR Ph"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs p-3 text-center">
                              Generating dynamic QR Ph...
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="text-sm font-black text-slate-900">
                            Scan to Pay: <span className="text-emerald-700 font-mono text-base">₱{paymongoActivePayment.totalAmount.toFixed(2)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 max-w-xs">
                            Open <strong>GCash</strong>, <strong>Maya</strong>, <strong>BDO</strong>, <strong>BPI</strong>, <strong>UnionBank</strong>, or any InstaPay app and scan this QR Ph code.
                          </p>
                        </div>

                        <div className="w-full bg-white/80 border border-emerald-200/80 rounded-xl p-3 text-left font-mono text-[11px] space-y-1 text-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Common Shares:</span>
                            <strong>+{paymongoActivePayment.sharesCount} Shares (@ ₱100)</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans">Capital Credit:</span>
                            <strong>₱{paymongoActivePayment.principalAmount.toFixed(2)}</strong>
                          </div>
                          <div className="flex justify-between text-amber-700">
                            <span className="font-sans">Gateway Fee (1.5%):</span>
                            <span>+ ₱{paymongoActivePayment.convenienceFee.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900">
                            <span className="font-sans">Total Amount:</span>
                            <span className="text-emerald-700">₱{paymongoActivePayment.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        {paymongoActivePayment.checkoutUrl && (
                          <div className="w-full pt-1">
                            <a
                              href={paymongoActivePayment.checkoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open PayMongo Hosted Checkout (Card / Maya / GCash)</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPaymongoActivePayment(null)}
                          className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                        >
                          Back / Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isVerifyingPaymongo}
                          onClick={handleVerifyAndCompletePaymongoShares}
                          className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                        >
                          {isVerifyingPaymongo ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>{isVerifyingPaymongo ? 'Checking Settlement...' : 'I Have Paid / Check Status'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Payment Channel Choice */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                          Available Payment Options:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setDepositChannel('PAYMONGO_QRPH')}
                            className={`p-3 border rounded-xl text-left transition ${
                              depositChannel === 'PAYMONGO_QRPH'
                                ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-xs font-bold">PayMongo QR Ph</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal leading-tight">
                              Instant via GCash, Maya, ShopeePay, or bank apps.
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDepositChannel('BANK_TRANSFER')}
                            className={`p-3 border rounded-xl text-left transition ${
                              depositChannel === 'BANK_TRANSFER'
                                ? 'border-blue-600 bg-blue-50/80 font-bold text-blue-950 ring-2 ring-blue-500/20'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="text-xs font-bold">Bank Transfer</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal leading-tight">
                              Official transfer (Requires admin confirmation before posting).
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Bank Details Display if Bank Transfer selected */}
                      {depositChannel === 'BANK_TRANSFER' && (
                        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
                          <div className="font-bold flex items-center gap-1.5 text-blue-950">
                            <Landmark className="w-4 h-4 text-blue-700" />
                            <span>Cooperative Official Bank Account</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                            <div>
                              <span className="text-slate-500 block font-sans">Bank:</span>
                              <strong>{coopPaymentOptions?.bankTransfer?.bankName || 'Land Bank of the Philippines'}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block font-sans">Account Number:</span>
                              <strong className="text-blue-900">{coopPaymentOptions?.bankTransfer?.accountNumber || '0012-9981-22'}</strong>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-500 block font-sans">Account Name:</span>
                              <strong>{coopPaymentOptions?.bankTransfer?.accountName || tenantInfo.name}</strong>
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Transfer Reference / Trace No. (Required):
                            </label>
                            <input
                              type="text"
                              value={bankReferenceInput}
                              onChange={(e) => setBankReferenceInput(e.target.value)}
                              placeholder="e.g. LBP-TRX-12345678"
                              className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-900 flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Admin Confirmation Required:</strong> A confirmation from the admin portal is necessary before posting this share purchase or savings deposit.
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Summary & Execution */}
                      {(() => {
                        const principal = depositModalType === 'SHARES' ? depositSharesCount * 100 : depositSavingsAmount;
                        const passOn =
                          depositChannel === 'PAYMONGO_QRPH' && paymongoFeeTreatment === 'PASS_THROUGH'
                            ? Math.round(principal * 0.015 * 100) / 100
                            : 0;
                        const total = principal + passOn;

                        return (
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex justify-between">
                              <span className="text-slate-600">Net Deposit / Capital Credit:</span>
                              <strong className="text-slate-900 font-mono">₱{principal.toFixed(2)}</strong>
                            </div>
                            {depositChannel === 'PAYMONGO_QRPH' && (
                              <div className="flex justify-between text-amber-700">
                                <span>
                                  Gateway Convenience Fee ({paymongoFeeTreatment === 'OPEX' ? 'OPEX Absorbed' : '1.5% Pass-Through'}):
                                </span>
                                <span className="font-mono font-semibold">+ ₱{passOn.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-bold">
                              <span>Total Amount to Pay:</span>
                              <span className="text-emerald-700 font-mono text-base">₱{(depositChannel === 'PAYMONGO_QRPH' ? total : principal).toFixed(2)}</span>
                            </div>
                            {depositChannel === 'PAYMONGO_QRPH' && depositModalType === 'SHARES' && (
                              <div className="text-[10px] text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-200">
                                Share Capital paid via PayMongo is credited directly to the Cooperative&apos;s Platform Escrow account (`1-01-05`).
                              </div>
                            )}

                            {depositChannel === 'PAYMONGO_QRPH' ? (
                              depositModalType === 'SHARES' ? (
                                <button
                                  type="button"
                                  disabled={isGeneratingPaymongo}
                                  onClick={handleInitiatePaymongoShares}
                                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                >
                                  {isGeneratingPaymongo ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <QrCode className="w-4 h-4" />
                                  )}
                                  <span>
                                    {isGeneratingPaymongo
                                      ? 'Generating PayMongo QR Ph...'
                                      : 'Pay with PayMongo (QR Ph / GCash / Maya)'}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const refNo = `QR-TX-${Date.now().toString(36).toUpperCase()}`;
                                    setSavingsBalance((prev) => prev + principal);
                                    setDepositSuccessResult({
                                      type: 'Savings Deposit',
                                      amount: principal,
                                      reference: refNo,
                                      channel: 'PayMongo QR Ph (Instant Self-Service)',
                                    });
                                  }}
                                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                >
                                  <QrCode className="w-4 h-4" />
                                  <span>Simulate Instant QR Ph Settlement</span>
                                </button>
                              )
                            ) : (
                              depositModalType === 'SHARES' ? (
                                <button
                                  type="button"
                                  disabled={isSubmittingDirectShare}
                                  onClick={handleBankTransferShareDeposit}
                                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                >
                                  {isSubmittingDirectShare ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Landmark className="w-4 h-4" />
                                  )}
                                  <span>{isSubmittingDirectShare ? 'Submitting Bank Transfer...' : 'Submit Bank Transfer for Admin Confirmation'}</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isSubmittingDirectShare}
                                  onClick={handleBankTransferSavingsDeposit}
                                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                >
                                  {isSubmittingDirectShare ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Landmark className="w-4 h-4" />
                                  )}
                                  <span>{isSubmittingDirectShare ? 'Submitting Bank Transfer...' : 'Submit Bank Transfer for Admin Confirmation'}</span>
                                </button>
                              )
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                </div>
              )) : (
                /* Success / Receipt Screen */
                <div className="p-6 text-center space-y-4">
                  <div className={`w-14 h-14 ${depositSuccessResult.isPendingConfirmation ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'} rounded-full flex items-center justify-center mx-auto shadow-sm`}>
                    {depositSuccessResult.isPendingConfirmation ? (
                      <Clock className="w-8 h-8" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{depositSuccessResult.type}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {depositSuccessResult.isPendingConfirmation
                        ? 'Submitted for admin verification! A confirmation from the admin portal is necessary before posting to your account.'
                        : depositSuccessResult.channel.includes('Instant')
                        ? 'Transaction settled and credited to your account!'
                        : 'Deposit recorded successfully!'}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left font-mono text-xs space-y-2">
                    {depositSuccessResult.isPendingConfirmation && (
                      <div className="flex justify-between border-b pb-1.5 text-amber-800">
                        <span className="font-sans font-bold">Status:</span>
                        <strong className="text-amber-700">PENDING ADMIN CONFIRMATION</strong>
                      </div>
                    )}
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-sans">Reference Number:</span>
                      <strong className="text-indigo-600">{depositSuccessResult.reference}</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1.5">
                      <span className="text-slate-500 font-sans">Amount:</span>
                      <strong className="text-slate-900">
                        ₱{depositSuccessResult.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    {depositSuccessResult.sharesAdded && (
                      <div className="flex justify-between border-b pb-1.5">
                        <span className="text-slate-500 font-sans">Shares to be Issued:</span>
                        <strong className="text-amber-800">+{depositSuccessResult.sharesAdded} Common Shares</strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">Channel:</span>
                      <span className="text-emerald-700 font-sans font-semibold">{depositSuccessResult.channel}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => alert(`Printing transaction slip ${depositSuccessResult.reference}...`)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Slip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositModalType(null);
                        setDepositSuccessResult(null);
                      }}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-emerald-700/20 cursor-pointer"
                    >
                      Done / Close Modal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: PASSBOOK DYNAMIC QR PH PAYMENT MODAL */}
        {passbookPayModal.open && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-slate-900 text-white p-4 sm:p-5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow shrink-0">
                    {tenantInfo.logoLetter || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base tracking-tight leading-tight truncate">
                      {passbookPayModal.type === 'LOAN'
                        ? 'PayMongo QR Ph Loan Installment Payment'
                        : 'PayMongo QR Ph Repayment & Deposit'}
                    </h3>
                    <div className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                      Cooperative Payment Terminal • <strong>{currentMember.name}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPassbookPayModal({ open: false, type: 'LOAN', amount: 0, description: '' })}
                  className="p-2 -mr-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700 shadow-sm cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5 text-xs overflow-y-auto flex-1">
                {/* Account Selection (Hidden when locked to Loan Due Amount) */}
                {!passbookPayModal.lockedAmount && passbookPayModal.type !== 'LOAN' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Payment Destination:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPassbookPayModal((prev) => ({
                            ...prev,
                            type: 'SAVINGS',
                            amount: 1000,
                            description: 'Voluntary Member Savings Deposit',
                          }))
                        }
                        className={`p-3 rounded-xl border text-center transition ${
                          passbookPayModal.type === 'SAVINGS'
                            ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-950 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <PiggyBank className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                        <span>Savings Deposit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setPassbookPayModal((prev) => ({
                            ...prev,
                            type: 'SHARES',
                            amount: 1000,
                            description: 'Capital Build-Up (10 Shares @ ₱100 Par)',
                          }))
                        }
                        className={`p-3 rounded-xl border text-center transition ${
                          passbookPayModal.type === 'SHARES'
                            ? 'border-amber-600 bg-amber-50/80 font-bold text-amber-950 ring-2 ring-amber-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                        <span>Share Capital</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Amount Input — Strictly Non-Editable for Loan Due Amount */}
                {passbookPayModal.type === 'LOAN' || passbookPayModal.lockedAmount ? (
                  <div className="p-4 bg-indigo-50/70 border-2 border-indigo-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                        Scheduled Installment Due Amount
                      </span>
                      <span className="bg-indigo-200 text-indigo-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Non-Editable • Locked to Due Amount
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="font-bold text-slate-900">{passbookPayModal.description}</div>
                        {passbookPayModal.dueDate && (
                          <div>
                            Due Date: <strong className="text-amber-800">{passbookPayModal.dueDate}</strong>
                          </div>
                        )}
                        {passbookPayModal.principalPortion !== undefined && passbookPayModal.interestPortion !== undefined && (
                          <div className="text-[11px] text-slate-500">
                            Principal: <strong>₱{passbookPayModal.principalPortion.toFixed(2)}</strong> + Interest: <strong>₱{passbookPayModal.interestPortion.toFixed(2)}</strong>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black font-mono text-indigo-950">
                          ₱{passbookPayModal.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={`₱${passbookPayModal.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      className="w-full border border-indigo-200 bg-white/80 rounded-xl px-3.5 py-2 font-bold font-mono text-sm text-slate-700 cursor-not-allowed select-none"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Amount to Credit (₱):
                    </label>
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={passbookPayModal.amount}
                      onChange={(e) =>
                        setPassbookPayModal((prev) => ({
                          ...prev,
                          amount: Math.max(100, Number(e.target.value)),
                        }))
                      }
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold font-mono text-base text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}

                {/* Dynamic Fee Calculation Breakdown */}
                {(() => {
                  const fee = calculateConvenienceFee(passbookPayModal.amount);
                  const total = Math.round((passbookPayModal.amount + fee) * 100) / 100;

                  return (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>{passbookPayModal.type === 'LOAN' ? 'Loan Installment Due Amount:' : 'Net Account Credit:'}</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₱{passbookPayModal.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {fee > 0 && paymongoFeeEnabled && paymongoFeeTreatment === 'PASS_THROUGH' && (
                        <div className="flex justify-between text-amber-800">
                          <span className="flex items-center gap-1 flex-wrap">
                            <span>PayMongo QR Ph Gateway Fee (1.5%):</span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                              Pass-Through
                            </span>
                          </span>
                          <span className="font-mono font-bold">+ ₱{fee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                        <span>Total to Scan &amp; Pay:</span>
                        <span className="font-mono text-emerald-700 text-base">
                          ₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* QR Graphic and Payload */}
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col items-center justify-center text-center">
                  <div className="w-52 h-52 bg-white border-2 border-emerald-600 rounded-2xl p-3 shadow-md flex flex-col items-center justify-center">
                    {passbookPayModal.isGeneratingQr ? (
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                        <span className="text-[10px] font-bold">Generating Live PayMongo QR Ph...</span>
                      </div>
                    ) : passbookPayModal.qrImageUrl ? (
                      <img
                        src={passbookPayModal.qrImageUrl}
                        alt="PayMongo QR Ph Code"
                        className="w-44 h-44 object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-2 text-center">
                        <QrCode className="w-10 h-10 text-emerald-600" />
                        <span className="text-[11px] font-bold text-slate-700">Live PayMongo QR Ph</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPassbookPayModal((prev) => ({ ...prev, isGeneratingQr: true, verificationError: null }));
                            generatePassbookQrPhIntent({
                              loanId: passbookPayModal.loanId || 'LN-2026-00001',
                              installmentNumber: passbookPayModal.installmentNumber || 1,
                              dueDate: passbookPayModal.dueDate || new Date().toISOString().slice(0, 10),
                              dueAmount: passbookPayModal.amount,
                              principalAmount: passbookPayModal.principalPortion,
                              interestAmount: passbookPayModal.interestPortion,
                            }).finally(() => {
                              setPassbookPayModal((prev) => ({ ...prev, isGeneratingQr: false }));
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Generate PayMongo QR Ph</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    Scan with GCash, Maya, BDO, BPI, UnionBank, or any InstaPay-enabled mobile banking app.
                  </div>
                  {passbookPayModal.paymentIntentId && (
                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Listening for real-time PayMongo payment confirmation...</span>
                    </div>
                  )}
                  {passbookPayModal.checkoutUrl && (
                    <a
                      href={passbookPayModal.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                    >
                      <span>Or open PayMongo Hosted Checkout Page (GCash / Maya / QR Ph)</span>
                    </a>
                  )}
                </div>

                {passbookPayModal.verificationError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-[11px] font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{passbookPayModal.verificationError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    disabled={Boolean(passbookPayModal.isGeneratingQr || passbookPayModal.isVerifyingPayment)}
                    onClick={handleVerifyAndCompletePassbookPayment}
                    className={`w-full font-black text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
                      passbookPayModal.isGeneratingQr || passbookPayModal.isVerifyingPayment
                        ? 'bg-slate-400 text-white cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                    }`}
                  >
                    {passbookPayModal.isVerifyingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Payment with PayMongo...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete &amp; Record PayMongo QR Ph Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: OFFICIAL CDA & BIR ELECTRONIC RECEIPT */}
        {passbookReceipt && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Receipt Header with Close Button */}
              <div className="bg-emerald-800 text-white p-4 sm:p-5 px-5 sm:px-6 relative text-center shrink-0 border-b border-emerald-900">
                <button
                  type="button"
                  onClick={() => setPassbookReceipt(null)}
                  className="absolute top-3.5 right-3.5 p-2 rounded-full bg-emerald-900/80 hover:bg-emerald-950 text-emerald-100 hover:text-white transition flex items-center justify-center cursor-pointer shadow-sm"
                  aria-label="Close receipt"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center mx-auto mb-1.5">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">
                  Republic of the Philippines • CDA Registered
                </div>
                <h3 className="font-black text-base sm:text-lg">Official Electronic Receipt</h3>
                <div className="text-[11px] text-emerald-100 font-mono">
                  Cooperative Electronic Receipt • Official Transaction
                </div>
              </div>

              {/* Receipt Content */}
              <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Official Receipt No:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{passbookReceipt.orNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date & Timestamp:</span>
                  <span className="font-medium text-slate-800 font-mono">{passbookReceipt.date} {passbookReceipt.time}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Member Name:</span>
                  <strong className="text-slate-900">{currentMember.name}</strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Member Number:</span>
                  <span className="font-mono text-slate-700">{currentMember.memberNumber}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Credited CDA Account:</span>
                  <span className="font-mono text-indigo-700 font-bold">
                    {passbookReceipt.accountCode} ({passbookReceipt.accountName})
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Amount:</span>
                    <span>₱{passbookReceipt.baseAmount.toFixed(2)}</span>
                  </div>
                  {passbookReceipt.convenienceFee > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Convenience Fee (1.5%):</span>
                      <span>₱{passbookReceipt.convenienceFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-black text-sm text-slate-900">
                    <span>Total Amount Paid:</span>
                    <span className="text-emerald-700">₱{passbookReceipt.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                  <div className="text-[11px] text-emerald-800 font-bold">New Account Running Balance:</div>
                  <div className="text-xl font-black font-mono text-emerald-950">
                    ₱{passbookReceipt.newBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center leading-relaxed">
                  This electronic receipt is issued pursuant to BIR Revenue Regulations and Cooperative Development Authority Memorandum Circular 2015-06. Retain for official record.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => alert(`Official Receipt ${passbookReceipt.orNumber} saved to PDF.`)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPassbookReceipt(null)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: CERTIFIED CDA MEMBER STATEMENT OF ACCOUNT (SOA) */}
        {showPassbookStatementModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Statement Toolbar */}
              <div className="bg-slate-900 text-white p-3.5 sm:p-4 px-4 sm:px-6 flex justify-between items-center sticky top-0 z-30 shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wider truncate">Certified Member SOA</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Print</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassbookStatementModal(false)}
                    className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700 cursor-pointer"
                    aria-label="Close statement"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Certificate Sheet */}
              <div className="p-4 sm:p-8 space-y-6 text-slate-800 text-xs overflow-y-auto flex-1">
                {/* Official Letterhead */}
                <div className="text-center border-b border-slate-300 pb-6 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Republic of the Philippines • Cooperative Development Authority
                  </div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    Cooperative Enterprise
                  </h2>
                  <div className="text-slate-600 text-xs font-medium">
                    CDA Registration: <strong>CDA-NCR-2024-00921</strong> • BIR TIN: <strong>004-912-340-000</strong>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Main Office: 456 Katipunan Avenue, Loyola Heights, Quezon City, Metro Manila
                  </div>
                </div>

                {/* Document Title Banner */}
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    Official Member Subsidiary Ledger Statement of Account
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                    As of October 12, 2026 • Reference: SOA-2026-{currentMember.memberNumber.replace('MEM-', '')}
                  </div>
                </div>

                {/* Member Profile Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Member Name:</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{currentMember.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Member ID:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">{currentMember.memberNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Classification:</span>
                    <span className="font-semibold text-emerald-800 block mt-0.5">Regular Member (Good Standing)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">PhilSys KYC Status:</span>
                    <span className="font-semibold text-emerald-700 block mt-0.5">Verified Compliant</span>
                  </div>
                </div>

                {/* Financial Position Matrix */}
                <div className="border border-slate-300 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-bold">
                      <tr>
                        <th className="p-3">CDA Account Classification</th>
                        <th className="p-3">Account Code</th>
                        <th className="p-3">Sub-Ledger Balance</th>
                        <th className="p-3">Statutory Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      <tr>
                        <td className="p-3 font-sans font-bold text-slate-900">Paid-Up Share Capital (Common)</td>
                        <td className="p-3 text-slate-600">3-01-03</td>
                        <td className="p-3 font-bold text-slate-900">
                          ₱{paidUpCapital.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-sans text-emerald-700 font-bold">{sharesCount} Shares @ ₱100 Par (Dividend Active)</td>
                      </tr>
                      {savingsDepositEnabled && (
                        <tr>
                          <td className="p-3 font-sans font-bold text-slate-900">Deposit Liabilities (Savings)</td>
                          <td className="p-3 text-slate-600">2-01-01</td>
                          <td className="p-3 font-bold text-slate-900">
                            ₱{savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 font-sans text-emerald-700 font-bold">3.0% Annual Interest Compounded</td>
                        </tr>
                      )}
                      <tr>
                        <td className="p-3 font-sans font-bold text-slate-900">Loans Receivable (Regular)</td>
                        <td className="p-3 text-slate-600">1-02-01</td>
                        <td className="p-3 font-bold text-indigo-900">
                          ₱{loanBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 font-sans text-indigo-700 font-bold">
                          {loanBalance > 0 ? 'Installment Due: Mar 20, 2026' : 'No Active Obligations'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Certification Affirmation */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed">
                  I hereby certify that the foregoing balances are true and correct transcripts of the Subsidiary Ledgers of the Cooperative as maintained under the Standard Chart of Accounts prescribed by the Cooperative Development Authority.
                </div>

                {/* Signatories Block */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-300 text-center text-xs">
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">{currentMember.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">Cooperative Member</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">{gmInfo.name || 'General Manager'}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">General Manager</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-800 pb-1 font-bold text-slate-900">Chief Accountant</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">Certified Public Accountant</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHANGE PASSWORD MODAL */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 overflow-y-auto p-2 sm:p-4 flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-slate-900 text-white p-4 sm:p-5 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 border-b border-slate-800">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base tracking-tight leading-tight truncate">
                      Change Password
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-300 truncate mt-0.5">
                      Update your account security password (min. 6 characters)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setPasswordChangeError(null);
                    setPasswordChangeSuccess(null);
                  }}
                  className="p-2 -mr-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center shrink-0 border border-slate-700 shadow-sm cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExecuteChangePassword} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {passwordChangeError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordChangeError}</span>
                  </div>
                )}

                {passwordChangeSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{passwordChangeSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                      className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must be at least 6 characters long.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full p-2.5 pr-10 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPasswordInput && newPasswordInput !== confirmPasswordInput && (
                    <span className="text-[10px] text-rose-500 mt-1 block">
                      Passwords do not match.
                    </span>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordChangeError(null);
                      setPasswordChangeSuccess(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold cursor-pointer transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      passwordChangeLoading ||
                      !newPasswordInput ||
                      newPasswordInput.length < 6 ||
                      newPasswordInput !== confirmPasswordInput
                    }
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold cursor-pointer transition shadow-xs text-xs flex items-center justify-center gap-1.5"
                  >
                    {passwordChangeLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM NAVIGATION BAR (Mobile PWA) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl pt-2 px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
      >
        <div className="max-w-md mx-auto grid grid-cols-4 gap-2">
          {/* 1. Dashboard (My Portfolio) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
              activeTab === 'home'
                ? 'text-emerald-700 font-bold bg-emerald-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 mb-1 ${activeTab === 'home' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
            <span className="text-[10px] leading-tight">Dashboard</span>
          </button>

          {/* 2. Passbook (Digital Passbook & SL) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('passbook');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
              activeTab === 'passbook'
                ? 'text-emerald-700 font-bold bg-emerald-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'passbook' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
            <span className="text-[10px] leading-tight">Passbook</span>
          </button>

          {/* 3. Members (Directory) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('members');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
              activeTab === 'members'
                ? 'text-emerald-700 font-bold bg-emerald-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Users className={`w-5 h-5 mb-1 ${activeTab === 'members' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
            <span className="text-[10px] leading-tight">Members</span>
          </button>

          {/* 4. More (All Other Services & Settings) */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('more');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
              activeTab !== 'home' && activeTab !== 'passbook' && activeTab !== 'members'
                ? 'text-emerald-700 font-bold bg-emerald-50/80'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Menu className={`w-5 h-5 mb-1 ${activeTab !== 'home' && activeTab !== 'passbook' && activeTab !== 'members' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
              {endorsementRequests.some((r) => r.designatedCoMakerMemberNumber === currentMember.memberNumber && r.status === 'PENDING') && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  1
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
