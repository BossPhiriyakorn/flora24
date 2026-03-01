'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag,
  Users, 
  FileText, 
  Mail, 
  MapPin, 
  BookOpen, 
  UserCircle, 
  UserCog, 
  Info, 
  Settings, 
  LogOut,
  ChevronRight,
  ChevronDown,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/components/Toast';

const ADMIN_BASE = '/admin';

type MenuItem = {
  title: string;
  icon: React.ElementType;
  href: string;
  hidden?: boolean;
  comingSoon?: boolean;
  subItems?: { title: string; href: string }[];
};

const menuItems: MenuItem[] = [
  { title: 'หน้าแรก', icon: LayoutDashboard, href: `${ADMIN_BASE}` },
  { 
    title: 'รายการสินค้า', 
    icon: ShoppingBag, 
    href: `${ADMIN_BASE}/products`,
    subItems: [
      { title: 'จัดการสินค้า', href: `${ADMIN_BASE}/products` },
      { title: 'หมวดหมู่สินค้า', href: `${ADMIN_BASE}/products/categories` },
      { title: 'คำสั่งซื้อ', href: `${ADMIN_BASE}/orders` },
    ]
  },
  { 
    title: 'ข้อมูลความสนใจลูกค้า', 
    icon: Users, 
    href: `${ADMIN_BASE}/customer-interests`,
    hidden: true,
    subItems: [
      { title: 'จัดการข้อมูล POPUP', href: `${ADMIN_BASE}/customer-interests/popup` },
    ]
  },
  { 
    title: 'บทความ', 
    icon: FileText, 
    href: `${ADMIN_BASE}/articles`,
    subItems: [
      { title: 'หมวดหมู่บทความ', href: `${ADMIN_BASE}/articles/categories` },
      { title: 'บทความ', href: `${ADMIN_BASE}/articles` },
    ]
  },
  { 
    title: 'ติดต่อเรา', 
    icon: Mail, 
    href: `${ADMIN_BASE}/contact-us`,
    subItems: [
      { title: 'ข้อมูลติดต่อเรา', href: `${ADMIN_BASE}/contact-us` },
    ]
  },
  { 
    title: 'ข้อมูลสถานที่ตั้ง', 
    icon: MapPin, 
    href: `${ADMIN_BASE}/locations`,
    comingSoon: true,
  },
  { 
    title: 'ข้อมูลหน้าเพจ', 
    icon: BookOpen, 
    href: `${ADMIN_BASE}/page-info`,
    comingSoon: true,
  },
  { 
    title: 'ข้อมูลสมาชิก', 
    icon: UserCircle, 
    href: `${ADMIN_BASE}/members`,
    subItems: [
      { title: 'ข้อมูลสมาชิก', href: `${ADMIN_BASE}/members` },
    ]
  },
  { 
    title: 'ข้อมูลพนักงาน', 
    icon: UserCog, 
    href: `${ADMIN_BASE}/staff`,
    subItems: [
      { title: 'ข้อมูลพนักงาน', href: `${ADMIN_BASE}/staff` },
    ]
  },
  { 
    title: 'ข้อมูลเกี่ยวกับเรา', 
    icon: Info, 
    href: `${ADMIN_BASE}/about-us`,
    subItems: [
      { title: 'จัดการเกี่ยวกับเรา', href: `${ADMIN_BASE}/about-us/manage` },
      { title: 'ข้อมูลเกี่ยวกับเรา', href: `${ADMIN_BASE}/about-us` },
      { title: 'รูปภาพเกี่ยวกับเรา', href: `${ADMIN_BASE}/about-us/images` },
    ]
  },
  { 
    title: 'ตั้งค่าระบบ', 
    icon: Settings, 
    href: `${ADMIN_BASE}/settings`,
    subItems: [
      { title: 'ตั้งค่าระบบ', href: `${ADMIN_BASE}/settings` },
    ]
  },
];

