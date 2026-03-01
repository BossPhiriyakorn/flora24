'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Flower2, X, FileText, ShieldCheck,
} from 'lucide-react';

const TERMS_PLACEHOLDER = `ข้อกำหนดการใช้งาน

1. การยอมรับเงื่อนไข
การเข้าใช้งานและใช้บริการของเว็บไซต์นี้ถือว่าท่านได้อ่าน ทำความเข้าใจ และยอมรับผูกพันตามข้อกำหนดการใช้งานนี้ทั้งหมด

2. การใช้บริการ
ผู้ใช้ต้องใช้บริการอย่างถูกต้อง ไม่ละเมิดกฎหมายหรือสิทธิของผู้อื่น

3. การแก้ไข
เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดนี้โดยไม่ต้องแจ้งล่วงหน้า กรุณาตรวจสอบเป็นระยะ`;

const PRIVACY_PLACEHOLDER = `นโยบายความเป็นส่วนตัว

เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ นโยบายนี้อธิบายการเก็บใช้ และคุ้มครองข้อมูลของท่าน

1. ข้อมูลที่เราเก็บ
- ข้อมูลที่ท่านกรอกในการสมัครและใช้งาน (ชื่อ อีเมล หมายเลขโทรศัพท์ ฯลฯ)
- ข้อมูลการใช้งานเว็บไซต์

2. การใช้ข้อมูล
เราใช้ข้อมูลเพื่อให้บริการ ปรับปรุงระบบ และติดต่อท่านเมื่อจำเป็น

3. การคุ้มครอง
เราใช้มาตรการที่เหมาะสมเพื่อป้องกันการเข้าถึงหรือเปิดเผยข้อมูลโดยไม่ชอบด้วยกฎหมาย`;

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { ok: password.length >= 8,          label: 'อย่างน้อย 8 ตัวอักษร' },
    { ok: /[A-Z]/.test(password),        label: 'ตัวพิมพ์ใหญ่' },
    { ok: /[0-9]/.test(password),        label: 'ตัวเลข' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'อักขระพิเศษ' },
  ];
  const score = checks.filter(c => c.ok).length;
  const bar   = ['bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-500'][score - 1] ?? 'bg-white/10';
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? bar : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(c => (
          <span key={c.label} className={`flex items-center gap-1 font-mono text-[9px] ${c.ok ? 'text-emerald-400' : 'text-white/25'}`}>
            <CheckCircle2 className={`w-2.5 h-2.5 ${c.ok ? 'opacity-100' : 'opacity-30'}`} />{c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-red-400 font-mono text-[10px] mt-1">
      <AlertCircle className="w-3 h-3" />{msg}
    </p>
  );
}

type Errors = Partial<Record<'firstName'|'lastName'|'email'|'password'|'confirmPassword'|'terms'|'general', string>>;
type DocModal = 'terms' | 'privacy' | null;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName:'', lastName:'', nickname:'', email:'', password:'', confirmPassword:'' });
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [docModal, setDocModal] = useState<DocModal>(null);
  const [legalContent, setLegalContent] = useState<{ termsContent: string; privacyContent: string }>({ termsContent: TERMS_PLACEHOLDER, privacyContent: PRIVACY_PLACEHOLDER });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    fetch('/api/settings/legal', { cache: 'no-store' }).then(r => r.json()).then(data => {
      if (data.termsContent != null || data.privacyContent != null) {
        setLegalContent({
          termsContent: (data.termsContent ?? '').trim() || TERMS_PLACEHOLDER,
          privacyContent: (data.privacyContent ?? '').trim() || PRIVACY_PLACEHOLDER,
        });
      }
    }).catch(() => {});
  }, []);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อ';
    if (!form.lastName.trim())  e.lastName  = 'กรุณากรอกนามสกุล';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    if (form.password.length < 8)             e.password        = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    if (!termsAccepted && !privacyAccepted) e.terms = 'กรุณาอ่านและยอมรับข้อกำหนดการใช้งานและนโยบายความเป็นส่วนตัว';
    else if (!termsAccepted) e.terms = 'กรุณาอ่านและยอมรับข้อกำหนดการใช้งาน';
    else if (!privacyAccepted) e.terms = 'กรุณาอ่านและยอมรับนโยบายความเป็นส่วนตัว';
    return e;
  }

  function acceptDoc() {
    if (docModal === 'terms') setTermsAccepted(true);
    if (docModal === 'privacy') setPrivacyAccepted(true);
    setDocModal(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agreedToTerms: termsAccepted && privacyAccepted }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.error ?? 'สมัครสมาชิกล้มเหลว' }); return; }
      if (data.needVerify === true) {
        router.push(`/register/verify-otp?email=${encodeURIComponent(form.email.trim())}`);
        return;
      }
      router.push('/');
      router.refresh();
    } finally { setLoading(false); }
  }

  const inputCls = (err?: string) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${err ? 'border-red-500' : 'border-white/10 focus:border-[#E11D48]'}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">

      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-[#E11D48] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#E11D48]/30">
          <Flower2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-black text-2xl tracking-tighter">FLORA</h1>
        <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">สมัครสมาชิกใหม่</p>
      </motion.div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} className="w-full max-w-md">
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-8">
          <h2 className="font-black text-xl tracking-tight mb-6">สร้างบัญชีใหม่</h2>

          <AnimatePresence mode="wait">
            {errors.general && (
              <div className="mb-4">
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{errors.general}</span>
                </div>
              </div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* ชื่อ / นามสกุล */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                  ชื่อ <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                  <input type="text" value={form.firstName} onChange={set('firstName')}
                    placeholder="ชื่อจริง" autoComplete="given-name"
                    className={`${inputCls(errors.firstName)} pl-9`} />
                </div>
                {errors.firstName && <FieldError msg={errors.firstName} />}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                  นามสกุล <span className="text-[#E11D48]">*</span>
                </label>
                <input type="text" value={form.lastName} onChange={set('lastName')}
                  placeholder="นามสกุล" autoComplete="family-name" className={inputCls(errors.lastName)} />
                {errors.lastName && <FieldError msg={errors.lastName} />}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                ชื่อเล่น <span className="text-white/25">(ไม่บังคับ)</span>
              </label>
              <input type="text" value={form.nickname} onChange={set('nickname')}
                placeholder="ชื่อเล่น" autoComplete="nickname" className={inputCls()} />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                อีเมล <span className="text-[#E11D48]">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="email@example.com" autoComplete="email"
                  className={`${inputCls(errors.email)} pl-11`} />
              </div>
              {errors.email && <FieldError msg={errors.email} />}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                รหัสผ่าน <span className="text-[#E11D48]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password"
                  className={`${inputCls(errors.password)} pl-11 pr-12`} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && <FieldError msg={errors.password} />}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">
                ยืนยันรหัสผ่าน <span className="text-[#E11D48]">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input type={showConf ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="กรอกรหัสผ่านอีกครั้ง" autoComplete="new-password"
                  className={`${inputCls(errors.confirmPassword)} pl-11 pr-12`} />
                <button type="button" onClick={() => setShowConf(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] mt-1">
                  <CheckCircle2 className="w-3 h-3" /> รหัสผ่านตรงกัน
                </p>
              )}
              {errors.confirmPassword && <FieldError msg={errors.confirmPassword} />}
            </div>

            {/* ข้อกำหนดและนโยบาย — แยกคนละติ๊ก ต้องอ่านและยอมรับในโมดัลก่อน */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">กรุณาอ่านและยอมรับทั้งสองรายการก่อนสมัคร</p>
              {/* ข้อกำหนดการใช้งาน */}
              <div className="flex items-center gap-3">
                {termsAccepted ? (
                  <span className="flex items-center gap-2 text-xs text-white/70">
                    <span className="w-5 h-5 rounded-md bg-[#E11D48] border-2 border-[#E11D48] flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                    ข้อกำหนดการใช้งาน
                  </span>
                ) : (
                  <button type="button" onClick={() => setDocModal('terms')} className="flex items-center gap-2 text-xs text-white/70 hover:text-[#E11D48] transition-colors">
                    <FileText className="w-4 h-4" />
                    <span className="underline">อ่านข้อกำหนดการใช้งาน</span>
                  </button>
                )}
              </div>
              {/* นโยบายความเป็นส่วนตัว */}
              <div className="flex items-center gap-3">
                {privacyAccepted ? (
                  <span className="flex items-center gap-2 text-xs text-white/70">
                    <span className="w-5 h-5 rounded-md bg-[#E11D48] border-2 border-[#E11D48] flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                    นโยบายความเป็นส่วนตัว
                  </span>
                ) : (
                  <button type="button" onClick={() => setDocModal('privacy')} className="flex items-center gap-2 text-xs text-white/70 hover:text-[#E11D48] transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="underline">อ่านนโยบายความเป็นส่วนตัว</span>
                  </button>
                )}
              </div>
              {errors.terms && <FieldError msg={errors.terms} />}
            </div>

            <button type="submit" disabled={loading || !termsAccepted || !privacyAccepted}
              className="w-full bg-[#E11D48] hover:bg-[#be123c] disabled:bg-white/10 disabled:text-white/30 text-white font-black text-sm py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสมัครสมาชิก...</> : 'สมัครสมาชิก'}
            </button>
          </form>
        </div>

        {/* โมดัลอ่านข้อกำหนด/นโยบาย — ต้องกดยอมรับถึงจะปิด */}
        <AnimatePresence>
          {docModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
              onClick={() => setDocModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] min-h-0 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                  <h3 className="font-bold text-white">
                    {docModal === 'terms' ? 'ข้อกำหนดการใช้งาน' : 'นโยบายความเป็นส่วนตัว'}
                  </h3>
                  <button type="button" onClick={() => setDocModal(null)} className="p-1 text-white/50 hover:text-white rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 min-h-0 text-sm text-white/80 whitespace-pre-line leading-relaxed">
                  {docModal === 'terms' ? legalContent.termsContent : legalContent.privacyContent}
                </div>
                <div className="p-4 border-t border-white/10 flex justify-end gap-2 shrink-0">
                  <button type="button" onClick={() => setDocModal(null)} className="px-4 py-2 rounded-xl text-white/70 hover:bg-white/10 transition-colors">
                    ปิด
                  </button>
                  <button type="button" onClick={acceptDoc} className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#be123c] text-white font-bold transition-colors">
                    ยอมรับ
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center mt-5 text-sm text-white/40">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-[#E11D48] font-bold hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </motion.div>
    </div>
  );
}
