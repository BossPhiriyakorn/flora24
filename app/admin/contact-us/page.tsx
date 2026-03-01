'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Phone, MessageSquare, Send, Edit, Trash2,
  CheckCircle, Save, X, Facebook, Music2,
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';

// Contact info managed via /api/admin/contacts (MongoDB)

interface Message {
  id: number;
  name: string;
  date: string;
  content: string;
  isRead: boolean;
}

export interface ContactInfo {
  phone: string;
  email: string;
  lineId: string;
  facebook: string;
  tiktok: string;
}

const DEFAULT_CONTACT: ContactInfo = {
  phone: '02-123-4567',
  email: 'contact@flora.co.th',
  lineId: '@flora_delivery',
  facebook: '',
  tiktok: '',
};

const CHANNELS = [
  { key: 'phone' as const, label: 'เบอร์โทรศัพท์', icon: Phone, placeholder: '02-123-4567', inputMode: 'tel' as const },
  { key: 'email' as const, label: 'อีเมล', icon: Mail, placeholder: 'contact@flora.co.th', inputMode: 'email' as const },
  { key: 'lineId' as const, label: 'LINE ID', icon: MessageSquare, placeholder: '@flora_delivery', inputMode: 'text' as const },
  { key: 'facebook' as const, label: 'Facebook (ลิงค์เพจ)', icon: Facebook, placeholder: 'https://facebook.com/yourpage', inputMode: 'url' as const },
  { key: 'tiktok' as const, label: 'TikTok (ลิงค์โปรไฟล์)', icon: Music2, placeholder: 'https://tiktok.com/@yourprofile', inputMode: 'url' as const },
];

export default function ContactUsPage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [contactInfo, setContactInfo] = React.useState<ContactInfo>(DEFAULT_CONTACT);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [saving, setSaving]           = React.useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    fetch('/api/admin/contacts')
      .then(r => r.json())
      .then(data => { if (data.contact) setContactInfo(data.contact); })
      .catch(() => {});
  }, []);

  const handleMarkAsRead = (id: number) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    showToast('ทำเครื่องหมายว่าอ่านแล้ว');
  };

  const handleDeleteMessage = (id: number) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อความนี้?')) {
      setMessages(prev => prev.filter(m => m.id !== id));
      showToast('ลบข้อความสำเร็จ');
    }
  };

  const handleSaveContactInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updated: ContactInfo = {
      phone:    (fd.get('phone')    as string).trim(),
      email:    (fd.get('email')    as string).trim(),
      lineId:   (fd.get('lineId')   as string).trim(),
      facebook: (fd.get('facebook') as string).trim(),
      tiktok:   (fd.get('tiktok')   as string).trim(),
    };
    setSaving(true);
    try {
      const res  = await fetch('/api/admin/contacts', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'บันทึกล้มเหลว', 'error'); return; }
      setContactInfo(updated);
      setIsModalOpen(false);
      showToast('บันทึกข้อมูลการติดต่อสำเร็จ', 'success');
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filledChannels = CHANNELS.filter(ch => contactInfo[ch.key]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ติดต่อเรา</h1>
        <p className="text-slate-500 text-sm">จัดการข้อมูลการติดต่อและข้อความจากลูกค้า</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MESSAGES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              ข้อความล่าสุดจากลูกค้า
            </h3>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl border transition-colors ${
                      msg.isRead ? 'bg-white border-slate-100' : 'bg-emerald-50/30 border-emerald-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{msg.name}</span>
                        {!msg.isRead && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                      </div>
                      <span className="text-[10px] text-slate-400">{msg.date}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{msg.content}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => showToast('ฟีเจอร์ตอบกลับกำลังพัฒนา')}
                          className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> ตอบกลับ
                        </button>
                        {!msg.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(msg.id)}
                            className="text-xs font-bold text-slate-400 hover:underline flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> ทำเครื่องหมายว่าอ่านแล้ว
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {messages.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">ไม่มีข้อความใหม่</div>
              )}
            </div>
          </div>
        </div>

        {/* CONTACT INFO */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-1">ข้อมูลการติดต่อหลัก</h3>
            <p className="text-xs text-slate-400 mb-5">
              ช่องทางที่กรอกแล้วจะแสดงในหน้าแอป · ช่องว่างจะซ่อนอัตโนมัติ
            </p>

            <div className="space-y-3">
              {CHANNELS.map(ch => {
                const value = contactInfo[ch.key];
                const Icon = ch.icon;
                const isFilled = !!value;
                return (
                  <div key={ch.key} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      {ch.label}
                      {isFilled
                        ? <span className="bg-emerald-100 text-emerald-600 rounded-full px-1.5 py-0.5 text-[9px] font-bold">แสดง</span>
                        : <span className="bg-slate-100 text-slate-400 rounded-full px-1.5 py-0.5 text-[9px] font-bold">ซ่อน</span>
                      }
                    </label>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isFilled ? 'bg-slate-50 border-slate-100' : 'bg-white border-dashed border-slate-200'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isFilled ? 'text-emerald-500' : 'text-slate-300'}`} />
                      <span className={`text-sm font-medium truncate ${isFilled ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                        {value || 'ยังไม่ได้กรอก'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-3">
                แสดง {filledChannels.length}/{CHANNELS.length} ช่องทาง
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                แก้ไขข้อมูลการติดต่อ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="แก้ไขข้อมูลการติดต่อ">
        <form onSubmit={handleSaveContactInfo} className="space-y-4">
          {CHANNELS.map(ch => {
            const Icon = ch.icon;
            return (
              <div key={ch.key} className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  {ch.label}
                  <span className="text-slate-400 font-normal text-xs">(ไม่บังคับ)</span>
                </label>
                <input
                  name={ch.key}
                  type={ch.inputMode === 'email' ? 'email' : ch.inputMode === 'url' ? 'url' : 'text'}
                  inputMode={ch.inputMode}
                  defaultValue={contactInfo[ch.key]}
                  placeholder={ch.placeholder}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            );
          })}
          <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
            ช่องที่เว้นว่างจะถูกซ่อนอัตโนมัติในหน้าแอปของผู้ใช้
          </p>
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-5 h-5" />
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
