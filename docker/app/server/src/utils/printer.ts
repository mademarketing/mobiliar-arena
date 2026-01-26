import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

interface PrintData {
  displayName: string;
  prizeId: string;
  timestamp: string;
}

/** Receipt type for different game outcomes */
export type ReceiptType = 'win' | 'lose';

/** Data for printing game receipts */
export interface GameReceiptData {
  receiptType: ReceiptType;
  displayName?: string;
  prizeId?: string;
  timestamp: string;
}

/** Cached image data */
interface ImageData {
  context: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Image cache to avoid reloading */
const imageCache: Map<string, ImageData | null> = new Map();

/** Clear the image cache to reload images */
export function clearImageCache(): void {
  imageCache.clear();
  console.log('[printer] Image cache cleared');
}

/** Assets directory path */
const ASSETS_DIR = path.join(__dirname, '../../assets/print');

/**
 * Load a PNG image from the assets folder
 * Returns null if image doesn't exist or fails to load
 */
async function loadPrintImage(filename: string): Promise<ImageData | null> {
  if (imageCache.has(filename)) {
    return imageCache.get(filename) || null;
  }

  const imagePath = path.join(ASSETS_DIR, filename);

  try {
    if (!fs.existsSync(imagePath)) {
      console.warn(`[printer] Image not found: ${imagePath}`);
      imageCache.set(filename, null);
      return null;
    }

    const data = fs.readFileSync(imagePath);
    const png = PNG.sync.read(data);

    const imageData: ImageData = {
      context: new Uint8ClampedArray(png.data),
      width: png.width,
      height: png.height
    };

    imageCache.set(filename, imageData);
    console.log(`[printer] Loaded image: ${filename} (${png.width}x${png.height})`);
    return imageData;
  } catch (error) {
    console.error(`[printer] Failed to load image ${filename}:`, error);
    imageCache.set(filename, null);
    return null;
  }
}

/**
 * Scale image to fit receipt width (max 576 pixels for 80mm paper)
 */
function scaleImageForReceipt(image: ImageData, maxWidth: number = 400): ImageData {
  if (image.width <= maxWidth) {
    return image;
  }

  const scale = maxWidth / image.width;
  const newWidth = Math.floor(image.width * scale);
  const newHeight = Math.floor(image.height * scale);

  const newContext = new Uint8ClampedArray(newWidth * newHeight * 4);

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x / scale);
      const srcY = Math.floor(y / scale);
      const srcIdx = (srcY * image.width + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;

      newContext[dstIdx] = image.context[srcIdx];
      newContext[dstIdx + 1] = image.context[srcIdx + 1];
      newContext[dstIdx + 2] = image.context[srcIdx + 2];
      newContext[dstIdx + 3] = image.context[srcIdx + 3];
    }
  }

  return { context: newContext, width: newWidth, height: newHeight };
}

/**
 * StarWebPRNT helper class for mC-Print3
 * Based on Star Micronics StarWebPRNT SDK
 */
export class StarWebPRNT {
  private url: string;

  constructor(printerIp: string) {
    this.url = printerIp.startsWith('http') ? printerIp : `http://${printerIp}`;
  }

  private analysisEnumAttribute(name: string, value: any, pattern: RegExp): string {
    if (value !== undefined) {
      if (!pattern.test(value)) throw Error(`Argument "${name}" is invalid.`);
      return ` ${name}="${value}"`;
    }
    return '';
  }

  private analysisValueAttribute(name: string, value: any, min: number, max: number): string {
    if (value !== undefined) {
      if (value < min || value > max) throw Error(`Argument "${name}" is invalid.`);
      return ` ${name}="${value}"`;
    }
    return '';
  }

  createAlignmentElement(options?: { position?: 'left' | 'center' | 'right' }): string {
    let a = '<alignment';
    if (options) {
      a += this.analysisEnumAttribute('position', options.position, /^(left|center|right)$/);
    }
    return a + '/>';
  }

  createTextElement(options: {
    data?: string;
    emphasis?: 'true' | 'false' | boolean;
    width?: number;
    height?: number;
    codepage?: string;
  }): string {
    if (!options) throw Error('Argument is undefined.');

    let a = '<text';
    a += this.analysisEnumAttribute('emphasis', options.emphasis?.toString(), /^(false|true)$/);
    a += this.analysisValueAttribute('width', options.width, 1, 6);
    a += this.analysisValueAttribute('height', options.height, 1, 6);
    a += this.analysisEnumAttribute(
      'codepage',
      options.codepage,
      /^(cp(437|737|772|774|851|852|855|857|858|860|861|862|863|864|865|866|869|874|928|932|998|999|1001|1250|1251|1252|2001|3001|3002|3011|3012|3021|3041|3840|3841|3843|3844|3845|3846|3847|3848)|utf8|blank|shift_jis|gb18030|gb2312|big5|korea)$/
    );

    if (options.data !== undefined) {
      a += '>';
      a += this.encodeEscapeSequenceBuilder(options.data);
      a += '</text>';
    } else {
      a += '/>';
    }

    return a;
  }

