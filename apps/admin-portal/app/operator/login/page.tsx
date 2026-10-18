'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Forward directly to /operator where passwordless OTP authentication is handled
    router.replace('/operator');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-mono uppercase tracking-widest text-slate-500">
        Redirecting to Tuntong Tech Operator Authentication...
      </p>
    </div>
  );
}
