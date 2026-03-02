'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, MapPin, Link2, FileText, CreditCard, QrCode,
  Trash2, CheckCircle2, X, ChevronRight, AlertCircle,
  Check, Loader2, Clock, RefreshCw,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';

/* ─── TYPES ─── */
type CartItem = {
  id?: string | number;
  name: string;
  price: number;
  image: string;
  category?: string;
  quantity?: number;
};

type PayMethod = 'qr' | 'card';
type AddressMode = 'both' | 'address_only';

type SavedCard = {
  id: string;
  stripePaymentMethodId?: string; // Stripe Payment Method ID (pm_xxx) — ใช้ยืนยันการตัดเงิน ไม่เก็บข้อมูลบัตร
  last4: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'other';
  expiry: string;
  holder: string;
};

const DELIVERY_FEE = 0;

/* ─── HELPERS ─── */
function BrandBadge({ brand }: { brand: SavedCard['brand'] }) {
  if (brand === 'visa') return <span className="font-black italic text-xs">VISA</span>;
  if (brand === 'mastercard')
    return (
      <span className="flex items-center gap-0.5">
        <span className="w-4 h-4 rounded-full bg-red-500 inline-block" />
        <span className="w-4 h-4 rounded-full bg-yellow-400 -ml-2 inline-block" />
      </span>
    );
  return <CreditCard className="w-4 h-4" />;
}

