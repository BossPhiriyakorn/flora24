'use client';

import { usePathname } from 'next/navigation';
import StoreNavbar from './StoreNavbar';

// หน้าที่ไม่ต้องการ navbar (หน้า auth — clean layout)
const HIDE_NAVBAR_PATHS = ['/', '/login', '/register', '/register/line'];

export default function ConditionalNavbar() {
  const pathname = usePathname();
  if (HIDE_NAVBAR_PATHS.includes(pathname)) return null;
  return <StoreNavbar />;
}
