'use client';

import { Save } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function PageInfoPrivacyPage() {
  const { showToast } = useToast();
  const handleSave = () => showToast('บันทึกนโยบายความเป็นส่วนตัวแล้ว');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการหน้าโยบายความเป็นส่วนตัว</h1>
          <p className="text-slate-500 text-sm">แก้ไขเนื้อหานโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA)</p>
        </div>
        <button type="button" onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium">
          <Save className="w-5 h-5" />
          บันทึก
        </button>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-700">เนื้อหานโยบายความเป็นส่วนตัว</label>
          <textarea rows={15} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" defaultValue="นโยบายความเป็นส่วนตัว... เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ..." />
        </div>
      </div>
    </div>
  );
}
