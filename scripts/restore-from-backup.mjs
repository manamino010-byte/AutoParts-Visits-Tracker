/**
 * restore-from-backup.mjs ? Restores tables from a backup directory.
 * Idempotent: uses INSERT ... ON DUPLICATE KEY UPDATE (upsert).
 * Safe: never deletes rows that aren't in the backup (use --clean to remove extras).
 *
 * Usage:
 *   node scripts/restore-from-backup.mjs backups/db-backup-2026-09-01T13-37-52
 *   node scripts/restore-from-backup.mjs backups/db-backup-2026-09-01T13-37-52 --tables users
 *   node scripts/restore-from-backup.mjs backups/db-backup-2026-09-01T13-37-52 --tables users,managers --clean
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL missing"); process.exit(1); }

const args = process.argv.slice(2);
const backupDir = args.find(a => !a.startsWith("--"));
if (!backupDir || !fs.existsSync(backupDir)) {
  console.error("Usage: node scripts/restore-from-backup.mjs <backupDir> [--tables t1,t2,...] [--clean]");
  process.exit(1);
}

const tablesArg = args.find(a => a.startsWith("--tables="));
const clean = args.includes("--clean");
const requestedTables = tablesArg ? tablesArg.split("=")[1].split(",") : null;

const TABLE_ORDER = ["users","branches","managers","managerBranches","visits","locationLogs"];
const PK_COL = { users:"id", branches:"id", managers:"id", managerBranches:"id", visits:"id", locationLogs:"id" };

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  const summaryPath = path.join(backupDir, "_summary.json");
  if (fs.existsSync(summaryPath)) {
    const s = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    console.log(`Backup date: ${s.date}  Total rows: ${s.totalRows}`);
    console.log("Tables in backup:", s.tables.map(t => `${t.table}(${t.rows})`).join(", "));
  }

  const tablesToRestore = requestedTables
    ? TABLE_ORDER.filter(t => requestedTables.includes(t))
    : TABLE_ORDER;

  console.log(`\nRestoring: ${tablesToRestore.join(", ")}${clean ? " (with --clean)" : ""}\n`);

  await conn.query("SET FOREIGN_KEY_CHECKS = 0");

  for (const table of tablesToRestore) {
    const file = path.join(backupDir, `${table}.json`);
    if (!fs.existsSync(file)) { console.log(`  SKIP ${table} (no backup file)`); continue; }

    const rows = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!rows.length) { console.log(`  SKIP ${table} (empty backup)`); continue; }

    const pk = PK_COL[table] || "id";
    const cols = Object.keys(rows[0]);

    // --clean: delete rows whose PK is NOT in backup (removes seed junk etc.)
    if (clean) {
      const backupIds = rows.map(r => r[pk]);
      const [[{c}]] = await conn.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
      if (c > 0) {
        const ph = backupIds.map(() => "?").join(",");
        const [del] = await conn.query(
          `DELETE FROM \`${table}\` WHERE \`${pk}\` NOT IN (${ph})`,
          backupIds
        );
        if (del.affectedRows > 0) console.log(`  CLEAN ${table}: removed ${del.affectedRows} extra row(s)`);
      }
    }

    // Upsert each row
    let inserted = 0, updated = 0;
    for (const row of rows) {
      const vals = cols.map(c => row[c] === null ? null : row[c]);
      const ph = cols.map(() => "?").join(",");
      const updatePh = cols.filter(c => c !== pk).map(c => `\`${c}\`=VALUES(\`${c}\`)`).join(",");
      const sql = `INSERT INTO \`${table}\` (\`${cols.join("`,`")}\`) VALUES (${ph}) ON DUPLICATE KEY UPDATE ${updatePh}`;
      const [res] = await conn.query(sql, vals);
      if (res.affectedRows === 1) inserted++;
      else if (res.affectedRows === 2) updated++;
    }
    console.log(`  ${table}: ${inserted} inserted, ${updated} updated (of ${rows.length} in backup)`);
  }

  await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  await conn.end();
  console.log("\nDone. Verify with: node scripts/db-status.mjs");
}

main().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
