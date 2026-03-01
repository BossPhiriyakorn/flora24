import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FLORA | 24/7 Express Flower Delivery & CMS',
  description: 'FLORA 24/7 EXPRESS — แอปจัดส่งดอกไม้ และระบบจัดการเนื้อหา',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
