'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Mail, Phone, Calendar, User, ShoppingBag,
  Package, Truck, CheckCircle2, XCircle, Clock, MapPin,
  ChevronDown, ChevronUp, X, StickyNote, CreditCard, Loader2,
} from 'lucide-react';

type CardBrand = 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other';
interface SavedCardDisplayType {
  id: string;
  brand: CardBrand;
  last4: string;
  holderName: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

interface OrderDisplayType {
  id: string;
  date: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  deliveryFee: number;
  paymentStatus: 'success' | 'failed';
  deliveryStatus: 'pending' | 'shipping' | 'delivered' | 'cancelled';
  address: string;
  note?: string;
}

const BRAND_CONFIG: Record<CardBrand, { label: string; colors: string; textColor: string; accent: string }> = {
  visa:       { label: 'VISA',       colors: 'from-[#1a1f71] to-[#1434cb]', textColor: 'text-white', accent: 'text-yellow-300' },
  mastercard: { label: 'Mastercard', colors: 'from-[#eb001b] to-[#f79e1b]', textColor: 'text-white', accent: 'text-white/80' },
  jcb:        { label: 'JCB',        colors: 'from-[#003087] to-[#009f6b]', textColor: 'text-white', accent: 'text-white/80' },
  amex:       { label: 'AMEX',       colors: 'from-[#007bc1] to-[#00a9e0]', textColor: 'text-white', accent: 'text-white/80' },
  other:      { label: 'CARD',       colors: 'from-[#374151] to-[#1f2937]', textColor: 'text-white', accent: 'text-white/80' },
};

function CardChip() {
  return (
    <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="opacity-80">
      <rect width="32" height="24" rx="4" fill="#D4A940" />
      <rect x="11" width="10" height="24" fill="#C9922A" opacity="0.5" />
      <rect y="8" width="32" height="8" fill="#C9922A" opacity="0.5" />
      <rect x="11" y="8" width="10" height="8" fill="#D4A940" opacity="0.6" />
    </svg>
  );
}

function SavedCardDisplay({ card }: { card: SavedCardDisplayType }) {
  const cfg = BRAND_CONFIG[card.brand];
  const isExpired = (() => {
    const y = card.expYear.length === 2 ? 2000 + parseInt(card.expYear, 10) : parseInt(card.expYear, 10);
    const m = parseInt(card.expMonth, 10) - 1;
    const exp = new Date(y, m, 1);
    return exp < new Date();
  })();

  return (
    <div className={`relative bg-gradient-to-br ${cfg.colors} rounded-2xl p-4 shadow-md overflow-hidden`}>
      <div className="absolute inset-0 bg-white/5 rounded-2xl" />
      <div className="flex items-start justify-between mb-3 relative z-10">
        <CardChip />
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-black tracking-widest ${cfg.accent}`}>{cfg.label}</span>
          {card.isDefault && (
            <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-bold">ค่าเริ่มต้น</span>
          )}
        </div>
      </div>
      <div className={`flex items-center gap-2 text-sm font-mono tracking-[0.25em] ${cfg.textColor} mb-3 relative z-10`}>
        <span className="opacity-60">•••• •••• ••••</span>
        <span className="font-bold text-base">{card.last4}</span>
      </div>
      <div className={`flex items-end justify-between ${cfg.textColor} relative z-10`}>
        <div>
          <p className="text-[8px] opacity-50 uppercase tracking-wider mb-0.5">Card Holder</p>
          <p className="text-xs font-bold truncate max-w-[140px]">{card.holderName}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] opacity-50 uppercase tracking-wider mb-0.5">Expires</p>
          <p className={`text-xs font-bold ${isExpired ? 'text-red-300' : ''}`}>
            {card.expMonth}/{card.expYear}
            {isExpired && <span className="ml-1 text-[8px]">(หมดอายุ)</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function paymentBadge(status: string) {
  if (status === 'success')
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3 h-3" />ชำระสำเร็จ</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500"><XCircle className="w-3 h-3" />ชำระไม่สำเร็จ</span>;
}

function deliveryBadge(status: string) {
  if (status === 'delivered')
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3 h-3" />จัดส่งสำเร็จ</span>;
  if (status === 'shipping')
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600"><Truck className="w-3 h-3" />กำลังจัดส่ง</span>;
  if (status === 'cancelled')
    return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500"><XCircle className="w-3 h-3" />ยกเลิก</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500"><Clock className="w-3 h-3" />รอดำเนินการ</span>;
}

function formatPrice(n: number) {
  return n.toLocaleString('th-TH');
}

function OrderDetailModal({ order, onClose }: { order: OrderDisplayType; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: 'spring', damping: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">{order.id}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{order.date}</p>
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
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 flex-1 pr-4">{item.name} <span className="text-slate-400">×{item.qty}</span></span>
                  <span className="font-bold text-slate-900">{formatPrice(item.price * item.qty)} ฿</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>ค่าจัดส่ง</span>
                <span>{order.deliveryFee === 0 ? 'ฟรี' : `${formatPrice(order.deliveryFee)} ฿`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>ยอดรวมทั้งหมด</span>
                <span>{formatPrice(order.total + order.deliveryFee)} ฿</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> ที่อยู่จัดส่ง
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3">{order.address}</p>
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
                <CreditCard className="w-3 h-3" /> การชำระ
              </p>
              {paymentBadge(order.paymentStatus)}
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Truck className="w-3 h-3" /> การจัดส่ง
              </p>
              {deliveryBadge(order.deliveryStatus)}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function mapOrderStatusToDelivery(orderStatus: string): 'pending' | 'shipping' | 'delivered' | 'cancelled' {
  if (orderStatus === 'shipping') return 'shipping';
  if (orderStatus === 'delivered') return 'delivered';
  if (orderStatus === 'cancelled') return 'cancelled';
  return 'pending';
}

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [member, setMember] = React.useState<{
    firstName: string;
    lastName: string;
    nickname?: string;
    phone: string;
    email: string;
    joinDate: string;
    status: 'Active' | 'Suspended';
    savedCards: SavedCardDisplayType[];
    orders: OrderDisplayType[];
  } | null>(null);
  const [selectedOrder, setSelectedOrder] = React.useState<OrderDisplayType | null>(null);
  const [expandedOrders, setExpandedOrders] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/members/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          setMember(null);
          return;
        }
        const u = data.user;
        const orders: OrderDisplayType[] = (data.orders || []).map((o: any) => ({
          id: o.orderId || o._id,
          date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
          items: (o.items || []).map((i: any) => ({ name: i.name || i.productName || '', qty: i.qty ?? i.quantity ?? 1, price: i.price ?? 0 })),
          total: o.total ?? 0,
          deliveryFee: o.deliveryFee ?? 0,
          paymentStatus: (o.paymentStatus === 'verified' ? 'success' : 'failed') as 'success' | 'failed',
          deliveryStatus: mapOrderStatusToDelivery(o.orderStatus || 'pending'),
          address: o.address || '',
          note: o.note,
        }));
        const cards: SavedCardDisplayType[] = (data.cards || []).map((c: any) => ({
          id: c._id,
          brand: (c.brand === 'other' ? 'other' : c.brand) as CardBrand,
          last4: c.last4 || '****',
          holderName: c.holderName || '',
          expMonth: String(c.expMonth ?? '').padStart(2, '0'),
          expYear: c.expYear != null ? (String(c.expYear).length === 2 ? String(c.expYear) : String(c.expYear).slice(-2)) : '',
          isDefault: !!c.isDefault,
        }));
        setMember({
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          nickname: u.nickname,
          phone: u.phone ?? '',
          email: u.email ?? '',
          joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '-',
          status: (u.status === 'suspended' ? 'Suspended' : 'Active') as 'Active' | 'Suspended',
          savedCards: cards,
          orders,
        });
      })
      .catch(() => setError('โหลดข้อมูลล้มเหลว'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalSpend = member ? member.orders.filter(o => o.paymentStatus === 'success').reduce((s, o) => s + o.total, 0) : 0;

  function toggleExpand(orderId: string) {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4 text-slate-500">
        <User className="w-12 h-12 text-slate-300" />
        <p className="font-bold">{error || 'ไม่พบข้อมูลสมาชิก'}</p>
        <Link href="/admin/members" className="text-emerald-600 text-sm hover:underline">
          ← กลับรายการสมาชิก
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/members" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> รายการสมาชิก
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-bold text-slate-900">{member.firstName} {member.lastName}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-3xl mb-4">
                {member.firstName.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{member.firstName} {member.lastName}</h2>
              {member.nickname && <p className="text-sm text-slate-400 mt-0.5">"{member.nickname}"</p>}
              <span className={`mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                member.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                {member.status === 'Active' ? 'ใช้งาน' : 'ระงับ'}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-700">{member.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-700 truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">สมัครเมื่อ</p>
                  <p className="text-slate-700 font-medium">{member.joinDate}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <ShoppingBag className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-slate-900">{member.orders.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">คำสั่งซื้อ</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center">
              <CreditCard className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-lg font-black text-slate-900">{formatPrice(totalSpend)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">ยอดรวม ฿</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-emerald-500" /> บัตรที่ผูกไว้
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {member.savedCards.length} บัตร
              </span>
            </div>
            {member.savedCards.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-slate-300 gap-2">
                <CreditCard className="w-8 h-8" />
                <p className="text-xs">ยังไม่มีบัตรที่ผูกไว้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {member.savedCards.map(card => (
                  <SavedCardDisplay key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" /> ประวัติการสั่งซื้อ
              </h3>
              <span className="text-xs text-slate-400">{member.orders.length} รายการ</span>
            </div>
            {member.orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <ShoppingBag className="w-10 h-10 mb-3 text-slate-200" />
                <p className="text-sm">ยังไม่มีประวัติการสั่งซื้อ</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {member.orders.map(order => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <div key={order.id} className="transition-colors hover:bg-slate-50/50">
                      <div className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-slate-900">{order.id}</p>
                              {paymentBadge(order.paymentStatus)}
                              {deliveryBadge(order.deliveryStatus)}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {order.date}
                              <span className="mx-1">·</span>
                              <Package className="w-3 h-3" /> {order.items.length} รายการ
                              <span className="mx-1">·</span>
                              <span className="font-bold text-slate-600">{formatPrice(order.total)} ฿</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => setSelectedOrder(order)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                              รายละเอียด
                            </button>
                            <button onClick={() => toggleExpand(order.id)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-6 pb-4 space-y-2">
                              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                                {order.items.map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-700 flex-1 pr-4">{item.name}<span className="text-slate-400 ml-1.5">×{item.qty}</span></span>
                                    <span className="font-bold text-slate-900">{formatPrice(item.price * item.qty)} ฿</span>
                                  </div>
                                ))}
                                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                                  <span>รวม</span>
                                  <span>{formatPrice(order.total)} ฿</span>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-xs text-slate-500">
                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                                <span>{order.address}</span>
                              </div>
                              {order.note && (
                                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                                  <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                  <span>{order.note}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </AnimatePresence>
    </div>
  );
}
