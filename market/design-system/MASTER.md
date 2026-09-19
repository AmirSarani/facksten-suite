# Facksten Design System — MASTER

> Source of truth for storefront + panel visual work. Overrides generic ui-ux-pro-max suggestions.

## Direction: Facksten Cyber (High-Tech, Low-Life)

Persian RTL electronics store rendered as a rogue terminal — void black, orange neon brand energy, magenta/cyan signal noise. Signature: scanlines + chamfered panels + chromatic glitch on hero + real product photography against HUD chrome.

## Locked brand tokens

| Role | Value | CSS |
|------|-------|-----|
| CTA / accent | `#FF7A00` | `--primary-container`, `.bg-cta`, `.text-cta` |
| CTA hover | `#E66E00` | `.bg-cta:hover`, `--cta-hover` |
| On CTA | `#0a0a0f` | `--on-primary` |
| Secondary neon | `#ff00ff` | `--accent-secondary` |
| Tertiary neon | `#00d4ff` | `--accent-tertiary` |
| Page / void | `#0a0a0f` | `--background` / `--surface` |
| Cards / panels | `#12121a` | `--surface-container-lowest` |
| Muted chrome | `#1c1c2e` | `--surface-container-*` |
| Muted copy | `#9ca3af` | `--on-surface-variant` |
| Body text | `#e0e0e0` | `--on-surface` |
| Border | `#2a2a3a` | `--outline` |
| Destructive | `#ff3366` | `--error` |

**Never hardcode `#FF7A00` / `#E66E00` in JSX** — use `bg-cta`, `bg-primary-container`, `text-cta`, `text-primary-container`, or `hover:bg-[var(--cta-hover)]`.

## Typography

- **Body / Persian UI:** Vazirmatn (`font-sans`)
- **Brand wordmark (Latin):** Oxanium (`--font-brand`)
- **HUD / labels / mono:** JetBrains Mono (`--font-mono`, `.font-mono`)
- Do not apply Orbitron/Oxanium to Persian section headlines

## Visual signatures

- `.cyber-scanlines` / body overlay
- `.cyber-chamfer` / `.cyber-chamfer-sm` (clip-path corners)
- `.cyber-glitch` chromatic aberration on hero
- `.cyber-grid` circuit background
- Neon glow via `--box-shadow-neon*` (orange primary)
- Terminal prefixes (`>`) on inputs / USP rows

## Homepage section jobs (one job each)

1. Hero — full-bleed void + glitched brand thesis + HUD
2. Category strip — bordered icon squares + glow
3. Trust USP — terminal divider row
4. Deals carousel — chamfered product cards
5. New products — horizontal snap rail
6. Promo band — full-bleed orange neon
7. Popular — dense media-first grid
8. Arduino — asymmetric feature + 3
9. Digital / social / articles / newsletter — terminal / holographic chrome

## Layout rules

- Dark void mandatory; RTL preserved (`dir="rtl"`, `lang="fa"`)
- Chamfered corners over soft `rounded-*`
- Neon borders that glow (stacked box-shadows)
- Prefer `ui/button`, `ui/card`, `ui/input` for new interactive chrome

## Motion

- Sharp / digital (100–150ms); glitch infrequent
- Hero: `.home-hero-*` + `.cyber-glitch`
- Always respect `prefers-reduced-motion` (disable glitch animations)

## Anti-patterns

- Light cream Maker Bench surfaces
- Soft multi-layer white cards with large radius
- Matrix green as primary (brand orange wins)
- Emoji as icons
- Ignoring reduced-motion

## Pre-delivery checklist

- [ ] `cursor-pointer` on clickable elements
- [ ] Visible keyboard focus (`.focus-cta` / ring accent)
- [ ] Contrast ≥ 4.5:1 for body text
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375 / 768 / 1024 / 1440
