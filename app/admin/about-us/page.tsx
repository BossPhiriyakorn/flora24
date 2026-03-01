'use client';

import { motion } from 'motion/react';
import { Info, Edit, Save, Image as ImageIcon, Plus } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/Toast';

export default function AboutUsPage() {
  const { showToast } = useToast();

  const handleSave = () => {
    showToast('บันทึกข้อมูลเกี่ยวกับเราสำเร็จ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลเกี่ยวกับเรา</h1>
          <p className="text-slate-500 text-sm">จัดการเนื้อหาประวัติความเป็นมาและวิสัยทัศน์ขององค์กร</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-8">
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700">หัวข้อหลัก (Main Title)</label>
            <input 
              type="text" 
              defaultValue="เกี่ยวกับเรา - บริษัท อสังหาฯ จำกัด"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700">เนื้อหา (Content)</label>
            <textarea 
              rows={10}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              defaultValue="เราคือผู้นำด้านการให้บริการซื้อ-ขาย-เช่า อสังหาริมทรัพย์แบบครบวงจร ด้วยประสบการณ์กว่า 10 ปี..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-700">รูปภาพประกอบ</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="aspect-video bg-slate-100 rounded-xl relative group overflow-hidden">
                  <Image 
                    src={`https://picsum.photos/id/${i + 70}/400/300`} 
                    className="w-full h-full object-cover" 
                    alt="" 
                    width={400}
                    height={300}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white rounded-lg text-slate-900"><Edit className="w-4 h-4" /></button>
                    <button className="p-2 bg-white rounded-lg text-red-600"><ImageIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              <button className="aspect-video border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 transition-all">
                <Plus className="w-6 h-6" />
                <span className="text-xs font-bold">เพิ่มรูปภาพ</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
