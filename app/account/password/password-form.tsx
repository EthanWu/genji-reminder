'use client';

import {useState, type FormEvent} from 'react';
import {useReverification, useUser} from '@clerk/nextjs';
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
    if (password !== fields.get('confirmPassword')) {setError('两次输入的密码不一致。');return;}
    setError('');
    setBusy(true);
    try {
      const updated = await updatePassword(password, user?.passwordEnabled ? String(fields.get('currentPassword') ?? '') : undefined);
      if (!updated?.passwordEnabled) {setError('密码尚未保存，请完成身份验证后重试。');return;}
      form.reset();
      setSaved(true);
    } catch {
      setError('密码未保存。请确认当前密码正确，并使用至少 12 位且未重复使用的新密码。');
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
          新密码<Input name="newPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy} />
        </label>
        <label className="block space-y-1 text-sm">
          确认新密码<Input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required disabled={busy} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={!isLoaded || !user || busy}>{busy ? '保存中…' : '保存密码'}</Button>
      </form>}
    <a className="inline-block text-sm underline" href="/">返回工作台</a>
  </section>;
}
