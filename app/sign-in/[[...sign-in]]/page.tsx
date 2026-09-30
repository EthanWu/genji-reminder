import EmailLogin from '../email-login';
export const dynamic = 'force-dynamic';
export default function SignInPage() {
  return <main className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-slate-50 px-4 py-10">
    <div className="text-center"><h1 className="text-2xl font-semibold text-teal-800">嘿噗 · 资源与日程</h1><p className="mt-2 text-sm text-slate-500">使用授权邮箱接收验证码，进入工作台。</p></div>
    <EmailLogin allowedEmail={process.env.ALLOWED_EMAIL ?? ""} />
  </main>;
}
