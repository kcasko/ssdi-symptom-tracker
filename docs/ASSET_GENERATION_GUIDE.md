# Asset Generation Guide for Daymark

This guide explains how to generate all required PNG assets from the SVG source files.

---

## Overview

We have 3 SVG source files:
1. `assets/icons/icon-1024.svg` - Main app icon
2. `assets/icons/adaptive-icon-foreground.svg` - Android adaptive icon foreground
3. `assets/branding/splash-daymark.svg` - Splash screen

From these, we need to generate multiple PNG files at different sizes.

---

## Method 1: Using an Online SVG to PNG Converter (Easiest)

### Recommended Tool: CloudConvert or SVGtoPNG.com

1. Go to https://cloudconvert.com/svg-to-png (or similar)
2. Upload the SVG file
3. Set the dimensions for each required size
4. Download the PNG

### Steps for Each Asset:

#### Main App Icon (icon-1024.svg)

Generate these PNG files:

| File Name | Size | Purpose |
|-----------|------|---------|
| `icon-1024.png` | 1024x1024 | iOS App Store, base icon |
| `icon-512.png` | 512x512 | Android Play Store |
| `icon-192.png` | 192x192 | Web/PWA |
| `icon-180.png` | 180x180 | iOS (iPhone 3x) |
| `icon-120.png` | 120x120 | iOS (iPhone 2x) |

#### Adaptive Icon (adaptive-icon-foreground.svg)

Generate:

| File Name | Size | Purpose |
|-----------|------|---------|
| `adaptive-icon.png` | 432x432 | Android foreground layer |

**Important:** Ensure transparency is preserved!

#### Splash Screen (splash-daymark.svg)

Generate:

| File Name | Size | Purpose |
|-----------|------|---------|
| `splash.png` | 1242x2688 | iPhone splash |

---

## Method 2: Using Figma (Recommended for Designers)

1. **Import SVG to Figma:**
   - Open Figma
   - Create new file
   - File → Place Image → Select SVG
   - Or copy/paste SVG code directly

2. **Export at Multiple Sizes:**
   - Select the imported graphic
   - Right sidebar → Export section
   - Add multiple export sizes:
     - `1x` = 1024x1024 (for icon-1024.svg)
     - `0.5x` = 512x512
     - `0.1875x` = 192x192
     - Etc.
   - Export all at once

3. **For Adaptive Icon:**
   - Ensure "Export as PNG with transparency" is selected
   - No background color

---

## Method 3: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Install ImageMagick first (if not installed)
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Convert main icon to multiple sizes
convert assets/icons/icon-1024.svg -resize 1024x1024 assets/icons/icon-1024.png
convert assets/icons/icon-1024.svg -resize 512x512 assets/icons/icon-512.png
convert assets/icons/icon-1024.svg -resize 192x192 assets/icons/icon-192.png
convert assets/icons/icon-1024.svg -resize 180x180 assets/icons/icon-180.png
convert assets/icons/icon-1024.svg -resize 120x120 assets/icons/icon-120.png

# Convert adaptive icon (preserve transparency)
convert assets/icons/adaptive-icon-foreground.svg -resize 432x432 assets/icons/adaptive-icon.png

# Convert splash screen
convert assets/branding/splash-daymark.svg -resize 1242x2688 assets/branding/splash.png
```

---

## Method 4: Using Sharp (Node.js) - AUTOMATED

I've created a Node.js script for you:

### Install Sharp:

```bash
npm install sharp --save-dev
```

### Create and run the script:

Create `convert-assets.js` in the root:

```javascript
const sharp = require('sharp');
const fs = require('fs');

