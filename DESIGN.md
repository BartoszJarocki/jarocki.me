---
name: jarocki.me
description: Personal site and notebook for Bartosz Jarocki. No accent color, Geist Mono chrome, Geist Sans prose, a Geist Pixel name, and every page built from index rows.
colors:
  bg-light: "oklch(98.4% 0.0025 95)"
  bg-dark: "oklch(15.5% 0.004 70)"
  ink-light: "oklch(21% 0.006 70)"
  ink-dark: "oklch(94% 0.004 80)"
  body-light: "oklch(40% 0.006 70)"
  body-dark: "oklch(76% 0.004 80)"
  faint-light: "oklch(54% 0.005 70)"
  faint-dark: "oklch(60% 0.004 80)"
  rule-light: "oklch(91% 0.004 80)"
  rule-dark: "oklch(27% 0.004 70)"
  wash-light: "oklch(95.6% 0.004 85)"
  wash-dark: "oklch(20% 0.004 70)"
typography:
  name:
    fontFamily: "Geist Pixel Square, Geist Mono, ui-monospace, monospace"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1
  clock:
    fontFamily: "Geist Pixel Square, Geist Mono, ui-monospace, monospace"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1
  chrome:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.72
  note-title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.028em"
  prose:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
  prose-heading:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.72
  code:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
spacing:
  page-top: "clamp(48px, 11vh, 112px)"
  page-side: "clamp(20px, 9vw, 160px)"
  page-bottom: "160px"
  column: "80ch"
  lede: "40px"
  clock: "28px"
  section: "56px"
  section-label: "8px"
  article: "72px"
  row-gap: "3ch"
  row-gap-mobile: "2ch"
components:
  index-row:
    textColor: "{colors.ink-light}"
    hoverBackgroundColor: "{colors.ink-light}"
    hoverTextColor: "{colors.bg-light}"
    padding: "0 1ch"
  code-block:
    backgroundColor: "{colors.wash-light}"
    textColor: "{colors.ink-light}"
    padding: "16px 20px"
---

# Design system: jarocki.me

## Overview

The site is an engineer's notebook, and every page reads like the index at the front of one. The chrome is set in Geist Mono at 14px. Note bodies switch to Geist Sans at 16px, because long prose reads better in a proportional face. The only display type is the name in the header, set in Geist Pixel Square.

There is no accent color. Hierarchy comes from four text tones on one background, from the switch between mono and sans, and from spacing. Nothing is rounded, nothing casts a shadow, and the only filled surfaces are code blocks, the hover state of a row, and the squares of the GitHub activity bars.

The theme follows the reader's system setting. There is no toggle.

## Colors

All colors are CSS custom properties on `:root` in `src/styles/index.css`, redefined under `@media (prefers-color-scheme: dark)`. Tailwind maps `bg`, `ink`, `body`, `faint`, `rule`, and `wash` to them, so `text-faint` and `bg-wash` follow the theme without a `dark:` variant.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `bg` | `oklch(98.4% .0025 95)` | `oklch(15.5% .004 70)` | The page. |
| `ink` | `oklch(21% .006 70)` | `oklch(94% .004 80)` | Names, titles, ledes, links, and the hover fill of a row. |
| `body` | `oklch(40% .006 70)` | `oklch(76% .004 80)` | Prose and descriptions. |
| `faint` | `oklch(54% .005 70)` | `oklch(60% .004 80)` | Dates, section labels, nav, trails, and code comments. |
| `rule` | `oklch(91% .004 80)` | `oklch(27% .004 70)` | Blockquote borders and `hr`. |
| `wash` | `oklch(95.6% .004 85)` | `oklch(20% .004 70)` | The code block background. |

Every text tone passes WCAG AA against `bg` in both schemes. The ratios below were measured from computed styles in Chromium:

| Pair | Light | Dark |
| --- | --- | --- |
| `ink` on `bg` | 16.95:1 | 16.40:1 |
| `body` on `bg` | 8.83:1 | 9.12:1 |
| `faint` on `bg` | 4.84:1 | 4.96:1 |

`faint` is the tone closest to the limit. Do not lighten it in light mode or darken it in dark mode. The prototype values, `oklch(60% .005 70)` and `oklch(56% .004 80)`, measured 3.77:1 and 4.20:1 and failed AA.

