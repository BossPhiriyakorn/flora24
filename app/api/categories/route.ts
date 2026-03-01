import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

/* ────────────────────────────────────────────────────────────
   GET /api/categories
   รายการหมวดหมู่สินค้าทั้งหมด (public — ใช้ใน store dropdown)
──────────────────────────────────────────────────────────── */
export async function GET() {
  try {
    const db         = await connectDB();
    const categories = await db
      .collection('categories')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({ ok: true, categories });
  } catch (err: any) {
    console.error('[GET /api/categories]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
