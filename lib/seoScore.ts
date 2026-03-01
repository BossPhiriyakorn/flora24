/**
 * วิเคราะห์ SEO แบบ Yoast — เงื่อนไขและคะแนนสำหรับบทความ
 */

export type SeoCheckStatus = 'good' | 'warning' | 'bad';

export interface SeoCheckItem {
  id: string;
  label: string;
  status: SeoCheckStatus;
  message: string;
  score: number; // 0, 50, 100
}

export interface SeoScoreInput {
  title: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  seoKeyword: string;
  hasFeaturedImage?: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text: string): number {
  const t = stripHtml(text).trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function charCount(text: string): number {
  return (text || '').trim().length;
}

const TITLE_LEN_GOOD = { min: 50, max: 60 };
const TITLE_LEN_WARN = { min: 30, max: 70 };
const META_LEN_GOOD = { min: 120, max: 160 };
const META_LEN_WARN = { min: 90, max: 200 };
const CONTENT_WORDS_GOOD = 300;
const CONTENT_WORDS_WARN = 150;

export function analyzeSeo(input: SeoScoreInput): { score: number; checks: SeoCheckItem[] } {
  const c = input;
  const keyword = (c.seoKeyword || '').trim();
  const titleForSeo = (c.seoTitle || c.title || '').trim();
  const metaDesc = (c.seoDescription || c.shortDescription || '').trim();
  const content = (c.longDescription || '').trim();
  const contentPlain = stripHtml(content);
  const contentWords = wordCount(content);
  const checks: SeoCheckItem[] = [];

  // 1. คีย์เวิร์ดหลัก (Focus keyword)
  if (keyword) {
    checks.push({
      id: 'focusKeyword',
      label: 'คำหลัก (Focus keyword)',
      status: 'good',
      message: `ใช้คำหลัก: "${keyword}"`,
      score: 100,
    });
  } else {
    checks.push({
      id: 'focusKeyword',
      label: 'คำหลัก (Focus keyword)',
      status: 'bad',
      message: 'ยังไม่ได้กรอกคำหลัก (Tag Keyword)',
      score: 0,
    });
  }

  // 2. คำหลักใน Title
  const keywordInTitle = keyword && titleForSeo.toLowerCase().includes(keyword.toLowerCase());
  checks.push({
    id: 'keywordInTitle',
    label: 'คำหลักใน Title',
    status: keywordInTitle ? 'good' : keyword ? 'warning' : 'good',
    message: keywordInTitle
      ? 'คำหลักปรากฏใน Title'
      : keyword
        ? 'ควรใส่คำหลักใน Title'
        : 'กรอกคำหลักก่อนตรวจ',
    score: keywordInTitle ? 100 : keyword ? 0 : 100,
  });

  // 3. ความยาว Title
  const titleLen = charCount(titleForSeo);
  let titleStatus: SeoCheckStatus = 'good';
  let titleScore = 100;
  if (titleLen === 0) {
    titleStatus = 'bad';
    titleScore = 0;
  } else if (titleLen < TITLE_LEN_WARN.min || titleLen > TITLE_LEN_WARN.max) {
    titleStatus = 'bad';
    titleScore = 0;
  } else if (titleLen < TITLE_LEN_GOOD.min || titleLen > TITLE_LEN_GOOD.max) {
    titleStatus = 'warning';
    titleScore = 50;
  }
  checks.push({
    id: 'titleLength',
    label: 'ความยาว Title',
    status: titleStatus,
    message:
      titleLen === 0
        ? 'ยังไม่มี Title'
        : `ความยาว ${titleLen} ตัวอักษร (แนะนำ 50–60, สูงสุด ~70)`,
    score: titleScore,
  });

  // 4. คำหลักใน Meta Description
  const keywordInMeta = keyword && metaDesc.toLowerCase().includes(keyword.toLowerCase());
  checks.push({
    id: 'keywordInMeta',
    label: 'คำหลักใน Meta Description',
    status: keywordInMeta ? 'good' : keyword ? 'warning' : 'good',
    message: keywordInMeta
      ? 'คำหลักปรากฏใน Meta Description'
      : keyword
        ? 'ควรใส่คำหลักใน Meta Description'
        : 'กรอกคำหลักก่อนตรวจ',
    score: keywordInMeta ? 100 : keyword ? 0 : 100,
  });

  // 5. ความยาว Meta Description
  const metaLen = charCount(metaDesc);
  let metaStatus: SeoCheckStatus = 'good';
  let metaScore = 100;
  if (metaLen === 0) {
    metaStatus = 'warning';
    metaScore = 0;
  } else if (metaLen < 90 || metaLen > 200) {
    metaStatus = metaLen > 200 ? 'warning' : 'bad';
    metaScore = metaLen > 200 ? 50 : 0;
  } else if (metaLen < META_LEN_GOOD.min || metaLen > META_LEN_GOOD.max) {
    metaStatus = 'warning';
    metaScore = 50;
  }
  checks.push({
    id: 'metaLength',
    label: 'ความยาว Meta Description',
    status: metaStatus,
    message:
      metaLen === 0
        ? 'ยังไม่มี Meta Description'
        : `ความยาว ${metaLen} ตัวอักษร (แนะนำ 120–160)`,
    score: metaScore,
  });

  // 6. ความยาวเนื้อหา
  let contentStatus: SeoCheckStatus = 'good';
  let contentScore = 100;
  if (contentWords < CONTENT_WORDS_WARN) {
    contentStatus = 'bad';
    contentScore = 0;
  } else if (contentWords < CONTENT_WORDS_GOOD) {
    contentStatus = 'warning';
    contentScore = 50;
  }
  checks.push({
    id: 'contentLength',
    label: 'ความยาวเนื้อหา',
    status: contentStatus,
    message: `ประมาณ ${contentWords} คำ (แนะนำอย่างน้อย 300 คำ)`,
    score: contentScore,
  });

  // 7. คำหลักในเนื้อหา
  const keywordInContent = keyword && contentPlain.toLowerCase().includes(keyword.toLowerCase());
  checks.push({
    id: 'keywordInContent',
    label: 'คำหลักในเนื้อหา',
    status: keywordInContent ? 'good' : keyword ? 'warning' : 'good',
    message: keywordInContent
      ? 'คำหลักปรากฏในเนื้อหา'
      : keyword
        ? 'ควรใช้คำหลักในเนื้อหาบทความ'
        : 'กรอกคำหลักก่อนตรวจ',
    score: keywordInContent ? 100 : keyword ? 0 : 100,
  });

  // 8. รูปภาพโปรไฟล์
  checks.push({
    id: 'featuredImage',
    label: 'รูปภาพโปรไฟล์',
    status: c.hasFeaturedImage ? 'good' : 'warning',
    message: c.hasFeaturedImage ? 'มีรูปภาพโปรไฟล์' : 'แนะนำให้มีรูปภาพโปรไฟล์',
    score: c.hasFeaturedImage ? 100 : 50,
  });

  // 9. SEO Title กรอกแล้ว
  checks.push({
    id: 'seoTitleFilled',
    label: 'กรอก SEO Title',
    status: (c.seoTitle || '').trim().length > 0 ? 'good' : 'warning',
    message: (c.seoTitle || '').trim().length > 0 ? 'กรอก Tag Title แล้ว' : 'แนะนำกรอก Tag Title',
    score: (c.seoTitle || '').trim().length > 0 ? 100 : 50,
  });

  // 10. SEO Description กรอกแล้ว
  checks.push({
    id: 'seoDescFilled',
    label: 'กรอก SEO Description',
    status: (c.seoDescription || c.shortDescription || '').trim().length > 0 ? 'good' : 'warning',
    message:
      (c.seoDescription || c.shortDescription || '').trim().length > 0
        ? 'กรอก Meta Description แล้ว'
        : 'แนะนำกรอก Tag Description หรือรายละเอียดแบบสั้น',
    score: (c.seoDescription || c.shortDescription || '').trim().length > 0 ? 100 : 50,
  });

  const totalScore =
    checks.length > 0 ? Math.round(checks.reduce((sum, i) => sum + i.score, 0) / checks.length) : 0;

  return { score: Math.min(100, totalScore), checks };
}

export function getScoreStatus(score: number): SeoCheckStatus {
  if (score >= 70) return 'good';
  if (score >= 40) return 'warning';
  return 'bad';
}
