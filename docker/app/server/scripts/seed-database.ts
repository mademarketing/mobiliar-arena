/**
 * Database seed script for development
 *
 * Example script that populates database with test data.
 * Customize this for your project:
 * - Update prize texture keys
 * - Update display names
 * - Update quantities
 */

import { PrizeDatabase } from '../src/database/PrizeDatabase';

console.log('🌱 Seeding database with example data\n');

// Initialize database
const dbPath = './content/prizes.db';
const db = new PrizeDatabase(dbPath);

// Create prize types
// Update these with your actual texture keys and display names
console.log('Creating prize types...');
const mainPrizeId = db.createPrize('main-prize', 'Main Prize');
console.log(`✓ Created: Main Prize (id: ${mainPrizeId})`);

const secondaryPrizeId = db.createPrize('secondary-prize', 'Secondary Prize');
console.log(`✓ Created: Secondary Prize (id: ${secondaryPrizeId})\n`);

// Create scheduled prizes for today
console.log('Creating scheduled prizes for today...');
const today = new Date().toISOString().split('T')[0];
const timeZone = '+01:00'; // Update for your timezone

const scheduledTimes = ['12:00:00', '14:00:00', '17:00:00', '19:00:00'];
for (const time of scheduledTimes) {
  const datetime = `${today}T${time}${timeZone}`;
  const id = db.createScheduledPrize(mainPrizeId, datetime);
  console.log(`✓ Created scheduled prize: ${datetime} (id: ${id})`);
}
console.log();

// Create 7 days of inventory (200 units/day)
console.log('Creating 7 days of inventory...');
for (let i = 0; i < 7; i++) {
  const date = new Date();
  date.setDate(date.getDate() + i);
  const dateStr = date.toISOString().split('T')[0];
  const id = db.createDailyInventory(secondaryPrizeId, dateStr, 200);
  console.log(`✓ Created inventory: ${dateStr} → 200x Secondary Prize (id: ${id})`);
}
console.log();

// Close database
db.close();

console.log('✅ Database seeded successfully!\n');
console.log('Summary:');
console.log('  - Prizes: 2 (main, secondary)');
console.log('  - Scheduled prizes: 4 (today)');
console.log('  - Inventory: 7 days × 200 units');
console.log(`  - Database: ${dbPath}\n`);
