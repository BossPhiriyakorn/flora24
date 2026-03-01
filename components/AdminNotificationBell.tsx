'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell, BellOff, BellRing, X, CheckCheck, Trash2,
  ShoppingBag, CreditCard, XCircle, ChevronRight,
  LogIn, FileText, Users, Settings,
} from 'lucide-react';
import {
  isNotificationSupported,
  getPermissionStatus,
  requestPermission,
} from '@/lib/browserNotifications';
import {
  useAdminNotifications,
  AdminNotification,
  AdminNotifType,
} from '@/hooks/useAdminNotifications';
import { useRouter } from 'next/navigation';

// ── relative time ──
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

// ── notif type config ──
function formatDateTimeThai(ts: number): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

const TYPE_CONFIG: Record<AdminNotifType, { icon: React.ReactNode; color: string; bg: string }> = {
  new_order:            { icon: <ShoppingBag className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  payment_pending:      { icon: <CreditCard   className="w-4 h-4" />, color: 'text-amber-600',  bg: 'bg-amber-100' },
  order_cancelled:      { icon: <XCircle      className="w-4 h-4" />, color: 'text-red-600',    bg: 'bg-red-100' },
  admin_login:          { icon: <LogIn        className="w-4 h-4" />, color: 'text-blue-600',   bg: 'bg-blue-100' },
  new_article:          { icon: <FileText     className="w-4 h-4" />, color: 'text-violet-600', bg: 'bg-violet-100' },
  new_customer:         { icon: <Users        className="w-4 h-4" />, color: 'text-cyan-600',   bg: 'bg-cyan-100' },
  new_product:          { icon: <ShoppingBag  className="w-4 h-4" />, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  new_product_category: { icon: <ShoppingBag  className="w-4 h-4" />, color: 'text-sky-600',    bg: 'bg-sky-100' },
  new_article_category: { icon: <FileText     className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  settings_updated:     { icon: <Settings     className="w-4 h-4" />, color: 'text-slate-600',  bg: 'bg-slate-100' },
};

// ── Permission Banner ──
function PermissionBanner({ onGrant, onDeny }: { onGrant: () => void; onDeny: () => void }) {
  return (
    <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
      <p className="text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
        <BellRing className="w-3.5 h-3.5" />
        เปิดการแจ้งเตือน Browser
      </p>
      <p className="text-[11px] text-emerald-700 mb-2">
        รับแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่หรือสลิปรอตรวจสอบ
      </p>
      <div className="flex gap-2">
        <button
          onClick={onGrant}
          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
        >
          อนุญาต
        </button>
        <button
          onClick={onDeny}
          className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-bold transition-colors hover:bg-slate-50"
        >
          ไม่ใช่ตอนนี้
        </button>
      </div>
    </div>
  );
}

// ── Single Notif Row ──
function NotifRow({ notif, onRead, onNavigate }: {
  notif: AdminNotification;
  onRead: (id: string) => void;
  onNavigate: (notif: AdminNotification) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type] ?? { icon: <Bell className="w-4 h-4" />, color: 'text-slate-600', bg: 'bg-slate-100' };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
        !notif.read ? 'bg-emerald-50/40' : ''
      }`}
      onClick={() => { onRead(notif.id); onNavigate(notif); }}
    >
      {/* icon */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
        {cfg.icon}
      </div>
      {/* text */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold text-slate-900 leading-tight ${!notif.read ? '' : 'opacity-70'}`}>
          {notif.title}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{notif.body}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {notif.actorName && <span>โดย {notif.actorName}</span>}
          {notif.actorName && <span> · </span>}
          <span>{formatDateTimeThai(notif.timestamp)}</span>
        </p>
      </div>
      {/* unread dot + arrow */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {!notif.read && (
          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
        )}
        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
    </motion.div>
  );
}

// ── Main Component ──
export default function AdminNotificationBell() {
  const router = useRouter();
  const [open, setOpen]             = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [showBanner, setShowBanner] = useState(false);
  const [shake, setShake]           = useState(false);
  const dropdownRef                  = useRef<HTMLDivElement>(null);

  const { notifs, unreadCount, markRead, markAllRead, clearAll } = useAdminNotifications();

  // อ่าน permission ปัจจุบัน
  useEffect(() => {
    if (!isNotificationSupported()) return;
    const p = getPermissionStatus();
    setPermission(p);
    setShowBanner(p === 'default'); // แสดง banner เฉพาะตอนที่ยังไม่ตัดสินใจ
  }, []);

  // shake animation เมื่อมี unread ใหม่
  const prevUnreadRef = useRef(0);
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleGrant() {
    const result = await requestPermission();
    setPermission(result);
    setShowBanner(false);
  }

  function handleDeny() {
    setShowBanner(false);
  }

  function handleNavigate(notif: AdminNotification) {
    if (notif.refType === 'order') {
      router.push('/admin/orders');
    } else if (notif.refType === 'article') {
      router.push('/admin/articles');
    }
    setOpen(false);
  }

  const BellIcon = permission === 'denied' ? BellOff : unreadCount > 0 ? BellRing : Bell;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <motion.button
        animate={shake ? { rotate: [0, -15, 15, -10, 10, -5, 5, 0] } : {}}
        transition={{ duration: 0.5 }}
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
      >
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#E11D48] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50"
          >
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-bold text-slate-900">การแจ้งเตือน</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-[#E11D48] text-white px-1.5 py-0.5 rounded-full">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title="ทำเครื่องหมายอ่านทั้งหมด"
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-emerald-600"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifs.length > 0 && (
                  <button
                    onClick={clearAll}
                    title="ลบการแจ้งเตือนทั้งหมด"
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* permission banner */}
            {showBanner && isNotificationSupported() && (
              <PermissionBanner onGrant={handleGrant} onDeny={handleDeny} />
            )}

            {/* denied warning */}
            {permission === 'denied' && (
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <BellOff className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[11px] text-red-600">
                  การแจ้งเตือนถูกบล็อก กรุณาเปิดใน Browser Settings
                </p>
              </div>
            )}

            {/* notification list */}
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-300 gap-2">
                  <Bell className="w-8 h-8" />
                  <p className="text-xs">ยังไม่มีการแจ้งเตือน</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifs.map(n => (
                    <NotifRow
                      key={n.id}
                      notif={n}
                      onRead={markRead}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* footer */}
            {notifs.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                <button
                  onClick={() => { router.push('/admin/orders'); setOpen(false); }}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  ดูคำสั่งซื้อทั้งหมด →
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
