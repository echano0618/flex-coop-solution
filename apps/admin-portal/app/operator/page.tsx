'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CreditCard,
  Layers,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  HardDrive,
  Globe,
  Radio,
  FileText,
  DollarSign,
  Activity,
  Sliders,
  ExternalLink,
  ChevronDown,
  X,
  Lock,
  ArrowUpRight,
  AlertCircle,
  Megaphone,
} from 'lucide-react';

interface TenantFleetItem {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  cdaRegistrationNumber: string;
  tin: string;
  contactEmail: string;
  contactPhone?: string;
  adminName: string;
  billingMode: 'STANDARD_UNIFIED' | 'PLATFORM_ESCROW' | string;
  status: 'ACTIVE' | 'SUSPENDED' | 'GRACE_PERIOD' | string;
  totalMembers: number;
  activeMembers: number;
  freeTierMembers: number;
  billedMembers: number;
  platformCreditBalance: number;
  escrowFloatBalance: number;
  totalLoansDisbursed: number;
  totalLoanVolume: number;
  totalTechFeesGenerated: number;
  storageUsedMb: number;
  storageQuotaMb: number;
  databaseSchema: string;
  healthScore: number;
  lastActiveAt: string;
  createdAt: string;
}

interface CreditTx {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'TOP_UP' | 'FEE_DEDUCTION' | 'PROMO_GRANT' | 'ADJUSTMENT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
  notes: string;
  performedBy: string;
  createdAt: string;
}

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  isActive: boolean;
  createdAt: string;
}

