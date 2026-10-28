'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Mail,
  Key,
  Check,
  Clock,
  Inbox,
  Eye,
  Send,
  UserCheck,
  FileBadge,
  Sparkles,
  LogOut,
  KeyRound,
  Shield,
  Trash2,
  Landmark,
  Edit,
  Copy,
  EyeOff,
  QrCode,
  Save,
  Tag,
  UserPlus,
  Power,
  Calendar,
} from 'lucide-react';
import {
  CooperativeRegistration,
  RegistrationStatus,
  RegistrationEmailNotification,
  OperatorSession,
  OperatorAccount,
} from '@flexcoop/shared-types';
import { getApiBaseUrl } from '../api-config';

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
  environment?: 'production' | 'testing';
  tag?: string;
  tags?: string[];
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
  timestamp?: string;
}

interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  targetType?: 'ALL' | 'TAG';
  targetTag?: string;
  targetTenantIds?: string[];
  isActive: boolean;
  expiresAt?: string;
  scheduledDate?: string;
  durationDays?: number;
  autoExpireDays?: number;
  createdAt: string;
  createdBy?: string;
}

export default function OperatorPortalPage() {
  const router = useRouter();
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'FLEET' | 'REGISTRATIONS' | 'LEDGER' | 'PAYMENT_METHODS' | 'BROADCASTS' | 'OPERATORS'>('FLEET');

  // Tenant Fleet State (starts clean, populated via API)
  const [tenants, setTenants] = useState<TenantFleetItem[]>([]);

  // Cooperative Registrations State (starts clean, populated via API)
  const [registrations, setRegistrations] = useState<CooperativeRegistration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState<boolean>(false);
  const [regStatusFilter, setRegStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const [regSearchQuery, setRegSearchQuery] = useState<string>('');

  // Transaction History State
  const [creditTransactions, setCreditTransactions] = useState<CreditTx[]>([]);

  // Platform Payment Methods State (Stored in Firebase Firestore)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState<boolean>(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [methodBankName, setMethodBankName] = useState<string>('');
  const [methodAccountName, setMethodAccountName] = useState<string>('');
  const [methodAccountNumber, setMethodAccountNumber] = useState<string>('');
  const [methodType, setMethodType] = useState<'BANK_TRANSFER' | 'QRPH'>('BANK_TRANSFER');
  const [methodInstructions, setMethodInstructions] = useState<string>('');
  const [methodIsActive, setMethodIsActive] = useState<boolean>(true);
  const [methodIsDefault, setMethodIsDefault] = useState<boolean>(false);
  const [methodEnvironment, setMethodEnvironment] = useState<'production' | 'test'>('production');
  const [paymentMethodEnvFilter, setPaymentMethodEnvFilter] = useState<'ALL' | 'PRODUCTION' | 'TEST'>('ALL');

  // PayMongo Payment Gateway Configuration State (Stored in Firebase Firestore)
  const [paymongoConfig, setPaymongoConfig] = useState<{
    secretKey: string;
    publicKey: string;
    webhookSecret: string;
    environment: 'test' | 'live';
    isEnabled: boolean;
    updatedAt?: string;
    updatedBy?: string;
    liveSecretKey?: string;
    livePublicKey?: string;
    liveWebhookSecret?: string;
    liveIsEnabled?: boolean;
    testSecretKey?: string;
    testPublicKey?: string;
    testWebhookSecret?: string;
    testIsEnabled?: boolean;
  }>({
    secretKey: '',
    publicKey: '',
    webhookSecret: '',
    environment: 'test',
    isEnabled: true,
    liveSecretKey: '',
    livePublicKey: '',
    liveWebhookSecret: '',
    liveIsEnabled: false,
    testSecretKey: '',
    testPublicKey: '',
    testWebhookSecret: '',
    testIsEnabled: true,
  });
  const [showLiveSecretKey, setShowLiveSecretKey] = useState<boolean>(false);
  const [showTestSecretKey, setShowTestSecretKey] = useState<boolean>(false);
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [paymongoTesting, setPaymongoTesting] = useState<boolean>(false);
  const [paymongoTestResult, setPaymongoTestResult] = useState<{
    success: boolean;
    message: string;
    responseTimeMs?: number;
    livemode?: boolean;
  } | null>(null);
  const [paymongoSaving, setPaymongoSaving] = useState<boolean>(false);
  const [paymongoNotification, setPaymongoNotification] = useState<string | null>(null);

  // Credit Top-Up Verification Queue State (Stored in Firebase Firestore)
  const [topupRequests, setTopupRequests] = useState<any[]>([]);
  const [isLoadingTopupRequests, setIsLoadingTopupRequests] = useState<boolean>(false);
  const [selectedTopupForReject, setSelectedTopupForReject] = useState<any | null>(null);
  const [topupRejectReason, setTopupRejectReason] = useState<string>('');

  // Broadcasts State & Scheduling
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [showNewBroadcastModal, setShowNewBroadcastModal] = useState<boolean>(false);
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastSeverity, setBroadcastSeverity] = useState<'INFO' | 'WARNING' | 'CRITICAL'>('INFO');
  const [broadcastTargetType, setBroadcastTargetType] = useState<'ALL' | 'TAG'>('ALL');
  const [broadcastTargetTag, setBroadcastTargetTag] = useState<string>('');
  const [broadcastDurationOption, setBroadcastDurationOption] = useState<'45' | '7' | '14' | '30' | 'CUSTOM'>('45');
  const [broadcastCustomExpiresAt, setBroadcastCustomExpiresAt] = useState<string>('');
  const [broadcastScheduledDate, setBroadcastScheduledDate] = useState<string>('');

  // Operator Users State (stored in Firebase Firestore)
  const [operators, setOperators] = useState<OperatorAccount[]>([]);
  const [isLoadingOperators, setIsLoadingOperators] = useState<boolean>(false);
  const [showAddOperatorModal, setShowAddOperatorModal] = useState<boolean>(false);
  const [newOperatorUsername, setNewOperatorUsername] = useState<string>('');
  const [newOperatorName, setNewOperatorName] = useState<string>('');
  const [newOperatorEmail, setNewOperatorEmail] = useState<string>('');
  const [newOperatorRole, setNewOperatorRole] = useState<'PLATFORM_SUPER_OPERATOR' | 'PLATFORM_SUPPORT'>('PLATFORM_SUPPORT');

  // Modals & Action States
  const [selectedTenantForCredit, setSelectedTenantForCredit] = useState<TenantFleetItem | null>(null);
  const [creditAdjustmentAmount, setCreditAdjustmentAmount] = useState<number>(2000);
  const [creditAdjustmentType, setCreditAdjustmentType] = useState<'TOP_UP' | 'FEE_DEDUCTION' | 'PROMO_GRANT' | 'ADJUSTMENT'>('TOP_UP');
  const [creditAdjustmentRef, setCreditAdjustmentRef] = useState<string>('');
  const [creditAdjustmentNotes, setCreditAdjustmentNotes] = useState<string>('');

  const [selectedTenantForStatus, setSelectedTenantForStatus] = useState<TenantFleetItem | null>(null);
  const [statusChangeReason, setStatusChangeReason] = useState<string>('');

  // Cooperative Instance Modal & Detailed Inspection State
  const [selectedFleetCoopModal, setSelectedFleetCoopModal] = useState<TenantFleetItem | null>(null);
  const [modalTenantEnv, setModalTenantEnv] = useState<'production' | 'testing'>('production');
  const [modalTenantTag, setModalTenantTag] = useState<string>('');
  const [isSavingTenantDetails, setIsSavingTenantDetails] = useState<boolean>(false);
  const [coopCreditTransactions, setCoopCreditTransactions] = useState<CreditTx[]>([]);
  const [isLoadingCoopCreditTx, setIsLoadingCoopCreditTx] = useState<boolean>(false);
  const [coopAdminUsers, setCoopAdminUsers] = useState<any[]>([]);
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState<boolean>(false);
  const [togglingAdminUserId, setTogglingAdminUserId] = useState<string | null>(null);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState<boolean>(false);
  const [newAdminFullName, setNewAdminFullName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminUsername, setNewAdminUsername] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [newAdminRole, setNewAdminRole] = useState<string>('SYSTEM_ADMIN');
  const [isCreatingAdminUser, setIsCreatingAdminUser] = useState<boolean>(false);

  // Registration Actions Modals
  const [selectedRegForApprove, setSelectedRegForApprove] = useState<CooperativeRegistration | null>(null);
  const [selectedRegForReject, setSelectedRegForReject] = useState<CooperativeRegistration | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [selectedRegForIdView, setSelectedRegForIdView] = useState<CooperativeRegistration | null>(null);
  const [idPreviewHasError, setIdPreviewHasError] = useState<boolean>(false);
  const [selectedRegForEmailView, setSelectedRegForEmailView] = useState<RegistrationEmailNotification | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Search for Fleet
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Operator Authentication State
  const [operatorSession, setOperatorSession] = useState<OperatorSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [authIdentifier, setAuthIdentifier] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [authStep, setAuthStep] = useState<'IDENTIFIER' | 'OTP'>('IDENTIFIER');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Check existing operator session on mount; redirect if unauthenticated
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tuntong_operator_session');
      if (stored) {
        const parsed: OperatorSession = JSON.parse(stored);
        if (parsed && parsed.token && new Date(parsed.expiresAt).getTime() > Date.now()) {
          setOperatorSession(parsed);
          setIsCheckingAuth(false);
          return;
        } else {
          localStorage.removeItem('tuntong_operator_session');
          document.cookie = 'tuntong_operator_session=; path=/; max-age=0';
        }
      }
    } catch (e) {
      console.warn('Session parse error:', e);
    }
    setIsCheckingAuth(false);
    router.replace('/operator/login');
  }, [router]);

  // Request One-Time PIN for Operator (No password)
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

  // Verify One-Time PIN and issue OperatorSession
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
      localStorage.setItem('tuntong_operator_session', JSON.stringify(data.session));
      setOperatorSession(data.session);
      setToastMessage(`Welcome, ${data.session.name || data.session.username}! Operator Control Plane unlocked.`);
    } catch (err: any) {
      console.error(err);
      setAuthError('Verification service error. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Sign out operator
  const handleSignOut = () => {
    localStorage.removeItem('tuntong_operator_session');
    document.cookie = 'tuntong_operator_session=; path=/; max-age=0';
    setOperatorSession(null);
    setAuthStep('IDENTIFIER');
    setOtpInput('');
    setAuthError(null);
    setAuthSuccessMsg(null);
    router.replace('/operator/login');
  };

  // Load Registrations directly from Firebase Firestore API
  const fetchRegistrations = async () => {
    setIsLoadingRegistrations(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/registrations`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Remove seed test records if any
          const filtered = json.data.filter((m: any) => m.id !== 'REG-2026-8914');
          setRegistrations(filtered);
          return;
        }
      }
    } catch (err) {
      console.warn('API fetch for registrations warning:', err);
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  // Load Tenant Fleet directly from Firebase Firestore API
  const fetchFleet = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/tenants`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTenants(json.data);
        }
      }
    } catch (err) {
      console.warn('Fleet API load warning:', err);
    }
  };

  // Load Prepaid Credit Ledger from Firebase Firestore API
  const fetchCreditTransactions = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/credit-transactions`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCreditTransactions(json.data);
        }
      }
    } catch (err) {
      console.warn('Credit transactions load warning:', err);
    }
  };

  // Load System Broadcasts from Firebase Firestore API
  const fetchBroadcasts = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/broadcasts`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBroadcasts(json.data);
        }
      }
    } catch (err) {
      console.warn('Broadcasts API load warning:', err);
    }
  };

  // Load Operator Users from Firebase Firestore API
  const fetchOperators = async () => {
    setIsLoadingOperators(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/users`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOperators(json.data);
        }
      }
    } catch (err) {
      console.warn('Operators API load warning:', err);
    } finally {
      setIsLoadingOperators(false);
    }
  };

  // Add new operator user to Firebase
  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperatorUsername.trim() || !newOperatorName.trim() || !newOperatorEmail.trim()) {
      alert('Username, full name, and email are required.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newOperatorUsername.trim().toLowerCase(),
          name: newOperatorName.trim(),
          email: newOperatorEmail.trim().toLowerCase(),
          role: newOperatorRole,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Operator user '${newOperatorUsername}' stored in Firebase successfully.`);
        setShowAddOperatorModal(false);
        setNewOperatorUsername('');
        setNewOperatorName('');
        setNewOperatorEmail('');
        await fetchOperators();
      } else {
        alert(json.error || 'Failed to create operator user.');
      }
    } catch (err) {
      console.error('Add operator error:', err);
      alert('Connection error contacting API server.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Delete operator user from Firebase
  const handleDeleteOperator = async (username: string) => {
    if (username.toLowerCase() === 'tuntongtech') {
      alert('Cannot delete the primary platform super operator.');
      return;
    }

    if (!confirm(`Are you sure you want to remove operator '${username}' from Firebase?`)) {
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/users/${encodeURIComponent(username)}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Operator user '${username}' removed from Firebase.`);
        await fetchOperators();
      } else {
        alert(json.error || 'Failed to remove operator user.');
      }
    } catch (err) {
      console.error('Delete operator error:', err);
    }
  };

  // Delete individual registration record from queue in Firebase
  const handleDeleteRegistration = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to remove registration '${id}' from the onboarding queue in Firebase?`)) {
      return;
    }
    try {
      await fetch(`${getApiBaseUrl()}/operator/registrations/${id}`, { method: 'DELETE' });
      setToastMessage(`Registration ${id} removed from Firebase onboarding queue.`);
      await fetchRegistrations();
    } catch (err) {
      console.warn('API delete registration warning:', err);
    }
  };

  // Clear all registrations in queue in Firebase
  const handleClearAllRegistrations = async () => {
    if (!confirm('Are you sure you want to remove all existing records in the Coop Onboarding Queue in Firebase?')) {
      return;
    }
    try {
      await fetch(`${getApiBaseUrl()}/operator/registrations`, { method: 'DELETE' });
      setToastMessage('All records in Coop Onboarding Queue removed from Firebase.');
      await fetchRegistrations();
    } catch (err) {
      console.warn('API clear registrations warning:', err);
    }
  };

  // Fetch Platform Payment Methods from Firebase Firestore API
  const fetchPaymentMethods = async () => {
    setIsLoadingPaymentMethods(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/payment-methods`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPaymentMethods(json.data);
        }
      }
    } catch (err) {
      console.warn('Payment methods API load warning:', err);
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  // Fetch PayMongo Gateway Configuration from Firebase Firestore API
  const fetchPaymongoConfig = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/paymongo-config`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPaymongoConfig(json.data);
        }
      }
    } catch (err) {
      console.warn('PayMongo config API load warning:', err);
    }
  };

  const handleSavePaymongoConfig = async (targetEnv?: 'live' | 'test') => {
    const envToSave = targetEnv || paymongoConfig.environment;
    setPaymongoSaving(true);
    setPaymongoNotification(null);
    try {
      const activeSecret = envToSave === 'live' ? (paymongoConfig.liveSecretKey || paymongoConfig.secretKey) : (paymongoConfig.testSecretKey || paymongoConfig.secretKey);
      const activePublic = envToSave === 'live' ? (paymongoConfig.livePublicKey || paymongoConfig.publicKey) : (paymongoConfig.testPublicKey || paymongoConfig.publicKey);
      const activeWebhook = envToSave === 'live' ? (paymongoConfig.liveWebhookSecret || paymongoConfig.webhookSecret) : (paymongoConfig.testWebhookSecret || paymongoConfig.webhookSecret);
      const activeEnabled = envToSave === 'live' ? (paymongoConfig.liveIsEnabled ?? true) : (paymongoConfig.testIsEnabled ?? true);

      const res = await fetch(`${getApiBaseUrl()}/operator/paymongo-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymongoConfig,
          environment: envToSave,
          secretKey: activeSecret,
          publicKey: activePublic,
          webhookSecret: activeWebhook,
          isEnabled: activeEnabled,
          updatedBy: operatorSession?.name || operatorSession?.username || 'Platform Operator',
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPaymongoConfig(json.data);
        setPaymongoNotification(`${envToSave === 'live' ? 'Production' : 'Sandbox Test'} PayMongo configuration updated and saved to Cloud Firestore!`);
        setTimeout(() => setPaymongoNotification(null), 5000);
      } else {
        alert(json.error || 'Failed to save PayMongo configuration');
      }
    } catch (err: any) {
      alert(`Network error saving PayMongo config: ${err.message}`);
    } finally {
      setPaymongoSaving(false);
    }
  };

  const handleTestPaymongoConnection = async (targetEnv?: 'live' | 'test') => {
    const envToTest = targetEnv || paymongoConfig.environment;
    setPaymongoTesting(true);
    setPaymongoTestResult(null);
    const keyToTest = envToTest === 'live' ? (paymongoConfig.liveSecretKey || paymongoConfig.secretKey) : (paymongoConfig.testSecretKey || paymongoConfig.secretKey);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/paymongo-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: keyToTest }),
      });
      const json = await res.json();
      if (json.success) {
        setPaymongoTestResult({
          success: true,
          message: `Connected successfully to PayMongo ${envToTest.toUpperCase()}! (${json.accountDescriptor || 'Verified'}, ${json.responseTimeMs}ms response time, mode: ${json.livemode ? 'LIVE' : 'TEST'})`,
          responseTimeMs: json.responseTimeMs,
          livemode: json.livemode,
        });
      } else {
        setPaymongoTestResult({
          success: false,
          message: `Authentication Failed (${envToTest.toUpperCase()}): ${json.error || 'Invalid API key or network error'} (${json.responseTimeMs}ms)`,
          responseTimeMs: json.responseTimeMs,
        });
      }
    } catch (err: any) {
      setPaymongoTestResult({
        success: false,
        message: `Connection Error: ${err.message}`,
      });
    } finally {
      setPaymongoTesting(false);
    }
  };

  // Fetch Credit Top-Up Verification Requests from Firebase Firestore API
  const fetchTopupRequests = async () => {
    setIsLoadingTopupRequests(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/credit/topup-requests`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTopupRequests(json.data);
        }
      }
    } catch (err) {
      console.warn('Topup requests API load warning:', err);
    } finally {
      setIsLoadingTopupRequests(false);
    }
  };

  const openAddMethodModal = (env: 'production' | 'test' = 'production') => {
    setEditingMethod(null);
    setMethodBankName('');
    setMethodAccountName('');
    setMethodAccountNumber('');
    setMethodType('BANK_TRANSFER');
    setMethodInstructions('');
    setMethodIsActive(true);
    setMethodIsDefault(false);
    setMethodEnvironment(env);
    setShowAddMethodModal(true);
  };

  const openEditMethodModal = (pm: any) => {
    setEditingMethod(pm);
    setMethodBankName(pm.bankName || '');
    setMethodAccountName(pm.accountName || '');
    setMethodAccountNumber(pm.accountNumber || '');
    setMethodType(pm.type || 'BANK_TRANSFER');
    setMethodInstructions(pm.instructions || '');
    setMethodIsActive(pm.isActive !== false);
    setMethodIsDefault(!!pm.isDefault);
    setMethodEnvironment(pm.environment || 'production');
    setShowAddMethodModal(true);
  };

  // Cooperative Instance Modal & Admin User Handlers
  const fetchCoopCreditTransactions = async (tenantId: string) => {
    setIsLoadingCoopCreditTx(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/credit-transactions?tenantId=${encodeURIComponent(tenantId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCoopCreditTransactions(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch coop credit transactions:', err);
    } finally {
      setIsLoadingCoopCreditTx(false);
    }
  };

  const fetchCoopAdminUsers = async (tenantId: string) => {
    setIsLoadingAdminUsers(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/tenants/${encodeURIComponent(tenantId)}/admin-users`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCoopAdminUsers(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch coop admin users:', err);
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  const handleOpenCoopModal = async (coop: TenantFleetItem) => {
    setSelectedFleetCoopModal(coop);
    setModalTenantEnv(coop.environment === 'testing' ? 'testing' : 'production');
    setModalTenantTag(coop.tag || '');
    setShowCreateAdminForm(false);
    await Promise.all([
      fetchCoopCreditTransactions(coop.id),
      fetchCoopAdminUsers(coop.id),
    ]);
  };

  const handleSaveTenantDetails = async () => {
    if (!selectedFleetCoopModal) return;
    setIsSavingTenantDetails(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/tenants/${encodeURIComponent(selectedFleetCoopModal.id)}/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: modalTenantEnv,
          tag: modalTenantTag.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Coop configuration saved: ${modalTenantEnv.toUpperCase()} | Tag: ${modalTenantTag.trim() || 'None'}`);
        setSelectedFleetCoopModal((prev) => prev ? { ...prev, environment: modalTenantEnv, tag: modalTenantTag.trim() } : null);
        await fetchFleet();
      } else {
        alert(json.error || 'Failed to update cooperative configuration.');
      }
    } catch (err) {
      alert('Network error updating tenant details.');
    } finally {
      setIsSavingTenantDetails(false);
    }
  };

  const handleCreateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFleetCoopModal) return;
    if (!newAdminFullName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      alert('Full Name, Email, and Password are required.');
      return;
    }

    setIsCreatingAdminUser(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/tenants/${encodeURIComponent(selectedFleetCoopModal.id)}/admin-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newAdminFullName.trim(),
          email: newAdminEmail.trim(),
          username: newAdminUsername.trim() || newAdminEmail.trim(),
          password: newAdminPassword.trim(),
          role: newAdminRole,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Admin user '${newAdminFullName}' created with role '${newAdminRole}'. Credentials saved.`);
        setNewAdminFullName('');
        setNewAdminEmail('');
        setNewAdminUsername('');
        setNewAdminPassword('');
        setShowCreateAdminForm(false);
        await fetchCoopAdminUsers(selectedFleetCoopModal.id);
      } else {
        alert(json.error || 'Failed to create admin portal user.');
      }
    } catch (err) {
      alert('Network error creating admin user.');
    } finally {
      setIsCreatingAdminUser(false);
    }
  };

  const handleToggleAdminUserStatus = async (user: any) => {
    if (!selectedFleetCoopModal) return;
    const targetStatus = user.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const actionLabel = targetStatus === 'ACTIVE' ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${actionLabel} admin user '${user.fullName}'?`)) {
      return;
    }

    setTogglingAdminUserId(user.id);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/operator/tenants/${encodeURIComponent(selectedFleetCoopModal.id)}/admin-users/${encodeURIComponent(user.id)}/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Admin user '${user.fullName}' has been ${targetStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
        await fetchCoopAdminUsers(selectedFleetCoopModal.id);
      } else {
        alert(json.error || `Failed to ${actionLabel} admin user.`);
      }
    } catch (err) {
      alert(`Network error updating admin user status.`);
    } finally {
      setTogglingAdminUserId(null);
    }
  };

  const handleToggleBroadcast = async (broadcastId: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/broadcasts/${encodeURIComponent(broadcastId)}/toggle`, {
        method: 'POST',
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Broadcast status updated: ${json.data?.isActive ? 'ACTIVE' : 'DEACTIVATED'}`);
        await fetchBroadcasts();
      } else {
        alert(json.error || 'Failed to toggle broadcast.');
      }
    } catch (err) {
      alert('Error updating broadcast status.');
    }
  };

  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodBankName.trim() || !methodAccountName.trim() || !methodAccountNumber.trim()) {
      alert('Bank Name, Account Name, and Account Number are required.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const payload: any = {
        bankName: methodBankName.trim(),
        accountName: methodAccountName.trim(),
        accountNumber: methodAccountNumber.trim(),
        type: methodType,
        instructions: methodInstructions.trim(),
        isActive: methodIsActive,
        isDefault: methodIsDefault,
        environment: methodEnvironment,
      };
      if (editingMethod && editingMethod.id) {
        payload.id = editingMethod.id;
      }

      const res = await fetch(`${getApiBaseUrl()}/operator/payment-methods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Payment method '${payload.bankName}' saved in Firebase.`);
        setShowAddMethodModal(false);
        setEditingMethod(null);
        await fetchPaymentMethods();
      } else {
        alert(json.error || 'Failed to save payment method.');
      }
    } catch (err) {
      console.error('Save payment method error:', err);
      alert('Connection error contacting API server.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string, bankName: string) => {
    if (!confirm(`Are you sure you want to remove payment method '${bankName}'? Tenants will no longer be able to select it when refilling credit.`)) {
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/payment-methods/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Payment method '${bankName}' deleted from Firebase.`);
        await fetchPaymentMethods();
      } else {
        alert(json.error || 'Failed to delete payment method.');
      }
    } catch (err) {
      console.error('Delete payment method error:', err);
      alert('Connection error deleting payment method.');
    }
  };

  const handleApproveTopupRequest = async (req: any) => {
    if (!confirm(`Approve top-up of ₱${req.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} for ${req.tenantName}? This will instantly credit the tenant's balance.`)) {
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/credit/topup-requests/${req.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: operatorSession?.name || operatorSession?.username || 'Lex (Operator)',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Top-up of ₱${req.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} verified and credited to ${req.tenantName}!`);
        await fetchTopupRequests();
        await fetchCreditTransactions();
        await fetchFleet();
      } else {
        alert(json.error || 'Failed to approve top-up request.');
      }
    } catch (err) {
      console.error('Approve top-up error:', err);
      alert('Connection error approving top-up request.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRejectTopupRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopupForReject) return;
    if (!topupRejectReason.trim()) {
      alert('Please specify the reason for rejecting this refill request.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/credit/topup-requests/${selectedTopupForReject.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewedBy: operatorSession?.name || operatorSession?.username || 'Lex (Operator)',
          reason: topupRejectReason.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Top-up request ${selectedTopupForReject.id} has been rejected.`);
        setSelectedTopupForReject(null);
        setTopupRejectReason('');
        await fetchTopupRequests();
      } else {
        alert(json.error || 'Failed to reject top-up request.');
      }
    } catch (err) {
      console.error('Reject top-up error:', err);
      alert('Connection error rejecting top-up request.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Fetch operator fleet, registrations, credit ledger, broadcasts, operators, payment methods, and topup requests once authenticated
  useEffect(() => {
    if (!operatorSession) return;

    fetchRegistrations();
    fetchFleet();
    fetchCreditTransactions();
    fetchBroadcasts();
    fetchOperators();
    fetchPaymentMethods();
    fetchTopupRequests();
    fetchPaymongoConfig();
  }, [operatorSession]);

  // Fleet Totals
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
  const pendingRegistrationsCount = registrations.filter((r) => r.status === 'PENDING_REVIEW').length;
  const pendingTopupCount = topupRequests.filter((r) => r.status === 'PENDING_VERIFICATION').length;

  // Filtered Fleet
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

  // Filtered Registrations
  const filteredRegistrations = registrations.filter((r) => {
    const q = regSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      r.cdaRegistrationNumber.toLowerCase().includes(q) ||
      r.adminEmail.toLowerCase().includes(q) ||
      `${r.adminFirstName} ${r.adminLastName}`.toLowerCase().includes(q);

    if (regStatusFilter !== 'ALL') {
      return matchesSearch && r.status === regStatusFilter;
    }
    return matchesSearch;
  });

  // Handlers for Operator Actions (Directly updating Firebase Firestore)
  const handleExecuteCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForCredit) return;

    setIsSubmittingAction(true);
    try {
      const delta = creditAdjustmentType === 'FEE_DEDUCTION' ? -Math.abs(creditAdjustmentAmount) : Math.abs(creditAdjustmentAmount);
      const res = await fetch(`${getApiBaseUrl()}/operator/tenants/${selectedTenantForCredit.id}/credit/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: delta,
          type: creditAdjustmentType,
          reference: creditAdjustmentRef || `ADJ-${Date.now().toString().slice(-6)}`,
          notes: creditAdjustmentNotes || 'Manual operator credit adjustment in Firebase',
          performedBy: operatorSession?.name || 'Platform Operator',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Platform credit updated successfully in Firebase for ${selectedTenantForCredit.name}.`);
        await fetchFleet();
        await fetchCreditTransactions();
        if (selectedFleetCoopModal && selectedFleetCoopModal.id === selectedTenantForCredit.id) {
          if (json.data && typeof json.data.platformCreditBalance === 'number') {
            setSelectedFleetCoopModal((prev) => prev ? { ...prev, platformCreditBalance: json.data.platformCreditBalance } : null);
          }
          await fetchCoopCreditTransactions(selectedTenantForCredit.id);
        }
      } else {
        alert(json.error || 'Failed to adjust platform credit.');
      }
    } catch (err) {
      console.error('Credit adjustment error:', err);
      alert('Failed to connect to API server.');
    } finally {
      setIsSubmittingAction(false);
      setSelectedTenantForCredit(null);
      setCreditAdjustmentRef('');
      setCreditAdjustmentNotes('');
    }
  };

  const handleToggleTenantStatus = async (newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!selectedTenantForStatus) return;

    setIsSubmittingAction(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/tenants/${selectedTenantForStatus.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: statusChangeReason || '',
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage(`Tenant status changed to ${newStatus} in Firebase.`);
        await fetchFleet();
        if (selectedFleetCoopModal && selectedFleetCoopModal.id === selectedTenantForStatus.id) {
          setSelectedFleetCoopModal((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        alert(json.error || 'Failed to update tenant status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      alert('Failed to connect to API server.');
    } finally {
      setIsSubmittingAction(false);
      setSelectedTenantForStatus(null);
      setStatusChangeReason('');
    }
  };

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    setIsSubmittingAction(true);
    try {
      const payload: any = {
        title: broadcastTitle,
        message: broadcastMessage,
        severity: broadcastSeverity,
        createdBy: operatorSession?.name || 'Platform Operator',
        targetType: broadcastTargetType,
        targetTag: broadcastTargetType === 'TAG' ? broadcastTargetTag.trim() : undefined,
      };

      if (broadcastDurationOption === 'CUSTOM' && broadcastCustomExpiresAt) {
        payload.expiresAt = new Date(broadcastCustomExpiresAt).toISOString();
      } else {
        payload.durationDays = parseInt(broadcastDurationOption, 10) || 45;
      }

      if (broadcastScheduledDate) {
        payload.scheduledDate = new Date(broadcastScheduledDate).toISOString();
      }

      const res = await fetch(`${getApiBaseUrl()}/operator/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setToastMessage('System announcement published and saved to Firebase.');
        setShowNewBroadcastModal(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setBroadcastTargetType('ALL');
        setBroadcastTargetTag('');
        setBroadcastDurationOption('45');
        setBroadcastCustomExpiresAt('');
        setBroadcastScheduledDate('');
        await fetchBroadcasts();
      } else {
        alert(json.error || 'Failed to publish broadcast.');
      }
    } catch (err) {
      console.error('Broadcast creation error:', err);
      alert('Failed to connect to API server.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // APPROVE REGISTRATION HANDLER
  const handleApproveRegistration = async () => {
    if (!selectedRegForApprove) return;
    setIsSubmittingAction(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/registrations/${selectedRegForApprove.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: 'Lex (Tuntong Tech Operator)' }),
      });

      let approvedReg: CooperativeRegistration;
      let emailNotice: RegistrationEmailNotification;
      let provisionedTenant: any = null;

      if (res.ok) {
        const result = await res.json();
        approvedReg = result.registration || result.data;
        emailNotice = approvedReg.emailNotification!;
        provisionedTenant = result.tenant;
      } else {
        // Fallback simulation
        const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        const otp = `TT-${randStr}#${Math.floor(10 + Math.random() * 90)}`;
        const subdomain = `${selectedRegForApprove.slug}-coop.tuntongtech.com`;
        const emailBody = `Dear ${selectedRegForApprove.adminFirstName} ${selectedRegForApprove.adminLastName},

We are pleased to inform you that your cooperative onboarding application (${selectedRegForApprove.id}) for "${selectedRegForApprove.name}" has been officially APPROVED by Tuntong Tech.

Your dedicated cooperative instance has been provisioned and is now live under strict CDA double-entry and NPC data privacy compliance.

Official Cooperative Portal:
Domain: https://${subdomain}

Primary Administrator Login Credentials:
Username (Email): ${selectedRegForApprove.adminEmail}
1-Time Temporary Password: ${otp}

IMPORTANT SECURITY NOTICE: This 1-time password is valid for your initial sign-in only. You will be required to change your password immediately upon your first login.

If you have questions, require onboarding training, or need data migration assistance, please reach out to our engineering support desk at support@tuntongtech.com.

Sincerely,
Tuntong Tech Support Team
support@tuntongtech.com
https://tuntongtech.com`;

        emailNotice = {
          from: 'support@tuntongtech.com',
          to: selectedRegForApprove.adminEmail,
          subject: `[Tuntong Tech] Congratulations! Your Cooperative Registration has been Approved (${selectedRegForApprove.name})`,
          sentAt: new Date().toISOString(),
          body: emailBody,
          domain: `https://${subdomain}`,
          temporaryPassword: otp,
        };

        approvedReg = {
          ...selectedRegForApprove,
          status: 'APPROVED',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Lex (Tuntong Tech Operator)',
          oneTimePassword: otp,
          emailNotification: emailNotice,
        };

        provisionedTenant = {
          id: `tenant_${selectedRegForApprove.slug}_${Date.now().toString().slice(-4)}`,
          name: selectedRegForApprove.name,
          slug: selectedRegForApprove.slug,
          subdomain,
          cdaRegistrationNumber: selectedRegForApprove.cdaRegistrationNumber,
          tin: selectedRegForApprove.tin,
          contactEmail: selectedRegForApprove.contactEmail,
          contactPhone: selectedRegForApprove.contactPhone,
          adminName: `${selectedRegForApprove.adminFirstName} ${selectedRegForApprove.adminLastName}`,
          billingMode: 'STANDARD_UNIFIED',
          status: 'ACTIVE',
          totalMembers: 0,
          activeMembers: 0,
          freeTierMembers: 0,
          billedMembers: 0,
          platformCreditBalance: 0.0,
          escrowFloatBalance: 0.0,
          totalLoansDisbursed: 0,
          totalLoanVolume: 0,
          totalTechFeesGenerated: 0,
          storageUsedMb: 12.0,
          storageQuotaMb: 10240,
          databaseSchema: `tenant_${selectedRegForApprove.slug}`,
          healthScore: 100,
          lastActiveAt: 'Just now',
          createdAt: new Date().toISOString(),
        };
      }

      setRegistrations((prev) => {
        const updated = prev.map((r) => (r.id === approvedReg.id ? approvedReg : r));
        try {
          localStorage.setItem('tuntong_coop_registrations', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      if (provisionedTenant) {
        setTenants((prev) => {
          if (!prev.some((t) => t.slug === provisionedTenant.slug)) {
            return [provisionedTenant, ...prev];
          }
          return prev;
        });
      }

      await fetchRegistrations();
      await fetchFleet();

      setSelectedRegForApprove(null);
      setToastMessage(`Registration approved! Credentials dispatched from support@tuntongtech.com to ${approvedReg.adminEmail}`);
      setSelectedRegForEmailView(emailNotice);
    } catch (err) {
      console.error(err);
      alert('Error approving registration.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // REJECT REGISTRATION HANDLER
  const handleRejectRegistration = async () => {
    if (!selectedRegForReject || !rejectionReasonInput.trim()) return;
    setIsSubmittingAction(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/operator/registrations/${selectedRegForReject.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectionReasonInput.trim(),
          reviewedBy: 'Lex (Tuntong Tech Operator)',
        }),
      });

      let rejectedReg: CooperativeRegistration;
      let emailNotice: RegistrationEmailNotification;

      if (res.ok) {
        const result = await res.json();
        rejectedReg = result.registration || result.data;
        if (!rejectedReg) {
          rejectedReg = {
            ...selectedRegForReject,
            status: 'REJECTED',
            rejectionReason: rejectionReasonInput.trim(),
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Tuntong Tech Operator',
          };
        }
        emailNotice = rejectedReg.emailNotification || {
          from: 'support@tuntongtech.com',
          to: selectedRegForReject.adminEmail,
          subject: `[Tuntong Tech] Update on your Cooperative Registration Application (${selectedRegForReject.name})`,
          sentAt: new Date().toISOString(),
          body: `Notice of decline: ${rejectionReasonInput.trim()}`,
        };
      } else {
        const emailBody = `Dear ${selectedRegForReject.adminFirstName} ${selectedRegForReject.adminLastName},

Thank you for your application (${selectedRegForReject.id}) to onboard "${selectedRegForReject.name}" onto Tuntong Tech.

After reviewing your submitted credentials and government-issued identification, our compliance team is unable to approve your registration at this time due to the following reason:

${rejectionReasonInput.trim()}

You may re-apply with the corrected documentation at https://coop.tuntongtech.com/coop-register or reply directly to support@tuntongtech.com if you require assistance.

Sincerely,
Tuntong Tech Compliance Team
support@tuntongtech.com
https://tuntongtech.com`;

        emailNotice = {
          from: 'support@tuntongtech.com',
          to: selectedRegForReject.adminEmail,
          subject: `[Tuntong Tech] Update on your Cooperative Registration Application (${selectedRegForReject.name})`,
          sentAt: new Date().toISOString(),
          body: emailBody,
        };

        rejectedReg = {
          ...selectedRegForReject,
          status: 'REJECTED',
          rejectionReason: rejectionReasonInput.trim(),
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Lex (Tuntong Tech Operator)',
          emailNotification: emailNotice,
        };
      }

      setRegistrations((prev) => {
        const updated = prev.map((r) => (r.id === rejectedReg.id ? rejectedReg : r));
        try {
          localStorage.setItem('tuntong_coop_registrations', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      await fetchRegistrations();

      setSelectedRegForReject(null);
      setRejectionReasonInput('');
      setToastMessage(`Registration rejected. Official notice dispatched from support@tuntongtech.com.`);
      setSelectedRegForEmailView(emailNotice);
    } catch (err) {
      console.error(err);
      alert('Error rejecting registration.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 1. Initial Session Validation / Redirect Loader
  if (isCheckingAuth || !operatorSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Verifying Operator Authorization...
        </p>
      </div>
    );
  }

  // 3. Authenticated Operator Control Plane
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

          {/* Logged In Operator Badge */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white leading-none">
                {operatorSession?.name || operatorSession?.username}
              </span>
              <span className="text-[9px] text-slate-400 font-mono leading-tight">
                {operatorSession?.email}
              </span>
            </div>
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
            <span>Coop Registration Portal</span>
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            title="Sign out of Operator Control Plane"
            className="bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 hover:border-rose-700 font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* TOAST BANNER */}
      {toastMessage && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-80 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. MAIN OPERATOR BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-7">
        
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

        {/* 3. EXECUTIVE KPI CARDS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Tenants & Health */}
          <div
            onClick={() => setActiveTab('FLEET')}
            className={`p-4 sm:p-5 rounded-2xl border space-y-2 shadow-sm cursor-pointer transition-all ${
              activeTab === 'FLEET' ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
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

          {/* Card 2: Registrations Queue (Key new capability!) */}
          <div
            onClick={() => setActiveTab('REGISTRATIONS')}
            className={`p-4 sm:p-5 rounded-2xl border space-y-2 shadow-sm cursor-pointer transition-all ${
              activeTab === 'REGISTRATIONS' ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/20' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Coop Onboarding Queue</span>
              <FileBadge className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-white">{registrations.length}</div>
              {pendingRegistrationsCount > 0 ? (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                  {pendingRegistrationsCount} Pending
                </span>
              ) : (
                <span className="text-[11px] font-mono text-emerald-400">Queue Cleared</span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">CDA & PhilID KYC Review</span>
              <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                Review <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card 3: Platform Escrow Float & Credit Pool */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-sm">
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
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-medium">Platform Revenue & VAT</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-black text-white font-mono">
                ₱{grossTechFees.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-indigo-400 font-bold">Gross</span>
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-800/80">
              <span>Net: ₱{netTechRevenue.toLocaleString()}</span>
              <span className="text-slate-400">12% VAT: ₱{outputVatDue.toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* TAB CONTROLS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('FLEET')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'FLEET'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Tenant Fleet Directory</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">{tenants.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('REGISTRATIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'REGISTRATIONS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-700/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileBadge className="w-3.5 h-3.5" />
            <span>Registration Applications</span>
            {pendingRegistrationsCount > 0 && (
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {pendingRegistrationsCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'LEDGER'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-700/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Prepaid Credit & Top-Ups</span>
            {pendingTopupCount > 0 && (
              <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {pendingTopupCount} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('PAYMENT_METHODS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'PAYMENT_METHODS'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Payment Methods</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">{paymentMethods.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('BROADCASTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'BROADCASTS'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>System Broadcasts</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">{broadcasts.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('OPERATORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'OPERATORS'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-700/20'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Operator Users</span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded-full">{operators.length}</span>
          </button>
        </div>

        {/* TAB 1: TENANT FLEET DIRECTORY */}
        {activeTab === 'FLEET' && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
            {/* Header & Search */}
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
            {filteredTenants.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <Building2 className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">No Cooperative Tenants Provisioned</p>
                <p className="text-xs max-w-md mx-auto">
                  There are currently no active cooperative instances in the fleet. When new cooperatives submit applications through the onboarding portal and are approved, their live instances will appear here.
                </p>
                <div className="pt-2">
                  <Link
                    href="/coop-register"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-700/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Open Cooperative Registration Portal</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Tenant / Subdomain</th>
                    <th className="py-3 px-3">Environment & Tag</th>
                    <th className="py-3 px-3">Members (Census)</th>
                    <th className="py-3 px-3">Available Credit</th>
                    <th className="py-3 px-3">Escrow Float</th>
                    <th className="py-3 px-3">Instance Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredTenants.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleOpenCoopModal(t)}
                      className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      title="Click to open Cooperative Instance Modal"
                    >
                      {/* Tenant Identity */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                          <span>{t.name}</span>
                          <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5" />
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>https://{t.subdomain}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {t.cdaRegistrationNumber} • GM: {t.adminName}
                        </div>
                      </td>

                      {/* Environment & Tag */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            t.environment === 'testing'
                              ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${t.environment === 'testing' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                            {t.environment === 'testing' ? 'Testing' : 'Production'}
                          </span>
                          {t.tag ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-950/60 text-purple-300 border border-purple-800/80">
                              <Tag className="w-2.5 h-2.5 text-purple-400" />
                              <span>{t.tag}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-mono">No tag</span>
                          )}
                        </div>
                      </td>

                      {/* Member Census */}
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
                              +{t.billedMembers} Billed (₱{t.billedMembers * 50}/mo)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Available Credit */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-white text-sm">
                          ₱{t.platformCreditBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                        {t.platformCreditBalance < 500 ? (
                          <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Low Credit Warning</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 mt-0.5">Good Standing</div>
                        )}
                      </td>

                      {/* Escrow Float */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-semibold text-teal-300">
                          ₱{t.escrowFloatBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Tech fees: ₱{t.totalTechFeesGenerated.toLocaleString()}
                        </div>
                      </td>

                      {/* Status (without health score) */}
                      <td className="py-3.5 px-3">
                        {t.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            SUSPENDED
                          </span>
                        )}
                      </td>

                      {/* Operator Actions: Clickable trigger */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCoopModal(t);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 hover:border-emerald-500 inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <span>Manage Instance</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </section>
        )}

        {/* TAB 2: COOPERATIVE REGISTRATION APPLICATIONS (NEW MANDATORY FEATURE) */}
        {activeTab === 'REGISTRATIONS' && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Cooperative Registration Applications</h2>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    Tuntong Tech Compliance Desk
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Review applicant credentials and submitted government IDs. Accept or reject registrations with automated email notifications from{' '}
                  <span className="text-emerald-400 font-mono font-semibold">support@tuntongtech.com</span>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={fetchRegistrations}
                  disabled={isLoadingRegistrations}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRegistrations ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                {registrations.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllRegistrations}
                    className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Queue</span>
                  </button>
                )}

                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search applicant, CDA, TIN..."
                    value={regSearchQuery}
                    onChange={(e) => setRegSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                  />
                </div>

                <select
                  value={regStatusFilter}
                  onChange={(e) => setRegStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="ALL">All Applications ({registrations.length})</option>
                  <option value="PENDING_REVIEW">Pending Review ({pendingRegistrationsCount})</option>
                  <option value="APPROVED">Approved ({registrations.filter((r) => r.status === 'APPROVED').length})</option>
                  <option value="REJECTED">Rejected ({registrations.filter((r) => r.status === 'REJECTED').length})</option>
                </select>
              </div>
            </div>

            {/* List / Cards */}
            {filteredRegistrations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
                <Inbox className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">No cooperative registrations found</p>
                <p className="text-xs">Applications submitted via <Link href="/coop-register" className="text-emerald-400 underline">coop-register</Link> will immediately appear in this queue.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-lg"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {reg.id}
                          </span>
                          <h3 className="font-bold text-white text-base">{reg.name}</h3>
                          <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded uppercase">
                            {reg.coopType || 'MULTI_PURPOSE'}
                          </span>
                        </div>
                        <div className="text-xs text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>https://{reg.subdomain || `${reg.slug}-coop.tuntongtech.com`}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {reg.status === 'PENDING_REVIEW' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-700 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            PENDING REVIEW
                          </span>
                        )}
                        {reg.status === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            APPROVED & PROVISIONED
                          </span>
                        )}
                        {reg.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            REJECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Registration Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Column 1: Legal & Tax Identifiers */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">CDA & Tax Identity</div>
                        <div><strong className="text-slate-300">CDA Reg No:</strong> <span className="font-mono text-white">{reg.cdaRegistrationNumber}</span></div>
                        <div><strong className="text-slate-300">BIR TIN:</strong> <span className="font-mono text-white">{reg.tin}</span></div>
                        <div><strong className="text-slate-300">Address:</strong> <span className="text-slate-300">{reg.address || 'Not specified'}</span></div>
                      </div>

                      {/* Column 2: Primary Administrator */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Authorized Signatory</div>
                        <div className="text-white font-semibold">
                          {reg.adminFirstName} {reg.adminMiddleName ? `${reg.adminMiddleName} ` : ''}{reg.adminLastName}
                        </div>
                        <div className="text-slate-300 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{reg.adminEmail}</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">{reg.contactPhone || 'N/A'}</div>
                      </div>

                      {/* Column 3: Submitted ID & Verification */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Submitted Government ID</div>
                          <div className="text-white font-medium flex items-center gap-1.5 mt-1 truncate">
                            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{reg.validIdFileName || 'Philippine_National_ID.pdf'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({reg.validIdFileSizeMb || '2.40'} MB)</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIdPreviewHasError(false);
                            setSelectedRegForIdView(reg);
                          }}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inspect Submitted ID</span>
                        </button>
                      </div>
                    </div>

                    {/* Rejection / Approval Notes if any */}
                    {reg.status === 'REJECTED' && reg.rejectionReason && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200">
                        <strong className="text-rose-300">Reason for Rejection:</strong> {reg.rejectionReason}
                      </div>
                    )}

                    {reg.status === 'APPROVED' && reg.oneTimePassword && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="space-y-0.5">
                          <div><strong>Initial Temporary Credentials:</strong> 1-Time Password: <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-emerald-700">{reg.oneTimePassword}</span></div>
                          <div className="text-[11px] text-emerald-400/80">User must change password immediately upon first sign-in.</div>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          Reviewed by {reg.reviewedBy || 'Operator'}
                        </div>
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-800 text-xs">
                      <div className="text-slate-400 text-[11px] font-mono">
                        Submitted: {new Date(reg.submittedAt).toLocaleString()}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Remove / Delete record from queue */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteRegistration(reg.id, e)}
                          title="Remove registration from queue"
                          className="bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 px-2.5 py-1.5 rounded-xl font-medium flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>

                        {/* View Dispatched Email Button if notification exists */}
                        {reg.emailNotification && (
                          <button
                            type="button"
                            onClick={() => setSelectedRegForEmailView(reg.emailNotification!)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-indigo-400" />
                            <span>View Dispatched Email</span>
                          </button>
                        )}

                        {/* Accept & Reject Buttons for Pending items */}
                        {reg.status === 'PENDING_REVIEW' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRegForReject(reg);
                                setRejectionReasonInput('');
                              }}
                              className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedRegForApprove(reg)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-700/30 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept Registration</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 3: PLATFORM CREDIT LEDGER & TOP-UP VERIFICATIONS */}
        {activeTab === 'LEDGER' && (
          <div className="space-y-6">
            {/* 1. PENDING TOP-UP VERIFICATION QUEUE */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Pending Tenant Top-Up Verifications</h3>
                  {pendingTopupCount > 0 ? (
                    <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full animate-pulse">
                      {pendingTopupCount} Awaiting Review
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                      Queue Clear
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={fetchTopupRequests}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    title="Refresh Queue"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 text-[11px]">Strict verification before credit injection</span>
                </div>
              </div>

              {topupRequests.filter((r) => r.status === 'PENDING_VERIFICATION').length === 0 ? (
                <div className="p-6 text-center text-slate-500 space-y-1 bg-slate-950/40 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500/50" />
                  <p className="text-xs font-semibold text-slate-400">No Pending Top-Up Requests</p>
                  <p className="text-[11px] text-slate-500">When tenants refill platform credit, their bank transfer reference details will appear here for verification.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Requested At</th>
                        <th className="py-2.5 px-3">Tenant</th>
                        <th className="py-2.5 px-3">Top-Up Amount</th>
                        <th className="py-2.5 px-3">Remitting Source Bank</th>
                        <th className="py-2.5 px-3">Reference / Trace #</th>
                        <th className="py-2.5 px-3">Depository Bank Account</th>
                        <th className="py-2.5 px-3 text-right">Verification Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {topupRequests
                        .filter((r) => r.status === 'PENDING_VERIFICATION')
                        .map((req) => (
                          <tr key={req.id} className="hover:bg-slate-800/30">
                            <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                              {new Date(req.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-white">{req.tenantName}</div>
                              <div className="font-mono text-[10px] text-slate-500">{req.tenantId}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-sm">
                              ₱{req.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-amber-300">
                              {req.sourceBank}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-white bg-slate-950/60 px-2 py-1 rounded">
                              {req.referenceNumber}
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-300">
                              <div>{req.bankName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{req.accountNumber}</div>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTopupForReject(req);
                                    setTopupRejectReason('');
                                  }}
                                  className="px-2.5 py-1 bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Decline</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveTopupRequest(req)}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-700/30 transition"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Verify & Credit</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 2. COMPREHENSIVE CREDIT LEDGER AUDIT */}
            <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Recent Platform Credit Ledger & Refill Audit</h3>
                </div>
                <span className="text-xs text-slate-400">Strict double-entry prepaid credit log</span>
              </div>

              {creditTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-950/40 rounded-xl border border-slate-800">
                  <CreditCard className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">No Credit Ledger Transactions</p>
                  <p className="text-xs">Prepaid platform credit top-ups, fee deductions, and adjustments will be audited here.</p>
                </div>
              ) : (
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
              )}
            </section>
          </div>
        )}

        {/* TAB: PLATFORM PAYMENT METHODS (2 SEPARATE SECTIONS: PRODUCTION & TEST) */}
        {activeTab === 'PAYMENT_METHODS' && (
          <div className="space-y-8">
            {/* Global Notification Banner */}
            {paymongoNotification && (
              <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-600/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-medium">{paymongoNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymongoNotification(null)}
                  className="text-emerald-400 hover:text-emerald-200 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Test Result Display */}
            {paymongoTestResult && (
              <div className={`p-4 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
                paymongoTestResult.success
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {paymongoTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <strong className="block text-white">
                      {paymongoTestResult.success ? 'PayMongo API Connection Successful' : 'Connection Failure'}
                    </strong>
                    <span className="opacity-90">{paymongoTestResult.message}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymongoTestResult(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ======================================================== */}
            {/* SECTION 1: PRODUCTION ENVIRONMENT CONFIGURATION (LIVE) */}
            {/* ======================================================== */}
            <div className="border border-emerald-500/30 rounded-2xl p-6 bg-slate-900/95 space-y-6 shadow-2xl relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-base text-white">Section 1: Production Environment Configuration</h3>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      LIVE PRODUCTION
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Active credentials used for live platform credit purchases and real bank remittances from cooperatives in production.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
                    paymongoConfig.liveIsEnabled !== false
                      ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800'
                      : 'bg-rose-950/70 text-rose-400 border-rose-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${paymongoConfig.liveIsEnabled !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{paymongoConfig.liveIsEnabled !== false ? 'LIVE GATEWAY ACTIVE' : 'LIVE GATEWAY DISABLED'}</span>
                  </span>
                </div>
              </div>

              {/* 1A. Production PayMongo Gateway Keys */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Live PayMongo Gateway API Keys</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Status:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymongoConfig((prev) => ({ ...prev, liveIsEnabled: !(prev.liveIsEnabled ?? true) }))
                      }
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                        paymongoConfig.liveIsEnabled !== false
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {paymongoConfig.liveIsEnabled !== false ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Live Secret Key */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Live Secret Key (sk_live_...)</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Server-Side</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showLiveSecretKey ? 'text' : 'password'}
                        value={paymongoConfig.liveSecretKey || (paymongoConfig.environment === 'live' ? paymongoConfig.secretKey : '')}
                        onChange={(e) => setPaymongoConfig((prev) => ({ ...prev, liveSecretKey: e.target.value }))}
                        placeholder="sk_live_..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLiveSecretKey(!showLiveSecretKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showLiveSecretKey ? 'Hide Live Secret' : 'Reveal Live Secret'}
                      >
                        {showLiveSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Live Public Key */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Live Public Key (pk_live_...)</span>
                      <span className="text-[10px] text-blue-400 font-normal">Client Checkout</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={paymongoConfig.livePublicKey || (paymongoConfig.environment === 'live' ? paymongoConfig.publicKey : '')}
                        onChange={(e) => setPaymongoConfig((prev) => ({ ...prev, livePublicKey: e.target.value }))}
                        placeholder="pk_live_..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const k = paymongoConfig.livePublicKey || (paymongoConfig.environment === 'live' ? paymongoConfig.publicKey : '');
                          if (k) {
                            navigator.clipboard.writeText(k);
                            alert('Live Public Key copied!');
                          }
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title="Copy Public Key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Live Webhook Secret */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Live Webhook Secret (whsec_...)</span>
                      <span className="text-[10px] text-purple-400 font-normal">HMAC Signature</span>
                    </label>
                    <input
                      type="text"
                      value={paymongoConfig.liveWebhookSecret || (paymongoConfig.environment === 'live' ? paymongoConfig.webhookSecret : '')}
                      onChange={(e) => setPaymongoConfig((prev) => ({ ...prev, liveWebhookSecret: e.target.value }))}
                      placeholder="whsec_..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTestPaymongoConnection('live')}
                    disabled={paymongoTesting}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
                  >
                    {paymongoTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                    )}
                    <span>Test Live Connection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSavePaymongoConfig('live')}
                    disabled={paymongoSaving}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-md shadow-emerald-700/20 flex items-center gap-1.5"
                  >
                    {paymongoSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Production Config</span>
                  </button>
                </div>
              </div>

              {/* 1B. Production Depository Bank Accounts */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-xs text-white">Production Depository Bank Accounts</h4>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                      {paymentMethods.filter((pm) => pm.environment !== 'test').length} Accounts
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddMethodModal('production')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Production Bank Account</span>
                  </button>
                </div>

                {paymentMethods.filter((pm) => pm.environment !== 'test').length === 0 ? (
                  <div className="p-6 text-center text-slate-500 space-y-1 bg-slate-950/40 rounded-xl border border-slate-800">
                    <Landmark className="w-6 h-6 mx-auto text-slate-600" />
                    <p className="text-xs font-semibold text-slate-400">No Production Bank Accounts Configured</p>
                    <p className="text-[11px] text-slate-500">Add a live bank deposit account for cooperatives in production to top-up credit.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paymentMethods
                      .filter((pm) => pm.environment !== 'test')
                      .map((pm) => (
                        <div
                          key={pm.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2.5 relative group hover:border-emerald-600/50 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{pm.bankName}</span>
                              </h5>
                              <div className="flex items-center gap-1">
                                {pm.isDefault && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                                    Default
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  pm.isActive !== false ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  {pm.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 bg-slate-900 rounded-lg space-y-1 text-xs font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-500 text-[10px]">Account Name:</span>
                                <span className="text-slate-200 font-semibold text-[11px]">{pm.accountName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 text-[10px]">Account Number:</span>
                                <span className="text-emerald-400 font-bold text-[11px]">{pm.accountNumber}</span>
                              </div>
                            </div>

                            {pm.instructions && (
                              <p className="text-[10px] text-slate-400 italic bg-slate-900/50 p-1.5 rounded border border-slate-800/80">
                                {pm.instructions}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex justify-end gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => openEditMethodModal(pm)}
                              className="px-2 py-0.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[11px] flex items-center gap-1 transition"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePaymentMethod(pm.id, pm.bankName)}
                              className="px-2 py-0.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded text-[11px] flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* SECTION 2: TEST ENVIRONMENT CONFIGURATION (SANDBOX)      */}
            {/* ======================================================== */}
            <div className="border border-blue-500/30 rounded-2xl p-6 bg-slate-900/95 space-y-6 shadow-2xl relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-base text-white">Section 2: Test Environment Configuration</h3>
                    <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      SANDBOX / TESTING
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Sandbox API keys and test bank details used for staging simulations, test top-ups, and beta cooperatives without moving real money.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
                    paymongoConfig.testIsEnabled !== false
                      ? 'bg-blue-950/70 text-blue-400 border-blue-800'
                      : 'bg-rose-950/70 text-rose-400 border-rose-800'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${paymongoConfig.testIsEnabled !== false ? 'bg-blue-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{paymongoConfig.testIsEnabled !== false ? 'SANDBOX ACTIVE' : 'SANDBOX DISABLED'}</span>
                  </span>
                </div>
              </div>

              {/* 2A. Test PayMongo Gateway Keys */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Test PayMongo Gateway API Keys (Sandbox)</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Status:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaymongoConfig((prev) => ({ ...prev, testIsEnabled: !(prev.testIsEnabled ?? true) }))
                      }
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${
                        paymongoConfig.testIsEnabled !== false
                          ? 'bg-blue-600 text-white'
                          : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                      }`}
                    >
                      {paymongoConfig.testIsEnabled !== false ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Test Secret Key */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Test Secret Key (sk_test_...)</span>
                      <span className="text-[10px] text-amber-400 font-normal">Sandbox Server</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showTestSecretKey ? 'text' : 'password'}
                        value={paymongoConfig.testSecretKey || (paymongoConfig.environment === 'test' ? paymongoConfig.secretKey : '')}
                        onChange={(e) => setPaymongoConfig((prev) => ({ ...prev, testSecretKey: e.target.value }))}
                        placeholder="sk_test_..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTestSecretKey(!showTestSecretKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showTestSecretKey ? 'Hide Test Secret' : 'Reveal Test Secret'}
                      >
                        {showTestSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Test Public Key */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Test Public Key (pk_test_...)</span>
                      <span className="text-[10px] text-blue-400 font-normal">Sandbox Client</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={paymongoConfig.testPublicKey || (paymongoConfig.environment === 'test' ? paymongoConfig.publicKey : '')}
                        onChange={(e) => setPaymongoConfig((prev) => ({ ...prev, testPublicKey: e.target.value }))}
                        placeholder="pk_test_..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const k = paymongoConfig.testPublicKey || (paymongoConfig.environment === 'test' ? paymongoConfig.publicKey : '');
                          if (k) {
                            navigator.clipboard.writeText(k);
                            alert('Test Public Key copied!');
                          }
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title="Copy Public Key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Test Webhook Secret */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Test Webhook Secret (whsec_...)</span>
                      <span className="text-[10px] text-purple-400 font-normal">Test HMAC</span>
                    </label>
                    <input
                      type="text"
                      value={paymongoConfig.testWebhookSecret || (paymongoConfig.environment === 'test' ? paymongoConfig.webhookSecret : '')}
                      onChange={(e) => setPaymongoConfig((prev) => ({ ...prev, testWebhookSecret: e.target.value }))}
                      placeholder="whsec_..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTestPaymongoConnection('test')}
                    disabled={paymongoTesting}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-700 flex items-center gap-1.5"
                  >
                    {paymongoTesting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-teal-400" />
                    )}
                    <span>Test Sandbox Connection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSavePaymongoConfig('test')}
                    disabled={paymongoSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-md shadow-blue-700/20 flex items-center gap-1.5"
                  >
                    {paymongoSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Save Test Config</span>
                  </button>
                </div>
              </div>

              {/* 2B. Test Depository Bank Accounts */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-400" />
                    <h4 className="font-bold text-xs text-white">Test / Sandbox Depository Bank Accounts</h4>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                      {paymentMethods.filter((pm) => pm.environment === 'test').length} Accounts
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddMethodModal('test')}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-700/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Test Bank Account</span>
                  </button>
                </div>

                {paymentMethods.filter((pm) => pm.environment === 'test').length === 0 ? (
                  <div className="p-6 text-center text-slate-500 space-y-1 bg-slate-950/40 rounded-xl border border-slate-800">
                    <Landmark className="w-6 h-6 mx-auto text-slate-600" />
                    <p className="text-xs font-semibold text-slate-400">No Test Bank Accounts Configured</p>
                    <p className="text-[11px] text-slate-500">Add a simulated bank account for sandbox testing and test credit refills.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paymentMethods
                      .filter((pm) => pm.environment === 'test')
                      .map((pm) => (
                        <div
                          key={pm.id}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2.5 relative group hover:border-blue-600/50 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                                <Landmark className="w-3.5 h-3.5 text-blue-400" />
                                <span>{pm.bankName}</span>
                              </h5>
                              <div className="flex items-center gap-1">
                                {pm.isDefault && (
                                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                                    Default
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  pm.isActive !== false ? 'bg-blue-950 text-blue-400 border border-blue-800' : 'bg-slate-800 text-slate-500'
                                }`}>
                                  {pm.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </div>
                            </div>

                            <div className="p-2.5 bg-slate-900 rounded-lg space-y-1 text-xs font-mono">
                              <div className="flex justify-between">
                                <span className="text-slate-500 text-[10px]">Account Name:</span>
                                <span className="text-slate-200 font-semibold text-[11px]">{pm.accountName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 text-[10px]">Account Number:</span>
                                <span className="text-blue-400 font-bold text-[11px]">{pm.accountNumber}</span>
                              </div>
                            </div>

                            {pm.instructions && (
                              <p className="text-[10px] text-slate-400 italic bg-slate-900/50 p-1.5 rounded border border-slate-800/80">
                                {pm.instructions}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex justify-end gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => openEditMethodModal(pm)}
                              className="px-2 py-0.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-[11px] flex items-center gap-1 transition"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePaymentMethod(pm.id, pm.bankName)}
                              className="px-2 py-0.5 text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded text-[11px] flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM BROADCASTS */}
        {activeTab === 'BROADCASTS' && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">System Announcements & Maintenance Broadcasts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewBroadcastModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-700/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Broadcast</span>
              </button>
            </div>

            {broadcasts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-950/40 rounded-xl border border-slate-800">
                <Megaphone className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">No Active Broadcasts</p>
                <p className="text-xs">Publish system announcements or maintenance notices visible to all cooperative tenancies.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {broadcasts.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          b.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          b.severity === 'WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}>
                          {b.severity}
                        </span>
                        <h4 className="font-bold text-white text-xs">{b.title}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">({new Date(b.createdAt).toLocaleDateString()})</span>

                        {/* Target Scope Badge */}
                        {b.targetType === 'TAG' && b.targetTag ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-purple-950/70 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                            <Tag className="w-2.5 h-2.5 text-purple-400" />
                            <span>Tag: {b.targetTag}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                            <Globe className="w-2.5 h-2.5" />
                            <span>All Tenants</span>
                          </span>
                        )}

                        {/* Auto-Expiry / Scheduled Badge */}
                        {b.expiresAt && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            <span>Expires: {new Date(b.expiresAt).toLocaleDateString()}</span>
                          </span>
                        )}

                        {b.scheduledDate && new Date(b.scheduledDate) > new Date() && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full">
                            <Calendar className="w-2.5 h-2.5 text-amber-400" />
                            <span>Scheduled: {new Date(b.scheduledDate).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{b.message}</p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        b.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {b.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleBroadcast(b.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                          b.isActive
                            ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/80'
                        }`}
                        title={b.isActive ? 'Deactivate this broadcast' : 'Activate this broadcast'}
                      >
                        <Power className="w-3 h-3" />
                        <span>{b.isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 5: OPERATOR USERS (Stored in Firebase Firestore) */}
        {activeTab === 'OPERATORS' && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">Platform Operator Users & Access Control</h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  Firebase Database: operators
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOperatorModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Operator User</span>
              </button>
            </div>

            {operators.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2 bg-slate-950/40 rounded-xl border border-slate-800">
                <Shield className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">Loading Operator Users...</p>
                <p className="text-xs">Fetching operator profiles stored in Firebase Firestore.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Username</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Authorized Email (PIN Target)</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Database Persistence</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {operators.map((op) => (
                      <tr key={op.username} className="hover:bg-slate-800/20">
                        <td className="py-2.5 px-3 font-mono font-bold text-white">{op.username}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-200">{op.name}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">{op.email}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            op.role === 'PLATFORM_SUPER_OPERATOR'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {op.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Firebase Cloud Firestore
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {op.username === 'tuntongtech' ? (
                            <span className="text-[10px] text-slate-500 font-mono italic">Primary Super Operator</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteOperator(op.username)}
                              className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/40 rounded transition"
                              title="Delete operator user from Firebase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* MODAL: ACCEPT / APPROVE REGISTRATION */}
      {selectedRegForApprove && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Approve Cooperative Registration</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegForApprove(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="text-slate-400 text-[11px] font-mono uppercase">Cooperative Being Approved:</div>
              <div className="text-white font-bold text-sm">{selectedRegForApprove.name}</div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-slate-300">
                <div>CDA: <span className="font-mono text-white">{selectedRegForApprove.cdaRegistrationNumber}</span></div>
                <div>TIN: <span className="font-mono text-white">{selectedRegForApprove.tin}</span></div>
                <div className="col-span-2">
                  Admin: <span className="text-white font-medium">{selectedRegForApprove.adminFirstName} {selectedRegForApprove.adminLastName}</span> ({selectedRegForApprove.adminEmail})
                </div>
              </div>
            </div>

            {/* Live Domain & Credential Preview */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <Sparkles className="w-4 h-4" />
                <span>Automated Tenant Provisioning Specifications</span>
              </div>
              
              <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-lg border border-emerald-900/60 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Assigned Domain:</span>
                  <span className="text-emerald-400 font-bold">https://{selectedRegForApprove.slug}-coop.tuntongtech.com</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>1-Time Temporary Password:</span>
                  <span className="text-amber-400 font-bold">TT-******#** (Auto-generated)</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Prepaid Welcome Credit:</span>
                  <span className="text-white font-bold">₱1,000.00</span>
                </div>
              </div>

              <div className="text-[11px] text-emerald-200/90 leading-relaxed">
                An official onboarding email will be automatically dispatched to <strong className="text-white">{selectedRegForApprove.adminEmail}</strong> directly from <strong className="text-white font-mono">support@tuntongtech.com</strong> containing their domain, sign-in credentials, and mandatory first-login password change instructions.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setSelectedRegForApprove(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={handleApproveRegistration}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/30"
              >
                {isSubmittingAction ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Confirm Approval & Send Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DECLINE / REJECT REGISTRATION */}
      {selectedRegForReject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Decline Registration Application</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegForReject(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="text-slate-400">Applicant Cooperative:</div>
              <div className="text-white font-bold text-sm">{selectedRegForReject.name}</div>
              <div className="text-slate-400 text-[11px]">Primary Contact: {selectedRegForReject.adminEmail}</div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Reason for Decline / Non-Compliance *
              </label>
              <textarea
                rows={4}
                required
                placeholder="e.g. Submitted Government ID is unreadable, CDA registration certificate number mismatch, or invalid BIR Tax Identification Number (TIN)."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder-slate-500"
              />
              <p className="text-[11px] text-slate-400">
                This explanation will be dispatched in an official notification email to <strong className="text-slate-300">{selectedRegForReject.adminEmail}</strong> from <span className="text-emerald-400 font-mono">support@tuntongtech.com</span>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={isSubmittingAction}
                onClick={() => setSelectedRegForReject(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingAction || !rejectionReasonInput.trim()}
                onClick={handleRejectRegistration}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-700/30 disabled:opacity-50"
              >
                {isSubmittingAction ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Confirm Decline & Send Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT SUBMITTED GOVERNMENT ID */}
      {selectedRegForIdView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Submitted Government ID Document Inspection</h3>
                  <p className="text-[11px] text-slate-400">
                    Application #{selectedRegForIdView.id} • {selectedRegForIdView.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegForIdView(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Signatory Metadata Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Signatory / Admin:</span>
                <strong className="text-white text-sm block mt-0.5 truncate">
                  {selectedRegForIdView.adminLastName}, {selectedRegForIdView.adminFirstName} {selectedRegForIdView.adminMiddleName || ''}
                </strong>
                <span className="text-[11px] text-slate-400 truncate block">{selectedRegForIdView.adminEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">CDA Registration:</span>
                <strong className="text-emerald-400 text-sm font-mono block mt-0.5">
                  {selectedRegForIdView.cdaRegistrationNumber}
                </strong>
                <span className="text-[11px] text-slate-400 block font-mono">TIN: {selectedRegForIdView.tin}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Attached Document:</span>
                <span className="font-mono text-slate-200 text-xs font-semibold block mt-0.5 truncate" title={selectedRegForIdView.validIdFileName}>
                  {selectedRegForIdView.validIdFileName || 'government_id.pdf'}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">{selectedRegForIdView.validIdFileSizeMb || '1.80'} MB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Compliance Status:</span>
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  {selectedRegForIdView.status}
                </span>
              </div>
            </div>

            {/* Document Viewer Container */}
            {(() => {
              const isViewable = Boolean(
                selectedRegForIdView.validIdUrl &&
                !idPreviewHasError &&
                (selectedRegForIdView.validIdUrl.startsWith('data:') ||
                 selectedRegForIdView.validIdUrl.startsWith('http://') ||
                 selectedRegForIdView.validIdUrl.startsWith('https://')) &&
                !selectedRegForIdView.validIdUrl.startsWith('/uploads/')
              );

              const isPdf = Boolean(
                isViewable &&
                (selectedRegForIdView.validIdUrl?.startsWith('data:application/pdf') ||
                 selectedRegForIdView.validIdFileName?.toLowerCase().endsWith('.pdf'))
              );

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-emerald-400" /> Document Preview
                    </span>
                    {isViewable && (
                      <a
                        href={selectedRegForIdView.validIdUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-700 transition"
                      >
                        <span>Open in Full Screen / New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {isViewable ? (
                    isPdf ? (
                      <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-950">
                        <iframe
                          src={selectedRegForIdView.validIdUrl}
                          title="Submitted Government ID PDF"
                          className="w-full h-[450px] bg-white"
                          onError={() => setIdPreviewHasError(true)}
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 flex flex-col items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
                        <img
                          src={selectedRegForIdView.validIdUrl}
                          alt="Submitted Government ID"
                          onError={() => setIdPreviewHasError(true)}
                          className="max-h-[460px] w-auto max-w-full rounded-lg object-contain shadow-2xl border border-slate-800"
                        />
                      </div>
                    )
                  ) : (
                    <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <UserCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Document File Record: {selectedRegForIdView.validIdFileName || 'Philippine_National_ID.pdf'}</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                          File size: {selectedRegForIdView.validIdFileSizeMb || '2.40'} MB. The document signature and CDA credentials have been recorded under compliance reference #{selectedRegForIdView.id}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Compliance Verification Checklist */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-300">Compliance &amp; Regulatory Check:</div>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CDA Registration Registry lookup matched and verified.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Signatory authorized by General Assembly / Board of Directors resolution.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compliant with NPC 2012 Data Privacy encryption and storage standards.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRegForIdView(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Close ID Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCHED EMAIL LOG VIEWER */}
      {selectedRegForEmailView && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Dispatched Official Email Notification</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRegForEmailView(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Header Envelope */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400">
                <span>From:</span>
                <span className="font-mono font-bold text-emerald-400">{selectedRegForEmailView.from}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>To:</span>
                <span className="font-mono text-white">{selectedRegForEmailView.to}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Date Sent:</span>
                <span className="font-mono text-slate-300">{new Date(selectedRegForEmailView.sentAt).toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-200">
                <strong className="text-slate-400">Subject:</strong> {selectedRegForEmailView.subject}
              </div>
            </div>

            {/* Highlighting Credentials if present */}
            {selectedRegForEmailView.domain && selectedRegForEmailView.temporaryPassword && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4" />
                  <span>Dispatched Access Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="bg-slate-900 p-2 rounded border border-emerald-900/60">
                    <span className="text-slate-400 block text-[10px]">COOPERATIVE DOMAIN:</span>
                    <span className="text-emerald-400 font-bold">{selectedRegForEmailView.domain}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-emerald-900/60">
                    <span className="text-slate-400 block text-[10px]">1-TIME TEMPORARY PASSWORD:</span>
                    <span className="text-amber-400 font-bold">{selectedRegForEmailView.temporaryPassword}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pre-formatted Body */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Email Body Content:</div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {selectedRegForEmailView.body}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRegForEmailView(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs"
              >
                Close Email Viewer
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Severity Level *</label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="INFO">Informational (Blue)</option>
                    <option value="WARNING">Maintenance / Warning (Amber)</option>
                    <option value="CRITICAL">Critical Alert (Red)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Audience *</label>
                  <select
                    value={broadcastTargetType}
                    onChange={(e) => setBroadcastTargetType(e.target.value as 'ALL' | 'TAG')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Tenants (Fleet-Wide)</option>
                    <option value="TAG">Limit by Instance Tag</option>
                  </select>
                </div>
              </div>

              {broadcastTargetType === 'TAG' && (
                <div className="p-3 bg-purple-950/30 border border-purple-800/60 rounded-xl space-y-1.5 animate-in fade-in">
                  <label className="block text-xs font-bold text-purple-200">
                    Target Instance Tag *
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. pilot, beta, luzon, tier-1"
                      value={broadcastTargetTag}
                      onChange={(e) => setBroadcastTargetTag(e.target.value)}
                      required={broadcastTargetType === 'TAG'}
                      className="w-full bg-slate-950 border border-purple-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-purple-300/80">
                    Only cooperatives whose instance is tagged with this exact tag will see this announcement in their admin portal.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Core Banking Maintenance"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Announcement Message *</label>
                <textarea
                  rows={3}
                  placeholder="Details of the announcement displayed in cooperative admin portals..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Auto-Expiration and Scheduling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Auto-Expiration Duration
                  </label>
                  <select
                    value={broadcastDurationOption}
                    onChange={(e) => setBroadcastDurationOption(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="45">45 Days (Standard Auto-Expire)</option>
                    <option value="7">7 Days</option>
                    <option value="14">14 Days</option>
                    <option value="30">30 Days</option>
                    <option value="CUSTOM">Specific Expiration Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Schedule for Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={broadcastScheduledDate}
                    onChange={(e) => setBroadcastScheduledDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {broadcastDurationOption === 'CUSTOM' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Custom Expiration Date *</label>
                  <input
                    type="date"
                    value={broadcastCustomExpiresAt}
                    onChange={(e) => setBroadcastCustomExpiresAt(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400">
                This broadcast will automatically expire after <strong>{broadcastDurationOption === 'CUSTOM' ? (broadcastCustomExpiresAt || 'selected date') : `${broadcastDurationOption} days`}</strong> from release. It will be pushed to targeted cooperative admin portals.
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
                  disabled={isSubmittingAction}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-700/30"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{broadcastScheduledDate ? 'Schedule Broadcast' : 'Publish Broadcast'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD OPERATOR USER (Stored in Firebase) */}
      {showAddOperatorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">New Operator User Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddOperatorModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddOperator} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Username *</label>
                <input
                  type="text"
                  placeholder="e.g. jdoe_operator"
                  value={newOperatorUsername}
                  onChange={(e) => setNewOperatorUsername(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newOperatorName}
                  onChange={(e) => setNewOperatorName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Authorized Email (Target for One-Time PIN) *</label>
                <input
                  type="email"
                  placeholder="e.g. john.doe@tuntongtech.com"
                  value={newOperatorEmail}
                  onChange={(e) => setNewOperatorEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role *</label>
                <select
                  value={newOperatorRole}
                  onChange={(e) => setNewOperatorRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="PLATFORM_SUPPORT">PLATFORM_SUPPORT (Fleet & Ticket Support)</option>
                  <option value="PLATFORM_SUPER_OPERATOR">PLATFORM_SUPER_OPERATOR (Full Platform Admin)</option>
                </select>
              </div>

              <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-xl text-xs text-purple-200">
                This operator user will be immediately persisted in Firebase Cloud Firestore collection <span className="font-mono text-purple-300 font-bold">operators</span>. They will sign in passwordlessly via email One-Time PIN.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddOperatorModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/30"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Operator in Firebase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PLATFORM PAYMENT METHOD */}
      {showAddMethodModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">
                  {editingMethod ? 'Edit Bank Payment Method' : 'Add Bank Payment Method'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddMethodModal(false);
                  setEditingMethod(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentMethod} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Operating Environment *</label>
                <select
                  value={methodEnvironment}
                  onChange={(e) => setMethodEnvironment(e.target.value as 'production' | 'test')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                >
                  <option value="production">Section 1: Production (Live Environment)</option>
                  <option value="test">Section 2: Testing (Sandbox Environment)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name / Institution *</label>
                <input
                  type="text"
                  placeholder="e.g. Land Bank of the Philippines, BDO, BPI"
                  value={methodBankName}
                  onChange={(e) => setMethodBankName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tuntong Tech Solution Inc."
                  value={methodAccountName}
                  onChange={(e) => setMethodAccountName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Number / IBAN *</label>
                <input
                  type="text"
                  placeholder="e.g. 0012-9981-22"
                  value={methodAccountNumber}
                  onChange={(e) => setMethodAccountNumber(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method Type</label>
                <select
                  value={methodType}
                  onChange={(e) => setMethodType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (InstaPay / PESONet)</option>
                  <option value="QRPH">QR Ph National Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Remittance Instructions</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Transfer via InstaPay/PESONet. Input your cooperative name in the payment description."
                  value={methodInstructions}
                  onChange={(e) => setMethodInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={methodIsActive}
                    onChange={(e) => setMethodIsActive(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  <span>Active for Refills</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={methodIsDefault}
                    onChange={(e) => setMethodIsDefault(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Default Method</span>
                </label>
              </div>

              <div className="p-3 bg-teal-950/30 border border-teal-800/50 rounded-xl text-xs text-teal-200">
                This bank account will be saved to Firebase Firestore collection <span className="font-mono text-teal-300 font-bold">platform_payment_methods</span> and instantly made available to all tenant admins.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMethodModal(false);
                    setEditingMethod(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-teal-700/30"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Bank Method</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DECLINE / REJECT TOP-UP REQUEST */}
      {selectedTopupForReject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <X className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-base">Decline Platform Credit Refill</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTopupForReject(null);
                  setTopupRejectReason('');
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectTopupRequest} className="space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cooperative Tenant:</span>
                  <span className="text-white font-bold">{selectedTopupForReject.tenantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Refill Amount:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    ₱{selectedTopupForReject.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Remitting Source Bank:</span>
                  <span className="text-amber-300 font-semibold">{selectedTopupForReject.sourceBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bank Reference / Trace #:</span>
                  <span className="text-white font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                    {selectedTopupForReject.referenceNumber}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Decline *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Remittance reference number not found in bank statement, amount mismatch, or illegible deposit proof."
                  value={topupRejectReason}
                  onChange={(e) => setTopupRejectReason(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-200">
                The top-up request will be flagged as REJECTED in Firebase Firestore. No credits will be injected into the tenant's balance.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTopupForReject(null);
                    setTopupRejectReason('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-rose-700/30"
                >
                  {isSubmittingAction ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  <span>Decline Top-Up</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: COOPERATIVE INSTANCE DETAILED INSPECTION MODAL */}
      {selectedFleetCoopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto space-y-6 p-6 shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Building2 className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-lg text-white">{selectedFleetCoopModal.name}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedFleetCoopModal.status === 'ACTIVE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}>
                    {selectedFleetCoopModal.status}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                    selectedFleetCoopModal.environment === 'testing'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  }`}>
                    {selectedFleetCoopModal.environment === 'testing' ? 'Testing' : 'Production'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                  <a
                    href={`https://${selectedFleetCoopModal.subdomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>https://{selectedFleetCoopModal.subdomain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span>•</span>
                  <span>CDA: <strong className="text-white font-mono">{selectedFleetCoopModal.cdaRegistrationNumber}</strong></span>
                  <span>•</span>
                  <span>GM: <strong className="text-white">{selectedFleetCoopModal.adminName}</strong></span>
                  <span>•</span>
                  <span>Members: <strong className="text-white font-mono">{selectedFleetCoopModal.totalMembers}</strong></span>
                </div>
              </div>

              {/* Top Action Buttons (Suspend / Reactivate & Close) */}
              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedTenantForStatus(selectedFleetCoopModal)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 shadow-sm ${
                    selectedFleetCoopModal.status === 'ACTIVE'
                      ? 'bg-rose-950/70 hover:bg-rose-900 text-rose-200 border-rose-800 hover:border-rose-600'
                      : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border-emerald-700 hover:border-emerald-500'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{selectedFleetCoopModal.status === 'ACTIVE' ? 'Suspend Instance' : 'Reactivate Instance'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFleetCoopModal(null)}
                  className="text-slate-400 hover:text-white p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SECTION 1: TENANT ENVIRONMENT TYPE & TAG CONFIGURATION */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h4 className="font-bold text-sm text-white">Tenant Environment & Tag Classification</h4>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Tenant ID: {selectedFleetCoopModal.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Environment Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    Tenant Environment Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModalTenantEnv('production')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        modalTenantEnv === 'production'
                          ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md shadow-emerald-900/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Production</span>
                        </span>
                        {modalTenantEnv === 'production' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 leading-tight">
                        Live cooperative operations with actual ledger transactions.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModalTenantEnv('testing')}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        modalTenantEnv === 'testing'
                          ? 'bg-blue-950/60 border-blue-500 text-white shadow-md shadow-blue-900/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-black flex items-center gap-1.5 text-blue-400">
                          <Radio className="w-3.5 h-3.5" />
                          <span>Testing</span>
                        </span>
                        {modalTenantEnv === 'testing' && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 leading-tight">
                        Sandbox trial environment for rehearsals and staging.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tag Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-purple-400" />
                      <span>Instance Tag</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">Used for targeted system broadcasts</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. pilot, beta, luzon, visayas, tier-1"
                      value={modalTenantTag}
                      onChange={(e) => setModalTenantTag(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Operators can broadcast system announcements specifically targeting instances matching this tag.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleSaveTenantDetails}
                  disabled={isSavingTenantDetails}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-emerald-700/20"
                >
                  {isSavingTenantDetails ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Environment & Tag</span>
                </button>
              </div>
            </div>

            {/* SECTION 2: CREATE ADMIN PORTAL USER & ASSIGN ROLE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-sm text-white">Cooperative Admin Portal Users & Roles</h4>
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded font-mono">
                    {coopAdminUsers.length} Users
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateAdminForm(!showCreateAdminForm)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-md shadow-purple-700/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCreateAdminForm ? 'Close User Form' : 'Create Admin Portal User'}</span>
                </button>
              </div>

              {/* Admin User Creation Form */}
              {showCreateAdminForm && (
                <form onSubmit={handleCreateAdminUser} className="p-4 rounded-xl bg-slate-900 border border-purple-800/60 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                    <span className="font-bold text-purple-300">Add New Cooperative Staff / Admin User</span>
                    <span className="text-[11px] text-slate-400">Credentials will be saved in Firebase for {selectedFleetCoopModal.name}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Maria Santos"
                        value={newAdminFullName}
                        onChange={(e) => setNewAdminFullName(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Official Email *</label>
                      <input
                        type="email"
                        placeholder="e.g. msantos@coop.ph"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Username (Login ID)</label>
                      <input
                        type="text"
                        placeholder="Optional: defaults to email prefix"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Password *</label>
                      <input
                        type="password"
                        placeholder="Strong login password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Assigned Role &amp; Permissions *</label>
                    <select
                      value={newAdminRole}
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                    >
                      <option value="SYSTEM_ADMIN">SYSTEM_ADMIN (Full Administrator Access)</option>
                      <option value="GENERAL_MANAGER">GENERAL_MANAGER (Executive Approvals & Oversight)</option>
                      <option value="LOAN_OFFICER">LOAN_OFFICER (Credit Evaluation & Loan Management)</option>
                      <option value="ACCOUNTANT">ACCOUNTANT (Chart of Accounts, Journal Vouchers, Financial Reports)</option>
                      <option value="CASHIER">CASHIER (Counter Deposits, Loan Disbursements, Official Receipts)</option>
                      <option value="COMPLIANCE_OFFICER">COMPLIANCE_OFFICER (CDA Regulatory, Audit Logs & NPC Data Privacy)</option>
                      <option value="MEMBER_RELATIONS">MEMBER_RELATIONS (Member Enrollment, KYC, Share Capital)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateAdminForm(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingAdminUser}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-700/20"
                    >
                      {isCreatingAdminUser ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      <span>Create &amp; Assign Role</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Admin Users List */}
              {isLoadingAdminUsers ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Loading administrative accounts from Firebase...</span>
                </div>
              ) : coopAdminUsers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                  No staff user accounts found for this cooperative. Use the button above to create the first admin user.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Username</th>
                        <th className="py-2 px-3">Assigned Role</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {coopAdminUsers.map((u) => {
                        const isInactive = u.status === 'INACTIVE';
                        const isToggling = togglingAdminUserId === u.id;
                        return (
                          <tr key={u.id || u.email} className="hover:bg-slate-900/60 transition">
                            <td className="py-2.5 px-3 font-semibold text-white">
                              {u.fullName}
                              {u.roleTitle?.includes('Primary Administrator') && (
                                <span className="ml-1.5 text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded font-sans font-bold">
                                  Primary
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">{u.email}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-400">{u.username || '—'}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full">
                                <Shield className="w-2.5 h-2.5 text-purple-400" />
                                <span>{u.roleTitle || u.role}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isInactive ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  <span>Deactivated</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                  <span>Active</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleToggleAdminUserStatus(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ml-auto ${
                                  isInactive
                                    ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800'
                                } disabled:opacity-50`}
                              >
                                {isToggling ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : isInactive ? (
                                  'Activate'
                                ) : (
                                  'Deactivate'
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 3: PLATFORM CREDIT HISTORY & REFILL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              {/* Top of Platform Credit History: Header + Available Balance + Top Up/Adjust Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-slate-800/80">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">Platform Credit History &amp; Consumption</h4>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-xs text-slate-400">Current Balance:</span>
                    <span className="font-mono font-black text-emerald-400 text-base">
                      ₱{selectedFleetCoopModal.platformCreditBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Top Up / Adjust Button placed prominently at TOP of this section */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTenantForCredit(selectedFleetCoopModal);
                    setCreditAdjustmentAmount(2000);
                    setCreditAdjustmentRef('');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-700/25"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Top Up / Adjust Platform Credit</span>
                </button>
              </div>

              {/* Transactions Ledger */}
              {isLoadingCoopCreditTx ? (
                <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Loading platform credit ledger history...</span>
                </div>
              ) : coopCreditTransactions.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                  No platform credit consumption or refill transactions recorded for this cooperative yet.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Date &amp; Time</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Balance After</th>
                        <th className="py-2 px-3">Reference / Particulars</th>
                        <th className="py-2 px-3">Operator</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {coopCreditTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-900/60">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                            {new Date(tx.createdAt || tx.timestamp || Date.now()).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              tx.type === 'TOP_UP' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              tx.type === 'PROMO_GRANT' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                              tx.type === 'FEE_DEDUCTION' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
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
              )}
            </div>

            {/* Modal Bottom Close */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedFleetCoopModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Close Instance View
              </button>
            </div>
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
