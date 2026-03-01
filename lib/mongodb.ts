import dns from 'dns';
import tls from 'tls';
import { MongoClient, Db, ObjectId } from 'mongodb';

export { ObjectId };

// เลือกใช้ Google DNS เฉพาะเมื่อตั้งค่า (dev/บาง ISP ที่ block SRV) — ตอน Deploy ไม่ต้องตั้ง จะใช้ DNS ของเซิร์ฟเวอร์
const useGoogleDns =
  process.env.MONGODB_USE_GOOGLE_DNS === '1' || process.env.MONGODB_USE_GOOGLE_DNS === 'true';
if (useGoogleDns) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}

const uri    = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB_NAME ?? 'flora_db';

if (!uri) throw new Error('MONGODB_URI is not set in environment variables');

let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// ป้องกัน ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR (autoSelectFamily + TLS บน Windows/standalone)
// โหมด development ใช้ tlsAllowInvalidCertificates เป็นค่าเริ่มต้น (ยกเลิกได้ด้วย MONGODB_TLS_INSECURE=0)
const tlsInsecure =
  process.env.MONGODB_TLS_INSECURE === '1' ||
  process.env.MONGODB_TLS_INSECURE === 'true' ||
  (process.env.NODE_ENV === 'development' && process.env.MONGODB_TLS_INSECURE !== '0');

// Node.js 18+ / OpenSSL 3.x บน Windows: TLS handshake ล้มเหลวด้วย ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR
// ต้อง set ก่อนสร้าง MongoClient ใด ๆ — ใช้ใน development/tlsInsecure เท่านั้น
if (tlsInsecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Workaround สำหรับ Windows + OpenSSL 3.x: บังคับ TLS 1.2 + ลด security level
// แก้ ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR ตอน handshake กับ MongoDB Atlas
const secureContext = tlsInsecure
  ? tls.createSecureContext({
      minVersion: 'TLSv1.2',
      // SECLEVEL=0: อนุญาต cipher suite ที่ OpenSSL 3.x ปิดไว้ by default (แก้ alert 80)
      ciphers: 'DEFAULT@SECLEVEL=0',
    })
  : undefined;

const MONGO_OPTIONS: import('mongodb').MongoClientOptions = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS:         30000,
  socketTimeoutMS:          30000,
  autoSelectFamily:         false,
  tls:                      true,
  ...(tlsInsecure ? {
    tlsAllowInvalidCertificates: true as const,
    tlsAllowInvalidHostnames:    true as const,
  } : {}),
  ...(secureContext ? { secureContext } : {}),
};

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(uri, MONGO_OPTIONS);
  const p = client.connect();
  // ถ้า connect ล้มเหลวให้ reset cache ทันที (ป้องกัน stale rejected promise)
  p.catch(() => {
    if (process.env.NODE_ENV === 'development') {
      global._mongoClientPromise = undefined;
    }
  });
  return p;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = createClientPromise();
}

