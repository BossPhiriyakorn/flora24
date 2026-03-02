import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';
import { uploadToDrive, type DriveFolderType } from '@/lib/googleDrive';
import { convertToWebp, isImageMimeType } from '@/lib/imageToWebp';

const FOLDER_TYPE: DriveFolderType = 'products';

/**
 * POST /api/admin/upload/product/[productId]
 * อัปโหลดรูปสินค้า (multipart form "file") → แปลงเป็น WebP → เก็บใน Drive โฟลเดอร์ products/{productId}
 * เรียกเมื่อกดบันทึกสินค้า (ส่งไฟล์พร้อมหรือหลังบันทึกแล้วได้ productId)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { productId } = await params;
    if (!productId?.trim()) {
      return NextResponse.json({ error: 'ไม่มี productId' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'ไม่มีไฟล์รูป' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';
    if (!isImageMimeType(mimeType)) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF, WebP)' }, { status: 400 });
    }

    const webpBuffer = await convertToWebp(buffer, mimeType);
    const filename = `image.webp`;

    const url = await uploadToDrive(FOLDER_TYPE, productId.trim(), webpBuffer, filename, 'image/webp');
    return NextResponse.json({ ok: true, url });
  } catch (err: unknown) {
    console.error('[upload/product]', err);
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'อัปโหลดไม่สำเร็จ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
