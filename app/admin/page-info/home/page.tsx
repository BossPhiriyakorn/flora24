'use client';

import { motion } from 'motion/react';
import { Layout, Save, Eye, Settings } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function PageInfoHomePage() {
  const { showToast } = useToast();

  const handleSave = () => {
    showToast('บันทึกข้อมูลหน้าแรกสำเร็จ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการหน้าแรก (Home)</h1>
          <p className="text-slate-500 text-sm">แก้ไขเนื้อหาและโครงสร้างของหน้าแรก</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium">
            <Eye className="w-5 h-5" />
            ดูหน้าเว็บ
          </button>
          <button 
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            บันทึก
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700">หัวข้อหลัก (Hero Title)</label>
          <input type="text" defaultValue="ค้นหาบ้านในฝันของคุณ" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700">คำอธิบาย (Hero Subtitle)</label>
          <textarea rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" defaultValue="เรามีรายการอสังหาริมทรัพย์ที่หลากหลายและครอบคลุมทุกความต้องการของคุณ" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-sm font-bold mb-2">Section: ประกาศล่าสุด</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">แสดงผลบนหน้าแรก</span>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <h4 className="text-sm font-bold mb-2">Section: บทความแนะนำ</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">แสดงผลบนหน้าแรก</span>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
