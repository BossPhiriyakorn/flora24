'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, X, Menu, UserCircle, BookOpen, Home, Package, LogIn, LogOut,
} from 'lucide-react';

const BRAND_NAME = 'FLORA 24/7 EXPRESS';

const CART_STORAGE_KEY = 'flora_cart';

function getCartCountFromStorage(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.reduce((s, i: any) => s + (Number(i?.quantity) || 1), 0) : 0;
  } catch {
    return 0;
  }
}

type Props = {
  cartCount?: number;
  onCartClick?: () => void;
};

export default function StoreNavbar({ cartCount, onCartClick }: Props) {
  const [scrolled, setScrolled]   = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [localCartCount, setLocalCartCount] = useState(0);
  const [serverCartCount, setServerCartCount] = useState(0);
  const pathname = usePathname();
  const router   = useRouter();
  const isHome   = pathname === '/';

  useEffect(() => {
    setLocalCartCount(getCartCountFromStorage());
  }, [pathname]);

  // ตรวจสอบ login และโหลดจำนวนตะกร้าจาก API เมื่อ login (sync ข้ามอุปกรณ์)
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        setIsLoggedIn(r.ok);
        if (r.ok) {
          return fetch('/api/cart').then(res => res.json()).then((data: { items?: any[] }) => {
            const items = Array.isArray(data?.items) ? data.items : [];
            setServerCartCount(items.reduce((s, i: any) => s + (Number(i?.quantity) || 1), 0));
          });
        }
        setServerCartCount(0);
      })
      .catch(() => { setIsLoggedIn(false); setServerCartCount(0); });
  }, [pathname]);

  const displayCartCount =
    cartCount !== undefined && cartCount !== null ? cartCount
    : isLoggedIn ? serverCartCount
    : localCartCount;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsLoggedIn(false);
    setIsMenuOpen(false);
    router.push('/login');
    router.refresh();
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleCatalogClick() {
    if (isHome) {
      const el = document.getElementById('catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#catalog');
    }
  }

  function handleSlaClick() {
    if (isHome) {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#how-it-works');
    }
  }

  function handleSupportClick() {
    if (isHome) {
      const el = document.getElementById('support');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#support');
    }
  }

  return (
    <>
      {/* NAVBAR */}
      <nav className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl transition-all duration-500 ${
        scrolled ? 'bg-black/80 backdrop-blur-xl border border-white/10 py-3 px-5 md:px-8 rounded-full shadow-2xl' : 'py-6 px-4'
      }`}>
        <div className="flex items-center justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 md:gap-3">
            <div className="bg-[#E11D48] p-2 rounded-xl shrink-0">
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="font-black tracking-tighter text-sm md:text-2xl italic leading-tight">
              {BRAND_NAME}
            </span>
          </Link>

          {/* DESKTOP LINKS */}
          <div className="hidden md:flex items-center gap-10 text-[11px] font-bold tracking-[0.2em] uppercase">
            <button onClick={handleCatalogClick} className="link-hover opacity-70 hover:opacity-100 transition-opacity">
              Catalog
            </button>
            <button onClick={handleSlaClick} className="link-hover opacity-70 hover:opacity-100 transition-opacity">
              24/7 SLA
            </button>
            <button onClick={handleSupportClick} className="link-hover opacity-70 hover:opacity-100 transition-opacity">
              Support
            </button>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={onCartClick ?? (() => router.push('/?openCart=1'))}
              className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-[#E11D48] hover:text-white transition-all"
            >
              Cart ({displayCartCount})
            </button>
            {/* HAMBURGER MENU */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              className="relative p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5"
              aria-label="เมนู"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* DROPDOWN MENU */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <Home className="w-4 h-4 text-[#E11D48] shrink-0" />
                หน้าแรก
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <UserCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
                โปรไฟล์
              </Link>
              <Link
                href="/articles"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <BookOpen className="w-4 h-4 text-[#E11D48] shrink-0" />
                บทความ
              </Link>
              <Link
                href="/track"
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-white/5 transition-colors border-b border-white/5"
              >
                <Package className="w-4 h-4 text-[#E11D48] shrink-0" />
                ติดตามสินค้า
              </Link>
              {/* Auth actions */}
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-red-500/10 transition-colors text-red-400"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  ออกจากระบบ
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold hover:bg-white/5 transition-colors text-[#E11D48]"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  เข้าสู่ระบบ
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
