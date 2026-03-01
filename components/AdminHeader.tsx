'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminNotificationBell from '@/components/AdminNotificationBell';
import { Flower2, LogOut } from 'lucide-react';

type AdminUser = { firstName: string; lastName: string; roleLabel: string } | null;

// map ชื่อ path → หัวข้อหน้า
const PAGE_TITLES: Record<string, string> = {
  '/admin':                          'หน้าแรก',
  '/admin/products':                 'จัดการสินค้า',
  '/admin/products/categories':      'หมวดหมู่สินค้า',
  '/admin/orders':                   'คำสั่งซื้อ',
  '/admin/articles':                 'บทความ',
  '/admin/articles/new':             'เพิ่มบทความใหม่',
  '/admin/articles/categories':      'หมวดหมู่บทความ',
  '/admin/customer-interests/popup': 'จัดการ POPUP',
  '/admin/contact-us':               'ข้อมูลติดต่อเรา',
  '/admin/members':                  'ข้อมูลสมาชิก',
  '/admin/staff':                    'ข้อมูลพนักงาน',
  '/admin/system':                   'ตั้งค่าระบบ',
};

export default function AdminHeader() {
  const pathname = usePathname();
  const router   = useRouter();
  const [admin, setAdmin] = useState<AdminUser>(null);

  useEffect(() => {
    fetch('/api/auth/admin/me')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.user) {
          setAdmin({
            firstName: data.user.firstName ?? '',
            lastName: data.user.lastName ?? '',
            roleLabel: data.user.roleLabel ?? 'แอดมิน',
          });
        }
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  // ดึงชื่อหน้า — ลอง exact match ก่อน แล้ว fallback prefix
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES)
      .sort((a, b) => b[0].length - a[0].length) // longest prefix wins
      .find(([path]) => pathname.startsWith(path))?.[1] ??
    'Admin';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      {/* left: logo + page title */}
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Flower2 className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-none">
            Flora CMS
          </p>
          <p className="text-sm font-bold text-slate-900 leading-tight">{title}</p>
        </div>
      </div>

      {/* right: notification bell + profile */}
      <div className="flex items-center gap-2">
        {/* notification bell */}
        <AdminNotificationBell />

        {/* divider */}
        <div className="w-px h-5 bg-slate-200" />

        {/* Admin profile */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
            {admin ? (admin.firstName?.charAt(0) || admin.lastName?.charAt(0) || 'A').toUpperCase() : '…'}
          </div>
          <div className="hidden md:block min-w-0">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate">
              {admin ? `${admin.firstName} ${admin.lastName}`.trim() || 'แอดมิน' : '…'}
            </p>
            <p className="text-[10px] text-slate-400">{admin?.roleLabel ?? '—'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="ออกจากระบบ"
          className="p-2 rounded-xl hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
