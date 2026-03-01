import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isPaymentGatewayConfigured } from '@/lib/stripe';
import { connectDB, type OrderDoc } from '@/lib/mongodb';
import Stripe from 'stripe';

export const runtime = 'nodejs';

/**
 * Webhook จาก Payment Gateway (Stripe)
 * ระบบไม่เก็บข้อมูลบัตร — รับเฉพาะผลจาก Gateway (ผ่าน/ไม่ผ่าน) แล้วอัปเดตสถานะออเดอร์
 */

export async function POST(req: NextRequest) {
  if (!isPaymentGatewayConfigured()) {
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
  }
  const webhookSecret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[webhook] PAYMENT_GATEWAY_WEBHOOK_SECRET not set — skipping signature verification');
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature') ?? '';

    if (webhookSecret && signature) {
      event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const paymentIntentId = (event.data.object as Stripe.PaymentIntent)?.id;

  switch (event.type) {
    case 'payment_intent.succeeded': {
      if (paymentIntentId) {
        try {
          const db = await connectDB();
          const r = await db.collection<OrderDoc>('orders').updateOne(
            { stripePaymentIntentId: paymentIntentId },
            { $set: { paymentStatus: 'verified', updatedAt: new Date() } }
          );
          if (r.matchedCount) console.log(`[webhook] ✅ Order paymentStatus → verified (pi: ${paymentIntentId})`);
        } catch (e) {
          console.error('[webhook] Update order verified failed:', e);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled': {
      if (paymentIntentId) {
        try {
          const db = await connectDB();
          const r = await db.collection<OrderDoc>('orders').updateOne(
            { stripePaymentIntentId: paymentIntentId },
            { $set: { paymentStatus: 'failed', updatedAt: new Date() } }
          );
          if (r.matchedCount) console.log(`[webhook] ❌ Order paymentStatus → failed (pi: ${paymentIntentId})`);
        } catch (e) {
          console.error('[webhook] Update order failed status failed:', e);
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
