# คู่มือ Deploy — FLORA

เอกสารนี้สรุปการตั้งค่าให้ **ไม่ผูกกับ IP** และพร้อมขึ้นเซิร์ฟเวอร์ (VPS, Cloud Run, Vercel ฯลฯ) โดยไม่มีปัญหาเรื่อง IP เปลี่ยนหรือโดเมนเปลี่ยน

---

## หลักการ: ระบบไม่สน IP

- **แอปนี้ไม่มี logic ผูกกับ IP** (ไม่เช็ค client IP, ไม่ hardcode server IP)
- การเชื่อมต่อภายนอก (MongoDB, LINE, Stripe) ใช้ **URL / โดเมน และ env** เท่านั้น
- ตอน Deploy แค่ตั้งค่า **env** และ **Dashboard ภายนอก** ให้ตรงกับโดเมน/เซิร์ฟเวอร์

---

## 1. MongoDB Atlas — ต้องไม่ล็อค IP

**ปัญหา:** ถ้า Atlas ตั้ง Network Access เป็น IP เฉพาะ เวลา deploy ขึ้นเซิร์ฟเวอร์ (IP คนละตัว) จะเชื่อมต่อไม่ได้

**วิธีแก้:**

1. เข้า [MongoDB Atlas](https://cloud.mongodb.com) → โปรเจกต์ → **Network Access**
2. กด **Add IP Address**
3. เลือก **Allow access from anywhere** (จะได้ `0.0.0.0/0`)
4. Save

ดังนั้น **ไม่ต้อง whitelist IP ของเซิร์ฟเวอร์** — ใช้ 0.0.0.0/0 ให้ Atlas รับการเชื่อมต่อจากที่ใดก็ได้ (การรักษาความปลอดภัยอยู่ที่ username/password ใน connection string)

**ในแอป:** ใช้แค่ `MONGODB_URI` ใน `.env` — ไม่มี IP แนบในโค้ด

---

## 2. DNS (Google DNS) — เลือกใช้ได้ ไม่บังคับ

- โปรเจกต์รองรับการตั้ง DNS เป็น Google (8.8.8.8) เพื่อแก้กรณี ISP บางที่ block SRV / DNS แปลก
- **ตอน Deploy บนเซิร์ฟเวอร์:** ไม่ต้องตั้ง `MONGODB_USE_GOOGLE_DNS` — แอปจะใช้ DNS ตามที่เซิร์ฟเวอร์กำหนด (ไม่ผูกกับ IP/DNS เฉพาะ)
- ใช้ `MONGODB_USE_GOOGLE_DNS=1` เฉพาะเมื่อรัน local/บางเครือข่ายที่ต้องบังคับใช้ Google DNS

---

## 3. URL / Origin — ใช้โดเมน ไม่ใช้ IP

| ตัวแปร | การใช้ตอน Deploy |
|--------|-------------------|
| `NEXT_PUBLIC_APP_URL` | ใส่โดเมนจริง เช่น `https://yourdomain.com` (ไม่ต้องใส่ IP) |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | ถ้ามีหลายโดเมน (เช่น www + non-www) ใส่คั่นด้วย comma ได้ |

LINE / Stripe ใช้ **Callback URL / Webhook URL** เป็นโดเมน เช่น  
`https://yourdomain.com/api/auth/line/callback`  
ไม่มีการอ้างอิง IP ในโค้ด

---

## 4. Checklist ก่อน Deploy

- [ ] **MongoDB Atlas:** Network Access = **Allow access from anywhere** (0.0.0.0/0)
- [ ] **.env บนเซิร์ฟเวอร์:** ใส่ `NEXT_PUBLIC_APP_URL=https://โดเมนจริง` (ไม่ใส่ IP)
- [ ] **.env:** ไม่ต้องตั้ง `MONGODB_USE_GOOGLE_DNS` (เว้นไว้ใช้ DNS ของเซิร์ฟเวอร์)
- [ ] **LINE Console:** Callback URL ชี้ไปที่ `https://โดเมนจริง/api/auth/line/callback`
- [ ] **Stripe Dashboard:** Webhook URL ชี้ไปที่ `https://โดเมนจริง/api/payment/webhook`
- [ ] ไม่มีค่าใดในแอปที่ hardcode IP หรือผูกกับ IP เฉพาะ

---

## 5. แก้ปัญหาเมื่อใช้ Tunnel (Cloudflare / ngrok)

- **Blocked cross-origin request ... To allow this, configure "allowedDevOrigins" in next.config**  
  ตั้ง `NEXT_PUBLIC_APP_URL` และ/หรือ `NEXT_PUBLIC_ALLOWED_ORIGINS` ใน `.env` ให้ตรงกับ URL ของ tunnel ปัจจุบัน (เช่น `https://xxx.trycloudflare.com`) แล้ว **restart dev server** (next.config อ่าน env ตอนสตาร์ทเท่านั้น)

- **MongoDB: ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR / LINE login failed**  
  แอปมี workaround สำหรับ Windows + OpenSSL อยู่แล้ว (บังคับ TLS 1.2 ในโหมด development)  
  ถ้ายังเจออยู่ ให้ลองเพิ่มใน `.env`: `MONGODB_TLS_INSECURE=1` และ `MONGODB_USE_GOOGLE_DNS=1` แล้ว restart dev server

---

## 6. สรุป

- **ไม่สน IP** = ตั้ง Atlas เป็น 0.0.0.0/0, ใช้โดเมนใน env และใน LINE/Stripe
- **DNS** = ไม่บังคับใช้ Google DNS ตอน deploy (ใช้ได้เมื่อต้องการผ่าน env)
- ทำตาม checklist ด้านบน แล้ว deploy ขึ้นเซิร์ฟเวอร์ได้โดยไม่ติดปัญหาเรื่อง IP