`_document.tsx` sets two `theme-color` metas, `#fafaf8` for light and `#0d0c0a` for dark. `::selection` inverts to `ink` on `bg`.

## Typography

`_app.tsx` loads three faces through `next/font` and sets their variables on the app wrapper, together with `font-mono` and the 14px/1.72 base.

| Tailwind family | Face | CSS variable |
| --- | --- | --- |
| `font-sans` | Geist | `--font-geist-sans` |
| `font-mono` | Geist Mono | `--font-geist-mono` |
| `font-pixel` | Geist Pixel Square, falling back to Geist Mono | `--font-geist-pixel-square` |

Each Tailwind family ends in a system fallback stack. Pixel Square is declared with `localFont` in `_app.tsx` instead of being imported from `geist/font/pixel`, because that module declares all five pixel variants and importing it preloads every one of them.

Type roles:

- **Name.** Pixel Square 28px, line-height 1, `ink`. It appears once per page, in the header, and links home.
- **Clock.** Pixel Square 24px, `ink`. It appears only on the home page.
- **Chrome.** Geist Mono 14px/1.72. Nav, ledes, section labels, rows, meta lines, and footers.
- **Note title.** Geist Sans 600, 30px/1.18, tracking `-0.028em`, `ink`, `max-width: 24ch`, `text-wrap: balance`.
- **Prose.** Geist Sans 16px/1.75 in `body`.
- **Prose headings.** Geist Mono 500 at 14px in `ink`, prefixed with a faint `#`, `##`, or `###` for `h1`, `h2`, and `h3`.
- **Code.** Geist Mono, 13px in blocks and 13.5px inline.

## Page layout

`PageShell` renders every page. It owns SEO tags, the page padding, the 80ch column, and the header.

- The page padding is `clamp(48px, 11vh, 112px)` at the top, `clamp(20px, 9vw, 160px)` at the sides, and 160px at the bottom. The side padding is the minimum gutter.
- The column is `max-width: 80ch` and centered in the viewport. Text inside it stays left-aligned.
- The header is a wrapping flex row with the name on the left and `notes work about` on the right. Nav links are `faint`, turn `ink` on hover, and the current section gets `aria-current="page"`, `ink`, and a 1px underline offset by 5px. Pages pass the section as `current`. Note and tag pages pass `notes`.
- A lede follows the header 40px below, in `ink`, at most 64ch wide. Pages keep their own copy and capitalization.
- Each section starts 56px below the previous block.

## The index row

The whole design is one shape: a labeled section of rows with three columns, `lead`, `main`, and `trail`. `src/components/Index.tsx` exports it.

- `IndexSection({ label, more?, children })` renders the label row: the label as a faint `h2`, and an optional right-aligned link such as `all 15 →` or `more →`.
- `IndexList({ lead?, leadMobile?, children })` renders the `ul` and sets the lead column width through `--c1` and `--c1m`. The default is `10ch`. The reading list on /about uses `27ch`, and `minmax(0,1.3fr)` at mobile width.
- `IndexRow({ href?, external?, lead, main, trail?, leadTone?, mainTone?, clip? })` renders one row. With `href` it is a Next `Link`. With `external` it opens in a new tab with `rel="noopener noreferrer"`. Without `href` it is a plain `div`.

By default `lead` is `faint`, `main` is `ink`, and `trail` is `faint`. A row whose lead is a name instead of a key, such as a project or a book, passes `leadTone="ink"` and a `mainTone` of `body` or `faint`.

`NoteRow`, `WorkRow`, and `ProjectRow` map the notes, `src/data/work.ts`, and `src/data/projects.ts` onto rows, so pages never write row markup for those.

Row rules:

- The grid is `var(--c1) auto minmax(0, 1fr)` with a 3ch column gap. `main` is sized before `trail`, so a long trail, such as a note's tags, clips with an ellipsis before the title does.
- `clip` keeps `main` on one line with an ellipsis on desktop and lets it wrap on mobile.
- The row bleeds 1ch past the column on each side, so the hover fill has padding without moving the text.
- Link rows invert on hover and on `:focus-visible`: the background becomes `ink` and every cell becomes `bg`. Rows have no transition.
- At 640px and below, the grid drops to two columns with a 2ch gap and the trail is hidden.

## GitHub activity

The home page shows a year of GitHub contributions as weekly bars. They sit in a `github` section between the clock and `notes`, and the section's `BartoszJarocki ↗` link opens the GitHub profile in a new tab.

