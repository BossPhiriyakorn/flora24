'use client';

import { Megaphone, Save, Eye } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function PageInfoAnnouncementsPage() {
  const { showToast } = useToast();
  const handleSave = () => showToast('บันทึกการตั้งค่าหน้าประกาศแล้ว');
  const handlePreview = () => showToast('ฟีเจอร์ดูหน้าเว็บกำลังพัฒนา', 'error');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการหน้าประกาศขาย-เช่า</h1>
          <p className="text-slate-500 text-sm">ตั้งค่าการแสดงผลและเนื้อหาในหน้าประกาศ</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handlePreview} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium">
            <Eye className="w-5 h-5" />
            ดูหน้าเว็บ
          </button>
          <button type="button" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium">
            <Save className="w-5 h-5" />
            บันทึก
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700">หัวข้อหน้า (Page Title)</label>
          <input type="text" defaultValue="รายการประกาศทั้งหมด" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">จำนวนรายการต่อหน้า</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option>12 รายการ</option>
              <option>24 รายการ</option>
              <option>48 รายการ</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">การเรียงลำดับเริ่มต้น</label>
            <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option>ใหม่ล่าสุด</option>
              <option>ราคา (ต่ำ-สูง)</option>
              <option>ราคา (สูง-ต่ำ)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
