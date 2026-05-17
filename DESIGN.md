---
name: jarocki.me
description: Personal site and notebook for Bartosz Jarocki. Engineer's-notebook aesthetic, single-signal accent.
colors:
  primary: "#FB2576"
  primary-light: "#FD92BA"
  primary-dark: "#8D0237"
  surface-light: "#FFFFFF"
  surface-dark: "#18181B"
  surface-halo-light: "#FAFAFA"
  surface-halo-dark: "#27272A"
  text-strong-light: "#27272A"
  text-strong-dark: "#F4F4F5"
  text-quiet-light: "#52525B"
  text-quiet-dark: "#A1A1AA"
  text-faint: "#71717A"
  ring-light: "#E4E4E7"
  ring-dark: "#3F3F46"
  link: "#3B82F6"
  prose-code: "#EC4899"
typography:
  display:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.75rem"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.75rem"
    letterSpacing: "normal"
  eyebrow:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.5rem"
    letterSpacing: "normal"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  gutter: "32px"
components:
  button-primary:
    backgroundColor: "{colors.text-strong-light}"
    textColor: "{colors.text-strong-dark}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-primary-hover:
    backgroundColor: "#3F3F46"
    textColor: "{colors.text-strong-dark}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  button-secondary:
    backgroundColor: "{colors.surface-halo-light}"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  badge:
    backgroundColor: "#F4F4F5"
    textColor: "{colors.text-quiet-light}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.md}"
    padding: "0 8px"
  nav-pill:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  nav-link-active:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  card:
    backgroundColor: "transparent"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.lg}"
    padding: "0"
  card-halo:
    backgroundColor: "{colors.surface-halo-light}"
    textColor: "{colors.text-strong-light}"
    rounded: "{rounded.lg}"
    padding: "0"
---

# Design System: jarocki.me

## 1. Overview

**Creative North Star: "The Engineer's Notebook"**

A lined notebook on a working engineer's desk. Most of the page is paper: zinc-toned, lightly contrasted, given over to text. One pen is permitted, a sharp magenta, used only to mark what matters. The chrome is restrained to the point of near-invisibility (a ring of one pixel, a tonal halo on hover); the typography carries the weight of the room. Personal but not precious, considered but never showy.

