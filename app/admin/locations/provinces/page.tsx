'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Province {
  id: number;
  name: string;
  code: string;
  districts: number;
}

const initialProvinces: Province[] = [
  { id: 1, name: 'กรุงเทพมหานคร', code: '10', districts: 50 },
  { id: 2, name: 'เชียงใหม่', code: '50', districts: 25 },
  { id: 3, name: 'ภูเก็ต', code: '83', districts: 3 },
  { id: 4, name: 'ขอนแก่น', code: '40', districts: 26 },
];

export default function ProvincesPage() {
  const [provinces, setProvinces] = React.useState<Province[]>(initialProvinces);
  const [search, setSearch] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProvince, setEditingProvince] = React.useState<Province | null>(null);
  const { showToast } = useToast();

  const filtered = provinces.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search)
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    const code = (formData.get('code') as string)?.trim();
    if (!name || !code) return;
    const newProvince: Province = {
      id: editingProvince ? editingProvince.id : Math.max(0, ...provinces.map((p) => p.id)) + 1,
      name,
      code,
      districts: editingProvince ? editingProvince.districts : 0,
    };
    if (editingProvince) {
      setProvinces((prev) => prev.map((p) => (p.id === editingProvince.id ? newProvince : p)));
      showToast('แก้ไขจังหวัดสำเร็จ');
    } else {
      setProvinces((prev) => [newProvince, ...prev]);
      showToast('เพิ่มจังหวัดสำเร็จ');
    }
    setIsModalOpen(false);
    setEditingProvince(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบจังหวัดนี้?')) {
      setProvinces((prev) => prev.filter((p) => p.id !== id));
      showToast('ลบจังหวัดสำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลจังหวัด</h1>
          <p className="text-slate-500 text-sm">จัดการรายชื่อจังหวัดที่รองรับในระบบ</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingProvince(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มจังหวัด
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาจังหวัด..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">รหัส</th>
              <th className="px-6 py-4">ชื่อจังหวัด</th>
              <th className="px-6 py-4">จำนวนอำเภอ</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-slate-400">{p.code}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{p.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{p.districts} อำเภอ</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProvince(p);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm">
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProvince(null);
        }}
        title={editingProvince ? 'แก้ไขจังหวัด' : 'เพิ่มจังหวัด'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">รหัสจังหวัด</label>
            <input
              name="code"
              defaultValue={editingProvince?.code}
              required
              className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="10"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">ชื่อจังหวัด</label>
            <input
              name="name"
              defaultValue={editingProvince?.name}
              required
              className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="กรุงเทพมหานคร"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingProvince(null);
              }}
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
