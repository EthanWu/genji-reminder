import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';
const sql = neon(process.env.DATABASE_URL);
await sql`CREATE TABLE IF NOT EXISTS records (id text PRIMARY KEY, kind text NOT NULL, name text NOT NULL, data jsonb NOT NULL, revision integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now())`;
await sql`CREATE INDEX IF NOT EXISTS idx_records_kind ON records(kind)`;
if (process.argv[2]) {
  const {records} = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  await sql.transaction(records.map(r => sql`INSERT INTO records(id,kind,name,data,revision) VALUES (${r.id},${r.kind},${r.name},${JSON.stringify(r)}::jsonb,${Math.max(1,r.revision ?? 1)}) ON CONFLICT(id) DO NOTHING`));
}
const [{count}] = await sql`SELECT count(*)::int AS count FROM records`;
console.log(JSON.stringify({migrated:true,records:count}));
