/**
 * Update Android native launcher icons with daymark_icon.png
 * This updates the icons that actually show on Android devices
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function updateAndroidIcons() {
  console.log('🤖 Updating Android launcher icons...\n');

  const sourceFile = 'assets/icons/daymark_icon.png';

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Source file not found: ${sourceFile}`);
    process.exit(1);
  }

  // Android mipmap icon sizes
  const iconSizes = [
    { folder: 'mipmap-mdpi', size: 48 },
    { folder: 'mipmap-hdpi', size: 72 },
    { folder: 'mipmap-xhdpi', size: 96 },
    { folder: 'mipmap-xxhdpi', size: 144 },
    { folder: 'mipmap-xxxhdpi', size: 192 },
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const { folder, size } of iconSizes) {
    const folderPath = path.join('android', 'app', 'src', 'main', 'res', folder);

    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️  Folder not found: ${folderPath}, skipping...`);
      continue;
    }

    // Update all three icon variants
    const iconFiles = [
      'ic_launcher.png',
      'ic_launcher_round.png',
      'ic_launcher_foreground.png'
    ];

    for (const iconFile of iconFiles) {
      const outputPath = path.join(folderPath, iconFile);

      try {
        await sharp(sourceFile)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({ quality: 100 })
          .toFile(outputPath);

        console.log(`✓ ${outputPath}`);
        console.log(`  ${size}x${size}\n`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed: ${outputPath}`);
        console.error(`  Error: ${error.message}\n`);
        errorCount++;
      }
    }
  }

  console.log('═══════════════════════════════════════');
  console.log(`✅ Android icon update complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors:  ${errorCount}`);
  console.log('═══════════════════════════════════════\n');

  if (successCount > 0) {
    console.log('✅ Android launcher icons updated with new Daymark logo!');
    console.log('\nNext steps:');
    console.log('1. Clean and rebuild APK: cd android && ./gradlew clean assembleRelease');
    console.log('2. Install new APK on device');
    console.log('3. You may need to clear app cache or reinstall to see the new icon\n');
  }

  if (errorCount > 0) {
    console.log('⚠️  Some icons failed to update. Check error messages above.');
    process.exit(1);
  }
}

// Run update
updateAndroidIcons().catch(error => {
  console.error('❌ Update failed:', error);
  process.exit(1);
});
