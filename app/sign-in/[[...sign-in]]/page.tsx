import { redirect } from 'next/navigation';
import EmailLogin from '../email-login';
import LoginMethod from '../login-method';
import { smsConfig, smsSessionPhone } from '@/lib/sms-auth';
export const dynamic = 'force-dynamic';
export default async function SignInPage() {
  if (await smsSessionPhone()) redirect('/');
  const allowedEmail = process.env.ALLOWED_EMAIL ?? "";
  const smsEnabled = !!smsConfig();
  return <main className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-slate-50 px-4 py-10">
    <div className="text-center"><h1 className="text-2xl font-semibold text-teal-800">嘿噗 · 资源与日程</h1><p className="mt-2 text-sm text-slate-500">使用授权账户接收验证码，进入工作台。</p></div>
    {smsEnabled ? <LoginMethod allowedEmail={allowedEmail} /> : <EmailLogin allowedEmail={allowedEmail} />}
  </main>;
}
