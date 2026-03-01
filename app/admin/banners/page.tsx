'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, ExternalLink, Save } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Banner {
  id: number;
  title: string;
  image: string;
  link: string;
  status: string;
}

const initialBanners: Banner[] = [
  { id: 1, title: 'โปรโมชั่นหน้าร้อน ลด 50%', image: 'https://picsum.photos/id/10/800/400', link: '/promo-summer', status: 'แสดงผล' },
  { id: 2, title: 'เปิดจองโครงการใหม่ ย่านบางนา', image: 'https://picsum.photos/id/20/800/400', link: '/new-project', status: 'แสดงผล' },
  { id: 3, title: 'สินเชื่อบ้านดอกเบี้ยต่ำ', image: 'https://picsum.photos/id/30/800/400', link: '/loan-info', status: 'ซ่อน' },
];

export default function BannersPage() {
  const [banners, setBanners] = React.useState<Banner[]>(initialBanners);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBanner, setEditingBanner] = React.useState<Banner | null>(null);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBanner = {
      id: editingBanner ? editingBanner.id : Math.max(0, ...banners.map(b => b.id)) + 1,
      title: formData.get('title') as string,
      image: editingBanner ? editingBanner.image : `https://picsum.photos/id/${Math.floor(Math.random() * 50) + 10}/800/400`,
      link: formData.get('link') as string,
      status: formData.get('status') as string,
    };

    if (editingBanner) {
      setBanners(prev => prev.map(b => b.id === editingBanner.id ? newBanner : b));
      showToast('แก้ไขแบนเนอร์สำเร็จ');
    } else {
      setBanners(prev => [newBanner, ...prev]);
      showToast('เพิ่มแบนเนอร์ใหม่สำเร็จ');
    }
    setIsModalOpen(false);
    setEditingBanner(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแบนเนอร์นี้?')) {
      setBanners(prev => prev.filter(b => b.id !== id));
      showToast('ลบแบนเนอร์สำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แบนเนอร์</h1>
          <p className="text-slate-500 text-sm">จัดการรูปภาพสไลด์และแบนเนอร์หน้าแรก</p>
        </div>
        <button 
          onClick={() => {
            setEditingBanner(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มแบนเนอร์
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner, index) => (
          <motion.div
            key={banner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group"
          >
            <div className="aspect-video relative overflow-hidden">
              <Image 
                src={banner.image} 
                alt={banner.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                width={800}
                height={450}
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${banner.status === 'แสดงผล' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                  {banner.status}
                </span>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">{banner.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <ExternalLink className="w-3 h-3" />
                  {banner.link}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setEditingBanner(banner);
                    setIsModalOpen(true);
                  }}
                  className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            ยังไม่มีแบนเนอร์ในระบบ
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBanner(null);
        }}
        title={editingBanner ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อแบนเนอร์</label>
            <input
              name="title"
              defaultValue={editingBanner?.title}
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ลิงก์ (URL)</label>
            <input
              name="link"
              defaultValue={editingBanner?.link}
              required
              placeholder="/promo-..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">สถานะ</label>
            <select
              name="status"
              defaultValue={editingBanner?.status || 'แสดงผล'}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="แสดงผล">แสดงผล</option>
              <option value="ซ่อน">ซ่อน</option>
            </select>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {editingBanner ? 'บันทึกการแก้ไข' : 'เพิ่มแบนเนอร์'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
