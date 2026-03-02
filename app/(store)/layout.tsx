import type {Metadata} from 'next';
import './globals.css';
import ConditionalNavbar from '@/components/ConditionalNavbar';
import { OrdersProvider } from '@/context/OrdersContext';
import OrderStatusNotifier from '@/components/OrderStatusNotifier';

export const metadata: Metadata = {
  title: 'FLORA 24/7 EXPRESS | Express Flower Delivery Bangkok',
  description: '24/7 Express Flower E-Commerce Platform. Wreaths, Bouquets, and Worship Flowers delivered in 2 hours.',
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] antialiased selection:bg-[#E11D48] selection:text-white overflow-x-hidden min-h-screen font-sans">
      <svg className="pointer-events-none fixed isolate z-[999] h-full w-full opacity-[0.03] mix-blend-soft-light" aria-hidden>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
      <ConditionalNavbar />
      <OrdersProvider>
        {children}
      </OrdersProvider>
      {/* Poll สถานะ order ทุก 20 วิ — แจ้งเตือนเมื่อสถานะเปลี่ยน ไม่ refresh หน้า */}
      <OrderStatusNotifier />
    </div>
  );
}
