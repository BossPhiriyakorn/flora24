'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ShoppingBag, 
  Truck, 
  Clock, 
  ShieldCheck, 
  Heart, 
  ChevronRight, 
  ArrowRight,
  MapPin,
  Phone,
  CheckCircle2,
  X,
  Trash2,
  Mail,
  MessageSquare,
  Facebook,
  Music2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import StoreNavbar from '@/components/StoreNavbar';
import { getDriveImageDisplayUrl } from '@/lib/driveImageUrl';

gsap.registerPlugin(ScrollTrigger);

const BRAND_NAME = "FLORA 24/7 EXPRESS";
const STORE_POLL_INTERVAL_MS = 20_000; // อัปเดตข้อมูลหน้าร้านทุก 20 วินาที (เท่ากับ CMS)

const articleFallbackImage = 'https://images.unsplash.com/photo-1490750967868-88df5691cc04?q=80&w=800';
const productFallbackImage = 'https://images.unsplash.com/photo-1596438459194-f275f413d6ff?q=80&w=1000&auto=format&fit=crop';

function mapProduct(p: any) {
  return {
    id: p._id,
    categoryName: p.categoryName ?? '',
    name: p.name,
    description: p.description ?? '',
    price: p.price,
    image: (p.imageUrl ? getDriveImageDisplayUrl(p.imageUrl) : '') || productFallbackImage,
    stock: p.stock ?? 10,
    tags: p.tags ?? [],
  };
}

function mapArticle(a: any) {
  const raw = a.date || (a.createdAt ? new Date(a.createdAt).toISOString().slice(0, 10) : '');
  const dateStr = raw ? (() => { const d = new Date(raw); return isNaN(d.getTime()) ? raw : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }); })() : '';
  const imageUrl = a.featuredImageUrl ? getDriveImageDisplayUrl(a.featuredImageUrl, 800) : '';
  return {
    id: a._id,
    image: imageUrl || articleFallbackImage,
    category: a.category ?? '',
    date: dateStr,
    title: a.title ?? '',
    shortDescription: a.shortDescription ?? '',
  };
}

