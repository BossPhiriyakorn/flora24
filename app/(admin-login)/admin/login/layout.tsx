import { Kanit } from 'next/font/google';

const kanit = Kanit({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'thai'],
  variable: '--font-sans',
});

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${kanit.variable} font-sans`}>{children}</div>;
}
