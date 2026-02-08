# UX/UI Design System

> **Philosophy**: Dual Experience - strict separation between Management and Operation.

---

## Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTIER UI                           │
├────────────────────────┬────────────────────────────────┤
│   🏗️ THE TOWER         │   🖐️ THE HANDS                 │
│   Desktop Admin        │   Mobile Worker                │
│   Data-Dense           │   Touch-First                  │
│   Precision            │   Frictionless                 │
└────────────────────────┴────────────────────────────────┘
```

---

## 🏗️ World 1: The Tower (Desktop Admin)

**User**: Managers / Directors
**Framework**: Shadcn/ui + Tailwind CSS
**Vibe**: Precision, Control, Data-Dense

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headings | Inter | 24-32px | 600-700 |
| Body | Inter | 14px | 400 |
| Data/Mono | JetBrains Mono | 12px | 400 |
| Labels | Inter | 12px | 500 |

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#F8FAFC` | Page background (Slate-50) |
| `--bg-surface` | `#FFFFFF` | Cards, modals |
| `--text-primary` | `#0F172A` | Headings (Slate-900) |
| `--text-secondary` | `#64748B` | Body text (Slate-500) |
| `--accent-primary` | `#0EA5E9` | Links, actions (Sky-500) |
| `--status-ok` | `#22C55E` | Success (Green-500) |
| `--status-warning` | `#F59E0B` | Warning (Amber-500) |
| `--status-critical` | `#EF4444` | Error/Alert (Red-500) |

### Key Components

| Component | Library | Notes |
|-----------|---------|-------|
| Data Tables | TanStack Table | Sortable, filterable, pagination |
| Forms | React Hook Form + Zod | Validation |
| Charts | Recharts | Dashboard visualizations |
| Dialogs | Shadcn Dialog | Confirmations, CRUD |
| Toasts | Sonner | Notifications |

### Layout Grid

```
┌──────────────────────────────────────────┐
│ Header (64px)                            │
├──────────┬───────────────────────────────┤
│ Sidebar  │ Main Content                  │
│ (256px)  │ (flex-1)                      │
│          │                               │
│          │ ┌───────────────────────────┐ │
│          │ │ Page Header               │ │
│          │ ├───────────────────────────┤ │
│          │ │ Content Area              │ │
│          │ │ max-width: 1280px         │ │
│          │ │ padding: 24px             │ │
│          │ └───────────────────────────┘ │
└──────────┴───────────────────────────────┘
```

---

## 🖐️ World 2: The Hands (Mobile Worker)

**User**: Housekeeping / Laundry Staff
**Framework**: Custom React Components + Framer Motion
**Vibe**: Frictionless, tactile, bold

### Design Rules

1. ❌ **No Text Inputs** - Everything is tapping
2. 👍 **Thumb Zone** - Primary actions in bottom 30% of screen
3. 📳 **Haptic Feedback** - Visual + vibrate on every tap
4. 🌙 **Dark Theme** - Saves battery, high contrast in dim corridors

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Welcome | Outfit | 28px | 600 |
| Labels | Outfit | 18px | 500 |
| Numbers | Outfit | 32px | 700 |
| Buttons | Outfit | 20px | 600 |

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-dark` | `#111827` | Background (Gray-900) |
| `--bg-surface` | `#1F2937` | Cards (Gray-800) |
| `--text-primary` | `#F9FAFB` | Primary text (Gray-50) |
| `--text-secondary` | `#9CA3AF` | Secondary (Gray-400) |
| `--item-towels` | `#3B82F6` | Towels category (Blue-500) |
| `--item-sheets` | `#06B6D4` | Sheets category (Cyan-500) |
| `--item-amenities` | `#F59E0B` | Amenities (Amber-500) |
| `--action-send` | `#22C55E` | Send/Confirm (Green-500) |
| `--action-cancel` | `#6B7280` | Cancel (Gray-500) |

### Touch Targets

