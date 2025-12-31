const fs = require('fs');
const path = require('path');

// SSDI Symptom Tracker - Asset Validation Script
console.log('🔍 SSDI Symptom Tracker - Asset Validation');
console.log('===========================================');

const ASSETS_DIR = 'assets';
const ICONS_DIR = path.join(ASSETS_DIR, 'icons');
const BRANDING_DIR = path.join(ASSETS_DIR, 'branding');

// Required assets based on app.json configuration
const requiredAssets = {
    'Main App Icon': path.join(ICONS_DIR, 'icon.png'),
    'Android Adaptive Icon': path.join(ICONS_DIR, 'adaptive-icon.png'),
    'Web Favicon': path.join(ICONS_DIR, 'favicon.png'),
    'Splash Screen': path.join(BRANDING_DIR, 'splash.png')
};

// Optional but recommended assets
const recommendedAssets = {
    'iOS Icons': [
        path.join(ICONS_DIR, 'icon-180.png'),
        path.join(ICONS_DIR, 'icon-152.png'),
        path.join(ICONS_DIR, 'icon-120.png')
    ],
    'Additional Splash Sizes': [
        path.join(BRANDING_DIR, 'splash-750x1334.png'),
        path.join(BRANDING_DIR, 'splash-1125x2436.png')
    ]
};

function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return (stats.size / 1024).toFixed(2) + ' KB';
    } catch (error) {
        return 'N/A';
    }
}

function checkAsset(name, filePath) {
    const exists = fs.existsSync(filePath);
    const size = exists ? getFileSize(filePath) : 'N/A';
    const status = exists ? '✅' : '❌';
    
    console.log(`  ${status} ${name}: ${path.basename(filePath)} (${size})`);
    return exists;
}

function validateAppJson() {
    const appJsonPath = 'app.json';
    if (!fs.existsSync(appJsonPath)) {
        console.log('❌ app.json not found');
        return false;
    }

    try {
        const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
        const expo = appJson.expo;
        
        console.log('📋 app.json Configuration:');
        console.log(`  Icon: ${expo.icon || 'Not configured'}`);
        console.log(`  Splash Image: ${expo.splash?.image || 'Not configured'}`);
        console.log(`  Splash Background: ${expo.splash?.backgroundColor || 'Not configured'}`);
        console.log(`  Android Adaptive Icon: ${expo.android?.adaptiveIcon?.foregroundImage || 'Not configured'}`);
        console.log(`  Android Background: ${expo.android?.adaptiveIcon?.backgroundColor || 'Not configured'}`);
        console.log(`  Web Favicon: ${expo.web?.favicon || 'Not configured'}`);
        
        return true;
    } catch (error) {
        console.log('❌ Error reading app.json:', error.message);
        return false;
    }
}

function suggestOptimizations() {
    console.log('');
    console.log('💡 Optimization Suggestions:');
    
    // Check file sizes
    const largePngThreshold = 500; // KB
    const iconFiles = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'));
    const splashFiles = fs.readdirSync(BRANDING_DIR).filter(f => f.endsWith('.png'));
    
    const largeFiles = [];
    
    [...iconFiles, ...splashFiles].forEach(fileName => {
        const fullPath = iconFiles.includes(fileName) 
            ? path.join(ICONS_DIR, fileName)
            : path.join(BRANDING_DIR, fileName);
        
        try {
            const stats = fs.statSync(fullPath);
            const sizeKB = stats.size / 1024;
            
            if (sizeKB > largePngThreshold) {
                largeFiles.push({ file: fileName, size: sizeKB.toFixed(2) });
            }
        } catch (error) {
            // Ignore files that can't be read
        }
    });
    
    if (largeFiles.length > 0) {
        console.log('  📦 Large files detected (consider optimization):');
        largeFiles.forEach(({ file, size }) => {
            console.log(`    - ${file}: ${size} KB`);
        });
    } else {
        console.log('  ✅ All PNG files are reasonably sized');
    }
    
    // Check for unused assets
    console.log('  🧹 Clean up unused development assets:');
    console.log('    - Remove .placeholder files if they exist');
    console.log('    - Archive SVG sources if not needed for future edits');
    console.log('    - Consider removing oversized splash variants if app size is a concern');
}

async function main() {
    console.log('');
    console.log('🔍 Checking Required Assets:');
    
    let allRequiredPresent = true;
    for (const [name, filePath] of Object.entries(requiredAssets)) {
        const exists = checkAsset(name, filePath);
        if (!exists) allRequiredPresent = false;
    }
    
    console.log('');
    console.log('📊 Optional Assets Status:');
    
    for (const [category, files] of Object.entries(recommendedAssets)) {
        console.log(`  ${category}:`);
        for (const filePath of files) {
            checkAsset('', filePath);
        }
    }
    
    console.log('');
    validateAppJson();
    
    suggestOptimizations();
    
    console.log('');
    if (allRequiredPresent) {
        console.log('🎉 All required assets are present and configured!');
        console.log('');
        console.log('🚀 Ready for:');
        console.log('  - Development testing (expo start)');
        console.log('  - Production builds (eas build)');
        console.log('  - App store submissions');
    } else {
        console.log('⚠️  Some required assets are missing. Run asset generation:');
        console.log('  node generate-assets.js');
    }
    
    console.log('');
    console.log('📖 For detailed asset documentation, see: assets/README.md');
}

main().catch(console.error);