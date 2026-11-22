import { randomBytes, randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSql } from '@/db';
import { sameOrigin } from '@/lib/access';
import { allowedPhone, otpHash, smsConfig, smsCookieOptions, SMS_COOKIE, SMS_SESSION_SECONDS, tokenHash } from '@/lib/sms-auth';
import { sendSms } from '@/lib/volc-sms';

export const maxDuration = 45;

const requestSchema = z.discriminatedUnion('action', [
  z.object({action:z.literal('send'),phone:z.string().regex(/^1[3-9]\d{9}$/)}),
  z.object({action:z.literal('verify'),challenge:z.string().regex(/^[a-f0-9]{64}$/),code:z.string().regex(/^\d{6}$/)}),
]);
const failure = (error: string, status: number) => NextResponse.json({error}, {status});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return failure('请求来源不符',403);
  const config = smsConfig();
  if (!config) return failure('短信登录暂未启用',503);
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return failure('请检查手机号或验证码',400);
  const input = parsed.data;
  const sql = getSql();
  try {
    if (input.action === 'send') {
      if (!allowedPhone(input.phone)) return failure('此手机号没有访问权限',403);
      const code = String(randomInt(1_000_000)).padStart(6,'0');
      const challenge = randomBytes(32).toString('hex');
      const challengeHash = tokenHash(challenge);
      const codeHash = otpHash(config.otpKey, challenge, code);
      const rows = await sql`
        INSERT INTO sms_login_codes(phone,challenge_hash,code_hash,created_at,attempts,window_start,send_count)
        VALUES (${input.phone},${challengeHash},${codeHash},now(),0,now(),1)
        ON CONFLICT(phone) DO UPDATE SET
          challenge_hash=EXCLUDED.challenge_hash, code_hash=EXCLUDED.code_hash, created_at=now(), attempts=0,
          window_start=CASE WHEN sms_login_codes.window_start <= now()-interval '24 hours' THEN now() ELSE sms_login_codes.window_start END,
          send_count=CASE WHEN sms_login_codes.window_start <= now()-interval '24 hours' THEN 1 ELSE sms_login_codes.send_count+1 END
        WHERE sms_login_codes.created_at <= now()-interval '60 seconds'
          AND (sms_login_codes.send_count < 10 OR sms_login_codes.window_start <= now()-interval '24 hours')
        RETURNING phone
      `;
      if (!rows.length) return failure('发送次数过多，请稍后再试',429);
      try {
        await sendSms(input.phone,code,config.accessKey,config.secret);
      } catch {
        await sql`UPDATE sms_login_codes SET code_hash=NULL WHERE challenge_hash=${challengeHash}`;
        return failure('验证码暂未发送成功，请稍后再试',502);
      }
      return NextResponse.json({challenge}, {headers:{'Cache-Control':'no-store'}});
    }

    const challengeHash = tokenHash(input.challenge);
    const codeHash = otpHash(config.otpKey,input.challenge,input.code);
    const phones = (process.env.ALLOWED_SMS_PHONES ?? '').split(',').map(x=>x.trim()).filter(allowedPhone);
    const token = randomBytes(32).toString('hex');
    const rows = await sql`
      WITH attempt AS (
        UPDATE sms_login_codes SET attempts=attempts+1,
          code_hash=CASE WHEN code_hash=${codeHash} THEN NULL ELSE code_hash END
        WHERE challenge_hash=${challengeHash} AND code_hash IS NOT NULL AND attempts < 5
          AND created_at > now()-interval '5 minutes' AND phone=ANY(${phones}::text[])
        RETURNING phone, code_hash IS NULL AS verified
      )
      INSERT INTO sms_login_sessions(token_hash,phone,expires_at)
      SELECT ${tokenHash(token)},phone,now()+${SMS_SESSION_SECONDS}::int * interval '1 second'
      FROM attempt WHERE verified
      RETURNING phone
    `;
    if (!rows.length) return failure('验证码不正确、已过期或尝试次数过多',400);
    // A successful login is a bounded opportunity to remove old sessions.
    await sql`DELETE FROM sms_login_sessions WHERE expires_at <= now()`.catch(() => {});
    const response = NextResponse.json({ok:true}, {headers:{'Cache-Control':'no-store'}});
    response.cookies.set(SMS_COOKIE,token,{...smsCookieOptions,maxAge:SMS_SESSION_SECONDS});
    return response;
  } catch {
    return failure('短信登录暂不可用，请稍后再试',503);
  }
}
