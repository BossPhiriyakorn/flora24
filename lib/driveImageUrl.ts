/**
 * แปลง URL รูป Google Drive เป็น thumbnail เพื่อให้แสดงใน <img> ได้เสถียร
 * (Drive direct view URL บางครั้งโหลดไม่ขึ้นใน img tag)
 */
export function getDriveImageDisplayUrl(url: string, size = 400): string {
  if (!url?.trim()) return '';
  const m =
    url.match(/drive\.google\.com\/.*?[?&]id=([^&]+)/) ||
    url.match(/drive\.google\.com\/thumbnail\?id=([^&]+)/);
  if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;
  return url;
}
