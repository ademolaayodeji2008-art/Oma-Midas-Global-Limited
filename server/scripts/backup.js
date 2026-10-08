/**
 * backup.js — pg_dump backup script for Oma Midas Global Limited
 *
 * RESTORE INSTRUCTIONS
 * --------------------
 * To restore a backup, run:
 *   psql YOUR_DATABASE_URL < server/backups/backup-YYYY-MM-DD-HH-mm.sql
 *
 * WARNING: Restoring will OVERWRITE all data in the target database.
 * Make sure you have confirmed the correct target database before running.
 *
 * USAGE
 * -----
 *   cd server && node scripts/backup.js
 *
 * The backup file will be saved to server/backups/ as a timestamped SQL dump.
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the server root (two levels up from scripts/)
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export function runBackup() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('[backup] DATABASE_URL not set — skipping backup');
    process.exit(1);
  }

  // Build the output path: server/backups/backup-YYYY-MM-DD-HH-mm.sql
  const backupsDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`[backup] Created directory: ${backupsDir}`);
  }

  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('-');

  const outputFile = path.join(backupsDir, `backup-${timestamp}.sql`);

  const command = `pg_dump "${databaseUrl}" --file="${outputFile}" --no-password`;

  console.log(`[backup] ${new Date().toISOString()} — Starting backup...`);

  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    console.error(`[backup] ${new Date().toISOString()} — pg_dump failed: ${err.message}`);
    process.exit(1);
  }

  // Log size of the resulting file
  const stats = fs.statSync(outputFile);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log(
    `[backup] ${new Date().toISOString()} — Backup complete.`,
    `\n  File : ${outputFile}`,
    `\n  Size : ${sizeKB} KB`,
  );
}

// Run directly when called as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runBackup();
}
