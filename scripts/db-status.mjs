/**
 * db-status.mjs ? Read-only: prints row counts for every table.
 * Usage: node scripts/db-status.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL missing"); process.exit(1); }

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  const [tables] = await conn.query("SHOW TABLES");
  const names = tables.map(r => Object.values(r)[0]);
  console.log("=== DB Row Counts ===\n");
  let total = 0;
  for (const t of names) {
    const [[{c}]] = await conn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
    console.log(`  ${t}: ${c}`);
    total += c;
  }
  console.log(`\n  TOTAL: ${total}`);
  await conn.end();
}
main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
