# Daymark Brand Assets

## Color Palette

### Core Brand Colors

```
Primary Slate:    #4a6176  (Core slate - main brand color)
Deep Slate:       #3d4f61  (Darker slate - accents)
Light Slate:      #f0f2f5  (Very light slate - backgrounds)
Off-White:        #fafbfc  (Backgrounds)
Near Black:       #1e242e  (Primary text)
Muted Gray:       #6b7684  (Secondary text)
```

### Semantic Colors (Calm versions)

```
Success:  #52a68a  (Muted sage green)
Warning:  #d4a574  (Muted amber)
Error:    #c17369  (Muted rose)
```

### Background System

```
Primary:    #ffffff  (Pure white cards)
Secondary:  #fafbfc  (Off-white page background)
Tertiary:   #f4f5f7  (Very light gray sections)
Dark:       #2f3d4c  (Deep slate for splash/dark mode)
```

---

## App Icon Specifications

### Required Sizes

#### iOS
- **1024x1024** - App Store (PNG, no alpha, no transparency)
- **180x180** - iPhone 3x
- **120x120** - iPhone 2x
- **167x167** - iPad Pro 2x
- **152x152** - iPad 2x
- **76x76** - iPad 1x

#### Android
- **512x512** - Play Store feature graphic
- **192x192** - xxxhdpi (adaptive icon foreground + background)
- **144x144** - xxhdpi
- **96x96** - xhdpi
- **72x72** - hdpi
- **48x48** - mdpi

#### Web/PWA
- **192x192** - Android Chrome
- **512x512** - Splash screen
- **180x180** - Apple touch icon
- **32x32** - Favicon
- **16x16** - Favicon small

---

## Icon Design Concept

**Concept:** A single vertical mark or dot indicating "today" on a subtle timeline or horizon.

**Visual Elements:**
- Small filled circle intersecting a thin horizontal line
- Represents marking a single day
- Minimal, calm, non-medical

**Colors:**
- Background: `#2f3d4c` (Deep slate)
- Mark/dot: `#f0f2f5` (Very light slate) or `#fafbfc` (Off-white)
- Line: Same as mark, but at 40% opacity

**Style:**
- Flat design, no gradients
- Subtle depth (optional very soft shadow)
- Rounded corners (standard iOS/Android radius)
- No text, no symbols, no medical imagery

---

## Generation Prompts

### App Icon Prompt (Primary)

```
Minimalist app icon for Daymark symptom tracking app.
Deep slate background (#2f3d4c). A single small off-white
circle (#f0f2f5) centered and intersecting a thin horizontal
line, representing marking a day on a timeline. Calm, neutral,
non-medical, non-corporate. Flat design with subtle depth,
no text, no gradients, rounded corners. Modern, quiet, trustworthy.
1024x1024px, PNG.
```

### Alternative Icon Prompt (Softer)

```
Minimal app icon symbolizing marking a single day in time.
A soft dot or gentle notch on a subtle horizon line.
Dark neutral slate background (#2f3d4c), very soft off-white
mark (#fafbfc) with gentle contrast. Calm and human tone.
Flat modern design. No medical symbols, no charts, no text.
1024x1024px, PNG.
```

### Adaptive Icon (Android) - Foreground Layer

```
Foreground layer for Android adaptive icon. Transparent background.
A single small off-white circle (#f0f2f5) intersecting a thin
horizontal line, centered. The mark should be positioned to work
with circular, square, and rounded square masks. Safe area:
center 66% of canvas. 432x432px (scaled to fit 192x192 output).
```

### Adaptive Icon (Android) - Background Layer

```
Background layer for Android adaptive icon. Solid deep slate
color (#2f3d4c). No gradients, no patterns. Simple flat color
fill. 432x432px (scaled to fit 192x192 output).
```

---

## Splash Screen

**Design:**
- Full background: `#2f3d4c` (Deep slate)
- Centered icon or wordmark
- No loading indicators
- No taglines

**Prompt:**

```
Splash screen for Daymark app. Full deep slate background
(#2f3d4c). Centered: either the Daymark icon (circle on line)
or lowercase wordmark "daymark" in clean sans-serif (#fafbfc).
Calm, minimal, generous padding. 1242x2688px (iPhone size).
```

---

## Logo/Wordmark

### Primary Wordmark

**Text:** "daymark" (lowercase)

**Typography:**
- Clean, humanist sans-serif
- Font weight: 500-600 (medium to semibold)
- Letter spacing: neutral to slightly open
- Examples of style (not specific fonts):
  - Inter
  - Source Sans 3
  - IBM Plex Sans

**Color Variations:**
- Dark on light: `#1e242e` on `#ffffff`
- Light on dark: `#fafbfc` on `#2f3d4c`
- Slate on off-white: `#4a6176` on `#fafbfc`

**Optional Mark Integration:**
- Small dot (•) before or after "daymark"
- Dot integrated into letter "a" or replacing the "i" dot
- Mark should be subtle, not dominant

### Wordmark Generation Prompt

```
Simple wordmark logo for Daymark app. Clean modern sans-serif
typography in lowercase "daymark". Medium weight (500-600).
Calm, neutral, human tone. Optional subtle dot or mark
integrated into the design. No icons, no medical symbols,
no gradients. Dark slate color (#1e242e) on white background.
Vector-ready, horizontal layout.
```

---

## Asset Implementation Checklist

- [ ] Generate 1024x1024 app icon (primary)
- [ ] Generate all iOS icon sizes
- [ ] Generate Android adaptive icon (foreground + background)
- [ ] Generate all Android icon sizes
- [ ] Generate web/PWA icons (192, 512, 180)
- [ ] Generate favicon (32x32, 16x16)
- [ ] Generate splash screen (1242x2688)
- [ ] Design wordmark logo
- [ ] Export logo in multiple formats (SVG, PNG @1x/2x/3x)
- [ ] Update `app.json` with new icon paths
- [ ] Update `generate-assets.js` script
- [ ] Verify icons on physical devices
- [ ] Submit updated assets to app stores

---

## File Naming Convention

```
icon-1024.png          (iOS App Store)
icon-512.png           (Android Play Store)
icon-192.png           (Web/Android Chrome)
icon-180.png           (Apple touch icon)

adaptive-icon-fg.png   (Android foreground)
adaptive-icon-bg.png   (Android background)

splash-1242x2688.png   (iPhone splash)

logo-wordmark.svg      (Vector logo)
logo-wordmark@1x.png   (72 DPI)
logo-wordmark@2x.png   (144 DPI)
logo-wordmark@3x.png   (216 DPI)

favicon-32.png
favicon-16.png
favicon.ico            (Multi-size ICO)
```

---

## Brand Consistency Notes

### What Daymark Is:
- Calm
- Neutral
- Quietly reliable
- Non-clinical
- Non-surveillant
- Something you'd trust on a bad day

### What Daymark Is Not:
- Medical app aesthetic (no crosses, clipboards, shields)
- Wellness app aesthetic (no hearts, brains)
- Evidence app aesthetic (no scales, gavels)
- Productivity app aesthetic (no checkmarks, graphs)
- Bright or alarming colors
- Sharp or aggressive shapes

### Design Restraint:
The app's seriousness comes from restraint. Over-design would break trust. Keep everything calm, minimal, and honest.

---

## Next Steps

After generating assets:
1. Place all icons in `assets/icons/`
2. Update splash screen in `assets/branding/`
3. Update `app.json` with new paths and colors
4. Run `npm run assets:validate` to verify
5. Test on physical devices (iOS + Android)
6. Update app store listings with new branding