export async function connectDB(): Promise<Db> {
  // ถ้า promise fail ให้สร้างใหม่
  if (process.env.NODE_ENV === 'development' && !global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
    clientPromise = global._mongoClientPromise;
  }
  const client = await clientPromise;
  return client.db(dbName);
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: users
   ผู้ใช้ที่สมัครผ่านอีเมล หรือ LINE Login
══════════════════════════════════════════════════════════ */
export interface UserDoc {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone?: string;
  passwordHash?: string;         // email provider เท่านั้น
  lineUserId?: string;           // LINE provider เท่านั้น
  lineDisplayName?: string;
  linePictureUrl?: string;
  provider: 'email' | 'line' | 'both';
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt?: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: pending_registrations
   รอยืนยัน OTP ก่อนสร้าง user (สมัครด้วยอีเมล)
══════════════════════════════════════════════════════════ */
export interface PendingRegistrationDoc {
  _id?: ObjectId;
  email: string;                 // ลดตัวพิมพ์เล็กแล้ว
  otpHash: string;               // bcrypt ของ OTP
  firstName: string;
  lastName: string;
  nickname: string;
  passwordHash: string;
  expiresAt: Date;
  lastSentAt?: Date;             // สำหรับ cooldown
  attempts?: number;             // จำนวนครั้งที่ใส่ OTP ผิด
  createdAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: staff
   พนักงาน/แอดมิน CMS — สร้างจาก seed script เท่านั้น
══════════════════════════════════════════════════════════ */
export interface StaffDoc {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'editor';
  createdAt: Date;
  lastLogin?: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: site_settings
   ข้อกำหนด/นโยบาย จาก CMS (การตั้งค่าทั่วไป) — 1 document
══════════════════════════════════════════════════════════ */
export interface SiteSettingsDoc {
  _id?: ObjectId;
  termsContent: string;
  privacyContent: string;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: categories
   หมวดหมู่สินค้า — จัดการโดย Admin CMS
══════════════════════════════════════════════════════════ */
export interface CategoryDoc {
  _id?: ObjectId;
  name: string;
  slug: string;                  // URL-friendly name (สร้างจาก name อัตโนมัติ)
  createdAt: Date;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: products
   สินค้าร้านดอกไม้ — จัดการโดย Admin CMS
══════════════════════════════════════════════════════════ */
export interface ProductDoc {
  _id?: ObjectId;
  name: string;
  description: string;
  price: number;
  categoryId: ObjectId;          // อ้างอิง categories._id
  categoryName: string;          // denormalized สำหรับ display เร็ว
  imageUrl?: string;
  status: 'active' | 'hidden';   // 'active'=แสดง, 'hidden'=ไม่แสดง
  stock?: number;
  tags?: string[];
  order?: number;                // ลำดับแสดงในหน้าร้าน (น้อย = แสดงก่อน)
  createdAt: Date;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: orders
   คำสั่งซื้อ — สร้างจาก checkout page, จัดการโดย Admin
══════════════════════════════════════════════════════════ */
export interface OrderItemDoc {
  productId?: string;            // อาจไม่มีถ้าเป็น custom
  name: string;
  qty: number;
  price: number;
  imageUrl?: string;
}

export interface ShippingInfoDoc {
  trackingLink?: string;
  courierContact?: string;
  note?: string;
  shippedAt?: Date;
}

export type OrderStatus = 'pending' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';
export type OrderPaymentMethod = 'qr' | 'credit_card';
export type OrderPaymentStatus = 'pending' | 'verified' | 'failed';

export interface OrderDoc {
  _id?: ObjectId;
  orderId: string;               // "ORD-1234567890" — readable ID แสดงผู้ใช้
  userId: ObjectId;              // อ้างอิง users._id
  customerName: string;          // denormalized
  customerPhone: string;
  customerEmail: string;
  items: OrderItemDoc[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  // ─── ที่อยู่จัดส่ง ───
  address: string;
  mapsLink?: string;
  addressMode: 'address_link' | 'address_only';
  note?: string;
  // ─── การชำระเงิน ───
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  stripePaymentIntentId?: string;   // สำหรับ verify กับ Stripe
  stripePaymentMethodId?: string;   // สำหรับ credit card
  // ─── สถานะ ───
  orderStatus: OrderStatus;
  shippingInfo?: ShippingInfoDoc;
  cancelReason?: string;
  confirmedAt?: Date;               // เมื่อลูกค้ากด "ได้รับสินค้าแล้ว"
  createdAt: Date;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: article_categories
   หมวดหมู่บทความ — ตั้งค่าในแอดมิน, ใช้เลือกตอนเพิ่ม/แก้บทความ + แสดง filter หน้า store
══════════════════════════════════════════════════════════ */
export interface ArticleCategoryDoc {
  _id?: ObjectId;
  name: string;
  status: 'active' | 'inactive';
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: articles
   บทความ — จัดการโดย Admin CMS, แสดงในหน้า store
══════════════════════════════════════════════════════════ */
export interface ArticleDoc {
  _id?: ObjectId;
  title: string;
  category: string;              // ชื่อหมวดหมู่ (ตรงกับ article_categories.name)
  authorId: ObjectId;            // อ้างอิง staff._id
  authorName: string;            // denormalized
  date: string;                  // "YYYY-MM-DD"
  status: 'published' | 'draft';
  shortDescription?: string;     // excerpt ใช้ในหน้า list
  longDescription?: string;      // body content (rich text HTML)
  youtubeVideo?: string;
  featuredImageUrl?: string;
  // ─── SEO ───
  seoTitle?: string;
  seoDescription?: string;
  seoKeyword?: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: contacts
   ข้อมูลติดต่อ — มีแค่ 1 Document, อัปเดตโดย Admin CMS
══════════════════════════════════════════════════════════ */
export interface ContactDoc {
  _id?: ObjectId;
  phone: string;
  email: string;
  lineId: string;
  facebook: string;
  tiktok: string;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: saved_cards
   บัตรเครดิต/เดบิตที่ผู้ใช้ผูกไว้
   เก็บเฉพาะ metadata (ไม่เก็บเลขบัตรจริง)
   เลขจริงเก็บที่ Stripe ผ่าน stripePaymentMethodId
══════════════════════════════════════════════════════════ */
export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'jcb' | 'other';

export interface SavedCardDoc {
  _id?: ObjectId;
  userId: ObjectId;              // อ้างอิง users._id
  stripePaymentMethodId: string; // Stripe PM ID เพื่อ charge ภายหลัง
  brand: CardBrand;
  last4: string;                 // 4 หลักสุดท้าย (แสดงผล)
  expMonth: number;              // 1-12
  expYear: number;               // 4 หลัก เช่น 2027
  holderName: string;
  isDefault: boolean;
  createdAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: popup_settings
   ป็อปอัพโปรโมชัน/ความสนใจลูกค้า — จัดการโดย Admin CMS
══════════════════════════════════════════════════════════ */
export interface PopupSettingDoc {
  _id?: ObjectId;
  title: string;
  description?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  isActive: boolean;
  displayFrequency: 'always' | 'once_per_session' | 'once_per_day';
  createdAt: Date;
  updatedAt: Date;
}

/* ══════════════════════════════════════════════════════════
   COLLECTION: admin_notifications
   การแจ้งเตือนแอดมิน — คำสั่งซื้อใหม่, แอดมินล็อกอิน, บทความใหม่, ยกเลิกออเดอร์ ฯลฯ
   (ไม่รวมการล็อกอินของผู้ใช้ทั่วไป)
══════════════════════════════════════════════════════════ */
export type AdminNotificationType =
  | 'new_order'
  | 'payment_pending'
  | 'order_cancelled'
  | 'admin_login'
  | 'new_article'
  | 'new_customer'
  | 'new_product'
  | 'new_product_category'
  | 'new_article_category'
  | 'settings_updated';

export interface AdminNotificationDoc {
  _id?: ObjectId;
  type: AdminNotificationType;
  title: string;
  body: string;
  /** ชื่อคนทำ (แอดมิน/ลูกค้า/ผู้สมัคร) สำหรับแสดง "โดย ชื่อ · วันที่ เวลา" */
  actorName?: string;
  refType?: 'order' | 'article' | 'staff' | 'product' | 'user';
  refId?: string;   // orderId, article _id, staff _id, product _id, user _id
  read: boolean;
  createdAt: Date;
}
