const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Daymark - Asset Generation Script
console.log('🎨 Daymark - Asset Generation');
console.log('==========================================');

const ASSETS_DIR = 'assets';
const ICONS_DIR = path.join(ASSETS_DIR, 'icons');
const BRANDING_DIR = path.join(ASSETS_DIR, 'branding');

// Ensure directories exist
[ASSETS_DIR, ICONS_DIR, BRANDING_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

async function convertSvgToPng(svgPath, outputPath, width, height) {
    try {
        if (!fs.existsSync(svgPath)) {
            console.log(`❌ Source file not found: ${svgPath}`);
            return false;
        }

        await sharp(svgPath)
            .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(outputPath);
        
        return true;
    } catch (error) {
        console.error(`❌ Error converting ${svgPath} to ${outputPath}:`, error.message);
        return false;
    }
}

async function generateAssets() {
    console.log('📱 Generating app icons...');

    // Main App Icon
    const appIconSvg = path.join(ICONS_DIR, 'app-icon.svg');
    if (fs.existsSync(appIconSvg)) {
        console.log('  → Creating main app icon (1024x1024)...');
        await convertSvgToPng(appIconSvg, path.join(ICONS_DIR, 'icon.png'), 1024, 1024);

        console.log('  → Creating iOS icon sizes...');
        // iOS icon sizes
        const iosSizes = [180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20];
        for (const size of iosSizes) {
            await convertSvgToPng(appIconSvg, path.join(ICONS_DIR, `icon-${size}.png`), size, size);
        }

        console.log('  ✅ Main app icons generated');
    } else {
        console.log('  ❌ app-icon.svg not found');
    }

    // Android Adaptive Icon
    const adaptiveIconSvg = path.join(ICONS_DIR, 'adaptive-icon-foreground.svg');
    if (fs.existsSync(adaptiveIconSvg)) {
        console.log('  → Creating Android adaptive icon (432x432)...');
        await convertSvgToPng(adaptiveIconSvg, path.join(ICONS_DIR, 'adaptive-icon.png'), 432, 432);
        console.log('  ✅ Android adaptive icon generated');
    } else {
        console.log('  ❌ adaptive-icon-foreground.svg not found');
    }

    // Favicon
    const faviconSvg = path.join(ICONS_DIR, 'favicon.svg');
    if (fs.existsSync(faviconSvg)) {
        console.log('  → Creating favicon sizes...');
        await convertSvgToPng(faviconSvg, path.join(ICONS_DIR, 'favicon.png'), 32, 32);
        await convertSvgToPng(faviconSvg, path.join(ICONS_DIR, 'favicon-16.png'), 16, 16);
        console.log('  ✅ Favicons generated');
    } else {
        console.log('  ❌ favicon.svg not found');
    }

    console.log('');
    console.log('🖼️  Generating splash screen...');

    // Splash Screen
    const splashSvg = path.join(BRANDING_DIR, 'splash-screen.svg');
    if (fs.existsSync(splashSvg)) {
        console.log('  → Creating splash screen (1080x1920)...');
        await convertSvgToPng(splashSvg, path.join(BRANDING_DIR, 'splash.png'), 1080, 1920);

        console.log('  → Creating additional splash sizes...');
        // Additional splash screen sizes
        const splashSizes = [
            [1536, 2048], [1668, 2224], [1620, 2160], // iPad
            [750, 1334], [828, 1792], [1125, 2436], [1242, 2688] // iPhone
        ];
        
        for (const [width, height] of splashSizes) {
            await convertSvgToPng(splashSvg, path.join(BRANDING_DIR, `splash-${width}x${height}.png`), width, height);
        }

        console.log('  ✅ Splash screens generated');
    } else {
        console.log('  ❌ splash-screen.svg not found');
    }

    console.log('');
    console.log('🎉 Asset generation complete!');
    console.log('');
    console.log('📋 Generated files:');
    console.log(`   Main App Icon: ${path.join(ICONS_DIR, 'icon.png')} (1024x1024)`);
    console.log(`   Android Icon: ${path.join(ICONS_DIR, 'adaptive-icon.png')} (432x432)`);
    console.log(`   Favicon: ${path.join(ICONS_DIR, 'favicon.png')} (32x32)`);
    console.log(`   Splash Screen: ${path.join(BRANDING_DIR, 'splash.png')} (1080x1920)`);
    console.log('   + Additional iOS/Android sizes');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Review generated PNG files');
    console.log('   2. Test icons in Expo dev client');
    console.log('   3. Adjust colors/design if needed');
    console.log('   4. Re-run script after SVG changes');
}

generateAssets().catch(console.error);
