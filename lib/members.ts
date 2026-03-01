export type DeliveryStatus = 'pending' | 'shipping' | 'delivered';
export type PaymentStatus = 'success' | 'failed';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  address: string;
  note?: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'jcb' | 'amex';

export interface SavedCard {
  id: string;
  brand: CardBrand;
  last4: string;       // 4 หลักสุดท้ายเท่านั้น ไม่เก็บเลขเต็ม
  holderName: string;
  expMonth: string;    // "MM"
  expYear: string;     // "YY"
  isDefault: boolean;
}

export interface MemberDetail {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  email: string;
  joinDate: string;
  status: 'Active' | 'Suspended';
  avatar?: string;
  savedCards: SavedCard[];
  orders: Order[];
}

export const MEMBERS: MemberDetail[] = [
  {
    id: 1,
    firstName: 'สมชาย',
    lastName: 'รักดี',
    nickname: 'ชาย',
    phone: '081-234-5678',
    email: 'somchai@email.com',
    joinDate: '2024-01-15',
    status: 'Active',
    savedCards: [
      { id: 'c1', brand: 'visa',       last4: '4242', holderName: 'SOMCHAI RAKDI', expMonth: '12', expYear: '26', isDefault: true },
      { id: 'c2', brand: 'mastercard', last4: '8888', holderName: 'SOMCHAI RAKDI', expMonth: '06', expYear: '27', isDefault: false },
    ],
    orders: [
      {
        id: 'ORD-20240310-001',
        date: '2024-03-10 14:30',
        items: [
          { name: 'พวงหรีดดอกไม้สด "นิรันดร์"', qty: 1, price: 2590 },
          { name: 'ชุดมาลัยมะลิสด "ศรัทธา"', qty: 2, price: 490 },
        ],
        total: 3570,
        deliveryFee: 0,
        paymentStatus: 'success',
        deliveryStatus: 'delivered',
        address: '123 ถ.สุขุมวิท 24 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
        note: 'โทรก่อนส่งด้วยนะครับ',
      },
      {
        id: 'ORD-20240218-001',
        date: '2024-02-18 09:00',
        items: [
          { name: 'Midnight Romance (กุหลาบแดง)', qty: 1, price: 1590 },
        ],
        total: 1590,
        deliveryFee: 0,
        paymentStatus: 'success',
        deliveryStatus: 'delivered',
        address: '123 ถ.สุขุมวิท 24 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110',
      },
    ],
  },
  {
    id: 2,
    firstName: 'วิภาวรรณ',
    lastName: 'สวยงาม',
    nickname: 'แอน',
    phone: '089-876-5432',
    email: 'wipawan@email.com',
    joinDate: '2024-02-10',
    status: 'Active',
    savedCards: [
      { id: 'c3', brand: 'jcb', last4: '3530', holderName: 'WIPAWAN SUAY-NGAM', expMonth: '03', expYear: '25', isDefault: true },
    ],
    orders: [
      {
        id: 'ORD-20240315-002',
        date: '2024-03-15 16:00',
        items: [
          { name: 'ช่อดอกลิลลี่สีขาว "บริสุทธิ์"', qty: 1, price: 1290 },
        ],
        total: 1290,
        deliveryFee: 0,
        paymentStatus: 'success',
        deliveryStatus: 'shipping',
        address: '99/5 ซ.ลาดพร้าว 71 แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230',
      },
    ],
  },
  {
    id: 3,
    firstName: 'มานะ',
    lastName: 'ขยันเรียน',
    nickname: 'มานะ',
    phone: '062-111-2233',
    email: 'mana@email.com',
    joinDate: '2024-03-05',
    status: 'Suspended',
    savedCards: [],
    orders: [
      {
        id: 'ORD-20240306-003',
        date: '2024-03-06 11:30',
        items: [
          { name: 'พวงหรีดรักษ์โลก "ร่มเย็น"', qty: 1, price: 1890 },
        ],
        total: 1890,
        deliveryFee: 0,
        paymentStatus: 'failed',
        deliveryStatus: 'pending',
        address: '45 ถ.รัชดาภิเษก เขตห้วยขวาง กรุงเทพฯ 10320',
      },
    ],
  },
  {
    id: 4,
    firstName: 'John',
    lastName: 'Doe',
    nickname: 'John',
    phone: '091-999-8888',
    email: 'john@example.com',
    joinDate: '2024-03-12',
    status: 'Active',
    savedCards: [],
    orders: [],
  },
];
