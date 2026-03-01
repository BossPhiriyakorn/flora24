'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { MapPin, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface SubDistrict {
  id: number;
  name: string;
  district: string;
  province: string;
  zip: string;
}

const initialSubdistricts: SubDistrict[] = [
  { id: 1, name: 'คลองเตย', district: 'คลองเตย', province: 'กรุงเทพมหานคร', zip: '10110' },
  { id: 2, name: 'พระโขนง', district: 'คลองเตย', province: 'กรุงเทพมหานคร', zip: '10110' },
  { id: 3, name: 'คลองตัน', district: 'คลองเตย', province: 'กรุงเทพมหานคร', zip: '10110' },
];

export default function SubDistrictsPage() {
  const [subdistricts, setSubdistricts] = React.useState<SubDistrict[]>(initialSubdistricts);
  const [search, setSearch] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSub, setEditingSub] = React.useState<SubDistrict | null>(null);
  const { showToast } = useToast();

  const filtered = subdistricts.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.district.toLowerCase().includes(search.toLowerCase()) ||
    s.zip.includes(search)
  );

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    const district = (formData.get('district') as string)?.trim();
    const province = (formData.get('province') as string)?.trim();
    const zip = (formData.get('zip') as string)?.trim();
    if (!name || !district || !province || !zip) return;
    const newSub: SubDistrict = {
      id: editingSub ? editingSub.id : Math.max(0, ...subdistricts.map(s => s.id)) + 1,
      name,
      district,
      province,
      zip,
    };
    if (editingSub) {
      setSubdistricts(prev => prev.map(s => s.id === editingSub.id ? newSub : s));
      showToast('แก้ไขตำบลสำเร็จ');
    } else {
      setSubdistricts(prev => [newSub, ...prev]);
      showToast('เพิ่มตำบลสำเร็จ');
    }
    setIsModalOpen(false);
    setEditingSub(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบตำบลนี้?')) {
      setSubdistricts(prev => prev.filter(s => s.id !== id));
      showToast('ลบตำบลสำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลตำบล</h1>
          <p className="text-slate-500 text-sm">จัดการรายชื่อตำบล/แขวงและรหัสไปรษณีย์</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingSub(null); setIsModalOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มตำบล
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาตำบล..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">ชื่อตำบล/แขวง</th>
              <th className="px-6 py-4">อำเภอ/เขต</th>
              <th className="px-6 py-4">จังหวัด</th>
              <th className="px-6 py-4">รหัสไปรษณีย์</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{s.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{s.district}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{s.province}</td>
                <td className="px-6 py-4 text-sm font-mono text-slate-400">{s.zip}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => { setEditingSub(s); setIsModalOpen(true); }} className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleDelete(s.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">ไม่พบข้อมูล</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingSub(null); }} title={editingSub ? 'แก้ไขตำบล' : 'เพิ่มตำบล'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="text-sm font-bold text-slate-700">ชื่อตำบล/แขวง</label><input name="name" defaultValue={editingSub?.name} required className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
          <div><label className="text-sm font-bold text-slate-700">อำเภอ/เขต</label><input name="district" defaultValue={editingSub?.district} required className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
          <div><label className="text-sm font-bold text-slate-700">จังหวัด</label><input name="province" defaultValue={editingSub?.province} required className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
          <div><label className="text-sm font-bold text-slate-700">รหัสไปรษณีย์</label><input name="zip" defaultValue={editingSub?.zip} required className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" /></div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingSub(null); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium">ยกเลิก</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium">บันทึก</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
