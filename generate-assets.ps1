# Daymark - Asset Generation Script (PowerShell)
# This script converts SVG assets to required PNG formats
# Requires: Inkscape (command line version)

Write-Host "🎨 Daymark - Asset Generation" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Function to convert SVG to PNG using Inkscape
function Convert-SvgToPng {
    param(
        [string]$SvgPath,
        [string]$OutputPath,
        [int]$Width,
        [int]$Height
    )
    
    if (Test-Path $SvgPath) {
        try {
            # Try Inkscape first
            & inkscape --export-filename="$OutputPath" --export-width=$Width --export-height=$Height "$SvgPath" 2>$null
            if ($LASTEXITCODE -ne 0) {
                throw "Inkscape failed"
            }
        }
        catch {
            Write-Host "⚠️  Inkscape not found. Please install Inkscape for best results." -ForegroundColor Yellow
            Write-Host "   Download from: https://inkscape.org/release/" -ForegroundColor Yellow
            return $false
        }
        return $true
    }
    else {
        Write-Host "❌ Source file not found: $SvgPath" -ForegroundColor Red
        return $false
    }
}

$AssetsDir = "assets"
$IconsDir = "$AssetsDir\icons"
$BrandingDir = "$AssetsDir\branding"

# Create directories if they don't exist
if (!(Test-Path $IconsDir)) { New-Item -ItemType Directory -Path $IconsDir -Force }
if (!(Test-Path $BrandingDir)) { New-Item -ItemType Directory -Path $BrandingDir -Force }

Write-Host "📱 Generating app icons..." -ForegroundColor Green

# Main App Icon
$AppIconSvg = "$IconsDir\app-icon.svg"
if (Test-Path $AppIconSvg) {
    Write-Host "  → Creating main app icon (1024x1024)..."
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon.png" -Width 1024 -Height 1024
    
    Write-Host "  → Creating iOS icon sizes..."
    # iOS icon sizes
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-180.png" -Width 180 -Height 180
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-167.png" -Width 167 -Height 167
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-152.png" -Width 152 -Height 152
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-120.png" -Width 120 -Height 120
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-87.png" -Width 87 -Height 87
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-80.png" -Width 80 -Height 80
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-76.png" -Width 76 -Height 76
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-60.png" -Width 60 -Height 60
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-58.png" -Width 58 -Height 58
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-40.png" -Width 40 -Height 40
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-29.png" -Width 29 -Height 29
    Convert-SvgToPng -SvgPath $AppIconSvg -OutputPath "$IconsDir\icon-20.png" -Width 20 -Height 20
    
    Write-Host "  ✅ Main app icons generated" -ForegroundColor Green
}

# Android Adaptive Icon
$AdaptiveIconSvg = "$IconsDir\adaptive-icon-foreground.svg"
if (Test-Path $AdaptiveIconSvg) {
    Write-Host "  → Creating Android adaptive icon (432x432)..."
    Convert-SvgToPng -SvgPath $AdaptiveIconSvg -OutputPath "$IconsDir\adaptive-icon.png" -Width 432 -Height 432
    Write-Host "  ✅ Android adaptive icon generated" -ForegroundColor Green
}

# Favicon
$FaviconSvg = "$IconsDir\favicon.svg"
if (Test-Path $FaviconSvg) {
    Write-Host "  → Creating favicon sizes..."
    Convert-SvgToPng -SvgPath $FaviconSvg -OutputPath "$IconsDir\favicon.png" -Width 32 -Height 32
    Convert-SvgToPng -SvgPath $FaviconSvg -OutputPath "$IconsDir\favicon-16.png" -Width 16 -Height 16
    Write-Host "  ✅ Favicons generated" -ForegroundColor Green
}

Write-Host ""
Write-Host "🖼️  Generating splash screen..." -ForegroundColor Green

# Splash Screen
$SplashSvg = "$BrandingDir\splash-screen.svg"
if (Test-Path $SplashSvg) {
    Write-Host "  → Creating splash screen (1080x1920)..."
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash.png" -Width 1080 -Height 1920
    
    Write-Host "  → Creating additional splash sizes..."
    # iPad splash screens
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash-1536x2048.png" -Width 1536 -Height 2048
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash-1668x2224.png" -Width 1668 -Height 2224
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash-1620x2160.png" -Width 1620 -Height 2160
    
    # iPhone splash screens  
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash-750x1334.png" -Width 750 -Height 1334
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash-828x1792.png" -Width 828 -Height 1792
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash-1125x2436.png" -Width 1125 -Height 2436
    Convert-SvgToPng -SvgPath $SplashSvg -OutputPath "$BrandingDir\splash-1242x2688.png" -Width 1242 -Height 2688
    
    Write-Host "  ✅ Splash screens generated" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Asset generation complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Generated files:" -ForegroundColor White
Write-Host "   Main App Icon: $IconsDir\icon.png (1024x1024)" -ForegroundColor Gray
Write-Host "   Android Icon: $IconsDir\adaptive-icon.png (432x432)" -ForegroundColor Gray
Write-Host "   Favicon: $IconsDir\favicon.png (32x32)" -ForegroundColor Gray
Write-Host "   Splash Screen: $BrandingDir\splash.png (1080x1920)" -ForegroundColor Gray
Write-Host "   + Additional iOS/Android sizes" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Review generated PNG files" -ForegroundColor Gray
Write-Host "   2. Test icons in Expo dev client" -ForegroundColor Gray
Write-Host "   3. Adjust colors/design if needed" -ForegroundColor Gray
Write-Host "   4. Re-run script after SVG changes" -ForegroundColor Gray
