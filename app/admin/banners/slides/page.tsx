'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, MoveHorizontal, Save } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Slide {
  id: number;
  title: string;
  image: string;
  order: number;
}

const initialSlides: Slide[] = [
  { id: 1, title: 'Slide 1', image: 'https://picsum.photos/id/10/800/400', order: 1 },
  { id: 2, title: 'Slide 2', image: 'https://picsum.photos/id/20/800/400', order: 2 },
  { id: 3, title: 'Slide 3', image: 'https://picsum.photos/id/30/800/400', order: 3 },
];

export default function BannerSlidesPage() {
  const [slides, setSlides] = React.useState<Slide[]>(initialSlides);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSlide, setEditingSlide] = React.useState<Slide | null>(null);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSlide = {
      id: editingSlide ? editingSlide.id : Math.max(0, ...slides.map(s => s.id)) + 1,
      title: formData.get('title') as string,
      image: editingSlide ? editingSlide.image : `https://picsum.photos/id/${Math.floor(Math.random() * 50) + 10}/800/400`,
      order: parseInt(formData.get('order') as string) || (editingSlide ? editingSlide.order : slides.length + 1),
    };

    if (editingSlide) {
      setSlides(prev => prev.map(s => s.id === editingSlide.id ? newSlide : s).sort((a, b) => a.order - b.order));
      showToast('แก้ไขสไลด์สำเร็จ');
    } else {
      setSlides(prev => [...prev, newSlide].sort((a, b) => a.order - b.order));
      showToast('เพิ่มสไลด์ใหม่สำเร็จ');
    }
    setIsModalOpen(false);
    setEditingSlide(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสไลด์นี้?')) {
      setSlides(prev => prev.filter(s => s.id !== id));
      showToast('ลบสไลด์สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">สไลด์แบนเนอร์</h1>
          <p className="text-slate-500 text-sm">จัดการลำดับและรูปภาพสไลด์โชว์หน้าแรก</p>
        </div>
        <button 
          onClick={() => {
            setEditingSlide(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มสไลด์ใหม่
        </button>
      </div>

      <div className="space-y-4">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6 group"
          >
            <div className="cursor-move text-slate-300 hover:text-slate-500 transition-colors">
              <MoveHorizontal className="w-6 h-6 rotate-90" />
            </div>
            <div className="w-48 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <Image 
                src={slide.image} 
                alt="" 
                className="w-full h-full object-cover" 
                width={192}
                height={96}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900">{slide.title}</h3>
              <p className="text-xs text-slate-400 mt-1">ลำดับที่: {slide.order}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditingSlide(slide);
                  setIsModalOpen(true);
                }}
                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleDelete(slide.id)}
                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
        {slides.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            ยังไม่มีสไลด์ในระบบ
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlide(null);
        }}
        title={editingSlide ? 'แก้ไขสไลด์' : 'เพิ่มสไลด์ใหม่'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อสไลด์</label>
            <input
              name="title"
              defaultValue={editingSlide?.title}
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ลำดับการแสดงผล</label>
            <input
              name="order"
              type="number"
              defaultValue={editingSlide?.order || slides.length + 1}
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {editingSlide ? 'บันทึกการแก้ไข' : 'เพิ่มสไลด์'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
