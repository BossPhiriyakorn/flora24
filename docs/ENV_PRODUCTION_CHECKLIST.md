# Checklist: .env บนเซิร์ฟเวอร์ Production (ขั้นที่ 5)

สร้างไฟล์ `.env` ที่ **`/home/ubuntu/flora/standalone/.env`** บน EC2 แล้วใส่ค่าตามนี้

---

## ต้องมีทุกตัว (ถ้าไม่มีแอปจะ error หรือไม่ทำงาน)

| ตัวแปร | ใส่อะไร | หมายเหตุ |
|--------|----------|----------|
| `NODE_ENV` | `production` | บังคับ |
| `NEXT_PUBLIC_APP_URL` | `https://flower.tectony.co.th` | โดเมน production (ไม่มี / ท้าย) |
| `MONGODB_URI` | สตริงเชื่อมต่อจาก MongoDB Atlas | ต้องเพิ่ม IP EC2 ใน Atlas → Network Access ก่อน |
| `MONGODB_DB_NAME` | `flora_db` | หรือชื่อ DB ที่ใช้อยู่ |
| `JWT_SECRET` | สตริงสุ่มอย่างน้อย 32 ตัว | ไม่ใช้ค่าเดียวกับ dev |
| `JWT_ADMIN_SECRET` | สตริงสุ่มอีกตัว ต่างจาก JWT_SECRET | แอดมินใช้ secret คนละตัว |
| `LINE_CLIENT_ID` | จาก LINE Developers Console | Channel ที่ใช้กับโปรเจกต์นี้ |
| `LINE_CLIENT_SECRET` | จาก LINE Developers Console | Callback URL ใน Console = `https://flower.tectony.co.th/api/auth/callback/line` |

---

## อีเมล (OTP / ส่งเมล)

| ตัวแปร | ใส่อะไร |
|--------|----------|
| `SMTP_HOST` | เช่น `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | อีเมล SMTP |
| `SMTP_PASS` | รหัส/API key SMTP |
| `EMAIL_FROM` | อีเมลที่แสดงเป็นผู้ส่ง |
| `EMAIL_FROM_NAME` | ชื่อผู้ส่ง (เช่น Flora 24/7 Express) |
| `OTP_EXPIRY_MINUTES` | `5` |
| `OTP_COOLDOWN_MINUTES` | `5` |
| `OTP_CODE_LENGTH` | `6` |
| `MAX_OTP_ATTEMPTS` | `5` |

---

## Payment (Stripe) — ถ้าเปิดใช้บัตร

| ตัวแปร | ใส่อะไร | หมายเหตุ |
|--------|----------|----------|
| `PAYMENT_GATEWAY_ENABLED` | `true` | |
| `PAYMENT_GATEWAY_PUBLIC_KEY` | ค่า pk_live_... จาก Stripe | |
| `NEXT_PUBLIC_PAYMENT_GATEWAY_PUBLIC_KEY` | ค่าเดียวกันกับด้านบน | |
| `PAYMENT_GATEWAY_SECRET_KEY` | ค่า sk_live_... จาก Stripe | |
| `PAYMENT_GATEWAY_WEBHOOK_SECRET` | whsec_... จาก Stripe Dashboard | Webhook URL ใน Stripe = `https://flower.tectony.co.th/api/payment/webhook` |
| `PAYMENT_GATEWAY_SUCCESS_URL` | `https://flower.tectony.co.th/checkout?success=1` | |
| `PAYMENT_GATEWAY_CANCEL_URL` | `https://flower.tectony.co.th/checkout` | |
| `PAYMENT_GATEWAY_NOTIFY_URL` | `https://flower.tectony.co.th/api/payment/notify` | |

---

## Google Drive — ถ้าใช้อัปโหลดรูป

| ตัวแปร | ใส่อะไร |
|--------|----------|
| `GOOGLE_DRIVE_CREDENTIALS_PATH` | `./Credentials.json` (วางไฟล์ Credentials.json ในโฟลเดอร์ standalone ด้วย) |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | ไอดีโฟลเดอร์ root จาก Google Drive |
| `GOOGLE_DRIVE_ROOT_FOLDER_NAME` | `Flora` |
| `GOOGLE_DRIVE_FOLDER_USER_PROFILES` | ไอดีโฟลเดอร์ user-profiles |
| `GOOGLE_DRIVE_FOLDER_PRODUCTS` | ไอดีโฟลเดอร์ products |
| `GOOGLE_DRIVE_FOLDER_ARTICLES` | ไอดีโฟลเดอร์ articles |

ถ้าไม่ใช้ Drive สามารถไม่ใส่หรือเว้นว่างได้ (แต่ถ้าแอปเรียกใช้ Drive โดยไม่มีค่าอาจ error)

---

## เลือกได้ / ไม่บังคับ

| ตัวแปร | ค่าเริ่มต้น / หมายเหตุ |
|--------|-------------------------|
| `JWT_EXPIRES_IN` | `7d` (อายุ token user) |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | ถ้ามีหลายโดเมน คั่นด้วย comma |

---

## วิธีสร้างไฟล์บนเซิร์ฟเวอร์

```bash
ssh -i "C:\Users\mahaw\.ssh\tectony-dev.pem" ubuntu@ec2-54-254-162-188.ap-southeast-1.compute.amazonaws.com
nano /home/ubuntu/flora/standalone/.env
```

- วางเนื้อหาจาก `.env.production.example` แล้วแก้ค่าจริง
- บันทึก: Ctrl+O → Enter → Ctrl+X

หรือ copy จากเครื่องคุณ (ที่แก้ค่าแล้ว) ไปเซิร์ฟเวอร์:

```bash
scp -i "C:\Users\mahaw\.ssh\tectony-dev.pem" .env.production ubuntu@ec2-54-254-162-188.ap-southeast-1.compute.amazonaws.com:/home/ubuntu/flora/standalone/.env
```

(เปลี่ยน `.env.production` เป็นชื่อไฟล์ที่คุณแก้ค่าแล้ว)
