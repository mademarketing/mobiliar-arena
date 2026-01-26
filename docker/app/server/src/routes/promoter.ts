import { Router } from 'express';
import { PrizeEngine } from '../services/PrizeEngine';
import { PrizeDatabase } from '../database/PrizeDatabase';
import {
  requirePromoterAuth,
  promoterLoginHandler,
  promoterLogoutHandler,
  checkPromoterAuthHandler
} from '../middleware/auth';

/**
 * Promoter API Routes
 *
 * Provides endpoints for promoter interface:
 * - POST /api/promoter/login - Authenticate
 * - POST /api/promoter/logout - End session
 * - GET /api/promoter/auth/check - Check auth status
 * - GET /api/promoter/stats - Get today's statistics
 * - POST /api/promoter/pause - Pause the game
 * - POST /api/promoter/resume - Resume the game
 * - GET /api/promoter/settings - Get current settings
 * - PUT /api/promoter/settings - Update settings
 * - GET /api/promoter/trefferplan - Get available Trefferplan configs
 * - GET /api/promoter/qr-codes - Get QR code counts
 */
export function createPromoterRoutes(
  prizeEngine: PrizeEngine,
  getPausedFn: () => boolean,
  setPausedFn: (paused: boolean) => void,
  prizeDatabase: PrizeDatabase,
  getPromotionEndTimeFn?: () => string,
  setPromotionEndTimeFn?: (time: string) => void,
  getPauseTextFn?: () => string,
  setPauseTextFn?: (text: string) => void,
  emitReloadFn?: () => void
): Router {
  const router = Router();

  // ========== Authentication Routes ==========

  /**
   * POST /api/promoter/login
   * Authenticate with promoter password
   */
  router.post('/login', promoterLoginHandler);

  /**
   * POST /api/promoter/logout
   * End promoter session
   */
  router.post('/logout', promoterLogoutHandler);

  /**
   * GET /api/promoter/auth/check
   * Check if promoter is authenticated
   */
  router.get('/auth/check', checkPromoterAuthHandler);

  // ========== Protected Routes (require authentication) ==========

  /**
   * GET /api/promoter/stats
   * Get today's game statistics for promoter interface
   */
  router.get('/stats', requirePromoterAuth, (_req, res) => {
    try {
      const stats = prizeEngine.getTodayStats();

      // Get inventory prizes awarded today from play_log
      const inventoryPrizesToday = prizeDatabase.getInventoryPrizesAwardedOnDate(stats.date);

      // Format response for promoter interface
      // Note: Two-tier algorithm (inventory + consolation, no scheduled prizes)
      const response = {
        success: true,
        data: {
          date: stats.date,
          totalPlays: stats.playStats.totalPlays,
          prizes: {
            inventory: stats.playStats.inventoryPrizes,
            consolation: stats.playStats.consolationPrizes,
          },
          awarded: {
            inventory: inventoryPrizesToday.map(prize => ({
              id: prize.id,
              timestamp: prize.timestamp,
              prizeId: prize.prize_id,
              displayName: prize.display_name,
            })),
          },
          isPaused: getPausedFn(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching promoter stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  });

  /**
   * POST /api/promoter/pause
   * Pause the game
   */
  router.post('/pause', requirePromoterAuth, (_req, res) => {
    try {
      setPausedFn(true);
      console.log('Game paused via promoter interface');

      res.json({
        success: true,
        isPaused: true,
        message: 'Game paused successfully',
      });
    } catch (error) {
      console.error('Error pausing game:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to pause game',
      });
    }
  });

  /**
   * POST /api/promoter/resume
   * Resume the game
   */
  router.post('/resume', requirePromoterAuth, (_req, res) => {
    try {
      setPausedFn(false);
      console.log('Game resumed via promoter interface');

      res.json({
        success: true,
        isPaused: false,
        message: 'Game resumed successfully',
      });
    } catch (error) {
      console.error('Error resuming game:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resume game',
      });
    }
  });

  // ========== Settings Endpoints ==========

  /**
   * GET /api/promoter/settings
   * Get current promoter settings
   */
  router.get('/settings', requirePromoterAuth, (_req, res) => {
    try {
      const response = {
        success: true,
        data: {
          promotionEndTime: getPromotionEndTimeFn?.() || '18:00',
          isPaused: getPausedFn(),
          pauseText: getPauseTextFn?.() || 'Pause',
          trefferplan: prizeEngine.getActiveTrefferplan(),
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settings',
      });
    }
  });

  /**
   * PUT /api/promoter/settings
   * Update promoter settings
   * Body: { promotionEndTime?: string, pauseText?: string, trefferplan?: string }
   */
  router.put('/settings', requirePromoterAuth, (req, res) => {
    try {
      const { promotionEndTime, pauseText, trefferplan } = req.body;
      let shouldReload = false;

      // Update promotion end time
      if (promotionEndTime !== undefined && setPromotionEndTimeFn) {
        // Validate time format (HH:MM)
        if (!/^\d{2}:\d{2}$/.test(promotionEndTime)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid time format. Use HH:MM',
          });
        }
        setPromotionEndTimeFn(promotionEndTime);
        console.log('Promotion end time updated:', promotionEndTime);
        shouldReload = true;
      }

      // Update pause text
      if (pauseText !== undefined && setPauseTextFn) {
        setPauseTextFn(pauseText);
        console.log('Pause text updated:', pauseText);
      }

      // Update Trefferplan
      if (trefferplan !== undefined) {
        const success = prizeEngine.setActiveTrefferplan(trefferplan);
        if (!success) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Trefferplan key',
          });
        }
        shouldReload = true;
      }

      // Reload frontend if promotionEndTime or trefferplan changed
      if (shouldReload && emitReloadFn) {
        console.log('Emitting reload event to frontend');
        emitReloadFn();
      }

      res.json({
        success: true,
        data: {
          promotionEndTime: getPromotionEndTimeFn?.() || '18:00',
          isPaused: getPausedFn(),
          pauseText: getPauseTextFn?.() || 'Pause',
          trefferplan: prizeEngine.getActiveTrefferplan(),
        },
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settings',
      });
    }
  });

  /**
   * GET /api/promoter/trefferplan
   * Get available Trefferplan configurations
   */
  router.get('/trefferplan', requirePromoterAuth, (_req, res) => {
    try {
      const configs = prizeEngine.getTrefferplanConfigs();
      const active = prizeEngine.getActiveTrefferplan();

      res.json({
        success: true,
        data: {
          active,
          configs: Object.entries(configs).map(([key, config]) => ({
            key,
            name: config.name,
            description: config.description,
            prizes: config.prizes,
            isActive: key === active,
          })),
        },
      });
    } catch (error) {
      console.error('Error fetching Trefferplan configs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch Trefferplan configurations',
      });
    }
  });

  // ========== QR Code Status (read-only) ==========

  /**
   * GET /api/promoter/qr-codes
   * Get QR code counts by prize type (read-only for promoter)
   * Import/delete operations are in admin routes
   */
  router.get('/qr-codes', requirePromoterAuth, (_req, res) => {
    try {
      const counts = prizeDatabase.getQRCodeCounts();

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

  return router;
}
