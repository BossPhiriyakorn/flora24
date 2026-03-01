'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Layout, Edit, Eye, Settings, FileText } from 'lucide-react';
import { useToast } from '@/components/Toast';

const pages = [
  { id: 1, name: 'หน้าแรก (Home)', lastEdit: '2 ชั่วโมงที่แล้ว', status: 'Active', editHref: '/page-info/home' },
  { id: 2, name: 'เกี่ยวกับเรา (About Us)', lastEdit: '1 วันที่แล้ว', status: 'Active', editHref: '/about-us' },
  { id: 3, name: 'บริการของเรา (Services)', lastEdit: '3 วันที่แล้ว', status: 'Active', editHref: '/page-info/buy-rent' },
  { id: 4, name: 'นโยบายความเป็นส่วนตัว (Privacy Policy)', lastEdit: '1 สัปดาห์ที่แล้ว', status: 'Draft', editHref: '/page-info/privacy' },
];

export default function PageInfoPage() {
  const { showToast } = useToast();
  const handlePreview = () => showToast('ฟีเจอร์ดูหน้าเว็บกำลังพัฒนา', 'error');
  const handleSeo = () => showToast('ฟีเจอร์ตั้งค่า SEO กำลังพัฒนา', 'error');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ข้อมูลหน้าเพจ</h1>
        <p className="text-slate-500 text-sm">จัดการเนื้อหาและโครงสร้างของแต่ละหน้าบนเว็บไซต์</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pages.map((page, index) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-200 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Layout className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${page.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {page.status}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900">{page.name}</h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              แก้ไขล่าสุด: {page.lastEdit}
            </p>

            <div className="grid grid-cols-3 gap-2 mt-6">
              <Link
                href={page.editHref}
                className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Edit className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-slate-500">แก้ไข</span>
              </Link>
              <button
                type="button"
                onClick={handlePreview}
                className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-bold text-slate-500">ดูหน้าเว็บ</span>
              </button>
              <button
                type="button"
                onClick={handleSeo}
                className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span className="text-[10px] font-bold text-slate-500">ตั้งค่า SEO</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
