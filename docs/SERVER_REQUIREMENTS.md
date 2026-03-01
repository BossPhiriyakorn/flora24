# ความต้องการเซิร์ฟเวอร์ — FLORA

เอกสารนี้อิงจากการวัดจริงจากโปรเจกต์ (node_modules, .next, source) และความต้องการของ Next.js 15 + npm บน Linux/EC2

---

## 1. พื้นที่ดิสก์ (Disk Space)

### การวัดจากโปรเจกต์จริง

| รายการ | ขนาด (MB) | หมายเหตุ |
|--------|-----------|----------|
| **node_modules** | ~853 | ติดตั้งจาก package-lock (รวม transitive) |
| **.next** (หลัง build) | ~945 | cache + compiled output |
| **.next/standalone** | ~80 | โฟลเดอร์ที่ใช้รัน production (มี server.js + dependencies ติดตาม) |
| **.next/static** | ~2.3 | ต้อง copy เข้า standalone ตอน deploy |
| **Source code** (ไม่รวม node_modules, .next) | ~3.5 | app, components, lib, config ฯลฯ |

### สรุปพื้นที่ตามสถานการณ์

| สถานการณ์ | พื้นที่ขั้นต่ำ | แนะนำ (รวม buffer) |
|-----------|----------------|----------------------|
| **ตอน build บนเซิร์ฟเวอร์** (มี node_modules + .next พร้อมกัน) | ~1.8 GB | **5 GB** (เผื่อ OS, log, cache ชั่วคราว) |
| **Production หลัง deploy** (ใช้แค่ standalone + static + public) | ~0.1 GB | **1–2 GB** (เผื่อ log, upload, backup) |
| **ทั้ง build และรันบนเครื่องเดียว** (ไม่ลบ node_modules หลัง build) | ~1.8 GB | **8–10 GB** (เผื่อ OS, log, หลาย build) |

**ข้อสรุปพื้นที่ดิสก์**

- **ถ้า build บนเซิร์ฟเวอร์:** พาร์ทิชันที่ใช้ build ควรมีพื้นที่ว่าง **อย่างน้อย 5 GB** (แนะนำ 8–10 GB ถ้าจะเก็บ build หลายครั้งหรือไม่ลบ node_modules)
- **ถ้า build ที่อื่น (CI/local) แล้วเอาเฉพาะ standalone ขึ้นเซิร์ฟเวอร์:** เซิร์ฟเวอร์รันแอปใช้ **อย่างน้อย 1–2 GB** ก็พอ

---

## 2. แรม (RAM)

### ความต้องการตามขั้นตอน

| ขั้นตอน | ความต้องการโดยประมาณ | อ้างอิง |
|---------|------------------------|--------|
| **npm install** | 1.5–2.5 GB | โปรเจกต์มี Sharp (native), googleapis, Next, ฯลฯ; เคสทั่วไป 1.7 GB+ ขึ้นไปถึงจะสบาย |
| **npm run build** (Next.js 15) | 4–6 GB | Webpack/compiler + TypeScript + หลาย route; เคสที่ 4 GB โดน OOM kill มีรายงานบ่อย |
| **รัน production** (node server.js ใน standalone) | 256–512 MB | แอปขนาดนี้รันไม่หนัก |

### สรุปแรม

| เป้าหมาย | RAM ขั้นต่ำ | RAM แนะนำ |
|----------|-------------|-----------|
| **ให้ npm install ผ่าน** | 1.5 GB (หรือ 1 GB + swap 2 GB) | **2 GB** |
| **ให้ npm run build ผ่าน** | 4 GB (เสี่ยง OOM) | **6–8 GB** |
| **ให้ทั้ง install + build ผ่านบนเครื่องเดียว** | 4 GB + swap | **8 GB** |
| **รัน production อย่างเดียว** | 512 MB | 1 GB |

**ข้อสรุปแรม**

- **ถ้าจะรันทั้ง `npm install` และ `npm run build` บน EC2 เครื่องเดียวกัน:** ใช้ instance ที่มี **RAM 8 GB** (เช่น **t3.large**) จะพอและไม่ต้องพึ่ง swap
- **ถ้าลดต้นทุน:** 4 GB + swap 2–4 GB + ตั้ง `NODE_OPTIONS=--max-old-space-size=3072` ตอน build ได้ แต่มีโอกาส build ถูก kill ถ้าโหลดสูง

---

## 3. สรุปค่าที่แนะนำสำหรับ AWS EC2

| รายการ | ค่าที่ใช้ได้จริง |
|--------|-------------------|
| **RAM** | **8 GB** (t3.large) — พอสำหรับทั้ง `npm install` และ `npm run build` |
| **Disk** | **อย่างน้อย 8–10 GB** สำหรับพาร์ทิชันที่ใช้ build และรัน (หรือ 5 GB ถ้า build แล้วลบ node_modules / build ที่อื่น) |
| **Instance type ตัวอย่าง** | **t3.large** (2 vCPU, 8 GB RAM) หรือ **t3.xlarge** (4 vCPU, 16 GB) ถ้าอยากให้ build เร็วขึ้น |

---

## 4. หมายเหตุ

- โปรเจกต์ใช้ `output: 'standalone'` แล้ว — ขนาดตอนรันจริงจึงอยู่ที่ ~80 MB + static ไม่ใช่ทั้งโฟลเดอร์ .next
- ตัวเลขดิสก์มาจากการวัดบน Windows; บน Linux อาจต่างเล็กน้อยแต่ลำดับขนาดเท่ากัน
- ถ้าใช้ CI (GitHub Actions, Amplify ฯลฯ) ทำ build แล้ว deploy เฉพาะ standalone ขึ้น EC2 — EC2 ใช้แค่ 1–2 GB disk และ 1 GB RAM ก็รันแอปได้