  createFeedElement(options: { line?: number; unit?: number }): string {
    if (!options) throw Error('Argument is undefined.');
    if (options.line === undefined && options.unit === undefined) {
      throw Error('Argument "line / unit" is undefined.');
    }

    let a = '<feed';
    a += this.analysisValueAttribute('line', options.line, 1, 255);
    a += this.analysisValueAttribute('unit', options.unit, 1, 255);
    return a + '/>';
  }

  createCutPaperElement(options?: { feed?: 'true' | 'false' | boolean; type?: 'full' | 'partial' }): string {
    let a = '<cutpaper';
    if (options) {
      a += this.analysisEnumAttribute('feed', options.feed?.toString(), /^(false|true)$/);
      a += this.analysisEnumAttribute('type', options.type, /^(full|partial)$/);
    }
    return a + '/>';
  }

  createQrCodeElement(options: {
    data: string;
    model?: 'model1' | 'model2';
    level?: 'level_l' | 'level_m' | 'level_q' | 'level_h';
    cell?: number;
  }): string {
    if (!options) throw Error('Argument is undefined.');

    let a = '<qrcode';
    a += this.analysisEnumAttribute('model', options.model, /^(model[12])$/);
    a += this.analysisEnumAttribute('level', options.level, /^(level_[lmqh])$/);
    a += this.analysisValueAttribute('cell', options.cell, 1, 8);

    if (options.data === undefined) throw Error('Argument "data" is undefined.');
    a += '>' + this.encodeEscapeSequenceBinary(options.data);
    return a + '</qrcode>';
  }

  createBitImageElement(options: {
    context: Uint8ClampedArray;
    width: number;
    height: number;
  }): string {
    if (!options) throw Error('Argument is undefined.');

    let a = '<bitimage';
    a += this.analysisValueAttribute('width', options.width, 0, 65535);
    a += this.analysisValueAttribute('height', options.height, 0, 65535);

    if (options.context === undefined) throw Error('Argument "context" is undefined.');
    a += '>' + this.encodeRasterImage(options.context, options.width, options.height);
    return a + '</bitimage>';
  }

