'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2 } from 'lucide-react';

export default function PopupManagementPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-slate-500">
      <Lock className="w-12 h-12 text-slate-300" />
      <p className="font-medium">ฟีเจอร์ปิดใช้งานชั่วคราว</p>
      <p className="flex items-center gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        กำลังนำคุณกลับ...
      </p>
    </div>
  );
}
