'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  User, Mail, Phone, Camera, CreditCard,
  Plus, Trash2, CheckCircle, ShieldCheck, X, Loader2, AlertCircle,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

type SavedCard = {
  id: string;
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  expiry: string;
  holder: string;
};

type UserProfile = {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  avatar: string | null;
};

const EMPTY_USER: UserProfile = {
  firstName: '', lastName: '', nickname: '', email: '', phone: '', avatar: null,
};

/* ─── STRIPE ELEMENT STYLE (dark theme) ─── */
const STRIPE_STYLE = {
  style: {
    base: {
      fontSize: '14px',
      color: '#F5F5F5',
      fontFamily: '"Courier New", monospace',
      '::placeholder': { color: 'rgba(255,255,255,0.2)' },
    },
    invalid: { color: '#F87171' },
  },
};

function BrandLogo({ brand }: { brand: SavedCard['brand'] }) {
  if (brand === 'visa')
    return <span className="font-black italic text-white text-lg tracking-tighter">VISA</span>;
  if (brand === 'mastercard')
    return (
      <span className="flex items-center">
        <span className="w-6 h-6 rounded-full bg-red-500 opacity-90 inline-block" />
        <span className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-3 inline-block" />
      </span>
    );
  if (brand === 'amex')
    return <span className="font-black text-white text-sm tracking-widest">AMEX</span>;
  return <CreditCard className="w-5 h-5 text-white/50" />;
}

