# Daymark - Asset System

This directory contains the visual assets for the Daymark app, including app icons, splash screens, and branding elements.

## 🎨 Asset Overview

The asset system is built using **SVG-first design** for scalability and maintainability. All PNG assets are generated from SVG source files using automated scripts.

### Visual Theme

- **Primary Color**: Deep Blue (`#1a365d`) - Professional medical documentation theme  
- **Style**: Clean, medical chart-inspired design with data visualization elements
- **Content**: Medical chart with heart rate line, symptom severity bars, and professional styling

## 📁 Directory Structure

```text
assets/
├── icons/                     # App icons and UI elements
│   ├── app-icon.svg          # Main app icon source (1024x1024)
│   ├── adaptive-icon-foreground.svg  # Android adaptive icon source
│   ├── favicon.svg           # Web favicon source
│   ├── icon.png             # Main app icon (1024x1024)
│   ├── adaptive-icon.png    # Android adaptive icon (432x432)
│   ├── favicon.png          # Web favicon (32x32)
│   └── icon-*.png           # iOS icon sizes (180, 167, 152, etc.)
└── branding/                  # Splash screens and branding
    ├── splash-screen.svg     # Splash screen source (1080x1920)
    ├── splash.png           # Main splash screen (1080x1920)
    └── splash-*.png         # Device-specific splash sizes
```

## 🛠️ Asset Generation

### Automated Scripts

Three scripts are provided for asset generation:

1. **`generate-assets.js`** (Recommended)
   - Uses Node.js with Sharp library
   - Cross-platform compatibility
   - High-quality SVG to PNG conversion

2. **`generate-assets.ps1`**
   - PowerShell script for Windows
   - Requires Inkscape installation

3. **`generate-assets.sh`**
   - Bash script for Linux/macOS
   - Requires rsvg-convert (librsvg2-bin)

### Running Asset Generation

```bash
# Method 1: Node.js (Recommended)
npm install --save-dev sharp
node generate-assets.js

# Method 2: PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File generate-assets.ps1

# Method 3: Bash (Linux/macOS)
chmod +x generate-assets.sh
./generate-assets.sh
```

## 📱 Generated Asset Sizes

### App Icons

- **Main Icon**: 1024x1024 (App stores, main display)
- **iOS Sizes**: 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20px
- **Android Adaptive**: 432x432 (Material Design adaptive icon)
- **Favicon**: 32x32, 16x16 (Web usage)

### Splash Screens

- **Main Splash**: 1080x1920 (Android default)
- **iPad Sizes**: 1536x2048, 1668x2224, 1620x2160
- **iPhone Sizes**: 750x1334, 828x1792, 1125x2436, 1242x2688

## 🔧 App Configuration

The assets are referenced in `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icons/icon.png",
    "splash": {
      "image": "./assets/branding/splash.png",
      "backgroundColor": "#1a365d"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/icons/adaptive-icon.png",
        "backgroundColor": "#1a365d"
      }
    },
    "web": {
      "favicon": "./assets/icons/favicon.png"
    }
  }
}
```

## ✏️ Customizing Assets

### Modifying Design

1. Edit the source SVG files in your preferred vector editor (Inkscape, Adobe Illustrator, etc.)
2. Maintain the same dimensions and aspect ratios
3. Keep the medical/professional theme consistent
4. Ensure sufficient contrast for all screen types

### Colors

- **Primary Blue**: `#1a365d` (Background, main theme)
- **White/Light**: `#ffffff`, `#f8f9fa` (Chart elements, text)
- **Accent Colors**: `#dc3545` (critical), `#ffc107` (warning), `#28a745` (good)

### Regenerating After Changes

```bash
node generate-assets.js
```

## 📝 Design Notes

### App Icon Design

- **Medical Chart Theme**: Represents the app's focus on symptom tracking and documentation
- **Heart Rate Line**: Suggests health monitoring and medical data
- **Severity Bars**: Visual representation of symptom intensity tracking
- **Professional Styling**: Clean, medical documentation aesthetic

### Splash Screen Design

- **Large Icon**: Prominent app branding
- **App Title**: "Daymark"
- **Subtitle**: "Evidence Collection for SSDI Documentation"
- **Feature Highlights**: Key app capabilities listed
- **Medical Symbols**: Professional healthcare iconography
- **Gradient Background**: Modern, professional appearance

### Adaptive Icon (Android)

- **Safe Area**: Design fits within Material Design adaptive icon guidelines
- **Simplified Design**: Optimized for smaller display contexts
- **Background Color**: Matches app theme (`#1a365d`)

## 🚀 Deployment Checklist

- [ ] All PNG files generated from SVG sources
- [ ] App icon displays correctly in app launcher
- [ ] Splash screen appears during app startup
- [ ] Favicon loads in web builds
- [ ] Android adaptive icon follows Material Design guidelines
- [ ] iOS icons meet App Store requirements
- [ ] All file paths in `app.json` are correct
- [ ] Asset file sizes are optimized for app distribution

## 🔄 Maintenance

- **Update SVG sources** when design changes are needed
- **Regenerate PNG files** after any SVG modifications  
- **Test on devices** to ensure proper display across different screen sizes
- **Optimize file sizes** for app store distribution requirements

---

**Daymark Asset System**

