'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Lock,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  Coins,
  FileCheck2,
  Building2,
  Check,
  Camera,
  Upload,
  FileCheck,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { resolveTenantCoop, TenantInfo } from '../../tenant-utils';
import { getApiBaseUrl } from '../../api-config';

export default function MemberRegisterPage() {
  const router = useRouter();

  // 1: Personal Profile & Address | 2: Verification, PMES & Password | 3: Capital Pledge | 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Tenant Resolution State
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    slug: 'default',
    name: 'Cooperative Enterprise',
    isSubdomain: false,
    registrationNumber: 'CDA Registered',
    logoLetter: 'C',
    coopType: 'Multi-Purpose',
  });

  // Step 1: Personal Details & Broken-Down Free-text Address Fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | 'OTHER' | ''>('');
  const [civilStatus, setCivilStatus] = useState<'SINGLE' | 'MARRIED' | 'WIDOWED' | 'SEPARATED' | ''>('');
  const [country, setCountry] = useState('Philippines');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Step 2: Verification, ID Upload, Selfie, PMES & Password
  const [idType, setIdType] = useState('PhilSys National ID');
  const [idNumber, setIdNumber] = useState('');
  const [idFrontFile, setIdFrontFile] = useState<{ name: string; size: string; previewUrl: string } | null>(null);
  const [idFrontUploaded, setIdFrontUploaded] = useState(false);
  const idFileInputRef = useRef<HTMLInputElement>(null);

  // Live Facial Liveness Selfie State & Media Stream
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pmesConfirmed, setPmesConfirmed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  // Step 3: Capital Subscription Pledge (₱0 Upfront)
  const [parValuePerShare, setParValuePerShare] = useState<number>(100);
  const [subscribedShares, setSubscribedShares] = useState<number>(50);

  // Form Submission & UX States
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState('');

  useEffect(() => {
    const info = resolveTenantCoop();
    setTenantInfo(info);

    // Optionally load coop system config (e.g. stock par value)
    async function loadConfig() {
      try {
        const slug = info.slug || 'default';
        const res = await fetch(`${getApiBaseUrl()}/system-config`, {
          headers: { 'x-tenant-slug': slug },
        });
        if (res.ok) {
          const cfg = await res.json();
          if (cfg.success && cfg.data) {
            if (cfg.data.stockParValue) setParValuePerShare(Number(cfg.data.stockParValue));
            if (cfg.data.minSubscribedShares) setSubscribedShares(Number(cfg.data.minSubscribedShares));
          }
        }
      } catch (e) {}
    }
    loadConfig();
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const totalPledgedAmount = subscribedShares * parValuePerShare;

  const compressImageFile = (file: File, maxDimension = 1280, quality = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf' || file.type.includes('svg')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleIdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage('File size exceeds 15MB limit. Please upload a smaller image or PDF.');
        return;
      }
      const previewUrl = await compressImageFile(file, 1280, 0.85);
      setIdFrontFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        previewUrl,
      });
      setIdFrontUploaded(true);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please use a camera-enabled device.');
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
      setCameraError(err.message || 'Camera permission denied or camera not available. Please allow camera permissions to continue.');
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



  // Validation handlers
  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter your First Name and Last Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Email Address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your Mobile Number.');
      return;
    }
    if (!birthdate) {
      setErrorMessage('Please enter your Date of Birth.');
      return;
    }
    if (!city.trim()) {
      setErrorMessage('Please enter your City or Municipality.');
      return;
    }
    if (!barangay.trim()) {
      setErrorMessage('Please enter your Barangay.');
      return;
    }

    setStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!idNumber.trim()) {
      setErrorMessage('Please enter your Government ID Number.');
      return;
    }
    if (!idFrontFile && !idFrontUploaded) {
      setErrorMessage('Please upload a photo of your Government ID.');
      return;
    }
    if (!selfiePreview && !selfieUploaded) {
      setErrorMessage('Please capture or upload your Live Facial Liveness Selfie.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (!pmesConfirmed) {
      setErrorMessage('Please confirm that you have completed the Pre-Membership Education Seminar (PMES).');
      return;
    }
    if (!privacyAgreed) {
      setErrorMessage('Please confirm your consent under the Data Privacy Act.');
      return;
    }

    setStep(3);
  };

  const handleSubmitRegistration = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const slug = tenantInfo.slug || 'default';
      const cleanEmail = email.trim().toLowerCase();

      const res = await fetch(`${getApiBaseUrl()}/auth/member/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': slug,
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          lastName: lastName.trim(),
          username: cleanEmail,
          email: cleanEmail,
          phone: phone.trim(),
          birthdate,
          gender: gender || 'OTHER',
          civilStatus: civilStatus || 'SINGLE',
          country: country.trim() || 'Philippines',
          region: region.trim(),
          city: city.trim(),
          municipality: city.trim(),
          barangay: barangay.trim(),
          street: street.trim(),
          houseNumber: houseNumber.trim(),
          buildingNumber: houseNumber.trim(),
          zipCode: zipCode.trim(),
          zipcode: zipCode.trim(),
          address: [
            houseNumber.trim(),
            street.trim(),
            barangay.trim(),
            city.trim(),
            region.trim(),
            zipCode.trim(),
            country.trim() || 'Philippines',
          ].filter(Boolean).join(', '),
          password: password.trim(),
          pin: password.trim(),
          idType,
          idNumber: idNumber.trim(),
          idFrontFileName: idFrontFile?.name || 'government_id.jpg',
          idFrontPreview: idFrontFile?.previewUrl || null,
          selfiePreview: selfiePreview || null,
          completedPMES: true,
          agreedToPrivacyPolicy: true,
          subscribedShares,
          parValuePerShare,
          totalSubscribedAmount: totalPledgedAmount,
          initialDeposit: 0, // Pledge only: initial share capital is 0
          initialPaidUpAmount: 0,
          paymentMethod: 'PLEDGE',
          classification: 'ASSOCIATE',
          isDividendEligible: false,
          coopSlug: slug,
          coopName: tenantInfo.name,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsSubmitting(false);
        setErrorMessage(data.error || 'Failed to submit registration. Please verify your details.');
        return;
      }

      setApplicationId(data.application?.id || data.applicationId || `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setStep(4);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage('Unable to connect to the cooperative server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/40 text-slate-800 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Hidden File Inputs for ID & Camera Upload */}
      <input
        type="file"
        ref={idFileInputRef}
        accept="image/png,image/jpeg,image/webp,application/pdf"
        className="hidden"
        onChange={handleIdFileUpload}
      />


      {/* Minimal Header (with App Logo Emblem) */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2 sm:pt-4">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-600/20 shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt={tenantInfo.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <span className="sr-only">{tenantInfo.logoLetter}</span>
          </div>
          <div>
            <h1 className="font-extrabold text-base text-slate-900 leading-tight">
              {tenantInfo.name}
            </h1>
            <div className="text-[11px] text-slate-500 font-mono">
              {tenantInfo.registrationNumber}
            </div>
          </div>
        </div>

        <Link
          href={tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member/login?coop=${tenantInfo.slug}` : '/member/login'}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
        >
          Sign In
        </Link>
      </div>

      {/* Main Registration Card */}
      <div className="max-w-md w-full mx-auto my-auto py-4 sm:py-6">
        <div className="bg-white/95 backdrop-blur-md border border-emerald-100/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-emerald-950/5 space-y-5">
          {/* Progress Indicator (Steps 1 to 3) */}
          {step < 4 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  Step {step} of 3
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {step === 1 && 'Profile & Address'}
                  {step === 2 && 'Verification & PMES'}
                  {step === 3 && 'Capital Pledge'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${step >= 1 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${step >= 2 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                <div className={`h-full rounded-full transition-all duration-300 ${step >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`} />
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Personal Details & Free-Text Address */}
          {step === 1 && (
            <form onSubmit={handleNextFromStep1} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Member Registration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your personal and contact details to begin your membership.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Maria"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Santos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Middle Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Cruz"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0917 123 4567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Birthdate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e: any) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Broken-down Residential Address (All Free-Text Fields) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Residential Address <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Free text inputs</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Country (Default: Philippines) */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Country <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Philippines"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                    />
                  </div>

                  {/* Region */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. NCR / Region IV-A"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* City / Municipality */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      City / Municipality <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pasig City / Quezon City"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                    />
                  </div>

                  {/* Barangay */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Barangay <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      placeholder="e.g. San Antonio"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* House / Building Number */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      House / Building No.
                    </label>
                    <input
                      type="text"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="e.g. Unit 101 / Bldg 4"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                    />
                  </div>

                  {/* Street */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Street
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. Rizal Avenue"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                    />
                  </div>

                  {/* Zip Code */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="e.g. 1605"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                    />
                  </div>
                </div>

                {[houseNumber, street, barangay, city, region, zipCode, country].filter(Boolean).length > 0 && (
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Formatted Address Preview:</div>
                    <div className="text-xs text-slate-800 font-medium mt-0.5">
                      {[houseNumber, street, barangay, city, region, zipCode, country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <span>Continue to Verification</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Verification, PMES Checkbox & Password */}
          {step === 2 && (
            <form onSubmit={handleNextFromStep2} className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Verification & Credentials
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set your account password and confirm required seminar completion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Government ID Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  >
                    <option value="PhilSys National ID">PhilSys National ID</option>
                    <option value="Driver's License">Driver&apos;s License</option>
                    <option value="Passport">Passport</option>
                    <option value="SSS / GSIS UMID">SSS / GSIS UMID</option>
                    <option value="TIN ID">TIN ID</option>
                    <option value="Postal ID">Postal ID</option>
                    <option value="Voter's ID / Certificate">Voter&apos;s ID / Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    ID Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 1234-5678-9012"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Government ID Document Upload */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Government ID Photo <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  {idFrontUploaded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ID Attached
                    </span>
                  )}
                </div>

                {idFrontFile?.previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-white p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={idFrontFile.previewUrl}
                          alt="Government ID Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {idFrontFile.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {idFrontFile.size} • Verified Format
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => idFileInputRef.current?.click()}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Change Photo"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIdFrontFile(null);
                            setIdFrontUploaded(false);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => idFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl p-4 text-center cursor-pointer transition group"
                  >
                    <Upload className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 transition mb-1" />
                    <div className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                      Tap to upload Government ID photo
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      JPG, PNG, or WebP (max 10MB) • Ensure text is clear & legible
                    </div>
                  </div>
                )}
              </div>

              {/* Facial Liveness Selfie */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Facial Liveness Selfie <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  {selfieUploaded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Selfie Ready
                    </span>
                  )}
                </div>

                {cameraError && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center justify-between">
                    <span>{cameraError}</span>
                    <button
                      type="button"
                      onClick={() => setCameraError('')}
                      className="text-amber-600 hover:text-amber-800 font-bold ml-2"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {isCameraActive ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-56 mx-auto flex items-center justify-center border border-emerald-500/50 shadow-inner">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border-2 border-emerald-400/40 rounded-2xl pointer-events-none" />
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={captureSelfie}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Snap Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : selfiePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-300 bg-white p-2">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-emerald-400 ring-2 ring-emerald-500/20">
                        <img
                          src={selfiePreview}
                          alt="Selfie Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-800">
                          Live Selfie Captured
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Biometric verification ready
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Retake with Camera"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelfiePreview('');
                            setSelfieUploaded(false);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove Selfie"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl p-4 text-center cursor-pointer transition group bg-white flex flex-col items-center justify-center"
                    >
                      <Camera className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 transition mb-1" />
                      <div className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                        Take Live Selfie
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Live camera capture required for facial verification
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 outline-none transition"
                />
              </div>

              {/* PMES Confirmation Checkbox (No quiz details required) */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={pmesConfirmed}
                    onChange={(e) => setPmesConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="text-xs text-slate-800 leading-snug">
                    <span className="font-bold text-slate-900">Pre-Membership Education Seminar (PMES) Confirmation</span>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      I confirm that I have already completed the Pre-Membership Education Seminar (PMES) before registering as a member of this cooperative.
                    </p>
                  </div>
                </label>
              </div>

              {/* Data Privacy Act Consent Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <div className="text-[11px] text-slate-600 leading-snug">
                    I agree to the Cooperative Privacy Policy and give explicit informed consent under R.A. 10173 (Data Privacy Act of 2012).
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                >
                  <span>Continue to Capital Pledge</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Capital Subscription Pledge (₱0 Upfront) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Share Capital Subscription
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Commit your initial share subscription. No upfront payment required today.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Par Value per Share:</span>
                  <span className="font-bold text-slate-900 font-mono">₱{parValuePerShare.toFixed(2)}</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Subscribed Shares (Pledge):
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[20, 50, 100].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSubscribedShares(count)}
                        className={`py-2 rounded-xl border text-xs font-bold transition ${
                          subscribedShares === count
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {count} Shares
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Pledged Capital:</span>
                    <span className="font-bold font-mono text-slate-900">₱{totalPledgedAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-emerald-800">
                    <span className="font-bold">Initial Cash Payment Today:</span>
                    <span className="text-sm font-black font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-300">
                      ₱0.00 (Pledge Only)
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanatory Notice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span>No Upfront Deposit Required</span>
                </div>
                <p className="leading-relaxed">
                  Your initial share capital is set to <strong>₱0.00</strong>. Once your application is reviewed and verified by the cooperative committee, you can log in to the Member Portal and settle your share capital through the cooperative&apos;s available payment options.
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(2)}
                  className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitRegistration}
                  className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Application Submitted / Under Verification */}
          {step === 4 && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Application Submitted
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Thank you, <strong className="text-slate-800">{firstName} {lastName}</strong>! Your registration has been received.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Application Reference:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {applicationId}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Cooperative:</span>
                  <span className="font-bold text-slate-800">{tenantInfo.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Share Capital Pledge:</span>
                  <span className="font-bold text-slate-800">{subscribedShares} Shares (₱{totalPledgedAmount.toLocaleString()})</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Account Under Verification</span>
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Your application is currently under verification by the Membership &amp; Credit Committee. You will receive an SMS and email notification once your account is approved.
                </p>
                <p className="text-[11px] text-amber-800/90 leading-relaxed font-semibold pt-1">
                  Once verified, sign in to the Member Portal to settle your pledged initial share capital.
                </p>
              </div>

              <Link
                href={tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member/login?coop=${tenantInfo.slug}` : '/member/login'}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <span>Go to Member Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer (Identical to Member Login) */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 pb-2">
        <p>
          &copy; {new Date().getFullYear()} {tenantInfo.name}. Cooperative Member Onboarding.
        </p>
      </div>
    </div>
  );
}
