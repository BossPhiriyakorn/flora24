'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { StoreOrder, OrderStatus, PaymentStatus, ShippingInfo } from '@/lib/orders';

const STORAGE_KEY = 'flora_store_orders';

interface OrdersContextValue {
  orders: StoreOrder[];
  updateOrderStatus: (id: string, status: OrderStatus, shippingInfo?: ShippingInfo) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  cancelOrder: (id: string, reason: string) => void;
  getUserOrders: (customerId: string) => StoreOrder[];
  confirmReceived: (id: string) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<StoreOrder[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setOrders(saved ? JSON.parse(saved) : []);
    } catch {
      setOrders([]);
    }
  }, []);

  const persist = useCallback((updated: StoreOrder[]) => {
    setOrders(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus, shippingInfo?: ShippingInfo) => {
    persist(orders.map(o =>
      o.id === id
        ? { ...o, orderStatus: status, ...(shippingInfo ? { shippingInfo } : {}), updatedAt: new Date().toLocaleString('th-TH') }
        : o
    ));
  }, [orders, persist]);

  const updatePaymentStatus = useCallback((id: string, status: PaymentStatus) => {
    persist(orders.map(o =>
      o.id === id ? { ...o, paymentStatus: status, updatedAt: new Date().toLocaleString('th-TH') } : o
    ));
  }, [orders, persist]);

  const cancelOrder = useCallback((id: string, reason: string) => {
    persist(orders.map(o =>
      o.id === id
        ? { ...o, orderStatus: 'cancelled' as OrderStatus, cancelReason: reason, updatedAt: new Date().toLocaleString('th-TH') }
        : o
    ));
  }, [orders, persist]);

  const confirmReceived = useCallback((id: string) => {
    persist(orders.map(o =>
      o.id === id
        ? { ...o, orderStatus: 'delivered' as OrderStatus, updatedAt: new Date().toLocaleString('th-TH') }
        : o
    ));
  }, [orders, persist]);

  const getUserOrders = useCallback((customerId: string) =>
    orders.filter(o => o.customerId === customerId),
  [orders]);

  return (
    <OrdersContext.Provider value={{ orders, updateOrderStatus, updatePaymentStatus, cancelOrder, getUserOrders, confirmReceived }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
