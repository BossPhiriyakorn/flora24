'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Plus, Trash2, Edit } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/components/Toast';

export default function AboutUsImagesPage() {
  const [images, setImages] = React.useState([1, 2, 3, 4, 5, 6]);
  const { showToast } = useToast();

  const handleUpload = () => showToast('ฟีเจอร์อัปโหลดรูปภาพกำลังพัฒนา', 'error');
  const handleEdit = () => showToast('ฟีเจอร์แก้ไขรูปกำลังพัฒนา', 'error');
  const handleDelete = (i: number) => {
    if (confirm('ต้องการลบรูปภาพนี้?')) {
      setImages((prev) => prev.filter((id) => id !== i));
      showToast('ลบรูปภาพแล้ว');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รูปภาพเกี่ยวกับเรา</h1>
          <p className="text-slate-500 text-sm">จัดการคลังรูปภาพสำหรับแสดงในหน้าเกี่ยวกับเรา</p>
        </div>
        <button
          type="button"
          onClick={handleUpload}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          อัปโหลดรูปภาพ
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((i, idx) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group relative"
          >
            <div className="aspect-square bg-slate-100">
              <Image
                src={`https://picsum.photos/id/${i + 80}/400/400`}
                className="w-full h-full object-cover"
                alt=""
                width={400}
                height={400}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button type="button" onClick={handleEdit} className="p-2 bg-white rounded-lg text-slate-900">
                <Edit className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => handleDelete(i)} className="p-2 bg-white rounded-lg text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
