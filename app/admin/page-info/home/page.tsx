'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Layout, Save, Eye } from 'lucide-react';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export interface StoreHeroForm {
  heroTagline: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroDescLine1: string;
  heroDescLine2: string;
}

const DEFAULT_HERO: StoreHeroForm = {
  heroTagline: 'Premium 24/7 Floral Service',
  heroTitleLine1: 'BLOOMING',
  heroTitleLine2: 'EVERY SECOND.',
  heroDescLine1: 'สัมผัสความงามที่ไม่เคยหลับใหล จัดส่งดอกไม้ด่วนทั่วกรุงเทพฯ ตลอด 24 ชั่วโมง',
  heroDescLine2: 'เริ่มต้น 990 บาท จัดส่งฟรีภายใน 2 ชม.',
};

const FIELDS: { key: keyof StoreHeroForm; label: string; appPart: string; placeholder: string; type: 'text' | 'textarea' }[] = [
  { key: 'heroTagline', label: 'ข้อความเล็กด้านบน', appPart: 'แอป: บรรทัดแรกเหนือหัวข้อใหญ่ (ตัวเล็ก สีแดง)', placeholder: 'เช่น Premium 24/7 Floral Service', type: 'text' },
  { key: 'heroTitleLine1', label: 'หัวข้อใหญ่ บรรทัดที่ 1', appPart: 'แอป: คำใหญ่บรรทัดแรก (สีขาว)', placeholder: 'เช่น BLOOMING', type: 'text' },
  { key: 'heroTitleLine2', label: 'หัวข้อใหญ่ บรรทัดที่ 2', appPart: 'แอป: คำใหญ่บรรทัดที่สอง (สีแดง/ gradient)', placeholder: 'เช่น EVERY SECOND.', type: 'text' },
  { key: 'heroDescLine1', label: 'คำอธิบาย บรรทัดที่ 1', appPart: 'แอป: ข้อความบรรทัดแรกใต้หัวข้อ (สีขาวจาง)', placeholder: 'เช่น สัมผัสความงามที่ไม่เคยหลับใหล...', type: 'textarea' },
  { key: 'heroDescLine2', label: 'คำอธิบาย บรรทัดที่ 2 (เน้นราคา/ข้อเสนอ)', appPart: 'แอป: ข้อความเน้น ราคา หรือข้อเสนอ (สีขาวตัวหนา)', placeholder: 'เช่น เริ่มต้น 990 บาท จัดส่งฟรีภายใน 2 ชม.', type: 'textarea' },
];

export default function PageInfoHomePage() {
  const { showToast } = useToast();
  const [form, setForm] = React.useState<StoreHeroForm>(DEFAULT_HERO);
  const [saving, setSaving] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/admin/store-hero', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.hero) setForm(data.hero);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleChange = (key: keyof StoreHeroForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/store-hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? 'บันทึกล้มเหลว', 'error');
        return;
      }
      showToast('บันทึกข้อความหน้าแรกสำเร็จ', 'success');
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการหน้าแรก (Home)</h1>
          <p className="text-slate-500 text-sm mt-1">แก้ไขข้อความส่วน Hero ที่แสดงบนหน้าแอป (แบนเนอร์ด้านบน)</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
          >
            <Eye className="w-5 h-5" />
            ดูหน้าแอป
          </Link>
          <button
            type="submit"
            form="store-hero-form"
            disabled={saving || !loaded}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ฟอร์มแก้ไข — แบ่งชัดว่าเป็นคำส่วนไหนในแอป */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-6">
            <Layout className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">ข้อความ Hero หน้าแอป</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            แต่ละช่องด้านล่างตรงกับตำแหน่งบนแอปตามที่ระบุ (ตั้งค่าตามต้องการแล้วกดบันทึก)
          </p>

          <form id="store-hero-form" onSubmit={handleSave} className="space-y-6">
            {FIELDS.map(({ key, label, appPart, placeholder, type }) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">{label}</label>
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                  {appPart}
                </p>
                {type === 'textarea' ? (
                  <textarea
                    rows={2}
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[key]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                )}
              </div>
            ))}
          </form>
        </motion.div>

        {/* แสดงตัวอย่างก่อนกดบันทึก */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-800 rounded-2xl border border-slate-200 overflow-hidden"
        >
          <div className="bg-slate-700 text-slate-200 px-4 py-2 text-xs font-bold flex items-center gap-2">
            <Eye className="w-4 h-4" />
            แสดงตัวอย่าง (จะแสดงแบบนี้บนแอปเมื่อกดบันทึก)
          </div>
          <div className="relative min-h-[320px] flex items-center justify-center p-6 bg-[#0A0A0A] bg-gradient-to-b from-black/70 to-black">
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center max-w-md w-full">
              <span className="inline-block text-[#E11D48] font-mono text-[10px] tracking-widest uppercase mb-3">
                {form.heroTagline || ' '}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight mb-4 text-white">
                {form.heroTitleLine1 || ' '}
                <br />
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#E11D48] to-white">
                  {form.heroTitleLine2 || ' '}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                {form.heroDescLine1 || ' '}
                <br />
                <span className="text-white font-medium italic">{form.heroDescLine2 || ' '}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