export default function FlowerStore() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortPriceDropdownOpen, setSortPriceDropdownOpen] = useState(false);
  const [productDetailProduct, setProductDetailProduct] = useState<any>(null);
  const [addToCartQty, setAddToCartQty] = useState(1);
  const [contactInfo, setContactInfo] = useState({
    phone: '', email: '', lineId: '', facebook: '', tiktok: '',
  });

  // ฟิลเตอร์แคตตาล็อก: เรียงราคา + ช่วงราคา
  const [sortPrice, setSortPrice] = useState<'default' | 'asc' | 'desc'>('default');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  // ข้อมูลจาก API
  const [PRODUCTS, setProducts]         = useState<any[]>([]);
  const [HOME_ARTICLES, setHomeArticles] = useState<any[]>([]);
  const [CATEGORIES, setCategories]     = useState<{ _id: string; name: string }[]>([]);
  const [HERO, setHero]                 = useState<{
    heroTagline: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroDescLine1: string;
    heroDescLine2: string;
  } | null>(null);

  // โหลดข้อมูลหน้าร้าน (products ตาม category/sort/ช่วงราคา, categories, articles, contacts, hero)
  const fetchStoreData = React.useCallback(() => {
    fetch('/api/store-hero')
      .then(r => r.json())
      .then(data => { if (data.hero) setHero(data.hero); })
      .catch(() => {});

    fetch('/api/categories')
      .then(r => r.json())
      .then(data => { if (data.categories) setCategories(data.categories); })
      .catch(() => {});

    const categoryParam = activeTab === 'all' ? '' : `&category=${encodeURIComponent(activeTab)}`;
    const sortParam     = sortPrice === 'default' ? '' : `&sortPrice=${sortPrice}`;
    const minParam      = priceMin.trim() ? `&priceMin=${encodeURIComponent(priceMin.trim())}` : '';
    const maxParam      = priceMax.trim() ? `&priceMax=${encodeURIComponent(priceMax.trim())}` : '';
    fetch(`/api/products?limit=50${categoryParam}${sortParam}${minParam}${maxParam}`)
      .then(r => r.json())
      .then(data => {
        if (data.products) setProducts(data.products.map((p: any) => mapProduct(p)));
      })
      .catch(() => {});

    fetch('/api/articles?limit=6')
      .then(r => r.json())
      .then(data => {
        if (data.articles) setHomeArticles(data.articles.map((a: any) => mapArticle(a)));
      })
      .catch(() => {});

    fetch('/api/contacts')
      .then(r => r.json())
      .then(data => {
        if (data.contact) setContactInfo(data.contact);
        else setContactInfo({ phone: '02-123-4567', email: 'contact@flora.co.th', lineId: '@flora_delivery', facebook: '', tiktok: '' });
      })
      .catch(() => {
        setContactInfo({ phone: '02-123-4567', email: 'contact@flora.co.th', lineId: '@flora_delivery', facebook: '', tiktok: '' });
      });
  }, [activeTab, sortPrice, priceMin, priceMax]);

  // โหลด cart: ถ้า login ใช้ API (sync ข้ามอุปกรณ์); ไม่ login ใช้ localStorage
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        setIsLoggedIn(r.ok);
        if (r.ok) {
          return fetch('/api/cart').then(res => res.json()).then((data: { items?: any[] }) => {
            const serverItems = Array.isArray(data?.items) ? data.items : [];
            if (serverItems.length > 0) {
              setCart(serverItems);
              try { localStorage.setItem('flora_cart', JSON.stringify(serverItems)); } catch { /* ignore */ }
              return;
            }
            try {
              const saved = localStorage.getItem('flora_cart');
              if (saved) {
                const parsed = JSON.parse(saved);
                const merged = Array.isArray(parsed)
                  ? parsed.map((item: any) => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) }))
                  : [];
                if (merged.length > 0) {
                  fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: merged }) }).catch(() => {});
                  setCart(merged);
                  localStorage.removeItem('flora_cart');
                }
              }
            } catch { /* ignore */ }
          });
        }
        try {
          const saved = localStorage.getItem('flora_cart');
          if (saved) {
            const parsed = JSON.parse(saved);
            const normalized = Array.isArray(parsed)
              ? parsed.map((item: any) => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) }))
              : [];
            setCart(normalized);
          }
        } catch { /* ignore */ }
      })
      .catch(() => {
        try {
          const saved = localStorage.getItem('flora_cart');
          if (saved) {
            const parsed = JSON.parse(saved);
            const normalized = Array.isArray(parsed)
              ? parsed.map((item: any) => ({ ...item, quantity: Math.max(1, Number(item.quantity) || 1) }))
              : [];
            setCart(normalized);
          }
        } catch { /* ignore */ }
      });
    fetchStoreData();
  }, [fetchStoreData]);

  // เมื่อมาจากหน้าอื่นโดยกด Cart (?openCart=1) ให้เปิดตะกร้าแล้วลบ query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('openCart') === '1') {
      setIsCartOpen(true);
      router.replace('/', { scroll: false });
    }
  }, [router]);

  // อัปเดตข้อมูลหน้าร้านเป็นระยะทุก 20 วินาที (เหมือน CMS)
  useEffect(() => {
    const interval = setInterval(fetchStoreData, STORE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStoreData]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero Animations
      gsap.from('.hero-content > *', {
        y: 50,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: 'power4.out'
      });

      // Scroll Reveals
      gsap.utils.toArray('.reveal').forEach((elem: any) => {
        gsap.from(elem, {
          scrollTrigger: {
            trigger: elem,
            start: 'top 85%',
          },
          y: 30,
          opacity: 0,
          duration: 1,
          ease: 'power3.out'
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // สินค้าถูกดึงจาก API ตาม category/sort/ช่วงราคาอยู่แล้ว
  const filteredProducts = PRODUCTS;

  const scrollToCatalog = (category: string = 'all') => {
    setActiveTab(category);
    const catalog = document.getElementById('catalog');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const addToCart = (product: any, quantity: number = 1) => {
    const qty = Math.max(1, Math.min(99, quantity));
    setCart(prev => {
      const existingIdx = prev.findIndex((item: any) => item.id === product.id);
      const next =
        existingIdx >= 0
          ? prev.map((item: any, i) =>
              i === existingIdx ? { ...item, quantity: Math.min(99, (item.quantity ?? 1) + qty) } : item
            )
          : [...prev, { ...product, quantity: qty }];
      localStorage.setItem('flora_cart', JSON.stringify(next));
      fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
    setToast(qty > 1 ? `เพิ่ม "${product.name}" ${qty} ชิ้นลงตะกร้าแล้ว` : `เพิ่ม "${product.name}" ลงในตะกร้าแล้ว`);
    setTimeout(() => setToast(null), 3000);
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty < 1) {
      removeFromCart(index);
      return;
    }
    const qty = Math.min(99, newQty);
    setCart(prev => {
      const next = prev.map((item: any, i) => (i === index ? { ...item, quantity: qty } : item));
      localStorage.setItem('flora_cart', JSON.stringify(next));
      fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => {
      const next = prev.filter((_, i) => i !== index);
      localStorage.setItem('flora_cart', JSON.stringify(next));
      fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) }).catch(() => {});
      return next;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[200] bg-[#E11D48] text-white px-8 py-4 rounded-full shadow-2xl font-bold text-sm flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP รายละเอียดสินค้า */}
      <AnimatePresence>
        {productDetailProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductDetailProduct(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[140]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl z-[150] flex flex-col"
            >
              <button
                onClick={() => setProductDetailProduct(null)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative aspect-[4/3] w-full shrink-0 bg-black/40">
                <Image
                  src={productDetailProduct.image}
                  alt={productDetailProduct.name}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  sizes="(max-width: 512px) 100vw, 512px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
              </div>
              <div className="p-5 md:p-6 flex flex-col flex-1 min-h-0 overflow-y-auto">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{productDetailProduct.name}</h3>
                <p className="text-[#E11D48] font-black text-lg md:text-xl mb-4">฿{productDetailProduct.price.toLocaleString()}</p>
                {productDetailProduct.description && (
                  <p className="text-white/70 text-sm leading-relaxed mb-4 whitespace-pre-line">{productDetailProduct.description}</p>
                )}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-white/60 text-sm">จำนวน</span>
                  <div className="flex items-center rounded-xl border border-white/20 overflow-hidden bg-white/5">
                    <button
                      type="button"
                      onClick={() => setAddToCartQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                      aria-label="ลดจำนวน"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-bold text-white tabular-nums">{addToCartQty}</span>
                    <button
                      type="button"
                      onClick={() => setAddToCartQty(q => Math.min(99, (productDetailProduct.stock ?? 99), q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
                      aria-label="เพิ่มจำนวน"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => {
                    addToCart(productDetailProduct, addToCartQty);
                    setProductDetailProduct(null);
                    setAddToCartQty(1);
                  }}
                  className="w-full py-4 rounded-xl bg-[#E11D48] hover:bg-[#c9183d] text-white font-black tracking-widest uppercase text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  ยืนยัน (ใส่รถเข็น)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CART SIDEBAR */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-white/10 z-[160] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black tracking-tighter italic">YOUR CART</h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                {cart.length === 0 ? (
                  <div className="text-center py-20 opacity-40">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-mono text-xs uppercase tracking-widest">ตะกร้าว่างเปล่า</p>
                  </div>
                ) : (
                  (() => {
                    // จัดกลุ่มตาม categoryName จริงจาก API (product มี categoryName ไม่มี category)
                    const categories = Array.from(new Set(cart.map((item: any) => item.categoryName ?? 'อื่นๆ')));
                    return categories.map((catName) => {
                      const itemsInCat = cart
                        .map((item: any, idx: number) => ({ item, idx }))
                        .filter(({ item }) => (item.categoryName ?? 'อื่นๆ') === catName);
                      if (itemsInCat.length === 0) return null;
                      return (
                        <div key={catName} className="space-y-4">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
                              {catName}
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                          </div>
                          {itemsInCat.map(({ item, idx }) => {
                            const qty = item.quantity ?? 1;
                            return (
                              <motion.div
                                key={`${catName}-${idx}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group"
                              >
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                  <Image src={item.image} alt={item.name} fill className="object-cover" referrerPolicy="no-referrer" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-sm mb-1">{item.name}</h4>
                                  <p className="text-white/50 text-xs mb-1">×{qty}</p>
                                  <p className="text-[#E11D48] font-black text-sm">฿{(item.price * qty).toLocaleString()}</p>
                                </div>
                                <div className="flex flex-col items-center gap-0.5 shrink-0">
                                  <div className="flex items-center rounded-lg border border-white/20 overflow-hidden bg-white/5">
                                    <button
                                      type="button"
                                      onClick={() => updateCartQuantity(idx, qty - 1)}
                                      className="w-7 h-7 flex items-center justify-center text-white/80 hover:bg-white/10 text-sm"
                                      aria-label="ลด"
                                    >−</button>
                                    <span className="w-6 text-center text-xs font-bold tabular-nums">{qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateCartQuantity(idx, qty + 1)}
                                      className="w-7 h-7 flex items-center justify-center text-white/80 hover:bg-white/10 text-sm"
                                      aria-label="เพิ่ม"
                                    >+</button>
                                  </div>
                                  <button
                                    onClick={() => removeFromCart(idx)}
                                    className="p-1.5 text-white/20 hover:text-red-500 transition-colors"
                                    aria-label="ลบออก"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="flex justify-between items-end mb-8">
                  <span className="text-white/40 font-mono text-xs uppercase tracking-widest">Total Amount</span>
                  <span className="text-3xl font-black tracking-tighter">฿{cartTotal.toLocaleString()}</span>
                </div>
                <button
                  disabled={cartItemCount === 0}
                  onClick={() => { setIsCartOpen(false); router.push('/checkout'); }}
                  className="w-full bg-[#E11D48] disabled:bg-white/10 disabled:text-white/20 text-white py-6 rounded-2xl font-black tracking-widest uppercase text-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  ดำเนินการชำระเงิน →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <StoreNavbar cartCount={cartItemCount} onCartClick={() => setIsCartOpen(true)} />

      {/* HERO SECTION */}
      <section className="relative min-h-[60dvh] w-full flex items-center justify-center overflow-hidden pb-16">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1596438459194-f275f413d6ff?q=80&w=2070&auto=format&fit=crop"
            alt="Midnight Flowers"
            fill
            className="object-cover opacity-60 scale-105 ken-burns"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#0A0A0A]" />
        </div>

        {/* pt รองรับ navbar + ระยะห่าง — ข้อความจาก CMS ตั้งค่า > หน้าแรก */}
        <div className="relative z-10 hero-content text-center max-w-5xl px-6 pt-28 md:pt-24">
          <span className="inline-block text-[#E11D48] font-mono text-xs tracking-[0.4em] uppercase mb-6">
            {HERO?.heroTagline ?? 'Premium 24/7 Floral Service'}
          </span>
          <h1 className="text-5xl md:text-[10vw] font-black tracking-tighter leading-[0.85] mb-8">
            {HERO?.heroTitleLine1 ?? 'BLOOMING'} <br />
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-[#E11D48] to-white">
              {HERO?.heroTitleLine2 ?? 'EVERY SECOND.'}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            {HERO?.heroDescLine1 ?? 'สัมผัสความงามที่ไม่เคยหลับใหล จัดส่งดอกไม้ด่วนทั่วกรุงเทพฯ ตลอด 24 ชั่วโมง'} <br />
            <span className="text-white font-medium italic">
              {HERO?.heroDescLine2 ?? 'เริ่มต้น 990 บาท จัดส่งฟรีภายใน 2 ชม.'}
            </span>
          </p>
        </div>
      </section>

      {/* CATALOG */}
      <section id="catalog" className="py-10 md:py-16 px-4 sm:px-6 md:px-20 bg-[#0A0A0A] overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full min-w-0">
          {/* บรรทัดที่ 1: CATALOG (ซ้าย) + dropdown ทั้งหมด ชิดขวา */}
          <div className={`reveal flex flex-row flex-nowrap items-center justify-between gap-3 mb-4 ${categoryDropdownOpen ? 'relative z-[100]' : ''}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter shrink-0">CATALOG</h2>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => { setCategoryDropdownOpen((o) => !o); setSortPriceDropdownOpen(false); }}
                onBlur={() => setTimeout(() => setCategoryDropdownOpen(false), 150)}
                className="relative flex items-center bg-[#0A0A0A] border border-white/10 text-white text-xs sm:text-[11px] font-black tracking-widest uppercase pl-4 pr-10 py-3 rounded-full cursor-pointer hover:border-white/20 focus:outline-none focus:border-[#E11D48] transition-colors min-w-[120px] sm:min-w-[140px]"
              >
                <span className="flex-1 truncate text-center">{activeTab === 'all' ? 'ทั้งหมด' : activeTab}</span>
                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 shrink-0 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {categoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-full min-w-[160px] py-1 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => { setActiveTab('all'); setCategoryDropdownOpen(false); }}
                      className={`w-full text-left px-5 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${activeTab === 'all' ? 'bg-[#E11D48]/20 text-[#E11D48]' : 'text-white hover:bg-white/5'}`}
                    >
                      ทั้งหมด
                    </button>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => { setActiveTab(cat.name); setCategoryDropdownOpen(false); }}
                        className={`w-full text-left px-5 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${activeTab === cat.name ? 'bg-[#E11D48]/20 text-[#E11D48]' : 'text-white hover:bg-white/5'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* บรรทัดที่ 2: ฟิลเตอร์ (เรียงตาม + ช่วงราคา) ขนาดใหญ่ พอดีขอบหน้าหลัง */}
          <div className={`reveal flex flex-nowrap items-center justify-between sm:justify-end sm:gap-4 w-full max-w-full min-w-0 gap-2 mb-8 ${sortPriceDropdownOpen ? 'relative z-[100]' : ''}`}>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => { setSortPriceDropdownOpen((o) => !o); setCategoryDropdownOpen(false); }}
                onBlur={() => setTimeout(() => setSortPriceDropdownOpen(false), 150)}
                className="flex items-center bg-[#0A0A0A] border border-white/10 text-white text-xs sm:text-[11px] font-black tracking-widest uppercase pl-4 pr-9 py-3 sm:py-3.5 rounded-full cursor-pointer hover:border-white/20 focus:outline-none focus:border-[#E11D48] transition-colors min-w-[100px] sm:min-w-[120px]"
              >
                <span className="truncate">
                  {sortPrice === 'default' ? 'เรียงตาม' : sortPrice === 'asc' ? 'ราคาต่ำ→สูง' : 'ราคาสูง→ต่ำ'}
                </span>
                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 shrink-0 transition-transform ${sortPriceDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {sortPriceDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 min-w-[140px] py-1 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden"
                  >
                    <button type="button" onClick={() => { setSortPrice('default'); setSortPriceDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${sortPrice === 'default' ? 'bg-[#E11D48]/20 text-[#E11D48]' : 'text-white hover:bg-white/5'}`}>ตามลำดับ</button>
                    <button type="button" onClick={() => { setSortPrice('asc'); setSortPriceDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${sortPrice === 'asc' ? 'bg-[#E11D48]/20 text-[#E11D48]' : 'text-white hover:bg-white/5'}`}>ราคาต่ำไปสูง</button>
                    <button type="button" onClick={() => { setSortPrice('desc'); setSortPriceDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-[11px] font-bold tracking-widest uppercase transition-colors ${sortPrice === 'desc' ? 'bg-[#E11D48]/20 text-[#E11D48]' : 'text-white hover:bg-white/5'}`}>ราคาสูงไปต่ำ</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="จาก"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-16 sm:w-20 md:w-24 min-w-0 bg-[#0A0A0A] border border-white/10 text-white text-xs sm:text-sm font-medium px-3 py-3 rounded-xl placeholder:text-white/40 focus:outline-none focus:border-[#E11D48] shrink-0"
            />
            <span className="text-white/40 shrink-0 text-sm">–</span>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="ถึง"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-16 sm:w-20 md:w-24 min-w-0 bg-[#0A0A0A] border border-white/10 text-white text-xs sm:text-sm font-medium px-3 py-3 rounded-xl placeholder:text-white/40 focus:outline-none focus:border-[#E11D48] shrink-0"
            />
            <button
              type="button"
              onClick={() => fetchStoreData()}
              className="bg-[#E11D48] hover:bg-[#E11D48]/90 text-white text-xs sm:text-[11px] font-black tracking-widest uppercase px-4 py-3 rounded-xl transition-colors shrink-0 whitespace-nowrap"
            >
              แสดงผล
            </button>
          </div>

          {/* PRODUCT GRID */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="group"
                >
                  <div className="relative aspect-[3/4] rounded-2xl md:rounded-[2rem] overflow-hidden mb-2 md:mb-4 border border-white/5">
                    <Image 
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                    <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6">
                      <div className="flex gap-1 mb-1.5 md:mb-3 flex-wrap">
                        {product.tags.slice(0, 1).map((tag: string) => (
                          <span key={tag} className="text-[8px] md:text-[9px] font-bold bg-white/10 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-sm md:text-xl font-bold tracking-tight mb-1 group-hover:text-[#E11D48] transition-colors line-clamp-2">{product.name}</h3>
                      <p className="text-sm md:text-lg font-black tracking-tighter text-white">฿{product.price.toLocaleString()}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => { setProductDetailProduct(product); setAddToCartQty(1); }}
                    className="w-full bg-white/5 hover:bg-[#E11D48] border border-white/10 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-black tracking-widest uppercase text-[9px] md:text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    สั่งซื้อ
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-12 md:py-24 px-4 md:px-20 bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16 reveal">
            <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-2 md:mb-4">THE 24/7 SLA</h2>
            <p className="text-white/40 font-mono text-[10px] md:text-xs tracking-widest uppercase">Our commitment to speed & quality</p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-12 relative">
            {/* Connector Lines */}
            <div className="absolute top-8 md:top-1/2 left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
            
            <SlaStep 
              num="01" 
              title="เลือกสินค้า" 
              subtitle="Select" 
              desc="เลือกสินค้าที่ต้องการจากคลังสินค้าแบบ Real-time ของเรา"
              icon={<ShoppingBag className="w-8 h-8" />}
            />
            <SlaStep 
              num="02" 
              title="จัดช่อทันที" 
              subtitle="Crafted Instantly" 
              desc="ทีมงานมืออาชีพเริ่มจัดดอกไม้ทันทีที่ได้รับคำสั่งซื้อ"
              icon={<Heart className="w-8 h-8" />}
            />
            <SlaStep 
              num="03" 
              title="ส่งถึงมือใน 2 ชม." 
              subtitle="Delivered in 2 Hrs" 
              desc="Rider ของเราจะนำส่งถึงมือคุณภายในเวลาที่กำหนดทั่ว กทม."
              icon={<Truck className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* ARTICLES SECTION */}
      <section className="py-12 md:py-20 px-4 md:px-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-end justify-between mb-8 md:mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter">บทความ</h2>
              <p className="text-white/40 font-mono text-[10px] md:text-xs tracking-widest uppercase mt-1">Articles & Tips</p>
            </div>
            <Link
              href="/articles"
              className="flex items-center gap-2 text-[10px] md:text-xs font-black tracking-widest uppercase border border-white/10 px-4 md:px-6 py-2.5 md:py-3 rounded-full hover:bg-white/5 transition-colors shrink-0"
            >
              ดูทั้งหมด
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Article Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {HOME_ARTICLES.map((article, index) => (
              <Link key={article.id} href={`/articles/${article.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/3] rounded-xl md:rounded-2xl overflow-hidden mb-2 md:mb-3">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-2 left-2 md:top-3 md:left-3 text-[8px] md:text-[10px] font-black tracking-widest uppercase bg-[#E11D48] text-white px-2 py-0.5 rounded-full">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-[10px] md:text-xs text-white/40 font-mono mb-1">{article.date}</p>
                  <h3 className="text-xs md:text-sm font-bold leading-tight group-hover:text-[#E11D48] transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.shortDescription && (
                    <p className="text-[10px] md:text-xs text-white/50 mt-1 line-clamp-2">
                      {article.shortDescription}
                    </p>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="support" className="py-32 px-6 md:px-20 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-20">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-[#E11D48] p-2 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="font-black tracking-tighter text-3xl italic">{BRAND_NAME}</span>
              </div>
              <p className="text-white/40 text-lg max-w-md leading-relaxed mb-12 font-light">
                เราคือผู้นำด้านการจัดส่งดอกไม้ด่วน 24 ชั่วโมงในกรุงเทพฯ ด้วยความประณีตและความเร็วที่เหนือกว่า เพื่อทุกช่วงเวลาสำคัญของคุณ
              </p>
              <button
                onClick={() => setIsContactOpen(true)}
                className="magnetic-button bg-[#E11D48] text-white px-10 py-5 rounded-full font-black tracking-widest uppercase flex items-center gap-4 group"
              >
                <Phone className="w-5 h-5" />
                Contact 24/7 Support
              </button>
            </div>

          </div>

        </div>
      </footer>

      {/* CONTACT MODAL */}
      <AnimatePresence>
        {isContactOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsContactOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-7 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black tracking-tight">ช่องทางติดต่อ</h3>
                  <p className="text-white/40 text-xs mt-1">เลือกช่องทางที่สะดวกกดได้เลย</p>
                </div>
                <button
                  onClick={() => setIsContactOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="space-y-3">
                {contactInfo.phone && (
                  <a
                    href={`tel:${contactInfo.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#E11D48]/10 hover:border-[#E11D48]/40 transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#E11D48]/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#E11D48] transition-colors">
                      <Phone className="w-5 h-5 text-[#E11D48] group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">โทรศัพท์</p>
                      <p className="text-sm font-bold">{contactInfo.phone}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-[#E11D48]" />
                  </a>
                )}

                {contactInfo.email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#E11D48]/10 hover:border-[#E11D48]/40 transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#E11D48]/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#E11D48] transition-colors">
                      <Mail className="w-5 h-5 text-[#E11D48] group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">อีเมล</p>
                      <p className="text-sm font-bold">{contactInfo.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-[#E11D48]" />
                  </a>
                )}

                {contactInfo.lineId && (
                  <a
                    href={`https://line.me/ti/p/~${contactInfo.lineId.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#E11D48]/10 hover:border-[#E11D48]/40 transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#E11D48]/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#E11D48] transition-colors">
                      <MessageSquare className="w-5 h-5 text-[#E11D48] group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">LINE</p>
                      <p className="text-sm font-bold">{contactInfo.lineId}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-[#E11D48]" />
                  </a>
                )}

                {contactInfo.facebook && (
                  <a
                    href={contactInfo.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#E11D48]/10 hover:border-[#E11D48]/40 transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#E11D48]/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#E11D48] transition-colors">
                      <Facebook className="w-5 h-5 text-[#E11D48] group-hover:text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Facebook</p>
                      <p className="text-sm font-bold truncate">{contactInfo.facebook.replace('https://', '')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 ml-auto shrink-0 group-hover:text-[#E11D48]" />
                  </a>
                )}

                {contactInfo.tiktok && (
                  <a
                    href={contactInfo.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#E11D48]/10 hover:border-[#E11D48]/40 transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#E11D48]/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#E11D48] transition-colors">
                      <Music2 className="w-5 h-5 text-[#E11D48] group-hover:text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">TikTok</p>
                      <p className="text-sm font-bold truncate">{contactInfo.tiktok.replace('https://', '')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 ml-auto shrink-0 group-hover:text-[#E11D48]" />
                  </a>
                )}

                {!contactInfo.phone && !contactInfo.email && !contactInfo.lineId && !contactInfo.facebook && !contactInfo.tiktok && (
                  <p className="text-center text-white/40 text-sm py-6">ยังไม่มีข้อมูลช่องทางติดต่อ</p>
                )}
              </div>

              <p className="text-center text-white/20 text-xs mt-5">
                เปิดให้บริการ 24 ชั่วโมง ทุกวัน
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SlaStep({ num, title, subtitle, desc, icon }: { num: string, title: string, subtitle: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="reveal relative z-10 flex flex-col items-center text-center group">
      {/* icon box */}
      <div className="w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 md:mb-8 group-hover:bg-[#E11D48] group-hover:border-[#E11D48] transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
        <div className="text-white scale-75 md:scale-100 transition-colors">
          {icon}
        </div>
      </div>
      <span className="text-[#E11D48] font-mono text-[9px] md:text-xs tracking-widest mb-1 md:mb-2">STEP {num}</span>
      <h3 className="text-sm md:text-2xl font-bold tracking-tight mb-1 md:mb-4 leading-tight">
        {title}
        <br />
        <span className="text-white/40 italic text-xs md:text-lg font-light hidden md:inline">{subtitle}</span>
      </h3>
      <p className="hidden md:block text-sm text-white/40 leading-relaxed max-w-[200px]">{desc}</p>
    </div>
  );
}
