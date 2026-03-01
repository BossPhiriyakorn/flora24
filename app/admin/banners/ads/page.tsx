'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Ad {
  id: number;
  title: string;
  size: string;
  status: string;
}

const initialAds: Ad[] = [
  { id: 1, title: 'Ad Sidebar Left', size: '300x600', status: 'Active' },
  { id: 2, title: 'Ad Footer Banner', size: '1200x200', status: 'Active' },
];

export default function BannerAdsPage() {
  const [ads, setAds] = React.useState<Ad[]>(initialAds);
  const { showToast } = useToast();

  const handleAdd = () => showToast('ฟีเจอร์เพิ่มแบนเนอร์กำลังพัฒนา', 'error');
  const handleEdit = (ad: Ad) => showToast(`แก้ไข: ${ad.title} — ฟีเจอร์กำลังพัฒนา`, 'error');
  const handleDelete = (id: number) => {
    if (confirm('ต้องการลบแบนเนอร์นี้?')) {
      setAds((prev) => prev.filter((a) => a.id !== id));
      showToast('ลบแบนเนอร์โฆษณาแล้ว');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แบนเนอร์โฆษณา</h1>
          <p className="text-slate-500 text-sm">จัดการพื้นที่โฆษณาและแบนเนอร์ส่วนอื่นๆ ของเว็บไซต์</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มแบนเนอร์โฆษณา
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ads.map((ad, index) => (
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <ExternalLink className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-wider">
                {ad.status}
              </span>
            </div>
            <h3 className="font-bold text-slate-900">{ad.title}</h3>
            <p className="text-xs text-slate-500 mt-1">ขนาดที่แนะนำ: {ad.size} px</p>
            <div className="mt-6 flex items-center gap-2">
              <button type="button" onClick={() => handleEdit(ad)} className="flex-1 py-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-xl text-xs font-bold transition-all">
                แก้ไข
              </button>
              <button type="button" onClick={() => handleDelete(ad.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
