# คู่มือ Deploy FLORA ขึ้น AWS EC2

> **หลักการสำคัญ:**
> - **Build บน IDE ก่อน** แล้วค่อยอัปโหลด — เซิร์ฟเวอร์ไม่ต้อง `npm install` หรือ `npm run build` (ประหยัดแรม)
> - ใช้ Next.js `standalone` output — ไม่ต้องพก `node_modules` ทั้ง 500MB
> - MongoDB Atlas: ใช้ **Elastic IP** ของ EC2 เพื่อ whitelist IP เฉพาะตัว (ปลอดภัยกว่า 0.0.0.0/0)

---

## สารบัญ

1. [เตรียม AWS EC2](#1-เตรียม-aws-ec2)
2. [ติดตั้งซอฟต์แวร์บนเซิร์ฟเวอร์](#2-ติดตั้งซอฟต์แวร์บนเซิร์ฟเวอร์)
3. [MongoDB Atlas — ตั้งค่า IP Whitelist](#3-mongodb-atlas--ตั้งค่า-ip-whitelist)
4. [Build บน IDE (Local)](#4-build-บน-ide-local)
5. [อัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์](#5-อัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์)
6. [ตั้งค่า .env บนเซิร์ฟเวอร์](#6-ตั้งค่า-env-บนเซิร์ฟเวอร์)
7. [รัน PM2](#7-รัน-pm2)
8. [ตั้งค่า Nginx + HTTPS](#8-ตั้งค่า-nginx--https)
9. [ชี้โดเมน DNS](#9-ชี้โดเมน-dns)
10. [ตั้งค่า LINE / Stripe Dashboard](#10-ตั้งค่า-line--stripe-dashboard)
11. [Checklist ก่อน Go-Live](#11-checklist-ก่อน-go-live)
12. [อัปเดตโค้ด (Deploy ครั้งถัดไป)](#12-อัปเดตโค้ด-deploy-ครั้งถัดไป)

---

## 1. เตรียม AWS EC2

### 1.1 สร้าง Instance

| ค่า | แนะนำ |
|---|---|
| OS | **Ubuntu 24.04 LTS** |
| Instance Type | `t3.small` (2 vCPU, 2GB RAM) ขั้นต่ำ — แนะนำ `t3.medium` (4GB) |
| Storage | 20 GB gp3 |
| Key Pair | สร้างใหม่ `.pem` เก็บไว้ให้ดี |

### 1.2 Security Group (Firewall)

เปิด Inbound Rules:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | IP ของคุณเท่านั้น (My IP) |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

> ❌ **อย่าเปิด port 3000** ต่อตรงสู่ internet — ให้ Nginx รับแทน

### 1.3 Elastic IP — สำคัญมาก

Elastic IP คือ IP แบบคงที่ ไม่เปลี่ยนแม้ restart เซิร์ฟเวอร์

1. AWS Console → **Elastic IPs** → **Allocate Elastic IP address**
2. กด **Associate** → เลือก Instance ที่สร้างไว้
3. จด IP นี้ไว้ → ใช้ **whitelist ใน MongoDB Atlas** และ **ชี้โดเมน DNS**

> ⚠️ ถ้าไม่ใช้ Elastic IP ทุกครั้ง restart EC2 IP จะเปลี่ยน → MongoDB ตัดการเชื่อมต่อ

---

## 2. ติดตั้งซอฟต์แวร์บนเซิร์ฟเวอร์

SSH เข้าเซิร์ฟเวอร์:
```bash
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

ติดตั้ง Node.js 20, PM2, Nginx:
```bash
# อัปเดต package list
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# ตรวจสอบ
node -v   # ควรได้ v20.x.x
npm -v

# ติดตั้ง PM2 (process manager)
sudo npm install -g pm2

# ติดตั้ง Nginx
sudo apt install -y nginx

# ติดตั้ง Certbot (สำหรับ HTTPS)
sudo apt install -y certbot python3-certbot-nginx
```

สร้างโฟลเดอร์แอป:
```bash
sudo mkdir -p /var/www/flora
sudo chown -R ubuntu:ubuntu /var/www/flora
```

---

## 3. MongoDB Atlas — ตั้งค่า IP Whitelist

> นี่คือขั้นตอนที่สำคัญที่สุด — ถ้า whitelist ผิด แอปจะเชื่อมต่อ MongoDB ไม่ได้

### ✅ วิธีที่แนะนำ: Whitelist Elastic IP เฉพาะตัว (ปลอดภัยสูง)

1. ไปที่ [MongoDB Atlas](https://cloud.mongodb.com) → เลือก Project
2. **Network Access** → **Add IP Address**
3. กรอก **Elastic IP ของ EC2** ที่ได้จากขั้นตอน 1.3
4. Comment: `Flora AWS EC2 Production`
5. **Confirm**

```
ตัวอย่าง: 13.215.xxx.xxx/32
```

> `/32` หมายถึง IP เดียวนั้นเท่านั้น — ปลอดภัยที่สุด

### ⚠️ ทางเลือก: Allow Anywhere (ถ้าไม่แน่ใจเรื่อง IP)

ใช้ `0.0.0.0/0` เมื่อ:
- ยังไม่มี Elastic IP
- ใช้ Load Balancer ที่ IP ไม่แน่นอน
- ต้องการ deploy ด่วนก่อน

> ความปลอดภัยพึ่งพา username/password ใน connection string เป็นหลัก

### ตรวจสอบ Connection String

MongoDB Atlas → **Database** → **Connect** → **Drivers** → คัดลอก URI

ตัวอย่าง (Direct Connection — ไม่ใช้ SRV ป้องกันปัญหา DNS):
```
mongodb://username:password@ac-xxx-shard-00-00.mongodb.net:27017,ac-xxx-shard-00-01.mongodb.net:27017,ac-xxx-shard-00-02.mongodb.net:27017/flora_db?ssl=true&replicaSet=atlas-xxx&authSource=admin&retryWrites=true&w=majority
```

> ✅ โปรเจคนี้ใช้ Direct Connection อยู่แล้ว — ไม่ติดปัญหา DNS SRV บางเครือข่าย

---

## 4. Build บน IDE (Local)

> **ทำบนเครื่องของคุณ** ก่อนอัปโหลด — เซิร์ฟเวอร์ไม่ต้องรัน build เลย

### 4.1 ตรวจสอบ .env ก่อน build

แก้ค่าเหล่านี้ให้เป็น production domain ก่อน build:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com
NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY=pk_live_xxx   # ถ้าใช้ live key
```

> ⚠️ `NEXT_PUBLIC_*` ถูกฝังเข้าใน build เลย — ต้องตั้งให้ถูกก่อน build

> 🔒 **ค่า Dev-only ที่ห้ามนำขึ้น Production — ต้องไม่มีใน `.env` บนเซิร์ฟเวอร์:**
> | ตัวแปร | เหตุผลที่มีบน dev | ผลถ้าใช้บน production |
> |---|---|---|
> | `NODE_TLS_REJECT_UNAUTHORIZED=0` | แก้ Windows OpenSSL bug | เปิดช่องโหว่ TLS ทั้งระบบ — ถูก MITM Attack ได้ |
> | `MONGODB_TLS_INSECURE=1` | แก้ Windows TLS handshake | ทำให้ code ตั้ง `NODE_TLS_REJECT_UNAUTHORIZED=0` อัตโนมัติ |
> | `MONGODB_USE_GOOGLE_DNS=1` | บาง ISP block DNS SRV | ไม่จำเป็น — AWS ใช้ DNS ของ AWS เองได้ |
>
> ✅ บน Ubuntu (AWS) ทั้ง 3 ตัวนี้ **ไม่จำเป็น** — MongoDB Atlas เชื่อมต่อได้ปกติโดยไม่ต้อง workaround

### 4.2 รัน Build

```bash
# บนเครื่อง local (IDE)
npm run build
```

Build สำเร็จจะได้โฟลเดอร์:
```
.next/
  standalone/        ← Node.js server พร้อม dependencies ครบ
    server.js        ← ไฟล์รันหลัก
    node_modules/    ← เฉพาะที่จำเป็น (ไม่ใช่ node_modules เต็ม)
  static/            ← CSS, JS, Images (ต้องคัดลอกแยก)
public/              ← static files
```

> ✅ `output: 'standalone'` ใน next.config.ts ทำให้ได้ bundle ที่รันได้เองโดยไม่ต้อง `npm install`

---

## 5. อัปโหลดไฟล์ขึ้นเซิร์ฟเวอร์

### วิธีที่ 1: rsync (แนะนำ — อัปโหลดแค่ไฟล์ที่เปลี่ยน)

```bash
# รันบน terminal ในเครื่อง local
# อัปโหลด standalone server
rsync -avz --delete \
  -e "ssh -i your-key.pem" \
  .next/standalone/ \
  ubuntu@YOUR_ELASTIC_IP:/var/www/flora/

# อัปโหลด static files (CSS/JS)
rsync -avz --delete \
  -e "ssh -i your-key.pem" \
  .next/static/ \
  ubuntu@YOUR_ELASTIC_IP:/var/www/flora/.next/static/

# อัปโหลด public folder
rsync -avz --delete \
  -e "ssh -i your-key.pem" \
  public/ \
  ubuntu@YOUR_ELASTIC_IP:/var/www/flora/public/
```

### วิธีที่ 2: SCP (ถ้าไม่มี rsync)

```bash
# zip ก่อน
# Windows PowerShell:
Compress-Archive -Path .next/standalone/*, .next/static, public -DestinationPath flora-deploy.zip

# อัปโหลด
scp -i your-key.pem flora-deploy.zip ubuntu@YOUR_ELASTIC_IP:/var/www/

# แตก zip บนเซิร์ฟเวอร์
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
cd /var/www
unzip -o flora-deploy.zip -d flora/
```

---

## 6. ตั้งค่า .env บนเซิร์ฟเวอร์

SSH เข้าเซิร์ฟเวอร์แล้วสร้าง `.env` ที่โฟลเดอร์แอป:

```bash
nano /var/www/flora/.env
```

ใส่ค่าทั้งหมด (ลบ dev-only ออก):

```env
# ── APP ──
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com

# ── MONGODB ──
MONGODB_URI=mongodb://username:password@ac-xxx-shard-00-00.mongodb.net:27017,...
MONGODB_DB_NAME=flora_db
# ลบ MONGODB_TLS_INSECURE และ NODE_TLS_REJECT_UNAUTHORIZED ออก (ใช้เฉพาะ dev บน Windows)
# ลบ MONGODB_USE_GOOGLE_DNS ออก (เซิร์ฟเวอร์ใช้ DNS ปกติ)

# ── LINE ──
LINE_CLIENT_ID=your_line_channel_id
LINE_CLIENT_SECRET=your_line_channel_secret
JWT_SECRET=your_jwt_secret_32_chars_min
JWT_EXPIRES_IN=7d
JWT_ADMIN_SECRET=your_admin_jwt_secret_different_from_above

# ── EMAIL ──
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@email.com
SMTP_PASS=your_smtp_password
EMAIL_FROM=no-reply@yourdomain.com
EMAIL_FROM_NAME=Flora 24/7 Express
OTP_EXPIRY_MINUTES=5
OTP_COOLDOWN_MINUTES=5
OTP_CODE_LENGTH=6
MAX_OTP_ATTEMPTS=5

# ── STRIPE ──
PAYMENT_GATEWAY_ENABLED=true
PAYMENT_GATEWAY_PUBLIC_KEY=pk_live_xxx
NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY=pk_live_xxx
PAYMENT_GATEWAY_SECRET_KEY=sk_live_xxx
PAYMENT_GATEWAY_WEBHOOK_SECRET=whsec_xxx

# ── GOOGLE DRIVE ──
GOOGLE_DRIVE_CREDENTIALS_PATH=./Credentials.json
GOOGLE_DRIVE_ROOT_FOLDER_ID=your_folder_id
GOOGLE_DRIVE_FOLDER_USER_PROFILES=your_folder_id
GOOGLE_DRIVE_FOLDER_PRODUCTS=your_folder_id
GOOGLE_DRIVE_FOLDER_ARTICLES=your_folder_id
```

> ⚠️ **ตัวแปรที่ต้องลบออกสำหรับ production:**
> - `MONGODB_TLS_INSECURE=1` — ใช้เฉพาะ dev Windows
> - `NODE_TLS_REJECT_UNAUTHORIZED=0` — ห้ามใช้ production เด็ดขาด
> - `MONGODB_USE_GOOGLE_DNS=1` — ไม่จำเป็นบนเซิร์ฟเวอร์

อัปโหลด Credentials.json (Google Drive):
```bash
scp -i your-key.pem Credentials.json ubuntu@YOUR_ELASTIC_IP:/var/www/flora/
```

---

## 7. รัน PM2

```bash
# SSH เข้าเซิร์ฟเวอร์
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# รัน Next.js standalone
cd /var/www/flora
pm2 start server.js \
  --name "flora" \
  --env production \
  -- --port 3000

# ดูสถานะ
pm2 status
pm2 logs flora --lines 50

# ตั้ง auto-start เมื่อ reboot
pm2 startup
# (รันคำสั่งที่ PM2 แสดงขึ้นมา)
pm2 save
```

ตรวจสอบว่าแอปรันได้:
```bash
curl http://localhost:3000
# ควรได้ HTML กลับมา
```

---

## 8. ตั้งค่า Nginx + HTTPS

### 8.1 สร้าง Nginx config

```bash
sudo nano /etc/nginx/sites-available/flora
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # redirect www → non-www (ถ้าต้องการ)
    if ($host = www.yourdomain.com) {
        return 301 https://yourdomain.com$request_uri;
    }

    # Certbot จะแก้ไฟล์นี้เองเมื่อออก certificate
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # timeout
        proxy_connect_timeout 60s;
        proxy_read_timeout    60s;
    }

    # static files — serve โดยตรงจาก Nginx (เร็วกว่า)
    location /_next/static/ {
        alias /var/www/flora/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /public/ {
        alias /var/www/flora/public/;
        expires 7d;
    }
}
```

เปิดใช้:
```bash
sudo ln -s /etc/nginx/sites-available/flora /etc/nginx/sites-enabled/
sudo nginx -t        # ตรวจ syntax
sudo systemctl reload nginx
```

### 8.2 ออก HTTPS Certificate (Let's Encrypt)

> ต้องชี้ DNS ก่อนถึงจะออก certificate ได้ (ทำขั้นตอน 9 ก่อน)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot จะแก้ Nginx config อัตโนมัติและตั้ง auto-renew ให้

---

## 9. ชี้โดเมน DNS

ที่ผู้ให้บริการโดเมน (Namecheap, GoDaddy, Cloudflare ฯลฯ):

| Type | Name | Value |
|---|---|---|
| A | `@` | `YOUR_ELASTIC_IP` |
| A | `www` | `YOUR_ELASTIC_IP` |

> ✅ ใช้ **Elastic IP** — ไม่เปลี่ยนแม้ restart EC2 ไม่ต้องมาแก้ DNS อีก

DNS อาจใช้เวลา 5 นาที – 24 ชั่วโมงกว่าจะ propagate

ตรวจสอบ:
```bash
nslookup yourdomain.com
# ควรได้ YOUR_ELASTIC_IP
```

---

## 10. ตั้งค่า LINE / Stripe Dashboard

### LINE Console
1. [developers.line.biz](https://developers.line.biz) → Channel → **LINE Login**
2. **Callback URL:**
   ```
   https://yourdomain.com/api/auth/line/callback
   ```

### Stripe Dashboard
1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. **Add endpoint:**
   ```
   https://yourdomain.com/api/payment/webhook
   ```
3. Events to listen: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. คัดลอก **Signing secret** → ใส่ใน `.env` เป็น `PAYMENT_GATEWAY_WEBHOOK_SECRET`

---

## 11. Checklist ก่อน Go-Live

### MongoDB
- [ ] **Elastic IP** ของ EC2 ถูก whitelist ใน MongoDB Atlas Network Access
- [ ] ลบ `MONGODB_TLS_INSECURE`, `NODE_TLS_REJECT_UNAUTHORIZED`, `MONGODB_USE_GOOGLE_DNS` ออกจาก `.env` production
- [ ] ทดสอบ: `curl https://yourdomain.com/api/auth/me` → ไม่ได้รับ MongoDB error

### App & Server
- [ ] `pm2 status` แสดง `flora` สถานะ `online`
- [ ] `pm2 logs flora` ไม่มี error ต่อเนื่อง
- [ ] `pm2 save` + `pm2 startup` เปิดใช้แล้ว

### Domain & HTTPS
- [ ] `https://yourdomain.com` โหลดหน้าแรกได้
- [ ] Certificate ใช้ได้ (กุญแจเขียวบน browser)
- [ ] Redirect HTTP → HTTPS ทำงาน

### External Services
- [ ] LINE Login ทดสอบ login ผ่าน
- [ ] Stripe test payment ผ่าน (ใช้บัตร `4242 4242 4242 4242`)
- [ ] ภาพสินค้าโหลดได้ (Google Drive)

---

## 12. อัปเดตโค้ด (Deploy ครั้งถัดไป)

```bash
# 1. แก้โค้ดบน IDE
# 2. Build บน local
npm run build

# 3. อัปโหลดเฉพาะไฟล์ที่เปลี่ยน
rsync -avz --delete \
  -e "ssh -i your-key.pem" \
  .next/standalone/ \
  ubuntu@YOUR_ELASTIC_IP:/var/www/flora/

rsync -avz --delete \
  -e "ssh -i your-key.pem" \
  .next/static/ \
  ubuntu@YOUR_ELASTIC_IP:/var/www/flora/.next/static/

# 4. Restart แอปบนเซิร์ฟเวอร์
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP "pm2 restart flora"

# 5. ตรวจสอบ
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP "pm2 logs flora --lines 30"
```

> ✅ **เซิร์ฟเวอร์ไม่ต้องรัน `npm install` หรือ `npm run build`** เลย — ทุกอย่างทำบน IDE แล้วอัปโหลด

---

## สรุป Architecture

```
Browser
   │
   ▼
Nginx (port 80/443) ── HTTPS Certificate (Let's Encrypt)
   │
   ▼
PM2 → Node.js Next.js Standalone (port 3000)
   │
   ├── MongoDB Atlas (Elastic IP whitelisted)
   ├── LINE API
   ├── Stripe API
   └── Google Drive API
```

```
ขั้นตอน Deploy:
IDE (build) → rsync → EC2 (pm2 restart) ← ไม่มี npm install บน server
```
