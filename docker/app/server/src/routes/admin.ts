import { Router, Request } from 'express';
import { PrizeDatabase } from '../database/PrizeDatabase';
import { isValidPrizeTextureKey } from '../../../shared/PrizeTextureKeys';
import { getSwissDate } from '../utils/timezone';
import { requireAuth, loginHandler, logoutHandler, checkAuthHandler } from '../middleware/auth';
import { printGameReceipt, ReceiptType } from '../utils/printer';
import multer from 'multer';

// Extend Express Request to include multer file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

/**
 * Admin API Routes
 *
 * Provides REST endpoints for prize management:
 * - GET /api/admin/prizes - List all prizes
 * - POST /api/admin/prizes - Create new prize
 * - GET /api/admin/scheduled - List scheduled prizes
 * - POST /api/admin/scheduled - Create scheduled prize
 * - DELETE /api/admin/scheduled/:id - Delete scheduled prize
 * - GET /api/admin/inventory - Get inventory summary
 * - POST /api/admin/inventory - Create daily inventory
 * - GET /api/admin/stats - Get current statistics
 */
export function createAdminRoutes(db: PrizeDatabase): Router {
  const router = Router();

  // ========== Authentication Routes ==========

  /**
   * POST /api/admin/login
   * Authenticate with password
   */
  router.post('/login', loginHandler);

  /**
   * POST /api/admin/logout
   * End session
   */
  router.post('/logout', logoutHandler);

  /**
   * GET /api/admin/auth/check
   * Check if authenticated
   */
  router.get('/auth/check', checkAuthHandler);

  // ========== Protected Routes (require authentication) ==========
  // All routes below require authentication

  // ========== Prize Management ==========

  /**
   * GET /api/admin/prizes
   * List all prize types
   */
  router.get('/prizes', requireAuth, (req, res) => {
    try {
      const prizes = db.getAllPrizes();
      res.json({ success: true, data: prizes });
    } catch (error) {
      console.error('Error fetching prizes:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch prizes' });
    }
  });

  /**
   * POST /api/admin/prizes
   * Create a new prize type
   * Body: { textureKey: string, displayName: string }
   */
  router.post('/prizes', requireAuth, (req, res) => {
    try {
      const { textureKey, displayName } = req.body;

      // Validate input
      if (!textureKey || !displayName) {
        return res.status(400).json({
          success: false,
          error: 'textureKey and displayName are required'
        });
      }

      // Validate texture key
      if (!isValidPrizeTextureKey(textureKey)) {
        return res.status(400).json({
          success: false,
          error: `Invalid texture key. Must be one of: ${Object.values(require('../../../shared/PrizeTextureKeys').PrizeTextureKeys).join(', ')}`
        });
      }

      const id = db.createPrize(textureKey, displayName);
      const prize = db.getPrizeById(id);

      res.json({ success: true, data: prize });
    } catch (error: any) {
      console.error('Error creating prize:', error);
      res.status(500).json({ success: false, error: 'Failed to create prize' });
    }
  });

  // ========== Scheduled Prize Management ==========

  /**
   * GET /api/admin/scheduled
   * List all scheduled prizes with summary info
   * Query params: startDate, endDate (optional, defaults to today)
   */
  router.get('/scheduled', requireAuth, (req, res) => {
    try {
      const today = getSwissDate();
      const startDate = (req.query.startDate as string) || today;
      const endDate = (req.query.endDate as string) || today;

      const scheduled = db.getScheduledSummary(startDate, endDate);
      res.json({ success: true, data: scheduled });
    } catch (error) {
      console.error('Error fetching scheduled prizes:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch scheduled prizes' });
    }
  });

  /**
   * POST /api/admin/scheduled
   * Create a new scheduled prize
   * Body: { prizeId: number, datetime: string }
   */
  router.post('/scheduled', requireAuth, (req, res) => {
    try {
      const { prizeId, datetime } = req.body;

      // Validate input
      if (!prizeId || !datetime) {
        return res.status(400).json({
          success: false,
          error: 'prizeId and datetime are required'
        });
      }

      // Validate prize exists
      const prize = db.getPrizeById(prizeId);
      if (!prize) {
        return res.status(404).json({
          success: false,
          error: 'Prize not found'
        });
      }

      // Validate datetime format (ISO 8601)
      const parsedDate = new Date(datetime);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid datetime format. Use ISO 8601 (e.g., 2025-11-24T14:00:00+01:00)'
        });
      }

      const id = db.createScheduledPrize(prizeId, datetime);

      res.json({
        success: true,
        data: {
          id,
          prize_id: prizeId,
          datetime,
          awarded: false,
          awarded_at: null
        }
      });
    } catch (error) {
      console.error('Error creating scheduled prize:', error);
      res.status(500).json({ success: false, error: 'Failed to create scheduled prize' });
    }
  });

  /**
   * DELETE /api/admin/scheduled/:id
   * Delete a scheduled prize
   */
  router.delete('/scheduled/:id', requireAuth, (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID'
        });
      }

      db.deleteScheduledPrize(id);
      res.json({ success: true, message: 'Scheduled prize deleted' });
    } catch (error) {
      console.error('Error deleting scheduled prize:', error);
      res.status(500).json({ success: false, error: 'Failed to delete scheduled prize' });
    }
  });

  // ========== Inventory Management ==========

  /**
   * GET /api/admin/inventory
   * Get inventory summary for a date range
   * Query params: startDate, endDate (optional, defaults to today)
   */
  router.get('/inventory', requireAuth, (req, res) => {
    try {
      const today = getSwissDate();
      const startDate = (req.query.startDate as string) || today;
      const endDate = (req.query.endDate as string) || today;

      const inventory = db.getInventorySummary(startDate, endDate);
      res.json({ success: true, data: inventory });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
    }
  });

  /**
   * POST /api/admin/inventory
   * Create daily inventory for a prize
   * Body: { prizeId: number, date: string, quantity: number }
   */
  router.post('/inventory', requireAuth, (req, res) => {
    try {
      const { prizeId, date, quantity } = req.body;

      // Validate input
      if (!prizeId || !date || quantity === undefined) {
        return res.status(400).json({
          success: false,
          error: 'prizeId, date, and quantity are required'
        });
      }

      // Validate prize exists
      const prize = db.getPrizeById(prizeId);
      if (!prize) {
        return res.status(404).json({
          success: false,
          error: 'Prize not found'
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      // Validate quantity
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be a non-negative number'
        });
      }

      const id = db.createDailyInventory(prizeId, date, quantity);
      const inventory = db.getDailyInventory(prizeId, date);

      res.json({ success: true, data: inventory });
    } catch (error: any) {
      console.error('Error creating inventory:', error);

      // Check for unique constraint violation
      if (error.message && error.message.includes('UNIQUE')) {
        return res.status(409).json({
          success: false,
          error: 'Inventory for this prize and date already exists'
        });
      }

      res.status(500).json({ success: false, error: 'Failed to create inventory' });
    }
  });

  /**
   * PATCH /api/admin/inventory/:id
   * Update total quantity for a daily inventory entry
   * Body: { quantity: number }
   */
  router.patch('/inventory/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      // Validate ID
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID'
        });
      }

      // Validate quantity
      if (quantity === undefined || typeof quantity !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Quantity is required and must be a number'
        });
      }

      if (quantity < 0) {
        return res.status(400).json({
          success: false,
          error: 'Quantity must be non-negative'
        });
      }

      // Check if inventory exists
      const inventory = db.getDailyInventoryById(id);
      if (!inventory) {
        return res.status(404).json({
          success: false,
          error: 'Inventory not found'
        });
      }

      // Check if new quantity is >= awarded_quantity
      if (quantity < inventory.awarded_quantity) {
        return res.status(400).json({
          success: false,
          error: `Quantity cannot be less than awarded quantity (${inventory.awarded_quantity})`,
          currentAwarded: inventory.awarded_quantity,
          minAllowed: inventory.awarded_quantity,
          attemptedValue: quantity
        });
      }

      // Update the quantity
      db.updateDailyInventoryQuantity(id, quantity);

      // Return updated inventory
      const updatedInventory = db.getDailyInventoryById(id);
      res.json({ success: true, data: updatedInventory });
    } catch (error: any) {
      console.error('Error updating inventory:', error);

      // Check for constraint violation
      if (error.message && error.message.includes('CHECK constraint')) {
        return res.status(400).json({
          success: false,
          error: 'Quantity violates database constraints'
        });
      }

      res.status(500).json({ success: false, error: 'Failed to update inventory' });
    }
  });

  /**
   * DELETE /api/admin/inventory/:id
   * Delete a daily inventory entry
   */
  router.delete('/inventory/:id', requireAuth, (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Validate ID
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid ID'
        });
      }

      // Check if inventory exists
      const inventory = db.getDailyInventoryById(id);
      if (!inventory) {
        return res.status(404).json({
          success: false,
          error: 'Inventory not found'
        });
      }

      // Delete the inventory
      db.deleteDailyInventory(id);

      res.json({ success: true, message: 'Inventory deleted' });
    } catch (error) {
      console.error('Error deleting inventory:', error);
      res.status(500).json({ success: false, error: 'Failed to delete inventory' });
    }
  });

  // ========== Statistics & Summary ==========

  /**
   * GET /api/admin/stats
   * Get current statistics summary
   * Note: Two-tier algorithm (inventory + consolation, no scheduled prizes)
   */
  router.get('/stats', requireAuth, (req, res) => {
    try {
      const today = getSwissDate();

      // Get all prizes
      const prizes = db.getAllPrizes();

      // Get today's inventory
      const todayInventory = db.getInventorySummary(today, today);

      // Get today's play statistics
      const playStats = db.getPlayStats(today);

      // Calculate inventory totals
      const inventoryTotal = todayInventory.reduce((sum, inv) => sum + inv.total_quantity, 0);
      const inventoryAwarded = todayInventory.reduce((sum, inv) => sum + inv.awarded_quantity, 0);

      res.json({
        success: true,
        data: {
          date: today,
          plays: {
            total: playStats.totalPlays
          },
          prizes: {
            list: prizes
          },
          inventory: {
            awarded: inventoryAwarded,
            total: inventoryTotal
          },
          wishes: {
            total: playStats.consolationPrizes
          }
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
    }
  });

  // ========== QR Code Management ==========

  /**
   * GET /api/admin/qr-codes
   * Get QR code counts by prize type
   */
  router.get('/qr-codes', requireAuth, (_req, res) => {
    try {
      const counts = db.getQRCodeCounts();

      res.json({
        success: true,
        data: counts,
      });
    } catch (error) {
      console.error('Error fetching QR code counts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch QR code counts',
      });
    }
  });

  /**
   * POST /api/admin/qr-codes/import
   * Import QR codes from CSV file
   * Body: multipart form with 'file' field and 'prizeId' field
   */
  router.post('/qr-codes/import', requireAuth, upload.single('file'), (req: MulterRequest, res) => {
    try {
      const file = req.file;
      const prizeId = parseInt(req.body.prizeId);

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      if (isNaN(prizeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid prizeId',
        });
      }

      // Verify prize exists
      const prize = db.getPrizeById(prizeId);
      if (!prize) {
        return res.status(404).json({
          success: false,
          error: 'Prize not found',
        });
      }

      // Parse CSV - each line is a QR code
      const content = file.buffer.toString('utf8');
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'CSV file is empty',
        });
      }

      // Import QR codes in transaction
      const result = db.transaction(() => {
        return db.importQRCodes(prizeId, lines);
      });

      console.log(`QR codes imported for ${prize.display_name}:`, result);

      res.json({
        success: true,
        data: {
          prizeId,
          prizeName: prize.display_name,
          imported: result.imported,
          skipped: result.skipped,
          total: lines.length,
        },
      });
    } catch (error: any) {
      console.error('Error importing QR codes:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to import QR codes',
      });
    }
  });

  /**
   * DELETE /api/admin/qr-codes/:prizeId
   * Delete unused QR codes for a prize
   */
  router.delete('/qr-codes/:prizeId', requireAuth, (req, res) => {
    try {
      const prizeId = parseInt(req.params.prizeId);

      if (isNaN(prizeId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid prizeId',
        });
      }

      const deleted = db.deleteQRCodes(prizeId, true); // Only delete unused

      res.json({
        success: true,
        data: {
          prizeId,
          deleted,
        },
      });
    } catch (error) {
      console.error('Error deleting QR codes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete QR codes',
      });
    }
  });

  // ========== Test Print ==========

  /**
   * POST /api/admin/test-print
   * Test print a receipt layout
   * Body: { receiptType: 'win' | 'lose' }
   */
  router.post('/test-print', requireAuth, async (req, res) => {
    try {
      const { receiptType } = req.body;

      // Validate receipt type
      const validTypes: ReceiptType[] = ['win', 'lose'];
      if (!receiptType || !validTypes.includes(receiptType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid receiptType. Must be one of: ${validTypes.join(', ')}`,
        });
      }

      // Check printer configuration
      const printerIp = process.env.PRINTER_IP;
      if (!printerIp) {
        return res.status(400).json({
          success: false,
          error: 'PRINTER_IP not configured in environment',
        });
      }

      if (process.env.PRINTER_ENABLED !== 'true') {
        return res.status(400).json({
          success: false,
          error: 'Printer is disabled (PRINTER_ENABLED != true)',
        });
      }

      console.log(`[admin] Test print requested: ${receiptType}`);

      const result = await printGameReceipt(printerIp, {
        receiptType: receiptType as ReceiptType,
        timestamp: new Date().toISOString(),
      });

      if (result.success) {
        res.json({
          success: true,
          message: `Test ${receiptType} receipt sent to printer`,
          printerIp,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Print failed',
        });
      }
    } catch (error: any) {
      console.error('Error testing print:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to test print',
      });
    }
  });

  return router;
}
