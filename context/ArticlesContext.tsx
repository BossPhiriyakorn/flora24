'use client';

import * as React from 'react';

export interface Article {
  id: number;
  title: string;
  category: string;
  author: string;
  date: string;
  time?: string;
  status: string;
  shortDescription?: string;
  longDescription?: string;
  youtubeVideo?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeyword?: string;
  /** รูปหัวข้อบทความ (Featured) — data URL หรือ URL ภายนอก */
  featuredImageUrl?: string;
}

const initialArticles: Article[] = [
  { id: 1, title: '5 สัญญาณที่บอกว่าคุณพร้อมมี บ้านหลังแรก', category: 'ความรู้เรื่องบ้าน', author: 'Admin', date: '2024-03-21', time: '09:15', status: 'แสดง', shortDescription: '', longDescription: '', youtubeVideo: '', seoTitle: '', seoDescription: '', seoKeyword: '' },
  { id: 2, title: 'เปรียบเทียบราคาอสังหา ออนไลน์อย่างไรให้ได้บ้านราคาดี', category: 'วิเคราะห์ทำเล', author: 'Admin', date: '2024-03-19', time: '14:30', status: 'แสดง', shortDescription: '', longDescription: '', youtubeVideo: '', seoTitle: '', seoDescription: '', seoKeyword: '' },
  { id: 3, title: 'เทรนด์การแต่งบ้านปี 2024 ที่คุณไม่ควรพลาด', category: 'การตกแต่ง', author: 'Editor', date: '2024-03-18', time: '11:00', status: 'แสดง', shortDescription: '', longDescription: '', youtubeVideo: '', seoTitle: '', seoDescription: '', seoKeyword: '' },
  { id: 4, title: 'ทำไมย่านสุขุมวิทถึงยังเป็นทำเลทอง', category: 'วิเคราะห์ทำเล', author: 'Admin', date: '2024-03-15', time: '16:45', status: 'แสดง', shortDescription: '', longDescription: '', youtubeVideo: '', seoTitle: '', seoDescription: '', seoKeyword: '' },
  { id: 5, title: 'วิธีตรวจสอบเอกสารก่อนซื้อบ้านให้ปลอดภัย', category: 'ความรู้เรื่องบ้าน', author: 'Admin', date: '2024-03-12', time: '10:20', status: 'แสดง', shortDescription: '', longDescription: '', youtubeVideo: '', seoTitle: '', seoDescription: '', seoKeyword: '' },
  { id: 6, title: 'ข่าวสารอสังหาฯ เดือนมีนาคม 2024', category: 'ข่าวสารอสังหาฯ', author: 'Editor', date: '2024-03-10', time: '08:00', status: 'ไม่แสดง', shortDescription: '', longDescription: '', youtubeVideo: '', seoTitle: '', seoDescription: '', seoKeyword: '' },
];

type ArticlesContextType = {
  articles: Article[];
  addArticle: (article: Omit<Article, 'id'>) => void;
  updateArticle: (id: number, article: Partial<Article>) => void;
  deleteArticle: (id: number) => void;
  getArticleById: (id: number) => Article | undefined;
};

const ArticlesContext = React.createContext<ArticlesContextType | undefined>(undefined);

export function ArticlesProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = React.useState<Article[]>(initialArticles);

  const addArticle = React.useCallback((article: Omit<Article, 'id'>) => {
    setArticles((prev) => {
      const newId = Math.max(0, ...prev.map((a) => a.id)) + 1;
      return [{ ...article, id: newId } as Article, ...prev];
    });
  }, []);

  const updateArticle = React.useCallback((id: number, data: Partial<Article>) => {
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    );
  }, []);

  const deleteArticle = React.useCallback((id: number) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getArticleById = React.useCallback((id: number) => {
    return articles.find((a) => a.id === id);
  }, [articles]);

  const value = React.useMemo(
    () => ({ articles, addArticle, updateArticle, deleteArticle, getArticleById }),
    [articles, addArticle, updateArticle, deleteArticle, getArticleById]
  );

  return (
    <ArticlesContext.Provider value={value}>{children}</ArticlesContext.Provider>
  );
}

export function useArticles() {
  const ctx = React.useContext(ArticlesContext);
  if (!ctx) throw new Error('useArticles must be used within ArticlesProvider');
  return ctx;
}
