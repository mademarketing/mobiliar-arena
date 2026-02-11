import PDFDocument from 'pdfkit';
import { PrizeEngine } from './PrizeEngine';
import { getSwissDate, getSwissTime } from '../utils/timezone';

/**
 * Report data structure for PDF generation
 */
interface ReportData {
  machineName: string;
  date: string;
  time: string;
  promotionEndTime: string;
  prizes: Array<{
    name: string;
    awarded: number;
    total: number;
  }>;
  lossesToday: number;
  totalPlays: number;
  winRate: string;
  qrCodes: Array<{
    category: string;
    remaining: number;
  }>;
}

/**
 * Report Generator Service
 *
 * Generates PDF reports for the Mobiliar Arena event.
 * Reports include prize distribution statistics, QR code inventory,
 * and daily operation summaries.
 */
export class ReportGenerator {
  private prizeEngine: PrizeEngine;
  private getMachineName: () => string;
  private getPromotionEndTime: () => string;

  constructor(
    prizeEngine: PrizeEngine,
    getMachineNameFn: () => string,
    getPromotionEndTimeFn: () => string
  ) {
    this.prizeEngine = prizeEngine;
    this.getMachineName = getMachineNameFn;
    this.getPromotionEndTime = getPromotionEndTimeFn;
  }

  /**
   * Generate report data from current statistics
   */
  private getReportData(): ReportData {
    const stats = this.prizeEngine.getTodayStats();
    const now = new Date();
    const swissTime = getSwissTime(now);

    // Format date for display
    const dateStr = swissTime.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const timeStr = swissTime.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Calculate win rate
    const totalPlays = stats.playStats.totalPlays;
    const totalWins = stats.playStats.inventoryPrizes;
    const winRate = totalPlays > 0
      ? ((totalWins / totalPlays) * 100).toFixed(1) + '%'
      : '0%';

    return {
      machineName: this.getMachineName(),
      date: dateStr,
      time: timeStr,
      promotionEndTime: this.getPromotionEndTime(),
      prizes: stats.prizes.map(p => ({
        name: p.name,
        awarded: p.awarded,
        total: p.total,
      })),
      lossesToday: stats.playStats.consolationPrizes,
      totalPlays,
      winRate,
      qrCodes: stats.qrCodeCounts.map(qr => ({
        category: qr.prize_name,
        remaining: qr.remaining,
      })),
    };
  }

  /**
   * Generate PDF report as a Buffer
   */
  generatePDF(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const data = this.getReportData();
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('Mobiliar Arena', { align: 'center' });
        doc.fontSize(16).font('Helvetica').text('Tagesbericht', { align: 'center' });
        doc.moveDown(0.3);

        // Machine info
        doc.fontSize(11);
        doc.text(`Maschine: ${data.machineName}`);
        doc.text(`Datum: ${data.date}`);
        doc.text(`Berichtszeit: ${data.time} Uhr`);
        doc.text(`Promotionsende: ${data.promotionEndTime} Uhr`);
        doc.moveDown(0.5);

        // Divider
        doc.strokeColor('#000000').lineWidth(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Prize table header
        doc.fontSize(13).font('Helvetica-Bold').text('Gewinne');
        doc.moveDown(0.3);

        // Table
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 280;
        const col3 = 380;
        const rowHeight = 20;

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Gewinn', col1, tableTop);
        doc.text('Heute gezogen', col2, tableTop);
        doc.text('Total hinterlegt', col3, tableTop);

        // Table rows
        doc.font('Helvetica');
        let y = tableTop + rowHeight;

        for (const prize of data.prizes) {
          doc.text(prize.name, col1, y);
          doc.text(prize.awarded.toString(), col2, y);
          doc.text(prize.total.toString(), col3, y);
          y += rowHeight;
        }

        doc.y = y + 5;
        doc.moveDown(0.5);

        // Statistics section - reset to left margin
        const leftMargin = doc.page.margins.left;
        doc.fontSize(13).font('Helvetica-Bold').text('Statistik', leftMargin, doc.y);
        doc.moveDown(0.3);

        doc.fontSize(10).font('Helvetica');
        doc.text(`Gesamtspiele: ${data.totalPlays}`, leftMargin, doc.y);
        doc.text(`Nieten: ${data.lossesToday}`, leftMargin, doc.y);
        doc.text(`Gewinnrate: ${data.winRate}`, leftMargin, doc.y);
        doc.moveDown(0.5);

        // QR codes section
        doc.fontSize(13).font('Helvetica-Bold').text('QR-Code Vorrat', leftMargin, doc.y);
        doc.moveDown(0.3);

        doc.fontSize(10).font('Helvetica');
        for (const qr of data.qrCodes) {
          doc.text(`${qr.category}: ${qr.remaining} verbleibend`, leftMargin, doc.y);
        }

        // Footer - positioned at bottom of page
        const footerY = doc.page.height - doc.page.margins.bottom - 20;
        doc.fontSize(9).fillColor('#666666');
        doc.text(
          `Generiert am ${data.date} um ${data.time} Uhr`,
          doc.page.margins.left,
          footerY,
          { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get filename for the PDF report
   */
  getFilename(): string {
    const date = getSwissDate();
    const machineName = this.getMachineName().replace(/\s+/g, '-').toLowerCase();
    return `bericht-${machineName}-${date}.pdf`;
  }
}
