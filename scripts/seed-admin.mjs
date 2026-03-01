/**
 * seed-admin.mjs
 * สร้าง admin account คนแรกใน MongoDB
 *
 * วิธีใช้:
 *   node scripts/seed-admin.mjs
 *
 * ต้องมี .env ไฟล์ที่มี MONGODB_URI อยู่ก่อน
 */

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']); // ใช้ Google DNS เพื่อ resolve SRV record

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// โหลด .env ด้วยมือ (ไม่ต้องพึ่ง dotenv)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env');
    const lines   = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      let   val   = trimmed.slice(eqIdx + 1).trim();
      // strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (e) {
    console.error('ไม่พบไฟล์ .env —', e.message);
    process.exit(1);
  }
}

loadEnv();

const MONGODB_URI     = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? 'flora_db';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI ไม่ได้ตั้งค่าใน .env');
  process.exit(1);
}

// ─── Admin ที่จะสร้าง (เปลี่ยนได้ก่อนรัน) ───
const ADMIN = {
  firstName: 'Admin',
  lastName:  'Flora',
  nickname:  'Admin',
  email:     'admin@flora.co.th',
  password:  'Admin@flora2025',
  role:      'admin',
};

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    const db    = client.db(MONGODB_DB_NAME);
    const staff = db.collection('staff');

    // เช็คว่ามีอยู่แล้วหรือเปล่า
    const existing = await staff.findOne({ email: ADMIN.email.toLowerCase() });
    if (existing) {
      console.log(`⚠️  บัญชี ${ADMIN.email} มีอยู่แล้ว ไม่ต้องสร้างใหม่`);
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN.password, 12);

    const result = await staff.insertOne({
      firstName:    ADMIN.firstName,
      lastName:     ADMIN.lastName,
      nickname:     ADMIN.nickname,
      email:        ADMIN.email.toLowerCase(),
      passwordHash,
      role:         ADMIN.role,
      createdAt:    new Date(),
    });

    console.log('');
    console.log('🌸 สร้าง Admin สำเร็จ!');
    console.log('─────────────────────────');
    console.log(`  ID    : ${result.insertedId}`);
    console.log(`  Email : ${ADMIN.email}`);
    console.log(`  Pass  : ${ADMIN.password}`);
    console.log(`  Role  : ${ADMIN.role}`);
    console.log('─────────────────────────');
    console.log('⚠️  เปลี่ยนรหัสผ่านหลังล็อคอินครั้งแรก!');
    console.log('');
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาด:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
