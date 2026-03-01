'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, CheckCircle2, AlertCircle, Loader2, Flower2, Shield, X, FileText, ShieldCheck } from 'lucide-react';

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

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-red-400 font-mono text-[10px] mt-1">
      <AlertCircle className="w-3 h-3" />{msg}
    </p>
  );
}

type Errors = Partial<Record<'firstName'|'lastName'|'terms'|'general', string>>;
type DocModal = 'terms' | 'privacy' | null;

function parseDisplayName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  const lastName = parts.pop()!;
  return { firstName: parts.join(' '), lastName };
}

function RegisterLineContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const tempToken    = searchParams.get('token') ?? '';

  const [form, setForm]               = useState({ firstName:'', lastName:'', nickname:'', email:'' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [docModal, setDocModal]       = useState<DocModal>(null);
  const [legalContent, setLegalContent] = useState<{ termsContent: string; privacyContent: string }>({ termsContent: TERMS_PLACEHOLDER, privacyContent: PRIVACY_PLACEHOLDER });
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<Errors>({});
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [lineAvatar, setLineAvatar]   = useState('');

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

  useEffect(() => {
    if (!tempToken) { setTokenInvalid(true); return; }
    try {
      const [, payload] = tempToken.split('.');
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (decoded.displayName) {
        const { firstName, lastName } = parseDisplayName(decoded.displayName);
        setForm(p => ({ ...p, firstName, lastName, email: decoded.email ?? '' }));
      }
      if (decoded.pictureUrl) setLineAvatar(decoded.pictureUrl);
    } catch { setTokenInvalid(true); }
  }, [tempToken]);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อ';
    if (!form.lastName.trim())  e.lastName  = 'กรุณากรอกนามสกุล';
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
      const res  = await fetch('/api/auth/line/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token: tempToken, agreedToTerms: termsAccepted && privacyAccepted }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setTokenInvalid(true);
        else setErrors({ general: data.error ?? 'สมัครสมาชิกล้มเหลว' });
        return;
      }
      router.push('/');
      router.refresh();
    } finally { setLoading(false); }
  }

  const inputCls = (err?: string) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${err ? 'border-red-500' : 'border-white/10 focus:border-[#06C755]'}`;

  if (tokenInvalid) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="font-black text-xl mb-2">ลิงค์หมดอายุ</h2>
          <p className="text-white/40 text-sm mb-6">กรุณาล็อคอินด้วย LINE ใหม่อีกครั้ง</p>
          <Link href="/login" className="inline-block bg-[#06C755] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#05b14c] transition-colors">
            กลับหน้าล็อคอิน
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16">

      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-[#E11D48] rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#E11D48]/30">
          <Flower2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-black text-2xl tracking-tighter">FLORA</h1>
        <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">ลงทะเบียนด้วย LINE</p>
      </motion.div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} className="w-full max-w-md">
        <div className="bg-white/[0.04] border border-white/8 rounded-3xl p-8">

          {/* LINE badge */}
          <div className="flex items-center gap-3 bg-[#06C755]/10 border border-[#06C755]/20 rounded-2xl p-3 mb-6">
            {lineAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lineAvatar} alt="LINE" className="w-10 h-10 rounded-full shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-[#06C755]/20 rounded-full flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#06C755]">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-[#06C755] font-black text-sm">เชื่อมต่อ LINE สำเร็จ</p>
              <p className="text-white/30 font-mono text-[9px]">กรอกข้อมูลเพิ่มเติมเพื่อสร้างบัญชี</p>
            </div>
          </div>

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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">ชื่อ <span className="text-[#06C755]">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
                  <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="ชื่อจริง" autoComplete="given-name"
                    className={`${inputCls(errors.firstName)} pl-9`} />
                </div>
                {errors.firstName && <FieldError msg={errors.firstName} />}
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">นามสกุล <span className="text-[#06C755]">*</span></label>
                <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="นามสกุล" autoComplete="family-name" className={inputCls(errors.lastName)} />
                {errors.lastName && <FieldError msg={errors.lastName} />}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">ชื่อเล่น <span className="text-white/25">(ไม่บังคับ)</span></label>
              <input type="text" value={form.nickname} onChange={set('nickname')} placeholder="ชื่อเล่น" autoComplete="nickname" className={inputCls()} />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5">อีเมล <span className="text-white/25">(ไม่บังคับ)</span></label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" autoComplete="email"
                  className={`${inputCls()} pl-11`} />
              </div>
              <p className="text-white/20 font-mono text-[9px] mt-1">ใช้สำหรับรับการแจ้งเตือนคำสั่งซื้อ</p>
            </div>

            {/* ข้อกำหนดและนโยบาย — แยกคนละรายการ ต้องอ่านและยอมรับทั้งสองก่อนสมัคร */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">กรุณาอ่านและยอมรับทั้งสองรายการก่อนสร้างบัญชี</p>
              <div className="flex items-center gap-3">
                {termsAccepted ? (
                  <span className="flex items-center gap-2 text-xs text-white/70">
                    <span className="w-5 h-5 rounded-md bg-[#06C755] border-2 border-[#06C755] flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                    ข้อกำหนดการใช้งาน
                  </span>
                ) : (
                  <button type="button" onClick={() => setDocModal('terms')} className="flex items-center gap-2 text-xs text-white/70 hover:text-[#06C755] transition-colors">
                    <FileText className="w-4 h-4" />
                    <span className="underline">อ่านข้อกำหนดการใช้งาน</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {privacyAccepted ? (
                  <span className="flex items-center gap-2 text-xs text-white/70">
                    <span className="w-5 h-5 rounded-md bg-[#06C755] border-2 border-[#06C755] flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </span>
                    นโยบายความเป็นส่วนตัว
                  </span>
                ) : (
                  <button type="button" onClick={() => setDocModal('privacy')} className="flex items-center gap-2 text-xs text-white/70 hover:text-[#06C755] transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="underline">อ่านนโยบายความเป็นส่วนตัว</span>
                  </button>
                )}
              </div>
              {errors.terms && <FieldError msg={errors.terms} />}
            </div>

            <div className="flex items-start gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5">
              <Shield className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
              <p className="text-white/25 font-mono text-[9px] leading-relaxed">เราจะไม่เก็บรหัสผ่าน LINE ของคุณ — ระบบใช้ OAuth 2.0 ที่ปลอดภัย</p>
            </div>

            <button type="submit" disabled={loading || !termsAccepted || !privacyAccepted}
              className="w-full bg-[#06C755] hover:bg-[#05b14c] disabled:bg-white/10 disabled:text-white/30 text-white font-black text-sm py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างบัญชี...</> : 'สร้างบัญชีและเข้าสู่ระบบ'}
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
                  <button type="button" onClick={acceptDoc} className="px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05b14c] text-white font-bold transition-colors">
                    ยอมรับ
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center mt-5 text-sm text-white/30">
          <Link href="/login" className="hover:text-white/60 transition-colors">← ยกเลิก กลับหน้าล็อคอิน</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterLinePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-10 h-10 border-2 border-[#06C755] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-white/40 text-sm">กำลังโหลด...</p>
      </div>
    }>
      <RegisterLineContent />
    </Suspense>
  );
}
