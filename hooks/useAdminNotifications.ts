'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { showBrowserNotification, getPermissionStatus } from '@/lib/browserNotifications';

const POLL_INTERVAL_MS = 20_000;

export type AdminNotifType =
  | 'new_order'
  | 'payment_pending'
  | 'order_cancelled'
  | 'admin_login'
  | 'new_article'
  | 'new_customer'
  | 'new_product'
  | 'new_product_category'
  | 'new_article_category'
  | 'settings_updated';

export interface AdminNotification {
  id: string;
  type: AdminNotifType;
  title: string;
  body: string;
  actorName?: string;
  orderId?: string;
  refType?: 'order' | 'article' | 'staff' | 'product' | 'user';
  refId?: string;
  timestamp: number;
  read: boolean;
}

function mapFromApi(item: {
  id: string;
  type: string;
  title: string;
  body: string;
  actorName?: string;
  refType?: string;
  refId?: string;
  timestamp: number;
  read: boolean;
}): AdminNotification {
  return {
    id:        item.id,
    type:      item.type as AdminNotifType,
    title:     item.title,
    body:      item.body,
    actorName: item.actorName,
    orderId:   item.refType === 'order' ? item.refId : undefined,
    refType:   item.refType as AdminNotification['refType'],
    refId:     item.refId,
    timestamp: item.timestamp,
    read:      item.read,
  };
}

export function useAdminNotifications() {
  const [notifs, setNotifs]       = useState<AdminNotification[]>([]);
  const [mounted, setMounted]     = useState(false);
  const seenIdsRef                = useRef<Set<string>>(new Set());

  const isFirstFetchRef = useRef(true);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (!res.ok) return;
      const list = (data.notifications ?? []).map(mapFromApi);
      setNotifs(list);

      if (getPermissionStatus() === 'granted') {
        if (isFirstFetchRef.current) {
          list.forEach((n: AdminNotification) => seenIdsRef.current.add(n.id));
          isFirstFetchRef.current = false;
        } else {
          list.forEach((n: AdminNotification) => {
            if (!seenIdsRef.current.has(n.id)) {
              seenIdsRef.current.add(n.id);
              if (!n.read) showBrowserNotification({ title: n.title, body: n.body, tag: n.id });
            }
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchNotifs();
  }, [fetchNotifs]);

  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(fetchNotifs, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [mounted, fetchNotifs]);

  const markRead = useCallback(async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ id }),
      });
    } catch {
      // revert on error
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ markAll: true }),
      });
    } catch {
      // revert
      setNotifs((prev) => prev.map((n) => ({ ...n, read: false })));
    }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifs([]);
    seenIdsRef.current.clear();
    try {
      await fetch('/api/admin/notifications', { method: 'DELETE' });
    } catch {
      fetchNotifs();
    }
  }, [fetchNotifs]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  return { notifs, unreadCount, markRead, markAllRead, clearAll };
}