- `fetchActivity` in `src/lib/githubActivity.ts` reads `github.com/users/BartoszJarocki/contributions`, the public page behind the profile heatmap, without a token. `parseContributionDays` pairs each day's `td` with the `tool-tip` that holds its count, and `toActivity` sums the days into Sunday-start weeks.
- The home page revalidates every hour, so GitHub gets at most one request an hour. If the request fails, takes longer than 5 seconds, or yields fewer than 300 days, `fetchActivity` returns `null` and the page leaves the section out.
- `ContributionBars` renders one element per week and paints its squares with a repeating gradient, so no square is its own element. A week with contributions is a stack of `max(1, round(total / peak * 12))` squares, where `peak` is the busiest week's total, so that week is 12 squares tall. A week with no contributions shows one square, so the time axis has no holes.
- Filled squares are `ink`. The square of an empty week is `rule`. The bars use no other color.
- Squares are 10px with 2px gaps. When the column is narrower than that graph, container query units size the squares from the column width, rounded down to whole CSS pixels so every square covers the same whole number of device pixels at 1x, 2x and 3x. The graph can then end short of the column, by up to about 50px on a 320px phone, the same way the 634px desktop graph sits inside the 672px column. At 640px and below the gap is 1px.
- A mono line under the graph shows the year's total in `ink` on the left and `past year` in `faint` on the right. While the pointer is over a week, the total changes to that week, as in `week of 4 oct · 465`.
- The graph is one `role="img"` element whose `aria-label` states the total and the peak week. The weeks are `aria-hidden`.

## Note pages

- The article starts 72px below the header with a faint meta line: the date as `yyyy.MM.dd`, `(wip)` for notes in progress, and the tags, each linking to `/tags/{tag}`.
- The title follows 14px below. The prose starts 44px below the title and is at most 37rem wide.
- Paragraphs have a 1.15em bottom margin. Bullet lists use a faint `-` marker, and numbered lists use faint mono numerals at 13px.
- Code blocks use `wash`, 16px by 20px padding, and a -20px horizontal margin so the code text lines up with the prose. They scroll horizontally instead of wrapping.
- `prism.css` is monochrome. Comments are `faint`, strings are `body`, and every other token is `ink`. No hue appears anywhere on the site.
- Links in prose are `ink` with a 1px `faint` underline offset by 0.28em. The underline turns `ink` on hover. Ledes use the same style through `.text-link`.
- Blockquotes have a 1px `rule` left border, `body` text, and no italics.
- The footer sits 72px below the prose: `← all notes` on the left and `next: {title} →` for the next older note on the right.

Dates come from `dotDate` in `src/lib/date.ts`, which formats the ISO string itself. The server and the browser can't disagree on the day, so dates never cause a hydration mismatch.

## Motion

The site has one animation. On the home page the colon in the clock blinks with a 2s `steps(1)` animation that drops it to 0.15 opacity halfway through. It runs only under `motion-safe`, so readers who prefer reduced motion see a steady colon.

Hover changes are color only: nav and footer links fade from `faint` to `ink` over 150ms, link underlines fade from `faint` to `ink`, and travel photos on /about go from grayscale to color over 200ms.

The clock renders `--:--` on the server and fills in the `Europe/Warsaw` time after hydration. It schedules each update for the next minute boundary instead of running a fixed interval.

## Accessibility

- Every text tone is at least 4.5:1 against `bg` in both schemes. See the contrast table under Colors.
- Every interactive element shows `:focus-visible`. The global style is a 1px `ink` outline offset by 3px. Link rows invert instead.
- Section labels are `h2` elements, so screen reader users can move between sections.
- The `↗` in the elsewhere rows is `aria-hidden`.
- The only animation respects `prefers-reduced-motion`.

## Do and don't

- Do build new lists from `IndexSection`, `IndexList`, and `IndexRow`. Add a mapper next to `NoteRow` when a data module appears on more than one page.
- Do pick colors from the six tokens. If a new element needs a color the tokens don't have, the element is probably too loud.
- Do keep Geist Mono for chrome and Geist Sans for long prose.
- Don't add an accent color, a gradient, a shadow, or rounded corners.
- Don't add a theme toggle. The site follows the system setting.
- Don't use Geist Pixel Square for anything but the name and the clock.
- Don't lower the contrast of `faint`.
