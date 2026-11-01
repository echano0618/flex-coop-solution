'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  AlertCircle,
  Fingerprint,
  ShieldCheck,
  X,
  CheckCircle2,
  Download,
  Smartphone,
  Share2,
  PlusSquare,
} from 'lucide-react';
import { getApiBaseUrl } from '../../api-config';
import {
  resolveTenantCoop,
  setTenantMemberSession,
  getTenantMemberSession,
  setTenantAdminSession,
  clearTenantAdminSession,
  TenantInfo,
  base64UrlToUint8Array,
} from '../../tenant-utils';

export default function MemberLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [biometricsMember, setBiometricsMember] = useState<{
    id?: string;
    memberNumber?: string;
    name?: string;
    identifier?: string;
    credentialId?: string;
    rpId?: string;
  } | null>(null);
  const [isBioAuthenticating, setIsBioAuthenticating] = useState<boolean>(false);

  // PWA Device Installation State
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(true);
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isIosDevice, setIsIosDevice] = useState<boolean>(false);
  const [allowWebLogin, setAllowWebLogin] = useState<boolean>(false);

  // Google Sign-In State (Tuntong Tech Central Firebase: 581563779021)
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState<boolean>(false);

  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    slug: 'default',
    name: 'Cooperative Enterprise',
    isSubdomain: false,
    registrationNumber: 'CDA Registered',
    logoLetter: 'C',
    coopType: 'Multi-Purpose',
  });

  React.useEffect(() => {
    setHasMounted(true);
    const info = resolveTenantCoop();
    setTenantInfo(info);

    try {
      if (typeof window !== 'undefined') {
        // Detect standalone PWA mode or previously recorded installation
        const isStandalone =
          window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          window.matchMedia('(display-mode: minimal-ui)').matches ||
          (window.navigator as any).standalone === true ||
          document.referrer.includes('android-app://');

        const wasInstalled = localStorage.getItem('silong_pwa_installed') === 'true';

        const ua = window.navigator.userAgent.toLowerCase();
        const isApple =
          /iphone|ipad|ipod/.test(ua) ||
          (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
        setIsIosDevice(isApple);

        if (isStandalone || wasInstalled) {
          setIsAppInstalled(true);
        } else {
          setIsAppInstalled(false);
        }

        if ('getInstalledRelatedApps' in navigator) {
          (navigator as any)
            .getInstalledRelatedApps()
            .then((relatedApps: any[]) => {
              if (Array.isArray(relatedApps) && relatedApps.length > 0) {
                setIsAppInstalled(true);
                localStorage.setItem('silong_pwa_installed', 'true');
              }
            })
            .catch(() => {});
        }

        const handleBeforeInstallPrompt = (e: any) => {
          e.preventDefault();
          setDeferredPrompt(e);
          setIsAppInstalled(false);
        };

        const handleAppInstalled = () => {
          setIsAppInstalled(true);
          localStorage.setItem('silong_pwa_installed', 'true');
          setDeferredPrompt(null);
          setShowInstallModal(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Detect saved biometric login session for device
        const bioKey = `flexcoop_biometrics_enabled_${info.slug}`;
        const memberKey = `flexcoop_biometrics_member_${info.slug}`;
        const bioEnabled = localStorage.getItem(bioKey) === 'true';
        const savedMember = localStorage.getItem(memberKey);
        if (bioEnabled && savedMember) {
          try {
            const parsed = JSON.parse(savedMember);
            if (parsed && (parsed.identifier || parsed.memberNumber || parsed.id)) {
              setBiometricsMember(parsed);
              setHasBiometrics(true);
            }
          } catch {}
        }

        const existing = getTenantMemberSession(info.slug);
        if (existing) {
          router.replace(info.slug && info.slug !== 'default' ? `/member?coop=${info.slug}` : '/member');
        }

        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          window.removeEventListener('appinstalled', handleAppInstalled);
        };
      }
    } catch (e) {}
  }, [router]);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsAppInstalled(true);
          localStorage.setItem('silong_pwa_installed', 'true');
          setAllowWebLogin(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricsMember) return;
    setErrorMessage('');
    setIsBioAuthenticating(true);

    try {
      // 1. Invoke device biometric prompt (WebAuthn credentials get)
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          const getPublicKey: any = {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname,
          };

          if (biometricsMember.credentialId) {
            try {
              getPublicKey.allowCredentials = [
                {
                  type: 'public-key',
                  id: base64UrlToUint8Array(biometricsMember.credentialId),
                  transports: ['internal'],
                },
              ];
            } catch (convErr) {
              console.warn('Error converting credentialId:', convErr);
            }
          }

          await navigator.credentials.get({
            publicKey: getPublicKey,
          });
        } catch (credErr: any) {
          console.warn('WebAuthn get error:', credErr);
          setIsBioAuthenticating(false);
          const errName = credErr?.name || '';
          const errMsg = String(credErr?.message || '').toLowerCase();
          if (errName === 'NotAllowedError' && (errMsg.includes('cancel') || errMsg.includes('abort'))) {
            setErrorMessage('Biometric verification cancelled.');
          } else {
            setErrorMessage(
              'No biometric passkey found on this device. Please continue with Google Sign-In.'
            );
          }
          return;
        }
      }

      // 2. Perform authenticated biometric login via API
      const bioId = biometricsMember.identifier || biometricsMember.memberNumber || biometricsMember.id || 'mem_0001';
      const res = await fetch(`${getApiBaseUrl()}/auth/member/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantInfo.slug,
        },
        body: JSON.stringify({
          identifier: bioId,
          biometricAuth: true,
          tenantSlug: tenantInfo.slug,
          targetPortal: 'MEMBER',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setTenantMemberSession(data.member, tenantInfo.slug, tenantInfo.name);
        if (data.isStaff || data.user?.isStaff) {
          setTenantAdminSession(data.user || data.member, tenantInfo.slug, tenantInfo.name);
        } else {
          clearTenantAdminSession(tenantInfo.slug);
        }
        router.push(tenantInfo.slug && tenantInfo.slug !== 'default' ? `/member?coop=${tenantInfo.slug}` : '/member');
        return;
      }

      setIsBioAuthenticating(false);
      setErrorMessage(data.error || 'Biometric authentication failed. Please sign in with Google.');
    } catch (err: any) {
      setIsBioAuthenticating(false);
      setErrorMessage('Unable to verify biometrics. Please continue with Google Sign-In.');
    }
  };

  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '581563779021-hpr2v1ri91l7mhj9fuilpj022ekfbrk9.apps.googleusercontent.com';

  // Load Google Identity Services SDK
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-gsi-client')) return;

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        const google = (window as any).google;
        if (google?.accounts?.id) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        }
      } catch (err) {
        console.warn('Google GSI initialization error:', err);
      }
    };
    document.head.appendChild(script);
  }, []);

  const handleCompleteGoogleLogin = async (
    email: string,
    name?: string,
    pictureUrl?: string,
    googleUid?: string,
    idToken?: string,
    accessToken?: string
  ) => {
    const emailToUse = String(email || '').trim();
    if (!emailToUse) {
      setIsGoogleAuthenticating(false);
      setErrorMessage('Google did not return a valid email address.');
      return;
    }

    setIsGoogleAuthenticating(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/member/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantInfo.slug,
        },
        body: JSON.stringify({
          email: emailToUse,
          name: name || emailToUse.split('@')[0],
          pictureUrl: pictureUrl || '',
          googleUid: googleUid || '',
          idToken: idToken || '',
          accessToken: accessToken || '',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setTenantMemberSession(data.member, data.member.tenantSlug, data.member.coopName);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('silong_google_user', JSON.stringify(data.member));
          if (!data.isCoopLinked) {
            sessionStorage.setItem('silong_prompt_link_coop', 'true');
          }
        }
        router.push(
          data.member.tenantSlug && data.member.tenantSlug !== 'unlinked'
            ? `/member?coop=${data.member.tenantSlug}`
            : '/member'
        );
        return;
      }

      setIsGoogleAuthenticating(false);
      setErrorMessage(data.error || 'Google Sign-In failed. Please try again.');
    } catch (err: any) {
      setIsGoogleAuthenticating(false);
      setErrorMessage('Unable to connect with Google central authentication service.');
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      setIsGoogleAuthenticating(false);
      return;
    }

    try {
      let email = '';
      let name = '';
      let pictureUrl = '';
      let googleUid = '';

      try {
        const payloadBase64 = response.credential.split('.')[1];
        const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
        email = decoded.email || '';
        name = decoded.name || decoded.given_name || email.split('@')[0];
        pictureUrl = decoded.picture || '';
        googleUid = decoded.sub || '';
      } catch (e) {
        console.warn('Could not parse Google ID token locally', e);
      }

      await handleCompleteGoogleLogin(email, name, pictureUrl, googleUid, response.credential);
    } catch (err: any) {
      setIsGoogleAuthenticating(false);
      setErrorMessage('Unable to verify Google credential.');
    }
  };

  const handleStartGoogleSignIn = () => {
    setIsGoogleAuthenticating(true);
    setErrorMessage('');

    const google = typeof window !== 'undefined' ? (window as any).google : null;

    // 1. Try Google Identity Services OAuth 2.0 Token Client (Official Google Account Chooser popup)
    if (google?.accounts?.oauth2) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await userInfoRes.json();
                if (userInfo && userInfo.email) {
                  await handleCompleteGoogleLogin(
                    userInfo.email,
                    userInfo.name || userInfo.email.split('@')[0],
                    userInfo.picture,
                    userInfo.sub,
                    undefined,
                    tokenResponse.access_token
                  );
                  return;
                }
              } catch (err) {
                console.warn('Failed to fetch userinfo from Google', err);
              }
            }
            setIsGoogleAuthenticating(false);
          },
          error_callback: (err: any) => {
            console.warn('Google OAuth popup error:', err);
            setIsGoogleAuthenticating(false);
            if (err?.type !== 'popup_closed') {
              setErrorMessage('Google Sign-In was cancelled or interrupted.');
            }
          },
        });
        tokenClient.requestAccessToken();
        return;
      } catch (clientErr) {
        console.warn('Error launching Google token client:', clientErr);
      }
    }

    // 2. Try Google Identity Services One Tap / Prompt
    if (google?.accounts?.id) {
      try {
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.warn('GSI prompt notification:', notification.getNotDisplayedReason?.());
          }
        });
        return;
      } catch (promptErr) {
        console.warn('Error launching GSI prompt:', promptErr);
      }
    }

    // 3. Fallback: Standard Google OAuth 2.0 Web Popup Flow
    try {
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const redirectUri = typeof window !== 'undefined' ? window.location.origin : '';
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        GOOGLE_CLIENT_ID
      )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(
        'email profile openid'
      )}&prompt=select_account`;

      const popup = window.open(
        oauthUrl,
        'google_oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=no`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        setIsGoogleAuthenticating(false);
        setErrorMessage('Popup blocked. Please allow popups for this site to sign in with Google.');
      } else {
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            setIsGoogleAuthenticating(false);
          }
        }, 1000);
      }
    } catch (err) {
      setIsGoogleAuthenticating(false);
      setErrorMessage('Google Sign-In is unavailable. Please check your internet connection.');
    }
  };

  return (
    <div className="silong-member-theme min-h-screen bg-gradient-to-b from-[#f4efe6] via-[#faf7f2] to-[#eef3f9] text-slate-800 flex flex-col">
      {/* Top 50% Height: Big Centered Icon, SILONG label, and Tagline */}
      <div className="min-h-[50dvh] flex flex-col items-center justify-center px-6 py-8 text-center">
        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-[#223a5e] flex items-center justify-center shadow-2xl shadow-[#223a5e]/25 ring-4 ring-[#e68a38]/25 overflow-hidden mb-5">
          <img
            src="/icons/silong-icon-512.png"
            alt="SILONG"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-widest text-[#223a5e]">
          SILONG
        </h1>
        <p className="text-sm sm:text-base font-semibold text-[#c46618] mt-1.5">
          Engage, empower, uplift.
        </p>
      </div>

      {/* Bottom 50% Height: Login Section, and Footer */}
      <div className="min-h-[50dvh] flex flex-col justify-between px-4 sm:px-6 lg:px-8 pb-6 pt-2">
        <div className="max-w-md w-full mx-auto space-y-5">
          {/* Login Section */}
          <div className="bg-white/95 backdrop-blur-md border border-[#e2d5c1] rounded-3xl p-6 sm:p-7 shadow-xl shadow-[#223a5e]/10 space-y-4">
            {errorMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  errorMessage.toLowerCase().includes('verification')
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {errorMessage.toLowerCase().includes('verification') ? (
                  <ShieldCheck className="w-5 h-5 shrink-0 text-amber-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* If app is not yet installed on user's device, show PWA Install button instead of login button */}
            {hasMounted && !isAppInstalled && !allowWebLogin ? (
              <div className="space-y-4">
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#223a5e] text-white flex items-center justify-center mx-auto shadow-md ring-4 ring-[#e68a38]/25">
                    <Smartphone className="w-6 h-6 text-[#e68a38]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#223a5e]">
                      Install App to Access Portal
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xs mx-auto">
                      For security, offline protection, and biometrics, please install the SILONG application on your device to log in.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="w-full py-3.5 px-4 bg-[#d97724] hover:bg-[#c46618] text-white font-bold rounded-xl transition flex items-center justify-center gap-2.5 shadow-lg shadow-[#d97724]/25 text-xs sm:text-sm cursor-pointer group"
                >
                  <Download className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                  <span>Install SILONG App</span>
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setAllowWebLogin(true)}
                    className="text-xs font-semibold text-slate-500 hover:text-[#223a5e] underline transition cursor-pointer"
                  >
                    Already installed or continue in web browser →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Primary: Continue with Google (Tuntong Tech Central Firebase: 581563779021) */}
                <button
                  type="button"
                  onClick={handleStartGoogleSignIn}
                  disabled={isLoading || isGoogleAuthenticating}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold rounded-xl transition flex items-center justify-center gap-3 border border-slate-300 shadow-sm text-xs sm:text-sm cursor-pointer group hover:border-slate-400"
                >
                  {isGoogleAuthenticating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#e68a38] border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Sign in with Device Biometrics if available */}
                {hasBiometrics && biometricsMember && (
                  <>
                    <div className="flex items-center gap-3 my-0.5">
                      <div className="h-px bg-slate-200 flex-1" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">or sign in with</span>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={handleBiometricLogin}
                        disabled={isLoading || isBioAuthenticating}
                        className="w-full py-3.5 px-4 bg-[#223a5e] hover:bg-[#1b2f4d] disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2.5 shadow-md shadow-[#223a5e]/20 text-xs sm:text-sm cursor-pointer group"
                      >
                        {isBioAuthenticating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#e68a38] border-t-transparent rounded-full animate-spin"></div>
                            <span>Verifying Touch ID / Face ID...</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4 text-[#e68a38] group-hover:scale-110 transition-transform" />
                            <span>Sign in with Device Biometrics</span>
                          </>
                        )}
                      </button>

                      <div className="flex justify-between items-center px-1 text-[11px] text-slate-400">
                        <span>{biometricsMember.name || 'Touch ID / Face ID saved'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.removeItem(`flexcoop_biometrics_enabled_${tenantInfo.slug}`);
                              localStorage.removeItem(`flexcoop_biometrics_member_${tenantInfo.slug}`);
                              setHasBiometrics(false);
                              setBiometricsMember(null);
                              setErrorMessage('');
                            } catch {}
                          }}
                          className="text-slate-500 hover:text-rose-600 underline transition"
                        >
                          Reset biometrics
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="max-w-md w-full mx-auto pt-6 text-center space-y-3">
          <div className="text-xs font-semibold text-[#223a5e]/75">
            Silong - A Tuntong Tech Solution
          </div>
        </footer>
      </div>

      {/* PWA Install Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#223a5e] flex items-center justify-center text-white ring-2 ring-[#e68a38]/30 shrink-0">
                <Download className="w-6 h-6 text-[#e68a38]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Install SILONG App</h3>
                <p className="text-xs text-slate-500">Cooperative Member Mobile App</p>
              </div>
            </div>

            {isIosDevice ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="font-bold text-[#223a5e] flex items-center gap-2">
                  <span>How to install on iPhone &amp; iPad (Safari):</span>
                </div>
                <ol className="space-y-2.5 text-slate-700 list-decimal list-inside pl-1 leading-relaxed">
                  <li>
                    Tap the <strong className="text-slate-900">Share</strong> button at the bottom of Safari (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> box with arrow pointing up).
                  </li>
                  <li>
                    Scroll down and tap <strong className="text-slate-900">&ldquo;Add to Home Screen&rdquo;</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#d97724]" />).
                  </li>
                  <li>
                    Tap <strong className="text-slate-900">&ldquo;Add&rdquo;</strong> in the top-right corner.
                  </li>
                  <li>
                    Launch <strong className="text-slate-900">SILONG</strong> from your Home Screen to sign in!
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="font-bold text-[#223a5e] flex items-center gap-2">
                  <span>How to install on Android &amp; Chrome / Edge:</span>
                </div>
                <ol className="space-y-2.5 text-slate-700 list-decimal list-inside pl-1 leading-relaxed">
                  <li>
                    Tap the browser menu button (<strong className="text-slate-900">&vellip;</strong> three dots in the top right).
                  </li>
                  <li>
                    Select <strong className="text-slate-900">&ldquo;Install App&rdquo;</strong> or <strong className="text-slate-900">&ldquo;Add to Home screen&rdquo;</strong>.
                  </li>
                  <li>
                    Confirm <strong className="text-slate-900">&ldquo;Install&rdquo;</strong> to place SILONG on your device.
                  </li>
                  <li>
                    Open <strong className="text-slate-900">SILONG</strong> from your app drawer or home screen!
                  </li>
                </ol>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsAppInstalled(true);
                  localStorage.setItem('silong_pwa_installed', 'true');
                  setAllowWebLogin(true);
                  setShowInstallModal(false);
                }}
                className="w-full py-3 px-4 bg-[#223a5e] hover:bg-[#1b2f4d] text-white font-bold rounded-xl transition text-xs sm:text-sm shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>I Have Installed the App / Continue to Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAllowWebLogin(true);
                  setShowInstallModal(false);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs text-center"
              >
                Continue in Web Browser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
