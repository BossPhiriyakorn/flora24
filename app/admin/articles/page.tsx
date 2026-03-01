'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Article {
  _id: string;
  title: string;
  category: string;
  authorName: string;
  date: string;
  status: 'published' | 'draft';
  featuredImageUrl?: string;
  shortDescription?: string;
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'หมวดหมู่ทั้งหมด' },
  { value: 'ความรู้เรื่องบ้าน', label: 'ความรู้เรื่องบ้าน' },
  { value: 'การตกแต่ง', label: 'การตกแต่ง' },
  { value: 'วิเคราะห์ทำเล', label: 'วิเคราะห์ทำเล' },
  { value: 'ข่าวสารอสังหาฯ', label: 'ข่าวสารอสังหาฯ' },
];

function StatusBadge({ status }: { status: Article['status'] }) {
  return status === 'published'
    ? <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">เผยแพร่</span>
    : <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">แบบร่าง</span>;
}

export default function ArticlesPage() {
  const [articles, setArticles]       = React.useState<Article[]>([]);
  const [total, setTotal]             = React.useState(0);
  const [loading, setLoading]         = React.useState(true);
  const [searchKeyword, setSearch]    = React.useState('');
  const [categoryFilter, setCatFilter] = React.useState('');
  const [pageSize, setPageSize]        = React.useState(10);
  const [selectedIds, setSelectedIds]  = React.useState<Set<string>>(new Set());
  const { showToast } = useToast();

  async function fetchArticles() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (searchKeyword.trim()) params.set('search', searchKeyword.trim());
      if (categoryFilter) params.set('category', categoryFilter);
      const res  = await fetch(`/api/admin/articles?${params}`);
      const data = await res.json();
      if (res.ok) { setArticles(data.articles ?? []); setTotal(data.total ?? 0); }
      else showToast(data.error ?? 'โหลดล้มเหลว', 'error');
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchArticles(); }, [searchKeyword, categoryFilter]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`ต้องการลบบทความ "${title}" หรือไม่?`)) return;
    try {
      const res  = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'ลบล้มเหลว', 'error'); return; }
      showToast('ลบบทความสำเร็จ');
      fetchArticles();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === articles.slice(0, pageSize).length)
      setSelectedIds(new Set());
    else
      setSelectedIds(new Set(articles.slice(0, pageSize).map(a => a._id)));
  }

  function formatDate(val: string) {
    if (!val) return '-';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('th-TH');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">บทความ ARTICLE</h1>
        <div className="flex items-center gap-2">
          <button onClick={fetchArticles} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="รีเฟรช">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shrink-0"
          >
            <Plus className="w-5 h-5" /> ARTICLE ADD
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="text-sm font-medium text-slate-600 shrink-0">SEARCH</label>
          <input
            type="text" value={searchKeyword} onChange={e => setSearch(e.target.value)}
            placeholder="พิมพ์คำค้นหาที่ต้องการ"
            className="flex-1 min-w-0 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <select value={categoryFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white min-w-[180px]">
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Show entries */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>แสดง</span>
        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
          className="px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none">
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>รายการ — พบ {total} บทความ</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <th className="px-4 py-3 w-12">
                    <input type="checkbox"
                      checked={articles.slice(0, pageSize).length > 0 && selectedIds.size === articles.slice(0, pageSize).length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">ลำดับ <ChevronUp className="w-4 h-4 opacity-50" /><ChevronDown className="w-4 h-4 opacity-50" /></span>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">รูปโปรไฟล์</th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">ชื่อบทความ <ChevronUp className="w-4 h-4 opacity-50" /><ChevronDown className="w-4 h-4 opacity-50" /></span>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">ผู้ลง</th>
                  <th className="px-4 py-3 whitespace-nowrap">วันที่</th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">Status <ChevronUp className="w-4 h-4 opacity-50" /><ChevronDown className="w-4 h-4 opacity-50" /></span>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.slice(0, pageSize).map((article, index) => (
                  <tr key={article._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(article._id)}
                        onChange={() => toggleSelect(article._id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={article.featuredImageUrl || `https://picsum.photos/id/${index + 40}/112/112`}
                          alt="" width={56} height={56} className="w-full h-full object-cover"
                          referrerPolicy="no-referrer" loading="lazy" decoding="async"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-md">
                      <p className="line-clamp-2">{article.title}</p>
                      {article.category && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">{article.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{article.authorName}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(article.date || article.createdAt)}</td>
                    <td className="px-4 py-3"><StatusBadge status={article.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/articles/${article._id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Link>
                        <button type="button" onClick={() => handleDelete(article._id, article.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {articles.length === 0 && (
            <div className="px-4 py-12 text-center text-slate-500 text-sm">ไม่พบบทความ</div>
          )}
        </div>
      )}
    </div>
  );
}
