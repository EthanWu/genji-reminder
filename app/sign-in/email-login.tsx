'use client';
import {useEffect, useState} from 'react';
import {useSignIn, useAuth, SignOutButton} from '@clerk/nextjs';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

export default function EmailLogin({allowedEmail}: {allowedEmail: string}) {
  const {signIn, fetchStatus} = useSignIn();
  const {isSignedIn} = useAuth();
  const [email,setEmail] = useState('');
  const [code,setCode] = useState('');
  const [sent,setSent] = useState(false);
  const [cooldown,setCooldown] = useState(0);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  useEffect(()=>{
    if (!cooldown) return;
    const timer=setTimeout(()=>setCooldown(cooldown-1),1000);
    return ()=>clearTimeout(timer);
  },[cooldown]);
  const pending = busy || fetchStatus === 'fetching';
  async function send() {
    setError('');
    if (!allowedEmail || email.trim().toLowerCase() !== allowedEmail.toLowerCase()) {setError('此邮箱没有访问权限。');return;}
    setBusy(true);
    try {
      const {error} = await signIn.emailCode.sendCode({emailAddress:email.trim()});
      if (error) {setError('验证码未能发送，请稍后重试。');return;}
      setSent(true);setCooldown(30);
    } catch {setError('无法连接登录服务，请稍后重试。');}
    finally {setBusy(false);}
  }
  async function verify() {
    setError('');setBusy(true);
    try {
      const {error} = await signIn.emailCode.verifyCode({code});
      if (error) {setError('验证码不正确或已过期，请重新输入或重新发送。');return;}
      if (signIn.status !== 'complete') {setError('登录还未完成，请重新发送验证码。');return;}
      const result = await signIn.finalize({navigate:({decorateUrl})=>{window.location.href=decorateUrl('/');}});
      if (result.error) setError('登录未完成，请稍后重试。');
    } catch {setError('验证暂未成功，请稍后重试。');}
    finally {setBusy(false);}
  }
  if (isSignedIn) return <div className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6"><p>你已登录。</p><Button asChild><a href="/">进入工作台</a></Button><SignOutButton redirectUrl="/sign-in"><Button variant="outline">退出登录</Button></SignOutButton></div>;
  return <section className="w-full max-w-sm rounded-lg border bg-white p-6">
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();void(sent?verify():send());}}>
      <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">邮箱</label><Input id="email" type="email" autoComplete="email" required value={email} disabled={sent || pending} onChange={e=>setEmail(e.target.value)} placeholder="输入授权邮箱" /></div>
      {sent && <div className="space-y-2"><p className="text-sm text-slate-500" role="status">验证码已发送，请查看邮箱。</p><label htmlFor="code" className="text-sm font-medium">邮箱验证码</label><Input id="code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus placeholder="6 位验证码" /></div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" type="submit" disabled={pending}>{pending?'处理中…':sent?'验证并登录':'发送验证码'}</Button>
      {sent && <div className="flex justify-between"><Button type="button" variant="ghost" disabled={pending || cooldown>0} onClick={()=>void send()}>{cooldown>0?`${cooldown} 秒后重新发送`:'重新发送'}</Button><Button type="button" variant="ghost" disabled={pending} onClick={()=>{signIn.reset();setSent(false);setCode('');setError('');}}>更换邮箱</Button></div>}
    </form>
  </section>;
}
