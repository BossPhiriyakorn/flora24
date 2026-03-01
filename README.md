# FLORA — โปรเจคเดียว (แอป + CMS)

โปรเจคนี้รวม **แอปฝั่งผู้ใช้** และ **CMS** ไว้ในโปรเจคเดียว มี **package.json เดียว** และ **node_modules เดียว** ที่ root

## โครงสร้าง

- **`/`** — หน้าบ้าน (FLORA 24/7 EXPRESS) จาก `app/(store)/`
- **`/admin`** — หลังบ้าน CMS จาก `app/admin/`

โฟลเดอร์ `frontend/` และ `thai-cms-admin-panel/` เป็นโค้ดเดิมที่ย้ายมาไว้ที่ root แล้ว สามารถลบหรือเก็บไว้เป็น reference ก็ได้

## การติดตั้งและรัน

**ติดตั้ง (ครั้งเดียว):**

```bash
npm install
```

**รัน dev:**

```bash
npm run dev
```

- หน้าแอปผู้ใช้: http://localhost:3000
- หน้า CMS: http://localhost:3000/admin (รันเซิร์ฟเวอร์เดียว)

**Build / Start:**

```bash
npm run build
npm start
```

## สรุปการรวม

| ก่อน | หลัง |
|------|------|
| node_modules 3 ที่ (root, frontend, admin) | **node_modules เดียวที่ root** |
| package.json 3 ไฟล์ | **package.json เดียวที่ root** |
| รันแยก 2 พอร์ต (3000, 3001) | **รันพอร์ตเดียว 3000** — แอปที่ `/`, CMS ที่ `/admin` |

## Deploy (ไม่ต้อง build / install บนเซิร์ฟเวอร์)

1. **Clone** repo นี้
2. **Local:** `npm install` แล้ว `npm run build` (สร้าง `.next/standalone` + `.next/static`)
3. อัปโหลดเฉพาะ `standalone`, `static`, `public` ขึ้นเซิร์ฟเวอร์ ตาม [docs/DEPLOY_AWS.md](docs/DEPLOY_AWS.md)

เซิร์ฟเวอร์ไม่ต้องรัน `npm install` หรือ `npm run build` — ประหยัดแรม
