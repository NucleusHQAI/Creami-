# 03 — Design system

The original document already had a strong, consistent look. This carries it over as tokens and components rather than a 4,000-character CSS string.

## The feel

Warm, printed, a bit editorial. Cream paper rather than white screen, a dot grid behind everything, generous rounded corners, one confident berry accent. Type does the work: very large tight display headings against small, quiet body text.

What it must not become: a generic dashboard. No grey-on-white cards, no drop shadows on everything, no purple gradient buttons.

## Colour

```js
// tailwind.config.ts → theme.extend.colors
colors: {
  cream:  '#fffaf2',   // page background
  paper:  '#fffdf9',   // card surfaces, one step lighter than the page
  ink:    '#232238',   // primary text, dark surfaces, primary buttons
  muted:  '#686579',   // secondary text
  line:   '#e9e2d7',   // borders and dividers
  berry:  '#cf365f',   // the accent — links, active states, key actions
  berrydk:'#a62249',   // eyebrow text, hover on berry
  blue:   '#385d8a',   // protein figures only
}
```

Use them semantically. `bg-cream`, `text-ink`, `border-line`. A raw hex in a class name is a review comment.

**Category colours come from the database**, not from Tailwind. Each category row carries `accent` and `tint`, applied as CSS custom properties on the card so utilities can reference them:

```tsx
<article
  className="rounded-recipe border border-line bg-paper"
  style={{ '--accent': category.accent, '--tint': category.tint } as CSSProperties}
>
```

Seeded values:

| Category | Accent | Tint |
|---|---|---|
| Creamy classics | `#d49b29` | `#fff1cf` |
| Fruit & cheesecake | `#d94468` | `#ffe7ee` |
| Bakery & biscuit | `#a9673a` | `#f4e5d8` |
| Coffee & caramel | `#755143` | `#eee2dc` |
| Chocolate | `#50342e` | `#ece0dc` |

Semantic colours for the freezer states — derived from the palette, not bolted on:

| State | Treatment |
|---|---|
| Freezing | `text-muted` on `bg-line/40`, snowflake icon |
| Ready to spin | `text-berry` on `bg-berry/10`, berry left border |
| Spun | `text-ink` on `bg-paper` |
| Finished | `text-muted`, 60% opacity |

### Contrast

`muted` on `cream` is about 5.1:1 — fine for body text, not for anything under 14px. Do not lighten it. Anything on a category `tint` must use `ink`, never `muted`; some of those tints are pale.

## Type

Three families, loaded from Google Fonts with `display=swap`:

```js
fontFamily: {
  display: ['"Bricolage Grotesque"', 'sans-serif'],  // headings only
  sans:    ['"DM Sans"', 'sans-serif'],              // everything else
  mono:    ['"DM Mono"', 'monospace'],               // labels, pills, numbers
}
```

| Role | Spec | Notes |
|---|---|---|
| Page title | `font-display`, `clamp(32px, 6vw, 48px)`, `tracking-[-0.04em]`, `leading-[1.05]` | |
| Section heading | `font-display`, 24–28px, `tracking-[-0.03em]` | |
| Card title | `font-display`, 20–22px, `tracking-[-0.025em]` | Recipe cards specifically go bigger and bolder: 24px, `font-extrabold`, `tracking-[-0.03em]` — see Recipe card below |
| Body | `font-sans`, 15px, `leading-[1.5]` | |
| Small / secondary | `font-sans`, 13px, `text-muted` | |
| Eyebrow | `font-mono`, 11px, `uppercase`, `tracking-[0.12em]`, `text-berrydk` | |
| Pill / label | `font-mono`, 10px, `font-bold`, `tracking-[0.08em]` | |

The tight negative tracking on display type is most of what makes this look like the original. Do not drop it.

Never go below 12px for anything a person has to read. Phone, kitchen, arm's length.

## Spacing, radius, shadow

4px base scale — Tailwind's default is already this, so just use it.

```js
borderRadius: {
  recipe: '23px',   // recipe cards
  panel:  '25px',   // section panels
  soft:   '20px',   // inputs, small surfaces
  pill:   '99px',   // chips, filters, buttons
}
boxShadow: {
  lift:        '0 18px 50px rgba(55, 45, 35, 0.09)',   // hover / raised only
  sticker:     '0 3px 0 0 #e9e2d7',                     // flat "pop" shadow — recipe cards, search bar
  'sticker-sm':'0 2px 0 0 #e9e2d7',                     // flat shadow for small sticker-style badges
}
```

`lift` is the soft hover shadow. `sticker`/`sticker-sm` are flat, hard-edged shadows paired with a `border-2 border-ink` — used on recipe cards, the search bar and small circular badges to give them a tactile, cut-out feel, like a label pinned onto paper. Don't blur them and don't use them together with `lift` on the same element. Everything else is still separated with `border-line`, not a shadow.

## The dot grid

