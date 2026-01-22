# Generate Daymark Assets - Quick Start

## 🚀 Fastest Method (Automated)

### Step 1: Install Sharp

```bash
npm install sharp --save-dev
```

### Step 2: Run the converter

```bash
node convert-daymark-assets.js
```

### Step 3: Verify

Check these folders:
- `assets/icons/` - Should have new Daymark icons
- `assets/branding/` - Should have new splash.png

### Step 4: Test

```bash
npm start
```

Open in iOS/Android simulator and verify the new branding appears.

---

## 🎨 Alternative: Manual Conversion

If you prefer not to use Node.js:

### Option A: Online Converter (Easiest)

1. Go to https://cloudconvert.com/svg-to-png
2. Upload `assets/icons/icon-1024.svg`
3. Convert at these sizes:
   - 1024x1024 → save as `icon-1024.png`
   - 512x512 → save as `icon-512.png`
   - 192x192 → save as `icon-192.png`
   - 180x180 → save as `icon-180.png`
   - 120x120 → save as `icon-120.png`
4. Copy `icon-1024.png` to `icon.png` (Expo needs this)

5. Upload `assets/icons/adaptive-icon-foreground.svg`
6. Convert at 432x432 → save as `adaptive-icon.png` (must have transparency!)

7. Upload `assets/branding/splash-daymark.svg`
8. Convert at 1242x2688 → replace `splash.png`

### Option B: Using Figma

See detailed instructions in `docs/ASSET_GENERATION_GUIDE.md`

---

## 📋 What Gets Generated

```
assets/icons/
├── icon.png           (1024x1024) - Expo default
├── icon-1024.png      (1024x1024) - iOS App Store
├── icon-512.png       (512x512)   - Android Play Store
├── icon-192.png       (192x192)   - Web/PWA
├── icon-180.png       (180x180)   - iOS iPhone
├── icon-120.png       (120x120)   - iOS iPhone
└── adaptive-icon.png  (432x432)   - Android adaptive

assets/branding/
└── splash.png         (1242x2688) - Splash screen
```

---

## ✅ Verification

After generation, check:

- [ ] All icon files exist
- [ ] Icons show the Daymark mark (dot on line)
- [ ] No old SSDI branding visible
- [ ] `adaptive-icon.png` has transparent background
- [ ] `splash.png` shows "daymark" wordmark on slate background
- [ ] Colors match Daymark palette (#2f3d4c, #f0f2f5)

---

## 🐛 Troubleshooting

### "Sharp not found"
```bash
npm install sharp --save-dev
```

### "SVG not converting"
Try the online converter at cloudconvert.com

### "Icons look blurry"
Ensure you're downscaling from 1024x1024, not upscaling

### "Adaptive icon has white background"
Use CloudConvert or Figma and ensure "Export with transparency" is enabled

---

## 🎯 Next Steps After Assets Generated

1. Test in simulator:
   ```bash
   npm start
   ```

2. Build new APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

3. Update text in Settings screen (see `REBRAND_CHECKLIST.md`)

4. Ship it! 🚢

---

## 📚 More Info

- Full asset specs: `docs/BRAND_ASSETS.md`
- Color reference: `docs/BRAND_COLORS.md`
- Complete guide: `docs/ASSET_GENERATION_GUIDE.md`
- Rebrand checklist: `docs/REBRAND_CHECKLIST.md`

---

## Need Help?

Open an issue or check the detailed guides in the `docs/` folder.

The most reliable path: Use the automated Node.js script above.
