'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Calculator,
  QrCode,
  BookOpen,
  FileText,
  ShieldCheck,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Download,
  ChevronDown,
  ShieldAlert,
  Check,
  Lock,
  UserCheck,
  Printer,
  X,
  Sliders,
  Plus,
  Clock,
  CheckCircle,
  PieChart,
  Scale,
  FileCheck,
  RefreshCw,
  TrendingUp,
  Search,
  Filter,
  Ban,
  RotateCcw,
  Eye,
  Award,
} from 'lucide-react';

type TabType = 'overview' | 'members' | 'products' | 'los' | 'calculator' | 'collateral' | 'cashier' | 'accounting' | 'surplus' | 'invoices' | 'reports';

interface StaffAccount {
  id: string;
  role: 'GENERAL_MANAGER' | 'LOAN_OFFICER' | 'CREDIT_COMMITTEE' | 'BOD' | 'CASHIER' | 'ACCOUNTANT' | 'COMPLIANCE_OFFICER';
  roleTitle: string;
  name: string;
  initials: string;
  color: string;
  description: string;
  allowedTabs: TabType[];
}

const STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'usr_gm_01',
    role: 'GENERAL_MANAGER',
    roleTitle: 'General Manager / Superadmin',
    name: 'Atty. Roberto Dela Rosa',
    initials: 'RD',
    color: 'bg-indigo-600',
    description: 'Full statutory administrative & override access across all cooperative modules.',
    allowedTabs: ['overview', 'members', 'products', 'los', 'calculator', 'collateral', 'cashier', 'accounting', 'surplus', 'invoices', 'reports'],
  },
  {
    id: 'usr_lo_01',
    role: 'LOAN_OFFICER',
    roleTitle: 'Senior Loan Officer',
    name: 'Grace Villanueva',
    initials: 'GV',
    color: 'bg-blue-600',
    description: 'Underwrites member applications, verifies credit & co-makers, calculates amortizations.',
    allowedTabs: ['overview', 'members', 'products', 'los', 'calculator', 'collateral'],
  },
  {
    id: 'usr_crecom_01',
    role: 'CREDIT_COMMITTEE',
    roleTitle: 'Credit Committee Chairperson',
    name: 'Engr. Manuel Reyes',
    initials: 'MR',
    color: 'bg-amber-600',
    description: 'Reviews loan appraisals, verifies collateral, endorses to Board.',
    allowedTabs: ['overview', 'products', 'los', 'calculator', 'collateral'],
  },
  {
    id: 'usr_bod_01',
    role: 'BOD',
    roleTitle: 'Board of Directors Chairman',
    name: 'Dr. Corazon Aquino-Cruz',
    initials: 'CA',
    color: 'bg-purple-600',
    description: 'Authorizes credit facilities requiring Board policy resolutions.',
    allowedTabs: ['overview', 'products', 'los', 'calculator', 'collateral', 'surplus', 'reports'],
  },
  {
    id: 'usr_cashier_01',
    role: 'CASHIER',
    roleTitle: 'Branch Head Cashier & Teller',
    name: 'Leah Mendoza',
    initials: 'LM',
    color: 'bg-emerald-600',
    description: 'Executes approved cash disbursements, processes over-the-counter payments & receipts.',
    allowedTabs: ['overview', 'los', 'cashier'],
  },
  {
    id: 'usr_acct_01',
    role: 'ACCOUNTANT',
    roleTitle: 'Chief Bookkeeper & Accountant',
    name: 'Felipe Santos, CPA',
    initials: 'FS',
    color: 'bg-teal-600',
    description: 'Manages CDA Standard Chart of Accounts, General Ledger, and BIR Tax Invoices.',
    allowedTabs: ['overview', 'products', 'accounting', 'surplus', 'invoices', 'reports', 'calculator'],
  },
  {
    id: 'usr_dpo_01',
    role: 'COMPLIANCE_OFFICER',
    roleTitle: 'Compliance Officer & DPO',
    name: 'Atty. Cristina Gomez',
    initials: 'CG',
    color: 'bg-rose-600',
    description: 'Audits NPC Data Privacy, AMLA covered transactions, and CDA/CIC statutory reports.',
    allowedTabs: ['overview', 'members', 'collateral', 'surplus', 'reports'],
  },
];

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
    serviceFeeRate: 0.015,
    finesRateMonthly: 0.03,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 active co-maker in good standing with min ₱5,000 paid-up share capital. Co-maker must key in Member ID and sign solidary undertaking.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
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
    serviceFeeRate: 0.005,
    finesRateMonthly: 0.02,
    requiresCoMaker: true,
    minCoMakers: 1,
    coMakerRuleDescription: 'Requires 1 co-maker who has completed PMES and has active cooperative savings.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
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
    serviceFeeRate: 0.01,
    finesRateMonthly: 0.02,
    requiresCoMaker: false,
    minCoMakers: 0,
    coMakerRuleDescription: 'Co-maker optional; borrower must submit certificate of school matriculation.',
    requiresCollateral: false,
    isActive: true,
    status: 'ACTIVE',
  },
];

