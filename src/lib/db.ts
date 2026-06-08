/**
 * PostgreSQL connection pool
 * Đọc trực tiếp file .env để đảm bảo password luôn có
 */
import { Pool, PoolConfig } from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Tìm và parse .env thủ công — đảm bảo chạy trước khi Pool khởi tạo
function loadEnv() {
  // Đọc .env.local — tsx không tự inject file này
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    // Ghi đè luôn để tránh tsx inject giá trị rỗng
    if (key) process.env[key] = val;
  }
}

loadEnv();

const poolConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT  || '5432', 10),
      database: process.env.DB_NAME     || 'HSVQNU',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl:      process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

export const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[DB] Lỗi pool:', err.message);
});

/** Chạy query, trả về toàn bộ rows */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/** Chạy query, trả về 1 row hoặc null */
export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export default pool;
