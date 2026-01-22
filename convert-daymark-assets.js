/**
 * Daymark Asset Converter
 * Converts SVG source files to PNG at required sizes
 *
 * Usage: node convert-daymark-assets.js
 *
 * Requirements: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertAssets() {
  console.log('🎨 Converting Daymark assets to PNG...\n');

  const conversions = [
    // Main app icon - multiple sizes from single source
    {
      input: 'assets/icons/icon-1024.svg',
      output: 'assets/icons/icon-1024.png',
      width: 1024,
      height: 1024,
      description: 'iOS App Store / Base Icon'
    },
    {
      input: 'assets/icons/icon-1024.svg',
      output: 'assets/icons/icon.png',
      width: 1024,
      height: 1024,
      description: 'Expo Default Icon'
    },
    {
      input: 'assets/icons/icon-1024.svg',
      output: 'assets/icons/icon-512.png',
      width: 512,
      height: 512,
      description: 'Android Play Store'
    },
    {
      input: 'assets/icons/icon-1024.svg',
      output: 'assets/icons/icon-192.png',
      width: 192,
      height: 192,
      description: 'Web/PWA Chrome'
    },
    {
      input: 'assets/icons/icon-1024.svg',
      output: 'assets/icons/icon-180.png',
      width: 180,
      height: 180,
      description: 'iOS iPhone 3x'
    },
    {
      input: 'assets/icons/icon-1024.svg',
      output: 'assets/icons/icon-120.png',
      width: 120,
      height: 120,
      description: 'iOS iPhone 2x'
    },

    // Android adaptive icon foreground
    {
      input: 'assets/icons/adaptive-icon-foreground.svg',
      output: 'assets/icons/adaptive-icon.png',
      width: 432,
      height: 432,
      description: 'Android Adaptive Icon',
      preserveTransparency: true
    },

    // Splash screen
    {
      input: 'assets/branding/splash-daymark.svg',
      output: 'assets/branding/splash.png',
      width: 1242,
      height: 2688,
      description: 'iPhone Splash Screen'
    },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const conversion of conversions) {
    try {
      // Check if input file exists
      if (!fs.existsSync(conversion.input)) {
        console.error(`✗ Input not found: ${conversion.input}`);
        errorCount++;
        continue;
      }

      // Ensure output directory exists
      const outputDir = path.dirname(conversion.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Convert with Sharp
      await sharp(conversion.input)
        .resize(conversion.width, conversion.height, {
          fit: 'contain',
          background: conversion.preserveTransparency
            ? { r: 0, g: 0, b: 0, alpha: 0 }
            : { r: 47, g: 61, b: 76, alpha: 1 } // #2f3d4c for non-transparent
        })
        .png({ quality: 100 })
        .toFile(conversion.output);

      console.log(`✓ ${conversion.output}`);
      console.log(`  ${conversion.width}x${conversion.height} - ${conversion.description}\n`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed: ${conversion.output}`);
      console.error(`  Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('═══════════════════════════════════════');
  console.log(`✅ Conversion complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors:  ${errorCount}`);
  console.log('═══════════════════════════════════════\n');

  if (successCount > 0) {
    console.log('Next steps:');
    console.log('1. Verify icons in assets/icons/');
    console.log('2. Check splash screen in assets/branding/');
    console.log('3. Test in iOS/Android simulators');
    console.log('4. Build new APK/IPA\n');
  }

  if (errorCount > 0) {
    console.log('⚠️  Some conversions failed. Check error messages above.');
    process.exit(1);
  }
}

// Check if Sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.error('❌ Sharp is not installed!');
  console.error('\nInstall it with:');
  console.error('  npm install sharp --save-dev\n');
  process.exit(1);
}

// Run conversion
convertAssets().catch(error => {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
});
