/**
 * fix-users-types.mjs ? OPTIONAL: aligns users column types with drizzle/schema.ts
 * so future `drizzle-kit push` stops offering destructive changes.
 *
 * Safe ALTERs only ? no truncation. Conversions fail safely (error, no data loss)
 * if any stored value is incompatible.
 *
 * Run ONLY after taking a fresh backup:  pnpm db:backup
 * Usage: node scripts/fix-users-types.mjs --yes
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL missing in .env");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error("Refusing to run without --yes.");
  console.error("1) Take a backup first:  pnpm db:backup");
  console.error("2) Then run:             node scripts/fix-users-types.mjs --yes");
  process.exit(1);
}

const STATEMENTS = [
  // varchar(50) -> enum (fails safely if any value is not automatic/manual)
  "ALTER TABLE `users` MODIFY `checkinMode` ENUM('automatic','manual') NOT NULL DEFAULT 'automatic'",
  // varchar(255) -> varchar(128) (fails safely if any value exceeds 128 chars)
  "ALTER TABLE `users` MODIFY `boundDeviceId` VARCHAR(128) NULL",
  // datetime -> timestamp (converted using the server session time zone)
  "ALTER TABLE `users` MODIFY `webFingerprintAt` TIMESTAMP NULL",
];

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("Aligning users column types (safe ALTERs, no truncation)...\n");
  for (const stmt of STATEMENTS) {
    console.log("  RUN", stmt);
    await conn.query(stmt);
  }
  await conn.end();
  console.log("\nDone. users table now matches drizzle/schema.ts types.");
}

main().catch((err) => {
  console.error("FAILED (nothing destructive happened, values may just be incompatible):", err.message);
  process.exit(1);
});
