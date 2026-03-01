import Stripe from 'stripe';

const ENABLED =
  process.env.PAYMENT_GATEWAY_ENABLED === 'true' || process.env.PAYMENT_GATEWAY_ENABLED === '1';
const SECRET_KEY =
  process.env.PAYMENT_GATEWAY_SECRET_KEY && String(process.env.PAYMENT_GATEWAY_SECRET_KEY).trim();

/** ตรวจสอบว่า Gateway เปิดใช้และมี Secret Key (เทียบกับ line_flex_tem config) */
export function isPaymentGatewayConfigured(): boolean {
  return Boolean(ENABLED && SECRET_KEY);
}

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!ENABLED || !SECRET_KEY) {
      throw new Error('Payment gateway is not enabled or PAYMENT_GATEWAY_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(SECRET_KEY, { apiVersion: '2026-02-25.clover' });
  }
  return stripeInstance;
}

/** แปลงจาก บาท → สตางค์ (Stripe ใช้หน่วยเล็กสุดของสกุลเงิน) */
export function toSatang(baht: number): number {
  return Math.round(baht * 100);
}

/** แปลงจาก สตางค์ → บาท */
export function toBaht(satang: number): number {
  return satang / 100;
}
