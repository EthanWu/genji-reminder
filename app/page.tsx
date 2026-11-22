import { redirect } from 'next/navigation';
import { userAccess } from '@/lib/auth';
import Workspace from './workspace';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const {status, viaSms} = await userAccess();
  if (status === 401) redirect('/sign-in');
  if (status !== 200) return <main className="p-6"><h1>此账户没有访问权限</h1><a href="/sign-in">返回登录</a></main>;
  return <Workspace viaSms={viaSms} />;
}
