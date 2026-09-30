import { currentUser } from '@clerk/nextjs/server';
import { accessStatus, sameOrigin } from './access';

export async function userAccessStatus() {
  const user = await currentUser();
  const email = user?.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
  return accessStatus(user ? { email: email?.emailAddress ?? '', verified: email?.verification?.status === 'verified' } : null, process.env.ALLOWED_EMAIL);
}

export async function requireApiAccess(req: Request) {
  const status = await userAccessStatus();
  if (status !== 200) return Response.json({ error: status === 401 ? '请先用邮箱验证码登录' : '此邮箱没有访问权限' }, { status });
  if (!['GET', 'HEAD'].includes(req.method) && !sameOrigin(req)) return Response.json({ error: '请求来源不符' }, { status: 403 });
  return null;
}
