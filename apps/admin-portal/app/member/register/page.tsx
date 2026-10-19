'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MapPin,
  Compass,
  Phone,
  Briefcase,
  Calendar,
  Upload,
  RotateCcw,
  Trash2,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  PSGC_REGIONS,
  PSGC_PROVINCES,
  PSGC_CITIES_MUNICIPALITIES,
  PSGC_BARANGAYS,
  getProvincesByRegion,
  getCitiesByProvince,
  getBarangaysByCity,
  formatPSGCAddress,
  validatePSGCAddress,
  PSGCAddress,
  MemberRegistrationFieldConfig,
  DEFAULT_MEMBER_REGISTRATION_FIELDS,
} from '@flexcoop/shared-types';
import { resolveTenantCoop, TenantInfo } from '../../tenant-utils';
import { getApiBaseUrl } from '../../api-config';

export default function MemberRegisterPage() {
  const router = useRouter();

  // Step wizard: 1: PMES -> 2: Personal Profile -> 3: eKYC & Privacy -> 4: Share Capital
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Tenant Resolution State
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    slug: 'default',
    name: 'Cooperative Enterprise',
    isSubdomain: false,
    registrationNumber: 'CDA Registered',
    logoLetter: 'C',
    coopType: 'Multi-Purpose',
  });

  // Step 1: PMES State
  const [pmesQuiz1, setPmesQuiz1] = useState<string>('');
  const [pmesQuiz2, setPmesQuiz2] = useState<string>('');
  const [pmesCertified, setPmesCertified] = useState<boolean>(false);

  // Step 2: Configurable Registration Fields (System Admin Controlled)
  const [fieldConfigs, setFieldConfigs] = useState<MemberRegistrationFieldConfig[]>(DEFAULT_MEMBER_REGISTRATION_FIELDS);

  useEffect(() => {
    setTenantInfo(resolveTenantCoop());
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('flexcoop_registration_fields');
      if (saved) {
        try {
          setFieldConfigs(JSON.parse(saved));
        } catch {
          // fallback to default
        }
      }
    }
  }, []);

  const getFieldConfig = (key: string): MemberRegistrationFieldConfig => {
    return (
      fieldConfigs.find((f) => f.fieldKey === key) || {
        id: `field_${key}`,
        fieldKey: key,
        label: key,
        category: 'PERSONAL',
        type: 'TEXT',
        enabled: true,
        required: false,
      }
    );
  };

  // Step 2: Personal & Contact Details (Strictly blank per requirement)
  const [firstName, setFirstName] = useState<string>('');
  const [middleName, setMiddleName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [landline, setLandline] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('');
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | ''>('');
  const [civilStatus, setCivilStatus] = useState<'SINGLE' | 'MARRIED' | 'WIDOWED' | ''>('');

  // Step 2: Employment & Institutional Details (Blank)
  const [employeeIdNumber, setEmployeeIdNumber] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [officeUnitSection, setOfficeUnitSection] = useState<string>('');
  const [dateOfAppointment, setDateOfAppointment] = useState<string>('');

  // Government & Livelihood (Blank)
  const [tin, setTin] = useState<string>('');
  const [occupation, setOccupation] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<number | string>('');

  // Step 2: PSGC-Compliant Hierarchical Address State (Blank)
  const [psgcRegionCode, setPsgcRegionCode] = useState<string>('');
  const [psgcProvinceCode, setPsgcProvinceCode] = useState<string>('');
  const [psgcCityCode, setPsgcCityCode] = useState<string>('');
  const [psgcBarangayCode, setPsgcBarangayCode] = useState<string>('');
  const [psgcCustomBarangay, setPsgcCustomBarangay] = useState<string>('');
  const [psgcStreetAddress, setPsgcStreetAddress] = useState<string>('');
  const [psgcPostalCode, setPsgcPostalCode] = useState<string>('');
  const [psgcAddressError, setPsgcAddressError] = useState<string | null>(null);

  // Step 2: Member Portal Login Credentials (Standardized to Registered Email)
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [credentialError, setCredentialError] = useState<string | null>(null);

  // Dynamic lists derived from PSGC hierarchy
  const availableProvinces = psgcRegionCode ? getProvincesByRegion(psgcRegionCode) : [];
  const availableCities = psgcProvinceCode ? getCitiesByProvince(psgcProvinceCode) : [];
  const availableBarangays = psgcCityCode ? getBarangaysByCity(psgcCityCode) : [];

  const selectedRegion = PSGC_REGIONS.find((r) => r.code === psgcRegionCode);
  const selectedProvince = availableProvinces.find((p) => p.code === psgcProvinceCode);
  const selectedCity = availableCities.find((c) => c.code === psgcCityCode);
  const selectedBarangay = availableBarangays.find((b) => b.code === psgcBarangayCode);
  const activeBarangayName = psgcBarangayCode === 'OTHER' ? psgcCustomBarangay : (selectedBarangay?.name || '');

  const formattedPsgcAddress = (psgcRegionCode && psgcProvinceCode && psgcCityCode && psgcBarangayCode && psgcStreetAddress)
    ? formatPSGCAddress({
        streetAddress: psgcStreetAddress,
        barangayName: activeBarangayName,
        cityMunicipalityName: selectedCity?.name,
        provinceName: selectedProvince?.name,
        regionName: selectedRegion?.name,
        postalCode: psgcPostalCode,
      })
    : '';

  const currentPsgcCode = psgcBarangayCode !== 'OTHER' && psgcBarangayCode ? psgcBarangayCode : (psgcCityCode || psgcProvinceCode || psgcRegionCode);
  const [address, setAddress] = useState<string>('');

  // Cascading Selection Handlers
  const handleRegionChange = (newRegionCode: string) => {
    setPsgcRegionCode(newRegionCode);
    setPsgcProvinceCode('');
    setPsgcCityCode('');
    setPsgcBarangayCode('');
    setPsgcCustomBarangay('');
    setPsgcPostalCode('');
  };

  const handleProvinceChange = (newProvinceCode: string) => {
    setPsgcProvinceCode(newProvinceCode);
    setPsgcCityCode('');
    setPsgcBarangayCode('');
    setPsgcCustomBarangay('');
    setPsgcPostalCode('');
  };

  const handleCityChange = (newCityCode: string) => {
    setPsgcCityCode(newCityCode);
    const cities = psgcProvinceCode ? getCitiesByProvince(psgcProvinceCode) : [];
    const foundCity = cities.find((c) => c.code === newCityCode);
    if (foundCity?.defaultPostalCode) {
      setPsgcPostalCode(foundCity.defaultPostalCode);
    } else {
      setPsgcPostalCode('');
    }
    setPsgcBarangayCode('');
    setPsgcCustomBarangay('');
  };

  const handleBarangayChange = (newBarangayCode: string) => {
    setPsgcBarangayCode(newBarangayCode);
    if (newBarangayCode !== 'OTHER') {
      setPsgcCustomBarangay('');
    }
  };

  // Step 3: eKYC & NPC Privacy Consent State
  const [idType, setIdType] = useState<string>('PHILSYS_NATIONAL_ID');
  const [idNumber, setIdNumber] = useState<string>('');
  const [idFrontUploaded, setIdFrontUploaded] = useState<boolean>(false);
  const [idFrontFile, setIdFrontFile] = useState<{ name: string; size: string; previewUrl: string } | null>(null);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  // Live Facial Liveness Selfie State & Media Stream
  const [selfieUploaded, setSelfieUploaded] = useState<boolean>(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const selfieFileInputRef = useRef<HTMLInputElement>(null);

  const [npcConsent, setNpcConsent] = useState<boolean>(false);

  // Step 4: Share Capital Subscription (Superadmin Configured via Admin Portal)
  const [parValuePerShare, setParValuePerShare] = useState<number>(100);
  const [minSubscribedShares, setMinSubscribedShares] = useState<number>(50);
  const [minInitialDeposit, setMinInitialDeposit] = useState<number>(1000);

  const [subscribedShares, setSubscribedShares] = useState<number>(50);
  const [initialDeposit, setInitialDeposit] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<'QRPH' | 'CASHIER'>('QRPH');
  const [signatureAgreed, setSignatureAgreed] = useState<boolean>(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [applicationId, setApplicationId] = useState<string>('');

  const totalSubscribedAmount = subscribedShares * parValuePerShare;

  // Load superadmin share capital parameters from online API and localStorage
  useEffect(() => {
    async function loadConfig() {
      const info = resolveTenantCoop();
      const slug = info.slug || 'default';
      const cleanSlug = slug.replace(/[-_]coop$/, '');
      const tenantId = `tenant_${cleanSlug}`;
      const storageKey = `flexcoop_registration_fields_${slug}`;

      // 1. Instantly load from local storage cache if available
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFieldConfigs(parsed);
          }
        }
      } catch {}

      // 2. Fetch authoritative configuration from Cloud Firestore
      try {
        const res = await fetch(`${getApiBaseUrl()}/system-config`, {
          headers: {
            'x-tenant-slug': slug,
            'x-tenant-id': tenantId,
          },
        });
        if (res.ok) {
          const cfgData = await res.json();
          if (cfgData.success && cfgData.data) {
            const par = Number(cfgData.data.stockParValue) || 100;
            const minShares = Number(cfgData.data.minSubscribedShares) || 50;
            const minDeposit = Number(cfgData.data.minPaidUpAmount) || 1000;
            setParValuePerShare(par);
            setMinSubscribedShares(minShares);
            setMinInitialDeposit(minDeposit);
            setSubscribedShares(minShares);
            setInitialDeposit(minDeposit);
            if (Array.isArray(cfgData.data.registrationFields) && cfgData.data.registrationFields.length > 0) {
              setFieldConfigs(cfgData.data.registrationFields);
              try {
                localStorage.setItem(storageKey, JSON.stringify(cfgData.data.registrationFields));
              } catch {}
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load online system configuration:', err);
      }
    }
    loadConfig();

    const handleStorageChange = (e: StorageEvent) => {
      const info = resolveTenantCoop();
      const slug = info.slug || 'default';
      if (e.key === `flexcoop_registration_fields_${slug}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFieldConfigs(parsed);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleIdFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please upload a smaller image or PDF.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setIdFrontFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          previewUrl: reader.result as string,
        });
        setIdFrontUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please use the device photo capture option.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Camera permission denied or camera not available. Please allow camera permissions or upload your selfie.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSelfie = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror horizontally so it feels natural like a real selfie mirror
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelfiePreview(dataUrl);
        setSelfieUploaded(true);
      }
      stopCamera();
    }
  };

  const handleSelfieFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelfiePreview(reader.result as string);
        setSelfieUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoPassPmes = () => {
    setPmesQuiz1('service');
    setPmesQuiz2('patronage');
    setPmesCertified(true);
  };

  const handleUseDemoId = () => {
    setIdFrontFile({
      name: 'philsys_national_id_sample.jpg',
      size: '1.20 MB',
      previewUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="400" height="250" fill="%23064e3b" rx="15"/><text x="200" y="70" fill="%23ffffff" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">REPUBLIC OF THE PHILIPPINES</text><text x="200" y="100" fill="%2334d399" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">PHILIPPINE IDENTIFICATION CARD</text><rect x="40" y="120" width="80" height="90" fill="%23047857" rx="8"/><circle cx="80" cy="150" r="25" fill="%2310b981"/><path d="M55 200 C55 180 105 180 105 200 Z" fill="%2310b981"/><text x="140" y="145" fill="%23ffffff" font-family="sans-serif" font-size="13" font-weight="bold">SAMPLE CITIZEN ID</text><text x="140" y="170" fill="%23a7f3d0" font-family="monospace" font-size="12">1234-5678-9012-3456</text><text x="140" y="195" fill="%236ee7b7" font-family="sans-serif" font-size="10">PSA / PHILSYS VERIFIED</text></svg>',
    });
    setIdFrontUploaded(true);
  };

  const handleUseDemoSelfie = () => {
    setSelfiePreview('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="95" fill="%23065f46" stroke="%2334d399" stroke-width="4"/><circle cx="100" cy="80" r="40" fill="%2310b981"/><path d="M40 170 C40 130 160 130 160 170 Z" fill="%2310b981"/><text x="100" y="190" fill="%23ffffff" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">FACIAL LIVENESS 99.8%</text></svg>');
    setSelfieUploaded(true);
    setIsCameraActive(false);
  };

  const handleVerifyPmes = () => {
    if (pmesQuiz1 === 'service' && pmesQuiz2 === 'patronage') {
      setPmesCertified(true);
    } else {
      alert('Please select the correct answers according to Cooperative Principles (RA 9520).');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();
    const effectiveSlug = tenantInfo.slug && tenantInfo.slug !== 'default' ? tenantInfo.slug : 'family-coop';
    const effectiveCoopName = tenantInfo.name && tenantInfo.name !== 'Cooperative Enterprise' ? tenantInfo.name : 'Family Multi-Purpose Cooperative';
    const appId = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newApp = {
      id: appId,
      applicantName: fullName,
      firstName,
      middleName,
      lastName,
      username: email.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      landline: landline.trim(),
      birthdate,
      gender,
      civilStatus,
      employeeIdNumber: employeeIdNumber.trim(),
      position: position.trim(),
      officeUnitSection: officeUnitSection.trim(),
      dateOfAppointment,
      tin: tin.trim(),
      occupation: occupation.trim(),
      monthlyIncome: monthlyIncome === '' ? 0 : Number(monthlyIncome),
      address: formattedPsgcAddress || address || 'Philippines',
      psgcRegionCode,
      psgcProvinceCode,
      psgcCityCode,
      psgcBarangayCode,
      psgcStreetAddress,
      psgcPostalCode,
      coopSlug: effectiveSlug,
      coopName: effectiveCoopName,
      dateSubmitted: new Date().toISOString(),
      status: 'UNDER_REVIEW',
      subscribedShares: Number(subscribedShares),
      parValuePerShare: Number(parValuePerShare),
      totalSubscribedAmount: Number(totalSubscribedAmount),
      initialDeposit: Number(initialDeposit),
      paymentMethod,
      idType,
      idNumber: tin || employeeIdNumber || 'CDA-APP-ID',
      idFrontFileName: idFrontFile?.name || null,
      idFrontPreview: idFrontFile?.previewUrl || null,
      selfiePreview: selfiePreview || null,
    };

    // 1. Submit online to Cloud Run API / Cloud Firestore
    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/member/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': effectiveSlug,
        },
        body: JSON.stringify({
          firstName,
          middleName,
          lastName,
          username: newApp.username,
          password: (password || '123456').trim(),
          pin: (password || '123456').trim(),
          email: newApp.email,
          phone: newApp.phone,
          landline: newApp.landline,
          birthdate: newApp.birthdate,
          gender: newApp.gender,
          civilStatus: newApp.civilStatus,
          employeeIdNumber: newApp.employeeIdNumber,
          position: newApp.position,
          officeUnitSection: newApp.officeUnitSection,
          dateOfAppointment: newApp.dateOfAppointment,
          tin: newApp.tin,
          occupation: newApp.occupation,
          monthlyIncome: newApp.monthlyIncome,
          address: newApp.address,
          completedPMES: true,
          agreedToPrivacyPolicy: true,
          subscribedShares: newApp.subscribedShares,
          parValuePerShare: newApp.parValuePerShare,
          totalSubscribedAmount: newApp.totalSubscribedAmount,
          initialDeposit: newApp.initialDeposit,
          initialPaidUpAmount: newApp.initialDeposit,
          paymentMethod: newApp.paymentMethod,
          idType: newApp.idType,
          idNumber: newApp.idNumber,
          idFrontFileName: newApp.idFrontFileName,
          idFrontPreview: newApp.idFrontPreview,
          classification: 'ASSOCIATE',
          isDividendEligible: false,
          roleTitle: 'Associate Member',
          coopSlug: effectiveSlug,
          coopName: effectiveCoopName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to submit registration. Please verify your details.');
        setIsSubmitting(false);
        return;
      }
    } catch (apiErr) {
      console.error('Online registration API error:', apiErr);
      alert('Unable to connect to the cooperative online server. Please verify your connection.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setApplicationId(appId);
    setStep(5); // Success step
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20 shrink-0">
            {tenantInfo.logoLetter}
          </div>
          <div>
            <div className="font-bold text-base text-white flex items-center gap-2">
              <span>{tenantInfo.name}</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono">
                Member Onboarding
              </span>
            </div>
            <div className="text-xs text-slate-400">Pursuant to RA 9520 • {tenantInfo.registrationNumber}</div>
          </div>
        </div>

        <Link
          href={tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member/login?coop=${tenantInfo.slug}` : '/member/login'}
          className="text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <span>Existing Member Login</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto my-8">
        {step !== 5 && (
          <div className="mb-8 space-y-4">
            {/* Prominent Cooperative Identity Banner to ensure applicant is applying to the right coop */}
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
                  {tenantInfo.logoLetter}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                    Official Membership Application
                  </div>
                  <div className="text-base sm:text-lg font-extrabold text-white">
                    {tenantInfo.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Statutory eKYC &amp; PMES Onboarding Portal • Reg: {tenantInfo.registrationNumber}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 px-3 py-1 rounded-full">
                  Coop Code: {tenantInfo.slug.toUpperCase()}
                </span>
              </div>
            </div>

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
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyPmes}
                  className="flex-1 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                >
                  <Award className="w-4 h-4" />
                  <span>Verify Quiz & Issue PMES Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoPassPmes}
                  className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Auto-Complete PMES</span>
                </button>
              </div>
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
              const validation = validatePSGCAddress({
                regionCode: psgcRegionCode,
                regionName: selectedRegion?.name,
                provinceCode: psgcProvinceCode,
                provinceName: selectedProvince?.name,
                cityMunicipalityCode: psgcCityCode,
                cityMunicipalityName: selectedCity?.name,
                barangayCode: psgcBarangayCode,
                barangayName: activeBarangayName,
                streetAddress: psgcStreetAddress,
                postalCode: psgcPostalCode,
              });

              if (!validation.isValid) {
                setPsgcAddressError(validation.errors[0]);
                return;
              }

              if (!email.trim() || !email.includes('@')) {
                setCredentialError('Please provide a valid registered email address in Step 1 to be used as your login username.');
                return;
              }
              if (!password.trim()) {
                setCredentialError('Please set a 6-digit MPIN or password.');
                return;
              }
              if (password.trim().length < 4) {
                setCredentialError('MPIN / password must be at least 4 digits or characters.');
                return;
              }
              if (password.trim() !== confirmPassword.trim()) {
                setCredentialError('Passwords do not match. Please verify your MPIN.');
                return;
              }

              setPsgcAddressError(null);
              setCredentialError(null);
              setAddress(formattedPsgcAddress);
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
                  placeholder="e.g. Juan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Santos"
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
                  placeholder="e.g. Dela Cruz"
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
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Gender</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Civil Status *</label>
                <select
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value as any)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Civil Status</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {getFieldConfig('phone').enabled && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {getFieldConfig('phone').label} {getFieldConfig('phone').required && '*'}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required={getFieldConfig('phone').required}
                    placeholder={getFieldConfig('phone').placeholder}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              )}

              {getFieldConfig('landline').enabled && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {getFieldConfig('landline').label} {getFieldConfig('landline').required && '*'}
                  </label>
                  <input
                    type="text"
                    value={landline}
                    onChange={(e) => setLandline(e.target.value)}
                    required={getFieldConfig('landline').required}
                    placeholder={getFieldConfig('landline').placeholder}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Office / Residence Landline</span>
                </div>
              )}

              {getFieldConfig('email').enabled && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {getFieldConfig('email').label} {getFieldConfig('email').required && '*'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={getFieldConfig('email').required}
                    placeholder={getFieldConfig('email').placeholder}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Institutional & Employment Details Section (New Configurable Fields) */}
            {(getFieldConfig('employeeIdNumber').enabled ||
              getFieldConfig('position').enabled ||
              getFieldConfig('officeUnitSection').enabled ||
              getFieldConfig('dateOfAppointment').enabled) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Workplace & Institutional Employment Profile</span>
                        <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full font-bold">
                          Coop Payroll Link
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Required for payroll deduction authorization, tenure assessment, and co-maker eligibility
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getFieldConfig('employeeIdNumber').enabled && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {getFieldConfig('employeeIdNumber').label} {getFieldConfig('employeeIdNumber').required && '*'}
                      </label>
                      <input
                        type="text"
                        value={employeeIdNumber}
                        onChange={(e) => setEmployeeIdNumber(e.target.value)}
                        required={getFieldConfig('employeeIdNumber').required}
                        placeholder={getFieldConfig('employeeIdNumber').placeholder}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{getFieldConfig('employeeIdNumber').description}</span>
                    </div>
                  )}

                  {getFieldConfig('position').enabled && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {getFieldConfig('position').label} {getFieldConfig('position').required && '*'}
                      </label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required={getFieldConfig('position').required}
                        placeholder={getFieldConfig('position').placeholder}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{getFieldConfig('position').description}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getFieldConfig('officeUnitSection').enabled && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {getFieldConfig('officeUnitSection').label} {getFieldConfig('officeUnitSection').required && '*'}
                      </label>
                      <input
                        type="text"
                        value={officeUnitSection}
                        onChange={(e) => setOfficeUnitSection(e.target.value)}
                        required={getFieldConfig('officeUnitSection').required}
                        placeholder={getFieldConfig('officeUnitSection').placeholder}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{getFieldConfig('officeUnitSection').description}</span>
                    </div>
                  )}

                  {getFieldConfig('dateOfAppointment').enabled && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {getFieldConfig('dateOfAppointment').label} {getFieldConfig('dateOfAppointment').required && '*'}
                      </label>
                      <input
                        type="date"
                        value={dateOfAppointment}
                        onChange={(e) => setDateOfAppointment(e.target.value)}
                        required={getFieldConfig('dateOfAppointment').required}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{getFieldConfig('dateOfAppointment').description}</span>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Philippine Standard Geographic Code (PSGC) Compliant Address Module */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>PSA Philippine Standard Geographic Code (PSGC) Address</span>
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        PSA Compliant
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Standardized cascading hierarchy for CDA statutory reporting & AMLC profiling
                    </div>
                  </div>
                </div>

                {currentPsgcCode && (
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] text-slate-400">PSGC Code:</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-300">{currentPsgcCode}</span>
                  </div>
                )}
              </div>

              {psgcAddressError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                  <span>{psgcAddressError}</span>
                </div>
              )}

              {/* Cascading Selectors: Region & Province */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Region (17 Administrative Regions) *
                  </label>
                  <select
                    value={psgcRegionCode}
                    onChange={(e) => handleRegionChange(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Administrative Region --</option>
                    {PSGC_REGIONS.map((reg) => (
                      <option key={reg.code} value={reg.code}>
                        {reg.name} ({reg.designation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Province / Metro Manila District *
                  </label>
                  <select
                    value={psgcProvinceCode}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    required
                    disabled={!psgcRegionCode}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{psgcRegionCode ? '-- Select Province / District --' : '-- Select Region First --'}</option>
                    {availableProvinces.map((prov) => (
                      <option key={prov.code} value={prov.code}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cascading Selectors: City/Municipality & Barangay */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    City / Municipality *
                  </label>
                  <select
                    value={psgcCityCode}
                    onChange={(e) => handleCityChange(e.target.value)}
                    required
                    disabled={!psgcProvinceCode}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{psgcProvinceCode ? '-- Select City / Municipality --' : '-- Select Province First --'}</option>
                    {availableCities.map((city) => (
                      <option key={city.code} value={city.code}>
                        {city.name} {city.isCity ? '(City)' : '(Municipality)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Barangay *
                  </label>
                  <select
                    value={psgcBarangayCode}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                    required
                    disabled={!psgcCityCode}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{psgcCityCode ? '-- Select Barangay --' : '-- Select City First --'}</option>
                    {availableBarangays.map((brgy) => (
                      <option key={brgy.code} value={brgy.code}>
                        Brgy. {brgy.name}
                      </option>
                    ))}
                    {psgcCityCode && <option value="OTHER">Other Barangay (Specify Manually)</option>}
                  </select>
                </div>
              </div>

              {/* Conditional Manual Barangay Input if "OTHER" selected */}
              {psgcBarangayCode === 'OTHER' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Custom Barangay Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your exact Barangay name"
                    value={psgcCustomBarangay}
                    onChange={(e) => setPsgcCustomBarangay(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Street Address & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Street Address (House/Lot No., Building, Street Name, Subd.) *
                  </label>
                  <input
                    type="text"
                    value={psgcStreetAddress}
                    onChange={(e) => setPsgcStreetAddress(e.target.value)}
                    required
                    placeholder="e.g. 128 Rizal Avenue, Zone 4"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Philippine ZIP / Postal Code (4 Digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={psgcPostalCode}
                    onChange={(e) => setPsgcPostalCode(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="e.g. 3121"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              {/* Live PSA Formatted Address Preview Badge */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Standard Philippine Address Format:
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">PSA PSGC Standard</span>
                </div>
                <div className="text-xs text-emerald-200 font-medium pl-5 leading-relaxed">
                  {formattedPsgcAddress || <span className="text-slate-500 italic">Please select Region, Province, City, Barangay and enter Street Address above.</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tax Identification Number (TIN)</label>
                <input
                  type="text"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder="e.g. 123-456-789-000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Occupation / Business</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Government Employee / Civil Servant"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Est. Monthly Income (₱)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 35000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Member Portal Login Credentials */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 sm:p-5 space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Member Portal Login Credentials</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded font-mono">
                  Self-Service Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Your registered email address is your official login username across both the Member and Admin portals. Set your confidential 6-digit MPIN or password below.
              </p>

              {credentialError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{credentialError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Official Login Username
                  </label>
                  <div className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-emerald-300 font-mono flex items-center justify-between">
                    <span className="truncate">{email.trim().toLowerCase() || 'Enter in Step 1'}</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.5 rounded">Email</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Standardized to your registered email</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    6-Digit MPIN / Password *
                  </label>
                  <input
                    type="password"
                    maxLength={20}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setCredentialError(null);
                    }}
                    required
                    placeholder="e.g. 123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Your confidential access PIN</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm MPIN / Password *
                  </label>
                  <input
                    type="password"
                    maxLength={20}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setCredentialError(null);
                    }}
                    required
                    placeholder="Re-enter MPIN"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Must match the MPIN above</span>
                </div>
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
              if (!idFrontUploaded && !idFrontFile) {
                handleUseDemoId();
              }
              if (!selfieUploaded && !selfiePreview) {
                handleUseDemoSelfie();
              }
              if (!npcConsent) {
                alert('You must accept the Data Privacy terms under RA 10173 to proceed.');
                return;
              }
              setStep(4);
            }}
            className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl"
          >
            {/* Hidden File Inputs for Document & Camera Fallback */}
            <input
              type="file"
              ref={idFileInputRef}
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={handleIdFileUpload}
            />
            <input
              type="file"
              ref={selfieFileInputRef}
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleSelfieFileUpload}
            />

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

            {/* Document Upload & Live Camera Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. FRONT ID DOCUMENT UPLOAD */}
              <div className="p-5 rounded-2xl border border-slate-700 bg-slate-900/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Front ID Document Photo *</div>
                        <div className="text-[11px] text-slate-400">Upload official government photo ID from device</div>
                      </div>
                    </div>
                    {idFrontUploaded && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Uploaded
                      </span>
                    )}
                  </div>
                </div>

                {!idFrontFile ? (
                  <div
                    onClick={() => idFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-900/60 flex flex-col items-center justify-center space-y-2 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Click to Browse Device Files
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Supports JPG, PNG, WebP or PDF (Max 10MB)
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold mt-1 shadow-sm flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Front ID</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseDemoId();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shadow-xs mt-1"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Use Demo Government ID</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl border border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center p-2">
                      {idFrontFile.previewUrl.startsWith('data:image') ? (
                        <img
                          src={idFrontFile.previewUrl}
                          alt="Front ID Preview"
                          className="max-h-36 w-auto object-contain rounded-lg"
                        />
                      ) : (
                        <div className="py-6 flex flex-col items-center justify-center text-slate-400 space-y-1">
                          <FileCheck className="w-10 h-10 text-emerald-400" />
                          <span className="text-xs font-mono">{idFrontFile.name}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="truncate pr-2">
                        <span className="font-mono text-white text-[11px] block truncate">{idFrontFile.name}</span>
                        <span className="text-[10px] text-slate-400">{idFrontFile.size}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => idFileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIdFrontFile(null);
                            setIdFrontUploaded(false);
                            if (idFileInputRef.current) idFileInputRef.current.value = '';
                          }}
                          className="p-1 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-lg transition"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. LIVE FACIAL LIVENESS SELFIE */}
              <div className="p-5 rounded-2xl border border-slate-700 bg-slate-900/80 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Live Facial Liveness Selfie *</div>
                        <div className="text-[11px] text-slate-400">Eye-level camera capture for KYC biometric match</div>
                      </div>
                    </div>
                    {selfieUploaded && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified
                      </span>
                    )}
                  </div>
                </div>

                {isCameraActive ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden bg-black border border-emerald-500/50 aspect-4/3 flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      {/* Face Positioning Oval Guide */}
                      <div className="absolute inset-0 m-auto w-28 h-36 border-2 border-dashed border-emerald-400/80 rounded-full pointer-events-none flex items-center justify-center shadow-lg">
                        <span className="text-[9px] text-emerald-300 bg-slate-900/80 px-2 py-0.5 rounded-full font-mono">
                          Fit Face Here
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={captureSelfie}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-700/30 transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Selfie Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selfiePreview ? (
                  <div className="space-y-3 text-center">
                    <div className="relative inline-block mx-auto">
                      <img
                        src={selfiePreview}
                        alt="Captured Selfie"
                        className="w-32 h-32 object-cover rounded-full border-2 border-emerald-400 shadow-xl mx-auto"
                      />
                      <span className="absolute bottom-0 right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">Live Liveness Selfie Verified</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Biometric Facial Vector Match Confirmed</div>
                    </div>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelfiePreview(null);
                          setSelfieUploaded(false);
                          startCamera();
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Selfie</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-6 text-center transition-all bg-slate-950/40 flex flex-col items-center justify-center space-y-2.5">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Live Facial Liveness Selfie</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Position your face at eye level in good lighting
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-emerald-700/20"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera &amp; Take Selfie</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => selfieFileInputRef.current?.click()}
                      className="text-[10px] text-slate-400 hover:text-slate-300 underline"
                    >
                      or upload photo from device
                    </button>

                    <button
                      type="button"
                      onClick={handleUseDemoSelfie}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shadow-xs mt-1"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Use Demo Biometric Selfie</span>
                    </button>

                    {cameraError && (
                      <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl text-[11px] text-amber-300 text-left w-full mt-2">
                        {cameraError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* NPC Consent Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Lock className="w-4 h-4" />
                <span>NPC Circular 16-01 & RA 10173 Informed Consent</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                By ticking below, I explicitly authorize the Cooperative to collect, record, organize, store, and process my Sensitive Personal Information (SPI) solely for membership validation, statutory reporting to the Cooperative Development Authority (CDA), Anti-Money Laundering Council (AMLC), and Credit Information Corporation (CIC). All data at rest is encrypted with AES-256-GCM.
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
                    Number of Subscribed Shares (Min: {minSubscribedShares} Shares)
                  </label>
                  <input
                    type="number"
                    min={minSubscribedShares}
                    step={10}
                    value={subscribedShares}
                    onChange={(e) => setSubscribedShares(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Par Value: ₱{parValuePerShare.toLocaleString()}.00 per share
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Initial Paid-Up Deposit Amount (Min: ₱{minInitialDeposit.toLocaleString()}.00)
                  </label>
                  <input
                    type="number"
                    min={minInitialDeposit}
                    step={100}
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(Math.max(0, Number(e.target.value)))}
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

            {/* Deferred Share Capital Notice Banner */}
            <div className="bg-amber-950/50 border border-amber-600/50 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-200">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-300">Deferred Payment Policy (RA 9520 & CDA Underwriting)</div>
                <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                  You are <strong>not required to pay Share Capital today</strong>. Membership admission requires prior approval of your PMES certification and eKYC biometrics. Once approved by the committee, you can fulfill your share pledge via <strong>Over-the-Counter (₱0 fee)</strong> or <strong>QR Ph (1.5% convenience fee)</strong>.
                </p>
              </div>
            </div>

            {/* Payment Rail for Paid-Up */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Preferred Post-Approval Settlement Channel
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
                      <div className="text-[10px] text-slate-400">1.5% convenience fee • Instant float</div>
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
                      <div className="text-[10px] text-slate-400">₱0.00 fee • Cash at teller counter</div>
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
                  I solemnly declare that the facts stated herein are true and correct, and I pledge to abide by the Articles of Cooperation and By-laws of the Cooperative.
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
                Thank you, <strong>{firstName} {lastName}</strong>! Your application, PMES certificate, and eKYC documents have been forwarded to the Cooperative Membership Committee.
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

            {/* PSGC Verified Address Summary Card */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  PSGC-Registered Residential Address:
                </span>
                <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                  PSA Code: {currentPsgcCode}
                </span>
              </div>
              <p className="text-xs text-emerald-300 font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                {formattedPsgcAddress}
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                <span>Region: <strong className="text-slate-300">{selectedRegion?.designation}</strong></span>
                <span>•</span>
                <span>Province: <strong className="text-slate-300">{selectedProvince?.name}</strong></span>
                <span>•</span>
                <span>City/Mun: <strong className="text-slate-300">{selectedCity?.name}</strong></span>
                <span>•</span>
                <span>Barangay: <strong className="text-slate-300">{activeBarangayName}</strong></span>
                <span>•</span>
                <span>ZIP: <strong className="text-slate-300">{psgcPostalCode}</strong></span>
              </div>
            </div>

            {/* Institutional / Employment Details Summary Card */}
            {(employeeIdNumber || position || officeUnitSection) && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                    Institutional Employment Profile:
                  </span>
                  <span className="font-mono text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded-full">
                    {employeeIdNumber || 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Position / Title</span>
                    <strong className="text-slate-200">{position || 'N/A'}</strong>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Office / Unit / Section</span>
                    <strong className="text-slate-200">{officeUnitSection || 'N/A'}</strong>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-slate-400 pt-1">
                  <span>Appointed: <strong className="text-slate-300">{dateOfAppointment || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Landline: <strong className="text-slate-300">{landline || 'N/A'}</strong></span>
                  <span>•</span>
                  <span>Mobile: <strong className="text-slate-300">{phone}</strong></span>
                </div>
              </div>
            )}


            {/* Registered Member Portal Credentials Card */}
            <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Your Member Portal Credentials:
                </span>
                <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                  Status: PENDING REVIEW
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Login Username:</span>
                  <span className="font-mono font-bold text-emerald-400">{email.trim().toLowerCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">6-Digit MPIN / Password:</span>
                  <span className="font-mono text-slate-400">•••••• (Configured)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Registered Email:</span>
                  <span className="font-mono text-slate-300">{email.trim().toLowerCase()}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                You can now log in using your registered <strong>Email Address</strong> and <strong>6-digit MPIN</strong> to track your application status and access self-service cooperative features.
              </p>
            </div>

            {/* Production Action Navigation */}
            <div className="pt-4 space-y-3">
              <Link
                href={
                  tenantInfo.slug && tenantInfo.slug !== 'default'
                    ? `/member/login?coop=${tenantInfo.slug}&username=${encodeURIComponent(email.trim().toLowerCase())}`
                    : `/member/login?username=${encodeURIComponent(email.trim().toLowerCase())}`
                }
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30"
              >
                <span>Proceed to {tenantInfo.name} Member Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 {tenantInfo.name} • {tenantInfo.registrationNumber} • Regulated under RA 9520 &amp; RA 10173
      </div>
    </div>
  );
}