/* ─── QR MODAL (Stripe PromptPay) ─── */
function QRModal({ total, orderId, customerEmail, customerName, onSuccess, onClose }: {
  total: number;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess: (paymentIntentId?: string) => void;
  onClose: () => void;
}) {
  const [qrUrl, setQrUrl]               = useState<string | null>(null);
  const [expiresAt, setExpiresAt]       = useState<number | null>(null);
  const [paymentIntentId, setIntentId]  = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);
  const [expired, setExpired]           = useState(false);
  const [secondsLeft, setSecondsLeft]   = useState(0);
  const [stripeUnavailable, setStripeUnavailable] = useState(false);
  const [paymentFailed, setPaymentFailed] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ขอ QR จาก Stripe
  async function fetchQR() {
    setLoading(true);
    setExpired(false);
    setPaymentFailed(false);
    try {
      const res = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount: total, method: 'promptpay', customerEmail, customerName }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Stripe ยังไม่ได้ตั้งค่า — แสดง fallback
        if (res.status === 503) { setStripeUnavailable(true); }
        return;
      }

      setQrUrl(data.qrCodeUrl ?? null);
      setIntentId(data.paymentIntentId);
      if (data.expiresAt) {
        setExpiresAt(data.expiresAt * 1000); // unix → ms
        setSecondsLeft(Math.max(0, data.expiresAt - Math.floor(Date.now() / 1000)));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchQR(); }, []);

  // countdown
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) { setExpired(true); clearInterval(timer); }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // poll payment status ทุก 5 วินาที
  useEffect(() => {
    if (!paymentIntentId || expired) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment/status?id=${paymentIntentId}`);
        const data = await res.json();
        if (data.status === 'succeeded') {
          clearInterval(pollRef.current!);
          onSuccess(paymentIntentId);
        }
        if (data.status === 'canceled' || data.status === 'payment_failed') {
          clearInterval(pollRef.current!);
          setPaymentFailed(true);
        }
      } catch { /* ignore network error */ }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [paymentIntentId, expired]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  // ─── Stripe ยังไม่ได้ตั้งค่า (dev/sandbox mode) ───
  if (stripeUnavailable) {
    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 z-10 text-center">
          <QrCode className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="font-black text-white mb-1">Stripe ยังไม่ได้ตั้งค่า</p>
          <p className="text-white/40 text-xs mb-4 leading-relaxed">
            ใส่ค่า <code className="text-[#E11D48]">PAYMENT_GATEWAY_SECRET_KEY</code> ใน .env.local เพื่อเปิดใช้ PromptPay จริง
          </p>
          <button onClick={onClose} className="w-full py-3 rounded-xl border border-white/10 text-sm font-black text-white/50">
            ปิด
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-t-3xl md:rounded-3xl p-6 z-10">

        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-lg">ชำระผ่าน QR Code</h3>
            <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">PromptPay — ระบบตรวจสอบอัตโนมัติ</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR display */}
        <div className="flex flex-col items-center mb-5">
          {loading ? (
            <div className="w-52 h-52 flex items-center justify-center bg-white/5 rounded-2xl mb-3">
              <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
            </div>
          ) : paymentFailed ? (
            <div className="w-52 h-52 flex flex-col items-center justify-center bg-red-500/10 border border-red-500/20 rounded-2xl mb-3 gap-2">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="font-bold text-red-400 text-sm">ชำระไม่สำเร็จ</p>
              <p className="text-white/50 text-xs">กรุณาลองใหม่อีกครั้ง</p>
            </div>
          ) : expired ? (
            <div className="w-52 h-52 flex flex-col items-center justify-center bg-white/5 rounded-2xl mb-3 gap-2">
              <Clock className="w-10 h-10 text-red-400" />
              <p className="font-bold text-red-400 text-sm">QR หมดอายุแล้ว</p>
            </div>
          ) : qrUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="bg-white p-4 rounded-2xl mb-3">
              <img src={qrUrl} alt="PromptPay QR" className="w-44 h-44" />
            </div>
          ) : (
            <div className="w-52 h-52 flex items-center justify-center bg-white/5 rounded-2xl mb-3">
              <p className="text-white/30 text-xs">ไม่สามารถโหลด QR ได้</p>
            </div>
          )}

          <p className="font-black text-2xl">฿{total.toLocaleString()}</p>

          {/* countdown */}
          {expiresAt && !expired && !loading && (
            <div className="flex items-center gap-1.5 mt-2 text-white/40 font-mono text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>QR หมดอายุใน <span className={secondsLeft < 60 ? 'text-red-400 font-bold' : ''}>{mm}:{ss}</span></span>
            </div>
          )}
        </div>

        {/* auto-check badge */}
        {!expired && !loading && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
            <p className="text-emerald-400 font-mono text-[11px]">
              กำลังตรวจสอบการชำระเงินอัตโนมัติ — ไม่ต้องแนบสลิป
            </p>
          </div>
        )}

        {/* actions */}
        {expired || paymentFailed ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose} className="py-3.5 rounded-xl border border-white/10 text-sm font-black text-white/50 hover:text-white transition-colors">
              ยกเลิก
            </button>
            <button onClick={fetchQR} className="py-3.5 rounded-xl bg-[#E11D48] text-white text-sm font-black flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> {paymentFailed ? 'ลองใหม่' : 'สร้าง QR ใหม่'}
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="w-full py-3.5 rounded-xl border border-white/10 text-sm font-black text-white/50 hover:text-white transition-colors">
            ยกเลิก
          </button>
        )}

      </div>
    </div>
  );
}

/* ─── SUCCESS MODAL ─── */
function SuccessModal({ method, paymentVerified, onClose }: { method: PayMethod; paymentVerified: boolean; onClose: () => void }) {
  const isPending = !paymentVerified; // บัตรที่ยังไม่ได้ตัดเงินจริง = แอดมินเห็น "รอตรวจสอบ"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-[#111] border border-white/10 rounded-3xl p-8 max-w-xs w-full mx-4 text-center z-10"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isPending ? 'bg-amber-500/15' : 'bg-emerald-500/15'}`}>
          <CheckCircle2 className={`w-8 h-8 ${isPending ? 'text-amber-400' : 'text-emerald-400'}`} />
        </div>
        <h3 className="font-black text-xl mb-2">
          {isPending ? 'บันทึกคำสั่งซื้อแล้ว' : 'ชำระเงินสำเร็จ!'}
        </h3>
        <p className="text-white/40 text-sm leading-relaxed mb-1">
          {isPending
            ? (method === 'qr'
                ? 'แอดมินจะตรวจสอบสลิปและยืนยันการชำระเงิน'
                : 'แอดมินจะตรวจสอบการชำระเงินและติดต่อคุณ')
            : (method === 'qr'
                ? 'ระบบตรวจสอบยอดเงินสำเร็จ — ไม่ต้องแนบสลิป'
                : 'ตัดยอดผ่านบัตรสำเร็จ')}
        </p>
        <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest mb-6">
          {isPending ? 'สามารถติดตามสถานะได้ที่หน้าติดตามสินค้า' : 'ทีมงานจะเริ่มเตรียมจัดส่งทันที'}
        </p>
        <button
          onClick={onClose}
          className="w-full bg-[#E11D48] text-white py-3.5 rounded-xl font-black tracking-widest uppercase text-sm"
        >
          กลับหน้าหลัก
        </button>
      </motion.div>
    </div>
  );
}

