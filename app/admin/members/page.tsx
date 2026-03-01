'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Mail, Phone, Calendar, ChevronRight, Users, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  email: string;
  phone?: string;
  createdAt: string;
  status?: string;
  provider?: string;
}

export default function MembersPage() {
  const [members, setMembers]         = React.useState<Member[]>([]);
  const [total, setTotal]             = React.useState(0);
  const [loading, setLoading]         = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { showToast } = useToast();

  async function fetchMembers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const res  = await fetch(`/api/admin/members?${params}`);
      const data = await res.json();
      if (res.ok) { setMembers(data.members ?? []); setTotal(data.total ?? 0); }
      else showToast(data.error ?? 'โหลดล้มเหลว', 'error');
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { fetchMembers(); }, [searchQuery]);

  function formatDate(val: string) {
    if (!val) return '-';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ข้อมูลสมาชิก</h1>
          <p className="text-slate-500 text-sm">จัดการข้อมูลผู้ใช้งานและสิทธิ์การเข้าถึงของสมาชิก</p>
        </div>
        <button onClick={fetchMembers} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="รีเฟรช">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาสมาชิก (ชื่อ, อีเมล, เบอร์)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
            <Users className="w-4 h-4" />
            ทั้งหมด {total} คน
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">สมาชิก</th>
                  <th className="px-6 py-4">เบอร์โทร</th>
                  <th className="px-6 py-4">อีเมล</th>
                  <th className="px-6 py-4">วันที่สมัคร</th>
                  <th className="px-6 py-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map(member => (
                  <tr key={member._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                          {member.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {member.firstName} {member.lastName}
                            {member.nickname && (
                              <span className="ml-1.5 text-slate-400 font-normal text-xs">({member.nickname})</span>
                            )}
                          </p>
                          {member.provider && (
                            <span className="text-[10px] text-slate-400">{member.provider === 'line' ? '📲 LINE' : member.provider === 'email' ? '✉️ Email' : '✉️+📲 Both'}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {member.phone || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {member.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(member.createdAt)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/members/${member._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        รายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                      ไม่พบข้อมูลสมาชิก
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
