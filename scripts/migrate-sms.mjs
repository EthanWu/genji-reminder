import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
await sql.transaction([
  sql`CREATE TABLE IF NOT EXISTS sms_login_codes (
    phone text PRIMARY KEY, challenge_hash text NOT NULL UNIQUE, code_hash text,
    created_at timestamptz NOT NULL, attempts integer NOT NULL,
    window_start timestamptz NOT NULL, send_count integer NOT NULL
  )`,
  sql`CREATE TABLE IF NOT EXISTS sms_login_sessions (
    token_hash text PRIMARY KEY, phone text NOT NULL, expires_at timestamptz NOT NULL
  )`,
]);
console.log('SMS login tables ready');
