export type NotificationPermission = 'granted' | 'denied' | 'default';

/** ตรวจสอบว่า browser รองรับ Notification API หรือไม่ */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/** ดึงสถานะ permission ปัจจุบัน */
export function getPermissionStatus(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission as NotificationPermission;
}

/** ขอ permission จากผู้ใช้ — returns สถานะที่ได้ */
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

export interface ShowNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;        // ป้องกัน duplicate notification เดียวกัน
  onClick?: () => void;
}

/** แสดง browser notification (ต้องมี permission granted แล้ว) */
export function showBrowserNotification(opts: ShowNotificationOptions): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;

  const n = new Notification(opts.title, {
    body: opts.body,
    icon: opts.icon ?? '/favicon.ico',
    tag: opts.tag,
    requireInteraction: false,
  });

  if (opts.onClick) {
    n.onclick = () => {
      window.focus();
      opts.onClick!();
      n.close();
    };
  }

  // ปิดอัตโนมัติหลัง 6 วินาที
  setTimeout(() => n.close(), 6000);
  return true;
}
