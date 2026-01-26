import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import type {
  Prize,
  ScheduledPrize,
  DailyInventory,
  InventorySummary,
  ScheduledSummary,
  QRCode,
  QRCodeCount,
} from '../types/prizes';
import { getSwissDate } from '../utils/timezone';

/**
 * Prize Database Service
 *
 * Provides CRUD operations for prize management using SQLite.
 * Uses better-sqlite3 for synchronous API and prepared statement caching.
 *
 * Features:
 * - Prize definitions (reusable prizes)
 * - Scheduled prizes (time-specific awards)
 * - Daily inventory (per-day quotas with tracking)
 * - Transaction support for atomic operations
 * - In-memory mode for testing
 */
export class PrizeDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './content/prizes.db') {
    // Support in-memory database for testing
    const isMemory = dbPath === ':memory:';

    if (!isMemory) {
      // Ensure directory exists for file-based database
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Initialize SQLite connection
    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrency (only for file-based databases)
    if (!isMemory) {
      this.db.pragma('journal_mode = WAL');
    }

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Initialize schema if tables don't exist
    this.initializeSchema();
  }

  /**
   * Initialize database schema from schema.sql
   * @private
   */
  private initializeSchema(): void {
    // Check if tables already exist
    const tableCheck = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='prizes'"
    ).get();

    if (tableCheck) {
      // Tables already exist, skip initialization
      return;
    }

    // Read schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema creation
    this.db.exec(schema);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  // ========== Prize CRUD Operations ==========

  /**
   * Create a new prize definition
   * @param textureKey Unique texture key for rendering
   * @param displayName Human-readable name
   * @returns ID of created prize
   */
  createPrize(textureKey: string, displayName: string): number {
    const stmt = this.db.prepare(
      'INSERT INTO prizes (texture_key, display_name) VALUES (?, ?)'
    );
    const result = stmt.run(textureKey, displayName);
    return result.lastInsertRowid as number;
  }

  /**
   * Get prize by ID
   * @param id Prize ID
   * @returns Prize entity or null if not found
   */
  getPrizeById(id: number): Prize | null {
    const stmt = this.db.prepare('SELECT * FROM prizes WHERE id = ?');
    return stmt.get(id) as Prize | null;
  }

  /**
   * Get prize by texture key
   * @param textureKey Texture key
   * @returns Prize entity or null if not found
   */
  getPrizeByTextureKey(textureKey: string): Prize | null {
    const stmt = this.db.prepare('SELECT * FROM prizes WHERE texture_key = ?');
    return stmt.get(textureKey) as Prize | null;
  }

  /**
   * Get all prizes
   * @returns Array of all prizes
   */
  getAllPrizes(): Prize[] {
    const stmt = this.db.prepare('SELECT * FROM prizes ORDER BY created_at DESC');
    return stmt.all() as Prize[];
  }

  // ========== Scheduled Prize Operations ==========

  /**
   * Create a scheduled prize
   * @param prizeId Prize ID to schedule
   * @param datetime ISO 8601 datetime string
   * @returns ID of created scheduled prize
   */
  createScheduledPrize(prizeId: number, datetime: string): number {
    // Extract Swiss date from datetime for consistent querying
    const date = getSwissDate(new Date(datetime));

    const stmt = this.db.prepare(
      'INSERT INTO scheduled_prizes (prize_id, datetime, date) VALUES (?, ?, ?)'
    );
    const result = stmt.run(prizeId, datetime, date);
    return result.lastInsertRowid as number;
  }

  /**
   * Get scheduled prizes that are due (not yet awarded, datetime <= currentTime)
   * @param currentTime ISO 8601 datetime string
   * @returns Array of due scheduled prizes
   */
  getScheduledPrizesForTime(currentTime: string): ScheduledPrize[] {
    const stmt = this.db.prepare(`
      SELECT * FROM scheduled_prizes
      WHERE datetime <= ? AND awarded = 0
      ORDER BY datetime ASC
    `);
    return stmt.all(currentTime) as ScheduledPrize[];
  }

