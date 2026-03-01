'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Bell, Globe, Save, Database, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/components/Toast';

const textareaCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-y min-h-[80px]';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('ทั่วไป');
  const [termsContent, setTermsContent] = React.useState('');
  const [privacyContent, setPrivacyContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    fetch('/api/admin/settings/legal', { cache: 'no-store', credentials: 'include' })
      .then(r => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(data => {
        if (data && typeof data.termsContent === 'string') setTermsContent(data.termsContent);
        if (data && typeof data.privacyContent === 'string') setPrivacyContent(data.privacyContent);
      })
      .catch(() => showToast('โหลดการตั้งค่าไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/legal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ termsContent, privacyContent }),
      });
      if (!res.ok) {
        showToast('บันทึกไม่สำเร็จ');
        return;
      }
      showToast('บันทึกการตั้งค่าสำเร็จ');
    } catch {
      showToast('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ตั้งค่าระบบ</h1>
          <p className="text-slate-500 text-sm">ปรับแต่งการทำงานและตั้งค่าความปลอดภัยของระบบ CMS</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          บันทึกการตั้งค่า
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <nav className="space-y-1">
            {[
              { name: 'ทั่วไป', icon: Globe },
              { name: 'ความปลอดภัย', icon: Lock },
              { name: 'การแจ้งเตือน', icon: Bell },
              { name: 'ฐานข้อมูล', icon: Database },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === item.name ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-600 hover:bg-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">การตั้งค่า{activeTab}</h3>
            
            {activeTab === 'ทั่วไป' && (
              <div className="space-y-6">
                {loading && <p className="text-slate-400 text-sm">กำลังโหลด...</p>}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ข้อกำหนดการใช้งาน (Terms and Conditions)</label>
                  <p className="text-xs text-slate-500 mb-1">เนื้อหาที่จะแสดงในหน้าสมัครสมาชิกหรือฟอร์มกรอกข้อมูล เมื่อผู้ใช้คลิกดูข้อกำหนดการใช้งาน</p>
                  <textarea rows={6} value={termsContent} onChange={e => setTermsContent(e.target.value)} className={textareaCls} placeholder="กรอกเนื้อหาข้อกำหนดการใช้งาน..." />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">นโยบายความเป็นส่วนตัว (Privacy Policy)</label>
                  <p className="text-xs text-slate-500 mb-1">เนื้อหาที่จะแสดงในหน้าสมัครสมาชิกหรือฟอร์มกรอกข้อมูล เมื่อผู้ใช้คลิกดูนโยบายความเป็นส่วนตัว</p>
                  <textarea rows={6} value={privacyContent} onChange={e => setPrivacyContent(e.target.value)} className={textareaCls} placeholder="กรอกเนื้อหานโยบายความเป็นส่วนตัว..." />
                </div>
              </div>
            )}

            {activeTab !== 'ทั่วไป' && (
              <div className="py-12 text-center text-slate-400 text-sm">
                ส่วนการตั้งค่า {activeTab} กำลังอยู่ระหว่างการพัฒนา
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