async function convertAssets() {
  console.log('Converting Daymark assets...\n');

  const conversions = [
    // Main icon sizes
    { input: 'assets/icons/icon-1024.svg', output: 'assets/icons/icon-1024.png', width: 1024, height: 1024 },
    { input: 'assets/icons/icon-1024.svg', output: 'assets/icons/icon-512.png', width: 512, height: 512 },
    { input: 'assets/icons/icon-1024.svg', output: 'assets/icons/icon-192.png', width: 192, height: 192 },
    { input: 'assets/icons/icon-1024.svg', output: 'assets/icons/icon-180.png', width: 180, height: 180 },
    { input: 'assets/icons/icon-1024.svg', output: 'assets/icons/icon-120.png', width: 120, height: 120 },
    { input: 'assets/icons/icon-1024.svg', output: 'assets/icons/icon.png', width: 1024, height: 1024 },

    // Adaptive icon
    { input: 'assets/icons/adaptive-icon-foreground.svg', output: 'assets/icons/adaptive-icon.png', width: 432, height: 432 },

    // Splash screen
    { input: 'assets/branding/splash-daymark.svg', output: 'assets/branding/splash.png', width: 1242, height: 2688 },
  ];

  for (const conversion of conversions) {
    try {
      await sharp(conversion.input)
        .resize(conversion.width, conversion.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(conversion.output);

      console.log(`✓ Generated: ${conversion.output} (${conversion.width}x${conversion.height})`);
    } catch (error) {
      console.error(`✗ Failed: ${conversion.output}`, error.message);
    }
  }

  console.log('\n✅ Asset conversion complete!');
}

convertAssets();
```

### Run the script:

```bash
node convert-assets.js
```

---

## Method 5: Using Online AI Image Generator (If you want higher quality)

If you want to regenerate from scratch with AI:

1. **Go to:**
   - Midjourney
   - DALL-E 3
   - Leonardo.ai
   - Stable Diffusion

2. **Use this exact prompt:**

```
Minimalist app icon for Daymark symptom tracking app.
Deep slate background (#2f3d4c). A single small off-white
circle (#f0f2f5) centered and intersecting a thin horizontal
line, representing marking a day on a timeline. Calm, neutral,
non-medical, non-corporate. Flat design with subtle depth,
no text, no gradients, rounded corners. Modern, quiet, trustworthy.
1024x1024px, PNG.
```

3. **Download at 1024x1024**

4. **Resize for other dimensions** using any of the methods above

---

## Verification Checklist

After generating assets, verify:

- [ ] `icon-1024.png` exists and is 1024x1024
- [ ] `icon.png` (copy of 1024) exists for Expo
- [ ] `icon-512.png` exists and is 512x512
- [ ] `icon-192.png` exists and is 192x192
- [ ] `adaptive-icon.png` exists with **transparency**
- [ ] `splash.png` replaced with new Daymark version
- [ ] All PNGs have proper Daymark branding (dot on line)
- [ ] No old SSDI branding remains

---

## Testing Assets

### iOS Simulator:
```bash
npx expo start --ios
```

Check:
- App icon shows correctly
- Splash screen shows correctly
- Colors match Daymark palette

### Android Emulator:
```bash
npx expo start --android
```

Check:
- Adaptive icon renders correctly (circular mask)
- Splash screen shows correctly
- Background color is `#2f3d4c`

### Physical Device:
Build and install on actual devices to see final rendering.

---

## Troubleshooting

### SVG not converting properly:
- Try a different online converter
- Simplify the SVG (remove gradients if causing issues)
- Use Figma as a reliable fallback

### Transparency not working (Android):
- Ensure PNG is exported with alpha channel
- Check that background is truly transparent, not white
- Use Sharp or Figma for guaranteed transparency

### Icon looks blurry on device:
- Ensure source is high resolution (1024x1024)
- Don't upscale, only downscale
- Export as PNG with no compression

### Colors look different on device:
- Check color profile (sRGB recommended)
- Verify hex codes match exactly
- Test on multiple devices

---

## Quick Start (Recommended Path)

**Fastest way to get assets:**

1. Run the automated Node.js script (Method 4)
2. If Node.js not available, use CloudConvert (Method 1)
3. Replace old splash.png with new one
4. Test on simulators
5. Rebuild app

**Estimated time:** 10-15 minutes

---

## Need Help?

- **SVG issues?** Open in browser to preview
- **Conversion problems?** Use Figma (most reliable)
- **Size questions?** See `BRAND_ASSETS.md` for specs
- **Color accuracy?** See `BRAND_COLORS.md` for hex codes

---

## After Generation Complete

Update the checklist in `REBRAND_CHECKLIST.md`:

```
- [x] Generate 1024x1024 primary app icon
- [x] Generate iOS icon set
- [x] Generate Android adaptive icon
- [x] Generate splash screen
```

Then proceed to building the new APK/IPA.
