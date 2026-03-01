'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, Search, X, Eye, Truck, CheckCircle2, XCircle,
  Clock, Package, MapPin, StickyNote, CreditCard, Phone,
  Link as LinkIcon, ChevronDown, ChevronUp, Image as ImageIcon,
  AlertCircle, Send, Loader2, RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/Toast';

// ─── Types ───────────────────────────────────────────────────
type OrderStatus  = 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'verified' | 'failed';

interface OrderItem  { name: string; qty: number; price: number; image?: string }
interface ShippingInfo { trackingLink?: string; courierContact?: string; note?: string }

interface ApiOrder {
  _id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  mapsLink?: string;
  note?: string;
  paymentMethod: 'qr' | 'credit_card';
  paymentStatus: PaymentStatus;
  slipImageUrl?: string;
  orderStatus: OrderStatus;
  shippingInfo?: ShippingInfo;
  cancelReason?: string;
}

function formatPrice(n: number) {
  return n.toLocaleString('th-TH');
}

function formatDate(val: string) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
}

// ─── Badges ──────────────────────────────────────────────────
function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config: Record<OrderStatus, { label: string; cls: string }> = {
    pending:   { label: 'รอดำเนินการ', cls: 'bg-amber-50 text-amber-600' },
    preparing: { label: 'เตรียมจัดส่ง', cls: 'bg-blue-50 text-blue-600' },
    shipping:  { label: 'กำลังจัดส่ง', cls: 'bg-purple-50 text-purple-600' },
    delivered: { label: 'จัดส่งสำเร็จ', cls: 'bg-emerald-50 text-emerald-600' },
    cancelled: { label: 'ยกเลิกแล้ว',  cls: 'bg-red-50 text-red-500' },
  };
  const c = config[status];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${c.cls}`}>
      {c.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config: Record<PaymentStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    pending:  { label: 'รอตรวจสอบ', cls: 'bg-amber-50 text-amber-600', icon: <Clock className="w-3 h-3" /> },
    verified: { label: 'ยืนยันแล้ว',  cls: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 className="w-3 h-3" /> },
    failed:   { label: 'ไม่สำเร็จ',   cls: 'bg-red-50 text-red-500', icon: <XCircle className="w-3 h-3" /> },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>
      {c.icon}{c.label}
    </span>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────
function OrderDetailModal({ order, onClose }: { order: ApiOrder; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-slate-900">{order.orderId}</h3>
            <p className="text-xs text-slate-400">{formatDate(order.createdAt)} · {order.customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> รายการสินค้า
            </p>
            <div className="space-y-2 bg-slate-50 rounded-xl p-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700">{item.name} <span className="text-slate-400">×{item.qty}</span></span>
                  <span className="font-bold">{formatPrice(item.price * item.qty)} ฿</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>ค่าจัดส่ง</span>
                  <span>{order.deliveryFee === 0 ? 'ฟรี' : `${formatPrice(order.deliveryFee)} ฿`}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900">
                  <span>ยอดรวม</span>
                  <span>{formatPrice(order.total)} ฿</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> ข้อมูลลูกค้า
            </p>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">ชื่อ</span><span className="font-medium">{order.customerName}</span></div>
              <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">เบอร์</span><span className="font-medium">{order.customerPhone}</span></div>
              <div className="flex gap-2"><span className="text-slate-400 w-16 shrink-0">อีเมล</span><span className="font-medium">{order.customerEmail}</span></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> ที่อยู่จัดส่ง
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{order.address}</p>
            {order.mapsLink && (
              <a href={order.mapsLink} target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 text-xs text-emerald-600 hover:underline">
                <LinkIcon className="w-3.5 h-3.5" /> ดูใน Google Maps
              </a>
            )}
          </div>
          {order.note && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> หมายเหตุ
              </p>
              <p className="text-sm text-slate-700 bg-amber-50 rounded-xl p-3">{order.note}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> ช่องทางชำระ
              </p>
              <p className="text-sm font-bold text-slate-700">
                {order.paymentMethod === 'qr' ? '📲 QR / PromptPay' : '💳 บัตรเครดิต'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> สถานะชำระ
              </p>
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </div>
          {order.shippingInfo && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> ข้อมูลการจัดส่ง
              </p>
              <div className="bg-blue-50 rounded-xl p-3 space-y-1 text-sm text-blue-900">
                {order.shippingInfo.courierContact && <p>📞 {order.shippingInfo.courierContact}</p>}
                {order.shippingInfo.trackingLink && (
                  <a href={order.shippingInfo.trackingLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline">
                    <LinkIcon className="w-3.5 h-3.5" /> {order.shippingInfo.trackingLink}
                  </a>
                )}
                {order.shippingInfo.note && <p className="text-blue-700">📝 {order.shippingInfo.note}</p>}
              </div>
            </div>
          )}
          {order.cancelReason && (
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">
              <p className="font-bold mb-0.5">เหตุผลการยกเลิก</p>
              <p>{order.cancelReason}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Slip Modal ───────────────────────────────────────────────
function SlipModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <p className="font-bold text-slate-900">สลิปการโอนเงิน</p>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="slip" className="w-full object-contain max-h-[60vh]" />
      </motion.div>
    </motion.div>
  );
}

// ─── Shipping Modal ───────────────────────────────────────────
function ShippingModal({ orderId, onDone, onClose }: { orderId: string; onDone: () => void; onClose: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<ShippingInfo>({ courierContact: '', trackingLink: '', note: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'ship', shippingInfo: form }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'เกิดข้อผิดพลาด', 'error'); return; }
      showToast('อัพเดทสถานะจัดส่งแล้ว', 'success');
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">ยืนยันการจัดส่ง</h3>
            <p className="text-xs text-slate-400 mt-0.5">กรอกข้อมูลผู้จัดส่งหรือลิงค์ติดตาม</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" /> เบอร์ติดต่อผู้จัดส่ง
            </label>
            <input type="tel" value={form.courierContact} onChange={e => setForm(p => ({ ...p, courierContact: e.target.value }))}
              placeholder="08x-xxx-xxxx"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-slate-400" /> ลิงค์ติดตาม (Tracking URL)
            </label>
            <input type="url" value={form.trackingLink} onChange={e => setForm(p => ({ ...p, trackingLink: e.target.value }))}
              placeholder="https://track.example.com/..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-slate-400" /> หมายเหตุการจัดส่ง
            </label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              rows={2} placeholder="เช่น รถพิคอัพสีขาว ทะเบียน กก-1234"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>
          <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
            หากไม่มีลิงค์หรือเบอร์ติดต่อสามารถกดจัดส่งได้เลย
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
              ยกเลิก
            </button>
            <button type="submit" disabled={loading}
              className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} จัดส่ง
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Cancel Modal ─────────────────────────────────────────────
function CancelModal({ orderId, onDone, onClose }: { orderId: string; onDone: () => void; onClose: () => void }) {
  const { showToast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'cancel', cancelReason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'เกิดข้อผิดพลาด', 'error'); return; }
      showToast('ยกเลิกคำสั่งซื้อแล้ว');
      onDone();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">ยกเลิกคำสั่งซื้อ</h3>
            <p className="text-xs text-slate-400 mt-0.5">กรุณาระบุเหตุผลการยกเลิก</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="เช่น ลูกค้าขอยกเลิก / สินค้าหมด / ชำระเงินไม่ถูกต้อง" required
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onClose}
              className="py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
              ปิด
            </button>
            <button type="submit" disabled={loading}
              className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} ยกเลิก Order
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'รอดำเนินการ', value: 'pending' },
  { label: 'เตรียมจัดส่ง', value: 'preparing' },
  { label: 'กำลังจัดส่ง', value: 'shipping' },
  { label: 'จัดส่งสำเร็จ', value: 'delivered' },
  { label: 'ยกเลิก', value: 'cancelled' },
];

export default function OrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders]           = useState<ApiOrder[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [detailOrder, setDetailOrder]   = useState<ApiOrder | null>(null);
  const [slipUrl, setSlipUrl]           = useState<string | null>(null);
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [cancelOrderId, setCancelOrderId]     = useState<string | null>(null);
  const [expandedIds, setExpandedIds]         = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading]     = useState<Record<string, boolean>>({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch {
      showToast('โหลดคำสั่งซื้อล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, showToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleAction(orderId: string, action: string, extra?: Record<string, unknown>) {
    setActionLoading(p => ({ ...p, [orderId]: true }));
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'เกิดข้อผิดพลาด', 'error'); return; }
      showToast('อัพเดทสำเร็จ', 'success');
      fetchOrders();
    } finally {
      setActionLoading(p => ({ ...p, [orderId]: false }));
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
    });
  }

  const counts = useMemo(() => {
    const r: Record<string, number> = { all: total };
    STATUS_FILTERS.slice(1).forEach(f => {
      r[f.value] = orders.filter(o => o.orderStatus === f.value).length;
    });
    return r;
  }, [orders, total]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">คำสั่งซื้อ</h1>
          <p className="text-slate-500 text-sm">ตรวจสอบและจัดการคำสั่งซื้อทั้งหมด ({total} รายการ)</p>
        </div>
        <button onClick={fetchOrders} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="รีเฟรช">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* stat chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === f.value
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
            }`}>
            {f.label}
            {counts[f.value] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${
                statusFilter === f.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {counts[f.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="ค้นหา (หมายเลข Order, ชื่อ, เบอร์)..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-4 py-3 w-6" />
                  <th className="px-4 py-3">Order / ลูกค้า</th>
                  <th className="px-4 py-3">สินค้า</th>
                  <th className="px-4 py-3">ชำระ</th>
                  <th className="px-4 py-3">สถานะ Order</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => {
                  const expanded   = expandedIds.has(order._id);
                  const isLoading  = actionLoading[order._id];
                  const canPrepare = order.orderStatus === 'pending';
                  const canShip    = order.orderStatus === 'preparing';
                  const canCancel  = !['delivered', 'cancelled'].includes(order.orderStatus);

                  return (
                    <React.Fragment key={order._id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleExpand(order._id)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono font-bold text-slate-900">{order.orderId}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{order.customerName}</p>
                          <p className="text-[10px] text-slate-400">{formatDate(order.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-900">{formatPrice(order.total)} ฿</p>
                          <p className="text-xs text-slate-400">{order.items.length} รายการ</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500">
                              {order.paymentMethod === 'qr' ? '📲 QR' : '💳 บัตร'}
                            </p>
                            <PaymentBadge status={order.paymentStatus} />
                            {order.paymentMethod === 'qr' && order.slipImageUrl && (
                              <button onClick={() => setSlipUrl(order.slipImageUrl!)}
                                className="flex items-center gap-1 text-[10px] text-emerald-600 hover:underline font-bold mt-1">
                                <ImageIcon className="w-3 h-3" /> ดูสลิป
                              </button>
                            )}
                            {order.paymentMethod === 'qr' && order.paymentStatus === 'pending' && (
                              <button
                                disabled={isLoading}
                                onClick={() => handleAction(order._id, 'verify_payment')}
                                className="text-[10px] font-bold text-emerald-600 hover:underline disabled:opacity-50">
                                ✓ ยืนยันชำระ
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={order.orderStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-end gap-1.5">
                            <button onClick={() => setDetailOrder(order)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors">
                              <Eye className="w-3 h-3" /> รายละเอียด
                            </button>
                            {canPrepare && (
                              <button disabled={isLoading}
                                onClick={() => handleAction(order._id, 'prepare')}
                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />} เตรียมจัดส่ง
                              </button>
                            )}
                            {canShip && (
                              <button onClick={() => setShippingOrderId(order._id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors">
                                <Truck className="w-3 h-3" /> จัดส่ง
                              </button>
                            )}
                            {canCancel && (
                              <button onClick={() => setCancelOrderId(order._id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors">
                                <XCircle className="w-3 h-3" /> ยกเลิก
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      <AnimatePresence>
                        {expanded && (
                          <tr>
                            <td colSpan={6} className="px-0 py-0">
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                className="overflow-hidden bg-slate-50/50">
                                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">รายการสินค้า</p>
                                    <div className="space-y-1">
                                      {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between">
                                          <span className="text-slate-600">{item.name} ×{item.qty}</span>
                                          <span className="font-bold text-slate-800">{formatPrice(item.price * item.qty)} ฿</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ที่อยู่จัดส่ง</p>
                                    <p className="text-slate-600">{order.address}</p>
                                    {order.note && (
                                      <p className="mt-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 text-xs">📝 {order.note}</p>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">ไม่พบคำสั่งซื้อ</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* modals */}
      <AnimatePresence>
        {detailOrder  && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}
        {slipUrl      && <SlipModal url={slipUrl} onClose={() => setSlipUrl(null)} />}
        {shippingOrderId && <ShippingModal orderId={shippingOrderId} onDone={fetchOrders} onClose={() => setShippingOrderId(null)} />}
        {cancelOrderId   && <CancelModal   orderId={cancelOrderId}   onDone={fetchOrders} onClose={() => setCancelOrderId(null)} />}
      </AnimatePresence>
    </div>
  );
}