The system sits in opposition to three things: the generic Next.js-plus-Tailwind dev portfolio (hero, three cards, CTA), the corporate SaaS landing page (gradient hero, feature grid, logo wall), and the Dribbble showpiece (motion-for-motion's-sake, form over substance). It is also explicitly not magazine-grade essayist territory; the voice is an engineer's notebook, not a literary one.

Density is moderate. Spacing breathes on larger viewports; type does the structural work that borders and fills do in louder systems. Motion exists only as a response to reading: a hover that reveals a halo behind a card, a scroll that scales an avatar, a photo that straightens when you point at it. Nothing performs.

**Key Characteristics:**
- Zinc-and-magenta, dual-theme, parallel rules across light and dark
- Geist Sans plus Geist Mono; a single family pair carries the entire site
- Flat by default; depth from `ring-1` tonal contrast, not shadow
- The accent is a signal, not a wash; under 10% of any view
- Interaction reveals; the resting state is quiet

## 2. Colors

A near-monochrome zinc palette in two parallel themes, with one saturated signal color used sparingly.

### Primary

- **Signal Magenta** (`#FB2576`, `oklch(63.5% 0.247 0.6)`): the one saturated color in the system. Used only where attention is earned: the active nav link, the "Read note" CTA arrow on cards, the "Work in progress" badge on draft notes, the hover-color for badges and prose links. Never as a background fill on a hero or section. Never as a gradient.
- **Magenta Light** (`#FD92BA`): reserved for muted echoes (focus rings, future hover-tint surfaces). Currently undertilized; documented for ramp completeness.
- **Magenta Deep** (`#8D0237`): pressed/active states only.

### Neutral

The zinc family does almost all of the work. Each role has a light-theme and dark-theme value; treat them as a single semantic with two physical forms.

- **Surface** (`#FFFFFF` light / `#18181B` dark): the page. Wrapped in a fixed centered max-w-7xl ring-bordered canvas, giving the whole site a paper-on-desk read.
- **Surface Halo** (`#FAFAFA` light / `#27272A` dark): the hover wash behind cards. Only appears on interaction.
- **Text Strong** (`#27272A` light / `#F4F4F5` dark): headings and primary copy.
- **Text Quiet** (`#52525B` light / `#A1A1AA` dark): body copy when subordinated, secondary text in resume entries.
- **Text Faint** (`#71717A`): metadata and eyebrows in both themes (a single value that reads as faint against either ground).
- **Ring** (`#E4E4E7` light / `#3F3F46` dark): the tonal border that replaces shadow. Always rendered at low opacity (`ring-zinc-900/5` light, `ring-white/10` dark), never as a saturated stroke.

### Prose Accents

- **Link Blue** (`#3B82F6` light / `#60A5FA` dark): inline links inside long-form prose. Scoped to `.prose`; the rest of the site uses Signal Magenta for navigational color.
- **Code Pink** (`#EC4899`): inline `code` in prose.

### Named Rules

**The Signal Rule.** Signal Magenta appears on at most 10% of any rendered view, and only where it announces state or action: an active link, a CTA arrow, a status flag. It is never used decoratively (no gradient washes, no accent rules, no tinted backgrounds, no "magenta because it looks nice"). The color's rarity is the point.

**The Tonal Border Rule.** Borders are `ring-1` at low opacity (`ring-zinc-900/5` or `ring-white/10`), never a full-saturation stroke. If a border reads as a line, it is too loud. If you cannot see it, it is correct.

**The Two-Themes-One-Voice Rule.** Light and dark are not variants of each other; they are parallel realizations of one system. Every named color has both forms. A component that ships only one theme is incomplete.

## 3. Typography

**Display Font:** Geist Sans (Vercel) with `ui-sans-serif, system-ui, sans-serif` fallback.
**Body Font:** Geist Sans (same family).
**Mono Font:** Geist Mono with `ui-monospace, SFMono-Regular, Menlo, monospace` fallback.

**Character:** Geist is a contemporary humanist sans designed for technical interfaces, paired with a precise mono cut from the same drawing principles. The pair reads as engineering rather than editorial: clean apertures, even rhythm, no display affectation. One family across all surfaces is the deliberate move; hierarchy comes from scale and weight, not from font-switching.

### Hierarchy

- **Display** (`700`, `2.5rem` / 40px, line-height `1`, `tracking-tight`): page titles only. One per page.
- **Headline** (`600`, `1.5rem` / 24px, line-height `2rem`): section titles inside the About page and similar long-form layouts.
- **Title** (`600`, `1rem` / 16px, line-height `1.75rem`, `tracking-tight`): card titles. Note titles. Resume entry company names. The same size as body, distinguished by weight and tighter tracking.
- **Body** (`400`, `1rem` / 16px, line-height `1.75rem`): default reading copy. Long-form notes use the Tailwind Typography plugin defaults under `.prose`.
- **Eyebrow** (`400`, `0.875rem` / 14px, color `text-faint`): metadata that leads a card. Date stamps, role labels. Often paired with a 2px vertical pip (see Components / Eyebrow).
- **Label** (`500`, `0.8125rem` / 13px): badge text, small status flags.
- **Mono** (`700`, `0.75rem` / 12px): photo overlay captions only; otherwise mono is reserved for code blocks via the prose plugin.

### Named Rules

**The Tracking-Tight Rule.** Headings (Display, Headline, Title) carry `tracking-tight`. Body text is normal tracking. The contrast between tight headings and loose body is part of the rhythm; flat tracking across both reads as uncommitted.

**The Text-Balance Rule.** Page titles and card titles use `text-wrap: balance` (the local `.text-balance` utility). Headings that wrap to two lines should never strand a single short word on the second line.

**The One-Family Rule.** Geist Sans is the only display+body family. Reaching for a second sans, a serif, or a script breaks the workshop register. Mono is permitted but scoped to code and photo captions.

## 4. Elevation

The system is flat by default. Surfaces sit on the page; depth is communicated by tonal contrast (a faint zinc halo or a low-opacity ring) rather than cast shadow. The single permitted lift is the navigation pill: a `backdrop-blur` rounded-full element that floats over scrolled content, with a low-opacity shadow to make the blur read.

### Shadow Vocabulary

- **Nav Lift** (`box-shadow: 0 10px 15px -3px rgba(39, 39, 42, 0.05), 0 4px 6px -4px rgba(39, 39, 42, 0.05)`): the desktop nav pill, the mobile nav button. The shadow is barely there; its job is to support the backdrop-blur, not to announce elevation.
- **Avatar Emboss** (`box-shadow: 0 4px 6px -1px rgba(39, 39, 42, 0.05)`): the small circular avatars in the resume timeline. A whisper of depth for the round-on-rectangle composition.

That is the full shadow vocabulary. Cards, buttons, badges, inputs, and modals all sit flat.

### Named Rules

**The Tonal-Before-Shadow Rule.** When reaching for depth, reach for `ring-1` with a low-opacity zinc before reaching for `box-shadow`. The system already commits to flatness; shadow is the second answer, not the first.

**The Backdrop-Blur-Earns-Its-Lift Rule.** The nav pill is the only element permitted to float. Other floating UI (modals, popovers) inherits the same backdrop-blur language so the lift mechanic is one idea applied twice, not two competing ideas.

## 5. Components

The component philosophy is **restrained and revealing**: surfaces are visually quiet at rest, and state (hover, focus, scroll) is what makes them legible as interactive.

### Buttons

- **Shape:** softly rounded (6px, `rounded-md`); never pill, never sharp.
- **Primary:** zinc-800 background, zinc-100 text, padding `8px 12px`. Hover lightens to zinc-700; active darkens back and dims the text to 70% opacity. Used for explicit actions outside of links.
- **Secondary:** zinc-50 background, zinc-900 text, same shape and padding. For subordinate actions.
- **Focus:** outline-offset 2 (browser default `:focus-visible` ring), not a glow.

### Badges

- **Style:** rounded-full pill, zinc-100 background (zinc-800 dark), text-faint, `text-xs font-medium`.
- **Hover:** text shifts to Signal Magenta. Background stays zinc.
- **Static Status Variant:** a non-interactive form (`rounded-md`, Signal Magenta background, white text) used for the "Work in progress" flag inside note eyebrows. The shape change (`md` vs `pill`) signals that this is a state, not a tag to click.

### Cards

The card is not a visible card. It is a wash that appears on hover.

- **Resting state:** no border, no background, no shadow. The content composes itself flatly inside a flex column.
- **Hover state:** a `bg-zinc-50` (zinc-800/50 dark) halo appears behind the card with `scale-95 → scale-100` and `opacity-0 → opacity-100`, rounded to 16px. The halo's bounding box extends 16px outside the content (`-inset-y-6 -inset-x-4` becoming `-inset-x-6` at `sm:`), so the card "grows into" its background.
- **Anatomy:** Card.Title (16px semibold, tracking-tight), Card.Eyebrow (14px text-faint, optionally with the decorate pip), Card.Description (14px), Card.Cta (14px medium, Signal Magenta, with a `→` glyph).
- **Click target:** an absolutely positioned `<Link>` covers the halo's full bounding box; the whole card is clickable, no link-on-link nesting.

### Navigation

- **Desktop:** a single `rounded-full` pill (`bg-white/90` / `bg-zinc-800/90`) with `backdrop-blur`, `ring-1 ring-zinc-900/5`, and Nav Lift shadow. Sits centered above the page. Items are `px-3 py-2 text-sm font-medium`.
- **Active link:** text color shifts to Signal Magenta. No underline. No background change. The color shift is the entire affordance.
- **Hover:** text transitions to Signal Magenta with the default Tailwind `transition`.
- **Mobile:** a "Menu" pill with the same chrome opens a `rounded-3xl` panel with a `bg-zinc-800/40 backdrop-blur-sm` overlay. Items inside the panel are divider-separated rows, not pills.

### Eyebrow

The eyebrow is metadata that leads a card or section: a date, a role label, a status note.

- **Plain:** `text-sm text-faint`, no chrome.
- **Decorated:** a 2px-wide vertical pip (`h-4 w-0.5 rounded-full bg-zinc-200` / `bg-zinc-500` dark) sits 14px to the left of the eyebrow text, vertically centered. This is the system's only structural use of a thin vertical mark, and it leads metadata only. It is not a card border, not a callout stripe, not a section accent. (See the Don'ts: side-stripe borders >1px as decorative card accents are banned; the pip is a 2px metadata leader, not a stripe.)

