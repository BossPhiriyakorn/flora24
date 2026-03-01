'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Loader2, AlertCircle, Flower2 } from 'lucide-react';

const OTP_LENGTH = 6;
const COOLDOWN_SEC = 5 * 60; // 5 นาที ตาม OTP_COOLDOWN_MINUTES

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(emailFromQuery);
  }, [emailFromQuery]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  async function handleResend() {
    const mail = email.trim();
    if (!mail || resendCooldown > 0) return;
    setError('');
    try {
      const res = await fetch('/api/auth/register/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'ส่งรหัสอีกครั้งไม่สำเร็จ');
        return;
      }
      setResendCooldown(COOLDOWN_SEC);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const mail = email.trim();
    if (!mail) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    if (code.length < 4) {
      setError('กรุณากรอกรหัส OTP ให้ครบ');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: mail, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'ยืนยันรหัสไม่สำเร็จ');
        return;
      }
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (err?: boolean) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${err ? 'border-red-500' : 'border-white/10 focus:border-[#E11D48]'}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-8"
      >
        <div className="w-14 h-14 bg-[#E11D48] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#E11D48]/30">
          <Flower2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-black text-2xl tracking-tighter">FLORA</h1>
        <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">ยืนยันอีเมล</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-8">
          <h2 className="font-black text-xl tracking-tight mb-2">กรอกรหัส OTP</h2>
          <p className="text-white/50 text-sm mb-6">
            เราได้ส่งรหัส OTP ไปที่อีเมลของคุณแล้ว กรุณากรอกรหัสด้านล่าง
          </p>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  autoComplete="email"
                  className={`${inputCls(!!error)} pl-11`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                รหัส OTP ({OTP_LENGTH} หลัก)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoComplete="one-time-code"
                className={`${inputCls(!!error)} text-center font-mono text-lg tracking-[0.3em]`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E11D48] hover:bg-[#be123c] disabled:bg-white/10 disabled:text-white/30 text-white font-black text-sm py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> กำลังยืนยัน...
                </>
              ) : (
                'ยืนยันรหัส OTP'
              )}
            </button>

            <p className="text-center text-sm text-white/50 mt-2">
              ไม่ได้รับรหัส?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-[#E11D48] font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `ส่งอีกครั้งได้ใน ${resendCooldown} วินาที` : 'ส่งรหัสอีกครั้ง'}
              </button>
            </p>
          </form>
        </div>

        <p className="text-center mt-5 text-sm text-white/40">
          ไม่ได้รับรหัส? <Link href="/register" className="text-[#E11D48] font-bold hover:underline">สมัครใหม่</Link>
          {' · '}
          <Link href="/login" className="text-[#E11D48] font-bold hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-14 h-14 bg-[#E11D48]/20 rounded-2xl animate-pulse mb-4" />
        <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
