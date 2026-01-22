/**
 * Converts daymark_icon.png to all required app icon sizes
 *
 * Usage: node convert-logo-to-icons.js
 * Requirements: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function convertIcons() {
  console.log('🎨 Converting daymark_icon.png to all required sizes...\n');

  const sourceFile = 'assets/icons/daymark_icon.png';

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  const conversions = [
    // Main app icons
    { output: 'assets/icons/icon.png', size: 1024, description: 'Expo Default Icon' },
    { output: 'assets/icons/icon-1024.png', size: 1024, description: 'iOS App Store / Base Icon' },
    { output: 'assets/icons/icon-512.png', size: 512, description: 'Android Play Store' },
    { output: 'assets/icons/icon-192.png', size: 192, description: 'Web/PWA Chrome' },
    { output: 'assets/icons/icon-180.png', size: 180, description: 'iOS iPhone 3x' },
    { output: 'assets/icons/icon-167.png', size: 167, description: 'iOS iPad Pro' },
    { output: 'assets/icons/icon-152.png', size: 152, description: 'iOS iPad 2x' },
    { output: 'assets/icons/icon-120.png', size: 120, description: 'iOS iPhone 2x' },
    { output: 'assets/icons/icon-87.png', size: 87, description: 'iOS iPhone 3x Settings' },
    { output: 'assets/icons/icon-80.png', size: 80, description: 'iOS iPad 2x Spotlight' },
    { output: 'assets/icons/icon-76.png', size: 76, description: 'iOS iPad' },
    { output: 'assets/icons/icon-60.png', size: 60, description: 'iOS iPhone Spotlight' },
    { output: 'assets/icons/icon-58.png', size: 58, description: 'iOS 2x Settings' },
    { output: 'assets/icons/icon-40.png', size: 40, description: 'iOS Spotlight' },
    { output: 'assets/icons/icon-29.png', size: 29, description: 'iOS Settings' },
    { output: 'assets/icons/icon-20.png', size: 20, description: 'iOS Notification' },

    // Favicon
    { output: 'assets/icons/favicon.png', size: 32, description: 'Web Favicon' },
    { output: 'assets/icons/favicon-16.png', size: 16, description: 'Web Favicon 16x16' },

    // Android adaptive icon (slightly larger for safe zone)
    { output: 'assets/icons/adaptive-icon.png', size: 432, description: 'Android Adaptive Icon' },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const conversion of conversions) {
    try {
      await sharp(sourceFile)
        .resize(conversion.size, conversion.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ quality: 100 })
        .toFile(conversion.output);

      console.log(`✓ ${conversion.output}`);
      console.log(`  ${conversion.size}x${conversion.size} - ${conversion.description}\n`);
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
    console.log('✅ All icons have been updated with the new Daymark logo!');
    console.log('\nNext steps:');
    console.log('1. Verify icons look correct in assets/icons/');
    console.log('2. Test in iOS/Android simulators');
    console.log('3. Build new APK/IPA\n');
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
convertIcons().catch(error => {
  console.error('❌ Conversion failed:', error);
  process.exit(1);
});
