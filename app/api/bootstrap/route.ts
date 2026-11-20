import { getSql } from '@/db';
import { requireApiAccess } from '@/lib/auth';
export async function POST(req: Request) {
  const denied = await requireApiAccess(req); if (denied) return denied;
  try {
    await getSql()`SELECT 1 FROM records LIMIT 1`;
    return Response.json({ok:true});
  } catch { return Response.json({error:'工作台初始化失败，请重试'},{status:503}); }
}
