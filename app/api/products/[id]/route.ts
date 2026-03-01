import { NextRequest, NextResponse } from 'next/server';
import { connectDB, ObjectId } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/products/[id]
   ข้อมูลสินค้าชิ้นเดียว (public)
──────────────────────────────────────────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    const db      = await connectDB();
    const product = await db.collection('products').findOne({
      _id:    new ObjectId(id),
      status: 'active',
    });

    if (!product) {
      return NextResponse.json({ error: 'ไม่พบสินค้า' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, product });
  } catch (err: any) {
    console.error('[GET /api/products/[id]]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
