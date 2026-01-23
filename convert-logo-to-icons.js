/**
 * Converts daymark_icon.png to all required app icon sizes
 *
 * Usage: node convert-logo-to-icons.js
 * Requirements: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
// path is unused; keep imports minimal

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

  // Splash screen sizes - centered logo on background
  const splashConversions = [
    { output: 'assets/branding/splash.png', width: 1242, height: 2688, description: 'Default Splash Screen' },
    { output: 'assets/branding/splash-1536x2048.png', width: 1536, height: 2048, description: 'iPad Pro 12.9"' },
    { output: 'assets/branding/splash-1668x2224.png', width: 1668, height: 2224, description: 'iPad Pro 12.9" Gen 3' },
    { output: 'assets/branding/splash-1620x2160.png', width: 1620, height: 2160, description: 'iPad Pro 10.5"' },
    { output: 'assets/branding/splash-750x1334.png', width: 750, height: 1334, description: 'iPhone 8' },
    { output: 'assets/branding/splash-828x1792.png', width: 828, height: 1792, description: 'iPhone 11' },
    { output: 'assets/branding/splash-1125x2436.png', width: 1125, height: 2436, description: 'iPhone X/XS/11 Pro' },
    { output: 'assets/branding/splash-1242x2688.png', width: 1242, height: 2688, description: 'iPhone XS Max/11 Pro Max' },
  ];

  let successCount = 0;
  let errorCount = 0;

  // Generate icons
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

  // Generate splash screens
  console.log('\n🖼️  Generating splash screens...\n');
  for (const splash of splashConversions) {
    try {
      // Calculate logo size (about 1/3 of screen width)
      const logoSize = Math.floor(splash.width * 0.33);

      await sharp(sourceFile)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: Math.floor((splash.height - logoSize) / 2),
          bottom: Math.floor((splash.height - logoSize) / 2),
          left: Math.floor((splash.width - logoSize) / 2),
          right: Math.floor((splash.width - logoSize) / 2),
          background: { r: 47, g: 61, b: 76, alpha: 1 } // #2f3d4c
        })
        .png({ quality: 100 })
        .toFile(splash.output);

      console.log(`✓ ${splash.output}`);
      console.log(`  ${splash.width}x${splash.height} - ${splash.description}\n`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed: ${splash.output}`);
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
} catch {
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
