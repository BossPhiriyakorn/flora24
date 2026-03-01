'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Info, Edit, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Section {
  id: number;
  title: string;
  status: string;
}

const initialSections: Section[] = [
  { id: 1, title: 'ประวัติความเป็นมา', status: 'Active' },
  { id: 2, title: 'วิสัยทัศน์และพันธกิจ', status: 'Active' },
  { id: 3, title: 'ทีมงานของเรา', status: 'Active' },
];

export default function AboutUsManagePage() {
  const [sections, setSections] = React.useState<Section[]>(initialSections);
  const { showToast } = useToast();

  const handleAdd = () => showToast('ฟีเจอร์เพิ่มหัวข้อกำลังพัฒนา (หรือเพิ่มในฟอร์ม)', 'error');
  const handleEdit = (title: string) => showToast(`แก้ไข: ${title} — ฟีเจอร์กำลังพัฒนา`, 'error');
  const handleDelete = (id: number) => {
    if (confirm('ต้องการลบหัวข้อนี้?')) {
      setSections((prev) => prev.filter((s) => s.id !== id));
      showToast('ลบหัวข้อแล้ว');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการเกี่ยวกับเรา</h1>
          <p className="text-slate-500 text-sm">จัดการโครงสร้างและหัวข้อต่างๆ ในหน้าเกี่ยวกับเรา</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มหัวข้อใหม่
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Info className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-slate-900">{item.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleEdit(item.title)} className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg">
                <Edit className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
