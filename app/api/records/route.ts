import { getSql } from '@/db';
import { recordSchema } from '@/lib/validation';
import { requireApiAccess } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = await requireApiAccess(req); if (denied) return denied;
  try {
    const rows = await getSql()`SELECT data,revision FROM records ORDER BY updated_at DESC`;
    return Response.json({records: rows.map(x => ({...x.data, revision:x.revision}))});
  } catch { return Response.json({error:'暂时无法读取资源，请稍后重试。输入不会被清空。'},{status:503}); }
}

export async function POST(req: Request) {
  const denied = await requireApiAccess(req); if (denied) return denied;
  try {
    const parsed = recordSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({error:'记录格式不正确，请检查名称、优先级、日期和跟进内容'},{status:400});
    const item = parsed.data;
    if (JSON.stringify(item).length > 150000) return Response.json({error:'单条记录不超过 150KB'},{status:400});
    const sql = getSql();
    const rows = item.revision === 0
      ? await sql`INSERT INTO records(id,kind,name,data,revision) VALUES (${item.id},${item.kind},${item.name},${JSON.stringify(item)}::jsonb,1) ON CONFLICT(id) DO NOTHING RETURNING revision`
      : await sql`UPDATE records SET name=${item.name},data=${JSON.stringify(item)}::jsonb,revision=revision+1,updated_at=now() WHERE id=${item.id} AND revision=${item.revision} RETURNING revision`;
    if (!rows.length) return Response.json({error:'这条记录已被更新，请刷新后再编辑；当前输入仍然保留。'},{status:409});
    return Response.json({record:{...item,revision:rows[0].revision}});
  } catch { return Response.json({error:'保存失败，请重试。当前输入已保留。'},{status:503}); }
}

export async function DELETE(req: Request) {
  const denied = await requireApiAccess(req); if (denied) return denied;
  try {
    const {id,revision} = await req.json();
    if (typeof id !== 'string' || !Number.isInteger(revision) || revision < 1) return Response.json({error:'记录格式不正确'},{status:400});
    const rows = await getSql()`DELETE FROM records WHERE id=${id} AND revision=${revision} RETURNING id`;
    if (!rows.length) return Response.json({error:'记录已变更，请刷新后再试'},{status:409});
    return Response.json({ok:true});
  } catch { return Response.json({error:'删除失败'},{status:503}); }
}
