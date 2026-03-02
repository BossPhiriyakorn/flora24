import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  serverExternalPackages: ['mongodb', 'bcryptjs'],
  outputFileTracingRoot: __dirname,
  // ขนาด body สูงสุดสำหรับ request (อัปโหลดรูป) — ตั้ง 5GB เพื่อให้อัปและแปลงรูปได้; ถ้า 413 ยังเกิด ให้ตั้ง Nginx client_max_body_size 5G (ดู .github/DEPLOY_SETUP.md)
  experimental: {
    serverActions: { bodySizeLimit: '5gb' },
  },
  // รองรับการเข้าผ่าน tunnel (Cloudflare ฯลฯ) — ใส่ NEXT_PUBLIC_APP_URL หรือ NEXT_PUBLIC_ALLOWED_ORIGINS ให้ตรงกับ URL tunnel ปัจจุบัน แล้ว restart dev server (เปลี่ยน tunnel = แก้ .env แล้ว restart)
  // Next.js ต้องการ hostname เท่านั้น (ไม่มี https://) หรือ full origin ก็ได้ — ใส่ทั้ง 2 รูปแบบเพื่อความแน่ใจ
  allowedDevOrigins: (() => {
    const origins: string[] = [];
    const allRaw = [
      process.env.NEXT_PUBLIC_APP_URL,
      ...(process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') ?? []),
    ];
    for (const raw of allRaw) {
      if (!raw) continue;
      const cleaned = raw.trim().replace(/\/$/, '');
      origins.push(cleaned); // full origin: https://xxx.trycloudflare.com
      try {
        const hostname = new URL(cleaned).hostname;
        if (hostname && !origins.includes(hostname)) origins.push(hostname); // hostname only
      } catch { /* ข้าม entry ที่ไม่ใช่ URL */ }
    }
    return [...new Set(origins)];
  })(),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'drive.google.com', port: '', pathname: '/**' },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    return config;
  },
};

export default nextConfig;