export default function OperatorPortalPage() {
  // Tenant Fleet State
  const [tenants, setTenants] = useState<TenantFleetItem[]>([
    {
      id: 'tenant_bayani_001',
      name: 'Bayani Multi-Purpose Cooperative',
      slug: 'bayani',
      subdomain: 'bayani-coop.tuntongtech.com',
      cdaRegistrationNumber: 'CDA-NCR-2024-00921',
      tin: '009-887-123-000',
      contactEmail: 'admin@bayanicoop.ph',
      contactPhone: '+63 917 555 0192',
      adminName: 'Atty. Roberto Dela Rosa',
      billingMode: 'PLATFORM_ESCROW',
      status: 'ACTIVE',
      totalMembers: 18,
      activeMembers: 17,
      freeTierMembers: 15,
      billedMembers: 3, // 3 members > 15 = ₱150 billed
      platformCreditBalance: 4250.0,
      escrowFloatBalance: 48470.0,
      totalLoansDisbursed: 14,
      totalLoanVolume: 750000.0,
      totalTechFeesGenerated: 7500.0,
      storageUsedMb: 114.5,
      storageQuotaMb: 10240,
      databaseSchema: 'tenant_bayani',
      healthScore: 99,
      lastActiveAt: '2 mins ago',
      createdAt: '2026-01-15T08:00:00Z',
    },
    {
      id: 'tenant_maharlika_002',
      name: 'Maharlika Agrarian Reform Cooperative',
      slug: 'maharlika',
      subdomain: 'maharlika-coop.tuntongtech.com',
      cdaRegistrationNumber: 'CDA-R03-2023-01044',
      tin: '210-994-382-000',
      contactEmail: 'gm@maharlikacoop.ph',
      contactPhone: '+63 920 441 9901',
      adminName: 'Danilo Macapagal',
      billingMode: 'STANDARD_UNIFIED',
      status: 'ACTIVE',
      totalMembers: 12,
      activeMembers: 12,
      freeTierMembers: 12, // 100% within free tier (<= 15)
      billedMembers: 0,
      platformCreditBalance: 350.0, // Low credit alert (< ₱500)
      escrowFloatBalance: 12100.0,
      totalLoansDisbursed: 6,
      totalLoanVolume: 280000.0,
      totalTechFeesGenerated: 2800.0,
      storageUsedMb: 68.2,
      storageQuotaMb: 10240,
      databaseSchema: 'tenant_maharlika',
      healthScore: 84,
      lastActiveAt: '18 mins ago',
      createdAt: '2026-02-01T08:00:00Z',
    },
    {
      id: 'tenant_silangan_003',
      name: 'Silangan Community Credit Cooperative',
      slug: 'silangan',
      subdomain: 'silangan-coop.tuntongtech.com',
      cdaRegistrationNumber: 'CDA-R04A-2022-00412',
      tin: '118-204-559-000',
      contactEmail: 'manager@silangancoop.org',
      contactPhone: '+63 918 332 1092',
      adminName: 'Corazon Aquino-Santos',
      billingMode: 'STANDARD_UNIFIED',
      status: 'ACTIVE',
      totalMembers: 42,
      activeMembers: 39,
      freeTierMembers: 15,
      billedMembers: 27, // 27 members > 15 = ₱1,350 billed
      platformCreditBalance: 8900.0,
      escrowFloatBalance: 26500.0,
      totalLoansDisbursed: 31,
      totalLoanVolume: 1650000.0,
      totalTechFeesGenerated: 16500.0,
      storageUsedMb: 245.0,
      storageQuotaMb: 10240,
      databaseSchema: 'tenant_silangan',
      healthScore: 97,
      lastActiveAt: 'Just now',
      createdAt: '2026-03-10T08:00:00Z',
    },
  ]);

  // Transaction History State
  const [creditTransactions, setCreditTransactions] = useState<CreditTx[]>([
    {
      id: 'ctx_001',
      tenantId: 'tenant_bayani_001',
      tenantName: 'Bayani Multi-Purpose Cooperative',
      type: 'TOP_UP',
      amount: 5000,
      balanceBefore: 0,
      balanceAfter: 5000,
      reference: 'BDO-DEP-2026-08129',
      notes: 'Initial prepaid technology credit bundle',
      performedBy: 'Lex (Platform Operator)',
      createdAt: 'Oct 01, 2026 09:30 AM',
    },
    {
      id: 'ctx_002',
      tenantId: 'tenant_bayani_001',
      tenantName: 'Bayani Multi-Purpose Cooperative',
      type: 'FEE_DEDUCTION',
      amount: -150,
      balanceBefore: 5000,
      balanceAfter: 4850,
      reference: 'INV-ONB-0016-0018',
      notes: 'Auto-debit 3 onboarding fees after 15 free members (₱50 x 3)',
      performedBy: 'System Auto-Billing',
      createdAt: 'Oct 08, 2026 14:15 PM',
    },
    {
      id: 'ctx_003',
      tenantId: 'tenant_silangan_003',
      tenantName: 'Silangan Community Credit Cooperative',
      type: 'TOP_UP',
      amount: 10000,
      balanceBefore: 250,
      balanceAfter: 10250,
      reference: 'UB-WIRE-99214',
      notes: 'Quarterly platform credit package refill',
      performedBy: 'Lex (Platform Operator)',
      createdAt: 'Oct 10, 2026 11:20 AM',
    },
  ]);

  // Broadcasts State
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([
    {
      id: 'bc_1',
      title: 'Scheduled Cloud Infrastructure Maintenance',
      message: 'Routine PostgreSQL indexing scheduled for Sunday, Oct 18, 2026, 02:00 AM - 03:00 AM PHT. Subdomains will experience brief intermittent read latency.',
      severity: 'INFO',
      isActive: true,
      createdAt: 'Oct 11, 2026',
    },
  ]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals State
  const [selectedTenantForCredit, setSelectedTenantForCredit] = useState<TenantFleetItem | null>(null);
  const [creditAdjustmentAmount, setCreditAdjustmentAmount] = useState<number>(2000);
  const [creditAdjustmentType, setCreditAdjustmentType] = useState<'TOP_UP' | 'FEE_DEDUCTION' | 'PROMO_GRANT' | 'ADJUSTMENT'>('TOP_UP');
  const [creditAdjustmentRef, setCreditAdjustmentRef] = useState<string>('');
  const [creditAdjustmentNotes, setCreditAdjustmentNotes] = useState<string>('');

  const [selectedTenantForStatus, setSelectedTenantForStatus] = useState<TenantFleetItem | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState<string>('');

  const [showNewBroadcastModal, setShowNewBroadcastModal] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');

  // Calculations across fleet
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === 'ACTIVE').length;
  const totalFleetMembers = tenants.reduce((s, t) => s + t.totalMembers, 0);
  const totalFreeTierMembers = tenants.reduce((s, t) => s + t.freeTierMembers, 0);
  const totalBilledMembers = tenants.reduce((s, t) => s + t.billedMembers, 0);
  const totalEscrowFloat = tenants.reduce((s, t) => s + t.escrowFloatBalance, 0);
  const totalCreditPool = tenants.reduce((s, t) => s + t.platformCreditBalance, 0);
  const totalLoanVolume = tenants.reduce((s, t) => s + t.totalLoanVolume, 0);
  const grossTechFees = totalLoanVolume * 0.01 + totalBilledMembers * 50;
  const netTechRevenue = Math.round((grossTechFees / 1.12) * 100) / 100;
  const outputVatDue = Math.round((grossTechFees - netTechRevenue) * 100) / 100;
  const totalStorageMb = tenants.reduce((s, t) => s + t.storageUsedMb, 0);
  const lowCreditTenantsCount = tenants.filter((t) => t.platformCreditBalance < 500).length;

  // Filtered List
  const filteredTenants = tenants.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q) ||
      t.cdaRegistrationNumber.toLowerCase().includes(q);

    if (statusFilter === 'LOW_CREDIT') {
      return matchesSearch && t.platformCreditBalance < 500;
    }
    if (statusFilter !== 'ALL') {
      return matchesSearch && t.status === statusFilter;
    }
    return matchesSearch;
  });

  // Handlers
  const handleExecuteCreditAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForCredit) return;

    const delta = creditAdjustmentType === 'FEE_DEDUCTION' ? -Math.abs(creditAdjustmentAmount) : Math.abs(creditAdjustmentAmount);
    const balanceBefore = selectedTenantForCredit.platformCreditBalance;
    const balanceAfter = Math.max(0, balanceBefore + delta);

    // Update in tenant list
    setTenants((prev) =>
      prev.map((t) => (t.id === selectedTenantForCredit.id ? { ...t, platformCreditBalance: balanceAfter } : t))
    );

    // Add transaction audit record
    const newTx: CreditTx = {
      id: `ctx_${Date.now()}`,
      tenantId: selectedTenantForCredit.id,
      tenantName: selectedTenantForCredit.name,
      type: creditAdjustmentType,
      amount: delta,
      balanceBefore,
      balanceAfter,
      reference: creditAdjustmentRef || `ADJ-${Date.now().toString().slice(-6)}`,
      notes: creditAdjustmentNotes || 'Manual operator credit adjustment',
      performedBy: 'Lex (Platform Operator)',
      createdAt: 'Just now',
    };
    setCreditTransactions((prev) => [newTx, ...prev]);

    setSelectedTenantForCredit(null);
    setCreditAdjustmentRef('');
    setCreditAdjustmentNotes('');
  };

  const handleToggleTenantStatus = (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!selectedTenantForStatus) return;

    setTenants((prev) =>
      prev.map((t) => (t.id === selectedTenantForStatus.id ? { ...t, status: newStatus } : t))
    );
    setSelectedTenantForStatus(null);
    setStatusChangeReason('');
  };

  const handleCreateBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    const newBroadcast: BroadcastItem = {
      id: `bc_${Date.now()}`,
      title: broadcastTitle,
      message: broadcastMessage,
      severity: broadcastSeverity,
      isActive: true,
      createdAt: 'Just now',
    };

    setBroadcasts((prev) => [newBroadcast, ...prev]);
    setShowNewBroadcastModal(false);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. TOP OPERATOR CONTROL BAR */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/10">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-white tracking-tight">
                Tuntong Tech Solution
              </h1>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider font-bold">
                Operator Control Plane
              </span>
            </div>
            <p className="text-xs text-slate-400">
              SaaS Multi-Tenant Fleet Monitor & Infrastructure Governance
            </p>
          </div>
        </div>

        {/* Right Operator Controls & Navigation */}
        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-[11px]">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Multi-Tenant Fleet: <strong>{activeTenants} / {totalTenants} Live</strong></span>
          </div>

          <Link
            href="/"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <span>Tenant Admin View</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href="/coop-register"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Provision New Coop</span>
          </Link>
        </div>
      </header>

      {/* 2. MAIN OPERATOR BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Active System Broadcast Banner if present */}
        {broadcasts.length > 0 && broadcasts[0].isActive && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 shadow-lg ${
            broadcasts[0].severity === 'CRITICAL'
              ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
              : broadcasts[0].severity === 'WARNING'
              ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
              : 'bg-indigo-950/40 border-indigo-600/50 text-indigo-200'
          }`}>
            <Megaphone className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" />
            <div className="flex-1 text-xs space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span>[Active Broadcast] {broadcasts[0].title}</span>
                <span className="text-[10px] font-mono opacity-70">({broadcasts[0].createdAt})</span>
              </div>
              <p className="leading-relaxed opacity-90">{broadcasts[0].message}</p>
            </div>
            <button
              onClick={() => setBroadcasts((prev) => prev.map((b) => ({ ...b, isActive: false })))}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Dismiss Broadcast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 3. EXECUTIVE KPI CARDS: FLEET REVENUE, ESCROW & STORAGE */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Tenants & Health */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Active Tenants Fleet</span>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-white">{totalTenants}</div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">100% Online</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{activeTenants} Active • 0 Suspended</span>
            </div>
          </div>

          {/* Card 2: Fleet Member Census & Free Tier */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Total Member Census</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-white">{totalFleetMembers.toLocaleString()}</div>
              <span className="text-[11px] font-mono text-slate-400">across fleet</span>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span className="text-emerald-400">{totalFreeTierMembers} Free Tier ($\le$15)</span>
              <span className="text-indigo-400 font-bold">{totalBilledMembers} Billed (&gt;15)</span>
            </div>
          </div>

          {/* Card 3: Platform Escrow Float & Credit Pool */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Platform Escrow Float (QR Ph)</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-white font-mono">
                ₱{totalEscrowFloat.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span>Prepaid Credit Pool:</span>
              <span className="font-mono text-emerald-400 font-bold">
                ₱{totalCreditPool.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Card 4: Monthly Platform Tech Fees & Tax */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Platform Revenue & VAT</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-white font-mono">
                ₱{grossTechFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-amber-400 font-bold">Gross</span>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span>Net: ₱{netTechRevenue.toLocaleString()}</span>
              <span className="text-slate-400">12% VAT: ₱{outputVatDue.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* 4. TENANT FLEET DIRECTORY & MANAGEMENT CONSOLE */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          {/* Section Header & Search/Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Cooperative Tenant Fleet Instances</span>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {filteredTenants.length} instances
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live monitoring of cooperative subdomains, member counts, credit balances, and platform float
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search coop, slug, CDA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUSPENDED">Suspended Only</option>
                <option value="LOW_CREDIT">Low Credit (&lt; ₱500)</option>
              </select>

              <button
                type="button"
                onClick={() => setShowNewBroadcastModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Megaphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>Broadcast</span>
              </button>
            </div>
          </div>

          {/* Fleet Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Tenant / Subdomain</th>
                  <th className="py-3 px-3">Members (Census)</th>
                  <th className="py-3 px-3">Available Credit</th>
                  <th className="py-3 px-3">Escrow Float</th>
                  <th className="py-3 px-3">Storage (5MB Cap)</th>
                  <th className="py-3 px-3">Instance Status</th>
                  <th className="py-3 px-3 text-right">Operator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Column 1: Tenant Identity */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>https://{t.subdomain}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {t.cdaRegistrationNumber} • GM: {t.adminName}
                      </div>
                    </td>

                    {/* Column 2: Member Census */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{t.totalMembers} Members</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {t.totalMembers <= 15 ? (
                          <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                            Free Tier ({t.totalMembers}/15)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold">
                            Billed: +{t.billedMembers} @ ₱50
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {t.activeMembers} approved active
                      </div>
                    </td>

                    {/* Column 3: Platform Credit */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-white text-sm">
                        ₱{t.platformCreditBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                      {t.platformCreditBalance < 500 ? (
                        <span className="text-[10px] text-amber-400 bg-amber-950/80 border border-amber-800 px-1.5 py-0.5 rounded inline-flex items-center gap-1 font-bold mt-1">
                          <AlertTriangle className="w-3 h-3" /> Low Credit
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono">Good Standing</span>
                      )}
                    </td>

                    {/* Column 4: Escrow Float */}
                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-emerald-300">
                        ₱{t.escrowFloatBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Held for Coop Float
                      </div>
                    </td>

                    {/* Column 5: Storage (5MB Cap per KYC upload) */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-slate-200">{t.storageUsedMb} MB</span>
                      </div>
                      <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, (t.storageUsedMb / t.storageQuotaMb) * 100 * 20)}%` }}
                        ></div>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Quota: 10 GB
                      </div>
                    </td>

                    {/* Column 6: Status */}
                    <td className="py-3.5 px-3">
                      {t.status === 'ACTIVE' ? (
                        <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="text-[10px] bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 w-max">
                          <AlertCircle className="w-3 h-3" /> SUSPENDED
                        </span>
                      )}
                      <div className="text-[10px] text-slate-500 mt-1">
                        Health: {t.healthScore}/100
                      </div>
                    </td>

                    {/* Column 7: Actions */}
                    <td className="py-3.5 px-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTenantForCredit(t);
                          setCreditAdjustmentAmount(2000);
                          setCreditAdjustmentType('TOP_UP');
                        }}
                        className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        title="Top-Up or Adjust Platform Credit"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Credit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTenantForStatus(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border inline-flex items-center gap-1 transition-colors ${
                          t.status === 'ACTIVE'
                            ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
                            : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                        }`}
                        title="Instance Kill-Switch / Lifecycle"
                      >
                        <Lock className="w-3 h-3" />
                        <span>{t.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. PLATFORM CREDIT AUDIT LEDGER */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Recent Platform Credit Ledger & Refill Audit</h3>
            </div>
            <span className="text-xs text-slate-400">Strict double-entry prepaid credit log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Tenant</th>
                  <th className="py-2.5 px-3">Action Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">New Balance</th>
                  <th className="py-2.5 px-3">Reference / Notes</th>
                  <th className="py-2.5 px-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {creditTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/20">
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{tx.createdAt}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{tx.tenantName}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        tx.amount > 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {tx.amount > 0 ? '+' : ''}₱{Math.abs(tx.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-200">
                      ₱{tx.balanceAfter.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      <div>{tx.reference}</div>
                      <div className="text-[10px] text-slate-500 italic">{tx.notes}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{tx.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* MODAL 1: PLATFORM CREDIT TOP-UP & ADJUSTMENT */}
      {selectedTenantForCredit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Adjust Platform Credit</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenantForCredit(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Target Tenant:</div>
              <div className="text-white font-bold text-sm">{selectedTenantForCredit.name}</div>
              <div className="text-slate-500 font-mono text-[11px]">https://{selectedTenantForCredit.subdomain}</div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-slate-300">
                <span>Current Balance:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₱{selectedTenantForCredit.platformCreditBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecuteCreditAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Transaction Action *</label>
                <select
                  value={creditAdjustmentType}
                  onChange={(e) => setCreditAdjustmentType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TOP_UP">TOP_UP (Prepaid Credit Add)</option>
                  <option value="PROMO_GRANT">PROMO_GRANT (Promotional Credit)</option>
                  <option value="FEE_DEDUCTION">FEE_DEDUCTION (Manual Fee Debit)</option>
                  <option value="ADJUSTMENT">ADJUSTMENT (Balance Reconciliation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Amount (₱) *</label>
                <input
                  type="number"
                  min={1}
                  step={50}
                  value={creditAdjustmentAmount}
                  onChange={(e) => setCreditAdjustmentAmount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment / Document Reference *</label>
                <input
                  type="text"
                  placeholder="e.g. BDO-DEP-2026-901 or OR# 10294"
                  value={creditAdjustmentRef}
                  onChange={(e) => setCreditAdjustmentRef(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Audit Notes / Particulars</label>
                <input
                  type="text"
                  placeholder="e.g. Coop paid via bank transfer to Tuntong Tech Solution"
                  value={creditAdjustmentNotes}
                  onChange={(e) => setCreditAdjustmentNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Balance Preview */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex justify-between items-center text-xs">
                <span className="text-slate-300">New Estimated Balance:</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  ₱{(creditAdjustmentType === 'FEE_DEDUCTION'
                    ? Math.max(0, selectedTenantForCredit.platformCreditBalance - creditAdjustmentAmount)
                    : selectedTenantForCredit.platformCreditBalance + creditAdjustmentAmount
                  ).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForCredit(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/30"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Credit Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TENANT KILL-SWITCH / STATUS TOGGLE */}
      {selectedTenantForStatus && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Instance Lifecycle Control</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenantForStatus(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Target Tenant:</div>
              <div className="text-white font-bold">{selectedTenantForStatus.name}</div>
              <div className="text-slate-500 font-mono text-[11px]">https://{selectedTenantForStatus.subdomain}</div>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold text-emerald-400">{selectedTenantForStatus.status}</span>
              </div>
            </div>

            {selectedTenantForStatus.status === 'ACTIVE' ? (
              <div className="space-y-4">
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-200 space-y-1">
                  <div className="font-bold text-rose-300">Warning: Suspending Tenant Instance</div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Suspending this cooperative will temporarily block all portal logins, member transactions, and disbursements. All database records remain safely preserved.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Suspension Reason *</label>
                  <input
                    type="text"
                    placeholder="e.g. Overdue platform fees or compliance audit review"
                    value={statusChangeReason}
                    onChange={(e) => setStatusChangeReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedTenantForStatus(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTenantStatus('SUSPENDED')}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-700/30"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirm Emergency Suspension</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-xs text-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-300">Reactivate Tenant Instance</div>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Reactivating will restore normal portal access, loan applications, and cashier transactions immediately for all members and officers.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedTenantForStatus(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleTenantStatus('ACTIVE')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/30"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reactivate Cooperative Instance</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: BROADCAST ANNOUNCEMENT CREATION */}
      {showNewBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">New System Broadcast</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewBroadcastModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Broadcast Severity *</label>
                <select
                  value={broadcastSeverity}
                  onChange={(e) => setBroadcastSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="INFO">Informational (Blue)</option>
                  <option value="WARNING">Maintenance / Warning (Amber)</option>
                  <option value="CRITICAL">Critical Alert (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Network Upgrade"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Announcement Message *</label>
                <textarea
                  rows={3}
                  placeholder="Details of the announcement displayed to all cooperative admins..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewBroadcastModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-700/30"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Publish to All Tenancies</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 p-4 text-center text-xs text-slate-500">
        © 2026 Tuntong Tech Solution • SaaS Operator Control Plane • Regulated under CDA & PSA Guidelines
      </footer>
    </div>
  );
}
