/* Layout สำหรับหน้า auth ของ user — ใช้ Prompt (ENG) + Kanit (ไทย) จาก root */
export default function UserAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] antialiased selection:bg-[#E11D48] selection:text-white min-h-screen font-sans">
      {children}
    </div>
  );
}