The background texture from the original, one rule in `globals.css`:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  opacity: 0.25;
  background-image: radial-gradient(#d8cdbd 0.65px, transparent 0.65px);
  background-size: 11px 11px;
}
```

## Layout

Phone-first. Content column maxes out at `max-w-[1240px]` with `px-4` on phones, `px-6` above.

**Navigation is a fixed bottom bar on phones** — four items, thumb-reachable:

| | Label | Route |
|---|---|---|
| 🍦 | Recipes | `/` |
| ❄️ | Freezer | `/freezer` |
| 🛒 | Shopping | `/shopping` |
| ☰ | More | `/more` |

Above 768px it moves to a top bar with the same destinations plus the wordmark. The bottom bar needs `pb-[env(safe-area-inset-bottom)]`, or it sits under the home indicator on an iPhone.

Grids: 1 column on phones, 2 from 768px, 3 from 1100px.

## Components

Built in this order. Each lives in `src/components/ui/` and takes no feature knowledge.

| Component | Variants / notes |
|---|---|
| `Button` | `primary` (ink fill), `secondary` (line border), `ghost`, `danger`. Sizes `sm` `md` `lg`. Min height 44px on `md` and up |
| `IconButton` | 44×44 minimum. Always an `aria-label` |
| `Card` | Paper surface, line border, `rounded-recipe` |
| `Pill` | `default`, `protein` (blue tint), `base` (green tint), `accent` (category tint). Mono type |
| `Chip` | Interactive, toggles. `border-2 border-ink` when unselected, `bg-berry border-berry` when selected — berry is the accent for active states, not ink |
| `FavouriteButton` | Heart. Filled ink when saved, outline when not. Optimistic. On recipe cards it's dressed as a small pinned sticker (`border-2 border-ink`, `shadow-sticker-sm`, slight rotation) |
| `Sheet` | Bottom sheet on phones, centred modal above 768px. Focus trap, Escape closes, background scroll locked |
| `Field` | Label, input, hint, error. Wraps React Hook Form |
| `QuantityInput` | Number plus unit selector (g / ml / item). Spoon helper where the ingredient has `grams_per_tsp` |
| `Stepper` | Numeric stepper for servings and multipliers |
| `Skeleton` | Shimmering block. Every loading state uses these, not spinners |
| `EmptyState` | Icon, message, and an action. Never a bare "no results" |
| `ErrorState` | Message plus retry |
| `RatingStars` | Read-only and interactive modes |

### Recipe card

The most-seen component in the app, so it is specified rather than left to taste. It reads as a tub lid rather than a data card: a wax-seal emoji badge on a soft illustrated blob, a wavy label edge, one quiet line of stats instead of stacked pills.

```
┌══════════════════════════════════┐   2px ink border,
│  ░░ tinted blob ░░               │   shadow-sticker (flat, not blurred)
│  ♡      (🍦)                     │   96px band, category tint,
│         ░░░░                     │   one soft rotated blob in accent,
│  ﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏﹏  │   emoji in a bordered "seal" circle,
╞══════════════════════════════════╡   wavy edge (.recipe-wave) into the body
│  CREAMY CLASSICS                 │   mono, 9.5px, ink
│  Vanilla Custard                 │   display, 24px, extrabold
│  Proper vanilla, custardy and…   │   13px muted, 2 lines, clamped
│  Everyday creamy · 458 kcal ·    │   mono, 11px, ink — labels regular
│  68g protein · ★ 4.5             │   weight, values bold, no boxes
│                                  │
│  View recipe                   → │
└──────────────────────────────────┘
```

The band carries one soft, irregular blob (`border-radius` set per corner, not a circle) in the category accent, rotated a few degrees — distinctive without needing image assets. The emoji sits in a small paper circle with its own ink border and `shadow-sticker-sm`, like a badge stamped onto the lid. The favourite heart is the other sticker on the band, rotated the opposite way.

Stats are one plain-language mono line, not a pill grid — `base name · kcal · protein · rating`, joined with a faint `·`. Only the values (not the base name) are bold. This was a deliberate move away from an earlier, busier direction that boxed every figure — keep it to one line.

Tapping the card opens the detail route. The heart is the one exception and must `stopPropagation`.

## Motion

Restrained. 150–200ms, `ease-out`.

- Cards lift 3px on hover with `shadow-lift`. Pointer devices only.
- Sheets slide up from the bottom.
- The favourite heart gets one small scale pulse on activation.

Wrap anything decorative in `motion-safe:` and honour `prefers-reduced-motion`.

## Accessibility

Not optional, and cheap if done as you go:

- Every interactive element reachable and operable by keyboard, with a visible focus ring (`ring-2 ring-berry ring-offset-2`).
- Icon-only buttons always carry an `aria-label`.
- Category is conveyed by text as well as colour — the label is always present.
- Sheets are `role="dialog"` with `aria-modal`, trap focus, and return focus on close.
- Live regions announce macro recalculation when the servings toggle changes.
- Form errors are tied to their input with `aria-describedby`.

## Dark mode

Not in scope. The palette is built around warm paper and would need a genuine redesign rather than an inversion. Do not add a `dark:` variant to anything — half-implemented dark mode is worse than none.
