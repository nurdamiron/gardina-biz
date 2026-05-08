/**
 * Создаёт пустую PostgreSQL базу на RDS (или любом Postgres), если её ещё нет.
 * Использует ТОЛЬКО переменные окружения — логин/пароль нигде не меняет и не записывает.
 *
 * Подключение к служебной БД `postgres`, затем CREATE DATABASE для DATABASE_NAME.
 *
 * Переменные (как в config.js):
 *   DATABASE_HOST, DATABASE_PORT, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME
 *   DATABASE_SSL=true для RDS с SSL
 * или одна строка:
 *   DATABASE_URL (парсится, имя БД берётся из path; для CREATE подключаемся к /postgres)
 *
 * Запуск: node scripts/create-rds-database.js
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.production') });

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function parseDatabaseUrl(urlString) {
  try {
    const u = new URL(urlString);
    const dbFromPath = u.pathname?.replace(/^\//, '') || '';
    return {
      host: u.hostname,
      port: parseInt(u.port || '5432', 10),
      user: decodeURIComponent(u.username || ''),
      password: decodeURIComponent(u.password || ''),
      databaseName: dbFromPath.split('/')[0] || '',
      ssl: true,
    };
  } catch {
    return null;
  }
}

async function main() {
  let host;
  let port = parseInt(process.env.DATABASE_PORT || '5432', 10);
  let user;
  let password;
  let targetDb;
  let ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false;

  if (process.env.DATABASE_URL) {
    const parsed = parseDatabaseUrl(process.env.DATABASE_URL);
    if (!parsed?.host || !parsed.user || !parsed.databaseName) {
      console.error('Не удалось разобрать DATABASE_URL');
      process.exit(1);
    }
    host = parsed.host;
    port = parsed.port;
    user = parsed.user;
    password = parsed.password;
    targetDb = parsed.databaseName;
    ssl = parsed.ssl ? { rejectUnauthorized: false } : false;
  } else {
    host = process.env.DATABASE_HOST;
    user = process.env.DATABASE_USERNAME;
    password = process.env.DATABASE_PASSWORD;
    targetDb = process.env.DATABASE_NAME;
    if (process.env.DATABASE_SSL === 'true') {
      ssl = { rejectUnauthorized: false };
    }
  }

  if (!host || !user || password === undefined || !targetDb) {
    console.error(
      'Задайте подключение: DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME (+ DATABASE_SSL=true для RDS) или DATABASE_URL'
    );
    process.exit(1);
  }

  const adminClient = new pg.Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
    ssl,
    connectionTimeoutMillis: 30000,
  });

  await adminClient.connect();
  console.log(`Подключено к ${host}:${port} как «${user}», служебная БД postgres`);

  const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    targetDb,
  ]);

  if (exists.rows.length > 0) {
    console.log(`База «${targetDb}» уже существует — ничего не делаем.`);
  } else {
    await adminClient.query(`CREATE DATABASE ${quoteIdent(targetDb)}`);
    console.log(`Создана база «${targetDb}».`);
  }

  await adminClient.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
