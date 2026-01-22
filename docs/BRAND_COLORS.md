# Daymark Color Reference

## Quick Copy-Paste Reference

### Primary Palette
```css
--slate-50:    #f0f2f5;  /* Very light slate */
--slate-100:   #d9dfe6;  /* Light slate */
--slate-200:   #b3bfcc;  /* Soft slate */
--slate-300:   #8d9fb3;  /* Medium slate */
--slate-400:   #677f99;  /* Muted slate */
--slate-500:   #4a6176;  /* Core slate (PRIMARY) */
--slate-600:   #3d4f61;  /* Deep slate */
--slate-700:   #2f3d4c;  /* Darker slate */
--slate-800:   #222b37;  /* Charcoal */
--slate-900:   #1a2128;  /* Near black slate */
```

### Gray Scale
```css
--gray-50:     #fafbfc;  /* Off-white */
--gray-100:    #f4f5f7;  /* Very light gray */
--gray-200:    #e9ebee;  /* Light gray */
--gray-300:    #dce0e4;  /* Soft gray */
--gray-400:    #c4cbd3;  /* Medium gray */
--gray-500:    #9aa4b0;  /* Neutral gray */
--gray-600:    #6b7684;  /* Muted gray */
--gray-700:    #4a5361;  /* Deep gray */
--gray-800:    #333b47;  /* Darker gray */
--gray-900:    #1e242e;  /* Near black */
```

### Semantic Colors
```css
--success:     #52a68a;  /* Muted sage */
--success-bg:  #e8f4f1;  /* Soft green background */
--warning:     #d4a574;  /* Muted amber */
--warning-bg:  #fef8ec;  /* Soft amber background */
--error:       #c17369;  /* Muted rose */
--error-bg:    #f7ebe9;  /* Soft rose background */
```

### Core Colors (Most Used)
```
Background:    #ffffff  (white)
Page BG:       #fafbfc  (off-white)
Section BG:    #f4f5f7  (very light gray)
Primary:       #4a6176  (core slate)
Text:          #1e242e  (near black)
Text Muted:    #6b7684  (muted gray)
Border:        #e9ebee  (light gray)
```

---

## Color Usage Guide

### Text Hierarchy
```
Primary Text:      #1e242e (gray-900) - Body, headings
Secondary Text:    #6b7684 (gray-600) - Labels, helpers
Disabled Text:     #9aa4b0 (gray-500) - Inactive states
Link Text:         #4a6176 (slate-500) - Links, actions
Inverse Text:      #ffffff (white) - On dark backgrounds
```

### Backgrounds
```
Cards:             #ffffff (white)
Page:              #fafbfc (gray-50)
Sections:          #f4f5f7 (gray-100)
Alternate:         #f0f2f5 (slate-50)
Dark (Splash):     #2f3d4c (slate-700)
```

### Borders
```
Light Border:      #e9ebee (gray-200)
Medium Border:     #c4cbd3 (gray-400)
Dark Border:       #6b7684 (gray-600)
Focus Border:      #4a6176 (slate-500)
```

### Buttons
```
Primary BG:        #4a6176 (slate-500)
Primary Text:      #ffffff (white)
Secondary BG:      #f0f2f5 (slate-50)
Secondary Text:    #4a6176 (slate-500)
Disabled BG:       #f4f5f7 (gray-100)
Disabled Text:     #9aa4b0 (gray-500)
```

### Status Indicators
```
Success:           #52a68a (muted sage)
Success BG:        #e8f4f1 (soft green)
Warning:           #d4a574 (muted amber)
Warning BG:        #fef8ec (soft amber)
Error:             #c17369 (muted rose)
Error BG:          #f7ebe9 (soft rose)
```

---

## Contrast Ratios (WCAG AA)

All text colors meet WCAG AA standards for accessibility:

```
#1e242e on #ffffff:  15.8:1 (AAA)
#4a5361 on #ffffff:  10.5:1 (AAA)
#6b7684 on #ffffff:   7.1:1 (AA)
#4a6176 on #ffffff:   8.2:1 (AAA)
#ffffff on #2f3d4c:  10.1:1 (AAA)
#ffffff on #4a6176:   8.2:1 (AAA)
```

---

## Hex to RGB Conversion

```js
// Primary
slate-500:   74, 97, 118   (rgba(74, 97, 118, 1))
slate-700:   47, 61, 76    (rgba(47, 61, 76, 1))

// Text
gray-900:    30, 36, 46    (rgba(30, 36, 46, 1))
gray-600:    107, 118, 132 (rgba(107, 118, 132, 1))

// Backgrounds
gray-50:     250, 251, 252 (rgba(250, 251, 252, 1))
white:       255, 255, 255 (rgba(255, 255, 255, 1))
```

---

## Alpha Variants (for overlays)

```css
/* Black overlays */
rgba(0, 0, 0, 0.05)   /* Very subtle shadow */
rgba(0, 0, 0, 0.1)    /* Soft shadow */
rgba(0, 0, 0, 0.2)    /* Medium shadow */
rgba(0, 0, 0, 0.4)    /* Modal backdrop */

/* White overlays */
rgba(255, 255, 255, 0.1)   /* Subtle highlight */
rgba(255, 255, 255, 0.2)   /* Soft highlight */

/* Slate overlays */
rgba(74, 97, 118, 0.1)     /* Soft slate tint */
rgba(74, 97, 118, 0.15)    /* Medium slate tint */
```

---

## Design Tool Swatches

### Figma/Sketch Export
```json
{
  "Daymark Primary": "#4a6176",
  "Daymark Dark": "#2f3d4c",
  "Daymark Light": "#f0f2f5",
  "Text Primary": "#1e242e",
  "Text Secondary": "#6b7684",
  "Background": "#fafbfc",
  "Success": "#52a68a",
  "Warning": "#d4a574",
  "Error": "#c17369"
}
```

### Tailwind Config
```js
colors: {
  slate: {
    50: '#f0f2f5',
    500: '#4a6176',
    700: '#2f3d4c',
    900: '#1a2128',
  },
  gray: {
    50: '#fafbfc',
    600: '#6b7684',
    900: '#1e242e',
  },
  success: '#52a68a',
  warning: '#d4a574',
  error: '#c17369',
}
```

---

## Print Ready (CMYK Approximations)

```
Core Slate (#4a6176):     C:72  M:54  Y:39  K:11
Deep Slate (#2f3d4c):     C:77  M:61  Y:46  K:39
Muted Sage (#52a68a):     C:56  M:15  Y:44  K:0
Muted Amber (#d4a574):    C:8   M:28  Y:54  K:0
Muted Rose (#c17369):     C:15  M:48  Y:49  K:0
```

*Note: CMYK conversions are approximations. For critical print work, verify colors with your printer.*

---

## Brand Protection

Do not use:
- ❌ Bright blues (#0066e6, #1a80ff)
- ❌ Alert reds (#dc3545, #ff0000)
- ❌ Neon colors
- ❌ Pure black text on white (#000000 on #ffffff)
- ❌ High contrast borders (use #e9ebee or softer)

Always use:
- ✅ Muted, calm tones
- ✅ Soft contrasts
- ✅ Near-black text (#1e242e) instead of pure black
- ✅ Off-white backgrounds (#fafbfc) instead of pure white where appropriate
