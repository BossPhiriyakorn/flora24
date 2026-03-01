'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { FolderPlus, Edit, Trash2, List, Save, Loader2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Category {
  _id: string;
  name: string;
  status: string;
  articleCount?: number;
}

export default function ArticleCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/article-categories');
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories.map((c: { _id: { toString: () => string }; name: string; status: string; articleCount?: number }) => ({
          _id: c._id.toString(),
          name: c.name,
          status: c.status === 'inactive' ? 'Inactive' : 'Active',
          articleCount: c.articleCount ?? 0,
        })));
      } else {
        showToast(data.error ?? 'โหลดข้อมูลล้มเหลว', 'error');
      }
    } catch {
      showToast('โหลดข้อมูลล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  React.useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    const status = formData.get('status') as string;
    if (!name) {
      showToast('กรุณากรอกชื่อหมวดหมู่', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingCategory) {
        const res = await fetch(`/api/admin/article-categories/${editingCategory._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, status: status === 'Inactive' ? 'inactive' : 'active' }),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error ?? 'แก้ไขล้มเหลว', 'error'); return; }
        showToast('แก้ไขหมวดหมู่สำเร็จ', 'success');
      } else {
        const res = await fetch('/api/admin/article-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, status: status === 'Inactive' ? 'inactive' : 'active' }),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error ?? 'เพิ่มล้มเหลว', 'error'); return; }
        showToast('เพิ่มหมวดหมู่ใหม่สำเร็จ', 'success');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if ((cat.articleCount ?? 0) > 0) {
      showToast(`หมวดหมู่นี้มีบทความ ${cat.articleCount} รายการ ไม่สามารถลบได้`, 'error');
      return;
    }
    if (!confirm(`ลบหมวดหมู่ "${cat.name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/article-categories/${cat._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'ลบล้มเหลว', 'error'); return; }
      showToast('ลบหมวดหมู่สำเร็จ', 'success');
      fetchCategories();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">หมวดหมู่บทความ</h1>
          <p className="text-slate-500 text-sm">จัดการหมวดหมู่สำหรับจัดกลุ่มบทความบนเว็บไซต์</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          <FolderPlus className="w-5 h-5" />
          เพิ่มหมวดหมู่ใหม่
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">ชื่อหมวดหมู่</th>
                <th className="px-6 py-4">จำนวนบทความ</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <motion.tr key={cat._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{cat.articleCount ?? 0} บทความ</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      cat.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && categories.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">ยังไม่มีหมวดหมู่ — กดปุ่ม &quot;เพิ่มหมวดหมู่ใหม่&quot; เพื่อสร้าง</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategory(null); }} title={editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อหมวดหมู่</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={editingCategory?.name}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="เช่น ข่าวสาร, บทความพิเศษ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label>
            <select
              name="status"
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              defaultValue={editingCategory?.status ?? 'Active'}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setIsModalOpen(false); setEditingCategory(null); }} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
              ยกเลิก
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingCategory ? 'บันทึก' : 'เพิ่ม'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
