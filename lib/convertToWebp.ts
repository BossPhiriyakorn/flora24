/**
 * แปลงไฟล์ภาพที่อัปโหลดเป็นรูปแบบ WebP (ลดขนาดและเหมาะกับเว็บ)
 * ใช้ Canvas API ในเบราว์เซอร์
 */

const MAX_DIMENSION = 2400;
const DEFAULT_QUALITY = 0.85;

/**
 * แปลง File (ภาพ) เป็น Blob รูปแบบ image/webp
 * @param file ไฟล์ภาพจาก input
 * @param quality คุณภาพ 0–1 (ค่าเริ่มต้น 0.85)
 * @returns Promise<Blob> ข้อมูลภาพ WebP หรือ Blob ของไฟล์เดิมถ้าเบราว์เซอร์ไม่รองรับ WebP
 */
export function convertImageToWebP(
  file: File,
  quality: number = DEFAULT_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('ไม่ใช่ไฟล์ภาพ'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('โหลดภาพไม่สำเร็จ'));
    };

    img.src = objectUrl;
  });
}

/**
 * แปลง File เป็น File ใหม่นามสกุล .webp (ใช้ Blob จาก convertImageToWebP)
 */
export async function convertImageFileToWebP(
  file: File,
  quality?: number
): Promise<File> {
  const blob = await convertImageToWebP(file, quality);
  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], name, { type: 'image/webp' });
}
