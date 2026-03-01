import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId, type SavedCardDoc, type CardBrand } from '@/lib/mongodb';
import { requireUser, isNextResponse } from '@/lib/api-helpers';
import { getStripe, isPaymentGatewayConfigured } from '@/lib/stripe';

/* ────────────────────────────────────────────────────────────
   GET  /api/profile/cards   — รายการบัตรที่ผูกไว้
   POST /api/profile/cards   — ผูกบัตรใหม่ผ่าน Stripe
   Body POST: { stripePaymentMethodId, holderName }
   - stripePaymentMethodId ต้องเป็น pm_xxx จาก stripe.createPaymentMethod() ที่ frontend
   - API จะ verify กับ Stripe เพื่อดึง last4, brand, expMonth, expYear จริง
──────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const db    = await connectDB();
    const cards = await db
      .collection('saved_cards')
      .find({ userId: new ObjectId(auth.sub) })
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ ok: true, cards });
  } catch (err: any) {
    console.error('[GET /api/profile/cards]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { stripePaymentMethodId, holderName } = await req.json();

    // ต้องส่ง stripePaymentMethodId จาก Stripe (pm_xxx) เสมอ
    if (!stripePaymentMethodId || !String(stripePaymentMethodId).startsWith('pm_')) {
      return NextResponse.json(
        { error: 'กรุณาผูกบัตรผ่านฟอร์ม Stripe — ไม่รองรับการกรอกเลขบัตรตรง' },
        { status: 400 },
      );
    }

    // Gateway ต้องเปิดใช้
    if (!isPaymentGatewayConfigured()) {
      return NextResponse.json(
        { error: 'Payment Gateway ยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ' },
        { status: 503 },
      );
    }

    // ── Verify กับ Stripe และดึงข้อมูลบัตรจริง ──
    let last4: string;
    let brand: CardBrand;
    let expMonth: number;
    let expYear: number;

    try {
      const stripe = getStripe();
      const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);

      if (pm.type !== 'card' || !pm.card) {
        return NextResponse.json({ error: 'รองรับเฉพาะบัตรเครดิต/เดบิต' }, { status: 400 });
      }

      const rawBrand = pm.card.brand;
      last4    = pm.card.last4;
      brand    = (['visa', 'mastercard', 'amex', 'jcb'] as CardBrand[]).includes(rawBrand as CardBrand)
                   ? (rawBrand as CardBrand)
                   : 'other';
      expMonth = pm.card.exp_month;
      expYear  = pm.card.exp_year;
    } catch (stripeErr: any) {
      console.error('[POST /api/profile/cards] Stripe verify error:', stripeErr);
      return NextResponse.json(
        { error: stripeErr.message ?? 'ยืนยันบัตรกับ Stripe ไม่สำเร็จ' },
        { status: 400 },
      );
    }

    const db    = await connectDB();
    const cards = db.collection<SavedCardDoc>('saved_cards');

    // เช็ค duplicate
    const dup = await cards.findOne({ stripePaymentMethodId });
    if (dup) return NextResponse.json({ error: 'บัตรนี้ผูกไว้แล้ว' }, { status: 409 });

    // บัตรแรกของ user → set isDefault=true
    const cardCount = await cards.countDocuments({ userId: new ObjectId(auth.sub) });

    const newCard: SavedCardDoc = {
      userId:                new ObjectId(auth.sub),
      stripePaymentMethodId,
      brand,
      last4,
      expMonth,
      expYear,
      holderName: holderName ? String(holderName).toUpperCase().trim() : 'CARD HOLDER',
      isDefault:  cardCount === 0,
      createdAt:  new Date(),
    };

    const result = await cards.insertOne(newCard);
    return NextResponse.json({ ok: true, id: result.insertedId.toString() }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/profile/cards]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
