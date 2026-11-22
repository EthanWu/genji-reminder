'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmailLogin from './email-login';

function SmsLogin() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(action: 'send' | 'verify') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(action === 'send' ? {action, phone} : {action, challenge, code}),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error); return; }
      if (action === 'verify') window.location.replace('/');
      else {
        setChallenge(data.challenge);
        setCode('');
        setCooldown(60);
      }
    } catch {
      setError('无法连接短信登录服务，请稍后重试。');
    } finally {
      setBusy(false);
    }
  }

  return <section className="w-full max-w-sm rounded-lg border bg-white p-6">
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); void submit(challenge ? 'verify' : 'send'); }}>
      <div className="space-y-2">
        <label htmlFor="sms-phone" className="text-sm font-medium">中国大陆手机号</label>
        <Input id="sms-phone" type="tel" inputMode="numeric" autoComplete="tel-national"
          pattern="1[3-9][0-9]{9}" maxLength={11} required disabled={!!challenge || busy}
          value={phone} onChange={event => setPhone(event.target.value)} placeholder="11 位授权手机号" />
      </div>
      {challenge && <div className="space-y-2">
        <p role="status" className="text-sm text-slate-500">验证码已发送，5 分钟内有效。</p>
        <label htmlFor="sms-code" className="text-sm font-medium">短信验证码</label>
        <Input id="sms-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}"
          maxLength={6} required autoFocus value={code}
          onChange={event => setCode(event.target.value.replace(/\D/g, ''))} />
      </div>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" type="submit" disabled={busy}>{busy ? '处理中…' : challenge ? '验证并登录' : '发送验证码'}</Button>
      {challenge && <div className="flex justify-between">
        <Button type="button" variant="ghost" disabled={busy || cooldown > 0} onClick={() => void submit('send')}>{cooldown ? `${cooldown} 秒后重新发送` : '重新发送'}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={() => { setChallenge(''); setCode(''); setError(''); }}>更换手机号</Button>
      </div>}
    </form>
  </section>;
}

export default function LoginMethod({allowedEmail}: {allowedEmail: string}) {
  const [phone, setPhone] = useState(false);
  return <>
    <div role="group" aria-label="登录方式" className="flex gap-2">
      <Button type="button" variant={phone ? 'outline' : 'default'} aria-pressed={!phone} onClick={() => setPhone(false)}>邮箱登录</Button>
      <Button type="button" variant={phone ? 'default' : 'outline'} aria-pressed={phone} onClick={() => setPhone(true)}>手机号登录</Button>
    </div>
    {phone ? <SmsLogin /> : <EmailLogin allowedEmail={allowedEmail} />}
  </>;
}
