import { env } from 'cloudflare:workers';
export function db(){if(!env.DB)throw new Error('数据库暂不可用');return env.DB;}
