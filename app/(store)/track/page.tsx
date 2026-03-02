'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package, Truck, CheckCircle2, Clock, X,
  MapPin, Phone, Link as LinkIcon, StickyNote,
  ChevronDown, ChevronUp, Loader2, RefreshCw,
} from 'lucide-react';

type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

interface ShippingInfo {
  trackingLink?: string;
  courierContact?: string;
  note?: string;
}

interface OrderItem {
  productId?: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface ApiOrder {
  _id: string;
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
  mapsLink?: string;
  note?: string;
  orderStatus: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  shippingInfo?: ShippingInfo;
  cancelReason?: string;
  createdAt: string;
}

function formatPrice(n: number) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

/* ─── Status step bar ─── */
const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'pending',   label: 'รอดำเนินการ', icon: <Clock className="w-4 h-4" /> },
  { status: 'preparing', label: 'เตรียมจัดส่ง', icon: <Package className="w-4 h-4" /> },
  { status: 'shipping',  label: 'กำลังจัดส่ง', icon: <Truck className="w-4 h-4" /> },
  { status: 'delivered', label: 'ได้รับแล้ว',   icon: <CheckCircle2 className="w-4 h-4" /> },
];

const STEP_INDEX: Partial<Record<OrderStatus, number>> = {
  pending: 0, preparing: 1, shipping: 2, delivered: 3,
};