| Element | Minimum Size | Recommended |
|---------|--------------|-------------|
| Primary Button | 48x48px | 60x60px |
| Item Card | 80x80px | 100x100px |
| Counter (+/-) | 44x44px | 56x56px |

### Key Components

#### The Big Button
Primary action button for submitting events.

```
┌─────────────────────────────────────────┐
│                                         │ ← Full width
│          ENVIAR A LAVANDERÍA            │ ← 20px bold
│                                         │
│              ████████████               │ ← Progress bar
└─────────────────────────────────────────┘
   Height: 64px | Border-radius: 16px
```

#### Item Card
Touchable card for selecting items.

```
┌──────────────┐
│     🧺       │ ← Icon (32px)
│              │
│ Toalla Grande│ ← Name (16px)
│              │
│   ┌───┬───┬───┐
│   │ - │ 3 │ + │ ← Counter
│   └───┴───┴───┘
└──────────────┘
  Width: flex | Height: 120px
```

#### PIN Keypad
Numeric input for authentication.

```
┌─────────────────────────┐
│  ●  ●  ○  ○             │ ← PIN dots
├───────┬───────┬─────────┤
│   1   │   2   │   3     │
├───────┼───────┼─────────┤
│   4   │   5   │   6     │
├───────┼───────┼─────────┤
│   7   │   8   │   9     │
├───────┼───────┼─────────┤
│  ⌫   │   0   │   ✓     │
└───────┴───────┴─────────┘
  Button size: 72x72px
```

---

## Interactions

| Gesture | Action | Feedback |
|---------|--------|----------|
| Tap | Increment count | Vibrate (50ms) + scale animation |
| Long Press | Decrement | Vibrate (100ms) + visual feedback |
| Swipe Right | Submit batch | Success animation |
| Swipe Left | Cancel | Confirm dialog |

---

## States

### Loading

```
┌─────────────────────────┐
│      ◉ ◌ ◌              │ ← Spinner dots
│                         │
│    Enviando...          │
└─────────────────────────┘
```

### Success

```
┌─────────────────────────┐
│         ✓               │ ← Check icon (animated)
│                         │
│   ¡Registrado!          │
│   8 piezas enviadas     │
└─────────────────────────┘
  Auto-dismiss: 2 seconds
```

### Error

```
┌─────────────────────────┐
│         ✕               │ ← X icon
│                         │
│   Error de conexión     │
│   [Reintentar]          │
└─────────────────────────┘
```

---

## Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Button Press | scale(0.95) | 100ms | ease-out |
| Counter Change | scale(1.1) | 150ms | spring |
| Page Transition | slide + fade | 200ms | ease-in-out |
| Success Check | draw + scale | 400ms | spring |
| Toast Enter | slide-up | 300ms | ease-out |

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color Contrast | WCAG AA (4.5:1 minimum) |
| Touch Targets | 48px minimum |
| Screen Reader | aria-labels on all interactive |
| Reduced Motion | Respect `prefers-reduced-motion` |
| Font Scaling | Support 200% zoom |

---

## Dark Theme (Mobile Only)

Mobile workers operate in:
- Dim corridors
- Bright laundry rooms
- Varying light conditions

**Solution**: High-contrast dark theme with saturated action colors.

| Benefit | Implementation |
|---------|----------------|
| Battery saving | OLED-friendly blacks |
| Readability | High contrast ratios |
| Focus | Minimal visual noise |

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Tower (Light) */
  --tower-bg: #F8FAFC;
  --tower-surface: #FFFFFF;
  --tower-text: #0F172A;
  --tower-accent: #0EA5E9;
  
  /* Hands (Dark) */
  --hands-bg: #111827;
  --hands-surface: #1F2937;
  --hands-text: #F9FAFB;
  --hands-accent: #22C55E;
  
  /* Shared */
  --status-ok: #22C55E;
  --status-warning: #F59E0B;
  --status-critical: #EF4444;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```
