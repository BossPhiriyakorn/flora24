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