/* ─── STRIPE CARD FORM (ต้องอยู่ใน <Elements> context) ─── */
function StripeCardForm({
  holder,
  saving,
  saveError,
  onSuccess,
  onCancel,
}: {
  holder: string;
  saving: boolean;
  saveError: string;
  onSuccess: (paymentMethodId: string, card: { last4: string; brand: string; exp_month: number; exp_year: number }) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [stripeError, setStripeError] = useState('');
  const [brand, setBrand] = useState<SavedCard['brand']>('other');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStripeError('');
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber,
      billing_details: { name: holder.trim() || undefined },
    });

    if (error) {
      setStripeError(error.message ?? 'กรอกข้อมูลบัตรไม่ถูกต้อง');
      return;
    }

    const card = paymentMethod.card!;
    onSuccess(paymentMethod.id, {
      last4:     card.last4,
      brand:     card.brand,
      exp_month: card.exp_month,
      exp_year:  card.exp_year,
    });
  }

  const cardBg =
    brand === 'visa'       ? 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' :
    brand === 'mastercard' ? 'linear-gradient(135deg,#1a0a00 0%,#3d1100 50%,#6b1f00 100%)' :
                             'linear-gradient(135deg,#0d0d0d 0%,#1a1a1a 50%,#262626 100%)';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mini card preview */}
      <div
        className="w-full aspect-[1.586/1] rounded-2xl p-5 flex flex-col justify-between select-none"
        style={{ background: cardBg }}
      >
        <div className="flex justify-between items-start">
          <div className="w-10 h-7 rounded bg-yellow-400/80 flex items-end overflow-hidden">
            <div className="w-full h-1/2 bg-yellow-300/60" />
          </div>
          <BrandLogo brand={brand} />
        </div>
        <div>
          <p className="font-mono text-white/40 text-lg tracking-[0.2em] mb-4">•••• •••• •••• ••••</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-white/40 font-mono text-[9px] uppercase tracking-widest mb-0.5">Card Holder</p>
              <p className="text-white font-bold text-sm uppercase tracking-wider truncate max-w-[160px]">
                {holder || 'ชื่อผู้ถือบัตร'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/40 font-mono text-[9px] uppercase tracking-widest mb-0.5">Expires</p>
              <p className="text-white font-bold text-sm font-mono">MM/YY</p>
            </div>
          </div>
        </div>
      </div>

      {/* เลขบัตร */}
      <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1.5 block">
          หมายเลขบัตร
        </label>
        <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#E11D48] transition-colors">
          <CardNumberElement
            options={STRIPE_STYLE}
            onChange={e => {
              const b = (e as any).brand as string;
              setBrand(b === 'visa' ? 'visa' : b === 'mastercard' ? 'mastercard' : b === 'amex' ? 'amex' : 'other');
            }}
          />
        </div>
      </div>

      {/* วันหมดอายุ + CVC */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1.5 block">
            วันหมดอายุ
          </label>
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#E11D48] transition-colors">
            <CardExpiryElement options={STRIPE_STYLE} />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1.5 block">
            CVV / CVC
          </label>
          <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#E11D48] transition-colors">
            <CardCvcElement options={STRIPE_STYLE} />
          </div>
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2.5 bg-white/[0.03] border border-white/5 rounded-xl p-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-white/40 text-[10px] font-mono leading-relaxed">
          ข้อมูลบัตรส่งตรงไปยัง Stripe (PCI DSS) — เราไม่เห็นและไม่เก็บเลขบัตรบนเซิร์ฟเวอร์
        </p>
      </div>

      {(stripeError || saveError) && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{stripeError || saveError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="py-3.5 rounded-xl border border-white/10 text-sm font-black tracking-widest uppercase text-white/60 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={saving || !stripe}
          className="py-3.5 rounded-xl bg-[#E11D48] text-white text-sm font-black tracking-widest uppercase hover:bg-[#be123c] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</> : 'ผูกบัตร'}
        </button>
      </div>
    </form>
  );
}

/* ─── ADD CARD MODAL ─── */
function AddCardModal({ onClose, onSave }: { onClose: () => void; onSave: (c: SavedCard) => void }) {
  const [holder, setHolder] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const stripePromise = useMemo(
    () =>
      typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY
        ? loadStripe(process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY)
        : null,
    [],
  );

  async function handleSuccess(
    paymentMethodId: string,
    card: { last4: string; brand: string; exp_month: number; exp_year: number },
  ) {
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/profile/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripePaymentMethodId: paymentMethodId,
          holderName: holder.trim().toUpperCase() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? 'บันทึกบัตรไม่สำเร็จ');
        return;
      }
      const brand: SavedCard['brand'] =
        card.brand === 'visa'       ? 'visa'       :
        card.brand === 'mastercard' ? 'mastercard' :
        card.brand === 'amex'       ? 'amex'       : 'other';

      onSave({
        id:     data.id,
        last4:  card.last4,
        brand,
        expiry: `${String(card.exp_month).padStart(2, '0')}/${String(card.exp_year).slice(-2)}`,
        holder: holder.trim().toUpperCase(),
      });
      onClose();
    } catch {
      setSaveError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 z-10 max-h-[95dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-black text-lg tracking-tight">ผูกบัตรใหม่</h3>
            <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mt-0.5">Add Payment Card via Stripe</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cardholder Name (plain input — ไม่ใช่ข้อมูลบัตร ไม่ต้องผ่าน Stripe) */}
        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1.5 block">
            ชื่อผู้ถือบัตร (ภาษาอังกฤษ)
          </label>
          <input
            type="text"
            value={holder}
            onChange={e => setHolder(e.target.value.toUpperCase())}
            placeholder="FIRSTNAME LASTNAME"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white uppercase placeholder-white/20 focus:outline-none focus:border-[#E11D48] transition-colors"
          />
        </div>

        {/* Stripe Elements หรือ fallback เมื่อยังไม่ได้ตั้งค่า */}
        {stripePromise ? (
          <Elements stripe={stripePromise}>
            <StripeCardForm
              holder={holder}
              saving={saving}
              saveError={saveError}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-400 text-sm mb-1">Payment Gateway ยังไม่ได้ตั้งค่า</p>
                <p className="text-white/40 text-xs font-mono leading-relaxed">
                  ใส่ค่า <code className="text-[#E11D48]">NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY</code> ใน .env.local เพื่อเปิดใช้งานฟอร์มบัตรเครดิต
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl border border-white/10 text-sm font-black text-white/60 hover:text-white transition-colors"
            >
              ปิด
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function ProfilePage() {
  const [user, setUser]             = useState<UserProfile>(EMPTY_USER);
  const [cards, setCards]           = useState<SavedCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editMode, setEditMode]     = useState(false);
  const [form, setForm]             = useState<UserProfile>(EMPTY_USER);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/profile/cards').then(r => r.json()),
    ]).then(([profileData, cardsData]) => {
      if (profileData.user) {
        const u = profileData.user;
        const mapped: UserProfile = {
          firstName: u.firstName ?? '',
          lastName:  u.lastName  ?? '',
          nickname:  u.nickname  ?? '',
          email:     u.email     ?? '',
          phone:     u.phone     ?? '',
          avatar:    u.linePictureUrl ?? null,
        };
        setUser(mapped);
        setForm(mapped);
      }
      if (cardsData.cards) {
        setCards(cardsData.cards.map((c: any) => ({
          id:     c._id,
          last4:  c.last4 ?? '????',
          brand:  c.brand ?? 'other',
          expiry: c.expMonth && c.expYear ? `${String(c.expMonth).padStart(2,'0')}/${String(c.expYear).slice(-2)}` : '-',
          holder: c.holderName ?? '',
        })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    try {
      const res = await fetch('/api/profile', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          firstName: form.firstName,
          lastName:  form.lastName,
          nickname:  form.nickname,
          phone:     form.phone,
        }),
      });
      if (res.ok) {
        setUser(form);
        setEditMode(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch { /* ignore */ }
  }

  async function handleRemoveCard(id: string) {
    try {
      await fetch(`/api/profile/cards/${id}`, { method: 'DELETE' });
      setCards(prev => prev.filter(c => c.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] pb-16 pt-24">
        <div className="max-w-xl mx-auto px-4 md:px-6 py-8 space-y-6">
          {/* PAGE TITLE */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black tracking-tighter">โปรไฟล์</h1>
            {saved && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> บันทึกแล้ว
              </span>
            )}
          </div>

          {/* ── AVATAR + NAME ── */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#9333ea] flex items-center justify-center text-white text-3xl font-black select-none overflow-hidden">
                {user.avatar
                  ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : (user.firstName || user.nickname || '?').charAt(0).toUpperCase()}
              </div>
              <button className="absolute -bottom-1.5 -right-1.5 bg-[#E11D48] text-white rounded-full p-1.5 hover:bg-[#be123c] transition-colors shadow-lg">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="font-black text-xl tracking-tight">{user.firstName} {user.lastName}</p>
              <p className="text-white/40 text-sm font-mono">@{(user.nickname || user.firstName).toLowerCase()}</p>
              <p className="text-white/25 font-mono text-xs mt-0.5">{user.email}</p>
            </div>
            <button
              onClick={() => { setForm(user); setEditMode(e => !e); }}
              className="ml-auto text-[10px] font-black uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full hover:bg-white/5 transition-colors text-white/60 hover:text-white shrink-0"
            >
              {editMode ? 'ยกเลิก' : 'แก้ไข'}
            </button>
          </div>

          {/* ── PROFILE INFO ── */}
          <section className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#E11D48]" />
              <h2 className="font-black text-sm tracking-tight">ข้อมูลส่วนตัว</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="ชื่อ" value={form.firstName} edit={editMode}
                  onChange={v => setForm(f => ({ ...f, firstName: v }))}
                />
                <Field
                  label="นามสกุล" value={form.lastName} edit={editMode}
                  onChange={v => setForm(f => ({ ...f, lastName: v }))}
                />
              </div>
              <Field
                label="ชื่อเล่น" value={form.nickname} edit={editMode}
                onChange={v => setForm(f => ({ ...f, nickname: v }))}
              />
              <Field
                label="อีเมล" icon={<Mail className="w-3.5 h-3.5" />}
                value={form.email} edit={false} type="email"
                onChange={() => {}}
              />
              <Field
                label="เบอร์โทรศัพท์" icon={<Phone className="w-3.5 h-3.5" />}
                value={form.phone} edit={editMode} type="tel"
                onChange={v => setForm(f => ({ ...f, phone: v }))}
              />

              {editMode && (
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-[#E11D48] hover:bg-[#be123c] text-white font-black tracking-widest uppercase text-sm py-3.5 rounded-xl transition-colors mt-2"
                >
                  บันทึกข้อมูล
                </button>
              )}
            </div>
          </section>

          {/* ── PAYMENT CARDS ── */}
          <section className="bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#E11D48]" />
                <h2 className="font-black text-sm tracking-tight">บัตรที่ผูกไว้</h2>
              </div>
              <button
                onClick={() => setShowAddCard(true)}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-[#E11D48]/10 hover:bg-[#E11D48] border border-[#E11D48]/30 hover:border-[#E11D48] text-[#E11D48] hover:text-white px-3 py-1.5 rounded-full transition-all"
              >
                <Plus className="w-3 h-3" />
                ผูกบัตร
              </button>
            </div>

            <div className="p-5 space-y-3">
              {cards.length === 0 && (
                <div className="text-center py-8 text-white/20">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-mono text-xs uppercase tracking-widest">ยังไม่มีบัตรที่ผูกไว้</p>
                </div>
              )}

              {cards.map(card => (
                <div
                  key={card.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/8 hover:border-white/12 transition-colors"
                >
                  {/* Mini card chip */}
                  <div
                    className="w-12 h-8 rounded-lg shrink-0 flex items-center justify-center"
                    style={{
                      background: card.brand === 'visa'
                        ? 'linear-gradient(135deg,#1a1a2e,#0f3460)'
                        : card.brand === 'mastercard'
                        ? 'linear-gradient(135deg,#3d1100,#6b1f00)'
                        : 'linear-gradient(135deg,#1a1a1a,#333)',
                    }}
                  >
                    <BrandLogo brand={card.brand} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-bold text-white">
                      •••• •••• •••• {card.last4}
                    </p>
                    <p className="text-white/40 font-mono text-[10px] mt-0.5">
                      {card.holder} · หมดอายุ {card.expiry}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemoveCard(card.id)}
                    className="text-white/20 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 shrink-0"
                    title="ลบบัตร"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {showAddCard && (
        <AddCardModal
          onClose={() => setShowAddCard(false)}
          onSave={c => setCards(prev => [...prev, c])}
        />
      )}
    </>
  );
}

/* ─── FIELD COMPONENT ─── */
function Field({
  label, value, edit, onChange, type = 'text', icon,
}: {
  label: string;
  value: string;
  edit: boolean;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">
        {label}
      </label>
      {edit ? (
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">{icon}</span>
          )}
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`w-full bg-white/5 border border-white/10 focus:border-[#E11D48] rounded-xl py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors ${icon ? 'pl-9 pr-4' : 'px-4'}`}
          />
        </div>
      ) : (
        <div className={`flex items-center gap-2 ${icon ? 'text-white/70' : 'text-white'}`}>
          {icon && <span className="text-white/30">{icon}</span>}
          <p className="text-sm font-medium">{value || <span className="text-white/20 italic">ไม่ได้ระบุ</span>}</p>
        </div>
      )}
    </div>
  );
}
