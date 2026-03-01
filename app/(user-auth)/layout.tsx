import { Outfit, JetBrains_Mono } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

/* Layout สำหรับหน้า auth ของ user
   - ใช้ font เดียวกับ store
   - มี dark background
   - ไม่มี navbar, ไม่มี noise SVG
*/
export default function UserAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${outfit.variable} ${jetbrainsMono.variable} bg-[#0A0A0A] text-[#F5F5F5] antialiased selection:bg-[#E11D48] selection:text-white min-h-screen font-sans`}
    >
      {children}
    </div>
  );
}
