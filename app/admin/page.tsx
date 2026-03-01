'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  Users,
  Megaphone,
  FileText,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CreditCard,
  XCircle,
  LogIn,
  FileText as FileTextIcon,
  Loader2,
  Bell,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { name: 'ผู้เข้าชมวันนี้', value: '1,284', change: '+12.5%', icon: Users, color: 'bg-blue-500' },
  { name: 'ประกาศใหม่', value: '42', change: '+5.2%', icon: Megaphone, color: 'bg-emerald-500' },
  { name: 'บทความทั้งหมด', value: '156', change: '-2.4%', icon: FileText, color: 'bg-amber-500' },
];

type NotifType = 'new_order' | 'payment_pending' | 'order_cancelled' | 'admin_login' | 'new_article' | 'new_customer' | 'new_product' | 'new_product_category' | 'new_article_category' | 'settings_updated';

interface BestSellingItem {
  productId: string;
  name: string;
  totalQty: number;
  imageUrl?: string;
}

interface ActivityItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  actorName?: string;
  timestamp: number;
  read: boolean;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'เมื่อกี้';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

/** วันที่ เวลา แบบไทย เช่น 28 ก.พ. 2568 14:30 */
function formatDateTimeThai(ts: number): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

const ACTIVITY_ICON: Record<NotifType, React.ReactNode> = {
  new_order:            <ShoppingBag className="w-3.5 h-3.5" />,
  payment_pending:      <CreditCard   className="w-3.5 h-3.5" />,
  order_cancelled:      <XCircle      className="w-3.5 h-3.5" />,
  admin_login:          <LogIn        className="w-3.5 h-3.5" />,
  new_article:          <FileTextIcon className="w-3.5 h-3.5" />,
  new_customer:         <Users        className="w-3.5 h-3.5" />,
  new_product:          <ShoppingBag  className="w-3.5 h-3.5" />,
  new_product_category: <ShoppingBag  className="w-3.5 h-3.5" />,
  new_article_category: <FileTextIcon className="w-3.5 h-3.5" />,
  settings_updated:     <Settings     className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLOR: Record<NotifType, string> = {
  new_order:            'bg-emerald-100 text-emerald-600',
  payment_pending:      'bg-amber-100 text-amber-600',
  order_cancelled:      'bg-red-100 text-red-600',
  admin_login:          'bg-blue-100 text-blue-600',
  new_article:          'bg-violet-100 text-violet-600',
  new_customer:         'bg-cyan-100 text-cyan-600',
  new_product:          'bg-emerald-100 text-emerald-600',
  new_product_category: 'bg-sky-100 text-sky-600',
  new_article_category: 'bg-indigo-100 text-indigo-600',
  settings_updated:     'bg-slate-100 text-slate-600',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596438459194-f275f413d6ff?q=80&w=200';

export default function Dashboard() {
  const [adminName, setAdminName]       = React.useState<string>('');
  const [bestSelling, setBestSelling]    = React.useState<BestSellingItem[]>([]);
  const [activities, setActivities]      = React.useState<ActivityItem[]>([]);
  const [loadingBest, setLoadingBest]    = React.useState(true);
  const [loadingActivity, setLoadingActivity] = React.useState(true);

  React.useEffect(() => {
    fetch('/api/auth/admin/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) {
          const n = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ');
          setAdminName(n || 'แอดมิน');
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    setLoadingBest(true);
    fetch('/api/admin/stats/best-selling')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.items) setBestSelling(data.items);
      })
      .catch(() => {})
      .finally(() => setLoadingBest(false));
  }, []);

  React.useEffect(() => {
    setLoadingActivity(true);
    fetch('/api/admin/notifications')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.notifications) {
          setActivities(
            data.notifications.map((n: { id: string; type: NotifType; title: string; body: string; actorName?: string; timestamp: number; read: boolean }) => ({
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              actorName: n.actorName,
              timestamp: n.timestamp,
              read: n.read,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">หน้าแรก (Dashboard)</h1>
        <p className="text-slate-500 mt-2">
          ยินดีต้อนรับกลับมา{adminName ? `, ${adminName}` : ''}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between">
              <div className={cn('p-3 rounded-xl text-white', stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span
                className={cn(
                  'flex items-center text-xs font-bold px-2 py-1 rounded-full',
                  stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                )}
              >
                {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">อันดับสินค้าขายดี</h3>
            <Link
              href="/admin/products"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          {loadingBest ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : bestSelling.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
              <TrendingUp className="w-8 h-8" />
              <p className="text-sm">ยังไม่มีรายการขาย (อ้างอิงจากคำสั่งซื้อที่ชำระแล้ว)</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bestSelling.map((item, index) => (
                <Link
                  key={`${item.productId}-${index}`}
                  href="/admin/products"
                  className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 relative">
                    <Image
                      src={item.imageUrl || FALLBACK_IMAGE}
                      alt=""
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500">ขายได้ {item.totalQty} ชิ้น</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">กิจกรรมล่าสุด</h3>
            <Link
              href="/admin"
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              แจ้งเตือนทั้งหมด
            </Link>
          </div>
          {loadingActivity ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-slate-400 gap-2">
              <Bell className="w-8 h-8" />
              <p className="text-sm">ยังไม่มีกิจกรรม</p>
            </div>
          ) : (
            <div
              className="space-y-2 max-h-80 overflow-y-auto pr-1 scrollbar-thin"
              style={{ scrollbarWidth: 'thin' }}
            >
              {activities.map((a) => (
                <div
                  key={a.id}
                  className={cn(
                    'flex gap-3 p-3 rounded-xl transition-colors',
                    !a.read && 'bg-emerald-50/50'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      ACTIVITY_COLOR[a.type] ?? 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {ACTIVITY_ICON[a.type] ?? <Bell className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{a.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{a.body}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {a.actorName && <span>โดย {a.actorName}</span>}
                      {a.actorName && <span> · </span>}
                      <span>{formatDateTimeThai(a.timestamp)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
