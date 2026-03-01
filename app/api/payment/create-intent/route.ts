import { NextRequest, NextResponse } from 'next/server';
import { getStripe, toSatang, isPaymentGatewayConfigured } from '@/lib/stripe';

export interface CreateIntentBody {
  orderId: string;
  amount: number;   // บาท
  method: 'promptpay' | 'card';
  customerEmail?: string;
  customerName?: string;
}

export interface CreateIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  // PromptPay เท่านั้น
  qrCodeUrl?: string;
  expiresAt?: number; // unix timestamp
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateIntentBody = await req.json();
    const { orderId, amount, method, customerEmail, customerName } = body;

    if (!orderId || !amount || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // ตรวจสอบว่า Gateway เปิดใช้และตั้งค่าแล้ว (เทียบ line_flex_tem: isConfigured = ENABLED + SECRET_KEY)
    if (!isPaymentGatewayConfigured()) {
      return NextResponse.json(
        {
          error:
            'Payment gateway not configured. Set PAYMENT_GATEWAY_ENABLED=true and PAYMENT_GATEWAY_SECRET_KEY.',
        },
        { status: 503 }
      );
    }

    const stripe = getStripe();

    let paymentIntent: import('stripe').Stripe.PaymentIntent;

    if (method === 'promptpay') {
      // Stripe บังคับให้มี billing_details.email สำหรับ PromptPay PaymentMethod
      const pm = await stripe.paymentMethods.create({
        type: 'promptpay',
        billing_details: {
          email: customerEmail || 'customer@flora.app',
          ...(customerName ? { name: customerName } : {}),
        },
      });

      paymentIntent = await stripe.paymentIntents.create({
        amount: toSatang(amount),
        currency: 'thb',
        payment_method_types: ['promptpay'],
        payment_method: pm.id,
        confirm: true,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/checkout`,
        metadata: {
          orderId,
          customerName: customerName ?? '',
          customerEmail: customerEmail ?? '',
        },
      });
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount: toSatang(amount),
        currency: 'thb',
        payment_method_types: ['card'],
        metadata: {
          orderId,
          customerName: customerName ?? '',
          customerEmail: customerEmail ?? '',
        },
      });
    }

    const response: CreateIntentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };

    // ดึง QR Code URL สำหรับ PromptPay
    if (
      method === 'promptpay' &&
      paymentIntent.next_action?.type === 'promptpay_display_qr_code'
    ) {
      const qrData = paymentIntent.next_action.promptpay_display_qr_code;
      response.qrCodeUrl    = (qrData as any).image_url_svg ?? (qrData as any).image_url_png;
      response.expiresAt    = (qrData as any).expires_at;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('[create-intent] Stripe error:', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Payment intent creation failed' },
      { status: 500 }
    );
  }
}
