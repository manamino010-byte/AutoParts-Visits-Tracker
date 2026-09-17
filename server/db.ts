import { eq } from "drizzle-orm";
import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users } from "../drizzle/schema";
import * as schema from "../drizzle/schema";

// ── Connection Pool (يحل مشكلة الـ timeout من Railway) ──────────────────────
let _pool: mysql.Pool | null = null;
let _db: MySql2Database<typeof schema> | null = null;

function createPool() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      idleTimeout: 30_000,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
      ssl: {
        rejectUnauthorized: false,
      }
    });
    return pool;
  } catch (error) {
    console.warn("[Database] Failed to create pool:", error);
    return null;
  }
}

export async function getDb(): Promise<MySql2Database<typeof schema> | null> {
  if (!_db) {
    if (!_pool) _pool = createPool();
    if (_pool) {
      try {
        _db = drizzle(_pool, { schema, mode: "default" });
        console.log("[Database] ✅ Pool connected");
      } catch (error) {
        console.warn("[Database] Failed to init drizzle:", error);
        _db = null;
      }
    }
  }
  return _db;
}

// ── Helper: retry تلقائي لو الكونكشن انقطع ───────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isConnError =
      err?.cause?.code === "ER_NET_READ_INTERRUPTED" ||
      err?.cause?.code === "ECONNRESET" ||
      err?.cause?.code === "PROTOCOL_CONNECTION_LOST" ||
      err?.code === "PROTOCOL_CONNECTION_LOST" ||
      err?.code === "ECONNRESET";

    if (retries > 0 && isConnError) {
      console.warn(`[Database] Connection lost, retrying query... (${retries} left)`);
      // لا نقم بتدمير الـ pool، دع mysql2 يتخلص من الاتصال الميت تلقائياً
      await new Promise(r => setTimeout(r, 500));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────
export async function getUserById(id: number) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return undefined;
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] ?? undefined;
  });
}

export async function getUserByUsername(username: string) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return undefined;
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] ?? undefined;
  });
}

export async function createUser(user: InsertUser): Promise<void> {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.insert(users).values(user);
  });
}

export async function updateLastSignedIn(id: number): Promise<void> {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return;
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
  });
}

// ── Admin: list all users ─────────────────────────────────────────────────────
// isSuperAdmin=true → يرى الجميع بما فيهم superadmin
// isSuperAdmin=false (default) → يُخفي السوبر أدمن من القائمة
export async function listUsers(isSuperAdmin = false) {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const { ne } = await import("drizzle-orm");
    
    const query = db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      os: users.os,
      checkinMode: users.checkinMode,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      boundDeviceId: users.boundDeviceId,
      deviceBoundAt: users.deviceBoundAt,
      boundWebFingerprint: users.boundWebFingerprint,
      webFingerprintAt: users.webFingerprintAt,
    }).from(users).orderBy(users.name);

    if (!isSuperAdmin) {
      // الأدمن العادي لا يرى السوبر أدمن نهائياً
      return query.where(ne(users.role, "superadmin"));
    }
    return query;
  });
}

// ══════════════════════════════════════════════════════════
// أضف الكود ده في آخر ملف server/db.ts
// ══════════════════════════════════════════════════════════

export async function updateUser(id: number, data: Partial<InsertUser>): Promise<void> {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
  });
}

export async function deleteUser(id: number): Promise<void> {
  return withRetry(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(users).where(eq(users.id, id));
  });
}
