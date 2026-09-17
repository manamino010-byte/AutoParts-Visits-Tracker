import fs from 'fs';
import mysql from 'mysql2/promise';

async function runMigration() {
  const connectionString = "mysql://root:tf6DAvwGWQ4uUnsSTXcQT3cmV-Vn_7DABc@sakura.proxy.rlwy.net:26201/railway";
  
  console.log("Connecting to database...");
  const conn = await mysql.createConnection({
    uri: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  console.log("Connected successfully. Reading SQL file...");
  const sqlContent = fs.readFileSync('drizzle/migrations/add_branch_manager_roles.sql', 'utf-8');

  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--')); // ignore comments

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 50)}...`);
    await conn.execute(statement);
  }

  console.log("Migration applied successfully!");
  await conn.end();
}

runMigration().catch(console.error);
