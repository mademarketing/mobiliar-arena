import { Router } from 'express';
import { PrizeEngine } from '../services/PrizeEngine';
import { ReportGenerator } from '../services/ReportGenerator';
import { getSwissDate, getSwissTime } from '../utils/timezone';

/**
 * Dashboard API Routes
 *
 * Provides public (no auth required) endpoints for the dashboard display:
 * - GET /api/dashboard - Get current dashboard data
 */
export function createDashboardRoutes(
  prizeEngine: PrizeEngine,
  getPausedFn: () => boolean,
  getPromotionEndTimeFn: () => string,
  getMachineNameFn: () => string
): Router {
  const router = Router();

  /**
   * GET /api/dashboard
   * Get current dashboard data (public, no auth required)
   */
  router.get('/', (_req, res) => {
    try {
      const stats = prizeEngine.getTodayStats();
      const now = new Date();
      const swissTime = getSwissTime(now);

      // Format date and time for display
      const dateStr = swissTime.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const timeStr = swissTime.toLocaleTimeString('de-CH', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' Uhr';

      // Calculate win rate
      const totalPlays = stats.playStats.totalPlays;
      const totalWins = stats.playStats.inventoryPrizes;
      const winRate = totalPlays > 0
        ? ((totalWins / totalPlays) * 100).toFixed(1) + '%'
        : '0%';

      // Build response matching spec format
      const response = {
        success: true,
        data: {
          machineName: getMachineNameFn(),
          date: dateStr,
          time: timeStr,
          promotionEndTime: getPromotionEndTimeFn() + ' Uhr',
          isPaused: getPausedFn(),
          playsToday: totalPlays,
          prizes: stats.prizes.map(p => ({
            id: p.id,
            name: p.name,
            textureKey: p.textureKey,
            awarded: p.awarded,
            total: p.total,
            remaining: p.remaining,
          })),
          lossesToday: stats.playStats.consolationPrizes,
          winRate,
          qrCodes: stats.qrCodeCounts.map(qr => ({
            prizeId: qr.prize_id,
            category: qr.prize_name,
            total: qr.total,
            used: qr.used,
            remaining: qr.remaining,
          })),
          activeTrefferplan: stats.activeTrefferplan,
          trefferplanName: stats.trefferplanConfig?.name || stats.activeTrefferplan,
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
      });
    }
  });

  /**
   * GET /api/dashboard/report
   * Download PDF report (public, no auth required)
   */
  router.get('/report', async (_req, res) => {
    try {
      const reportGenerator = new ReportGenerator(
        prizeEngine,
        getMachineNameFn,
        getPromotionEndTimeFn
      );

      const pdfBuffer = await reportGenerator.generatePDF();
      const filename = reportGenerator.getFilename();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report',
      });
    }
  });

  return router;
}
