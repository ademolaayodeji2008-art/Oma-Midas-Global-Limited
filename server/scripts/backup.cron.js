/**
 * backup.cron.js — Weekly scheduled backup job
 *
 * Optional — start independently or import in server.js when ENABLE_BACKUP_CRON=true.
 *
 * Schedule: '0 2 * * 0'  →  Sundays at 2:00 AM server time
 *
 * To enable from server.js:
 *   if (process.env.ENABLE_BACKUP_CRON === 'true') {
 *     const { startBackupCronJob } = await import('./scripts/backup.cron.js');
 *     startBackupCronJob();
 *   }
 *
 * To run as a standalone process:
 *   node scripts/backup.cron.js
 */

import cron from 'node-cron';
import { runBackup } from './backup.js';

export function startBackupCronJob() {
  // Sundays at 2:00 AM
  cron.schedule('0 2 * * 0', () => {
    console.log(`[backup-cron] ${new Date().toISOString()} — Weekly backup triggered`);
    try {
      runBackup();
    } catch (err) {
      console.error(`[backup-cron] ${new Date().toISOString()} — Backup failed:`, err.message);
    }
  });

  console.log('[backup-cron] Weekly backup scheduled — runs every Sunday at 2:00 AM');
}

// Run as standalone if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  startBackupCronJob();
}