const INITIAL_COLLATERALS = [
  {
    id: 'col_rem_001',
    memberId: 'mem_1',
    memberNumber: 'MEM-2026-0001',
    memberName: 'Maria Clara Santos',
    type: 'REAL_ESTATE_MORTGAGE',
    description: '180 sqm Residential Lot & 2-Storey House in Fairview, Quezon City',
    appraisedValue: 1800000,
    assessedValue: 1440000,
    maxLoanToValueRatio: 0.70,
    maxAllowableLoanAmount: 1260000,
    linkedLoanId: 'loan_rem_001',
    linkedLoanNumber: 'LN-2026-0001',
    encumbranceStatus: 'REGISTERED_MORTGAGE',
    tctNumber: 'TCT-004-2019004812',
    registryOfDeedsLocation: 'Quezon City',
    lotAreaSqm: 180,
    registrationDate: '2026-02-15',
    notes: 'Primary title deposited in fireproof safe. Registered with Registry of Deeds QC under Entry 2026-0049182.',
  },
  {
    id: 'col_chattel_002',
    memberId: 'mem_2',
    memberNumber: 'MEM-2026-0002',
    memberName: 'Juan Perez Dela Cruz',
    type: 'CHATTEL_MORTGAGE',
    description: '2023 Isuzu D-Max 3.0 4x4 Double Cab Utility Pickup',
    appraisedValue: 1200000,
    assessedValue: 960000,
    maxLoanToValueRatio: 0.60,
    maxAllowableLoanAmount: 720000,
    linkedLoanId: 'loan_chat_002',
    linkedLoanNumber: 'LN-2026-0002',
    encumbranceStatus: 'REGISTERED_MORTGAGE',
    plateNumber: 'NFP-8812',
    engineNumber: '4JJ3-199420',
    chassisNumber: 'MP1TFS40JP-099124',
    ltoOrCrNumber: 'CR-1301-0098231',
    vehicleMakeModel: 'Isuzu D-Max 3.0 LS-E 4x4',
    registrationDate: '2026-02-18',
    notes: 'LTO Encumbrance annotated. Duplicate key and comprehensive insurance policy endorsed to cooperative.',
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentStaff, setCurrentStaff] = useState<StaffAccount>(STAFF_ACCOUNTS[0]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SYNCED'>('IDLE');

  const handleSyncFirestore = () => {
    setFirestoreSyncStatus('SYNCING');
    setTimeout(() => {
      setFirestoreSyncStatus('SYNCED');
      setTimeout(() => setFirestoreSyncStatus('IDLE'), 3500);
    }, 700);
  };

  // LOS Workflow Simulation State
  const [loanStatus, setLoanStatus] = useState<string>('PENDING_CO_MAKER_ACCEPTANCE');
  const [showDisclosureModal, setShowDisclosureModal] = useState<boolean>(false);

  // Cooperative Loan Products Catalog State with Persistence
  const [loanProducts, setLoanProducts] = useState<any[]>(DEFAULT_LOAN_PRODUCTS);
  const [productSaveNotification, setProductSaveNotification] = useState<string | null>(null);

  // Load persisted products from localStorage and backend API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('flexcoop_loan_products');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLoanProducts(parsed);
          }
        } catch (e) {
          console.error('Failed to parse stored loan products:', e);
        }
      }
    }

    fetch('http://localhost:4000/api/v1/loan-products')
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.success && Array.isArray(resData.data) && resData.data.length > 0) {
          setLoanProducts((prev) => {
            const map = new Map();
            resData.data.forEach((p: any) => map.set(p.code || p.id, p));
            prev.forEach((p: any) => {
              if (!map.has(p.code || p.id)) map.set(p.code || p.id, p);
            });
            const merged = Array.from(map.values());
            if (typeof window !== 'undefined') {
              localStorage.setItem('flexcoop_loan_products', JSON.stringify(merged));
            }
            return merged;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Modal / Form state for configuring new loan product
  const [showProductModal, setShowProductModal] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('SME Livelihood Expansion Loan');
  const [newProductCode, setNewProductCode] = useState<string>('LIVELIHOOD-2026');
  const [newProductType, setNewProductType] = useState<string>('LIVELIHOOD');
  const [newProductMinAmount, setNewProductMinAmount] = useState<number>(10000);
  const [newProductMaxAmount, setNewProductMaxAmount] = useState<number>(150000);
  const [newProductRate, setNewProductRate] = useState<number>(10); // 10% p.a.
  const [newProductMinTerm, setNewProductMinTerm] = useState<number>(6);
  const [newProductMaxTerm, setNewProductMaxTerm] = useState<number>(36);
  const [newProductMethod, setNewProductMethod] = useState<string>('DIMINISHING_BALANCE_EQUAL_INSTALLMENT');
  const [newProductRequiresCoMaker, setNewProductRequiresCoMaker] = useState<boolean>(true);
  const [newProductMinCoMakers, setNewProductMinCoMakers] = useState<number>(1);
  const [newProductCoMakerRule, setNewProductCoMakerRule] = useState<string>('Borrower must designate co-maker by Member ID. Co-maker must accept joint & solidary liability on their account.');
  const [newProductRequiresCollateral, setNewProductRequiresCollateral] = useState<boolean>(false);
  const [newProductServiceFeeRate, setNewProductServiceFeeRate] = useState<number>(1.5);
  const [newProductFinesRate, setNewProductFinesRate] = useState<number>(3.0);
  const [newProductStatus, setNewProductStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const handleAddLoanProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdProduct = {
      id: `prod_${Date.now()}`,
      code: newProductCode.toUpperCase().replace(/\s+/g, '_'),
      name: newProductName,
      type: newProductType as any,
      minAmount: Number(newProductMinAmount),
      maxAmount: Number(newProductMaxAmount),
      annualInterestRate: Number(newProductRate) / 100,
      minTermMonths: Number(newProductMinTerm),
      maxTermMonths: Number(newProductMaxTerm),
      amortizationMethod: newProductMethod as any,
      serviceFeeRate: Number(newProductServiceFeeRate) / 100,
      finesRateMonthly: Number(newProductFinesRate) / 100,
      requiresCoMaker: newProductRequiresCoMaker,
      minCoMakers: newProductRequiresCoMaker ? Number(newProductMinCoMakers) : 0,
      coMakerRuleDescription: newProductCoMakerRule,
      requiresCollateral: newProductRequiresCollateral,
      isActive: newProductStatus === 'ACTIVE',
      status: newProductStatus,
    };

    const updated = [createdProduct, ...loanProducts];
    setLoanProducts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('flexcoop_loan_products', JSON.stringify(updated));
    }

    try {
      await fetch('http://localhost:4000/api/v1/loan-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdProduct),
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }

    setProductSaveNotification(`Loan Product "${createdProduct.name}" (${createdProduct.code}) saved with status ${newProductStatus}!`);
    setTimeout(() => setProductSaveNotification(null), 5000);
    setShowProductModal(false);
  };

  const handleToggleProductStatus = async (productId: string) => {
    const targetProduct = loanProducts.find((p) => p.id === productId);
    if (!targetProduct) return;
    const newIsActive = targetProduct.isActive === false ? true : false;
    const newStatus = newIsActive ? 'ACTIVE' : 'INACTIVE';

    const updated = loanProducts.map((p) =>
      p.id === productId ? { ...p, isActive: newIsActive, status: newStatus } : p
    );
    setLoanProducts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('flexcoop_loan_products', JSON.stringify(updated));
    }

    try {
      await fetch(`http://localhost:4000/api/v1/loan-products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newIsActive }),
      });
    } catch (err) {
      console.warn('API sync warning:', err);
    }

    setProductSaveNotification(
      `Product "${targetProduct.name}" is now ${newStatus}. ${
        newIsActive
          ? 'Now visible to members for applications.'
          : 'Hidden from new member applications; existing loans remain active.'
      }`
    );
    setTimeout(() => setProductSaveNotification(null), 5000);
  };

  // Collaterals & Chattel Mortgages State
  const [collaterals, setCollaterals] = useState<any[]>(INITIAL_COLLATERALS);
  const [showCollateralModal, setShowCollateralModal] = useState<boolean>(false);
  const [collateralNotification, setCollateralNotification] = useState<string | null>(null);

  // New Collateral Form State
  const [newColType, setNewColType] = useState<'REAL_ESTATE_MORTGAGE' | 'CHATTEL_MORTGAGE'>('REAL_ESTATE_MORTGAGE');
  const [newColMemberId, setNewColMemberId] = useState<string>('mem_1');
  const [newColDescription, setNewColDescription] = useState<string>('240 sqm Commercial Property with 3-Door Commercial Unit');
  const [newColAppraisedValue, setNewColAppraisedValue] = useState<number>(2500000);
  const [newColLoanPrincipal, setNewColLoanPrincipal] = useState<number>(1500000);
  const [newColDocNumber, setNewColDocNumber] = useState<string>('TCT-004-2022009183');
  const [newColRegistryLocation, setNewColRegistryLocation] = useState<string>('Quezon City Registry of Deeds');

  // Computed LTV in modal
  const computedModalLTV = newColAppraisedValue > 0 ? (newColLoanPrincipal / newColAppraisedValue) * 100 : 0;
  const maxAllowedLTVLimit = newColType === 'REAL_ESTATE_MORTGAGE' ? 70.0 : 60.0;
  const isModalLTVExceeded = computedModalLTV > maxAllowedLTVLimit;

  const handleRegisterCollateral = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedMember = members.find((m) => m.id === newColMemberId) || members[0];
    const maxLTVRatio = newColType === 'REAL_ESTATE_MORTGAGE' ? 0.70 : 0.60;
    const item = {
      id: `col_${Date.now()}`,
      memberId: selectedMember.id,
      memberNumber: selectedMember.memberNo,
      memberName: selectedMember.name,
      type: newColType,
      description: newColDescription,
      appraisedValue: Number(newColAppraisedValue),
      assessedValue: Math.round(Number(newColAppraisedValue) * 0.8),
      maxLoanToValueRatio: maxLTVRatio,
      maxAllowableLoanAmount: Math.round(Number(newColAppraisedValue) * maxLTVRatio),
      encumbranceStatus: 'REGISTERED_MORTGAGE',
      tctNumber: newColType === 'REAL_ESTATE_MORTGAGE' ? newColDocNumber : undefined,
      plateNumber: newColType === 'CHATTEL_MORTGAGE' ? newColDocNumber : undefined,
      registryOfDeedsLocation: newColRegistryLocation,
      registrationDate: new Date().toISOString().split('T')[0],
      linkedLoanNumber: `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: `Registered with ${newColRegistryLocation}. Fair market appraisal verified by licensed appraiser.`,
    };

    setCollaterals((prev) => [item, ...prev]);
    setShowCollateralModal(false);
    setCollateralNotification(`Collateral "${item.description}" registered successfully with LTV ${(computedModalLTV).toFixed(1)}%!`);
    setTimeout(() => setCollateralNotification(null), 5000);
  };

  const handleDischargeMortgage = (colId: string) => {
    setCollaterals((prev) =>
      prev.map((c) =>
        c.id === colId
          ? {
              ...c,
              encumbranceStatus: 'DISCHARGED',
              linkedLoanId: undefined,
              linkedLoanNumber: undefined,
              notes: `MORTGAGE RELEASED & DISCHARGED upon full loan payoff on ${new Date().toLocaleDateString('en-PH')}.`,
            }
          : c
      )
    );
    setCollateralNotification('Mortgage encumbrance successfully discharged and released to borrower!');
    setTimeout(() => setCollateralNotification(null), 4000);
  };

  const handleReEncumberMortgage = (colId: string) => {
    const registryEntry = `2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setCollaterals((prev) =>
      prev.map((c) =>
        c.id === colId
          ? {
              ...c,
              encumbranceStatus: 'REGISTERED_MORTGAGE',
              linkedLoanNumber: `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              notes: `Annotated and encumbered under Registry Entry ${registryEntry}.`,
            }
          : c
      )
    );
    setCollateralNotification(`Mortgage successfully re-encumbered with Registry Entry ${registryEntry}!`);
    setTimeout(() => setCollateralNotification(null), 4000);
  };

  // Statutory Net Surplus Allocation State (RA 9520 Article 86)
  const [surplusGrossRevenue, setSurplusGrossRevenue] = useState<number>(4500000);
  const [surplusExpenses, setSurplusExpenses] = useState<number>(3250000);
  const [surplusGrfRate, setSurplusGrfRate] = useState<number>(10); // 10% min
  const [surplusCetfRate, setSurplusCetfRate] = useState<number>(10); // 10% total
  const [surplusCdfRate, setSurplusCdfRate] = useState<number>(3); // 3% min
  const [surplusOptRate, setSurplusOptRate] = useState<number>(7); // 7% max
  const [surplusIscRatio, setSurplusIscRatio] = useState<number>(60); // 60% ISC, 40% PR
  const [surplusPostedStatus, setSurplusPostedStatus] = useState<string | null>(null);

  // Live Article 86 Calculations
  const computedNetSurplus = Math.max(0, surplusGrossRevenue - surplusExpenses);
  const computedGrf = Math.round(computedNetSurplus * (surplusGrfRate / 100));
  const computedCetfTotal = Math.round(computedNetSurplus * (surplusCetfRate / 100));
  const computedCetfLocal = Math.round(computedCetfTotal * 0.50);
  const computedCetfApex = computedCetfTotal - computedCetfLocal;
  const computedCdf = Math.round(computedNetSurplus * (surplusCdfRate / 100));
  const computedOpt = Math.round(computedNetSurplus * (surplusOptRate / 100));
  const computedTotalStatutoryReserves = computedGrf + computedCetfTotal + computedCdf + computedOpt;
  const computedDistributable = Math.max(0, computedNetSurplus - computedTotalStatutoryReserves);
  const computedIscPool = Math.round(computedDistributable * (surplusIscRatio / 100));
  const computedPrPool = computedDistributable - computedIscPool;

  // Member allocations (Total Capital ₱25k: Maria Clara ₱15k / 60%, Juan ₱10k / 40%)
  const mariaIsc = Math.round(computedIscPool * 0.60);
  const mariaPr = Math.round(computedPrPool * 0.55);
  const juanIsc = computedIscPool - mariaIsc;
  const juanPr = computedPrPool - mariaPr;

  const handlePostSurplusToGL = () => {
    const voucherRef = `CDA-SURP-2025-${Math.floor(1000 + Math.random() * 9000)}`;
    setSurplusPostedStatus(`Successfully posted Net Surplus Distribution voucher ${voucherRef} to CDA General Ledger! Debits: ₱${computedNetSurplus.toLocaleString()} == Credits: ₱${computedNetSurplus.toLocaleString()} (STRICTLY BALANCED).`);
  };

  // Members Simulation State & Directory Filters
  interface MemberRecord {
    id: string;
    memberNo: string;
    name: string;
    email: string;
    classification: 'REGULAR' | 'ASSOCIATE' | string;
    kycStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'INACTIVE' | string;
    idType: string;
    paidUpShares: number;
    sharesCount: number;
    savingsBalance: number;
    loanBalance: number;
    npcConsent: string;
    pmesStatus?: 'COMPLETED' | 'PENDING' | string;
    pmesCertNo?: string | null;
    pmesDate?: string | null;
    biometricScore?: number | null;
    amlaStatus?: string | null;
    reviewedBy?: string | null;
    reviewDate?: string | null;
    reviewNotes?: string | null;
  }

  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [memberClassificationFilter, setMemberClassificationFilter] = useState<string>('ALL');
  const [memberStatusFilter, setMemberStatusFilter] = useState<string>('ALL');

  const [members, setMembers] = useState<MemberRecord[]>([
    {
      id: 'mem_1',
      memberNo: 'MEM-2026-0001',
      name: 'Maria Clara Santos',
      email: 'maria.santos@gmail.com',
      classification: 'REGULAR',
      kycStatus: 'VERIFIED',
      idType: 'PhilSys National ID (Encrypted SPI)',
      paidUpShares: 15000,
      sharesCount: 150,
      savingsBalance: 5000,
      loanBalance: 47000,
      npcConsent: 'Agreed (IP: 120.29.74.12)',
      pmesStatus: 'COMPLETED',
      pmesCertNo: 'PMES-2026-0012',
      pmesDate: 'Jan 15, 2026',
      biometricScore: 99.1,
      amlaStatus: 'PASSED (Clean / Negative Hit)',
      reviewedBy: 'Atty. Roberto Dela Rosa (General Manager)',
      reviewDate: 'Jan 16, 2026',
      reviewNotes: 'Standard regular member admission. Full voting rights.',
    },
    {
      id: 'mem_2',
      memberNo: 'MEM-2026-0002',
      name: 'Juan Perez Dela Cruz',
      email: 'juan.delacruz@yahoo.com',
      classification: 'REGULAR',
      kycStatus: 'VERIFIED',
      idType: 'Driver\'s License (Encrypted SPI)',
      paidUpShares: 10000,
      sharesCount: 100,
      savingsBalance: 2000,
      loanBalance: 0,
      npcConsent: 'Agreed (IP: 180.191.22.45)',
      pmesStatus: 'COMPLETED',
      pmesCertNo: 'PMES-2026-0028',
      pmesDate: 'Feb 10, 2026',
      biometricScore: 98.7,
      amlaStatus: 'PASSED (Clean / Negative Hit)',
      reviewedBy: 'Atty. Roberto Dela Rosa (General Manager)',
      reviewDate: 'Feb 11, 2026',
      reviewNotes: 'Verified regular member. Designable as loan co-maker.',
    },
    {
      id: 'mem_3',
      memberNo: 'MEM-2026-0003',
      name: 'Antonio Luna Valenzuela',
      email: 'antonio.luna@gmail.com',
      classification: 'ASSOCIATE',
      kycStatus: 'VERIFIED',
      idType: 'PhilHealth ID (Encrypted SPI)',
      paidUpShares: 5000,
      sharesCount: 50,
      savingsBalance: 1200,
      loanBalance: 0,
      npcConsent: 'Agreed (IP: 112.198.88.21)',
      pmesStatus: 'COMPLETED',
      pmesCertNo: 'PMES-2026-0045',
      pmesDate: 'Mar 05, 2026',
      biometricScore: 97.5,
      amlaStatus: 'PASSED (Clean / Negative Hit)',
      reviewedBy: 'Grace Villanueva (Senior Loan Officer)',
      reviewDate: 'Mar 06, 2026',
      reviewNotes: 'Associate member. Non-voting, qualified for savings and consumer credit.',
    },
    {
      id: 'mem_4',
      memberNo: 'MEM-2026-0004',
      name: 'Gabriela Silang Reyes',
      email: 'gabriela.silang@outlook.com',
      classification: 'REGULAR',
      kycStatus: 'PENDING_REVIEW',
      idType: 'Passport (SPI Biometric Review)',
      paidUpShares: 3000,
      sharesCount: 30,
      savingsBalance: 500,
      loanBalance: 0,
      npcConsent: 'Agreed (IP: 49.144.120.89)',
      pmesStatus: 'COMPLETED',
      pmesCertNo: 'PMES-2026-0094',
      pmesDate: 'Oct 08, 2026',
      biometricScore: 98.4,
      amlaStatus: 'PASSED (Negative on AMLC / UN Sanctions / PEP List)',
      reviewedBy: null,
      reviewDate: null,
      reviewNotes: null,
    },
    {
      id: 'mem_5',
      memberNo: 'MEM-2026-0005',
      name: 'Emilio Aguinaldo Famy',
      email: 'emilio.aguinaldo@gmail.com',
      classification: 'ASSOCIATE',
      kycStatus: 'INACTIVE',
      idType: 'UMID Card (Encrypted SPI)',
      paidUpShares: 2000,
      sharesCount: 20,
      savingsBalance: 100,
      loanBalance: 0,
      npcConsent: 'Agreed (IP: 124.106.18.99)',
      pmesStatus: 'PENDING',
      pmesCertNo: 'N/A',
      pmesDate: null,
      biometricScore: 82.0,
      amlaStatus: 'INCOMPLETE (Pending Physical Verification)',
      reviewedBy: null,
      reviewDate: null,
      reviewNotes: 'Suspended pending updated KYC identity documentation.',
    },
  ]);

  const filteredMembers = members.filter((m) => {
    const q = memberSearchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      m.memberNo.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q));
    const matchesClass =
      memberClassificationFilter === 'ALL' || m.classification === memberClassificationFilter;
    const matchesStatus =
      memberStatusFilter === 'ALL' || m.kycStatus === memberStatusFilter;
    return matchesQuery && matchesClass && matchesStatus;
  });

  // Member eKYC & Membership Review / Approval State
  const [selectedMemberForReview, setSelectedMemberForReview] = useState<any | null>(null);
  const [memberReviewNotes, setMemberReviewNotes] = useState<string>('');
  const [memberActionNotification, setMemberActionNotification] = useState<string | null>(null);
  const [memberConfirmModal, setMemberConfirmModal] = useState<{
    isOpen: boolean;
    action: 'APPROVE' | 'REJECT';
    member: any;
    notes: string;
  } | null>(null);

  const handleExecuteMemberDecision = () => {
    if (!memberConfirmModal) return;
    const { action, member, notes } = memberConfirmModal;
    const newStatus = action === 'APPROVE' ? 'VERIFIED' : 'INACTIVE';

    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              kycStatus: newStatus,
              reviewedBy: `${currentStaff.name} (${currentStaff.roleTitle})`,
              reviewDate: new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }),
              reviewNotes: notes || (action === 'APPROVE' ? 'Approved & Certified by Committee.' : 'Declined / Requires document re-submission.'),
            }
          : m
      )
    );

    if (action === 'APPROVE') {
      setMemberActionNotification(
        `Member ${member.memberNo} (${member.name}) successfully approved and activated under CDA RA 9520 rules!`
      );
    } else {
      setMemberActionNotification(
        `Member ${member.memberNo} (${member.name}) application set to INACTIVE / Returned for correction.`
      );
    }
    setTimeout(() => setMemberActionNotification(null), 5000);

    setMemberConfirmModal(null);
    setSelectedMemberForReview(null);
  };

  // Collateral Registry Search State
  const [collateralSearchQuery, setCollateralSearchQuery] = useState<string>('');

  const filteredCollaterals = collaterals.filter((c: any) => {
    const q = collateralSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.memberNumber && c.memberNumber.toLowerCase().includes(q)) ||
      (c.memberName && c.memberName.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.tctNumber && c.tctNumber.toLowerCase().includes(q)) ||
      (c.plateNumber && c.plateNumber.toLowerCase().includes(q))
    );
  });

  // LOS Approval Matrix Confirmation Modal State
  const [losConfirmModal, setLosConfirmModal] = useState<{
    isOpen: boolean;
    actionType: 'PROCEED_APPROVAL' | 'CANCEL_APPLICATION';
    targetStatus: string;
    stageTitle: string;
    actionTitle: string;
    message: string;
    statutoryDetail: string;
    confirmBtnText: string;
    confirmBtnClass: string;
  } | null>(null);
  const [losNotification, setLosNotification] = useState<string | null>(null);

  const handleOpenLosConfirm = (config: {
    actionType: 'PROCEED_APPROVAL' | 'CANCEL_APPLICATION';
    targetStatus: string;
    stageTitle: string;
    actionTitle: string;
    message: string;
    statutoryDetail: string;
    confirmBtnText: string;
    confirmBtnClass: string;
  }) => {
    setLosConfirmModal({
      isOpen: true,
      ...config,
    });
  };

  const handleConfirmLosAction = () => {
    if (!losConfirmModal) return;
    setLoanStatus(losConfirmModal.targetStatus);
    const actionLabel =
      losConfirmModal.actionType === 'PROCEED_APPROVAL' ? 'Approved & Advanced' : 'Cancelled';
    setLosNotification(
      `Application LN-2026-00001: ${losConfirmModal.stageTitle} ${actionLabel}. New Status: ${losConfirmModal.targetStatus}.`
    );
    setTimeout(() => setLosNotification(null), 5000);
    setLosConfirmModal(null);
  };

  // Interactive Loan Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(12);
  const [calcTerm, setCalcTerm] = useState<number>(12);
  const [calcMethod, setCalcMethod] = useState<'DIMINISHING_BALANCE_EQUAL_INSTALLMENT' | 'STRAIGHT_LINE'>('DIMINISHING_BALANCE_EQUAL_INSTALLMENT');
  const [calcBillingMode, setCalcBillingMode] = useState<'PLATFORM_ESCROW' | 'COOP_MERCHANT'>('PLATFORM_ESCROW');

  // Pass-through platform fee math
  const platformFee =
    calcBillingMode === 'PLATFORM_ESCROW'
      ? Math.max(calcAmount * 0.02, 100)
      : calcAmount * 0.005;
  const netPlatformRevenue = Math.round((platformFee / 1.12) * 100) / 100;
  const vatAmount = Math.round((platformFee - netPlatformRevenue) * 100) / 100;
  const coopServiceFee = Math.round(calcAmount * 0.015 * 100) / 100;
  const netDisbursed = calcAmount - platformFee - coopServiceFee;

  // Cashier Multi-Transaction State
  const [cashierTxCategory, setCashierTxCategory] = useState<'LOAN_REPAYMENT' | 'SHARE_PURCHASE' | 'SAVINGS_DEPOSIT'>('SHARE_PURCHASE');
  const [cashierMemberId, setCashierMemberId] = useState<string>('mem_1');
  const [sharesToBuy, setSharesToBuy] = useState<number>(20); // ₱100.00 par value = ₱2,000.00
  const [savingsDepositAmount, setSavingsDepositAmount] = useState<number>(2000);
  const [savingsCategory, setSavingsCategory] = useState<'VOLUNTARY' | 'COMPULSORY'>('VOLUNTARY');

  // PayMongo QR Ph Pass-On Math & Cashiering
  const [paymentAmount, setPaymentAmount] = useState<number>(4500);
  const [paymentChannel, setPaymentChannel] = useState<'PAYMONGO_QRPH' | 'IN_PERSON_CASHIER'>('IN_PERSON_CASHIER');

  // Dynamic Cashier Transaction Amount based on Category
  const activeTxAmount =
    cashierTxCategory === 'SHARE_PURCHASE'
      ? sharesToBuy * 100
      : cashierTxCategory === 'SAVINGS_DEPOSIT'
      ? savingsDepositAmount
      : paymentAmount;

  const passOnFee = paymentChannel === 'PAYMONGO_QRPH' ? Math.max(15, Math.round(activeTxAmount * 0.015 * 100) / 100) : 0;
  const totalCharge = activeTxAmount + passOnFee;

  // Official Receipt Modal State
  const [officialReceiptModal, setOfficialReceiptModal] = useState<{
    receiptNo: string;
    memberName: string;
    memberNo: string;
    txType: string;
    grossAmount: number;
    particulars: string;
    channel: string;
    date: string;
    glEntry: string;
    cashierName: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              F
            </div>
            <div>
              <div className="font-bold text-lg leading-tight flex items-center gap-2">
                Flex Coop Solution
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  CDA Compliant
                </span>
              </div>
              <div className="text-xs text-slate-500">Enterprise SaaS Cooperative Banking & Lending</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Member Portal Quick Links */}
            <div className="hidden lg:flex items-center space-x-1 border-r border-slate-200 pr-3">
              <Link
                href="/member/login"
                className="text-xs font-semibold text-slate-700 hover:text-emerald-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Member Login
              </Link>
              <Link
                href="/member/register"
                className="text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                + Member Onboarding
              </Link>
              <Link
                href="/coop-register"
                className="text-xs font-semibold text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition-colors ml-1"
              >
                + Register New Coop
              </Link>
            </div>

            <Link
              href="/member"
              className="text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Member Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Active Tenant Badge */}
            <div className="hidden xl:flex items-center space-x-2.5 bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-semibold text-slate-900 leading-tight">Bayani Cooperative</div>
                <div className="text-emerald-800 font-mono text-[10px] font-semibold">bayani-flexcoop.tuntongtech.com</div>
              </div>
            </div>

            {/* Cloud Firestore Database Badge & Sync */}
            <div className="hidden lg:flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <div>
                <div className="font-semibold text-amber-950 leading-tight">Cloud Firestore</div>
                <div className="text-amber-800 font-mono text-[10px]">/tenants/tenant_bayani_001/</div>
              </div>
              <button
                type="button"
                onClick={handleSyncFirestore}
                disabled={firestoreSyncStatus === 'SYNCING'}
                className="ml-1 text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold px-2 py-0.5 rounded transition-colors disabled:opacity-50"
              >
                {firestoreSyncStatus === 'SYNCING' ? 'Syncing...' : firestoreSyncStatus === 'SYNCED' ? '✓ Synced' : 'Sync'}
              </button>
            </div>

            {/* Interactive Staff Role Switcher (RBAC) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs transition-all shadow-sm"
              >
                <div className={`w-7 h-7 rounded-full ${currentStaff.color} text-white font-bold flex items-center justify-center text-[10px] shadow-sm`}>
                  {currentStaff.initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-slate-900 leading-tight flex items-center gap-1">
                    <span>{currentStaff.name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold">{currentStaff.roleTitle}</div>
                </div>
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-84 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Staff Role-Based Access (RBAC)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                      CDA MC 2015-06
                    </span>
                  </div>
                  {STAFF_ACCOUNTS.map((staff) => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => {
                        setCurrentStaff(staff);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 text-xs transition-colors ${
                        currentStaff.id === staff.id
                          ? 'bg-emerald-50 border border-emerald-300 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full ${staff.color} text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5 shadow-sm`}>
                        {staff.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold flex items-center justify-between">
                          <span className="truncate">{staff.name}</span>
                          {currentStaff.id === staff.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-700">{staff.roleTitle}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{staff.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs with Permission Indicators */}
        <div className="flex space-x-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Executive Dashboard', icon: Landmark },
            { id: 'members', label: 'Members & eKYC', icon: Users },
            { id: 'products', label: 'Loan Products & Offers', icon: Sliders },
            { id: 'los', label: 'LOS Approval Matrix', icon: CreditCard },
            { id: 'calculator', label: 'Loan Calculator & Fees', icon: Calculator },
            { id: 'collateral', label: 'Collateral & Chattel Registry', icon: Scale },
            { id: 'cashier', label: 'Cashier & PayMongo QR Ph', icon: QrCode },
            { id: 'accounting', label: 'CDA General Ledger', icon: BookOpen },
            { id: 'surplus', label: 'Net Surplus & Patronage (Art. 86)', icon: PieChart },
            { id: 'invoices', label: 'Tax & Invoices (12% VAT)', icon: FileText },
            { id: 'reports', label: 'CDA & CIC Mandatory Reports', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasPermission = currentStaff.allowedTabs.includes(tab.id as any);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : hasPermission
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 opacity-80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {!hasPermission && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    View-Only
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cloud Firestore Sync Confirmation Banner */}
        {firestoreSyncStatus === 'SYNCED' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 mb-6 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Cloud Firestore Synchronized:</strong> 59 CDA Chart of Accounts, 2 Member Profiles, and Active Loan Documents are up to date under path <code className="font-mono text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">/tenants/tenant_bayani_001/</code>.
              </span>
            </div>
            <span className="text-[10px] bg-emerald-200 text-emerald-900 font-mono px-2 py-0.5 rounded font-bold">
              Status: 200 OK
            </span>
          </div>
        )}

        {/* Segregation of Duties Notice Banner (if active tab is restricted for active staff) */}
        {!currentStaff.allowedTabs.includes(activeTab) && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 mb-6 flex items-start gap-3 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                <span>Statutory Segregation of Duties Notice (CDA MC 2015-06)</span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-mono">
                  Read-Only Mode for {currentStaff.roleTitle}
                </span>
              </div>
              <p className="mt-1 text-amber-800 leading-relaxed">
                You are currently viewing this module as <strong>{currentStaff.name} ({currentStaff.roleTitle})</strong>. 
                Under standard Cooperative Governance regulations, action items in this module are reserved for authorized fiduciary roles. 
                Switch to the appropriate staff role via the header dropdown to simulate authoring or approving actions.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Loan Portfolio</div>
                <div className="text-2xl font-bold text-slate-900 mt-2">₱50,000.00</div>
                <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 1 Active Loan (0 Defaults)
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paid-Up Share Capital</div>
                <div className="text-2xl font-bold text-slate-900 mt-2">₱25,000.00</div>
                <div className="text-xs text-slate-500 font-medium mt-1">2 Regular Members Registered</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Platform Pass-Through Fees</div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">₱1,000.00</div>
                <div className="text-xs text-slate-500 font-medium mt-1">₱107.14 Output VAT Remitted</div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Portfolio At Risk (PAR)</div>
                <div className="text-2xl font-bold text-slate-900 mt-2">0.00%</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">CDA Target: &lt; 5.0%</div>
              </div>
            </div>

            {/* Architecture & Compliance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Philippine Regulatory Compliance Architecture
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></span>
                    <div>
                      <div className="font-semibold text-slate-800">CDA Standard Chart of Accounts (COA)</div>
                      <div className="text-xs text-slate-500">
                        Strict double-entry validation using standard codes: Assets (1-xx), Liabilities (2-xx), Equity (3-xx), Revenue (4-xx), Expenses (5-xx).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></span>
                    <div>
                      <div className="font-semibold text-slate-800">NPC (Data Privacy Act of 2012)</div>
                      <div className="text-xs text-slate-500">
                        Consent logs with IP & UserAgent audit records; AES-256-GCM field encryption for SPI (PhilSys National ID, TIN, birthdates).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></span>
                    <div>
                      <div className="font-semibold text-slate-800">AMLC Covered Transaction Triggers</div>
                      <div className="text-xs text-slate-500">
                        Automated threshold flagging for cash transactions $\ge ₱500,000.00$ within a single banking day.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                  <Percent className="w-5 h-5 text-emerald-600" />
                  Dual Monetization & Pass-Through Engine
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="p-4 border border-emerald-200 bg-emerald-50/50 rounded-lg">
                    <div className="flex justify-between font-semibold text-emerald-950">
                      <span>Platform Escrow Mode (Active)</span>
                      <span className="text-emerald-700">2.0% (Min ₱100.00)</span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-1">
                      Platform handles escrow settlement. Processing fee is deducted upfront from loan disbursement proceeds.
                    </p>
                  </div>

                  <div className="p-4 border border-slate-200 bg-slate-50 rounded-lg">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>Coop-Owned Merchant Mode</span>
                      <span className="text-slate-600">0.5% (No Floor)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Cooperative connects their own PayMongo/banking merchant account. Platform takes 0.5% fee.
                    </p>
                  </div>

                  <div className="text-xs text-slate-500 bg-slate-100 p-3 rounded">
                    <strong>Tax Rule:</strong> All platform processing fees are inclusive of <strong>12% Output VAT</strong> and generate an electronic Sales Invoice with BIR compliance metadata.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MEMBERS */}
        {activeTab === 'members' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cooperative Membership & eKYC Directory</h2>
                <p className="text-xs text-slate-500">NPC Data Privacy Act compliant member records with encrypted sensitive personal information (SPI).</p>
              </div>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                + Register New Member
              </button>
            </div>

            {/* Member Action Notification Toast */}
            {memberActionNotification && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{memberActionNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMemberActionNotification(null)}
                  className="text-emerald-700 hover:text-emerald-950 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Search and Filters Bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Search via Member No or Full Name */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="Search by Member No, Full Name, or Email..."
                    className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMemberSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter by Classification */}
                <div className="sm:col-span-3">
                  <select
                    value={memberClassificationFilter}
                    onChange={(e) => setMemberClassificationFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  >
                    <option value="ALL">All Classifications (Regular & Associate)</option>
                    <option value="REGULAR">REGULAR Member</option>
                    <option value="ASSOCIATE">ASSOCIATE Member</option>
                  </select>
                </div>

                {/* Filter by Status */}
                <div className="sm:col-span-3">
                  <select
                    value={memberStatusFilter}
                    onChange={(e) => setMemberStatusFilter(e.target.value)}
                    className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  >
                    <option value="ALL">All Statuses (Verified, Pending, Inactive)</option>
                    <option value="VERIFIED">VERIFIED / Active</option>
                    <option value="PENDING_REVIEW">PENDING eKYC Review</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                {/* Reset Filters */}
                <div className="sm:col-span-1 flex justify-end">
                  {(memberSearchQuery || memberClassificationFilter !== 'ALL' || memberStatusFilter !== 'ALL') ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearchQuery('');
                        setMemberClassificationFilter('ALL');
                        setMemberStatusFilter('ALL');
                      }}
                      title="Reset all filters"
                      className="p-2 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {filteredMembers.length}/{members.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Showing <strong>{filteredMembers.length}</strong> of <strong>{members.length}</strong> registered members
                </span>
                {(memberSearchQuery || memberClassificationFilter !== 'ALL' || memberStatusFilter !== 'ALL') && (
                  <span className="text-emerald-700 font-medium">
                    Filter Active • {filteredMembers.length} matching results
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Member No</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">eKYC & SPI ID</th>
                    <th className="p-3 text-right">Paid-Up Shares (₱)</th>
                    <th className="p-3">NPC Consent</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="w-8 h-8 text-slate-300" />
                          <span className="font-semibold text-slate-700">No members match your search and filter criteria.</span>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Try adjusting the search query, classification, or KYC status filter to locate member records.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setMemberSearchQuery('');
                              setMemberClassificationFilter('ALL');
                              setMemberStatusFilter('ALL');
                            }}
                            className="mt-2 text-xs text-emerald-700 font-bold hover:underline"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-medium text-slate-900">{m.memberNo}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{m.email}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              m.classification === 'REGULAR'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {m.classification}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            {m.kycStatus === 'VERIFIED' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : m.kycStatus === 'PENDING_REVIEW' ? (
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : (
                              <Ban className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate max-w-[200px]" title={m.idType}>{m.idType}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium text-slate-900">
                          ₱{m.paidUpShares.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{m.npcConsent}</td>
                        <td className="p-3 text-center">
                          {m.kycStatus === 'VERIFIED' && (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> VERIFIED
                            </span>
                          )}
                          {m.kycStatus === 'PENDING_REVIEW' && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span> PENDING REVIEW
                            </span>
                          )}
                          {m.kycStatus === 'INACTIVE' && (
                            <span className="bg-slate-100 text-slate-600 border border-slate-300 px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> INACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {m.kycStatus === 'PENDING_REVIEW' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMemberForReview(m);
                                setMemberReviewNotes(
                                  m.reviewNotes ||
                                    'PMES attendance certificate verified and eKYC biometrics cleared. Eligible for membership admission under RA 9520.'
                                );
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1.5 shadow-sm transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Review & Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMemberForReview(m);
                                setMemberReviewNotes(m.reviewNotes || '');
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg text-[11px] inline-flex items-center gap-1 border border-slate-200 transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              View Dossier
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal: Member eKYC & Underwriting Review Dossier */}
            {selectedMemberForReview && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-fade-in">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          {selectedMemberForReview.memberNo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            selectedMemberForReview.classification === 'REGULAR'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {selectedMemberForReview.classification} MEMBER
                        </span>
                        {selectedMemberForReview.kycStatus === 'PENDING_REVIEW' ? (
                          <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded animate-pulse">
                            PENDING REVIEW
                          </span>
                        ) : selectedMemberForReview.kycStatus === 'VERIFIED' ? (
                          <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded">
                            VERIFIED ACTIVE
                          </span>
                        ) : (
                          <span className="bg-slate-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold">{selectedMemberForReview.name}</h3>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">{selectedMemberForReview.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForReview(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body: 4-Pillar Statutory Compliance Dossier */}
                  <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-900">
                      <Scale className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Philippine Cooperative Code (RA 9520) & CDA eKYC Governance</div>
                        <p className="text-amber-800 text-[11px] mt-0.5">
                          Membership review mandates statutory verification of: <strong>(1) PMES attendance certificate</strong> (Art. 26), 
                          <strong>(2) eKYC identity & biometrics</strong> (AMLA RA 9160), <strong>(3) AMLC / PEP watchlist clearance</strong>, and 
                          <strong>(4) Minimum Share Capital subscription (CBU)</strong> prior to activation.
                        </p>
                      </div>
                    </div>

                    {/* 4 Compliance Pillars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Pillar 1: PMES Certification */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            1. PMES Certification
                          </span>
                          {selectedMemberForReview.pmesStatus === 'COMPLETED' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> PENDING SEMINAR
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Certificate No:</span>
                            <span className="font-mono font-semibold text-slate-800">{selectedMemberForReview.pmesCertNo || 'PMES-2026-0094'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Seminar Date:</span>
                            <span className="font-medium text-slate-800">{selectedMemberForReview.pmesDate || 'Oct 08, 2026'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Certified By:</span>
                            <span className="text-slate-800 font-medium">Coop Education Committee (EdCom)</span>
                          </div>
                        </div>
                      </div>

                      {/* Pillar 2: eKYC & Biometrics */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            2. eKYC & Biometric Match
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {selectedMemberForReview.biometricScore || 98.4}% MATCH
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Gov&apos;t ID Submitted:</span>
                            <span className="font-semibold text-slate-800 truncate max-w-[150px]">{selectedMemberForReview.idType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Facial Liveness:</span>
                            <span className="text-emerald-700 font-semibold">Active 3D Liveness Passed</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">DPA (RA 10173):</span>
                            <span className="font-mono text-[10px] text-slate-700">{selectedMemberForReview.npcConsent}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pillar 3: AMLC & Sanctions */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-teal-600" />
                            3. AMLA RA 9160 & PEP Check
                          </span>
                          <span className="bg-teal-100 text-teal-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-teal-200">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" /> CLEAN / NO HITS
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Watchlist Status:</span>
                            <span className="text-slate-800 font-semibold">{selectedMemberForReview.amlaStatus || 'PASSED (Clean)'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">PEP Exposure:</span>
                            <span className="text-emerald-700 font-semibold">No PEP Ties Detected</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Risk Assessment:</span>
                            <span className="text-slate-800 font-medium">Low Risk (Standard Due Diligence)</span>
                          </div>
                        </div>
                      </div>

                      {/* Pillar 4: Capital Build-Up (CBU) */}
                      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-amber-600" />
                            4. Capital Build-Up (CBU)
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> MET MINIMUM
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-600 pt-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Subscribed Shares:</span>
                            <span className="font-semibold text-slate-800">{selectedMemberForReview.sharesCount} Shares (@ ₱100/par)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Paid-Up Capital:</span>
                            <span className="font-bold text-slate-900">₱{selectedMemberForReview.paidUpShares.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Initial Savings Deposit:</span>
                            <span className="font-semibold text-slate-800">₱{selectedMemberForReview.savingsBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Underwriting Resolution / Committee Decision Box */}
                    <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-indigo-600" />
                          Membership Underwriting & Committee Resolution
                        </label>
                        <div className="text-[11px] text-slate-500">
                          Reviewing As: <strong className="text-slate-800">{currentStaff.name}</strong> ({currentStaff.roleTitle})
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={memberReviewNotes}
                        onChange={(e) => setMemberReviewNotes(e.target.value)}
                        placeholder="Enter committee resolution findings, PMES confirmation details, or underwriting notes..."
                        className="w-full text-xs p-3 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMemberForReview(null)}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition"
                    >
                      Close Dossier
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {selectedMemberForReview.kycStatus === 'PENDING_REVIEW' ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setMemberConfirmModal({
                                isOpen: true,
                                action: 'REJECT',
                                member: selectedMemberForReview,
                                notes: memberReviewNotes,
                              })
                            }
                            className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition"
                          >
                            Return for Correction / Decline
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMemberConfirmModal({
                                isOpen: true,
                                action: 'APPROVE',
                                member: selectedMemberForReview,
                                notes: memberReviewNotes,
                              })
                            }
                            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve & Activate Membership
                          </button>
                        </>
                      ) : selectedMemberForReview.kycStatus === 'VERIFIED' ? (
                        <button
                          type="button"
                          onClick={() =>
                            setMemberConfirmModal({
                              isOpen: true,
                              action: 'REJECT',
                              member: selectedMemberForReview,
                              notes: memberReviewNotes || 'Deactivated by cooperative administrator.',
                            })
                          }
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg transition flex items-center gap-1.5"
                        >
                          <Ban className="w-3.5 h-3.5 text-slate-500" /> Set Status to Inactive
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setMemberConfirmModal({
                              isOpen: true,
                              action: 'APPROVE',
                              member: selectedMemberForReview,
                              notes: memberReviewNotes || 'Re-activated after document submission.',
                            })
                          }
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Re-Activate Membership
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Verification Confirmation Dialog */}
            {memberConfirmModal?.isOpen && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    {memberConfirmModal.action === 'APPROVE' ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {memberConfirmModal.action === 'APPROVE'
                          ? 'Confirm Member Approval'
                          : 'Decline / Return Member Application'}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {memberConfirmModal.member.memberNo} • {memberConfirmModal.member.name}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    {memberConfirmModal.action === 'APPROVE' ? (
                      <>
                        <p className="font-semibold text-emerald-900">
                          Activate member as {memberConfirmModal.member.classification} Member in good standing?
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          This executes the committee resolution under RA 9520 Art. 26. The member will gain immediate voting rights 
                          (for regular members), dividend accrual eligibility, savings accounts, and borrowing capability.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-rose-900">
                          Return or deactivate this membership record?
                        </p>
                        <p className="text-slate-600 text-[11px]">
                          The member will be marked as INACTIVE and notified to provide additional KYC identification or complete the PMES seminar.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setMemberConfirmModal(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteMemberDecision}
                      className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition shadow-sm ${
                        memberConfirmModal.action === 'APPROVE'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {memberConfirmModal.action === 'APPROVE'
                        ? 'Confirm & Activate Member'
                        : 'Confirm Deactivation'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: LOAN PRODUCTS & OFFERS */}
        {activeTab === 'products' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cooperative Loan Products & Credit Facilities</h2>
                <p className="text-xs text-slate-500">
                  Configure custom interest rates, repayment tenure terms, amortization formulas, and co-maker solidary underwriting rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Configure New Loan Product
              </button>
            </div>

            {productSaveNotification && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Saved to Database:</strong> {productSaveNotification}</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-bold">
                  200 OK (Persisted)
                </span>
              </div>
            )}

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {loanProducts.map((p) => {
                const isActive = p.isActive !== false && p.status !== 'INACTIVE';
                return (
                  <div
                    key={p.id}
                    className={`border rounded-xl p-5 transition-all flex flex-col justify-between space-y-4 ${
                      isActive
                        ? 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                        : 'border-slate-300 bg-slate-100/70 opacity-90'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {p.type}
                          </span>
                          {isActive ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ACTIVE
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> INACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {p.code}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {p.coMakerRuleDescription}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Principal Range:</span>
                          <span className="font-semibold text-slate-900">₱{p.minAmount.toLocaleString()} - ₱{p.maxAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Annual Interest:</span>
                          <span className="font-semibold text-emerald-700">{(p.annualInterestRate * 100).toFixed(1)}% p.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Repayment Term:</span>
                          <span className="font-semibold text-slate-900">{p.minTermMonths} - {p.maxTermMonths} Months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Amortization Engine:</span>
                          <span className="font-medium text-slate-700 text-[11px] text-right">
                            {p.amortizationMethod === 'DIMINISHING_BALANCE_EQUAL_INSTALLMENT' ? 'Diminishing Balance' : 'Straight-Line'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-500">Co-Maker Rule:</span>
                          {p.requiresCoMaker ? (
                            <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                              ✓ {p.minCoMakers} Co-Maker Req.
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[11px]">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Fee: {(p.serviceFeeRate * 100).toFixed(1)}% • Pen: {(p.finesRateMonthly * 100).toFixed(1)}%/mo</span>
                      {isActive ? (
                        <button
                          type="button"
                          onClick={() => handleToggleProductStatus(p.id)}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded border border-rose-200 transition flex items-center gap-1"
                          title="Deactivate this product so it is hidden from member applications"
                        >
                          <Ban className="w-3 h-3" /> Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleProductStatus(p.id)}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2.5 py-1 rounded border border-emerald-300 transition flex items-center gap-1"
                          title="Activate this product for member applications"
                        >
                          <Check className="w-3 h-3" /> Activate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Product Configuration Modal */}
            {showProductModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Configure Cooperative Loan Product / Offer</h3>
                      <p className="text-xs text-slate-500">Establish statutory credit parameters, terms, interest, and co-maker requirements.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddLoanProduct} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                        <input
                          type="text"
                          required
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Product Code</label>
                        <input
                          type="text"
                          required
                          value={newProductCode}
                          onChange={(e) => setNewProductCode(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Loan Category</label>
                        <select
                          value={newProductType}
                          onChange={(e) => setNewProductType(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                        >
                          <option value="REGULAR">REGULAR</option>
                          <option value="EMERGENCY">EMERGENCY</option>
                          <option value="EDUCATIONAL">EDUCATIONAL</option>
                          <option value="LIVELIHOOD">LIVELIHOOD</option>
                          <option value="MICROFINANCE">MICROFINANCE</option>
                          <option value="APPLIANCE">APPLIANCE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Min Principal (₱)</label>
                        <input
                          type="number"
                          required
                          min={1000}
                          value={newProductMinAmount}
                          onChange={(e) => setNewProductMinAmount(Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Max Principal (₱)</label>
                        <input
                          type="number"
                          required
                          min={5000}
                          value={newProductMaxAmount}
                          onChange={(e) => setNewProductMaxAmount(Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Annual Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={newProductRate}
                          onChange={(e) => setNewProductRate(Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Min Term (Months)</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={newProductMinTerm}
                          onChange={(e) => setNewProductMinTerm(Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Max Term (Months)</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={newProductMaxTerm}
                          onChange={(e) => setNewProductMaxTerm(Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Amortization Engine</label>
                      <select
                        value={newProductMethod}
                        onChange={(e) => setNewProductMethod(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      >
                        <option value="DIMINISHING_BALANCE_EQUAL_INSTALLMENT">Diminishing Balance (Equal Monthly Installment)</option>
                        <option value="STRAIGHT_LINE">Straight-Line Simple Amortization</option>
                      </select>
                    </div>

                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-amber-950">Require Co-Maker Endorsement</span>
                          <p className="text-[11px] text-amber-800">Borrower must key in Co-Maker's Member ID. Co-maker must accept on their account before triage.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={newProductRequiresCoMaker}
                          onChange={(e) => setNewProductRequiresCoMaker(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                      </div>

                      {newProductRequiresCoMaker && (
                        <div className="space-y-2 pt-2 border-t border-amber-200">
                          <div>
                            <label className="block font-semibold text-amber-900 mb-1">Co-Maker Eligibility Rule Description</label>
                            <input
                              type="text"
                              required
                              value={newProductCoMakerRule}
                              onChange={(e) => setNewProductCoMakerRule(e.target.value)}
                              placeholder="e.g. Must be regular member with at least ₱5,000 paid-up capital"
                              className="w-full border border-amber-300 rounded-lg p-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Coop Service Fee (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newProductServiceFeeRate}
                          onChange={(e) => setNewProductServiceFeeRate(Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Monthly Overdue Fine (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newProductFinesRate}
                          onChange={(e) => setNewProductFinesRate(Number(e.target.value))}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <label className="block font-semibold text-slate-800">Initial Product Status</label>
                      <select
                        value={newProductStatus}
                        onChange={(e) => setNewProductStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="ACTIVE">ACTIVE — Publish immediately for member applications</option>
                        <option value="INACTIVE">INACTIVE — Draft / Archived (Hidden from member applications)</option>
                      </select>
                      <p className="text-[11px] text-slate-500">
                        Only active products are visible for member self-service applications. Inactive products remain preserved in existing loans.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowProductModal(false)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors shadow-sm"
                      >
                        Save & Launch Product
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: LOS APPROVAL MATRIX */}
        {activeTab === 'los' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Loan Origination System (LOS) - Multi-Tier Approval Matrix</h2>
                <p className="text-xs text-slate-500">Pipeline: Co-Maker Endorsement $\rightarrow$ Loan Officer Triage $\rightarrow$ Credit Committee $\rightarrow$ Board of Directors $\rightarrow$ Net Proceeds Disbursement.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowDisclosureModal(true)}
                className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" /> View RA 3765 Disclosure & Promissory Note
              </button>
            </div>

            {/* Live Co-Maker Status Banner & Simulator Controller */}
            {loanStatus === 'PENDING_CO_MAKER_ACCEPTANCE' && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Awaiting Co-Maker Endorsement (Designated: Juan Perez Dela Cruz • MEM-2026-0002)
                  </div>
                  <p className="text-amber-800 mt-0.5">
                    Cooperative credit policy enforces mandatory co-maker verification. Loan Officer triage is locked until the co-maker logs in and executes the digital joint & solidary undertaking.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setLoanStatus('SUBMITTED')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Simulate Co-Maker Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanStatus('CO_MAKER_DECLINED')}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Simulate Decline
                  </button>
                </div>
              </div>
            )}

            {loanStatus === 'CO_MAKER_DECLINED' && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-rose-900 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Co-Maker Declined Joint Solidary Liability
                  </div>
                  <p className="text-rose-800 mt-0.5">
                    Designated co-maker Juan Dela Cruz declined endorsement. Application returned to borrower and locked from underwriting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLoanStatus('PENDING_CO_MAKER_ACCEPTANCE')}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Reset to Pending
                </button>
              </div>
            )}

            {['SUBMITTED', 'UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus) && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Co-Maker Endorsed & Legally Bound (RA 3765 Undertaking Signed)
                  </div>
                  <p className="text-emerald-800 mt-0.5">
                    Juan Perez Dela Cruz (MEM-2026-0002) agreed to joint & solidary liability. Loan application pushed to Loan Officer triage.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[11px] border border-emerald-200">
                  Ready for Underwriting
                </span>
              </div>
            )}

            {/* LOS Verification Notification */}
            {losNotification && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{losNotification}</span>
                </div>
                <span className="font-mono text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-bold">
                  Status Updated
                </span>
              </div>
            )}

            {/* Application Cancelled Notice */}
            {loanStatus === 'CANCELLED' && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <strong className="text-rose-900 font-bold text-sm block">Loan Application Cancelled & Voided</strong>
                    <p className="text-rose-800 text-[11px] mt-0.5">
                      Application LN-2026-00001 has been formally cancelled upon verification. Pipeline stages and co-maker undertakings are archived.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLoanStatus('SUBMITTED')}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  Reset / Reactivate to Triage
                </button>
              </div>
            )}

            {/* Application Card */}
            <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-3 gap-3">
                <div>
                  <div className="text-xs font-mono text-slate-500">Application: LN-2026-00001</div>
                  <div className="text-base font-bold text-slate-900">Maria Clara Santos (Regular Member)</div>
                  <div className="text-xs text-slate-600">Product: Regular Member Loan • 12% p.a. • 12 Months term</div>
                  <div className="text-xs text-amber-900 mt-1 font-semibold flex items-center gap-1">
                    <span>Designated Co-Maker:</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">Juan Perez Dela Cruz (MEM-2026-0002)</span>
                  </div>
                </div>
                <div className="text-left sm:text-right flex flex-col items-start sm:items-end">
                  <div className="text-xs uppercase text-slate-500 font-semibold">Principal Requested</div>
                  <div className="text-2xl font-black text-slate-900">₱50,000.00</div>
                  {loanStatus !== 'CANCELLED' && loanStatus !== 'DISBURSED' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenLosConfirm({
                          actionType: 'CANCEL_APPLICATION',
                          targetStatus: 'CANCELLED',
                          stageTitle: 'Application Cancellation',
                          actionTitle: 'Confirm Loan Application Cancellation',
                          message: 'Are you sure you want to cancel and void loan application LN-2026-00001 (Maria Clara Santos, ₱50,000.00)?',
                          statutoryDetail: 'Under cooperative credit regulations, this will cancel the underwriting process, void pending co-maker solidary liabilities, and issue a cancellation audit log.',
                          confirmBtnText: 'Confirm Cancellation',
                          confirmBtnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
                        })
                      }
                      className="mt-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded border border-rose-200 transition flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" /> Cancel Application
                    </button>
                  )}
                </div>
              </div>

              {/* Stepper Pipeline with 5 Steps: Co-Maker -> LO -> CreCom -> BOD -> Disbursement */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Step 0: Co-Maker Endorsement */}
                <div className={`p-4 rounded-lg border ${
                  ['SUBMITTED', 'UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus)
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : loanStatus === 'CO_MAKER_DECLINED'
                    ? 'border-rose-300 bg-rose-50/60'
                    : 'border-amber-300 bg-amber-50/60'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">0. Co-Maker</span>
                    {['SUBMITTED', 'UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus) ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Endorsed</span>
                    ) : loanStatus === 'CO_MAKER_DECLINED' ? (
                      <span className="text-rose-600">Declined</span>
                    ) : (
                      <span className="text-amber-600">Pending</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Juan Dela Cruz (MEM-2026-0002) digital endorsement.</p>
                  <div className="text-[10px] font-mono text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                    {['SUBMITTED', 'UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus)
                      ? 'Solidary Undertaking Confirmed'
                      : loanStatus === 'CO_MAKER_DECLINED'
                      ? 'Request Declined'
                      : 'Awaiting Member Action'}
                  </div>
                </div>

                {/* Step 1: Loan Officer */}
                <div className={`p-4 rounded-lg border ${
                  ['UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus)
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">1. Loan Officer</span>
                    {['UNDER_CREDIT_REVIEW', 'BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus) ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Endorsed</span>
                    ) : (
                      <span className="text-slate-500">Triage Queue</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Credit scoring & financial capacity verified.</p>
                  {loanStatus === 'PENDING_CO_MAKER_ACCEPTANCE' && (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-slate-100 text-slate-400 text-[10px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-200"
                    >
                      Awaiting Co-Maker
                    </button>
                  )}
                  {loanStatus === 'CO_MAKER_DECLINED' && (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-rose-100 text-rose-500 text-[10px] font-medium py-1.5 rounded cursor-not-allowed border border-rose-200"
                    >
                      Co-Maker Declined
                    </button>
                  )}
                  {loanStatus === 'SUBMITTED' && (
                    <div>
                      {currentStaff.role === 'LOAN_OFFICER' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenLosConfirm({
                              actionType: 'PROCEED_APPROVAL',
                              targetStatus: 'UNDER_CREDIT_REVIEW',
                              stageTitle: 'Loan Officer Endorsement',
                              actionTitle: 'Proceed Approval to Credit Committee',
                              message: 'You are endorsing application LN-2026-00001 (Maria Clara Santos, ₱50,000.00) to the Credit Committee.',
                              statutoryDetail: 'Under CDA underwriting standards, this action certifies that borrower capacity to pay and co-maker qualifications have been satisfactorily appraised.',
                              confirmBtnText: 'Proceed Approval',
                              confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            })
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 rounded transition-colors shadow-sm"
                        >
                          Endorse to Committee
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Only Loan Officers or General Manager may endorse applications"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Loan Officer
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Credit Committee */}
                <div className={`p-4 rounded-lg border ${
                  ['BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus)
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">2. Credit Committee</span>
                    {['BOD_APPROVAL', 'APPROVED', 'DISBURSED'].includes(loanStatus) ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Approved</span>
                    ) : (
                      <span className="text-slate-400">Waiting</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Capacity to pay & collateral evaluation.</p>
                  {loanStatus === 'UNDER_CREDIT_REVIEW' && (
                    <div>
                      {currentStaff.role === 'CREDIT_COMMITTEE' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenLosConfirm({
                              actionType: 'PROCEED_APPROVAL',
                              targetStatus: 'BOD_APPROVAL',
                              stageTitle: 'Credit Committee Evaluation',
                              actionTitle: 'Proceed Approval to Board of Directors',
                              message: 'You are approving application LN-2026-00001 (₱50,000.00) and escalating to the Board of Directors for policy sign-off.',
                              statutoryDetail: 'Committee sign-off verifies compliance with the cooperative credit manual and confirms collateral/co-maker risk buffers.',
                              confirmBtnText: 'Proceed Approval',
                              confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            })
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 rounded transition-colors shadow-sm"
                        >
                          Approve & Escalate to BOD
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Requires Credit Committee Chairperson or General Manager"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Credit Committee
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Board of Directors */}
                <div className={`p-4 rounded-lg border ${
                  ['APPROVED', 'DISBURSED'].includes(loanStatus)
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">3. Board of Directors</span>
                    {['APPROVED', 'DISBURSED'].includes(loanStatus) ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Approved</span>
                    ) : (
                      <span className="text-slate-400">Waiting</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Resolution & authority sign-off.</p>
                  {loanStatus === 'BOD_APPROVAL' && (
                    <div>
                      {currentStaff.role === 'BOD' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenLosConfirm({
                              actionType: 'PROCEED_APPROVAL',
                              targetStatus: 'APPROVED',
                              stageTitle: 'Board of Directors Resolution',
                              actionTitle: 'Proceed with BOD Final Authorization',
                              message: 'You are ratifying the Board Credit Facility Resolution for application LN-2026-00001 (₱50,000.00). Funds will be unlocked for Cashier disbursement.',
                              statutoryDetail: 'Under CDA MC 2015-06, Board sign-off authorizes disbursement from cooperative deposit liabilities.',
                              confirmBtnText: 'Proceed Approval',
                              confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            })
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium py-1.5 rounded transition-colors shadow-sm"
                        >
                          BOD Final Sign-Off
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Requires Board of Directors or General Manager resolution"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Board Chairman
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 4: Disbursement */}
                <div className={`p-4 rounded-lg border ${
                  loanStatus === 'DISBURSED'
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-300 bg-white'
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-700">4. Disbursement</span>
                    {loanStatus === 'DISBURSED' ? (
                      <span className="text-emerald-700 flex items-center gap-1">✓ Disbursed</span>
                    ) : (
                      <span className="text-slate-400">Locked</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Deducts 2% fee & issues 12% VAT invoice.</p>
                  {loanStatus === 'APPROVED' && (
                    <div>
                      {currentStaff.role === 'CASHIER' || currentStaff.role === 'GENERAL_MANAGER' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenLosConfirm({
                              actionType: 'PROCEED_APPROVAL',
                              targetStatus: 'DISBURSED',
                              stageTitle: 'Cashier Disbursement Execution',
                              actionTitle: 'Proceed with Cashier Disbursement',
                              message: 'You are executing disbursement of net proceeds (₱48,250.00) to Maria Clara Santos after upfront fee deductions (2% platform + 1.5% coop).',
                              statutoryDetail: 'An official Disbursement Voucher and BIR Electronic Sales Invoice INV-2026-00918 will be booked in the General Ledger.',
                              confirmBtnText: 'Proceed Disbursement',
                              confirmBtnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            })
                          }
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded transition-colors shadow-sm"
                        >
                          Execute Disbursement
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="Under CDA MC 2015-06, only bonded Cashiers or GM may disburse cash proceeds"
                          className="w-full bg-slate-200 text-slate-500 text-[11px] font-medium py-1.5 rounded cursor-not-allowed border border-slate-300"
                        >
                          Requires Branch Cashier
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Statutory Segregation of Duties Guidance Footnote */}
              <div className="text-[11px] text-slate-500 bg-slate-100 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <span>
                  <strong>CDA Circular 2015-06 Segregation of Duties:</strong> Loan Officers & CreCom members cannot disburse funds; Cashiers cannot approve loans.
                </span>
                <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold text-[10px]">
                  Active Role: {currentStaff.roleTitle}
                </span>
              </div>
            </div>

            {/* LOS Verification Action Confirmation Modal */}
            {losConfirmModal?.isOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      {losConfirmModal.actionType === 'PROCEED_APPROVAL' ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Confirmation Required
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{losConfirmModal.actionTitle}</h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLosConfirmModal(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Application Number:</span>
                      <span className="font-mono font-bold text-slate-900">LN-2026-00001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applicant / Borrower:</span>
                      <span className="font-semibold text-slate-900">Maria Clara Santos (MEM-2026-0001)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Requested Principal:</span>
                      <span className="font-bold text-slate-900">₱50,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Authorizing Officer:</span>
                      <span className="font-semibold text-emerald-800">{currentStaff.name} ({currentStaff.roleTitle})</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {losConfirmModal.message}
                    </p>
                    <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-900 rounded-lg text-[11px] leading-relaxed">
                      <strong>Verification Note:</strong> {losConfirmModal.statutoryDetail}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLosConfirmModal(null)}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmLosAction}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm ${losConfirmModal.confirmBtnClass}`}
                    >
                      {losConfirmModal.confirmBtnText}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Disclosure Statement Modal */}
            {showDisclosureModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                    <div>
                      <div className="text-xs uppercase font-bold text-emerald-700">Republic Act No. 3765 • Truth in Lending Act</div>
                      <h3 className="text-lg font-bold text-slate-900">Disclosure Statement on Loan/Credit Transaction</h3>
                      <div className="text-xs text-slate-500">Bayani Multi-Purpose Cooperative • CDA-NCR-2024-00921</div>
                    </div>
                    <button
                      onClick={() => setShowDisclosureModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-xs space-y-3 text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between">
                      <span className="font-semibold">Borrower:</span>
                      <span>MARIA CLARA SANTOS (MEM-2026-0001)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">1. Loan Principal:</span>
                      <span className="font-bold text-slate-900">₱50,000.00</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 space-y-1 pl-4">
                      <div className="flex justify-between text-slate-600">
                        <span>a. SaaS Pass-Through Processing Fee (2%):</span>
                        <span>₱1,000.00</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>b. Coop Service and Filing Fee (1.5%):</span>
                        <span>₱750.00</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-emerald-900">
                      <span>2. Net Disbursed Proceeds (1 minus Deductions):</span>
                      <span className="text-emerald-800 text-sm">₱48,250.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">3. Effective Interest Rate (EIR):</span>
                      <span>15.50% per annum</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 leading-relaxed border border-slate-200">
                    <div className="font-bold mb-1 uppercase">Promissory Note & Loan Agreement Summary</div>
                    "FOR VALUE RECEIVED, I promise to pay to the order of BAYANI MULTI-PURPOSE COOPERATIVE the sum of PESOS FIFTY THOUSAND (PHP 50,000.00) in 12 equal monthly installments. Default in payment incurs 3% monthly surcharge. Joint and solidary liability acknowledged pursuant to the Cooperative Code."
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setShowDisclosureModal(false)}
                      className="bg-slate-900 text-white text-xs font-medium px-5 py-2.5 rounded-lg hover:bg-slate-800"
                    >
                      Close Statement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Loan Calculator & Pass-Through Monetization Simulator</h2>
              <p className="text-xs text-slate-500">Simulate upfront platform deductions, coop service fees, net member proceeds, and monthly amortization.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Gross Loan Amount (₱)</label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(1000, Number(e.target.value)))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Annual Interest Rate (%)</label>
                    <input
                      type="number"
                      value={calcRate}
                      onChange={(e) => setCalcRate(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Term (Months)</label>
                    <input
                      type="number"
                      value={calcTerm}
                      onChange={(e) => setCalcTerm(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Monetization Channel</label>
                  <select
                    value={calcBillingMode}
                    onChange={(e) => setCalcBillingMode(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="PLATFORM_ESCROW">Platform Escrow (2% of loan or ₱100 floor)</option>
                    <option value="COOP_MERCHANT">Coop-Owned Merchant Account (0.5%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amortization Method</label>
                  <select
                    value={calcMethod}
                    onChange={(e) => setCalcMethod(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="DIMINISHING_BALANCE_EQUAL_INSTALLMENT">Diminishing Balance (Equal Installment / Annuity)</option>
                    <option value="STRAIGHT_LINE">Straight-Line Method</option>
                  </select>
                </div>
              </div>

              {/* Output Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-600">Disbursement & Fee Breakdown</h3>

                <div className="space-y-2 text-sm border-b border-slate-200 pb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Gross Loan Principal:</span>
                    <span className="font-semibold text-slate-900">₱{calcAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Pass-Through Platform Fee ({calcBillingMode === 'PLATFORM_ESCROW' ? '2% / min ₱100' : '0.5%'}):
                    </span>
                    <span className="font-semibold">- ₱{platformFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-slate-500 text-xs pl-4">
                    <span>↳ 12% Output VAT Decomposed:</span>
                    <span>₱{vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs pl-4">
                    <span>↳ Net Platform Revenue:</span>
                    <span>₱{netPlatformRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Coop Internal Service Fee (1.5%):</span>
                    <span className="font-semibold">- ₱{coopServiceFee.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-lg">
                  <div className="text-xs uppercase font-bold text-emerald-900">Net Proceeds Disbursed to Member:</div>
                  <div className="text-2xl font-extrabold text-emerald-950 mt-1">
                    ₱{netDisbursed.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-emerald-800 mt-1">
                    Direct payout via Platform Escrow or Cash Counter
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CASHIER COUNTER & OFFICIAL RECEIPT (OR) ISSUANCE */}
        {activeTab === 'cashier' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                  <span>Cooperative Cashier Counter & Payment Rails</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Facilitates in-person counter transactions for Share Capital, Savings Deposits, and Loan Repayments with immediate CDA General Ledger posting.
                </p>
              </div>

              {/* Transaction Category Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCashierTxCategory('SHARE_PURCHASE')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    cashierTxCategory === 'SHARE_PURCHASE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📈 Share Capital
                </button>
                <button
                  type="button"
                  onClick={() => setCashierTxCategory('SAVINGS_DEPOSIT')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    cashierTxCategory === 'SAVINGS_DEPOSIT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏦 Savings Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setCashierTxCategory('LOAN_REPAYMENT')}
                  className={`px-3 py-1.5 rounded-md transition ${
                    cashierTxCategory === 'LOAN_REPAYMENT'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💰 Loan Repayment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Transaction Input Controls */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Member Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    1. Select Cooperative Member
                  </label>
                  <select
                    value={cashierMemberId}
                    onChange={(e) => setCashierMemberId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberNo}) — Paid-Up: ₱{m.paidUpShares.toLocaleString()} | Savings: ₱{(m.savingsBalance || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>

                  {/* Active Selected Member Info Badges */}
                  {(() => {
                    const activeMem = members.find((m) => m.id === cashierMemberId) || members[0];
                    return (
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Paid-Up Capital</span>
                          <strong className="text-slate-900 text-xs">₱{activeMem.paidUpShares.toLocaleString()}</strong>
                          <span className="text-[10px] text-slate-400 block">{activeMem.sharesCount || Math.floor(activeMem.paidUpShares / 100)} shares</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Savings Balance</span>
                          <strong className="text-slate-900 text-xs">₱{(activeMem.savingsBalance || 0).toLocaleString()}</strong>
                          <span className="text-[10px] text-emerald-600 block">3.0% p.a.</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Loan Balance</span>
                          <strong className="text-slate-900 text-xs">₱{(activeMem.loanBalance || 0).toLocaleString()}</strong>
                          <span className="text-[10px] text-blue-600 block">Regular Loan</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Specific Transaction Inputs */}
                {cashierTxCategory === 'SHARE_PURCHASE' && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Share Capital Build-Up (Common Stock)
                      </span>
                      <span className="text-xs font-mono bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                        Par Value: ₱100.00 / share
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Number of New Shares to Purchase:
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={sharesToBuy}
                          onChange={(e) => setSharesToBuy(Math.max(1, Number(e.target.value)))}
                          className="w-32 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <div className="flex gap-1.5">
                          {[5, 10, 20, 50].map((count) => (
                            <button
                              key={count}
                              type="button"
                              onClick={() => setSharesToBuy(count)}
                              className={`px-2.5 py-1 text-xs rounded-md border font-medium transition ${
                                sharesToBuy === count
                                  ? 'bg-amber-600 text-white border-amber-600'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              +{count} shs
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-1 text-slate-700">
                      <div className="flex justify-between">
                        <span>Total Paid-Up Consideration:</span>
                        <strong className="text-slate-900 font-mono">₱{(sharesToBuy * 100).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>New Subscribed & Paid-Up Total:</span>
                        <strong className="font-mono">
                          {((members.find((m) => m.id === cashierMemberId)?.sharesCount || 150) + sharesToBuy)} Shares (₱
                          {((members.find((m) => m.id === cashierMemberId)?.paidUpShares || 15000) + sharesToBuy * 100).toLocaleString()}
                          )
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {cashierTxCategory === 'SAVINGS_DEPOSIT' && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-3">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5" /> Member Savings Deposit
                    </span>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Savings Account Type</label>
                        <select
                          value={savingsCategory}
                          onChange={(e) => setSavingsCategory(e.target.value as any)}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-2 text-xs bg-white font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option value="VOLUNTARY">Voluntary Regular Savings (3% p.a.)</option>
                          <option value="COMPULSORY">Compulsory Capital Build-Up (2% p.a.)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Deposit Amount (₱)</label>
                        <input
                          type="number"
                          min="100"
                          step="100"
                          value={savingsDepositAmount}
                          onChange={(e) => setSavingsDepositAmount(Math.max(100, Number(e.target.value)))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {[500, 1000, 2000, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSavingsDepositAmount(amt)}
                          className={`px-2.5 py-1 text-xs rounded-md border font-medium transition ${
                            savingsDepositAmount === amt
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ₱{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {cashierTxCategory === 'LOAN_REPAYMENT' && (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Loan Amortization Repayment
                    </span>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Repayment Installment Amount (₱)</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Math.max(100, Number(e.target.value)))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="text-xs text-slate-600 grid grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div>Principal: <strong className="text-slate-900 font-mono">₱{(paymentAmount - 500).toFixed(2)}</strong></div>
                      <div>Interest: <strong className="text-slate-900 font-mono">₱450.00</strong></div>
                      <div>Penalty: <strong className="text-slate-900 font-mono">₱50.00</strong></div>
                    </div>
                  </div>
                )}

                {/* 3. Payment Method */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    2. Payment Channel
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentChannel('IN_PERSON_CASHIER')}
                      className={`p-3 border rounded-xl text-left text-xs transition ${
                        paymentChannel === 'IN_PERSON_CASHIER'
                          ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Landmark className="w-4 h-4 text-emerald-600" /> Over-The-Counter Cash
                      </div>
                      <div className="text-slate-500 font-normal">Physical cash/check in teller drawer (₱0.00 fee)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChannel('PAYMONGO_QRPH')}
                      className={`p-3 border rounded-xl text-left text-xs transition ${
                        paymentChannel === 'PAYMONGO_QRPH'
                          ? 'border-emerald-600 bg-emerald-50/80 font-bold text-emerald-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <QrCode className="w-4 h-4 text-emerald-600" /> Customer-Facing QR Ph
                      </div>
                      <div className="text-slate-500 font-normal">Generate PayMongo QR Ph for member scan</div>
                    </button>
                  </div>
                </div>

                {/* 4. Payment Posting Summary & Execution */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Net Transaction Credit:</span>
                    <span className="font-semibold text-slate-900 font-mono text-sm">₱{activeTxAmount.toFixed(2)}</span>
                  </div>
                  {paymentChannel === 'PAYMONGO_QRPH' && (
                    <div className="flex justify-between text-amber-700">
                      <span>Pass-On Gateway Convenience Fee:</span>
                      <span className="font-semibold font-mono">+ ₱{passOnFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Amount Received:</span>
                    <span className="text-emerald-700 font-mono text-base">₱{totalCharge.toFixed(2)}</span>
                  </div>

                  {/* Cashier Execution Guard */}
                  <div className="pt-2">
                    {currentStaff.role === 'CASHIER' || currentStaff.role === 'GENERAL_MANAGER' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const member = members.find((m) => m.id === cashierMemberId) || members[0];
                          const orNumber = `OR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
                          const nowIso = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

                          let particulars = '';
                          let debitAccount = paymentChannel === 'IN_PERSON_CASHIER' ? '1-01-01 (Cash on Hand)' : '1-01-05 (Payment Gateway Float)';
                          let creditAccount = '';

                          if (cashierTxCategory === 'SHARE_PURCHASE') {
                            const addedShares = sharesToBuy;
                            const addedAmount = addedShares * 100;
                            particulars = `Purchase & Subscription of ${addedShares} Common Shares @ ₱100.00 par value`;
                            creditAccount = '3-01-03 (Paid-Up Share Capital - Common)';

                            setMembers((prev) =>
                              prev.map((m) =>
                                m.id === member.id
                                  ? {
                                      ...m,
                                      paidUpShares: m.paidUpShares + addedAmount,
                                      sharesCount: (m.sharesCount || 0) + addedShares,
                                    }
                                  : m
                              )
                            );
                          } else if (cashierTxCategory === 'SAVINGS_DEPOSIT') {
                            const depositAmount = savingsDepositAmount;
                            particulars = `Deposit to ${savingsCategory === 'COMPULSORY' ? 'Compulsory' : 'Voluntary Regular'} Savings Account`;
                            creditAccount =
                              savingsCategory === 'COMPULSORY'
                                ? '2-01-01 (Savings Deposits - Compulsory)'
                                : '2-01-02 (Savings Deposits - Voluntary)';

                            setMembers((prev) =>
                              prev.map((m) =>
                                m.id === member.id
                                  ? {
                                      ...m,
                                      savingsBalance: (m.savingsBalance || 0) + depositAmount,
                                    }
                                  : m
                              )
                            );
                          } else {
                            particulars = `Loan Amortization Repayment (Principal + Interest)`;
                            creditAccount = '1-02-01 (Loans Receivable) / 4-01-01 (Interest Income)';

                            setMembers((prev) =>
                              prev.map((m) =>
                                m.id === member.id
                                  ? {
                                      ...m,
                                      loanBalance: Math.max(0, (m.loanBalance || 0) - (paymentAmount - 500)),
                                    }
                                  : m
                              )
                            );
                          }

                          setOfficialReceiptModal({
                            receiptNo: orNumber,
                            memberName: member.name,
                            memberNo: member.memberNo,
                            txType:
                              cashierTxCategory === 'SHARE_PURCHASE'
                                ? 'Share Capital Purchase (Capital Build-Up)'
                                : cashierTxCategory === 'SAVINGS_DEPOSIT'
                                ? 'Savings Account Deposit'
                                : 'Loan Amortization Repayment',
                            grossAmount: activeTxAmount,
                            particulars,
                            channel: paymentChannel === 'IN_PERSON_CASHIER' ? 'Over-The-Counter Cash' : 'Counter PayMongo QR Ph',
                            date: nowIso,
                            glEntry: `DR: ${debitAccount} ₱${activeTxAmount.toFixed(2)} | CR: ${creditAccount} ₱${activeTxAmount.toFixed(2)}`,
                            cashierName: currentStaff.name,
                          });
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Post In-Person Transaction & Issue Official Receipt (OR)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title="Segregation of Duties: Only bonded Cashiers or GM may handle collections"
                        className="w-full bg-slate-200 text-slate-500 text-xs font-medium py-3 rounded-xl cursor-not-allowed border border-slate-300"
                      >
                        Posting Restricted to Cashier Role (CDA MC 2015-06 Segregation of Duties)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Receipt Preview / Customer QR Ph Display */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                {paymentChannel === 'PAYMONGO_QRPH' ? (
                  <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center h-full">
                    <div className="w-48 h-48 bg-white border-2 border-emerald-600 rounded-xl p-3 shadow-md flex flex-col items-center justify-center">
                      <div className="w-36 h-36 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-mono p-2 text-center">
                        [Customer QR Ph Code]
                        <br />
                        ₱{totalCharge.toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-4 font-bold text-slate-900 text-sm">PayMongo Dynamic QR Ph Code</div>
                    <div className="text-xs text-slate-500 max-w-xs mt-1">
                      Present on customer monitor. Scannable via GCash, Maya, BDO, BPI, or any InstaPay banking app.
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center h-full">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
                      <Landmark className="w-8 h-8" />
                    </div>
                    <div className="font-bold text-slate-900 text-sm">In-Person Counter Cashiering</div>
                    <div className="text-xs text-slate-600 max-w-xs mt-1 leading-relaxed">
                      Member pays directly at branch teller. Full <strong>₱{activeTxAmount.toFixed(2)}</strong> is credited with zero convenience fees.
                    </div>

                    <div className="w-full mt-6 bg-white p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b pb-1">
                        Statutory Accounting Verification:
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Debited Account:</span>
                        <span className="font-mono text-emerald-800 font-semibold">1-01-01 (Cash on Hand)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Credited Account:</span>
                        <span className="font-mono text-indigo-800 font-semibold">
                          {cashierTxCategory === 'SHARE_PURCHASE'
                            ? '3-01-03 (Paid-Up Capital)'
                            : cashierTxCategory === 'SAVINGS_DEPOSIT'
                            ? '2-01-02 (Voluntary Savings)'
                            : '1-02-01 (Loans Receivable)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Accounting Principle:</span>
                        <span className="font-medium text-emerald-700">Strict Double-Entry (DR = CR)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CDA GENERAL LEDGER */}
        {activeTab === 'accounting' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">CDA Standard General Ledger & Trial Balance</h2>
              <p className="text-xs text-slate-500">Live double-entry balances adhering to the standard Cooperative Development Authority chart of accounts.</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="p-3">CDA Code</th>
                    <th className="p-3">Account Title</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Debit (₱)</th>
                    <th className="p-3 text-right">Credit (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-3 font-mono font-medium">1-01-01</td>
                    <td className="p-3">Cash on Hand (Cashier Counter)</td>
                    <td className="p-3 text-slate-500">ASSETS</td>
                    <td className="p-3 text-right font-medium">15,000.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">1-02-01</td>
                    <td className="p-3">Loans Receivable - Regular</td>
                    <td className="p-3 text-slate-500">ASSETS</td>
                    <td className="p-3 text-right font-medium">50,000.00</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">1-01-04</td>
                    <td className="p-3">Platform Escrow Settlement Account</td>
                    <td className="p-3 text-slate-500">ASSETS</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">48,250.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">2-02-02</td>
                    <td className="p-3">Platform Loan Processing Fee Payable</td>
                    <td className="p-3 text-slate-500">LIABILITIES</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">1,000.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">4-01-02</td>
                    <td className="p-3">Service and Filing Fees Income</td>
                    <td className="p-3 text-slate-500">REVENUE</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">750.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-medium">3-01-03</td>
                    <td className="p-3">Paid-Up Share Capital - Common</td>
                    <td className="p-3 text-slate-500">EQUITY</td>
                    <td className="p-3 text-right text-slate-400">0.00</td>
                    <td className="p-3 text-right font-medium">15,000.00</td>
                  </tr>
                </tbody>
                <tfoot className="bg-emerald-50 border-t-2 border-emerald-500 font-bold text-slate-900">
                  <tr>
                    <td colSpan={3} className="p-3 text-right uppercase">Trial Balance Grand Total:</td>
                    <td className="p-3 text-right text-emerald-800">₱65,000.00</td>
                    <td className="p-3 text-right text-emerald-800">₱65,000.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg font-medium">
              <CheckCircle2 className="w-4 h-4" />
              General Ledger is Balanced! Sum of all debits equals sum of all credits.
            </div>
          </div>
        )}

        {/* TAB 5: TAX & INVOICES */}
        {activeTab === 'invoices' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Electronic Tax Invoices (12% Output VAT)</h2>
              <p className="text-xs text-slate-500">Automated BIR sales invoices generated upon upfront loan fee deduction.</p>
            </div>

            <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 space-y-4 max-w-xl">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Official Electronic Sales Invoice</div>
                  <div className="text-base font-bold text-slate-900">INV-2026-00918</div>
                  <div className="text-xs text-slate-500">Ref: DISB-TX-ESCROW-992182</div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                  DEDUCTED UPFRONT
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Customer (Cooperative):</span>
                  <span className="font-semibold text-slate-800">Bayani Multi-Purpose Cooperative</span>
                </div>
                <div className="flex justify-between">
                  <span>BIR TIN:</span>
                  <span className="font-mono">009-887-123-000</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Loan Amount Disbursed:</span>
                  <span>₱50,000.00</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Gross Processing Fee (2.0%):</span>
                  <span>₱1,000.00</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-3">
                  <span>VATable Sales (Net of VAT):</span>
                  <span>₱892.86</span>
                </div>
                <div className="flex justify-between text-slate-500 pl-3">
                  <span>12% Output VAT:</span>
                  <span>₱107.14</span>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-3 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount Remitted:</span>
                <span className="text-emerald-700">₱1,000.00</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: CDA & CIC MANDATORY REPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Mandatory Regulatory Compliance & Reporting (CDA & CIC)</h2>
                <p className="text-xs text-slate-500">Official statutory filings: CDA Annual Progress Report (CAPR), C-PES Standards, and RA 9510 CIC Credit Registry.</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => alert('Downloaded CDA_CAPR_2026_tenant_bayani_001.csv')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export CDA CAPR (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => alert('Downloaded CIC_Credit_Registry_RA9510.csv')}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export CIC Credit Data
                </button>
              </div>
            </div>

            {/* C-PES Performance Standards Evaluation Card */}
            <div className="p-6 border border-emerald-200 bg-emerald-50/40 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-emerald-200 pb-3">
                <div>
                  <div className="text-xs uppercase font-bold text-emerald-800">Cooperative Performance Evaluation System (C-PES)</div>
                  <h3 className="text-base font-extrabold text-emerald-950">Composite Evaluation Rating: 85.0 / 100</h3>
                  <div className="text-xs text-emerald-700">Standard CDA Rating: <strong>EXCELLENT</strong> • Certificate of Good Standing Qualified</div>
                </div>
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  CDA COMPLIANT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">1. Asset Quality</div>
                  <div className="text-sm font-black text-slate-900 mt-1">PAR 0.00%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">25.0 / 25 pts (Target &le; 5%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">2. Solvency</div>
                  <div className="text-sm font-black text-slate-900 mt-1">Net Worth 78.5%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">25.0 / 25 pts (Target &ge; 20%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">3. Liquidity</div>
                  <div className="text-sm font-black text-slate-900 mt-1">Cash Ratio 300%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">20.0 / 20 pts (Target &ge; 15%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">4. Efficiency</div>
                  <div className="text-sm font-black text-slate-900 mt-1">Expense Ratio 0%</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">15.0 / 15 pts (Target &le; 40%)</div>
                </div>

                <div className="p-3 bg-white border border-emerald-100 rounded-lg">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">5. Profitability</div>
                  <div className="text-sm font-black text-slate-900 mt-1">ROE Active</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">15.0 / 15 pts (Target &ge; 8%)</div>
                </div>
              </div>
            </div>

            {/* CAPR Summary & Statutory Reserves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CAPR Box */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  CDA Annual Progress Report (CAPR) Structure
                </h3>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Total Registered Membership:</span>
                    <strong className="text-slate-900">2 Regular (100% Active)</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Total Paid-Up Share Capital:</span>
                    <strong className="text-slate-900">₱25,000.00 (Common)</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Active Loan Portfolio:</span>
                    <strong className="text-slate-900">₱50,000.00 (0 Defaults)</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Collection Efficiency:</span>
                    <strong className="text-emerald-700">98.5%</strong>
                  </div>
                </div>
              </div>

              {/* Statutory Reserves Box */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Statutory Reserve Allocations (RA 9520 Art. 86)
                </h3>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>General Reserve Fund (Min 10%):</span>
                    <strong className="text-slate-900">10.0% Allocation</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Education & Training Fund (CETF):</span>
                    <strong className="text-slate-900">10.0% Allocation</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Community Development Fund (CDF):</span>
                    <strong className="text-slate-900">3.0% Min Allocation</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-slate-50 rounded">
                    <span>Optional Reserve Fund:</span>
                    <strong className="text-slate-900">7.0% Max Allocation</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: COLLATERAL & CHATTEL MORTGAGE REGISTRY */}
        {activeTab === 'collateral' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-emerald-600" />
                    Collateral & Chattel Mortgage Registry
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real Estate Mortgage (REM) land titles, motor vehicle chattel mortgages, and Loan-to-Value (LTV) regulatory caps under CDA guidelines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCollateralModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> + Register Pledged Collateral
                </button>
              </div>

              {collateralNotification && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Registry Updated:</strong> {collateralNotification}</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-bold">
                    Encumbrance Recorded
                  </span>
                </div>
              )}

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered Assets</span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">₱3,000,000.00</span>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">{collaterals.length} Secured Mortgages</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Real Estate Mortgages (REM)</span>
                  <span className="text-2xl font-black text-indigo-700 mt-1 block">70.0% Max LTV</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Transfer Certificate of Title (TCT)</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Chattel Mortgages</span>
                  <span className="text-2xl font-black text-amber-700 mt-1 block">60.0% Max LTV</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">LTO Motor Vehicle Registry</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Portfolio Average LTV</span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">55.0%</span>
                  <span className="text-[11px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Risk Tier: SAFE
                  </span>
                </div>
              </div>

              {/* Collateral Search Toolbar */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={collateralSearchQuery}
                    onChange={(e) => setCollateralSearchQuery(e.target.value)}
                    placeholder="Search by Member No (e.g. MEM-2026-0001) or Member Name..."
                    className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  {collateralSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCollateralSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>
                    Showing <strong>{filteredCollaterals.length}</strong> of <strong>{collaterals.length}</strong> registered assets
                  </span>
                  {collateralSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCollateralSearchQuery('')}
                      className="text-xs text-rose-600 hover:underline font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Collateral Registry Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Asset Type & Details</th>
                      <th className="p-3">Owner Member</th>
                      <th className="p-3 text-right">Appraised Value</th>
                      <th className="p-3 text-right">Max Allowable Loan</th>
                      <th className="p-3 text-center">LTV Ratio</th>
                      <th className="p-3">Encumbrance Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCollaterals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Scale className="w-8 h-8 text-slate-300" />
                            <span className="font-semibold text-slate-700">
                              No collateral records found matching &quot;{collateralSearchQuery}&quot;.
                            </span>
                            <p className="text-xs text-slate-400 max-w-sm">
                              Try searching with another Member No (e.g. MEM-2026-0001, MEM-2026-0002) or full name.
                            </p>
                            <button
                              type="button"
                              onClick={() => setCollateralSearchQuery('')}
                              className="mt-2 text-xs text-emerald-700 font-bold hover:underline"
                            >
                              Clear Search Query
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredCollaterals.map((c) => {
                        const isREM = c.type === 'REAL_ESTATE_MORTGAGE';
                        const ltvPct = isREM ? '55.6%' : '54.2%';
                        const isEncumbered = c.encumbranceStatus === 'REGISTERED_MORTGAGE';

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    isREM
                                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                                  }`}
                                >
                                  {isREM ? 'REM' : 'CHATTEL'}
                                </span>
                                <strong className="text-slate-900">{c.description}</strong>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {isREM
                                  ? `${c.tctNumber} • ${c.registryOfDeedsLocation} (${c.lotAreaSqm || 180} sqm)`
                                  : `Plate ${c.plateNumber} • ${c.vehicleMakeModel || 'Utility Truck'} (${c.ltoOrCrNumber})`}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-900">{c.memberName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{c.memberNumber}</div>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              ₱{c.appraisedValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                              ₱{c.maxAllowableLoanAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                                {ltvPct} (SAFE)
                              </span>
                            </td>
                            <td className="p-3">
                              {isEncumbered ? (
                                <div>
                                  <span className="bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                                    <Lock className="w-3 h-3 text-emerald-700" /> ENCUMBERED
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                    Linked: {c.linkedLoanNumber || 'LN-2026-0001'}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] w-fit block">
                                    DISCHARGED
                                  </span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">Title Released</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {isEncumbered ? (
                                <button
                                  type="button"
                                  onClick={() => handleDischargeMortgage(c.id)}
                                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded transition"
                                >
                                  Discharge Mortgage
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReEncumberMortgage(c.id)}
                                  className="text-[11px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-2.5 py-1 rounded transition"
                                >
                                  Annotate Mortgage
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: STATUTORY NET SURPLUS & PATRONAGE REFUND (ART. 86 RA 9520) */}
        {activeTab === 'surplus' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-emerald-600" />
                    Annual Net Surplus Allocation & Patronage Distribution (Article 86, RA 9520)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Statutory reserve apportionment (GRF 10%, CETF 10%, CDF 3%, Optional 7%) and 70% distributable surplus split into Interest on Share Capital (ISC) and Patronage Refund (PR).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePostSurplusToGL}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileCheck className="w-4 h-4" /> Authorize & Post to General Ledger
                </button>
              </div>

              {surplusPostedStatus && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{surplusPostedStatus}</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded font-bold">
                    CDA Balanced Entry
                  </span>
                </div>
              )}

              {/* Fiscal Input Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gross Operating Revenues (₱)</label>
                  <input
                    type="number"
                    step="50000"
                    value={surplusGrossRevenue}
                    onChange={(e) => setSurplusGrossRevenue(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Lending interest + service fees</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Cost of Services & Expenses (₱)</label>
                  <input
                    type="number"
                    step="50000"
                    value={surplusExpenses}
                    onChange={(e) => setSurplusExpenses(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Salaries, utilities, admin, interest</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Surplus for Allocation</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">
                    ₱{computedNetSurplus.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-semibold">100% Statutory Base</span>
                </div>
              </div>

              {/* Statutory Allocation Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 30% Statutory Reserves Box */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Statutory Reserves (30% Minimum)
                    </h3>
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      ₱{computedTotalStatutoryReserves.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                      <div>
                        <strong className="text-slate-900 block">General Reserve Fund (GRF)</strong>
                        <span className="text-[11px] text-slate-500">Statutory minimum: 10% (buffer against losses)</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">₱{computedGrf.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 font-mono">10.0% Allocation</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                      <div>
                        <strong className="text-slate-900 block">Coop Education & Training Fund (CETF)</strong>
                        <span className="text-[11px] text-slate-500">5% Local (₱{computedCetfLocal.toLocaleString()}) • 5% Apex (₱{computedCetfApex.toLocaleString()})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">₱{computedCetfTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 font-mono">10.0% Allocation</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                      <div>
                        <strong className="text-slate-900 block">Community Development Fund (CDF)</strong>
                        <span className="text-[11px] text-slate-500">Statutory minimum: 3% for community projects</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">₱{computedCdf.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 font-mono">3.0% Allocation</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg">
                      <div>
                        <strong className="text-slate-900 block">Optional Reserve Fund (ORF)</strong>
                        <span className="text-[11px] text-slate-500">Statutory maximum: 7% for building / expansion</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 block">₱{computedOpt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 font-mono">7.0% Allocation</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 70% Distributable Surplus Box */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Percent className="w-4 h-4 text-emerald-600" />
                      Distributable Member Surplus (70% Tranche)
                    </h3>
                    <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                      ₱{computedDistributable.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-700">Distribution Split:</span>
                        <span className="text-emerald-800">{surplusIscRatio}% Interest on Share Capital • {100 - surplusIscRatio}% Patronage Refund</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={70}
                        step={5}
                        value={surplusIscRatio}
                        onChange={(e) => setSurplusIscRatio(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interest on Share Capital (ISC)</span>
                        <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                          ₱{computedIscPool.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{surplusIscRatio}% of Distributable Pool</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patronage Refund (PR)</span>
                        <span className="text-lg font-black text-slate-900 font-mono mt-1 block">
                          ₱{computedPrPool.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">{100 - surplusIscRatio}% of Distributable Pool</span>
                      </div>
                    </div>

                    {/* Balanced Double-Entry Preview Stamp */}
                    <div className="bg-slate-900 text-white p-3 rounded-xl space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>CDA Balanced Journal Voucher:</span>
                        <span>STRICTLY BALANCED</span>
                      </div>
                      <div className="text-slate-300 text-[10px]">
                        DR: 3-03-01 Net Surplus (₱{computedNetSurplus.toLocaleString()})<br />
                        CR: 3-02-01 GRF (₱{computedGrf.toLocaleString()}) • CR: 2-04-01 CETF (₱{computedCetfTotal.toLocaleString()})<br />
                        CR: 3-02-02 ORF (₱{computedOpt.toLocaleString()}) • CR: 3-02-03 CDF (₱{computedCdf.toLocaleString()})<br />
                        CR: 2-03-01 ISC Payable (₱{computedIscPool.toLocaleString()}) • CR: 2-03-02 PR Payable (₱{computedPrPool.toLocaleString()})
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Pro-Rata Allocations Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 p-3 border-b border-slate-200 font-bold text-xs text-slate-700 flex justify-between items-center">
                  <span>Pro-Rata Member Surplus Allocation Roster (Fiscal Year 2025)</span>
                  <span className="font-normal text-slate-500">Total Share Capital: ₱25,000.00 Common</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Member Details</th>
                      <th className="p-3 text-right">Paid-Up Capital</th>
                      <th className="p-3 text-right">Interest on Capital (ISC)</th>
                      <th className="p-3 text-right">Patronage Refund (PR)</th>
                      <th className="p-3 text-right">Total Net Dividend</th>
                      <th className="p-3">Settlement Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">Maria Clara Santos</div>
                        <div className="text-[11px] text-slate-500 font-mono">MEM-2026-0001 (60.0% Capital Weight)</div>
                      </td>
                      <td className="p-3 text-right font-mono font-medium">₱15,000.00</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₱{mariaIsc.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₱{mariaPr.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">₱{(mariaIsc + mariaPr).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-emerald-700 font-semibold text-[11px]">Credited to Savings (2-01-01)</td>
                    </tr>
                    <tr>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">Juan Perez Dela Cruz</div>
                        <div className="text-[11px] text-slate-500 font-mono">MEM-2026-0002 (40.0% Capital Weight)</div>
                      </td>
                      <td className="p-3 text-right font-mono font-medium">₱10,000.00</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₱{juanIsc.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">₱{juanPr.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">₱{(juanIsc + juanPr).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-emerald-700 font-semibold text-[11px]">Credited to Savings (2-01-01)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REGISTER COLLATERAL POPUP MODAL */}
        {showCollateralModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register Pledged Mortgage Collateral</h3>
                  <p className="text-xs text-slate-500">Record Real Estate Mortgage or Chattel Mortgage and assess Loan-to-Value (LTV).</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCollateralModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterCollateral} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mortgage Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewColType('REAL_ESTATE_MORTGAGE')}
                      className={`p-3 rounded-xl border text-left transition ${
                        newColType === 'REAL_ESTATE_MORTGAGE'
                          ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-bold">Real Estate Mortgage (REM)</div>
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">Land Title • Max 70% LTV</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewColType('CHATTEL_MORTGAGE')}
                      className={`p-3 rounded-xl border text-left transition ${
                        newColType === 'CHATTEL_MORTGAGE'
                          ? 'border-amber-600 bg-amber-50/60 font-bold text-amber-950'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="font-bold">Chattel Mortgage</div>
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">Motor Vehicle • Max 60% LTV</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner Member</label>
                  <select
                    value={newColMemberId}
                    onChange={(e) => setNewColMemberId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberNo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Description</label>
                  <input
                    type="text"
                    required
                    value={newColDescription}
                    onChange={(e) => setNewColDescription(e.target.value)}
                    placeholder="e.g. 240 sqm Commercial Property with 3-Door Unit"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {newColType === 'REAL_ESTATE_MORTGAGE' ? 'TCT / OCT Title Number' : 'Plate / MV File Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newColDocNumber}
                      onChange={(e) => setNewColDocNumber(e.target.value)}
                      placeholder={newColType === 'REAL_ESTATE_MORTGAGE' ? 'TCT-004-2022009183' : 'NFP-8812'}
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {newColType === 'REAL_ESTATE_MORTGAGE' ? 'Registry of Deeds Location' : 'LTO Agency & District'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newColRegistryLocation}
                      onChange={(e) => setNewColRegistryLocation(e.target.value)}
                      placeholder="e.g. Quezon City Registry of Deeds"
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Appraised Fair Market Value (₱)</label>
                    <input
                      type="number"
                      required
                      step="50000"
                      min={50000}
                      value={newColAppraisedValue}
                      onChange={(e) => setNewColAppraisedValue(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Desired Loan Principal (₱)</label>
                    <input
                      type="number"
                      required
                      step="25000"
                      min={10000}
                      value={newColLoanPrincipal}
                      onChange={(e) => setNewColLoanPrincipal(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Live LTV Calculation Card */}
                <div className={`p-3 rounded-xl border ${
                  isModalLTVExceeded ? 'bg-rose-50 border-rose-300 text-rose-950' : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-xs block">Loan-to-Value (LTV) Ratio:</span>
                      <span className="text-[11px] text-slate-600">
                        Regulatory Ceiling: {maxAllowedLTVLimit.toFixed(0)}% for {newColType === 'REAL_ESTATE_MORTGAGE' ? 'REM' : 'Chattel'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-black font-mono ${isModalLTVExceeded ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {computedModalLTV.toFixed(1)}%
                      </span>
                      <span className="text-[10px] block font-bold">
                        {isModalLTVExceeded ? '⚠️ EXCEEDS CEILING' : '✓ SAFE & COMPLIANT'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCollateralModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    Save & Record Encumbrance
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* OFFICIAL RECEIPT (OR) POPUP MODAL */}
        {officialReceiptModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Receipt Header Banner */}
              <div className="bg-slate-900 text-white p-6 relative">
                <button
                  type="button"
                  onClick={() => setOfficialReceiptModal(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow">
                    F
                  </div>
                  <div>
                    <h3 className="font-bold text-base tracking-tight leading-tight">
                      Bayani Multi-Purpose Cooperative
                    </h3>
                    <div className="text-[11px] text-slate-300 font-mono">
                      CDA Reg: CDA-NCR-2024-00921 • TIN: 009-887-123-000
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold tracking-widest text-emerald-400 uppercase text-[11px]">
                    Official Receipt
                  </span>
                  <span className="font-mono bg-slate-800 px-2.5 py-0.5 rounded text-slate-200 font-bold">
                    {officialReceiptModal.receiptNo}
                  </span>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Received From:</span>
                    <strong className="text-slate-900 text-xs">{officialReceiptModal.memberName}</strong>
                    <span className="text-slate-500 block text-[11px]">Member ID: {officialReceiptModal.memberNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Date & Time:</span>
                    <span className="text-slate-700 font-medium block">{officialReceiptModal.date}</span>
                    <span className="text-emerald-700 font-semibold text-[11px]">{officialReceiptModal.channel}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="p-2.5">Particulars / Statutory Description</th>
                        <th className="p-2.5 text-right">Amount (₱)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      <tr>
                        <td className="p-2.5">
                          <div className="font-semibold">{officialReceiptModal.txType}</div>
                          <div className="text-[11px] text-slate-500">{officialReceiptModal.particulars}</div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-sm">
                          ₱{officialReceiptModal.grossAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-emerald-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td className="p-2.5 text-emerald-950">TOTAL RECEIVED:</td>
                        <td className="p-2.5 text-right font-mono text-emerald-950 text-base">
                          ₱{officialReceiptModal.grossAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* CDA Accounting Verification Stamp */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Double-Entry General Ledger Posting:</span>
                    <span className="text-emerald-700 font-bold">STRICTLY BALANCED</span>
                  </div>
                  <div className="font-mono text-slate-700 text-[10px] break-all bg-white p-2 rounded border border-slate-200">
                    {officialReceiptModal.glEntry}
                  </div>
                  <div className="flex justify-between pt-1 text-slate-600">
                    <span>Bonded Cashier / Teller:</span>
                    <strong>{officialReceiptModal.cashierName} (CASHIER)</strong>
                  </div>
                </div>

                {/* BIR / CDA Mandatory Inscription */}
                <div className="text-center text-[10px] text-slate-400 italic">
                  "This serves as an Official Receipt under CDA MC 2015-06 and Philippine Tax Regulations."
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => alert(`Printing Official Receipt ${officialReceiptModal.receiptNo}...`)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfficialReceiptModal(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
