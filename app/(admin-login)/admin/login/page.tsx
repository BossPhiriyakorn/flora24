'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Shield,
} from 'lucide-react';

function AdminLoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const reason       = searchParams.get('reason');

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (reason === 'expired') setError('เซสชันแอดมินหมดอายุ กรุณาล็อคอินใหม่');
  }, [reason]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/admin/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'ล็อคอินล้มเหลว'); return; }
      router.push('/admin');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-10"
      >
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-3 shadow-xl shadow-emerald-500/25">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-white font-black text-2xl tracking-tight">FLORA CMS</h1>
        <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest mt-1">Admin Portal</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full max-w-sm"
      >
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-8">

          <h2 className="text-white font-black text-lg tracking-tight mb-1">เข้าสู่ระบบ</h2>
          <p className="text-white/30 text-xs mb-6">สำหรับแอดมินและพนักงานเท่านั้น</p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key={error}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 text-sm mb-4"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@flora.co.th"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="รหัสผ่าน"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3.5 text-sm text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 text-white font-black text-sm py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 shadow-lg shadow-emerald-500/20"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังเข้าสู่ระบบ...</>
                : <><Shield className="w-4 h-4" /> เข้าสู่ระบบ CMS</>
              }
            </button>
          </form>

          {/* Dev hint */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-5 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
              <p className="text-amber-400/70 font-mono text-[9px] text-center leading-relaxed">
                DEV ONLY — Email: <span className="text-amber-300">admin@flora.co.th</span><br />
                Password: <span className="text-amber-300">admin1234</span>
              </p>
            </div>
          )}
        </div>

        {/* Token separation note */}
        <div className="mt-4 flex items-center gap-2 justify-center">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          <p className="text-white/20 font-mono text-[9px]">
            Admin session แยกจาก User session อย่างสมบูรณ์
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Shield className="w-8 h-8 text-emerald-500 animate-pulse" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
