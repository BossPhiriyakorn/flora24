'use client';

import { Search, Save, Eye } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function PageInfoBuyRentPage() {
  const { showToast } = useToast();
  const handleSave = () => showToast('บันทึกการตั้งค่าหน้าอยากเช่า-ซื้อแล้ว');
  const handlePreview = () => showToast('ฟีเจอร์ดูหน้าเว็บกำลังพัฒนา', 'error');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการหน้าอยากเช่า-ซื้อ</h1>
          <p className="text-slate-500 text-sm">ตั้งค่าเนื้อหาสำหรับหน้าแสดงความต้องการของลูกค้า</p>
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
          <input type="text" defaultValue="ความต้องการเช่า-ซื้อ" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
        </div>
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700">ข้อความแนะนำ (Intro Text)</label>
          <textarea rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" defaultValue="หากคุณกำลังมองหาอสังหาริมทรัพย์ในแบบที่ต้องการ สามารถลงข้อมูลไว้เพื่อให้ทีมงานช่วยค้นหาได้ที่นี่" />
        </div>
      </div>
    </div>
  );
}