### Photos Strip (Signature)

A horizontal scroller of travel photos, each randomly rotated by ±1.3°, in zinc-100 backed `rounded-xl` aspect-9/10 containers.

- **Rest:** photo is rotated, scaled 1.
- **Hover:** scale to 1.1 with rotation to 0° (`duration 0.2s`); a black-gradient overlay fades in from the bottom and reveals a `font-mono text-xs font-bold` caption. The photo "straightens to be inspected."
- **Scroll-in:** opacity fades in with a staggered delay (`idx / 100s`).
- Scrollbars hidden via `.hide-scrollbar` utility.

### Avatar

A circular `Image` in a `ring-1 ring-zinc-900/5` shadow-md container.

- **Home page:** scroll-driven. On scroll the avatar scales from 64px to 36px and translates 2/16rem to the right; a separate "border" element scales inversely so the ring stays one pixel wide regardless of avatar size. Implemented with CSS custom properties (`--avatar-image-transform`, `--avatar-border-transform`) updated in a scroll listener, not animated via JS-driven layout properties.
- **Other pages:** static, small, top-left.

### Resume Card

A `max-w-[420px]` `rounded-2xl ring-1` (`border` actually, but visually one pixel) box listing recent work. Each row: a 40×40 ring-bordered circular logo, the company name (`text-sm font-medium text-strong`), a right-aligned date range (`text-xs text-quiet`), the role (`text-xs text-quiet`). This is the only place in the system where a visible bordered container is used; it earns the border by being a callout block inside a flow of bare content.

