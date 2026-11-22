import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/db';
import { sameOrigin } from '@/lib/access';
import { SMS_COOKIE, smsCookieOptions, tokenHash } from '@/lib/sms-auth';

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({error:'请求来源不符'}, {status:403});
  const token = req.cookies.get(SMS_COOKIE)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    try {
      await getSql()`DELETE FROM sms_login_sessions WHERE token_hash=${tokenHash(token)}`;
    } catch {
      return NextResponse.json({error:'暂时无法退出，请重试'}, {status:503});
    }
  }
  const response = NextResponse.redirect(new URL('/sign-in',req.url),303);
  response.cookies.set(SMS_COOKIE,'',{...smsCookieOptions,maxAge:0});
  return response;
}
