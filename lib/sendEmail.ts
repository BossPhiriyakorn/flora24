import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromEmail = process.env.EMAIL_FROM || user || 'noreply@localhost';
const fromName = process.env.EMAIL_FROM_NAME || 'Flora';

function getTransport() {
  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, SMTP_PASS ต้องตั้งค่าใน .env');
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export interface SendMailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from:    `"${fromName}" <${fromEmail}>`,
    to:      options.to,
    subject: options.subject,
    text:    options.text,
    html:    options.html ?? options.text,
  });
}

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES) || 5;

/** ส่งอีเมล OTP สำหรับยืนยันสมัครสมาชิก */
export async function sendOtpEmail(to: string, otp: string, fromNameApp: string = fromName): Promise<void> {
  const subject = `รหัส OTP ยืนยันอีเมล — ${fromNameApp}`;
  const text = `รหัส OTP ของคุณคือ: ${otp}\n\nรหัสมีอายุ ${OTP_EXPIRY_MINUTES} นาที หากคุณไม่ได้ขอรหัสนี้ กรุณาข้ามอีเมลนี้ได้`;
  const html = `
    <p>รหัส OTP ของคุณคือ: <strong style="font-size:1.5em;letter-spacing:0.2em;">${otp}</strong></p>
    <p>รหัสมีอายุ ${OTP_EXPIRY_MINUTES} นาที</p>
    <p>หากคุณไม่ได้ขอรหัสนี้ กรุณาข้ามอีเมลนี้ได้</p>
  `;
  await sendMail({ to, subject, text, html });
}
