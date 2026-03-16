/**
 * instrumentation.ts
 * รันก่อน Next.js app start — ใช้สำหรับตั้งค่า Node.js runtime
 * ไฟล์นี้ไม่ถูก bundle โดย webpack, รันใน Node.js จริงๆ
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // ตั้ง TLS workaround สำหรับ MongoDB ก่อนโหลดโมดูลใด ๆ (แก้ ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR บน Windows)
    const tlsInsecure =
      process.env.MONGODB_TLS_INSECURE === '1' ||
      process.env.MONGODB_TLS_INSECURE === 'true' ||
      (process.env.NODE_ENV === 'development' && process.env.MONGODB_TLS_INSECURE !== '0');
    if (tlsInsecure) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const dns = await import('dns');
    dns.setDefaultResultOrder?.('ipv4first');
    // ใช้ Google DNS เฉพาะเมื่อ MONGODB_USE_GOOGLE_DNS=1 — ตอน Deploy ไม่ตั้ง จะใช้ DNS ของเซิร์ฟเวอร์ (ไม่ผูก IP/DNS)
    const useGoogleDns =
      process.env.MONGODB_USE_GOOGLE_DNS === '1' || process.env.MONGODB_USE_GOOGLE_DNS === 'true';
    if (useGoogleDns) {
      dns.setServers(['8.8.8.8', '8.8.4.4']);
      console.log('[instrumentation] DNS servers set to Google DNS (8.8.8.8, 8.8.4.4)');
    }
  }
}