  async sendXMLRequest(data: string): Promise<{ success: boolean; response?: string; error?: string }> {
    let xml = '<StarWebPrint xmlns="http://www.star-m.jp" xmlns:i="http://www.w3.org/2001/XMLSchema-instance"><Request>';
    xml += this.encodeEscapeSequence('<root>' + data + '</root>');
    xml += '</Request></StarWebPrint>';

    console.log(`[printer] Sending to: ${this.url}/StarWebPRNT/SendMessage`);

    try {
      const response = await axios.post(`${this.url}/StarWebPRNT/SendMessage`, xml, {
        timeout: 5000,
        headers: { 'Content-Type': 'text/xml; charset=utf-8' }
      });
      console.log(`[printer] Response status: ${response.status}`);
      return { success: true, response: response.data };
    } catch (error: any) {
      console.log(`[printer] ERROR: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private encodeEscapeSequence(a: string): string {
    const b = /[<>&]/g;
    if (b.test(a)) {
      a = a.replace(b, function (char) {
        switch (char) {
          case '<': return '&lt;';
          case '>': return '&gt;';
        }
        return '&amp;';
      });
    }
    return a;
  }

  private encodeEscapeSequenceBuilder(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);

    let result = '';
    for (const byte of bytes) {
      if (byte === 0x5c) {
        result += '\\\\';
      } else if (byte <= 0x20 || byte === 0x26 || byte === 0x3c || byte === 0x3e || byte >= 0x7f) {
        result += '\\x' + ('0' + byte.toString(16)).slice(-2);
      } else {
        result += String.fromCharCode(byte);
      }
    }
    return result;
  }

  private encodeEscapeSequenceBinary(str: string): string {
    return this.encodeEscapeSequenceBuilder(str);
  }

  private encodeRasterImage(imageData: Uint8ClampedArray, width: number, height: number): string {
    const ditherMatrix = [
      [-254, -126, -222, -94, -246, -118, -214, -86],
      [-62, -190, -30, -158, -54, -182, -22, -150],
      [-206, -78, -238, -110, -198, -70, -230, -102],
      [-14, -142, -46, -174, -6, -134, -38, -166],
      [-242, -114, -210, -82, -250, -122, -218, -90],
      [-50, -178, -18, -146, -58, -186, -26, -154],
      [-194, -66, -226, -98, -202, -74, -234, -106],
      [-2, -130, -34, -162, -10, -138, -42, -170],
    ];

    let binary = '';
    let pixelIndex = 0;

    for (let y = 0; y < height; y++) {
      let byteValue = 0;
      let bitMask = 128;

      for (let x = 0; x < width; x++) {
        const r = imageData[pixelIndex];
        const g = imageData[pixelIndex + 1];
        const b = imageData[pixelIndex + 2];
        const a = imageData[pixelIndex + 3];

        const gray = ((30 * r + 59 * g + 11 * b) * a + 12800) / 25500 - a;

        if (gray < ditherMatrix[y & 7][x & 7]) {
          byteValue |= bitMask;
        }

        pixelIndex += 4;
        bitMask >>= 1;

        if (bitMask === 0) {
          binary += String.fromCharCode(byteValue);
          byteValue = 0;
          bitMask = 128;
        }
      }

      if (bitMask !== 128) {
        binary += String.fromCharCode(byteValue);
      }
    }

    let base64 = '';
    const len = binary.length;
    binary += '\x00\x00';

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    for (let i = 0; i < len; i += 3) {
      const triplet =
        (binary.charCodeAt(i) << 16) |
        (binary.charCodeAt(i + 1) << 8) |
        binary.charCodeAt(i + 2);

      base64 +=
        chars.charAt((triplet >> 18) & 63) +
        chars.charAt((triplet >> 12) & 63) +
        chars.charAt((triplet >> 6) & 63) +
        chars.charAt(triplet & 63);
    }

    switch (len % 3) {
      case 1: return base64.slice(0, -2) + '==';
      case 2: return base64.slice(0, -1) + '=';
    }
    return base64;
  }
}

/**
 * Print a basic receipt
 */
export async function printReceipt(
  printerIp: string,
  data: PrintData
): Promise<{ success: boolean; error?: string; response?: string }> {
  console.log(`[printer] printReceipt called with IP: ${printerIp}`);

  if (!printerIp) {
    return { success: false, error: 'No printer configured' };
  }

  const printer = new StarWebPRNT(printerIp);
  const qrData = `PRIZE|${data.prizeId}|${data.timestamp}`;

  let request = '';

  request += printer.createAlignmentElement({ position: 'center' });

  request += printer.createTextElement({
    data: 'CONGRATULATIONS!\n\n',
    emphasis: true,
    width: 2,
    height: 2,
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: 'You won:\n',
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: `${data.displayName}\n\n`,
    emphasis: true,
    width: 2,
    height: 2,
    codepage: 'utf8',
  });

  request += printer.createQrCodeElement({
    model: 'model2',
    level: 'level_l',
    cell: 6,
    data: qrData
  });

  request += printer.createFeedElement({ line: 2 });

  request += printer.createTextElement({
    data: 'Redeem your prize\nat our booth\n\n',
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: `${new Date(data.timestamp).toLocaleString()}\n`,
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: `ID: ${data.prizeId}\n`,
    codepage: 'utf8',
  });

  request += printer.createFeedElement({ line: 3 });
  request += printer.createCutPaperElement({ feed: true, type: 'full' });

  return printer.sendXMLRequest(request);
}

/**
 * Build win receipt layout
 */
async function buildWinReceipt(printer: StarWebPRNT, displayName?: string): Promise<string> {
  let request = '';

  request += printer.createAlignmentElement({ position: 'center' });

  request += printer.createTextElement({
    data: 'WINNER!\n\n',
    emphasis: true,
    width: 2,
    height: 2,
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: 'Congratulations!\nYou won:\n\n',
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: `${displayName || 'A Prize'}\n\n`,
    emphasis: true,
    width: 2,
    height: 1,
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: 'Redeem your prize\nat our booth.\n\n',
    codepage: 'utf8',
  });

  request += printer.createFeedElement({ line: 3 });
  request += printer.createCutPaperElement({ feed: true, type: 'full' });

  return request;
}

/**
 * Build lose receipt layout
 */
async function buildLoseReceipt(printer: StarWebPRNT): Promise<string> {
  let request = '';

  request += printer.createAlignmentElement({ position: 'center' });

  request += printer.createTextElement({
    data: 'Thanks for playing!\n\n',
    emphasis: true,
    codepage: 'utf8',
  });

  request += printer.createTextElement({
    data: 'Better luck next time!\n',
    codepage: 'utf8',
  });

  request += printer.createFeedElement({ line: 3 });
  request += printer.createCutPaperElement({ feed: true, type: 'full' });

  return request;
}

/**
 * Print a game receipt based on the outcome type
 */
export async function printGameReceipt(
  printerIp: string,
  data: GameReceiptData
): Promise<{ success: boolean; error?: string; response?: string }> {
  console.log(`[printer] printGameReceipt called with IP: ${printerIp}`);
  console.log(`[printer] Receipt type: ${data.receiptType}`);

  if (!printerIp) {
    return { success: false, error: 'No printer configured' };
  }

  const printer = new StarWebPRNT(printerIp);

  let request: string;

  switch (data.receiptType) {
    case 'win':
      request = await buildWinReceipt(printer, data.displayName);
      break;
    case 'lose':
      request = await buildLoseReceipt(printer);
      break;
    default:
      request = await buildLoseReceipt(printer);
  }

  return printer.sendXMLRequest(request);
}
