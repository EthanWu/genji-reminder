import { currentUser } from '@clerk/nextjs/server';
import { accessStatus, sameOrigin } from './access';
import { smsSessionPhone } from './sms-auth';

export async function userAccess() {
  if (await smsSessionPhone()) return {status:200, viaSms:true};
  const user = await currentUser();
  const email = user?.emailAddresses.find(e => e.id === user.primaryEmailAddressId);
  const status = accessStatus(user ? { email: email?.emailAddress ?? '', verified: email?.verification?.status === 'verified' } : null, process.env.ALLOWED_EMAIL);
  return {status, viaSms:false};
}

export async function requireApiAccess(req: Request) {
  const {status} = await userAccess();
  if (status !== 200) return Response.json({ error: status === 401 ? '请先登录' : '此账户没有访问权限' }, { status });
  if (!['GET', 'HEAD'].includes(req.method) && !sameOrigin(req)) return Response.json({ error: '请求来源不符' }, { status: 403 });
  return null;
}
