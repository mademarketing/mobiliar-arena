/**
 * Database Backup Script
 *
 * Creates timestamped backups of the prizes database.
 * Can be run manually or via cron for daily backups.
 *
 * Usage:
 *   npm run backup           # Create backup in default location
 *   npm run backup -- --dir ./custom-path  # Custom backup directory
 */

import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const dirIndex = args.indexOf('--dir');
const backupDir = dirIndex !== -1 ? args[dirIndex + 1] : './backups';

// Database paths
const dbPath = './content/prizes.db';
const dbWalPath = './content/prizes.db-wal';
const dbShmPath = './content/prizes.db-shm';

/**
 * Create timestamped backup filename
 */
function getBackupFilename(): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
  return `prizes_${timestamp}.db`;
}

/**
 * Main backup function
 */
function backupDatabase() {
  try {
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`✓ Created backup directory: ${backupDir}`);
    }

    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      console.error(`✗ Database not found: ${dbPath}`);
      process.exit(1);
    }

    // Generate backup filename
    const backupFilename = getBackupFilename();
    const backupPath = path.join(backupDir, backupFilename);

    // Copy main database file
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✓ Backed up database to: ${backupPath}`);

    // Also backup WAL file if it exists (for SQLite WAL mode)
    if (fs.existsSync(dbWalPath)) {
      const walBackupPath = path.join(backupDir, `${backupFilename}-wal`);
      fs.copyFileSync(dbWalPath, walBackupPath);
      console.log(`✓ Backed up WAL file to: ${walBackupPath}`);
    }

    // Get file size
    const stats = fs.statSync(backupPath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✓ Backup size: ${sizeKB} KB`);

    // Count total backups
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('prizes_') && file.endsWith('.db'));
    console.log(`✓ Total backups in directory: ${backupFiles.length}`);

    // Cleanup old backups (keep last 30)
    if (backupFiles.length > 30) {
      const sorted = backupFiles
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          mtime: fs.statSync(path.join(backupDir, file)).mtime.getTime()
        }))
        .sort((a, b) => b.mtime - a.mtime);

      const toDelete = sorted.slice(30);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        // Also delete corresponding WAL file if exists
        const walPath = file.path + '-wal';
        if (fs.existsSync(walPath)) {
          fs.unlinkSync(walPath);
        }
        console.log(`✓ Deleted old backup: ${file.name}`);
      });
    }

    console.log('\n✓ Backup completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Backup failed:', error);
    process.exit(1);
  }
}

// Run backup
backupDatabase();
