'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, X, Check, Tag, ShoppingBag, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Category {
  _id: string;
  name: string;
  productCount?: number;
}

export default function ProductCategoriesPage() {
  const { showToast } = useToast();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [loading, setLoading]   = React.useState(true);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newName, setNewName]   = React.useState('');
  const [editId, setEditId]     = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [saving, setSaving]     = React.useState(false);
  const addInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (showAddForm) addInputRef.current?.focus();
  }, [showAddForm]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/products?limit=1'),
      ]);
      const [catData, prodData] = await Promise.all([catRes.json(), prodRes.json()]);
      if (catRes.ok)  setCategories(catData.categories ?? []);
      if (prodRes.ok) setTotalProducts(prodData.total ?? 0);
    } catch {
      showToast('โหลดข้อมูลล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchCategories(); }, []);

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'เพิ่มล้มเหลว', 'error'); return; }
      showToast(`เพิ่มหมวดหมู่ "${name}" สำเร็จ`, 'success');
      setNewName('');
      setShowAddForm(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit(id: string, name: string) {
    setEditId(id);
    setEditName(name);
  }

  async function handleSaveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'แก้ไขล้มเหลว', 'error'); return; }
      showToast('แก้ไขหมวดหมู่สำเร็จ', 'success');
      setEditId(null);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const cat = categories.find(c => c._id === id);
    const count = cat?.productCount ?? 0;
    const msg = count > 0
      ? `หมวดหมู่ "${name}" มีสินค้าอยู่ ${count} รายการ ไม่สามารถลบได้`
      : `ลบหมวดหมู่ "${name}" ใช่หรือไม่?`;
    if (count > 0) { showToast(msg, 'error'); return; }
    if (!confirm(msg)) return;

    try {
      const res  = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'ลบล้มเหลว', 'error'); return; }
      showToast(`ลบ "${name}" สำเร็จ`, 'success');
      fetchCategories();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">หมวดหมู่สินค้า</h1>
          <p className="text-sm text-slate-500 mt-0.5">จัดการหมวดหมู่สำหรับแบ่งประเภทสินค้า</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCategories} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="รีเฟรช">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" />
            เพิ่มหมวดหมู่
          </button>
        </div>
      </div>

      {/* ADD FORM */}
      {showAddForm && (
        <div className="bg-white border-2 border-emerald-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            เพิ่มหมวดหมู่ใหม่
          </p>
          <div className="flex gap-3">
            <input
              ref={addInputRef}
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setShowAddForm(false); setNewName(''); } }}
              placeholder="กรอกชื่อหมวดหมู่..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || saving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              บันทึก
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); }}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Tag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{categories.length}</p>
              <p className="text-xs text-slate-500">หมวดหมู่ทั้งหมด</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
              <p className="text-xs text-slate-500">สินค้าทั้งหมด</p>
            </div>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-700 text-sm">รายการหมวดหมู่ทั้งหมด</h2>
          <span className="text-xs text-slate-400">{categories.length} หมวดหมู่</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Tag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">ยังไม่มีหมวดหมู่</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่แรก
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map((cat, i) => {
              const isEditing = editId === cat._id;
              return (
                <div key={cat._id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  {/* No. */}
                  <span className="text-sm text-slate-400 w-6 shrink-0">{i + 1}</span>

                  {/* Icon */}
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-blue-600" />
                  </div>

                  {/* NAME / EDIT FIELD */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(cat._id); if (e.key === 'Escape') setEditId(null); }}
                        className="w-full max-w-xs px-3 py-1.5 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{cat.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{cat.productCount ?? 0} สินค้า</p>
                      </div>
                    )}
                  </div>

                  {/* PRODUCT COUNT BADGE */}
                  {!isEditing && (
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium shrink-0">
                      {cat.productCount ?? 0} รายการ
                    </span>
                  )}

                  {/* ACTIONS */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(cat._id)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(cat._id, cat.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id, cat.name)}
                          disabled={(cat.productCount ?? 0) > 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-medium transition-colors"
                          title={(cat.productCount ?? 0) > 0 ? 'มีสินค้าอยู่ในหมวดหมู่นี้' : 'ลบหมวดหมู่'}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> ลบ
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
