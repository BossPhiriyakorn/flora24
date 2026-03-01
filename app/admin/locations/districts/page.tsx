'use client';

import * as React from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface District {
  id: number;
  name: string;
  province: string;
  subdistricts: number;
}

const initialDistricts: District[] = [
  { id: 1, name: 'คลองเตย', province: 'กรุงเทพมหานคร', subdistricts: 3 },
  { id: 2, name: 'วัฒนา', province: 'กรุงเทพมหานคร', subdistricts: 3 },
  { id: 3, name: 'เมืองเชียงใหม่', province: 'เชียงใหม่', subdistricts: 16 },
];

export default function DistrictsPage() {
  const [districts, setDistricts] = React.useState<District[]>(initialDistricts);
  const [search, setSearch] = React.useState('');
  const [provinceFilter, setProvinceFilter] = React.useState('ทุกจังหวัด');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingDistrict, setEditingDistrict] = React.useState<District | null>(null);
  const { showToast } = useToast();

  const provinces = Array.from(new Set(districts.map((d) => d.province)));
  const filtered = districts.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchProvince = provinceFilter === 'ทุกจังหวัด' || d.province === provinceFilter;
    return matchSearch && matchProvince;
  });

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    const province = (formData.get('province') as string)?.trim();
    if (!name || !province) return;
    const newDistrict: District = {
      id: editingDistrict ? editingDistrict.id : Math.max(0, ...districts.map((d) => d.id)) + 1,
      name,
      province,
      subdistricts: editingDistrict ? editingDistrict.subdistricts : 0,
    };
    if (editingDistrict) {
      setDistricts((prev) => prev.map((d) => (d.id === editingDistrict.id ? newDistrict : d)));
      showToast('แก้ไขอำเภอสำเร็จ');
    } else {
      setDistricts((prev) => [newDistrict, ...prev]);
      showToast('เพิ่มอำเภอสำเร็จ');
    }
    setIsModalOpen(false);
    setEditingDistrict(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบอำเภอนี้?')) {
      setDistricts((prev) => prev.filter((d) => d.id !== id));
      showToast('ลบอำเภอสำเร็จ');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลอำเภอ</h1>
          <p className="text-slate-500 text-sm">จัดการรายชื่ออำเภอ/เขตในแต่ละจังหวัด</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingDistrict(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          เพิ่มอำเภอ
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาอำเภอ..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option>ทุกจังหวัด</option>
            {provinces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">ชื่ออำเภอ/เขต</th>
              <th className="px-6 py-4">จังหวัด</th>
              <th className="px-6 py-4">จำนวนตำบล</th>
              <th className="px-6 py-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{d.name}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{d.province}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{d.subdistricts} ตำบล</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDistrict(d);
                        setIsModalOpen(true);
                      }}
                      className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
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
          setEditingDistrict(null);
        }}
        title={editingDistrict ? 'แก้ไขอำเภอ' : 'เพิ่มอำเภอ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700">ชื่ออำเภอ/เขต</label>
            <input
              name="name"
              defaultValue={editingDistrict?.name}
              required
              className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="คลองเตย"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700">จังหวัด</label>
            <input
              name="province"
              defaultValue={editingDistrict?.province}
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
                setEditingDistrict(null);
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