// loadStripe รองรับ SSR อยู่แล้ว — ไม่ต้อง typeof window check (ทำให้ hydration mismatch)
const stripePromise = process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY)
  : null;

/* ─── MAIN PAGE ─── */
function CheckoutContent() {
  const router = useRouter();
  const stripe = useStripe();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [mapsLink, setMapsLink] = useState('');
  const [addressMode, setAddressMode] = useState<AddressMode>('both');
  const [notes, setNotes] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('qr');
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false); // true = ชำระผ่านแล้ว (QR), false = รอตรวจสอบ (บัตร)
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [dbOrderId, setDbOrderId] = useState<string | null>(null); // MongoDB ObjectId string
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flora_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        const list = Array.isArray(parsed) ? parsed : [];
        const normalized = list.map((item: any) => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) }));
        setCart(normalized);
      }
    } catch { /* ignore */ }
    // โหลด user info สำหรับ Stripe billing_details
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.email) setCustomerEmail(data.email);
        if (data.firstName) setCustomerName(`${data.firstName} ${data.lastName ?? ''}`.trim());
      })
      .catch(() => {});
    // โหลด saved cards จาก API (เก็บแค่ reference กับ Stripe — ไม่เก็บข้อมูลบัตรจริง)
    fetch('/api/profile/cards')
      .then(r => r.json())
      .then(data => {
        if (data.cards?.length) {
          setSavedCards(data.cards.map((c: any) => ({
            id: c._id?.toString(),
            stripePaymentMethodId: c.stripePaymentMethodId,
            last4: c.last4,
            brand: c.brand ?? 'other',
            expiry: `${String(c.expMonth).padStart(2, '0')}/${String(c.expYear).slice(-2)}`,
            holder: c.holderName ?? '',
          })));
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = cart.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const total = subtotal + DELIVERY_FEE;
  const totalItemCount = cart.reduce((s, i) => s + (i.quantity ?? 1), 0);

  function removeItem(index: number) {
    const next = cart.filter((_, i) => i !== index);
    setCart(next);
    localStorage.setItem('flora_cart', JSON.stringify(next));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!address.trim())
      e.address = 'กรุณากรอกที่อยู่จัดส่ง';
    if (addressMode === 'both' && !mapsLink.trim())
      e.mapsLink = 'กรุณาแนบลิงค์ Google Maps';
    if (cart.length === 0)
      e.cart = 'กรุณาเลือกสินค้าก่อนชำระ';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function createOrder(stripePaymentIntentId?: string, stripePaymentMethodId?: string) {
    const orderItems = cart.map(item => ({
      productId:    item.id?.toString() ?? '',
      productName:  item.name,
      price:        item.price,
      quantity:     Math.max(1, item.quantity ?? 1),
      imageUrl:     item.image,
    }));
    const body = {
      items:       orderItems,
      address,
      mapsLink:    addressMode === 'both' ? mapsLink : undefined,
      addressMode,
      note:        notes,
      paymentMethod: payMethod === 'qr' ? 'promptpay' : 'card',
      subtotal,
      deliveryFee: DELIVERY_FEE,
      total,
      stripePaymentIntentId,
      stripePaymentMethodId,
    };
    const res  = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'สร้างคำสั่งซื้อล้มเหลว');
    return data.id as string; // MongoDB _id
  }

  async function handleConfirm() {
    if (!validate()) return;
    if (payMethod === 'qr') {
      setShowQR(true);
    } else {
      setProcessing(true);
      setErrors(prev => ({ ...prev, general: '' }));
      try {
        const stripePmId = savedCards.find(c => c.id === selectedCard)?.stripePaymentMethodId;
        if (!stripePmId || !stripePmId.startsWith('pm_')) {
          setErrors(prev => ({
            ...prev,
            general: 'บัตรที่เลือกไม่สามารถใช้ชำระออนไลน์ได้ กรุณาผูกบัตรผ่านช่องทางที่รองรับ (Payment Gateway) หรือใช้ชำระผ่าน QR',
          }));
          setProcessing(false);
          return;
        }
        if (!stripe) {
          setErrors(prev => ({ ...prev, general: 'ระบบชำระเงินยังไม่พร้อม กรุณารอสักครู่หรือลองใหม่' }));
          setProcessing(false);
          return;
        }
        // สร้าง PaymentIntent พร้อม customer + payment_method — บัตรที่ผูกไว้ใช้ซ้ำได้
        const intentRes = await fetch('/api/payment/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: `card-${Date.now()}`,
            amount: total,
            method: 'card',
            payment_method: stripePmId,
          }),
        });
        const intentData = await intentRes.json();
        if (!intentRes.ok) throw new Error(intentData.error ?? 'สร้างรายการชำระไม่สำเร็จ');
        const { clientSecret, paymentIntentId } = intentData;
        // ยืนยันการตัดเงินกับ Stripe — ผลลัพธ์มาจาก Payment Gateway (ผ่าน/ไม่ผ่าน)
        const { error } = await stripe.confirmCardPayment(clientSecret, { payment_method: stripePmId });
        if (error) throw new Error(error.message ?? 'การชำระไม่สำเร็จ');
        // ชำระผ่านแล้ว → สร้างออเดอร์พร้อม paymentIntentId เพื่อให้สถานะเป็น verified
        await createOrder(paymentIntentId, stripePmId);
        setPaymentVerified(true);
        setSuccess(true);
      } catch (e: any) {
        setErrors(prev => ({ ...prev, general: e?.message ?? 'ชำระเงินไม่สำเร็จ กรุณาลองใหม่' }));
      } finally {
        setProcessing(false);
      }
    }
  }

  async function handleQRSuccess(paymentIntentId?: string) {
    setShowQR(false);
    try {
      const id = await createOrder(paymentIntentId);
      setDbOrderId(id);
      setPaymentVerified(true); // QR: ชำระผ่าน Stripe แล้ว
      setSuccess(true);
    } catch (e: any) {
      setErrors(prev => ({ ...prev, general: e?.message ?? 'สร้างคำสั่งซื้อไม่สำเร็จ (กรุณาเข้าสู่ระบบ)' }));
    }
  }

  function handleSuccessClose() {
    localStorage.removeItem('flora_cart');
    router.push('/track');
  }

  const addressModeOptions: { value: AddressMode; label: string; desc: string }[] = [
    { value: 'both', label: 'ที่อยู่ + ลิงค์', desc: 'ลิงค์ Google Maps + ที่อยู่' },
    { value: 'address_only', label: 'กรอกที่อยู่', desc: 'ข้อความเท่านั้น' },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] pt-24 pb-20">
        <div className="max-w-xl mx-auto px-4 md:px-6">

          {/* PAGE TITLE */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">สรุปคำสั่งซื้อ</h1>
            <p className="text-white/30 font-mono text-[10px] uppercase tracking-widest mt-1">Order Summary & Checkout</p>
          </div>

          {/* ── SECTION 1: รายการสินค้า ── */}
          <Section icon={<ShoppingBag className="w-4 h-4" />} title="รายการสินค้า" subtitle={`${totalItemCount} ชิ้น`}>
            {errors.cart && <ErrorMsg msg={errors.cart} />}
            {cart.length === 0 ? (
              <div className="text-center py-10 text-white/20">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-mono text-xs uppercase tracking-widest">ยังไม่มีสินค้า</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, i) => {
                  const qty = item.quantity ?? 1;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                        <p className="text-white/50 text-xs">×{qty}</p>
                        <p className="text-[#E11D48] font-black text-sm">฿{(item.price * qty).toLocaleString()}</p>
                      </div>
                      <button onClick={() => removeItem(i)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ── SECTION 2: ที่อยู่จัดส่ง ── */}
          <Section icon={<MapPin className="w-4 h-4" />} title="ที่อยู่จัดส่ง" subtitle="Delivery Address">

            {/* ADDRESS MODE TOGGLE */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {addressModeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAddressMode(opt.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    addressMode === opt.value
                      ? 'bg-[#E11D48]/15 border-[#E11D48]/50 text-white'
                      : 'bg-white/[0.03] border-white/8 text-white/50 hover:border-white/15'
                  }`}
                >
                  <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{opt.label}</p>
                  <p className="text-white/30 text-[9px] mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* ADDRESS TEXT — แสดงเสมอทั้ง 2 โหมด */}
            {true && (
              <div className="mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">
                  ที่อยู่จัดส่ง
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                  rows={3}
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E11D48] transition-colors resize-none ${errors.address ? 'border-red-500' : 'border-white/10'}`}
                />
                {errors.address && <ErrorMsg msg={errors.address} />}
              </div>
            )}

            {/* GOOGLE MAPS LINK — เฉพาะโหมด both */}
            {addressMode === 'both' && (
              <div className="mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">
                  ลิงค์ Google Maps
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={mapsLink}
                    onChange={e => setMapsLink(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E11D48] transition-colors ${errors.mapsLink ? 'border-red-500' : 'border-white/10'}`}
                  />
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                </div>
                {errors.mapsLink && <ErrorMsg msg={errors.mapsLink} />}
                <p className="text-white/25 font-mono text-[9px] mt-1.5">
                  กด Share → Copy Link ใน Google Maps แล้ววางที่นี่
                </p>
              </div>
            )}

            {/* NOTES */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1.5 block">
                <FileText className="w-3 h-3 inline mr-1" />รายละเอียดเพิ่มเติม (ถ้ามี)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="เช่น ฝากไว้หน้าบ้าน / โทรก่อนส่ง / ชั้น 3 ห้อง 304"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#E11D48] transition-colors resize-none"
              />
            </div>
          </Section>

          {/* ── SECTION 3: ช่องทางชำระเงิน ── */}
          <Section icon={<CreditCard className="w-4 h-4" />} title="ช่องทางชำระเงิน" subtitle="Payment Method">
            <div className="space-y-3">
              {/* QR */}
              <PayOption
                selected={payMethod === 'qr'}
                onClick={() => setPayMethod('qr')}
                icon={<QrCode className="w-5 h-5 text-[#E11D48]" />}
                label="QR Code / PromptPay"
                desc="สแกนจ่าย — ตรวจสอบอัตโนมัติ ไม่ต้องแนบสลิป"
              />

              {/* CARD */}
              <PayOption
                selected={payMethod === 'card'}
                onClick={() => setPayMethod('card')}
                icon={<CreditCard className="w-5 h-5 text-[#E11D48]" />}
                label="บัตรเครดิต / เดบิต"
                desc="ตัดเงินอัตโนมัติผ่าน Payment Gateway"
              />
            </div>

            {/* CARD SELECTOR */}
            <AnimatePresence>
              {payMethod === 'card' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">เลือกบัตร</p>
                  <div className="space-y-2">
                    {savedCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => setSelectedCard(card.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selectedCard === card.id
                            ? 'border-[#E11D48]/50 bg-[#E11D48]/5'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                        }`}
                      >
                        <div className="w-10 h-7 rounded-lg bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] flex items-center justify-center shrink-0">
                          <BrandBadge brand={card.brand} />
                        </div>
                        <div className="flex-1">
                          <p className="font-mono text-xs font-bold">•••• {card.last4}</p>
                          <p className="text-white/30 font-mono text-[9px]">{card.holder} · {card.expiry}</p>
                        </div>
                        {selectedCard === card.id && <Check className="w-4 h-4 text-[#E11D48] shrink-0" />}
                      </button>
                    ))}
                    <button
                      onClick={() => router.push('/profile')}
                      className="w-full flex items-center gap-2 p-3 rounded-xl border border-dashed border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all text-xs font-bold"
                    >
                      <CreditCard className="w-4 h-4" />
                      เพิ่มบัตรใหม่ (ไปหน้าโปรไฟล์)
                      <ChevronRight className="w-3 h-3 ml-auto" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Section>

          {/* ── SECTION 4: สรุปยอด ── */}
          <Section icon={<FileText className="w-4 h-4" />} title="สรุปยอด" subtitle="Order Total">
            <div className="space-y-3">
              <SummaryRow label={`สินค้า (${totalItemCount} ชิ้น)`} value={`฿${subtotal.toLocaleString()}`} />
              <SummaryRow label="ค่าจัดส่ง" value={DELIVERY_FEE === 0 ? 'ฟรี' : `฿${DELIVERY_FEE}`} valueClass="text-emerald-400" />
              <div className="border-t border-white/5 pt-3">
                <SummaryRow label="ยอดรวมทั้งหมด" value={`฿${total.toLocaleString()}`} bold />
              </div>
              {payMethod === 'card' && (
                <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300/70 font-mono text-[9px] leading-relaxed">
                    ระบบจะทำการตัดเงิน ฿{total.toLocaleString()} จากบัตรที่เลือก ทันทีที่กดยืนยัน
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* ข้อความ error ทั่วไป (เช่น สร้างออเดอร์ไม่สำเร็จเพราะยังไม่ล็อกอิน) */}
          {errors.general && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm">{errors.general}</p>
            </div>
          )}

          {/* ── CONFIRM BUTTON ── */}
          <button
            onClick={handleConfirm}
            disabled={cart.length === 0 || processing}
            className="w-full bg-[#E11D48] disabled:bg-white/10 disabled:text-white/20 text-white py-5 rounded-2xl font-black tracking-widest uppercase text-sm flex items-center justify-center gap-3 hover:bg-[#be123c] transition-all active:scale-[0.98] mt-2"
          >
            {processing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> กำลังดำเนินการ...</>
            ) : payMethod === 'qr' ? (
              <><QrCode className="w-5 h-5" /> ชำระผ่าน QR Code</>
            ) : (
              <><CreditCard className="w-5 h-5" /> ยืนยันตัดบัตร ฿{total.toLocaleString()}</>
            )}
          </button>

        </div>
      </div>

      {/* MODALS */}
      {showQR && (
        <QRModal
          total={total}
          orderId={`ORD-${Date.now()}`}
          customerEmail={customerEmail}
          customerName={customerName}
          onSuccess={handleQRSuccess}
          onClose={() => setShowQR(false)}
        />
      )}
      {success && (
        <SuccessModal method={payMethod} paymentVerified={paymentVerified} onClose={handleSuccessClose} />
      )}
    </>
  );
}

