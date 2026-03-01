'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Flower2,
} from 'lucide-react';

/* ─── LINE Button ─── */
function LineLoginButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b14c] disabled:opacity-60 text-white font-black text-sm py-4 rounded-2xl transition-all active:scale-[0.98]"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      )}
      เข้าสู่ระบบด้วย LINE
    </button>
  );
}

function Alert({ msg }: { msg: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{msg}</span>
    </motion.div>
  );
}

function LoginPageContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') ?? '/';
  const reason       = searchParams.get('reason');

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [lineLoading, setLine]  = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (reason === 'expired')        setError('เซสชันหมดอายุ กรุณาล็อคอินใหม่');
    if (reason === 'line_denied')    setError('ยกเลิกการล็อคอินด้วย LINE');
    if (reason === 'line_failed')    setError('ล็อคอินด้วย LINE ล้มเหลว กรุณาลองใหม่');
    if (reason === 'not_configured') setError('LINE Login ยังไม่ได้ตั้งค่า กรุณาติดต่อแอดมิน');
  }, [reason]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'ล็อคอินล้มเหลว'); return; }
      router.push(redirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function handleLineLogin() {
    setLine(true);
    window.location.href = '/api/auth/line';
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-14 h-14 bg-[#E11D48] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#E11D48]/30">
          <Flower2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-black text-2xl tracking-tighter">FLORA</h1>
        <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">24/7 Express Flower Delivery</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-8">

          <div className="mb-6">
            <h2 className="font-black text-xl tracking-tight">เข้าสู่ระบบ</h2>
            <p className="text-white/40 text-sm mt-1">เลือกวิธีล็อคอินของคุณ</p>
          </div>

          <AnimatePresence mode="wait">
            {error && <div className="mb-4"><Alert msg={error} /></div>}
          </AnimatePresence>

          {/* LINE */}
          <LineLoginButton loading={lineLoading} onClick={handleLineLogin} />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/25 font-mono text-[10px] uppercase tracking-widest">หรือ</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required autoComplete="email" placeholder="email@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E11D48] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">รหัสผ่าน</label>
                <Link href="/forgot-password" className="text-[10px] text-[#E11D48] hover:underline font-mono">ลืมรหัสผ่าน?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="รหัสผ่าน"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E11D48] transition-colors"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#E11D48] hover:bg-[#be123c] disabled:bg-white/10 disabled:text-white/30 text-white font-black text-sm py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="text-white/20 font-mono text-[9px] text-center mt-4 leading-relaxed">
            การล็อคอินผ่าน LINE ครั้งแรก ระบบจะให้กรอกข้อมูลเพิ่มเติม
          </p>
        </div>

        <p className="text-center mt-5 text-sm text-white/40">
          ยังไม่มีบัญชี?{' '}
          <Link href="/register" className="text-[#E11D48] font-bold hover:underline">สมัครสมาชิก</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-14 h-14 bg-[#E11D48]/20 rounded-2xl animate-pulse mb-4" />
        <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
