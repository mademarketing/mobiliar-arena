/**
 * Simple test script to verify BuzzerPress events trigger game animations
 *
 * This script sends a single BuzzerPress event every 5 seconds for manual testing.
 * Use this to verify the full pipeline works before running the full stress test.
 *
 * Usage: npm run test-buzzer
 */

import { io, Socket } from 'socket.io-client';
import GameEvents from '../../shared/GameEvents';

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
let socket: Socket;
let pressCount = 0;

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 BUZZER EVENT TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Server: ${serverUrl}
Interval: Every 5 seconds
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Instructions:
1. Start the server: npm run start (or npm run prod)
2. Open browser: http://localhost:3000
3. Run this script
4. Watch the browser for envelope animations

Press Ctrl+C to stop
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

socket = io(serverUrl, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});

socket.on('connect', () => {
  console.log('✅ Connected to server\n');
  console.log('Sending BuzzerPress events...\n');

  setInterval(() => {
    pressCount++;
    console.log(`[${new Date().toISOString()}] Sending BuzzerPress #${pressCount}`);
    socket.emit(GameEvents.BuzzerPress, 0);
  }, 5000);
});

socket.on(GameEvents.GamePaused, () => {
  console.log('⏸️  Game paused');
});

socket.on(GameEvents.GameResumed, () => {
  console.log('▶️  Game resumed');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('⚠️  Disconnected:', reason);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping test...');
  socket.disconnect();
  process.exit(0);
});
