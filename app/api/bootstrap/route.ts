import { getSql } from '@/db';
import { seeds } from '@/lib/seeds';
import { requireApiAccess } from '@/lib/auth';
export async function POST(req: Request) {
  const denied = await requireApiAccess(req); if (denied) return denied;
  try {
    const sql = getSql();
    // One statement makes empty-database seeding atomic across concurrent requests.
    await sql`INSERT INTO records(id,kind,name,data,revision) SELECT item->>'id','resource',item->>'name',item,1 FROM jsonb_array_elements(${JSON.stringify(seeds)}::jsonb) AS item WHERE NOT EXISTS(SELECT 1 FROM records) ON CONFLICT(id) DO NOTHING`;
    return Response.json({ok:true});
  } catch { return Response.json({error:'历史资源初始化失败，请重试'},{status:503}); }
}
