'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Home, Save } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface PropertyType {
  id: number;
  name: string;
  count: number;
}

const initialTypes: PropertyType[] = [
  { id: 1, name: 'บ้านเดี่ยว', count: 124 },
  { id: 2, name: 'คอนโดมิเนียม', count: 85 },
  { id: 3, name: 'ทาวน์โฮม', count: 42 },
  { id: 4, name: 'อาคารพาณิชย์', count: 15 },
];

export default function PropertyTypesPage() {
  const [types, setTypes] = React.useState<PropertyType[]>(initialTypes);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState<PropertyType | null>(null);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newType = {
      id: editingType ? editingType.id : Math.max(0, ...types.map(t => t.id)) + 1,
      name: formData.get('name') as string,
      count: editingType ? editingType.count : 0,
    };

    if (editingType) {
      setTypes(prev => prev.map(t => t.id === editingType.id ? newType : t));
      showToast('แก้ไขประเภทสำเร็จ');
    } else {
      setTypes(prev => [newType, ...prev]);
      showToast('เพิ่มประเภทใหม่สำเร็จ');
    }
    setIsModalOpen(false);
    setEditingType(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประเภทนี้?')) {
      setTypes(prev => prev.filter(t => t.id !== id));
      showToast('ลบประเภทสำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ประเภทของทรัพย์สิน</h1>
          <p className="text-slate-500 text-sm">จัดการหมวดหมู่ประเภทอสังหาริมทรัพย์ในระบบ</p>
        </div>
        <button 
          onClick={() => {
            setEditingType(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มประเภทใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {types.map((type, index) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{type.name}</p>
                <p className="text-[10px] text-slate-400">{type.count} ประกาศ</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                  setEditingType(type);
                  setIsModalOpen(true);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(type.id)}
                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {types.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            ยังไม่มีประเภททรัพย์สินในระบบ
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingType(null);
        }}
        title={editingType ? 'แก้ไขประเภท' : 'เพิ่มประเภทใหม่'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">ชื่อประเภท</label>
            <input
              name="name"
              defaultValue={editingType?.name}
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
              {editingType ? 'บันทึกการแก้ไข' : 'เพิ่มประเภท'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
