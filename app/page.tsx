import { redirect } from 'next/navigation';
import { userAccessStatus } from '@/lib/auth';
import Workspace from './workspace';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const status = await userAccessStatus();
  if (status === 401) redirect('/sign-in');
  if (status !== 200) return <main className="p-6"><h1>此邮箱没有访问权限</h1><a href="/sign-in">返回登录</a></main>;
  return <Workspace />;
}
