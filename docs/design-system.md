# Veyala Design System — foundations

Source of truth for design tokens. Introduced as part of the premium UI/UX program
(see `docs/veyala-product-design-strategy.md`). This is **Étape 1 (Design tokens)** only —
components and pages are migrated incrementally in later steps, not in this commit.

No arbitrary colors were introduced: `success`/`warning` are HSL conversions of the
emerald/amber values already used by `Badge`/`Alert` before this change.

## Colors

All colors are HSL CSS custom properties in `app/globals.css` (`:root` + `.dark`), consumed
via `tailwind.config.ts` (`hsl(var(--token))`). Always reach for the semantic token
(`bg-card`, `text-destructive`, `bg-success`…) — never a literal Tailwind color
(`bg-blue-50`, `text-emerald-600`) — so dark mode (already fully wired, see
`components/layout/user-menu.tsx`) keeps working without extra effort.

| Token | Role |
|---|---|
| `background` / `foreground` | Page base |
| `card` / `card-foreground` | Surfaces, panels |
| `popover` / `popover-foreground` | Floating surfaces (dropdowns, tooltips) |
| `primary` / `primary-foreground` | Brand actions (Blue 600) |
| `secondary` / `secondary-foreground` | Soft accent background |
| `muted` / `muted-foreground` | De-emphasized text/background |
| `accent` / `accent-foreground` | Hover/active tint |
| `destructive` / `destructive-foreground` | Errors, destructive actions |
| `success` / `success-foreground` **(new)** | Confirmations, positive status |
| `warning` / `warning-foreground` **(new)** | Non-blocking warnings |
| `border` / `input` / `ring` | Borders, form outlines, focus rings |

`warning-foreground` is intentionally **dark**, not white like `success`/`destructive` —
amber at usable saturation fails WCAG AA contrast with white text. Don't "fix" this to match
the other variants without re-checking contrast.

## Radius — 2 tiers (was 4: `lg`/`xl`/`2xl`/`3xl` used interchangeably)

| Tier | Class | Value | Use for |
|---|---|---|---|
| Interactive | `rounded-lg` / `rounded-md` / `rounded-sm` | `var(--radius)` = 12px (and steps down) | Buttons, inputs, badges, dense inline cards |
| Panel | `rounded-panel` | `var(--radius-panel)` = 16px | Cards, panels, modals, dialogs |

`rounded-full` stays reserved for pill buttons and round avatars/badges — unaffected.
New code should not reach for `rounded-xl`, `rounded-2xl`, or `rounded-3xl` — pick the
tier that matches the element's role instead. Existing occurrences are migrated
incrementally (see the component strategy in the product design strategy doc), not in
this commit.

## Shadows — 3 levels, subtle by design

| Class | Use for |
|---|---|
| `shadow-elevation-rest` | Static cards/panels |
| `shadow-elevation-hover` | Hover state of an interactive surface |
| `shadow-elevation-floating` | Dropdowns, popovers, drawers, modals |

`shadow-sm`/`shadow-md`/`shadow-lg` still exist and aren't wrong — the named scale exists
so intent ("why does this have a shadow") stays legible in the markup. Avoid
`shadow-xl`/`shadow-2xl` in product UI; reserve heavier shadows for marketing-only
moments that are deliberately chosen, not accidental.

## Spacing

No new spacing tokens — Tailwind's default scale already covers everything needed.
The consistency problem found in the audit was *which* value gets picked for a given
role, not a missing value. Convention going forward:

| Role | Padding |
|---|---|
| Compact (mini stat, badge-adjacent) | `p-3` |
| Standard (default card/panel) | `p-4` |
| Spacious (primary form card) | `p-6` (already `CardContent`'s default) |

## Motion

| Token | Value | Already dominant usage |
|---|---|---|
| `duration-fast` | 150ms | Micro-interactions (icon hover) |
| `duration-base` | 300ms | Standard transitions — was already the most common value in the codebase |
| `duration-slow` | 500ms | Progress bars |
| `ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | Reveal/tab-in animations |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Springy hover (kept as the existing `.transition-bounce` utility class too — both are valid, the Tailwind tokens just make it usable as `duration-*`/`ease-*` on any utility) |

`prefers-reduced-motion` is handled globally in `app/globals.css` — components never need
to re-implement it.

## Breakpoints

Unchanged, intentionally: Tailwind defaults (`sm:640 md:768 lg:1024 xl:1280 2xl:1536`).
Not redefined in `tailwind.config.ts` — this was verified, not an oversight.

## What's next

This commit only adds tokens — it does not migrate existing components. The next steps
(UI primitives, then incremental page migration) are tracked in
`docs/veyala-product-design-strategy.md` (§9 Component strategy, §13 Roadmap).
