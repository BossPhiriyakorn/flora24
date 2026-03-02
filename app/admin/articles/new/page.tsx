'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  X,
  Video,
  Image as ImageIcon,
  Search,
  Eye,
  FileEdit,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { SeoScoreCard } from '@/components/SeoScoreCard';
import { GooglePreviewCard } from '@/components/GooglePreviewCard';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function NewArticlePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [categories, setCategories] = React.useState<{ _id: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);
  const [status, setStatus] = React.useState<'published' | 'draft'>('draft');
  const [featuredPreview, setFeaturedPreview] = React.useState<string | null>(null);
  const [featuredFile, setFeaturedFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState('');
  const [shortDescription, setShortDescription] = React.useState('');
  const [longDescription, setLongDescription] = React.useState('');
  const [seoKeyword, setSeoKeyword] = React.useState('');

  const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFeaturedPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFeaturedFile(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์ภาพเท่านั้น', 'error');
      return;
    }
    setFeaturedFile(file);
    setFeaturedPreview(URL.createObjectURL(file));
  };

  const seoInput = React.useMemo(
    () => ({
      title,
      shortDescription,
      longDescription,
      seoTitle: title,
      seoDescription: shortDescription,
      seoKeyword,
      hasFeaturedImage: !!featuredPreview,
    }),
    [title, shortDescription, longDescription, seoKeyword, featuredPreview]
  );

  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/admin/article-categories')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.categories) {
          setCategories(data.categories.map((c: { _id: string; name: string }) => ({ _id: String(c._id), name: c.name })));
        }
      })
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const youtubeUrl = (formData.get('youtubeVideo') as string)?.trim();
    if (youtubeUrl && !/^[a-zA-Z0-9_-]{11}$/.test(youtubeUrl)) {
      showToast('กรุณาใส่เฉพาะ Video ID จาก YouTube (ตัวอักษรสีแดงใน URL)', 'error');
      return;
    }
    setSaving(true);
    let articleId: string | undefined;
    try {
      const payload = {
        title,
        category:         formData.get('category') as string,
        status,
        shortDescription,
        longDescription,
        youtubeVideo:     formData.get('youtubeVideo') as string || '',
        seoTitle:         title,
        seoDescription:   shortDescription,
        seoKeyword,
        featuredImageUrl: '',
        date:             new Date().toISOString().slice(0, 10),
      };
      const res = await fetch('/api/admin/articles', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'บันทึกล้มเหลว', 'error'); return; }
      articleId = data.id?.toString?.() ?? data.id;

      if (featuredFile && articleId) {
        let imageOk = false;
        try {
          const fd = new FormData();
          fd.append('file', featuredFile);
          const upRes = await fetch(`/api/admin/upload/article/${articleId}`, { method: 'POST', body: fd });
          const upData = await upRes.json().catch(() => ({ error: 'อัปโหลดรูปไม่สำเร็จ' }));
          if (!upRes.ok) {
            showToast(upData.error ?? 'อัปโหลดรูปไม่สำเร็จ บทความจะไม่ถูกบันทึก', 'error');
          } else {
            const url = upData.url;
            if (url) {
              const putRes = await fetch(`/api/admin/articles/${articleId}`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ ...payload, featuredImageUrl: url }),
              });
              if (putRes.ok) imageOk = true;
              else showToast('อัปเดตรูปล้มเหลว บทความจะไม่ถูกบันทึก', 'error');
            } else {
              showToast('อัปโหลดรูปไม่สำเร็จ บทความจะไม่ถูกบันทึก', 'error');
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'การอัปโหลดรูปล้มเหลว';
          showToast(msg + ' บทความจะไม่ถูกบันทึก', 'error');
        }
        if (!imageOk) {
          await fetch(`/api/admin/articles/${articleId}`, { method: 'DELETE' });
          return;
        }
      }

      showToast('บันทึกบทความสำเร็จ', 'success');
      router.push('/admin/articles');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด';
      showToast(msg, 'error');
      if (articleId && featuredFile) {
        try { await fetch(`/api/admin/articles/${articleId}`, { method: 'DELETE' }); } catch { /* ignore */ }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('ยกเลิกการเขียนบทความ?')) router.push('/admin/articles');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/articles"
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
          title="กลับ"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">เพิ่มบทความ (ARTICLE ADD)</h1>
          <p className="text-slate-500 text-sm">เขียนบทความใหม่ เหมาะสมสำหรับ SEO</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* หมวดหมู่ + ชื่อบทความ + รายละเอียดแบบสั้น + แบบยาว */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">หมวดหมู่</label>
            <select
              name="category"
              required
              disabled={categoriesLoading}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
            >
              <option value="">{categoriesLoading ? 'กำลังโหลด...' : 'กรุณาเลือกหมวดหมู่'}</option>
              {categories.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2">SEO Title และ Meta Description ใช้จากชื่อบทความและรายละเอียดแบบสั้นด้านล่าง (This is the Title & Meta Description for SEO)</p>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tag Keyword (คำหลัก)</label>
            <input
              name="seoKeyword"
              type="text"
              value={seoKeyword}
              onChange={(e) => setSeoKeyword(e.target.value)}
              placeholder="Tag Keyword"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อบทความ (SEO Title / Page Title)</label>
            <input
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ชื่อบทความ"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1">ใช้เป็นชื่อบทความและ SEO Title (Tag Title)</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">รายละเอียดแบบสั้น (Meta Description)</label>
            <textarea
              name="shortDescription"
              rows={3}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="รายละเอียดแบบสั้น....."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-y"
            />
            <p className="text-xs text-slate-400 mt-1">ใช้เป็นสรุปและ Meta Description สำหรับ SEO</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">รายละเอียดแบบยาว</label>
            <RichTextEditor
              value={longDescription}
              onChange={setLongDescription}
              placeholder="เขียนเนื้อหาบทความที่นี่..."
              minHeight="320px"
            />
          </div>
        </div>

        {/* วิดีโอ YouTube + รูปภาพโปรไฟล์ + SEO + สถานะ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Video className="w-4 h-4" />
              วีดีโอจาก Youtube
            </label>
            <input
              name="youtubeVideo"
              type="text"
              placeholder="Ex: https://www.youtube.com/watch?v=kzcpwRZTzCx"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">(ใส่เฉพาะตัวหนังสือสีแดงเท่านั้น เช่น kzcpwRZTzCx จาก URL)</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              รูปภาพโปรไฟล์ (Featured Image)
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer transition-colors">
                <input type="file" name="featuredImage" accept="image/*" className="hidden" onChange={handleFeaturedChange} />
                เลือกไฟล์
              </label>
              <span className="text-sm text-slate-400">ยังไม่ได้เลือกไฟล์</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">กรุณาเลือกรูปภาพ (740px X 440px) — จะถูกแปลงเป็น WebP ตอนกดบันทึก</p>
            {featuredPreview && (
              <div className="mt-3 space-y-1">
                <span className="text-xs font-medium text-slate-600">รูปที่เลือก</span>
                <div className="rounded-xl overflow-hidden border border-slate-200 w-full max-w-[222px]">
                  <img src={featuredPreview} alt="Preview" className="w-full h-auto object-cover" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" />
              ข้อมูลเกี่ยวกับ SEO
            </h3>
            <GooglePreviewCard
              title={title}
              snippet={shortDescription}
              date={new Date().toISOString().slice(0, 10)}
              thumbnailUrl={featuredPreview}
              className="mb-6"
            />
            <SeoScoreCard input={seoInput} className="mb-6" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">สถานะ</label>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="status" value="draft"
                  checked={status === 'draft'} onChange={() => setStatus('draft')}
                  className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                />
                <FileEdit className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">แบบร่าง</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="status" value="published"
                  checked={status === 'published'} onChange={() => setStatus('published')}
                  className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">เผยแพร่</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-medium transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            <X className="w-5 h-5" />
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
