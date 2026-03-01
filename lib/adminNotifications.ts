import type { Db } from 'mongodb';
import type { AdminNotificationDoc, AdminNotificationType } from '@/lib/mongodb';

/**
 * สร้างการแจ้งเตือนแอดมินใน collection admin_notifications
 * ใช้จาก API ตอนสร้าง order, admin login, บทความใหม่, ยกเลิกออเดอร์ ฯลฯ
 */
export async function createAdminNotification(
  db: Db,
  payload: {
    type: AdminNotificationType;
    title: string;
    body: string;
    /** ชื่อคนทำ (แอดมิน/ลูกค้า/ผู้สมัคร) */
    actorName?: string;
    refType?: 'order' | 'article' | 'staff' | 'product' | 'user';
    refId?: string;
  }
): Promise<void> {
  const doc: AdminNotificationDoc = {
    type:      payload.type,
    title:     payload.title,
    body:      payload.body,
    actorName: payload.actorName,
    refType:   payload.refType,
    refId:     payload.refId,
    read:      false,
    createdAt: new Date(),
  };
  await db.collection<AdminNotificationDoc>('admin_notifications').insertOne(doc);
}
