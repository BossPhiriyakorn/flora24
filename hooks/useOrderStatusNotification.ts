'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { showBrowserNotification, getPermissionStatus } from '@/lib/browserNotifications';

const POLL_INTERVAL_MS = 20_000; // poll ทุก 20 วิ (เหมือน admin notifications)

type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

export interface OrderStatusChange {
  orderId: string;
  orderDisplayId: string; // ORD-xxx ที่แสดงหน้าบ้าน
  oldStatus: OrderStatus;
  newStatus: OrderStatus;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   'รอดำเนินการ',
  preparing: 'เตรียมจัดส่ง',
  shipping:  'กำลังจัดส่ง',
  delivered: 'ได้รับสินค้าแล้ว',
  cancelled: 'ยกเลิกแล้ว',
};

export const STATUS_EMOJI: Record<OrderStatus, string> = {
  pending:   '🕐',
  preparing: '📦',
  shipping:  '🚚',
  delivered: '✅',
  cancelled: '❌',
};

export function useOrderStatusNotification(
  onStatusChange?: (change: OrderStatusChange) => void,
) {
  const [loggedIn, setLoggedIn]   = useState(true);
  const [mounted, setMounted]     = useState(false);
  const seenStatusRef             = useRef<Map<string, OrderStatus>>(new Map());
  const isFirstFetchRef           = useRef(true);

  const fetchAndCompare = useCallback(async () => {
    try {
      const res = await fetch('/api/orders/my');

      // ไม่ได้ล็อกอิน — หยุด poll
      if (res.status === 401 || res.status === 403) {
        setLoggedIn(false);
        return;
      }

      const data = await res.json();
      if (!res.ok || !Array.isArray(data.orders)) return;

      setLoggedIn(true);

      const orders = data.orders as Array<{
        _id: string;
        orderId: string;
        orderStatus: OrderStatus;
      }>;

      if (isFirstFetchRef.current) {
        // บันทึก status ปัจจุบันทั้งหมดโดยไม่แจ้งเตือน
        orders.forEach(o => seenStatusRef.current.set(o._id, o.orderStatus));
        isFirstFetchRef.current = false;
        return;
      }

      // เปรียบเทียบ status
      orders.forEach(o => {
        const prev = seenStatusRef.current.get(o._id);
        if (prev !== undefined && prev !== o.orderStatus) {
          // status เปลี่ยน → แจ้งเตือน
          const change: OrderStatusChange = {
            orderId:        o._id,
            orderDisplayId: o.orderId,
            oldStatus:      prev,
            newStatus:      o.orderStatus,
          };

          // Browser Notification (ถ้าได้รับ permission)
          if (getPermissionStatus() === 'granted') {
            showBrowserNotification({
              title: `${STATUS_EMOJI[o.orderStatus]} สถานะคำสั่งซื้ออัปเดต`,
              body:  `${o.orderId} — ${STATUS_LABEL[o.orderStatus]}`,
              tag:   `order-status-${o._id}`,
              onClick: () => {
                window.focus();
                window.location.href = '/track';
              },
            });
          }

          onStatusChange?.(change);
        }
        // อัปเดต ref เสมอ
        seenStatusRef.current.set(o._id, o.orderStatus);
      });
    } catch {
      // ignore network error
    }
  }, [onStatusChange]);

  useEffect(() => {
    setMounted(true);
    fetchAndCompare();
  }, [fetchAndCompare]);

  useEffect(() => {
    if (!mounted || !loggedIn) return;
    const timer = setInterval(fetchAndCompare, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mounted, loggedIn, fetchAndCompare]);
}
