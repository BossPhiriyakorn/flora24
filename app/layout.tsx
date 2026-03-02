import type { Metadata } from 'next';
import { Prompt, Kanit } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  subsets: ['latin'],
  variable: '--font-prompt',
  weight: ['400', '500', '600', '700'],
});

const kanit = Kanit({
  subsets: ['latin', 'thai'],
  variable: '--font-kanit',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FLORA | 24/7 Express Flower Delivery & CMS',
  description: 'FLORA 24/7 EXPRESS — แอปจัดส่งดอกไม้ และระบบจัดการเนื้อหา',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${prompt.variable} ${kanit.variable}`}>
      <body suppressHydrationWarning className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
