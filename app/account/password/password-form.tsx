'use client';

import {useState, type FormEvent} from 'react';
import {useReverification, useUser} from '@clerk/nextjs';
import {isClerkAPIResponseError} from '@clerk/nextjs/errors';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

export default function PasswordForm() {
  const {user, isLoaded} = useUser();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const updatePassword = useReverification((newPassword: string, currentPassword?: string) => {
    if (!user) throw new Error('Missing Clerk user');
    return user.updatePassword({newPassword, currentPassword, signOutOfOtherSessions:true});
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const password = String(fields.get('newPassword') ?? '');
    if ([...password].length < 8) {setError('密码至少需要 8 个字符。');return;}
    if (password !== fields.get('confirmPassword')) {setError('两次输入的密码不一致。');return;}
    setError('');
    setBusy(true);
    try {
      const updated = await updatePassword(password, user?.passwordEnabled ? String(fields.get('currentPassword') ?? '') : undefined);
      if (!updated?.passwordEnabled) {setError('密码尚未保存，请完成身份验证后重试。');return;}
      form.reset();
      setSaved(true);
    } catch (cause) {
      const issue = isClerkAPIResponseError(cause) ? cause.errors[0] : undefined;
      if (issue?.code === 'form_password_length_too_short') {
        const minimum = issue.message.match(/\b(\d+)\b/)?.[1];
        setError(minimum ? `密码至少需要 ${minimum} 个字符。` : '密码太短，请加长后重试。');
      } else if (issue?.code === 'form_password_pwned' || issue?.code === 'form_password_compromised') {
        setError('此密码曾出现在泄露记录中，请换一个。');
      } else if (issue?.code === 'form_password_incorrect') {
        setError('当前密码不正确。');
      } else {
        setError('密码未保存，请稍后重试。');
      }
    } finally {
      setBusy(false);
    }
  }

  return <section className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6">
    <h1 className="text-xl font-semibold">账户密码</h1>
    {saved ? <p role="status">密码已保存。下次可以用邮箱和密码登录。</p> :
      <form method="post" className="space-y-4" onSubmit={submit}>
        {user?.passwordEnabled && <label className="block space-y-1 text-sm">
          当前密码<Input name="currentPassword" type="password" autoComplete="current-password" required disabled={busy} />
        </label>}
        <label className="block space-y-1 text-sm">
          新密码<Input name="newPassword" type="password" autoComplete="new-password" minLength={8} required disabled={busy} />
        </label>
        <label className="block space-y-1 text-sm">
          确认新密码<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required disabled={busy} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={!isLoaded || !user || busy}>{busy ? '保存中…' : '保存密码'}</Button>
      </form>}
    <a className="inline-block text-sm underline" href="/">返回工作台</a>
  </section>;
}
