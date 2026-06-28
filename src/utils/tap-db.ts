/**
 * TAP Database Helper — provides database connections configured in TAP Project Settings.
 *
 * Usage in tests:
 *   import { getDb, queryDb, closeAll } from '@utils/tap-db';
 *
 *   test('verify user in DB', async () => {
 *     const rows = await queryDb('KPADB', 'SELECT * FROM users WHERE id = ?', [1]);
 *     expect(rows.length).toBeGreaterThan(0);
 *   });
 *
 *   test.afterAll(async () => { await closeAll(); });
 *
 * Supported DB types: db2, postgresql, mssql
 * Install the driver you need:
 *   npm install ibm_db    # for DB2
 *   npm install pg         # for PostgreSQL
 *   npm install mssql      # for MSSQL
 */

interface DbConnectionConfig {
  db_type: 'db2' | 'postgresql' | 'mssql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  options?: Record<string, unknown>;
}

type TapDbConnections = Record<string, DbConnectionConfig>;

// Cache open connections so they can be reused across tests
const openConnections = new Map<string, unknown>();

/**
 * Parse TAP_DB_CONNECTIONS from env.
 */
function getConfig(): TapDbConnections {
  const raw = process.env.TAP_DB_CONNECTIONS;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('[tap-db] Failed to parse TAP_DB_CONNECTIONS');
    return {};
  }
}

/**
 * List available database connection names.
 */
export function listConnections(): string[] {
  return Object.keys(getConfig());
}

/**
 * Get a connected database client by name.
 * Returns a raw driver client (ibm_db connection, pg.Client, or mssql pool).
 */
export async function getDb(name: string): Promise<unknown> {
  if (openConnections.has(name)) return openConnections.get(name);

  const config = getConfig();
  const conn = config[name];
  if (!conn) {
    const available = Object.keys(config).join(', ') || '(none)';
    throw new Error(`[tap-db] Connection "${name}" not found. Available: ${available}`);
  }

  let client: unknown;

  if (conn.db_type === 'db2') {
    const ibmdb = await import('ibm_db');
    const connStr = `DATABASE=${conn.database};HOSTNAME=${conn.host};PORT=${conn.port};PROTOCOL=TCPIP;UID=${conn.username};PWD=${conn.password};${conn.ssl ? 'SECURITY=SSL;' : ''}`;
    client = await (ibmdb as any).default.open(connStr);
  } else if (conn.db_type === 'postgresql') {
    const pg = await import('pg');
    const pgClient = new (pg as any).default.Client({
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.username,
      password: conn.password,
      ssl: conn.ssl ? { rejectUnauthorized: false } : false,
    });
    await pgClient.connect();
    client = pgClient;
  } else if (conn.db_type === 'mssql') {
    const sql = await import('mssql');
    client = await (sql as any).default.connect({
      server: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.username,
      password: conn.password,
      options: {
        encrypt: !!conn.ssl,
        trustServerCertificate: !conn.ssl,
      },
    });
  } else {
    throw new Error(`[tap-db] Unsupported db_type: ${conn.db_type}`);
  }

  openConnections.set(name, client);
  return client;
}

/**
 * Run a query and return rows. Works with any supported DB type.
 *
 * @param name - Connection name from TAP_DB_CONNECTIONS
 * @param sql  - SQL query string (use ? for parameters)
 * @param params - Query parameters (optional)
 */
export async function queryDb(name: string, sql: string, params: unknown[] = []): Promise<unknown[]> {
  const config = getConfig();
  const conn = config[name];
  if (!conn) throw new Error(`[tap-db] Connection "${name}" not found`);

  const client = await getDb(name) as any;

  if (conn.db_type === 'db2') {
    return new Promise((resolve, reject) => {
      client.query(sql, params, (err: Error | null, rows: unknown[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  } else if (conn.db_type === 'postgresql') {
    const result = await client.query(sql, params);
    return result.rows;
  } else if (conn.db_type === 'mssql') {
    const request = client.request();
    params.forEach((val, i) => request.input(`p${i + 1}`, val));
    // Replace ? placeholders with @p1, @p2, etc.
    let mssqlSql = sql;
    let idx = 0;
    mssqlSql = mssqlSql.replace(/\?/g, () => `@p${++idx}`);
    const result = await request.query(mssqlSql);
    return result.recordset;
  }

  return [];
}

/**
 * Close all open connections. Call this in test.afterAll().
 */
export async function closeAll(): Promise<void> {
  for (const [name, client] of openConnections.entries()) {
    try {
      await (client as any).close?.();
      await (client as any).end?.();
    } catch {
      // ignore close errors
    }
    openConnections.delete(name);
  }
}
