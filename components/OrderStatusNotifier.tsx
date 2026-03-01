'use client';

/**
 * OrderStatusNotifier
 * Poll คำสั่งซื้อของลูกค้าในพื้นหลังทุก 20 วินาที
 * เมื่อสถานะเปลี่ยน → แสดง Toast (dark theme) + Browser Notification
 * ไม่ refresh หน้า — form ที่กรอกอยู่ไม่หาย
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Truck, CheckCircle2, X, BellRing, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useOrderStatusNotification,
  OrderStatusChange,
  STATUS_LABEL,
  STATUS_EMOJI,
} from '@/hooks/useOrderStatusNotification';
import {
  isNotificationSupported,
  getPermissionStatus,
  requestPermission,
} from '@/lib/browserNotifications';

/* ── Toast item type ── */
interface StatusToast {
  id: string;
  change: OrderStatusChange;
}

/* ── Icon by status ── */
function StatusIcon({ status }: { status: OrderStatusChange['newStatus'] }) {
  if (status === 'preparing') return <Package  className="w-5 h-5 text-amber-400 shrink-0" />;
  if (status === 'shipping')  return <Truck    className="w-5 h-5 text-blue-400  shrink-0" />;
  if (status === 'delivered') return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
  if (status === 'cancelled') return <XCircle  className="w-5 h-5 text-red-400   shrink-0" />;
  return <Package className="w-5 h-5 text-white/40 shrink-0" />;
}

/* ── Toast Card ── */
function StatusToastCard({
  toast,
  onClose,
  onClick,
}: {
  toast: StatusToast;
  onClose: (id: string) => void;
  onClick: () => void;
}) {
  const { change } = toast;

  const borderColor =
    change.newStatus === 'shipping'  ? 'border-blue-500/30'    :
    change.newStatus === 'delivered' ? 'border-emerald-500/30' :
    change.newStatus === 'cancelled' ? 'border-red-500/30'     :
                                       'border-amber-500/30';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{    opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-start gap-3 bg-[#1a1a1a] border ${borderColor} rounded-2xl px-4 py-3 shadow-2xl w-[300px] cursor-pointer`}
      onClick={onClick}
    >
      <StatusIcon status={change.newStatus} />

      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white/90 leading-tight">
          {STATUS_EMOJI[change.newStatus]} สถานะคำสั่งซื้ออัปเดต
        </p>
        <p className="text-[11px] text-white/50 font-mono mt-0.5 truncate">
          {change.orderDisplayId}
        </p>
        <p className="text-xs font-bold mt-1" style={{
          color:
            change.newStatus === 'shipping'  ? '#60a5fa' :
            change.newStatus === 'delivered' ? '#34d399' :
            change.newStatus === 'cancelled' ? '#f87171' :
                                               '#fbbf24',
        }}>
          {STATUS_LABEL[change.newStatus]}
        </p>
        <p className="text-[10px] text-white/25 mt-0.5">แตะเพื่อดูรายละเอียด</p>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onClose(toast.id); }}
        className="text-white/20 hover:text-white/60 transition-colors p-0.5 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

/* ── Permission Banner (เล็กๆ ติดล่างจอ) ── */
function PermissionBanner({ onGrant, onDeny }: { onGrant: () => void; onDeny: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{    opacity: 0, y: 20 }}
      className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl w-[300px]"
    >
      <div className="flex items-start gap-2 mb-2">
        <BellRing className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-white">เปิดการแจ้งเตือน</p>
          <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
            รับแจ้งเตือนเมื่อสถานะคำสั่งซื้อเปลี่ยน แม้ไม่ได้อยู่ในหน้านี้
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onGrant}
          className="flex-1 py-1.5 bg-[#E11D48] hover:bg-[#be123c] text-white rounded-xl text-xs font-black transition-colors"
        >
          อนุญาต
        </button>
        <button
          onClick={onDeny}
          className="px-3 py-1.5 border border-white/10 text-white/40 rounded-xl text-xs font-black transition-colors hover:border-white/20"
        >
          ไม่ใช่ตอนนี้
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main Component ── */
export default function OrderStatusNotifier() {
  const router = useRouter();
  const [toasts, setToasts]           = useState<StatusToast[]>([]);
  const [showBanner, setShowBanner]   = useState(false);
  const bannerDismissedRef            = useRef(false);

  // แสดง permission banner เมื่อลูกค้า login แล้ว และยังไม่ตัดสินใจ
  useEffect(() => {
    if (!isNotificationSupported()) return;
    if (bannerDismissedRef.current) return;
    if (getPermissionStatus() === 'default') {
      // รอ 5 วิก่อนแสดง banner (ไม่รบกวนตอนเปิดหน้าใหม่)
      const t = setTimeout(() => setShowBanner(true), 5000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleStatusChange = useCallback((change: OrderStatusChange) => {
    const id = `${change.orderId}-${change.newStatus}-${Date.now()}`;
    setToasts(prev => [...prev, { id, change }]);
    // ปิดอัตโนมัติหลัง 7 วิ
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 7000);
  }, []);

  useOrderStatusNotification(handleStatusChange);

  function removeToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  async function handleGrant() {
    await requestPermission();
    setShowBanner(false);
    bannerDismissedRef.current = true;
  }

  function handleDeny() {
    setShowBanner(false);
    bannerDismissedRef.current = true;
  }

  return (
    <div className="fixed bottom-6 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {/* Toast แจ้งเตือนสถานะ */}
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <StatusToastCard
              toast={toast}
              onClose={removeToast}
              onClick={() => {
                removeToast(toast.id);
                router.push('/track');
              }}
            />
          </div>
        ))}

        {/* Banner ขอ permission (แสดงหลังสุด) */}
        {showBanner && (
          <div key="permission-banner" className="pointer-events-auto">
            <PermissionBanner onGrant={handleGrant} onDeny={handleDeny} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
