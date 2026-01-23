#!/bin/bash

# Daymark - Asset Generation Script
# This script converts SVG assets to required PNG formats
# Requires: rsvg-convert (librsvg2-bin package)

echo "🎨 Daymark - Asset Generation"
echo "=========================================="

# Check if rsvg-convert is available
if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ rsvg-convert not found. Please install librsvg2-bin:"
    echo "   Ubuntu/Debian: sudo apt-get install librsvg2-bin"
    echo "   macOS: brew install librsvg"
    echo "   Windows: Use WSL or install alternative SVG converter"
    exit 1
fi

ASSETS_DIR="assets"
ICONS_DIR="$ASSETS_DIR/icons"
BRANDING_DIR="$ASSETS_DIR/branding"

echo "📱 Generating app icons..."

# Main App Icon (from app-icon.svg)
if [ -f "$ICONS_DIR/app-icon.svg" ]; then
    echo "  → Creating main app icon (1024x1024)..."
    rsvg-convert -w 1024 -h 1024 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon.png"
    
    echo "  → Creating iOS icon sizes..."
    # iOS icon sizes
    rsvg-convert -w 180 -h 180 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-180.png"
    rsvg-convert -w 167 -h 167 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-167.png"
    rsvg-convert -w 152 -h 152 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-152.png"
    rsvg-convert -w 120 -h 120 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-120.png"
    rsvg-convert -w 87 -h 87 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-87.png"
    rsvg-convert -w 80 -h 80 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-80.png"
    rsvg-convert -w 76 -h 76 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-76.png"
    rsvg-convert -w 60 -h 60 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-60.png"
    rsvg-convert -w 58 -h 58 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-58.png"
    rsvg-convert -w 40 -h 40 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-40.png"
    rsvg-convert -w 29 -h 29 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-29.png"
    rsvg-convert -w 20 -h 20 "$ICONS_DIR/app-icon.svg" > "$ICONS_DIR/icon-20.png"
    
    echo "  ✅ Main app icons generated"
else
    echo "  ❌ app-icon.svg not found"
fi

# Android Adaptive Icon
if [ -f "$ICONS_DIR/adaptive-icon-foreground.svg" ]; then
    echo "  → Creating Android adaptive icon (432x432)..."
    rsvg-convert -w 432 -h 432 "$ICONS_DIR/adaptive-icon-foreground.svg" > "$ICONS_DIR/adaptive-icon.png"
    echo "  ✅ Android adaptive icon generated"
else
    echo "  ❌ adaptive-icon-foreground.svg not found"
fi

# Favicon
if [ -f "$ICONS_DIR/favicon.svg" ]; then
    echo "  → Creating favicon sizes..."
    rsvg-convert -w 32 -h 32 "$ICONS_DIR/favicon.svg" > "$ICONS_DIR/favicon.png"
    rsvg-convert -w 16 -h 16 "$ICONS_DIR/favicon.svg" > "$ICONS_DIR/favicon-16.png"
    echo "  ✅ Favicons generated"
else
    echo "  ❌ favicon.svg not found"
fi

echo ""
echo "🖼️  Generating splash screen..."

# Splash Screen
if [ -f "$BRANDING_DIR/splash-screen.svg" ]; then
    echo "  → Creating splash screen (1080x1920)..."
    rsvg-convert -w 1080 -h 1920 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash.png"
    
    echo "  → Creating additional splash sizes..."
    # iPad splash screens
    rsvg-convert -w 1536 -h 2048 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash-1536x2048.png"
    rsvg-convert -w 1668 -h 2224 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash-1668x2224.png"
    rsvg-convert -w 1620 -h 2160 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash-1620x2160.png"
    
    # iPhone splash screens  
    rsvg-convert -w 750 -h 1334 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash-750x1334.png"
    rsvg-convert -w 828 -h 1792 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash-828x1792.png"
    rsvg-convert -w 1125 -h 2436 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash-1125x2436.png"
    rsvg-convert -w 1242 -h 2688 "$BRANDING_DIR/splash-screen.svg" > "$BRANDING_DIR/splash-1242x2688.png"
    
    echo "  ✅ Splash screens generated"
else
    echo "  ❌ splash-screen.svg not found"
fi

echo ""
echo "🎉 Asset generation complete!"
echo ""
echo "📋 Generated files:"
echo "   Main App Icon: $ICONS_DIR/icon.png (1024x1024)"
echo "   Android Icon: $ICONS_DIR/adaptive-icon.png (432x432)"
echo "   Favicon: $ICONS_DIR/favicon.png (32x32)"
echo "   Splash Screen: $BRANDING_DIR/splash.png (1080x1920)"
echo "   + Additional iOS/Android sizes"
echo ""
echo "💡 Next steps:"
echo "   1. Review generated PNG files"
echo "   2. Test icons in Expo dev client"
echo "   3. Adjust colors/design if needed"
echo "   4. Re-run script after SVG changes"
