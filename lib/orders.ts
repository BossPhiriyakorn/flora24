export type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'verified' | 'failed';
export type PaymentMethod = 'qr' | 'credit_card';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  image?: string;
}

export interface ShippingInfo {
  trackingLink?: string;
  courierContact?: string;
  note?: string;
}

export interface StoreOrder {
  id: string;
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
  addressMode: 'address_link' | 'address_only';
  note?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  slipImageUrl?: string;
  orderStatus: OrderStatus;
  shippingInfo?: ShippingInfo;
  cancelReason?: string;
  updatedAt: string;
}

export function formatPrice(n: number) {
  return n.toLocaleString('th-TH');
}

export function getStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending: 'รอดำเนินการ',
    preparing: 'เตรียมจัดส่ง',
    shipping: 'กำลังจัดส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิกแล้ว',
  };
  return map[status];
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  const map: Record<PaymentStatus, string> = {
    pending: 'รอตรวจสอบ',
    verified: 'ยืนยันแล้ว',
    failed: 'ไม่สำเร็จ',
  };
  return map[status];
}
