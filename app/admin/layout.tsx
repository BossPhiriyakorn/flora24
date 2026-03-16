import type {Metadata} from 'next';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';
import { ProductsProvider } from '@/context/ProductsContext';
import { OrdersProvider } from '@/context/OrdersContext';
import AdminHeader from '@/components/AdminHeader';
export const metadata: Metadata = {
  title: 'Flora24 CMS Admin Panel',
  description: 'A comprehensive CMS backend with a custom sidebar navigation.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f4f7f6] text-slate-900 font-sans min-h-screen">
      <ToastProvider>
        <ProductsProvider>
          <OrdersProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader />
                <main className="flex-1 overflow-y-auto p-8">
                  {children}
                </main>
              </div>
            </div>
          </OrdersProvider>
        </ProductsProvider>
      </ToastProvider>
    </div>
  );
}
