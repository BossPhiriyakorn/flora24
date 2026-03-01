import sharp from 'sharp';

/** แปลง buffer รูปภาพเป็น WebP (คุณภาพ 85, ลดขนาด) */
export async function convertToWebp(input: Buffer, mimeType?: string): Promise<Buffer> {
  const image = sharp(input);
  return image
    .webp({ quality: 85 })
    .toBuffer();
}

/** ตรวจว่าเป็นรูปที่รองรับการแปลงหรือไม่ */
export function isImageMimeType(mime: string): boolean {
  return /^image\/(jpeg|jpg|png|gif|webp|bmp|tiff?)$/i.test(mime);
}