function StatusBar({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 py-3">
        <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center">
          <X className="w-4 h-4 text-red-500" />
        </div>
        <span className="text-sm font-bold text-red-400">ยกเลิกคำสั่งซื้อแล้ว</span>
      </div>
    );
  }

  const activeIdx = STEP_INDEX[status] ?? 0;
  return (
    <div className="flex items-center gap-0 py-3">
      {STEPS.map((step, i) => {
        const done    = i < activeIdx;
        const active  = i === activeIdx;
        return (
          <React.Fragment key={step.status}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                done    ? 'bg-[#E11D48] text-white' :
                active  ? 'bg-[#E11D48] text-white ring-4 ring-[#E11D48]/20' :
                          'bg-white/10 text-white/30'
              }`}>
                {step.icon}
              </div>
              <span className={`text-[9px] font-bold mt-1 text-center leading-tight max-w-[56px] ${
                done || active ? 'text-white/80' : 'text-white/25'
              }`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mt-[-14px] transition-all ${done ? 'bg-[#E11D48]' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Order Card ─── */
function OrderCard({ order, onConfirmReceived }: {
  order: ApiOrder;
  onConfirmReceived: (id: string) => void;
}) {
  const [expanded, setExpanded]   = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canConfirm = order.orderStatus === 'shipping';
  const showConfirmButton = ['pending', 'preparing', 'shipping'].includes(order.orderStatus);

  async function handleConfirm() {
    if (!canConfirm) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/orders/${order._id}/confirm`, { method: 'PATCH' });
      if (res.ok) onConfirmReceived(order._id);
    } catch { /* ignore */ } finally {
      setConfirming(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-mono font-bold text-white/60">{order.orderId}</p>
            <p className="text-[10px] text-white/30 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-black text-white">{formatPrice(order.total)} ฿</p>
            <p className="text-[10px] text-white/40">{order.items.length} รายการ</p>
          </div>
        </div>

        {/* status bar */}
        <StatusBar status={order.orderStatus} />

        {/* cancel reason */}
        {order.orderStatus === 'cancelled' && order.cancelReason && (
          <p className="text-xs text-red-300/70 bg-red-500/10 rounded-xl px-3 py-2 mt-2">
            เหตุผล: {order.cancelReason}
          </p>
        )}

        {/* shipping info */}
        {order.orderStatus === 'shipping' && order.shippingInfo && (
          <div className="mt-3 bg-[#E11D48]/10 border border-[#E11D48]/20 rounded-xl p-3 space-y-1.5 text-sm">
            <p className="text-xs font-bold text-[#E11D48] uppercase tracking-wider mb-2">ข้อมูลการจัดส่ง</p>
            {order.shippingInfo.courierContact && (
              <a href={`tel:${order.shippingInfo.courierContact}`}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                {order.shippingInfo.courierContact}
              </a>
            )}
            {order.shippingInfo.trackingLink && (
              <a href={order.shippingInfo.trackingLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-[#E11D48] transition-colors">
                <LinkIcon className="w-3.5 h-3.5 text-[#E11D48] shrink-0" />
                ติดตามพัสดุ
              </a>
            )}
            {order.shippingInfo.note && (
              <p className="flex items-start gap-2 text-white/50 text-xs">
                <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                {order.shippingInfo.note}
              </p>
            )}
          </div>
        )}

        {/* confirm received button — แสดงตลอดเมื่อยังไม่ได้รับ/ยกเลิก กดได้เมื่อสถานะเป็นกำลังจัดส่ง */}
        {showConfirmButton && (
          <motion.button
            whileTap={canConfirm ? { scale: 0.97 } : undefined}
            onClick={handleConfirm}
            disabled={!canConfirm || confirming}
            title={!canConfirm ? 'กดได้เมื่อสถานะเป็นกำลังจัดส่ง' : undefined}
            className={`w-full mt-4 py-3 rounded-xl font-black tracking-wide flex items-center justify-center gap-2 transition-colors ${
              canConfirm
                ? 'bg-[#E11D48] hover:bg-[#be123c] text-white disabled:opacity-70'
                : 'bg-white/10 text-white/50 cursor-not-allowed'
            }`}
          >
            {confirming
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <CheckCircle2 className="w-5 h-5" />}
            {confirming ? 'กำลังยืนยัน...' : canConfirm ? 'ได้รับสินค้าแล้ว — ยืนยันการรับ' : 'ได้รับสินค้าแล้ว (กดได้เมื่อกำลังจัดส่ง)'}
          </motion.button>
        )}

        {/* received success */}
        {order.orderStatus === 'delivered' && (
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold bg-emerald-500/10 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5" />
            ยืนยันการรับสินค้าแล้ว
          </div>
        )}
      </div>

      {/* expand items */}
      <div className="border-t border-white/5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors text-xs text-white/40 font-bold"
        >
          ดูรายการสินค้า
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                {order.items.map((item: any, i: number) => {
                  const qty = item.quantity ?? item.qty ?? 1;
                  const name = item.productName ?? item.name ?? '';
                  return (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-white/60">
                        {name}
                        <span className="text-white/30"> ×{qty}</span>
                      </span>
                      <span className="font-bold text-white/80">{formatPrice(item.price * qty)} ฿</span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white/90">
                  <span>รวม</span>
                  <span>{formatPrice(order.total)} ฿</span>
                </div>
                {order.address && (
                  <div className="flex items-start gap-2 text-xs text-white/40 pt-1">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{order.address}</span>
                  </div>
                )}
                {order.note && (
                  <div className="flex items-start gap-2 text-xs text-white/40">
                    <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{order.note}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function TrackPage() {
  const [orders, setOrders]   = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/orders/my');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'โหลดข้อมูลล้มเหลว');
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function handleConfirmReceived(id: string) {
    setOrders(prev =>
      prev.map(o => o._id === id ? { ...o, orderStatus: 'delivered' as OrderStatus } : o)
    );
  }

  const active  = orders.filter(o => !['delivered', 'cancelled'].includes(o.orderStatus));
  const history = orders.filter(o =>  ['delivered', 'cancelled'].includes(o.orderStatus));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-24 pb-20 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">ติดตามสินค้า</h1>
            <p className="text-white/40 text-sm mt-1">ตรวจสอบสถานะคำสั่งซื้อของคุณ</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/30">
            <X className="w-10 h-10 text-red-400/50" />
            <p className="font-bold text-red-400/70">{error}</p>
            {error.includes('ไม่ได้เข้าสู่ระบบ') && (
              <p className="text-sm text-white/30">กรุณาเข้าสู่ระบบเพื่อดูคำสั่งซื้อ</p>
            )}
            <button
              onClick={fetchOrders}
              className="mt-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50 hover:text-white transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-white/30">
            <Package className="w-16 h-16 text-white/10" />
            <p className="font-bold">ยังไม่มีคำสั่งซื้อ</p>
            <p className="text-sm">เมื่อคุณสั่งสินค้า จะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#E11D48] rounded-full animate-pulse" />
                  กำลังดำเนินการ ({active.length})
                </h2>
                {active.map(order => (
                  <OrderCard key={order._id} order={order} onConfirmReceived={handleConfirmReceived} />
                ))}
              </div>
            )}
            {history.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-white/30 uppercase tracking-wider">
                  ประวัติคำสั่งซื้อ ({history.length})
                </h2>
                {history.map(order => (
                  <OrderCard key={order._id} order={order} onConfirmReceived={handleConfirmReceived} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