export default function CheckoutPage() {
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] pt-24 pb-20 flex items-center justify-center">
        <p className="text-white/50 font-mono text-sm">Payment Gateway ไม่ได้ตั้งค่า (NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY)</p>
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
}

/* ─── SUB COMPONENTS ─── */
function Section({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden mb-4">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5">
        <span className="text-[#E11D48]">{icon}</span>
        <div>
          <p className="font-black text-sm tracking-tight">{title}</p>
          {subtitle && <p className="text-white/30 font-mono text-[9px] uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function PayOption({ selected, onClick, icon, label, desc }: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
        selected
          ? 'bg-[#E11D48]/10 border-[#E11D48]/40'
          : 'bg-white/[0.02] border-white/8 hover:border-white/15'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected ? 'bg-[#E11D48]/20' : 'bg-white/5'}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-bold text-sm ${selected ? 'text-white' : 'text-white/70'}`}>{label}</p>
        <p className="text-white/30 font-mono text-[10px]">{desc}</p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? 'border-[#E11D48] bg-[#E11D48]' : 'border-white/20'
      }`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

function SummaryRow({ label, value, bold, valueClass }: {
  label: string;
  value: string;
  bold?: boolean;
  valueClass?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'text-base' : 'text-sm'}`}>
      <span className={bold ? 'font-black' : 'text-white/60 font-medium'}>{label}</span>
      <span className={`font-black ${valueClass ?? (bold ? 'text-[#E11D48]' : 'text-white')}`}>{value}</span>
    </div>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1.5 text-red-400 text-[10px] font-mono mt-1">
      <AlertCircle className="w-3 h-3 shrink-0" />{msg}
    </p>
  );
}