## 6. Do's and Don'ts

### Do:

- **Do** keep Signal Magenta (`#FB2576`) under 10% of any rendered view. The Signal Rule is non-negotiable; the magenta only marks state or action.
- **Do** reach for `ring-1` with low-opacity zinc before reaching for `box-shadow`. Tonal contrast first, shadow second. Flat is the default.
- **Do** ship both light and dark forms for every component. A one-theme component is incomplete.
- **Do** use `tracking-tight` on headings (Display, Headline, Title) and normal tracking on body. The contrast is part of the rhythm.
- **Do** use `text-wrap: balance` on page titles and card titles; do not strand a single word on the second line.
- **Do** reveal interaction state through tonal halos and motion, not through additional chrome (no extra borders, no fills, no shadows).
- **Do** use Geist Sans for everything; reserve Geist Mono for code and the photo-strip captions.

### Don't:

- **Don't** add a second display family or a serif. The One-Family Rule holds.
- **Don't** use Signal Magenta as a background fill, a gradient wash, or a decorative accent. It is a pen, not a paint.
- **Don't** ship a gradient hero, a feature-card grid, a logo wall, a "Trusted by" row, or a testimonial slider. These read as corporate SaaS landing; the site is explicitly not that.
- **Don't** ship the generic Next.js + Tailwind dev-portfolio silhouette (centered hero with avatar, three identical project cards, a single CTA). The whole point is to stop reading as that.
- **Don't** ship motion that performs without serving the reader. The Photos hover, the card halo, and the scroll-driven avatar earn their motion by making content easier to engage with. New motion needs the same justification or it slides into Dribbble-showpiece territory.
- **Don't** apply `border-left` or `border-right` greater than 1px as a colored accent on cards, list items, callouts, or alerts. The 2px Eyebrow pip is the single exception and it is a metadata leader, not a card stripe.
- **Don't** apply `background-clip: text` with a gradient. Headings are solid color, emphasis through weight and size.
- **Don't** use glassmorphism decoratively. The nav pill's `backdrop-blur` exists because the pill floats over content; other surfaces do not get to imitate it.
- **Don't** introduce a feature-card grid of identical icon+heading+text tiles. The site never repeats a card pattern.
- **Don't** reach for a modal as the first answer. Inline disclosure and route-level pages are the defaults.
- **Don't** use em dashes in copy. Use commas, colons, semicolons, periods, or parentheses.
