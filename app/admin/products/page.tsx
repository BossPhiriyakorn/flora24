'use client';

import * as React from 'react';
import { Search, Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { getDriveImageDisplayUrl } from '@/lib/driveImageUrl';

// ─── Types ────────────────────────────────────────────────────
interface Category { _id: string; name: string }

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  categoryName: string;
  imageUrl: string;
  status: 'active' | 'hidden';
  order?: number;
  createdAt: string;
}

type ModalMode = 'add' | 'edit';

/** Placeholder when product has no image or image URL fails to load */
const ROW_IMAGE_PLACEHOLDER = 'https://picsum.photos/id/40/112/112';

// ─── Product Modal ─────────────────────────────────────────────
function ProductModal({
  mode,
  initial,
  categories,
  onClose,
  onSaved,
}: {
  mode: ModalMode;
  initial?: Product;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName]           = React.useState(initial?.name ?? '');
  const [description, setDesc]    = React.useState(initial?.description ?? '');
  const [price, setPrice]         = React.useState(String(initial?.price ?? ''));
  const [categoryId, setCatId]    = React.useState(initial?.categoryId ?? (categories[0]?._id ?? ''));
  const [status, setStatus]       = React.useState<'active' | 'hidden'>(initial?.status ?? 'active');
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [errors, setErrors]       = React.useState<Record<string, string>>({});
  const [saving, setSaving]       = React.useState(false);
  const submittingRef             = React.useRef(false);

  // ล้าง preview เมื่อปิดหรือเปลี่ยน initial
  React.useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'กรุณากรอกชื่อสินค้า';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) e.price = 'กรุณากรอกราคาที่ถูกต้อง';
    if (!categoryId) e.categoryId = 'กรุณาเลือกหมวดหมู่';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (submittingRef.current) return; // ป้องกันกดซ้ำก่อน re-render
    if (!validate()) return;
    submittingRef.current = true;
    setSaving(true);
    let createdProductId: string | null = null; // ใช้ลบสินค้าที่สร้างแล้วถ้าอัปโหลดรูปล้ม
    try {
      const productId = mode === 'edit' ? initial!._id : null;
      let finalImageUrl = mode === 'edit' ? (initial?.imageUrl ?? '') : '';

      if (mode === 'add') {
        const createBody = { name, description, price: Number(price), categoryId, imageUrl: '', status };
        const res = await fetch('/api/admin/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createBody),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error ?? 'บันทึกล้มเหลว', 'error'); return; }
        const newId = data.id ?? data._id;
        createdProductId = newId ?? null;
        if (imageFile && newId) {
          try {
            const fd = new FormData();
            fd.append('file', imageFile);
            const upRes = await fetch(`/api/admin/upload/product/${newId}`, { method: 'POST', body: fd });
            const upData = await upRes.json().catch(() => ({ error: 'อัปโหลดรูปไม่สำเร็จ' }));
            if (!upRes.ok) {
              showToast(upData.error ?? 'อัปโหลดรูปไม่สำเร็จ', 'error');
              await fetch(`/api/admin/products/${newId}`, { method: 'DELETE' });
              createdProductId = null;
              return;
            }
            finalImageUrl = upData.url ?? '';
            const putRes = await fetch(`/api/admin/products/${newId}`, {
              method: 'PUT', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...createBody, imageUrl: finalImageUrl }),
            });
            if (!putRes.ok) { showToast('อัปเดตรูปไม่สำเร็จ', 'error'); return; }
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'การอัปโหลดรูปล้มเหลว';
            showToast(msg, 'error');
            await fetch(`/api/admin/products/${newId}`, { method: 'DELETE' });
            createdProductId = null;
            return;
          }
        }
      } else {
        if (imageFile && productId) {
          const fd = new FormData();
          fd.append('file', imageFile);
          const upRes = await fetch(`/api/admin/upload/product/${productId}`, { method: 'POST', body: fd });
          const upData = await upRes.json().catch(() => ({ error: 'อัปโหลดรูปไม่สำเร็จ' }));
          if (!upRes.ok) { showToast(upData.error ?? 'อัปโหลดรูปไม่สำเร็จ', 'error'); return; }
          finalImageUrl = upData.url ?? '';
        }
        const body = { name, description, price: Number(price), categoryId, imageUrl: finalImageUrl, status };
        const res = await fetch(`/api/admin/products/${productId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error ?? 'บันทึกล้มเหลว', 'error'); return; }
      }
      showToast(mode === 'add' ? 'เพิ่มสินค้าสำเร็จ' : 'อัปเดตสินค้าสำเร็จ', 'success');
      onSaved();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด';
      showToast(msg, 'error');
      if (createdProductId) {
        try { await fetch(`/api/admin/products/${createdProductId}`, { method: 'DELETE' }); } catch { /* ignore */ }
      }
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'add' ? '+ เพิ่มสินค้าใหม่' : '✏️ แก้ไขสินค้า'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* รูปสินค้า — อัปโหลดเท่านั้น (อัปขึ้น Drive เมื่อกดบันทึก) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">รูปสินค้า</label>
            <p className="text-xs text-slate-500 mb-2">เลือกรูปจากเครื่อง (JPEG, PNG, GIF) — จะอัปโหลดเมื่อกดบันทึก</p>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700"
              onChange={e => {
                const f = e.target.files?.[0];
                setImageFile(f ?? null);
                setImagePreview(prev => {
                  if (prev) URL.revokeObjectURL(prev);
                  return f ? URL.createObjectURL(f) : null;
                });
              }}
            />
            {(imagePreview || (mode === 'edit' && initial?.imageUrl)) && (
              <img
                src={imagePreview || initial?.imageUrl}
                alt="preview"
                className="mt-2 w-20 h-20 object-cover rounded-lg border border-slate-200"
                referrerPolicy={imagePreview ? undefined : 'no-referrer'}
              />
            )}
          </div>

          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อสินค้า <span className="text-red-500">*</span></label>
            <input
              value={name} onChange={e => setName(e.target.value)} placeholder="กรอกชื่อสินค้า"
              className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.name ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">รายละเอียด</label>
            <textarea
              value={description} onChange={e => setDesc(e.target.value)} placeholder="กรอกรายละเอียดสินค้า" rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>

          {/* PRICE + CATEGORY */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">ราคา (฿) <span className="text-red-500">*</span></label>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" min={0}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${errors.price ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">หมวดหมู่ <span className="text-red-500">*</span></label>
              <select
                value={categoryId} onChange={e => setCatId(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white ${errors.categoryId ? 'border-red-400' : 'border-slate-200'}`}
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
            </div>
          </div>

          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">สถานะ</label>
            <div className="flex gap-3">
              {(['active', 'hidden'] as const).map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={s} checked={status === s} onChange={() => setStatus(s)} className="text-blue-600" />
                  <span className={`text-sm font-medium ${s === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {s === 'active' ? 'แสดง' : 'ไม่แสดง'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            ยกเลิก
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:pointer-events-none text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {saving ? (mode === 'add' ? 'กำลังเพิ่ม...' : 'กำลังบันทึก...') : (mode === 'add' ? 'เพิ่มสินค้า' : 'บันทึก')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
export default function ProductsPage() {
  const { showToast } = useToast();

  const [products, setProducts]     = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [total, setTotal]           = React.useState(0);
  const [loading, setLoading]       = React.useState(true);
  const [search, setSearch]         = React.useState('');
  const [catFilter, setCatFilter]   = React.useState('');
  const [pageSize, setPageSize]     = React.useState(10);
  const [modalMode, setModalMode]   = React.useState<ModalMode | null>(null);
  const [editTarget, setEditTarget] = React.useState<Product | undefined>();
  const [movingIds, setMovingIds]   = React.useState<Set<string>>(new Set());

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search.trim()) params.set('search', search.trim());
      if (catFilter) params.set('category', catFilter);

      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?${params}`),
        fetch('/api/admin/categories'),
      ]);
      const [prodData, catData] = await Promise.all([prodRes.json(), catRes.json()]);

      if (prodRes.ok) { setProducts(prodData.products ?? []); setTotal(prodData.total ?? 0); }
      if (catRes.ok)  { setCategories(catData.categories ?? []); }
    } catch {
      showToast('โหลดข้อมูลล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchData(); }, [search, catFilter]);

  async function handleDelete(product: Product) {
    if (!confirm(`ลบสินค้า "${product.name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${product._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'ลบล้มเหลว', 'error'); return; }
      showToast(`ลบ "${product.name}" สำเร็จ`, 'success');
      fetchData();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  }

  // อ้างอิงลำดับจากตำแหน่งในตารางเท่านั้น (ไม่ใช้ชื่อ/หมวดหมู่/ราคา) — สลับค่าตำแหน่งกับแถวติดกัน
  async function handleMove(product: Product, direction: 'up' | 'down') {
    const idx = products.findIndex(p => p._id === product._id);
    if (idx < 0) return;
    const otherIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (otherIdx < 0 || otherIdx >= products.length) return;
    const other = products[otherIdx];
    if (movingIds.has(product._id) || movingIds.has(other._id)) return;

    const orderA = idx;
    const orderB = otherIdx;

    setMovingIds(prev => new Set([...prev, product._id, other._id]));
    try {
      const res = await fetch('/api/admin/products/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [
            { id: product._id, order: orderB },
            { id: other._id, order: orderA },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'ปรับลำดับไม่สำเร็จ', 'error'); return; }
      showToast('ปรับลำดับแล้ว', 'success');
      await fetchData();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setMovingIds(prev => {
        const next = new Set(prev);
        next.delete(product._id);
        next.delete(other._id);
        return next;
      });
    }
  }

  function formatDate(val: string) {
    if (!val) return '-';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('th-TH');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการสินค้า</h1>
          <p className="text-sm text-slate-500 mt-0.5">เพิ่ม แก้ไข และจัดการสินค้าทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="รีเฟรช">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditTarget(undefined); setModalMode('add'); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" /> เพิ่มสินค้า
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white min-w-[180px]">
            <option value="">หมวดหมู่ทั้งหมด</option>
            {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>แสดง</span>
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
          className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none">
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>รายการ — พบ {total} สินค้า</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="px-4 py-3 whitespace-nowrap">ลำดับ / จัดเรียง</th>
                  <th className="px-4 py-3 whitespace-nowrap">รูปสินค้า</th>
                  <th className="px-4 py-3 whitespace-nowrap">ชื่อสินค้า</th>
                  <th className="px-4 py-3 whitespace-nowrap">หมวดหมู่</th>
                  <th className="px-4 py-3 whitespace-nowrap">ราคา</th>
                  <th className="px-4 py-3 whitespace-nowrap">สถานะ</th>
                  <th className="px-4 py-3 whitespace-nowrap">วันที่เพิ่ม</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.slice(0, pageSize).map((product, i) => {
                  const fullIndex = products.findIndex(p => p._id === product._id);
                  const canMoveUp = fullIndex > 0;
                  const canMoveDown = fullIndex >= 0 && fullIndex < products.length - 1;
                  const isMoving = movingIds.has(product._id);
                  return (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="w-6 text-center font-medium">{fullIndex + 1}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleMove(product, 'up')}
                            disabled={!canMoveUp || isMoving}
                            className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                            title="เลื่อนขึ้น"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(product, 'down')}
                            disabled={!canMoveDown || isMoving}
                            className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                            title="เลื่อนลง"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        {product.imageUrl ? (
                          <img
                            src={getDriveImageDisplayUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.src = ROW_IMAGE_PLACEHOLDER;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                      <p className="truncate">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5 max-w-[200px]">{product.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      ฿{product.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {product.status === 'active' ? 'แสดง' : 'ไม่แสดง'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{formatDate(product.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditTarget(product); setModalMode('edit'); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-500 text-sm">ไม่พบสินค้า</div>
          )}
        </div>
      )}

      {modalMode && (
        <ProductModal
          mode={modalMode}
          initial={editTarget}
          categories={categories}
          onClose={() => setModalMode(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
