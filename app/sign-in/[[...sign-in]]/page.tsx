import { redirect } from 'next/navigation';
import EmailLogin from '../email-login';
import { smsSessionPhone } from '@/lib/sms-auth';
export const dynamic = 'force-dynamic';
export default async function SignInPage() {
  if (await smsSessionPhone()) redirect('/');
  const allowedEmail = process.env.ALLOWED_EMAIL ?? "";
  return <main className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-slate-50 px-4 py-10">
    <div className="text-center"><h1 className="text-2xl font-semibold text-teal-800">嘿噗 · 资源与日程</h1><p className="mt-2 text-sm text-slate-500">请使用授权邮箱登录。</p></div>
    <EmailLogin allowedEmail={allowedEmail} />
  </main>;
}
