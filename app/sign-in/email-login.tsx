'use client';
import {useEffect, useState} from 'react';
import {useSignIn, useAuth, SignOutButton} from '@clerk/nextjs';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {isAllowedEmail} from '@/lib/access';

export default function EmailLogin({allowedEmail}: {allowedEmail: string}) {
  const {signIn, fetchStatus} = useSignIn();
  const {isSignedIn} = useAuth();
  const [mode,setMode] = useState<'code' | 'password'>('code');
  const [password,setPassword] = useState('');
  const [deviceCheck,setDeviceCheck] = useState(false);
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
    if (!isAllowedEmail(email,allowedEmail)) {setError('此邮箱没有访问权限。');return;}
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
      await finishSignIn();
    } catch {setError('验证暂未成功，请稍后重试。');}
    finally {setBusy(false);}
  }
  async function finishSignIn() {
    if (signIn.status !== 'complete') {
      setError('登录还未完成，请使用邮箱验证码登录。');
      return;
    }
    const result = await signIn.finalize({navigate:({session,decorateUrl})=>{
      if (session?.currentTask) {
        setError('请先完成账户所要求的验证。');
        return;
      }
      window.location.href=decorateUrl('/');
    }});
    if (result.error) setError('登录未完成，请稍后重试。');
  }

  async function passwordLogin() {
    setError('');
    if (!isAllowedEmail(email,allowedEmail)) {setError('此邮箱没有访问权限。');return;}
    setBusy(true);
    try {
      if (deviceCheck) {
        const {error} = await signIn.mfa.verifyEmailCode({code});
        if (error) {setError('验证码不正确或已过期。');return;}
      } else {
        const {error} = await signIn.password({emailAddress:email.trim(),password});
        if (error) {setError('邮箱或密码不正确。尚未设置密码时，请先用邮箱验证码登录。');return;}
        if ((signIn.status==='needs_client_trust' || signIn.status==='needs_second_factor') &&
            signIn.supportedSecondFactors?.some(factor=>factor.strategy==='email_code')) {
          const result = await signIn.mfa.sendEmailCode();
          if (result.error) {setError('设备验证码未能发送，请稍后再试。');return;}
          setPassword('');
          setCode('');
          setDeviceCheck(true);
          return;
        }
      }
      await finishSignIn();
    } catch {
      setError('密码登录暂未成功，请稍后再试。');
    } finally {
      setBusy(false);
    }
  }

  async function switchMode() {
    setBusy(true);
    try {
      await signIn.reset();
      setMode(mode==='code'?'password':'code');
      setSent(false);
      setDeviceCheck(false);
      setCode('');
      setPassword('');
      setError('');
    } catch {
      setError('暂时无法切换登录方式，请刷新后重试。');
    } finally {
      setBusy(false);
    }
  }

  if (isSignedIn) return <div className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6"><p>你已登录。</p><Button asChild><a href="/">进入工作台</a></Button><SignOutButton redirectUrl="/sign-in"><Button variant="outline">退出登录</Button></SignOutButton></div>;
  return <section className="w-full max-w-sm rounded-lg border bg-white p-6">
    <form className="space-y-4" onSubmit={e=>{e.preventDefault();void(mode==='password'?passwordLogin():sent?verify():send());}}>
      <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">邮箱</label><Input id="email" type="email" autoComplete="email" required value={email} disabled={sent || deviceCheck || pending} onChange={e=>setEmail(e.target.value)} placeholder="输入授权邮箱" /></div>
      {mode==='password' && !deviceCheck && <label className="block space-y-1 text-sm">
        密码<Input type="password" autoComplete="current-password" required value={password} disabled={pending} onChange={e=>setPassword(e.target.value)} />
      </label>}
      {(sent || deviceCheck) && <div className="space-y-2"><p className="text-sm text-slate-500" role="status">验证码已发送，请查看邮箱。</p><label htmlFor="code" className="text-sm font-medium">邮箱验证码</label><Input id="code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus placeholder="6 位验证码" /></div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" type="submit" disabled={pending}>{pending?'处理中…':(sent || deviceCheck)?'验证并登录':mode==='password'?'使用密码登录':'发送验证码'}</Button>
      {sent && <div className="flex justify-between"><Button type="button" variant="ghost" disabled={pending || cooldown>0} onClick={()=>void send()}>{cooldown>0?`${cooldown} 秒后重新发送`:'重新发送'}</Button><Button type="button" variant="ghost" disabled={pending} onClick={()=>{signIn.reset();setSent(false);setCode('');setError('');}}>更换邮箱</Button></div>}
    </form>
    <Button type="button" variant="link" className="mt-2 px-0" disabled={pending} onClick={()=>void switchMode()}>
      {mode==='code'?'改用邮箱密码登录':'改用邮箱验证码登录'}
    </Button>
  </section>;
}
