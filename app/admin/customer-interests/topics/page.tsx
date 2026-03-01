'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Tags, Plus, Edit, Trash2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Topic {
  id: number;
  name: string;
  count: number;
}

const initialTopics: Topic[] = [
  { id: 1, name: 'บ้านเดี่ยว', count: 156 },
  { id: 2, name: 'คอนโดมิเนียม', count: 89 },
  { id: 3, name: 'ทาวน์โฮม', count: 42 },
  { id: 4, name: 'ที่ดิน', count: 28 },
];

export default function InterestTopicsPage() {
  const [topics, setTopics] = React.useState<Topic[]>(initialTopics);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<Topic | null>(null);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    if (!name) return;
    const newTopic: Topic = {
      id: editingTopic ? editingTopic.id : Math.max(0, ...topics.map(t => t.id)) + 1,
      name,
      count: editingTopic ? editingTopic.count : 0,
    };
    if (editingTopic) {
      setTopics(prev => prev.map(t => t.id === editingTopic.id ? newTopic : t));
      showToast('แก้ไขเรื่องที่สนใจสำเร็จ');
    } else {
      setTopics(prev => [newTopic, ...prev]);
      showToast('เพิ่มเรื่องที่สนใจสำเร็จ');
    }
    setIsModalOpen(false);
    setEditingTopic(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?')) {
      setTopics(prev => prev.filter(t => t.id !== id));
      showToast('ลบเรื่องที่สนใจสำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">เรื่องที่สนใจ</h1>
          <p className="text-slate-500 text-sm">จัดการหมวดหมู่ความสนใจที่ลูกค้าสามารถเลือกได้</p>
        </div>
        <button
          onClick={() => {
            setEditingTopic(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มเรื่องที่สนใจ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                <Tags className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{topic.name}</p>
                <p className="text-[10px] text-slate-400">{topic.count} รายการ</p>
              </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditingTopic(topic);
                  setIsModalOpen(true);
                }}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(topic.id)}
                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTopic(null); }}
        title={editingTopic ? 'แก้ไขเรื่องที่สนใจ' : 'เพิ่มเรื่องที่สนใจ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">ชื่อเรื่องที่สนใจ</label>
            <input
              name="name"
              defaultValue={editingTopic?.name}
              required
              className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="เช่น บ้านเดี่ยว"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setEditingTopic(null); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium"
            >
              บันทึก
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
