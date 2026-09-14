/**
 * apply-columns.mjs ? Safe, additive-only schema sync for the visits table.
 * Adds missing columns (idempotent) WITHOUT touching existing data.
 * Never truncates. Never alters existing column types. Safe to re-run.
 *
 * Usage: node scripts/apply-columns.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL missing in .env");
  process.exit(1);
}

// Columns introduced by the external-missions feature set (schema.ts).
const COLUMNS = [
  { table: "visits", name: "missionLatitude",         ddl: "TEXT NULL" },
  { table: "visits", name: "missionLongitude",        ddl: "TEXT NULL" },
  { table: "visits", name: "missionRadiusMeters",     ddl: "INT NULL DEFAULT 200" },
  { table: "visits", name: "nearestBranchId",         ddl: "INT NULL" },
  { table: "visits", name: "nearestBranchName",       ddl: "VARCHAR(255) NULL" },
  { table: "visits", name: "nearestBranchDistanceKm", ddl: "DECIMAL(8,2) NULL" },
  { table: "visits", name: "approvalStatus",          ddl: "ENUM('pending','approved','rejected') NULL DEFAULT 'approved'" },
  { table: "visits", name: "reviewedAt",              ddl: "TIMESTAMP NULL" },
  { table: "visits", name: "reviewedByUserId",        ddl: "INT NULL" },
];

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Applying additive columns (idempotent)...\n");

  let added = 0;
  let skipped = 0;

  for (const col of COLUMNS) {
    const [rows] = await conn.query(
      "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
      [col.table, col.name]
    );
    if (rows[0].c > 0) {
      console.log(`  SKIP ${col.table}.${col.name} (already exists)`);
      skipped++;
      continue;
    }
    console.log(`  ADD  ${col.table}.${col.name} ...`);
    await conn.query(`ALTER TABLE \`${col.table}\` ADD COLUMN \`${col.name}\` ${col.ddl}`);
    added++;
  }

  await conn.end();
  console.log(`\nDone: ${added} added, ${skipped} skipped. Existing data untouched.`);
  console.log("Note: approvalStatus was backfilled with 'approved' for existing rows.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});
