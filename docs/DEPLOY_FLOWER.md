# คู่มือ Deploy / อัปเดต FLORA — flower.tectony.co.th (ใช้ Git branch main)

โปรเจกต์ใช้ **clone จาก Git** บนเซิร์ฟเวอร์ และ **build บนเครื่องคุณ** แล้ว push โฟลเดอร์ `.next` ขึ้น Git เซิร์ฟเวอร์ไม่ต้องรัน `npm run build`

- **Repo:** https://github.com/BossPhiriyakorn/flora24.git  
- **Branch:** `main`  
- **โฟลเดอร์บนเซิร์ฟ:** `~/flora` (`/home/ubuntu/flora`)

---

## ส่วนที่ 1: อัปเดตโค้ด (branch main)

ทำบน **เครื่องคุณ (Windows)** ทุกครั้งที่แก้โค้ดแล้วต้องการให้ขึ้น production

### 1.1 แก้โค้ดและ build

```powershell
cd "c:\Users\mahaw\Desktop\Boss Phiriyakorn\CodeingWork\Flora\flora"
# แก้โค้ดตามต้องการ จากนั้น:
npm run build
```

### 1.2 Commit และ push ขึ้น main

```powershell
git add .
git status
git commit -m "อธิบายการเปลี่ยนแปลงสั้นๆ"
git push origin main
```

ถ้าใช้ branch อื่น ให้ merge เข้า `main` แล้วค่อย push `main`

---

## ส่วนที่ 2: หลังเอาโค้ดขึ้น Git แล้ว — ตั้งค่า .env และ Deploy บนเซิร์ฟเวอร์

ทำบน **เซิร์ฟเวอร์ (EC2)** ตามลำดับด้านล่าง

### 2.1 Clone ครั้งแรก (ถ้ายังไม่มีโฟลเดอร์ flora)

```bash
cd ~
git clone https://github.com/BossPhiriyakorn/flora24.git flora
cd ~/flora
```

### 2.2 ติดตั้ง dependencies (ครั้งแรกเท่านั้น, ถ้าต้องการ)

ถ้ารันแค่ standalone (`server.js`) ไม่จำเป็นต้องรันขั้นนี้ — โฟลเดอร์ `.next/standalone` มี dependencies ที่ต้องใช้อยู่แล้ว

```bash
cd ~/flora
npm ci
```

### 2.3 ตั้งค่า .env

```bash
nano ~/flora/.env
```

ใส่ค่าจริง โดเมนเป็น `https://flower.tectony.co.th` และ **ห้ามมี** สามตัวนี้บน production:

- `MONGODB_TLS_INSECURE=1`
- `NODE_TLS_REJECT_UNAUTHORIZED=0`
- `MONGODB_USE_GOOGLE_DNS=1`

ตัวอย่างโครง (แทน `...` ด้วยค่าจริง):

```env
NEXT_PUBLIC_APP_URL=https://flower.tectony.co.th
NEXT_PUBLIC_ALLOWED_ORIGINS=https://flower.tectony.co.th

MONGODB_URI="mongodb://USER:PASSWORD@ac-xxx-shard-00-00....mongodb.net:27017,.../flora_db?ssl=true&replicaSet=...&authSource=admin&retryWrites=true&w=majority"
MONGODB_DB_NAME=flora_db

LINE_CLIENT_ID=...
LINE_CLIENT_SECRET=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
JWT_ADMIN_SECRET=...

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...
EMAIL_FROM_NAME=Flora 24/7 Express
OTP_EXPIRY_MINUTES=5
OTP_COOLDOWN_MINUTES=5
OTP_CODE_LENGTH=6
MAX_OTP_ATTEMPTS=5

PAYMENT_GATEWAY_ENABLED=true
PAYMENT_GATEWAY_PUBLIC_KEY=pk_live_...
NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY=pk_live_...
PAYMENT_GATEWAY_SECRET_KEY=sk_live_...
PAYMENT_GATEWAY_WEBHOOK_SECRET=whsec_...

GOOGLE_DRIVE_CREDENTIALS_PATH=./Credentials.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=...
GOOGLE_DRIVE_FOLDER_USER_PROFILES=...
GOOGLE_DRIVE_FOLDER_PRODUCTS=...
GOOGLE_DRIVE_FOLDER_ARTICLES=...
```

บันทึก: **Ctrl+O** → Enter → **Ctrl+X**

### 2.4 เตรียมโฟลเดอร์ standalone (ต้องทำทุกครั้งหลัง pull หรือครั้งแรกหลัง clone)

Next.js standalone ต้องมี `.next/static` และ `public` อยู่ภายในโฟลเดอร์ที่รัน `server.js`:

```bash
cd ~/flora
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

ถ้าขึ้นว่าไม่มี `.next/standalone` หรือ `.next/static` แปลว่ายังไม่มี build บน repo — ต้อง build บนเครื่องคุณ แล้ว commit/push `.next` ตามส่วนที่ 1 ก่อน

### 2.5 รันแอปด้วย PM2

**ครั้งแรก (ยังไม่มี process ชื่อ flora):**

```bash
cd ~/flora
pm2 start .next/standalone/server.js --name flora --env production -- --port 3000
pm2 save
pm2 startup
```

(รันคำสั่งที่ PM2 แสดงจาก `pm2 startup` เช่น `sudo env PATH=...`)

**ครั้งถัดไป (มี flora อยู่แล้ว):**

```bash
cd ~/flora
pm2 restart flora
pm2 save
```

### 2.6 ตรวจสอบว่าแอปรันได้

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

ควรได้ **200**

---

## ส่วนที่ 3: อัปเดตโค้ดบนเซิร์ฟเวอร์ (หลัง push จากเครื่องคุณแล้ว)

ทำบน **เซิร์ฟเวอร์** ทุกครั้งที่คุณ push ขึ้น `main` แล้ว

```bash
cd ~/flora
git pull origin main
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
pm2 restart flora
```

จากนั้นตรวจ:

```bash
pm2 logs flora --lines 20
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

---

## สรุปลำดับ (ตรวจแล้ว)

| ลำดับ | ทำที่ | ขั้นตอน |
|-------|--------|---------|
| 1 | เครื่องคุณ | แก้โค้ด → `npm run build` → `git add .` → `git commit` → `git push origin main` |
| 2 | เซิร์ฟเวอร์ ครั้งแรก | `git clone` → `npm ci` → ตั้ง `.env` → copy static + public เข้า standalone → `pm2 start ...` → `pm2 save` + `pm2 startup` |
| 3 | เซิร์ฟเวอร์ อัปเดต | `git pull origin main` → copy static + public เข้า standalone → `pm2 restart flora` |

---

## Nginx (ถ้าตั้งแล้ว)

ให้ชี้ root ไปที่ `~/flora`:

- `/_next/static/` → `alias /home/ubuntu/flora/.next/static/;`
- `/public/` → `alias /home/ubuntu/flora/public/;`
- `proxy_pass http://localhost:3000;`
