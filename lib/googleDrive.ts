import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

const ROOT_FOLDER_NAME = process.env.GOOGLE_DRIVE_ROOT_FOLDER_NAME || 'Flora';
/** ชื่อโฟลเดอร์หลักใน Drive (ใต้ root) */
export const FOLDER_NAMES = {
  userProfiles: 'user-profiles',
  products: 'products',
  articles: 'articles',
} as const;

export type DriveFolderType = keyof typeof FOLDER_NAMES;

let driveInstance: ReturnType<typeof google.drive> | null = null;

function getCredentialsPath(): string {
  const envPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH;
  if (envPath) return path.resolve(process.cwd(), envPath);
  return path.resolve(process.cwd(), 'Credentials.json');
}

function loadCredentials(): object {
  const credPath = getCredentialsPath();
  if (!fs.existsSync(credPath)) {
    throw new Error(`ไม่พบไฟล์ credentials: ${credPath}. ตั้งค่า GOOGLE_DRIVE_CREDENTIALS_PATH ใน .env หรือวาง Credentials.json ที่ root โปรเจกต์`);
  }
  const raw = fs.readFileSync(credPath, 'utf-8');
  return JSON.parse(raw) as object;
}

/** ได้ Drive client (ใช้ credentials จากไฟล์หรือจาก env) */
export function getDriveClient(): ReturnType<typeof google.drive> {
  if (driveInstance) return driveInstance;

  let credentials: object;
  const envJson = process.env.GOOGLE_DRIVE_CREDENTIALS_JSON;
  if (envJson) {
    try {
      credentials = JSON.parse(envJson) as object;
    } catch {
      throw new Error('GOOGLE_DRIVE_CREDENTIALS_JSON ไม่ใช่ JSON ที่ถูกต้อง');
    }
  } else {
    credentials = loadCredentials();
  }

  const auth = new google.auth.GoogleAuth({
    credentials: credentials as any,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveInstance = google.drive({ version: 'v3', auth });
  return driveInstance;
}

/** หาหรือสร้างโฟลเดอร์ root (ชื่อจาก GOOGLE_DRIVE_ROOT_FOLDER_NAME หรือ "Flora") */
export async function getOrCreateRootFolder(): Promise<string> {
  const drive = getDriveClient();
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (rootId) return rootId;

  const listParams: { q: string; fields: string; pageSize: number; supportsAllDrives?: boolean; includeItemsFromAllDrives?: boolean } = {
    q: `name = '${ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  };
  listParams.supportsAllDrives = true;
  listParams.includeItemsFromAllDrives = true;
  const { data: list } = await drive.files.list(listParams);

  if (list.files?.length) return list.files[0].id!;

  const { data: created } = await drive.files.create({
    requestBody: { name: ROOT_FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
    supportsAllDrives: true,
  });
  if (!created.id) throw new Error('สร้างโฟลเดอร์ root ไม่สำเร็จ');
  return created.id;
}

/** ชื่อ env สำหรับไอดีโฟลเดอร์ย่อย (ใส่ใน .env ได้ — ระบบสร้างแค่ย่อยในย่อยตาม entityId) */
const FOLDER_ID_ENV: Record<DriveFolderType, string> = {
  userProfiles: 'GOOGLE_DRIVE_FOLDER_USER_PROFILES',
  products: 'GOOGLE_DRIVE_FOLDER_PRODUCTS',
  articles: 'GOOGLE_DRIVE_FOLDER_ARTICLES',
};

/** หาหรือสร้างโฟลเดอร์หลักย่อย (user-profiles | products | articles) — ถ้าใส่ไอดีใน .env ใช้ค่านั้น ไม่ใส่วิธีระบบสร้างใต้ root */
export async function getOrCreateMainSubfolder(folderType: DriveFolderType): Promise<string> {
  const envId = process.env[FOLDER_ID_ENV[folderType]]?.trim();
  if (envId) return envId;

  const drive = getDriveClient();
  const rootId = await getOrCreateRootFolder();
  const folderName = FOLDER_NAMES[folderType];

  const listParams: { q: string; fields: string; pageSize: number; supportsAllDrives?: boolean; includeItemsFromAllDrives?: boolean } = {
    q: `'${rootId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  };
  listParams.supportsAllDrives = true;
  listParams.includeItemsFromAllDrives = true;
  const { data: list } = await drive.files.list(listParams);

  if (list.files?.length) return list.files[0].id!;

  const { data: created } = await drive.files.create({
    requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootId] },
    fields: 'id',
    supportsAllDrives: true,
  });
  if (!created.id) throw new Error(`สร้างโฟลเดอร์ ${folderName} ไม่สำเร็จ`);
  return created.id;
}

/** สร้างโฟลเดอร์ย่อยในย่อยตาม entity ID เท่านั้น (userId / productId / articleId) — โฟลเดอร์หลัก 3 ตัวใส่ใน .env */
export async function getOrCreateEntityFolder(
  folderType: DriveFolderType,
  entityId: string
): Promise<string> {
  const drive = getDriveClient();
  const parentId = await getOrCreateMainSubfolder(folderType);
  const mainName = FOLDER_NAMES[folderType];

  const listParams: { q: string; fields: string; pageSize: number; supportsAllDrives?: boolean; includeItemsFromAllDrives?: boolean } = {
    q: `'${parentId}' in parents and name = '${entityId}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
  };
  listParams.supportsAllDrives = true;
  listParams.includeItemsFromAllDrives = true;
  const { data: list } = await drive.files.list(listParams);

  if (list.files?.length) return list.files[0].id!;

  const { data: created } = await drive.files.create({
    requestBody: { name: entityId, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
    fields: 'id',
    supportsAllDrives: true,
  });
  if (!created.id) throw new Error(`สร้างโฟลเดอร์ ${mainName}/${entityId} ไม่สำเร็จ`);
  return created.id;
}

/** อัปโหลดไฟล์ไป Drive แล้วตั้ง permission ให้ anyone อ่านได้ คืน URL สำหรับแสดงรูป */
export async function uploadToDrive(
  folderType: DriveFolderType,
  entityId: string,
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const drive = getDriveClient();
  const folderId = await getOrCreateEntityFolder(folderType, entityId);

  const { data: file } = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id',
    supportsAllDrives: true,
  });

  if (!file.id) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ');

  await drive.permissions.create({
    fileId: file.id,
    requestBody: { type: 'anyone', role: 'reader' },
    supportsAllDrives: true,
  });

  return `https://drive.google.com/uc?export=view&id=${file.id}`;
}
