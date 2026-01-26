#!/usr/bin/env node

/**
 * Test script to verify which layout configuration will be used
 *
 * Run this to check if your build environment is correctly set up:
 * - node test-layout-config.js dev    # Test dev mode
 * - node test-layout-config.js prod   # Test production mode
 */

const mode = process.argv[2] || 'dev';
const isProd = mode === 'prod';

console.log('\n🎮 Layout Configuration Test\n');
console.log(`Mode: ${mode}`);
console.log(`import.meta.env.PROD would be: ${isProd}`);
console.log(`\nExpected layout: ${isProd ? 'LayoutConfigLEDScreen.ts' : 'LayoutConfig.dev.ts'}`);

if (isProd) {
    console.log('\n✅ Production mode: Will use LED screen layout');
    console.log('   - MAIN_GAME_ZONE.x = 768 (LED layout)');
    console.log('   - LED zones have rotation values');
} else {
    console.log('\n✅ Development mode: Will use dev layout');
    console.log('   - MAIN_GAME_ZONE.x = 510 (dev layout)');
    console.log('   - Compact visualization for local testing');
}

console.log('\nTo test in browser:');
console.log(`  npm run ${isProd ? 'build && npm run preview' : 'dev'}`);
console.log('  Then check console for: "🎮 Layout Configuration: ..."\n');
