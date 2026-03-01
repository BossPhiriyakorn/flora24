import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Tag, ArrowLeft } from 'lucide-react';

const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

async function getArticle(id: string) {
  try {
    const res = await fetch(`${BASE}/api/articles/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.article ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return {};
  return {
    title: `${article.seoTitle || article.title} | FLORA`,
    description: article.seoDescription || article.shortDescription,
  };
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const related: any[] = article.related ?? [];

  function formatDate(val: string) {
    if (!val) return '';
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] pt-24">
      <article className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        {/* Back */}
        <Link href="/articles" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-xs font-bold uppercase tracking-widest">
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับหน้าบทความ
        </Link>

        {/* CATEGORY + DATE */}
        <div className="flex items-center gap-3 mb-5">
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase bg-[#E11D48]/15 text-[#E11D48] px-3 py-1 rounded-full">
            <Tag className="w-2.5 h-2.5" />
            {article.category}
          </span>
          <span className="flex items-center gap-1.5 text-white/30 font-mono text-[10px]">
            <Clock className="w-2.5 h-2.5" />
            {formatDate(article.date || article.createdAt)}
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight mb-6">
          {article.title}
        </h1>

        {/* HERO IMAGE */}
        {article.featuredImageUrl && (
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-8">
            <Image
              src={article.featuredImageUrl}
              alt={article.title}
              fill
              priority
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* EXCERPT / SHORT DESCRIPTION */}
        {article.shortDescription && (
          <p className="text-base md:text-lg text-white/60 leading-relaxed font-light border-l-2 border-[#E11D48] pl-4 mb-8">
            {article.shortDescription}
          </p>
        )}

        {/* YOUTUBE VIDEO */}
        {article.youtubeVideo && (
          <div className="relative w-full pb-[56.25%] mb-8 rounded-2xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${article.youtubeVideo}`}
              title="YouTube video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        )}

        {/* CONTENT / LONG DESCRIPTION */}
        {article.longDescription && (
          <div
            className="prose prose-invert prose-lg max-w-none mb-12 prose-headings:font-black prose-a:text-[#E11D48]"
            dangerouslySetInnerHTML={{ __html: article.longDescription }}
          />
        )}

        {/* AUTHOR */}
        {article.authorName && (
          <div className="border-t border-white/8 pt-6 mb-8">
            <p className="text-white/40 text-xs font-mono">เขียนโดย — <span className="text-white/70">{article.authorName}</span></p>
          </div>
        )}

        {/* RELATED ARTICLES */}
        {related.length > 0 && (
          <div className="border-t border-white/8 pt-8">
            <h3 className="text-base font-black tracking-widest uppercase mb-5 text-white/70">บทความที่เกี่ยวข้อง</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r: any) => (
                <Link key={r._id} href={`/articles/${r._id}`}
                  className="group bg-white/[0.04] border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-all">
                  {r.featuredImageUrl && (
                    <div className="relative w-full aspect-[4/3] overflow-hidden">
                      <Image src={r.featuredImageUrl} alt={r.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-xs font-bold line-clamp-2 group-hover:text-[#E11D48] transition-colors">{r.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
