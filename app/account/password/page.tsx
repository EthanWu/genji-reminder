import { redirect } from 'next/navigation';
import { userAccess } from '@/lib/auth';
import PasswordForm from './password-form';

export default async function PasswordPage() {
  const {status, viaSms} = await userAccess();
  if (status === 401) redirect('/sign-in');
  if (status !== 200 || viaSms) redirect('/');
  return <main className="min-h-dvh flex items-center justify-center bg-slate-50 px-4 py-10">
    <PasswordForm />
  </main>;
}
