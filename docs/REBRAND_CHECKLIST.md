# Daymark Rebrand Implementation Checklist

## ✅ Completed

- [x] **Color system updated** - `src/theme/colors.ts` now uses Daymark palette
- [x] **App configuration updated** - `app.json` uses new name, slug, and colors
- [x] **Package name updated** - `package.json` renamed to "daymark"
- [x] **Brand documentation created** - `BRAND_ASSETS.md` and `BRAND_COLORS.md`
- [x] **Asset generation prompts ready** - All prompts provided in brand docs

---

## 🎨 Assets to Generate (External)

Use the prompts in `docs/BRAND_ASSETS.md` to generate these assets:

### App Icons (Priority 1)
- [ ] Generate 1024x1024 primary app icon
- [ ] Generate iOS icon set (all sizes)
- [ ] Generate Android adaptive icon (foreground + background)
- [ ] Generate Android icon set (all sizes)

### Web Icons (Priority 2)
- [ ] Generate 512x512 web icon
- [ ] Generate 192x192 web icon
- [ ] Generate 180x180 Apple touch icon
- [ ] Generate 32x32 favicon
- [ ] Generate 16x16 favicon

### Splash Screen (Priority 2)
- [ ] Generate 1242x2688 splash screen

### Logo/Wordmark (Priority 3)
- [ ] Design "daymark" wordmark
- [ ] Export SVG vector
- [ ] Export PNG @1x, @2x, @3x

**Where to place generated assets:**
- Icons: `assets/icons/`
- Splash: `assets/branding/`
- Logos: `assets/branding/`

---

## 📝 Code Updates Needed

### User-Facing Text Changes

- [ ] Update `SettingsScreen.tsx` - Change "SSDI Symptom Tracker" to "Daymark"
  - Line 128: Info card title
  - Line 129-131: Description text (suggest: "A calm, neutral tool for marking your days.")

- [ ] Update any other hardcoded app name references in:
  - [ ] `ProfilePickerScreen.tsx`
  - [ ] `OnboardingScreen.tsx`
  - [ ] `AboutScreen.tsx` (if needed)
  - [ ] Any other screens with app name

### Documentation Updates

- [ ] Update `README.md` - Replace SSDI Symptom Tracker with Daymark
- [ ] Update `USER_GUIDE.md` - Replace branding
- [ ] Update `PRIVACY_POLICY.md` - Replace app name
- [ ] Update `TERMS_OF_SERVICE.md` - Replace app name
- [ ] Update `LEGAL_DISCLAIMER.md` - Replace app name (keep legal language intact)

### Build Configuration

- [ ] Update Android `build.gradle` with new package name
  - Find all `com.ssdi.symptomtracker` references
  - Replace with `com.daymark.app`

- [ ] Update iOS Xcode project with new bundle identifier
  - `com.daymark.app`

- [ ] Update EAS build configuration if needed
  - Check `eas.json` for any hardcoded references

---

## 🧪 Testing After Rebrand

### Visual Testing
- [ ] Test app icon on iOS device
- [ ] Test app icon on Android device
- [ ] Test splash screen on both platforms
- [ ] Verify new colors in all screens
- [ ] Check color contrast in all states
- [ ] Verify semantic colors (success, warning, error) work

### Functional Testing
- [ ] App launches successfully
- [ ] Navigation works
- [ ] Settings screen displays new branding
- [ ] About screen reflects new brand
- [ ] PDF exports still work (may have old branding - address separately)
- [ ] Cloud backup works with new package name

### Package Name Testing (Android)
- [ ] Uninstall old app first
- [ ] Install new APK
- [ ] Verify data migration (or warn users about reinstall)
- [ ] Test on multiple Android versions

### Bundle Identifier Testing (iOS)
- [ ] Clean build
- [ ] Install on TestFlight
- [ ] Verify provisioning profiles work
- [ ] Test on multiple iOS versions

---

## 📦 Build and Release

### Development Build
- [ ] Run `npm run assets` to validate assets
- [ ] Build debug APK: `cd android && ./gradlew assembleDebug`
- [ ] Build debug iOS: `expo run:ios`
- [ ] Test on physical devices

### Production Build
- [ ] Update version in `app.json` (consider 1.0.0 → 1.1.0 for rebrand)
- [ ] Build release APK: `cd android && ./gradlew assembleRelease`
- [ ] Build iOS release: `expo build:ios` or EAS
- [ ] Test production builds thoroughly

### App Store Updates
- [ ] Update Google Play Store listing:
  - App name: "Daymark"
  - Short description
  - Full description
  - Screenshots (if needed)
  - Feature graphic

- [ ] Update Apple App Store listing:
  - App name: "Daymark"
  - Subtitle
  - Description
  - Keywords
  - Screenshots (if needed)
  - Preview video (if needed)

---

## 🎯 Optional Enhancements

### Subtle Brand Touches
- [ ] Add Daymark mark (•) to greeting: "Welcome back•"
- [ ] Use mark in empty states or loading screens
- [ ] Consider mark as separator in UI elements

### Refined Copy
- [ ] Rewrite About screen to emphasize "marking time" philosophy
- [ ] Audit all UI text for tone alignment with "calm, neutral, marking time"
- [ ] Remove any remaining "SSDI" or "evidence" focused language (unless user wants to keep it)

### Future Considerations
- [ ] Design light/dark mode variants (optional)
- [ ] Create marketing website (optional)
- [ ] Social media graphics (optional)

---

## ⚠️ Important Notes

### Package Name Change Impact

**Android:** The new package name `com.daymark.app` means this is technically a "new app" to Google Play and Android devices. Users will NOT automatically update from the old app.

**Options:**
1. **Fresh start:** Release as new app, users reinstall
2. **Keep old name:** Don't change package, just update visible branding
3. **Migrate:** Use advanced Android manifest techniques (complex)

**Recommendation for v1.0:** Consider keeping the old package name `com.ssdi.symptomtracker` internally, only change visible branding. Change package name in v2.0 as a "clean slate" release.

### iOS Bundle Identifier

Same consideration applies. Changing bundle ID makes this a "new app" to iOS and App Store.

**Current bundle:** `com.ssdi.symptomtracker`
**New bundle:** `com.daymark.app`

If you want seamless updates for existing users, consider keeping the old bundle identifier.

---

## 🚀 Recommended Order of Operations

1. **Generate assets first** (icons, splash)
2. **Place assets in correct folders**
3. **Test color system** in development
4. **Update user-facing text** in code
5. **Build and test** locally
6. **Decide on package name strategy** (keep old vs. new)
7. **Build production** APK/IPA
8. **Update store listings**
9. **Soft launch** to test group
10. **Full release**

---

## 📋 When You're Done

After completing the rebrand:
- [ ] Delete old icon assets (if replaced)
- [ ] Archive old brand documentation
- [ ] Update team/contributors on new branding
- [ ] Celebrate the new identity! 🎉

---

## Need Help?

- Asset generation issues? Check `docs/BRAND_ASSETS.md`
- Color questions? Reference `docs/BRAND_COLORS.md`
- Build problems? Check Expo docs for package name changes
- Brand questions? Remember: "marking time, not judging it"
