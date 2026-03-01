'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  category: string;
  date: string;
  featuredImageUrl?: string;
  shortDescription?: string;
  authorName?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1490750967868-88df5691cc04?q=80&w=800';

export default function ArticlesPage() {
  const [articles, setArticles]           = useState<Article[]>([]);
  const [categoryList, setCategoryList]   = useState<{ _id: string; name: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState('ทั้งหมด');
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/articles?limit=50').then(r => r.json()),
      fetch('/api/article-categories').then(r => r.json()),
    ])
      .then(([articleData, catData]) => {
        if (articleData.articles) setArticles(articleData.articles);
        if (catData.ok && catData.categories) setCategoryList(catData.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ทั้งหมด', ...categoryList.map(c => c.name)];

  const filtered = activeCategory === 'ทั้งหมด'
    ? articles
    : articles.filter(a => a.category === activeCategory);

  function formatDate(val: string) {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] pt-24">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">บทความ</h1>

        {/* CATEGORY FILTER */}
        <div className="flex gap-2 flex-wrap mb-5">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all border ${
                activeCategory === cat
                  ? 'bg-[#E11D48] border-[#E11D48] text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* COUNT */}
        <p className="text-white/30 font-mono text-xs uppercase tracking-widest mb-5">
          {filtered.length} บทความ
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#E11D48] animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div key={activeCategory} className="grid grid-cols-2 gap-4 md:gap-5">
              {filtered.map((article, index) => (
                <motion.div key={article._id} layout
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/articles/${article._id}`}
                    className="group bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden flex flex-col hover:border-white/15 hover:bg-white/[0.07] transition-all duration-300 h-full"
                  >
                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                      <Image
                        src={article.featuredImageUrl || FALLBACK_IMAGE}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                    <div className="flex flex-col flex-1 p-3 md:p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[9px] md:text-[10px] font-black tracking-widest uppercase bg-[#E11D48]/15 text-[#E11D48] px-2 py-0.5 rounded-full shrink-0">
                          {article.category}
                        </span>
                        <span className="text-white/30 font-mono text-[9px] md:text-[10px]">{formatDate(article.date)}</span>
                      </div>
                      <h2 className="text-xs md:text-sm font-bold leading-snug group-hover:text-[#E11D48] transition-colors line-clamp-3 mb-3 flex-1">
                        {article.title}
                      </h2>
                      <div className="w-full mt-auto bg-[#E11D48]/10 group-hover:bg-[#E11D48] border border-[#E11D48]/30 group-hover:border-[#E11D48] text-[#E11D48] group-hover:text-white text-[10px] md:text-xs font-black tracking-widest uppercase py-2 md:py-2.5 rounded-xl transition-all duration-300 text-center">
                        อ่านเพิ่มเติม
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <p className="font-mono text-xs uppercase tracking-widest">ไม่พบบทความในหมวดนี้</p>
          </div>
        )}
      </div>
    </div>
  );
}
