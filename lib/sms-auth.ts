import { createHash, createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { getSql } from '@/db';

export const SMS_COOKIE = '__Host-heipu-sms';
export const SMS_SESSION_SECONDS = 7 * 24 * 60 * 60;
export const smsCookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' } as const;

export function allowedPhone(phone: string) {
  return /^1[3-9]\d{9}$/.test(phone) &&
    (process.env.ALLOWED_SMS_PHONES ?? '').split(',').some(value => value.trim() === phone);
}

export function smsConfig() {
  const accessKey = process.env.VOLC_SMS_ACCESS_KEY_ID?.trim();
  const secret = process.env.VOLC_SMS_SECRET_ACCESS_KEY?.trim();
  const otpKey = process.env.SMS_OTP_SECRET?.trim();
  return accessKey && secret && otpKey && otpKey.length >= 32 && process.env.DATABASE_URL &&
    (process.env.ALLOWED_SMS_PHONES ?? '').split(',').some(value => allowedPhone(value.trim()))
    ? {accessKey, secret, otpKey} : null;
}

export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export const otpHash = (key: string, challenge: string, code: string) =>
  createHmac('sha256', key).update(`${challenge}:${code}`).digest('hex');

export async function smsSessionPhone() {
  if (!smsConfig()) return null;
  const token = (await cookies()).get(SMS_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const [row] = await getSql()`SELECT phone FROM sms_login_sessions WHERE token_hash=${tokenHash(token)} AND expires_at > now()`;
    return typeof row?.phone === 'string' && allowedPhone(row.phone) ? row.phone : null;
  } catch {
    return null;
  }
}