  /**
   * Mark a scheduled prize as awarded
   * @param id Scheduled prize ID
   */
  markScheduledPrizeAwarded(id: number): void {
    const stmt = this.db.prepare(`
      UPDATE scheduled_prizes
      SET awarded = 1, awarded_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(id);
  }

  /**
   * Get all pending (not yet awarded) scheduled prizes
   * @returns Array of pending scheduled prizes
   */
  getPendingScheduledPrizes(): ScheduledPrize[] {
    const stmt = this.db.prepare(`
      SELECT * FROM scheduled_prizes
      WHERE awarded = 0
      ORDER BY datetime ASC
    `);
    return stmt.all() as ScheduledPrize[];
  }

  /**
   * Get all awarded scheduled prizes for a specific date
   * @param date Date string in YYYY-MM-DD format (Swiss timezone)
   * @returns Array of awarded scheduled prizes for that date
   */
  getAwardedScheduledPrizesForDate(date: string): ScheduledPrize[] {
    const stmt = this.db.prepare(`
      SELECT * FROM scheduled_prizes
      WHERE awarded = 1
      AND date = ?
      ORDER BY awarded_at DESC
    `);
    return stmt.all(date) as ScheduledPrize[];
  }

  /**
   * Get scheduled prizes that were AWARDED on a specific date (Swiss timezone)
   * This is different from getAwardedScheduledPrizesForDate which filters by scheduled date.
   * Use this for promoter view to show prizes awarded today regardless of when they were scheduled.
   * @param date Date string in YYYY-MM-DD format (Swiss timezone)
   * @returns Array of scheduled prizes awarded on that date with prize display names
   */
  getPrizesAwardedOnDate(date: string): Array<ScheduledPrize & { display_name: string }> {
    const stmt = this.db.prepare(`
      SELECT sp.*, p.display_name
      FROM scheduled_prizes sp
      INNER JOIN prizes p ON sp.prize_id = p.id
      WHERE sp.awarded = 1
      AND date(sp.awarded_at) = ?
      ORDER BY sp.awarded_at DESC
    `);
    return stmt.all(date) as Array<ScheduledPrize & { display_name: string }>;
  }

  /**
   * Get all scheduled prizes for a specific date
   * @param date Date string in YYYY-MM-DD format (Swiss timezone)
   * @returns Array of all scheduled prizes for that date
   */
  getAllScheduledPrizesForDate(date: string): ScheduledPrize[] {
    const stmt = this.db.prepare(`
      SELECT * FROM scheduled_prizes
      WHERE date = ?
      ORDER BY datetime ASC
    `);
    return stmt.all(date) as ScheduledPrize[];
  }

  /**
   * Delete a scheduled prize
   * @param id Scheduled prize ID
   */
  deleteScheduledPrize(id: number): void {
    const stmt = this.db.prepare('DELETE FROM scheduled_prizes WHERE id = ?');
    stmt.run(id);
  }

  // ========== Daily Inventory Operations ==========

  /**
   * Create daily inventory for a prize
   * @param prizeId Prize ID
   * @param date Date in YYYY-MM-DD format
   * @param quantity Total quantity available
   * @returns ID of created inventory record
   */
  createDailyInventory(prizeId: number, date: string, quantity: number): number {
    const stmt = this.db.prepare(`
      INSERT INTO daily_inventory (prize_id, date, total_quantity)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(prizeId, date, quantity);
    return result.lastInsertRowid as number;
  }

  /**
   * Get daily inventory for a specific prize and date
   * @param prizeId Prize ID
   * @param date Date in YYYY-MM-DD format
   * @returns Daily inventory record or null if not found
   */
  getDailyInventory(prizeId: number, date: string): DailyInventory | null {
    const stmt = this.db.prepare(`
      SELECT * FROM daily_inventory
      WHERE prize_id = ? AND date = ?
    `);
    return stmt.get(prizeId, date) as DailyInventory | null;
  }

  /**
   * Get remaining inventory for a prize on a specific date
   * @param prizeId Prize ID
   * @param date Date in YYYY-MM-DD format
   * @returns Number of remaining items (total - awarded), or 0 if not found
   */
  getRemainingInventory(prizeId: number, date: string): number {
    const inventory = this.getDailyInventory(prizeId, date);
    if (!inventory) return 0;
    return inventory.total_quantity - inventory.awarded_quantity;
  }

  /**
   * Increment awarded quantity for a prize on a specific date
   * @param prizeId Prize ID
   * @param date Date in YYYY-MM-DD format
   */
  incrementAwardedQuantity(prizeId: number, date: string): void {
    const stmt = this.db.prepare(`
      UPDATE daily_inventory
      SET awarded_quantity = awarded_quantity + 1
      WHERE prize_id = ? AND date = ?
    `);
    stmt.run(prizeId, date);
  }

  /**
   * Get all prizes that have inventory configured
   * (Future: supports multiple inventory prizes)
   * @returns Array of prizes with inventory
   */
  getAllInventoryPrizes(): Prize[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT p.*
      FROM prizes p
      INNER JOIN daily_inventory di ON p.id = di.prize_id
      ORDER BY p.created_at DESC
    `);
    return stmt.all() as Prize[];
  }

  /**
   * Get inventory summary for a date range
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @returns Array of inventory summaries
   */
  getInventorySummary(startDate: string, endDate: string): InventorySummary[] {
    const stmt = this.db.prepare(`
      SELECT
        di.id,
        di.date,
        p.display_name as prize_name,
        di.total_quantity,
        di.awarded_quantity,
        (di.total_quantity - di.awarded_quantity) as remaining
      FROM daily_inventory di
      INNER JOIN prizes p ON di.prize_id = p.id
      WHERE di.date >= ? AND di.date <= ?
      ORDER BY di.date ASC, p.display_name ASC
    `);
    return stmt.all(startDate, endDate) as InventorySummary[];
  }

  /**
   * Get daily inventory by ID
   * @param id Daily inventory ID
   * @returns Daily inventory record or null if not found
   */
  getDailyInventoryById(id: number): DailyInventory | null {
    const stmt = this.db.prepare('SELECT * FROM daily_inventory WHERE id = ?');
    const result = stmt.get(id) as DailyInventory | undefined;
    return result || null;
  }

  /**
   * Update total quantity for a daily inventory record
   * @param id Daily inventory ID
   * @param newQuantity New total quantity (must be >= awarded_quantity)
   */
  updateDailyInventoryQuantity(id: number, newQuantity: number): void {
    const stmt = this.db.prepare(`
      UPDATE daily_inventory
      SET total_quantity = ?
      WHERE id = ?
    `);
    stmt.run(newQuantity, id);
  }

  /**
   * Delete a daily inventory record
   * @param id Daily inventory ID
   */
  deleteDailyInventory(id: number): void {
    const stmt = this.db.prepare('DELETE FROM daily_inventory WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Get scheduled prize summary
   * @param startDate Optional start date (YYYY-MM-DD) to filter by scheduled date
   * @param endDate Optional end date (YYYY-MM-DD) to filter by scheduled date
   * @returns Array of scheduled prize summaries
   */
  getScheduledSummary(startDate?: string, endDate?: string): ScheduledSummary[] {
    let query = `
      SELECT
        sp.id,
        p.display_name as prize_name,
        sp.datetime,
        sp.awarded,
        sp.awarded_at
      FROM scheduled_prizes sp
      INNER JOIN prizes p ON sp.prize_id = p.id
    `;

    const params: string[] = [];

    // Add date range filtering if parameters provided
    if (startDate && endDate) {
      query += ` WHERE date(sp.datetime) >= ? AND date(sp.datetime) <= ?`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY sp.datetime ASC`;

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as ScheduledSummary[];
  }

  // ========== Transaction Support ==========

  /**
   * Begin a transaction
   */
  beginTransaction(): void {
    this.db.prepare('BEGIN').run();
  }

  /**
   * Commit a transaction
   */
  commit(): void {
    this.db.prepare('COMMIT').run();
  }

  /**
   * Rollback a transaction
   */
  rollback(): void {
    this.db.prepare('ROLLBACK').run();
  }

  /**
   * Execute a function within a transaction
   * Automatically commits on success, rolls back on error
   * @param fn Function to execute
   * @returns Result of function
   */
  transaction<T>(fn: () => T): T {
    this.beginTransaction();
    try {
      const result = fn();
      this.commit();
      return result;
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  // ============================================================================
  // Game State Persistence Methods
  // ============================================================================

  /**
   * Get game state value by key
   * @param key State key to retrieve
   * @returns State value or null if not found
   */
  getGameState(key: string): string | null {
    const stmt = this.db.prepare('SELECT value FROM game_state WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result?.value || null;
  }

  /**
   * Set game state value by key
   * Uses UPSERT to insert or update
   * @param key State key
   * @param value State value
   */
  setGameState(key: string, value: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO game_state (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `);
    stmt.run(key, value);
  }

  /**
   * Delete game state by key
   * @param key State key to delete
   */
  deleteGameState(key: string): void {
    const stmt = this.db.prepare('DELETE FROM game_state WHERE key = ?');
    stmt.run(key);
  }

  // ============================================================================
  // Play Logging Methods
  // ============================================================================

  /**
   * Log a play to the database (guaranteed durability)
   * @param timestamp ISO timestamp of play
   * @param date Date string (YYYY-MM-DD)
   * @param prizeType Type of prize awarded
   * @param prizeId Prize identifier
   * @param displayName Display name of prize
   * @param winProbability Win probability at time of play
   * @param inventoryRemaining Optional remaining inventory
   * @param inventoryTotal Optional total inventory
   */
  logPlay(
    timestamp: string,
    date: string,
    prizeType: string,
    prizeId: string,
    displayName: string,
    winProbability: number,
    inventoryRemaining?: number,
    inventoryTotal?: number
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO play_log (
        timestamp,
        date,
        prize_type,
        prize_id,
        display_name,
        win_probability,
        inventory_remaining,
        inventory_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      timestamp,
      date,
      prizeType,
      prizeId,
      displayName,
      winProbability,
      inventoryRemaining ?? null,
      inventoryTotal ?? null
    );
  }

  /**
   * Get play count for a specific date
   * @param date Date string (YYYY-MM-DD)
   * @returns Number of plays on that date
   */
  getPlayCount(date: string): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM play_log WHERE date = ?');
    const result = stmt.get(date) as { count: number };
    return result.count;
  }

  /**
   * Get play statistics for a date
   * @param date Date string (YYYY-MM-DD)
   * @returns Play statistics breakdown
   */
  getPlayStats(date: string): {
    totalPlays: number;
    scheduledPrizes: number;
    inventoryPrizes: number;
    consolationPrizes: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as totalPlays,
        SUM(CASE WHEN prize_type = 'scheduled' THEN 1 ELSE 0 END) as scheduledPrizes,
        SUM(CASE WHEN prize_type = 'inventory' THEN 1 ELSE 0 END) as inventoryPrizes,
        SUM(CASE WHEN prize_type = 'consolation' THEN 1 ELSE 0 END) as consolationPrizes
      FROM play_log
      WHERE date = ?
    `);

    return stmt.get(date) as any;
  }

  /**
   * Get inventory prizes awarded on a specific date from play_log
   * @param date Date string (YYYY-MM-DD)
   * @returns Array of inventory prizes with display names
   */
  getInventoryPrizesAwardedOnDate(date: string): Array<{
    id: number;
    timestamp: string;
    display_name: string;
    prize_id: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT id, timestamp, display_name, prize_id
      FROM play_log
      WHERE date = ? AND prize_type = 'inventory'
      ORDER BY timestamp DESC
    `);
    return stmt.all(date) as Array<{
      id: number;
      timestamp: string;
      display_name: string;
      prize_id: string;
    }>;
  }

  /**
   * Update print status for a play by timestamp
   * @param timestamp ISO timestamp of play
   * @param status Print status ('success' or 'failed')
   */
  updatePrintStatus(timestamp: string, status: 'success' | 'failed'): void {
    const stmt = this.db.prepare(`
      UPDATE play_log SET print_status = ? WHERE timestamp = ?
    `);
    stmt.run(status, timestamp);
  }

  // ============================================================================
  // QR Code Methods
  // ============================================================================

  /**
   * Create a new QR code entry
   * @param prizeId Prize ID this code belongs to
   * @param code QR code string
   * @returns ID of created QR code
   */
  createQRCode(prizeId: number, code: string): number {
    const stmt = this.db.prepare(
      'INSERT INTO qr_codes (prize_id, code) VALUES (?, ?)'
    );
    const result = stmt.run(prizeId, code);
    return result.lastInsertRowid as number;
  }

  /**
   * Import multiple QR codes in bulk (within transaction)
   * @param prizeId Prize ID these codes belong to
   * @param codes Array of QR code strings
   * @returns Object with imported count and skipped duplicates
   */
  importQRCodes(prizeId: number, codes: string[]): { imported: number; skipped: number } {
    const insertStmt = this.db.prepare(
      'INSERT OR IGNORE INTO qr_codes (prize_id, code) VALUES (?, ?)'
    );

    let imported = 0;
    let skipped = 0;

    for (const code of codes) {
      const result = insertStmt.run(prizeId, code);
      if (result.changes > 0) {
        imported++;
      } else {
        skipped++;
      }
    }

    return { imported, skipped };
  }

  /**
   * Get next available (unused) QR code for a prize
   * @param prizeId Prize ID
   * @returns QR code entity or null if none available
   */
  getAvailableQRCode(prizeId: number): QRCode | null {
    const stmt = this.db.prepare(`
      SELECT * FROM qr_codes
      WHERE prize_id = ? AND is_used = 0
      ORDER BY id ASC
      LIMIT 1
    `);
    return stmt.get(prizeId) as QRCode | null;
  }

  /**
   * Mark a QR code as used and link to play log
   * @param id QR code ID
   * @param playLogId Optional play log ID to link
   */
  markQRCodeUsed(id: number, playLogId?: number): void {
    const stmt = this.db.prepare(`
      UPDATE qr_codes
      SET is_used = 1, used_at = datetime('now'), play_log_id = ?
      WHERE id = ?
    `);
    stmt.run(playLogId ?? null, id);
  }

  /**
   * Get QR code counts by prize type
   * @returns Array of QR code counts per prize
   */
  getQRCodeCounts(): QRCodeCount[] {
    const stmt = this.db.prepare(`
      SELECT
        p.id as prize_id,
        p.display_name as prize_name,
        COUNT(q.id) as total,
        SUM(CASE WHEN q.is_used = 1 THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN q.is_used = 0 THEN 1 ELSE 0 END) as remaining
      FROM prizes p
      LEFT JOIN qr_codes q ON p.id = q.prize_id
      GROUP BY p.id
      ORDER BY p.id ASC
    `);
    return stmt.all() as QRCodeCount[];
  }

  /**
   * Get remaining QR code count for a specific prize
   * @param prizeId Prize ID
   * @returns Number of remaining QR codes
   */
  getRemainingQRCodeCount(prizeId: number): number {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM qr_codes
      WHERE prize_id = ? AND is_used = 0
    `);
    const result = stmt.get(prizeId) as { count: number };
    return result.count;
  }

  /**
   * Delete all QR codes for a prize (for reimport)
   * @param prizeId Prize ID
   * @param unusedOnly If true, only delete unused codes
   * @returns Number of deleted codes
   */
  deleteQRCodes(prizeId: number, unusedOnly: boolean = false): number {
    const sql = unusedOnly
      ? 'DELETE FROM qr_codes WHERE prize_id = ? AND is_used = 0'
      : 'DELETE FROM qr_codes WHERE prize_id = ?';
    const stmt = this.db.prepare(sql);
    const result = stmt.run(prizeId);
    return result.changes;
  }

  /**
   * Get QR code by code string
   * @param code QR code string
   * @returns QR code entity or null
   */
  getQRCodeByCode(code: string): QRCode | null {
    const stmt = this.db.prepare('SELECT * FROM qr_codes WHERE code = ?');
    return stmt.get(code) as QRCode | null;
  }

  /**
   * Check if qr_codes table exists (for schema migration)
   * @returns true if table exists
   */
  hasQRCodesTable(): boolean {
    const stmt = this.db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='qr_codes'"
    );
    return stmt.get() !== undefined;
  }

  /**
   * Initialize QR codes table if it doesn't exist
   * Used for upgrading existing databases
   */
  initializeQRCodesTable(): void {
    if (this.hasQRCodesTable()) {
      return;
    }

    this.db.exec(`
      CREATE TABLE qr_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prize_id INTEGER NOT NULL,
        code TEXT NOT NULL UNIQUE,
        is_used INTEGER DEFAULT 0,
        used_at TEXT,
        play_log_id INTEGER,
        FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE,
        FOREIGN KEY (play_log_id) REFERENCES play_log(id) ON DELETE SET NULL
      );
      CREATE INDEX idx_qr_codes_prize_unused ON qr_codes(prize_id, is_used);
      CREATE INDEX idx_qr_codes_code ON qr_codes(code);
    `);

    console.log('PrizeDatabase: Created qr_codes table');
  }
}
