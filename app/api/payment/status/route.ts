import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isPaymentGatewayConfigured } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  const intentId = req.nextUrl.searchParams.get('id');
  if (!intentId) {
    return NextResponse.json({ error: 'Missing payment intent id' }, { status: 400 });
  }

  if (!isPaymentGatewayConfigured()) {
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
  }

  try {
    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(intentId);
    return NextResponse.json({
      status: intent.status,
      // succeeded | requires_payment_method | requires_action | processing | canceled
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
