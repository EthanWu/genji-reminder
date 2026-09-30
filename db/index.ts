import { neon } from '@neondatabase/serverless';

export function getSql() {
  if (!process.env.DATABASE_URL) throw new Error('数据库尚未配置');
  return neon(process.env.DATABASE_URL);
}
