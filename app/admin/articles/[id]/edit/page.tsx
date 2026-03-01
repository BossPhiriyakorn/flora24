'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Save, X, Video, Image as ImageIcon, Search, Eye, FileEdit, Loader2,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { convertImageFileToWebP } from '@/lib/convertToWebp';
import { SeoScoreCard } from '@/components/SeoScoreCard';
import { GooglePreviewCard } from '@/components/GooglePreviewCard';
import { RichTextEditor } from '@/components/RichTextEditor';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [categories, setCategories] = React.useState<{ _id: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = React.useState(true);
  const [loadingData, setLoadingData]   = React.useState(true);
  const [article, setArticle]           = React.useState<Record<string, any> | null>(null);
  const [status, setStatus]             = React.useState<'published' | 'draft'>('draft');
  const [featuredPreview, setFeaturedPreview] = React.useState<string | null>(null);
  const [featuredWebpFile, setFeaturedWebpFile] = React.useState<File | null>(null);
  const [isConverting, setIsConverting] = React.useState(false);
  const [title, setTitle]               = React.useState('');
  const [shortDescription, setShortDescription] = React.useState('');
  const [longDescription, setLongDescription]   = React.useState('');
  const [seoKeyword, setSeoKeyword]     = React.useState('');
  const [saving, setSaving]             = React.useState(false);

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

  React.useEffect(() => {
    if (!id) return;
    setLoadingData(true);
    fetch(`/api/admin/articles/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.article) {
          const a = data.article;
          setArticle(a);
          setStatus(a.status === 'published' ? 'published' : 'draft');
          setTitle(a.title ?? '');
          setShortDescription(a.shortDescription ?? '');
          setLongDescription(a.longDescription ?? '');
          setSeoKeyword(a.seoKeyword ?? '');
          setFeaturedPreview(a.featuredImageUrl ?? null);
        }
      })
      .catch(() => showToast('โหลดบทความล้มเหลว', 'error'))
      .finally(() => setLoadingData(false));
  }, [id]);

  const handleFeaturedChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFeaturedPreview(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setFeaturedWebpFile(null);
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('กรุณาเลือกไฟล์ภาพเท่านั้น', 'error'); return; }
    setIsConverting(true);
    try {
      const webpFile = await convertImageFileToWebP(file);
      setFeaturedWebpFile(webpFile);
      setFeaturedPreview(URL.createObjectURL(webpFile));
      showToast('แปลงรูปเป็น WebP แล้ว');
    } catch {
      setFeaturedPreview(URL.createObjectURL(file));
      setFeaturedWebpFile(file);
      showToast('ใช้ไฟล์ต้นฉบับ (แปลง WebP ไม่สำเร็จ)', 'error');
    } finally {
      setIsConverting(false);
    }
  };

  const seoInput = React.useMemo(() => ({
    title, shortDescription, longDescription, seoTitle: title,
    seoDescription: shortDescription, seoKeyword, hasFeaturedImage: !!featuredPreview,
  }), [title, shortDescription, longDescription, seoKeyword, featuredPreview]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const youtubeUrl = (formData.get('youtubeVideo') as string)?.trim();
    if (youtubeUrl && !/^[a-zA-Z0-9_-]{11}$/.test(youtubeUrl)) {
      showToast('กรุณาใส่เฉพาะ Video ID จาก YouTube (ตัวอักษรสีแดงใน URL)', 'error');
      return;
    }
    setSaving(true);
    try {
      let featuredImageUrl: string | undefined;
      if (featuredWebpFile) {
        const fd = new FormData();
        fd.append('file', featuredWebpFile);
        const upRes = await fetch(`/api/admin/upload/article/${id}`, { method: 'POST', body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) { showToast(upData.error ?? 'อัปโหลดรูปไม่สำเร็จ', 'error'); return; }
        featuredImageUrl = upData.url;
      }
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
        ...(featuredImageUrl !== undefined && { featuredImageUrl }),
      };
      const res = await fetch(`/api/admin/articles/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'บันทึกล้มเหลว', 'error'); return; }
      showToast('บันทึกการแก้ไขบทความสำเร็จ', 'success');
      router.push('/admin/articles');
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-slate-500">ไม่พบบทความ</p>
        <Link href="/admin/articles" className="text-emerald-600 hover:underline">กลับหน้ารายการ</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/articles" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600" title="กลับ">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แก้ไขบทความ (ARTICLE EDIT)</h1>
          <p className="text-slate-500 text-sm">แก้ไขข้อมูลบทความ — ข้อมูลเดิมแสดงด้านล่าง</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">หมวดหมู่</label>
            <select name="category" required defaultValue={article.category} disabled={categoriesLoading}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60">
              <option value="">{categoriesLoading ? 'กำลังโหลด...' : 'กรุณาเลือกหมวดหมู่'}</option>
              {[
                ...categories,
                ...(article?.category && !categories.some(c => c.name === article.category)
                  ? [{ _id: 'current', name: article.category }]
                  : []),
              ].map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">SEO Title และ Meta Description ใช้จากชื่อบทความและรายละเอียดแบบสั้น</p>
            <label className="block text-xs font-bold text-slate-600 mb-1">Tag Keyword (คำหลัก)</label>
            <input name="seoKeyword" type="text" value={seoKeyword} onChange={e => setSeoKeyword(e.target.value)}
              placeholder="Tag Keyword"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อบทความ (SEO Title / Page Title)</label>
            <input name="title" type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="ชื่อบทความ"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">รายละเอียดแบบสั้น (Meta Description)</label>
            <textarea name="shortDescription" rows={3} value={shortDescription} onChange={e => setShortDescription(e.target.value)}
              placeholder="รายละเอียดแบบสั้น....."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">รายละเอียดแบบยาว</label>
            <RichTextEditor value={longDescription} onChange={setLongDescription}
              placeholder="เขียนเนื้อหาบทความที่นี่..." minHeight="320px" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Video className="w-4 h-4" /> วีดีโอจาก Youtube
            </label>
            <input name="youtubeVideo" type="text" defaultValue={article.youtubeVideo ?? ''}
              placeholder="Ex: kzcpwRZTzCx (Video ID เท่านั้น)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> รูปภาพโปรไฟล์ (Featured Image)
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleFeaturedChange} />
                เลือกไฟล์ใหม่
              </label>
              <span className="text-sm text-slate-400">ยังไม่ได้เลือกไฟล์ใหม่</span>
            </div>
            {isConverting && <p className="text-sm text-amber-600 mt-1">กำลังแปลงเป็น WebP...</p>}
            {featuredPreview && (
              <div className="mt-3">
                <div className="rounded-xl overflow-hidden border border-slate-200 w-full max-w-[400px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={featuredPreview} alt="Preview" className="w-full h-auto object-cover" />
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search className="w-4 h-4" /> ข้อมูลเกี่ยวกับ SEO
            </h3>
            <GooglePreviewCard
              title={title}
              snippet={shortDescription}
              date={article?.date}
              thumbnailUrl={featuredPreview}
              className="mb-6"
            />
            <SeoScoreCard input={seoInput} className="mb-6" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">สถานะ</label>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="draft" checked={status === 'draft'} onChange={() => setStatus('draft')} className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500" />
                <FileEdit className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">แบบร่าง</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="published" checked={status === 'published'} onChange={() => setStatus('published')} className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500" />
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">เผยแพร่</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-medium transition-colors">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button type="button" onClick={() => { if (confirm('ยกเลิกการแก้ไข?')) router.push('/admin/articles'); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors">
            <X className="w-5 h-5" /> ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
