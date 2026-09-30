import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
const sql=neon(process.env.DATABASE_URL);
const id='deployment-test-'+randomUUID();
try {
  await sql`INSERT INTO records(id,kind,name,data,revision) VALUES (${id},'resource','Deployment verification',${JSON.stringify({id,name:'Deployment verification'})}::jsonb,1)`;
  const read=await sql`SELECT revision,data FROM records WHERE id=${id}`;
  assert.equal(read[0].data.id,id);
  const concurrent=await Promise.all([
    sql`UPDATE records SET revision=revision+1 WHERE id=${id} AND revision=1 RETURNING revision`,
    sql`UPDATE records SET revision=revision+1 WHERE id=${id} AND revision=1 RETURNING revision`
  ]);
  assert.equal(concurrent.filter(x=>x.length===1).length,1);
  assert.equal(concurrent.filter(x=>x.length===0).length,1);
  const stale=await sql`DELETE FROM records WHERE id=${id} AND revision=1 RETURNING id`;
  assert.equal(stale.length,0);
  const removed=await sql`DELETE FROM records WHERE id=${id} AND revision=2 RETURNING id`;
  assert.equal(removed.length,1);
  console.log('PASS: persisted JSON, concurrent revision conflict, stale deletion rejected, matching deletion succeeds');
} finally {await sql`DELETE FROM records WHERE id=${id}`;}
const [{count}]=await sql`SELECT count(*)::int AS count FROM records`;
console.log(JSON.stringify({remainingRecords:count}));
