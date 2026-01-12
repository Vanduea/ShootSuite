# ShootSuite Brand Guide

## 1. Overview

This document defines the visual identity and design system for ShootSuite, ensuring consistency across all user interfaces and touchpoints.

## 2. Logo & Assets

- **Logo**: Located in `/assets/logo.png`
- **Icons**: 
  - `/assets/icon128.png` (128x128)
  - `/assets/icon300.png` (300x300)
- **Favicon**: `/assets/favicon.ico`

All assets are also available in `/public/` for web access.

## 3. Color Palette

### 3.1 Primary Brand Colors

| Color Role | Hex Code | Usage |
|------------|----------|-------|
| Primary Deep Indigo | `#261A54` | Headers, primary buttons, navigation, brand anchors |
| Secondary Blue | `#345EBE` | Accents, highlights, links, progress indicators |

### 3.2 Supporting Neutrals

| Color | Hex | Usage |
|-------|-----|-------|
| Dark Text | `#0F172A` | Primary text |
| Muted Text | `#475569` | Secondary text |
| Border Gray | `#E5E7EB` | Dividers, outlines |
| Background Light | `#F8FAFC` | App background |
| White | `#FFFFFF` | Cards, surfaces |

### 3.3 Accessibility

- Maintain WCAG AA contrast ratio (≥ 4.5:1) for text
- Use `#261A54` on light backgrounds for body text
- Avoid placing `#345EBE` text on dark backgrounds

## 4. Typography

### 4.1 Primary Typeface

**Montserrat** (Google Fonts)

Chosen for its:
- Clean geometric structure
- Excellent readability
- Modern, premium feel

### 4.2 Font Weights

| Weight | Usage |
|--------|-------|
| 700 (Bold) | Page titles, section headers |
| 600 (Semi-Bold) | Card titles, key labels |
| 500 (Medium) | Buttons, navigation |
| 400 (Regular) | Body text |

### 4.3 Type Scale

| Element | Size |
|---------|------|
| App Title | 28–32px |
| Section Header | 20–24px |
| Card Title | 16–18px |
| Body Text | 14–16px |
| Caption | 12px |

## 5. UI Design Principles

### 5.1 Layout

- Grid-based layouts
- Generous white space
- Clear hierarchy
- Card-driven structure

### 5.2 Buttons

#### Primary Button
- Background: `#261A54`
- Text: `#FFFFFF`
- Border Radius: 10–12px
- Usage: Main actions, CTAs

#### Secondary Button
- Background: `#345EBE`
- Text: `#FFFFFF`
- Border Radius: 10–12px
- Usage: Secondary actions

#### Tertiary / Ghost Button
- Border: `#345EBE`
- Text: `#345EBE`
- Background: Transparent
- Border Radius: 10–12px
- Usage: Less prominent actions

### 5.3 Cards

- Background: `#FFFFFF`
- Border: `#E5E7EB`
- Border Radius: 8px
- Shadow: Subtle (sm)
- Padding: 24px (1.5rem)

## 6. Iconography

- **Style**: Outline or minimal filled icons
- **Stroke weight**: Consistent across app
- **Preferred libraries**: 
  - Lucide React (`lucide-react`)
  - Heroicons (alternative)
- Icons should support content, not dominate it

## 7. Imagery & Visual Style

### 7.1 Photography

- Authentic, real-world photography
- Behind-the-scenes moments
- Creative work environments

**Avoid:**
- Overly staged stock photos
- Generic corporate imagery

### 7.2 Illustration (Optional)

- Subtle line-based illustrations
- Minimal color usage
- Used primarily for empty states

## 8. Brand Voice & Copy

### 8.1 Voice

- Confident
- Helpful
- Clear
- Friendly but professional

### 8.2 Example Microcopy

| Context | Example |
|---------|---------|
| Empty State | "No shoots yet — your next masterpiece starts here." |
| Payment Locked | "Complete payment to unlock your gallery." |
| Success | "Payment received. Delivery unlocked." |

## 9. Application Contexts

### 9.1 App Shell

- Header uses `#261A54`
- Active states use `#345EBE`
- Clean white cards over light background (`#F8FAFC`)

### 9.2 Client Portal

- Photographer branding overrides system defaults
- ShootSuite branding remains subtle (footer only)

## 10. Brand Governance

### 10.1 Consistency Rules

- All new features must follow this guide
- No custom colors outside palette without approval
- Typography must remain Montserrat
- Icons must use approved libraries (Lucide/Heroicons)

## 11. Implementation

### 11.1 Tailwind CSS Classes

```css
/* Colors */
bg-primary          /* #261A54 */
bg-secondary        /* #345EBE */
text-text-dark      /* #0F172A */
text-text-muted     /* #475569 */
border-border-gray  /* #E5E7EB */
bg-bg-light         /* #F8FAFC */

/* Buttons */
btn-primary
btn-secondary
btn-tertiary

/* Typography */
text-app-title      /* 28px, bold */
text-section-header /* 20px, bold */
text-card-title     /* 16px, semibold */
text-body           /* 14px, regular */
text-caption        /* 12px, regular */
```

### 11.2 React Components

Use Lucide React for icons:

```tsx
import { Camera, Calendar, DollarSign } from 'lucide-react'
```

## 12. Resources

- **Font**: [Montserrat on Google Fonts](https://fonts.google.com/specimen/Montserrat)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **Color Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Last Updated**: 2024
**Version**: 1.0