/* ─── COMING SOON POPUP ─── */
function ComingSoonPopup({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative bg-[#1e292e] border border-white/10 rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-emerald-400" />
        </div>

        <h3 className="text-white font-bold text-base mb-1">{title}</h3>
        <p className="text-emerald-400 font-semibold text-sm mb-2">กำลังพัฒนาเร็วๆ นี้</p>
        <p className="text-gray-400 text-xs leading-relaxed">
          ฟีเจอร์นี้อยู่ระหว่างการพัฒนา<br />จะเปิดให้ใช้งานในเร็วๆ นี้
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          รับทราบ
        </button>
      </motion.div>
    </div>
  );
}

type AdminUser = { firstName: string; lastName: string; roleLabel: string } | null;

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = React.useState<string[]>([]);
  const [comingSoonItem, setComingSoonItem] = React.useState<string | null>(null);
  const [admin, setAdmin] = React.useState<AdminUser>(null);
  const { showToast } = useToast();

  React.useEffect(() => {
    fetch('/api/auth/admin/me')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.user) {
          setAdmin({
            firstName: data.user.firstName ?? '',
            lastName: data.user.lastName ?? '',
            roleLabel: data.user.roleLabel ?? 'แอดมิน',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    showToast('ออกจากระบบสำเร็จ', 'success');
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  React.useEffect(() => {
    const activeTitles = menuItems
      .filter(item => item.subItems?.some(sub => pathname === sub.href))
      .map(item => item.title);
    
    if (activeTitles.length > 0) {
      setOpenMenus(prev => {
        const newMenus = [...prev];
        let changed = false;
        activeTitles.forEach(title => {
          if (!newMenus.includes(title)) {
            newMenus.push(title);
            changed = true;
          }
        });
        return changed ? newMenus : prev;
      });
    }
  }, [pathname]);

  const visibleItems = menuItems.filter(item => !item.hidden);

  return (
    <>
      <div className="w-72 h-screen bg-[#1e292e] text-gray-300 flex flex-col overflow-y-auto border-r border-white/5 scrollbar-hide">
        {/* Admin Profile */}
        <div className="p-6 flex items-center gap-4 border-b border-white/5">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full border-2 border-gray-600 bg-emerald-600/80 flex items-center justify-center text-white font-black text-lg shrink-0"
              aria-hidden
            >
              {admin ? (admin.firstName?.charAt(0) || admin.lastName?.charAt(0) || 'A').toUpperCase() : '…'}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1e292e]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-white uppercase tracking-wider truncate">
              {admin ? `${admin.firstName} ${admin.lastName}`.trim() || 'แอดมิน' : '…'}
            </h2>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block shrink-0" />
              {admin?.roleLabel ?? 'Online'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4">
          <p className="px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Main Navigation</p>
          <nav className="mt-2">
            {visibleItems.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isOpen = openMenus.includes(item.title);
              const isActive = pathname === item.href || item.subItems?.some(sub => pathname === sub.href);

              /* ── COMING SOON ITEM ── */
              if (item.comingSoon) {
                return (
                  <button
                    key={item.title}
                    onClick={() => setComingSoonItem(item.title)}
                    className="w-full flex items-center justify-between px-6 py-3 transition-colors hover:bg-white/5 hover:text-white group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-400 group-hover:text-emerald-400" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">
                      เร็วๆ นี้
                    </span>
                  </button>
                );
              }

              return (
                <div key={item.title}>
                  {hasSubItems ? (
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className={cn(
                        "w-full flex items-center justify-between px-6 py-3 transition-colors hover:bg-white/5 hover:text-white group",
                        isActive && !isOpen && "bg-white/5 text-white border-l-4 border-emerald-500",
                        isOpen && "text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-gray-400 group-hover:text-emerald-400")} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200 opacity-50", isOpen && "rotate-180")} />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-6 py-3 transition-colors hover:bg-white/5 hover:text-white group",
                        pathname === item.href && "bg-white/10 text-white border-l-4 border-emerald-500"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-emerald-400" : "text-gray-400 group-hover:text-emerald-400")} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </Link>
                  )}

                  <AnimatePresence initial={false}>
                    {hasSubItems && isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden bg-[#1a2327]"
                      >
                        {item.subItems!.map((sub) => (
                          <Link
                            key={sub.title}
                            href={sub.href}
                            className={cn(
                              "flex items-center gap-3 pl-12 pr-6 py-2.5 text-sm transition-colors hover:text-white group",
                              pathname === sub.href ? "text-white bg-white/5" : "text-gray-400"
                            )}
                          >
                            <ChevronRight className={cn("w-3 h-3 transition-transform", pathname === sub.href ? "text-emerald-400" : "text-gray-600 group-hover:text-emerald-400")} />
                            <span>{sub.title}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Admin Section */}
          <div className="mt-8">
            <p className="px-6 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Admin</p>
            <div className="mt-2 space-y-1">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-6 py-3 text-sm font-medium text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* COMING SOON POPUP */}
      <AnimatePresence>
        {comingSoonItem && (
          <ComingSoonPopup
            title={comingSoonItem}
            onClose={() => setComingSoonItem(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
