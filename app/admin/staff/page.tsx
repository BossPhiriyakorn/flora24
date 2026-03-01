'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  UserPlus, Shield, Mail, Edit, Trash2, Save, Eye, EyeOff, User, Loader2, RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/Toast';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  role: 'admin' | 'editor';
  lastLogin?: string;
  createdAt?: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-purple-50 text-purple-600',
  editor: 'bg-blue-50 text-blue-600',
};

const ROLE_LABELS: Record<string, string> = {
  admin:  'Admin',
  editor: 'Editor',
};

export default function StaffPage() {
  const [staffList, setStaffList] = React.useState<Staff[]>([]);
  const [loading, setLoading]     = React.useState(true);
  const [isModalOpen, setIsModalOpen]   = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [saving, setSaving]             = React.useState(false);
  const { showToast } = useToast();

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/staff');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setStaffList(data.staff ?? []);
    } catch {
      showToast('โหลดข้อมูลพนักงานล้มเหลว', 'error');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchStaff(); }, []);

  function openAdd() {
    setEditingStaff(null);
    setShowPassword(false);
    setIsModalOpen(true);
  }

  function openEdit(staff: Staff) {
    setEditingStaff(staff);
    setShowPassword(false);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingStaff(null);
    setShowPassword(false);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      firstName: (fd.get('firstName') as string).trim(),
      lastName:  (fd.get('lastName')  as string).trim(),
      nickname:  (fd.get('nickname')  as string).trim(),
      email:     (fd.get('email')     as string).trim(),
      password:  (fd.get('password')  as string).trim(),
      role:      fd.get('role') as string,
    };

    setSaving(true);
    try {
      if (editingStaff) {
        const res = await fetch(`/api/admin/staff/${editingStaff._id}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error ?? 'แก้ไขล้มเหลว', 'error'); return; }
        showToast('แก้ไขข้อมูลพนักงานสำเร็จ', 'success');
      } else {
        const res = await fetch('/api/admin/staff', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { showToast(data.error ?? 'เพิ่มพนักงานล้มเหลว', 'error'); return; }
        showToast('เพิ่มพนักงานใหม่สำเร็จ', 'success');
      }
      closeModal();
      fetchStaff();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(staff: Staff) {
    if (!confirm(`ต้องการลบ "${staff.firstName} ${staff.lastName}" หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/admin/staff/${staff._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'ลบล้มเหลว', 'error'); return; }
      showToast('ลบพนักงานสำเร็จ');
      fetchStaff();
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    }
  }

  function formatDate(val?: string) {
    if (!val) return '-';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
  }

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลพนักงาน</h1>
          <p className="text-slate-500 text-sm">จัดการบัญชีผู้ใช้งานสำหรับทีมงานหลังบ้าน</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStaff}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            title="รีเฟรช"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            เพิ่มพนักงานใหม่
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {staffList.map((staff, index) => (
            <motion.div
              key={staff._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-5 relative"
            >
              {/* avatar */}
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xl shrink-0">
                {staff.firstName.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                {/* name + role */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      {staff.firstName} {staff.lastName}
                    </h3>
                    {staff.nickname && (
                      <span className="text-slate-400 text-xs">&ldquo;{staff.nickname}&rdquo;</span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${ROLE_COLORS[staff.role] ?? 'bg-slate-100 text-slate-500'}`}>
                      {ROLE_LABELS[staff.role] ?? staff.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ล็อคอินล่าสุด: {formatDate(staff.lastLogin)}
                  </p>
                </div>

                {/* info rows */}
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono tracking-widest text-slate-300">••••••••</span>
                  </div>
                </div>

                {/* actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => openEdit(staff)}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" /> แก้ไขข้อมูล
                  </button>
                  <span className="text-slate-200">|</span>
                  <button
                    onClick={() => handleDelete(staff)}
                    className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> ลบ
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {staffList.length === 0 && !loading && (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
              ยังไม่มีข้อมูลพนักงาน
            </div>
          )}
        </div>
      )}

      {/* ─── Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingStaff ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
      >
        <form onSubmit={handleSave} className="space-y-4">

          {/* ชื่อ + สกุล side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> ชื่อ
              </label>
              <input
                name="firstName"
                defaultValue={editingStaff?.firstName}
                required
                placeholder="สมชาย"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">นามสกุล</label>
              <input
                name="lastName"
                defaultValue={editingStaff?.lastName}
                required
                placeholder="รักดี"
                className={inputCls}
              />
            </div>
          </div>

          {/* ชื่อเล่น */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">ชื่อเล่น</label>
            <input
              name="nickname"
              defaultValue={editingStaff?.nickname}
              placeholder="ชาย"
              className={inputCls}
            />
          </div>

          {/* อีเมล */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> อีเมล
            </label>
            <input
              name="email"
              type="email"
              defaultValue={editingStaff?.email}
              required
              placeholder="staff@flora.co.th"
              className={inputCls}
            />
          </div>

          {/* รหัสผ่าน */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" /> รหัสผ่าน
              {editingStaff && (
                <span className="text-slate-400 font-normal text-xs ml-1">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>
              )}
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                required={!editingStaff}
                placeholder={editingStaff ? '••••••••' : 'อย่างน้อย 8 ตัวอักษร'}
                minLength={editingStaff ? 0 : 8}
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">สิทธิ์การใช้งาน</label>
            <select
              name="role"
              defaultValue={editingStaff?.role ?? 'editor'}
              className={inputCls}
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
                : <><Save className="w-4 h-4" /> {editingStaff ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน'}</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
