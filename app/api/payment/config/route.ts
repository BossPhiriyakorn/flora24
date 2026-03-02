import { NextResponse } from 'next/server';

/**
 * คืนค่า Stripe publishable key จาก server (.env)
 * ใช้แทน NEXT_PUBLIC_* เพื่อให้ตั้งค่าใน .env บนเซิร์ฟเวอร์ได้โดยไม่ต้อง build ใหม่
 */
export async function GET() {
  const publicKey =
    process.env.PAYMENT_GATEWAY_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY ||
    '';
  return NextResponse.json({ publicKey: publicKey.trim() || null });
}
