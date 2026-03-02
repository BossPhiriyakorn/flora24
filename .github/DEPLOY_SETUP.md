# การตั้งค่า Deploy ด้วย GitHub Actions

Workflow จะ **build บน GitHub** แล้ว **ส่งเฉพาะผลลัพธ์ (standalone) ไป EC2** แล้ว restart PM2 — ไม่บิ้วบน AWS เพื่อประหยัดทรัพยากร

## 1. ตั้งค่า Secrets ใน GitHub

ไปที่ **Repo → Settings → Secrets and variables → Actions** แล้วเพิ่ม **Repository secrets**:

| Secret         | ความหมาย |
|----------------|----------|
| `SSH_PRIVATE_KEY` | Private key สำหรับ SSH เข้า EC2 (เนื้อหาทั้งก้อน รวมบรรทัด -----BEGIN ... END-----) |
| `EC2_HOST`     | IP หรือ hostname ของเซิร์ฟเวอร์ EC2 |
| `EC2_USER`     | User สำหรับ SSH (เช่น `ubuntu`, `ec2-user`) |

## 2. (ถ้าต้องการ) กำหนด path บนเซิร์ฟเวอร์

ถ้า path ที่วางโปรเจกต์บน EC2 ไม่ใช่ `/var/www/flora`:

- ไปที่ **Settings → Secrets and variables → Actions → Variables**
- สร้าง variable ชื่อ **`DEPLOY_PATH`** ค่าเช่น `/home/ubuntu/flora`

## 3. เตรียมเซิร์ฟเวอร์ EC2 (ครั้งแรก)

- ติดตั้ง Node.js 20+, PM2
- สร้างโฟลเดอร์ เช่น `mkdir -p /var/www/flora/standalone`
- รันแอปครั้งแรก (หรือให้ workflow start ให้):  
  `cd /var/www/flora/standalone && pm2 start server.js --name flora && pm2 save`
- ใส่ `.env` บนเซิร์ฟเวอร์ที่ path เดียวกับที่รัน (หรือใช้ `--env-file` ตามที่ตั้งไว้)

## 4. การรัน Workflow

- **อัตโนมัติ:** push ขึ้น branch `main` จะ trigger build + deploy
- **รันเอง:** ไปที่แท็บ **Actions** → เลือก "Build and Deploy to EC2" → **Run workflow**

## 5. ถ้าใช้ Nginx หน้าแอป (reverse proxy) — **มักเป็นจุดที่ Deploy ผิด**

ถ้าโดเมน (เช่น https://flower.tectony.co.th) ใช้ Nginx เป็น reverse proxy **ต้องตั้งขนาด request body ให้ใหญ่พอ** มิฉะนั้นจะได้ **413 Payload Too Large** และรูปอัปไม่ขึ้น (local ได้แต่ production ไม่ได้)

ในบล็อก `server` ของ site นั้น เพิ่มหรือแก้เป็น:

```nginx
client_max_body_size 5G;
```

แล้ว reload Nginx: `sudo nginx -t && sudo systemctl reload nginx`

---

## 6. เช็คจุดที่ Deploy มักผิด (local ได้ แต่ production ไม่ได้)

| จุด | สิ่งที่ต้องตรวจ |
|-----|------------------|
| **Nginx body size** | ใส่ `client_max_body_size 5G;` ในบล็อก server ของโดเมนนี้ (ดูข้อ 5) |
| **.env บนเซิร์ฟเวอร์** | อยู่ที่โฟลเดอร์เดียวกับที่รัน (เช่น `standalone/.env`) และมีค่า GOOGLE_DRIVE_* ครบ |
| **Credentials.json** | อยู่ที่ path ใน GOOGLE_DRIVE_CREDENTIALS_PATH (บน Linux ตัวพิมพ์ต้องตรง เช่น `Credentials.json`) |
| **NODE_TLS_REJECT_UNAUTHORIZED** | อย่าตั้งเป็น `0` บน production — จะปิดการตรวจสอบ TLS และอาจทำให้เชื่อม Drive ไม่เสถียร |
| **โฟลเดอร์ Drive** | แชร์โฟลเดอร์ articles/products กับ Service Account (client_email ใน Credentials.json) สิทธิ์ผู้แก้ไข |
