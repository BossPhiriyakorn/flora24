import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/api-helpers';
import { uploadToDrive, type DriveFolderType } from '@/lib/googleDrive';
import { convertToWebp, isImageMimeType } from '@/lib/imageToWebp';

const FOLDER_TYPE: DriveFolderType = 'userProfiles';

/**
 * POST /api/admin/upload/profile/[userId]
 * อัปโหลดรูปโปรไฟล์ผู้ใช้ → แปลงเป็น WebP → เก็บใน Drive โฟลเดอร์ user-profiles/{userId}
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  try {
    const { userId } = await params;
    if (!userId?.trim()) {
      return NextResponse.json({ error: 'ไม่มี userId' }, { status: 400 });
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
    const filename = `avatar.webp`;

    const url = await uploadToDrive(FOLDER_TYPE, userId.trim(), webpBuffer, filename, 'image/webp');
    return NextResponse.json({ ok: true, url });
  } catch (err: unknown) {
    console.error('[upload/profile]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ' },
      { status: 500 }
    );
  }
}
