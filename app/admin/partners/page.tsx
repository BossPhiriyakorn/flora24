'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Globe, Save } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Partner {
  id: number;
  name: string;
  logo: string;
  website: string;
}

const initialPartners: Partner[] = [
  { id: 1, name: 'ธนาคารกสิกรไทย', logo: 'https://picsum.photos/id/101/200/200', website: 'https://kasikornbank.com' },
  { id: 2, name: 'SC Asset', logo: 'https://picsum.photos/id/102/200/200', website: 'https://scasset.com' },
  { id: 3, name: 'Sansiri', logo: 'https://picsum.photos/id/103/200/200', website: 'https://sansiri.com' },
  { id: 4, name: 'HomePro', logo: 'https://picsum.photos/id/104/200/200', website: 'https://homepro.co.th' },
];

export default function PartnersPage() {
  const [partners, setPartners] = React.useState<Partner[]>(initialPartners);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingPartner, setEditingPartner] = React.useState<Partner | null>(null);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPartner = {
      id: editingPartner ? editingPartner.id : Math.max(0, ...partners.map(p => p.id)) + 1,
      name: formData.get('name') as string,
      logo: editingPartner ? editingPartner.logo : `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 100}/200/200`,
      website: formData.get('website') as string,
    };

    if (editingPartner) {
      setPartners(prev => prev.map(p => p.id === editingPartner.id ? newPartner : p));
      showToast('แก้ไขข้อมูลพันธมิตรสำเร็จ');
    } else {
      setPartners(prev => [newPartner, ...prev]);
      showToast('เพิ่มพันธมิตรใหม่สำเร็จ');
    }
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบพันธมิตรนี้?')) {
      setPartners(prev => prev.filter(p => p.id !== id));
      showToast('ลบพันธมิตรสำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">พันธมิตร</h1>
          <p className="text-slate-500 text-sm">จัดการข้อมูลโลโก้และลิงก์ของพันธมิตรทางธุรกิจ</p>
        </div>
        <button 
          onClick={() => {
            setEditingPartner(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มพันธมิตร
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center group"
          >
            <div className="w-24 h-24 rounded-xl bg-slate-50 p-4 mb-4 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
              <Image 
                src={partner.logo} 
                alt={partner.name} 
                className="max-w-full max-h-full object-contain" 
                width={80}
                height={80}
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{partner.name}</h3>
            <a href={partner.website} target="_blank" className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1 mb-4">
              <Globe className="w-3 h-3" />
              Website
            </a>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setEditingPartner(partner);
                  setIsModalOpen(true);
                }}
                className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(partner.id)}
                className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {partners.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            ยังไม่มีข้อมูลพันธมิตร
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPartner(null);
        }}
        title={editingPartner ? 'แก้ไขข้อมูลพันธมิตร' : 'เพิ่มพันธมิตรใหม่'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อพันธมิตร</label>
            <input
              name="name"
              defaultValue={editingPartner?.name}
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">เว็บไซต์ (URL)</label>
            <input
              name="website"
              defaultValue={editingPartner?.website}
              required
              placeholder="https://..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {editingPartner ? 'บันทึกการแก้ไข' : 'เพิ่มพันธมิตร'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
