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
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.012em"
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

There is no accent color. Hierarchy comes from four text tones on one background, from the switch between mono and sans, and from spacing. Nothing is rounded, nothing casts a shadow, and the only filled surfaces are code blocks, the hover state of a row, the voxels and squares of the GitHub activity graph, and the points of the backdrop.

The theme follows the reader's system setting. There is no toggle.

## Colors

All colors are CSS custom properties on `:root` in `src/styles/index.css`, redefined under `@media (prefers-color-scheme: dark)`. Tailwind maps `bg`, `ink`, `body`, `faint`, `rule`, and `wash` to them, so `text-faint` and `bg-wash` follow the theme without a `dark:` variant. The share image copies the light values as hex. See Share image.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `bg` | `oklch(98.4% .0025 95)` | `oklch(15.5% .004 70)` | The page. |
| `ink` | `oklch(21% .006 70)` | `oklch(94% .004 80)` | Names, titles, ledes, links, and the hover fill of a row. |
| `body` | `oklch(40% .006 70)` | `oklch(76% .004 80)` | Prose and descriptions. |
| `faint` | `oklch(54% .005 70)` | `oklch(60% .004 80)` | Dates, section labels, nav, and trails. |
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

Three faces load through `localFont` from the subsets in `src/fonts`, and `next/font` preloads a face only on the pages whose code declares it. `_app.tsx` declares Geist Mono and Geist Pixel Square and sets their variables on the app wrapper, together with `font-mono` and the 14px/1.72 base. The note page, `src/pages/notes/[slug].tsx`, declares Geist and sets its variable on the article, because only the note title and the prose use it. Other pages never download it.

| Tailwind family | Face | CSS variable | Loaded in |
| --- | --- | --- | --- |
| `font-sans` | Geist | `--font-geist-sans` | `src/pages/notes/[slug].tsx` |
| `font-mono` | Geist Mono | `--font-geist-mono` | `_app.tsx` |
| `font-pixel` | Geist Pixel Square, falling back to Geist Mono | `--font-geist-pixel-square` | `_app.tsx` |

Each Tailwind family ends in a system fallback stack. Outside a note, `--font-geist-sans` is unset and `font-sans` renders in the system sans font. To use Geist on another page, declare it with `localFont` in that page, as the note page does, and set its variable there.

Next looks up a page's own fonts by the request path, such as `/notes/time`, but keys them by route, `/notes/[slug]`, so it never preloads them on a dynamic route. `_document.tsx` adds the preloads it misses.

Type roles:

- **Name.** Pixel Square 28px, line-height 1, `ink`. It appears once per page, in the header, and links home.
- **Clock.** Pixel Square 24px, `ink`. It appears only on the home page.
- **Chrome.** Geist Mono 14px/1.72. Nav, ledes, section labels, rows, meta lines, and footers.
- **Note title.** Geist Sans 600, 30px/1.18, tracking `-0.028em`, `ink`, `max-width: 24ch`, `text-wrap: balance`.
- **Prose.** Geist Sans 16px/1.75 in `body`.
- **Prose headings.** Geist Sans 600, 19px/1.4, tracking `-0.012em`, `ink`. `h1`, `h2`, and `h3` look the same. Notes use only `h2`.
- **Code.** Geist Mono, 13px in blocks and 13.5px inline.

### Case

Every piece of text a reader sees is lowercase, except the name Bartosz Jarocki. Handles and acronyms are lowercase too, so a screen reader says what the page shows. `src/lib/lowercase.ts` holds the list of what keeps its case, and the name is its only entry. Where two entries overlap in a text, all the text they cover keeps its case.

- The root sets `text-transform: lowercase`, so notes, data files, and page copy keep their own case in the source and in JSON-LD. Chromium's accessibility tree holds the lowercase text too.
- `code`, `kbd`, `pre`, and `samp` keep their case. Buttons inherit the root's case, because Tailwind's preflight resets them to `none`.
- `Cased` renders a string with every name from the list wrapped in a `normal-case` span. The header name and the hidden `h1` use it. Render any string that can hold the name through `Cased`.
- Text outside the page goes through `lowercase`, which reads the same list: the tab title, the meta description, the Open Graph title, description, and image alt, the share image, and the feed's titles and descriptions. JSON-LD, hrefs, and the handle in the `twitter:site` and `twitter:creator` tags keep the source text, because machines read them.
- The backdrop draws only lowercase labels. See Backdrop.

### Font subsets

The files in `src/fonts` are subsets of the faces in the `geist` package, at the version pinned in `package.json`. `pnpm subset-fonts` runs `scripts/fonts.mjs`, which writes them.

- The pages load woff2 subsets of the variable Geist and Geist Mono and of Pixel Square. The share image loads ttf subsets of the static Geist SemiBold and Geist Mono Regular and of Pixel Square, because Satori reads no woff2 and handles variable fonts poorly.
- Each subset keeps Basic Latin, Latin-1 Supplement, Latin Extended-A, General Punctuation, and Arrows. That covers Polish names, the curly quotes and dashes in the notes, and the arrows in the chrome.
- The woff2 Geist and Geist Mono keep their weight axis, from 100 to 900. Pixel Square keeps its hinting.
- Each subset keeps only the OpenType features that a browser applies without CSS asking for them, plus `tnum` for `tabular-nums`. The stylistic sets are gone. To use another feature, such as `slashed-zero`, add its tag to `features` in `scripts/fonts.mjs` and run `pnpm subset-fonts`.
- `pnpm build` ends with `node scripts/fonts.mjs check`. It fails when a note, a data file, or a built page uses a character that a full Geist face has and its subset lacks, and it names the character and the file. To fix it, add the character's Unicode block to `blocks` in `scripts/fonts.mjs` and run `pnpm subset-fonts`.
- ESLint rejects imports from `geist`, because `geist/font` loads the full files.

## Page layout

`PageShell` renders every page. It owns SEO tags, the page padding, the 80ch column, the header, and the `main` element that holds everything below the header.

- The page padding is `clamp(48px, 11vh, 112px)` at the top, `clamp(20px, 9vw, 160px)` at the sides, and 160px at the bottom. The side padding is the minimum gutter.
- The column is `max-width: 80ch` and centered in the viewport. Text inside it stays left-aligned. The root sets `scrollbar-gutter: stable`, so the column does not shift by half a scrollbar between pages that scroll and pages that do not.
- The header is a wrapping flex row with the name on the left and `notes work about` on the right. Nav links are `faint`, turn `ink` on hover, and the current section gets `aria-current="page"`, `ink`, and a 1px underline offset by 5px. Pages pass the section as `current`. The notes list and note pages pass `notes`.
- A `skip to content` link comes first in the tab order. It stays visually hidden until it has focus. Then it shows in Geist Mono 14px `ink`, 12px above the column's top-left corner, in the page's top padding, so it covers nothing. It moves focus to `main`, which has `tabindex="-1"` and no focus outline.
- A lede follows the header 40px below, in `ink`, at most 64ch wide. Pages keep their own copy, and the root sets it in lowercase.
- Each section starts 56px below the previous block.

## The index row

The whole design is one shape: a labeled section of rows with three columns, `lead`, `main`, and `trail`. `src/components/Index.tsx` exports it.

- `IndexSection({ label, more?, children })` renders the label row: the label as a faint `h2`, and an optional right-aligned link such as `all 4 →` or `more →`. `more` takes the visible `label` and a `context` that only screen readers hear after it, so the link reads `all 4 notes` or `more work`. The arrow is `↗` for an `external` link and `→` otherwise, and screen readers skip it.
- `IndexList({ lead?, leadMobile?, children })` renders the `ul` and sets the lead column width through `--c1` and `--c1m`. The default is `10ch`. The reading list on /about uses `27ch`, and `minmax(0,1.3fr)` at mobile width.
- `IndexRow({ href?, external?, lead, main, trail?, leadTone?, mainTone?, clip?, stackTrail? })` renders one row. With `href` it is a Next `Link`. With `external` it is an `ExternalLink`, which opens in a new tab with `rel="noopener noreferrer"` and ends in a visually hidden ` (opens in new tab)`. Without `href` it is a plain `div`.

By default `lead` is `faint`, `main` is `ink`, and `trail` is `faint`. A row whose lead is a name instead of a key, such as a project or a book, passes `leadTone="ink"` and a `mainTone` of `body` or `faint`.

`NoteRow`, `WorkRow`, and `ProjectRow` map the notes, `src/data/work.ts`, and `src/data/projects.ts` onto rows, so pages never write row markup for those.

Row rules:

- The grid is `var(--c1) auto minmax(0, 1fr)` with a 3ch column gap. `main` is sized before `trail`, so a long trail, such as a note's tags, clips with an ellipsis before the title does.
- `clip` keeps `main` on one line with an ellipsis on desktop and lets it wrap on mobile.
- The row bleeds 1ch past the column on each side, so the hover fill has padding without moving the text.
- Link rows invert on hover and on `:focus-visible`: the background becomes `ink` and every cell becomes `bg`. Rows have no transition.
- At 640px and below, the grid drops to two columns with a 2ch gap and the trail is hidden.
- A row with `stackTrail` keeps its trail at 640px and below, as a second `faint` line under `main` that wraps when it is long. `WorkRow` passes it, so job titles stay on phones. Note tags and project domains stay hidden there.

## GitHub activity

The home page shows the past year of GitHub activity as a skyline, where every day is a stack of voxels on a three.js stage. It sits in a `github` section between the clock and `notes`, and the section's `BartoszJarocki ↗` link opens the GitHub profile in a new tab.

### Data

- `fetchActivity` in `src/lib/githubActivity.ts` reads `github.com/users/BartoszJarocki/contributions`, the public page behind the profile heatmap, without a token. `parseContributionDays` pairs each day's `td` with the `tool-tip` that holds its count.
- With `GITHUB_TOKEN` set, it also searches GitHub GraphQL for the user's merged PRs in the same days, and counts merges and added lines by UTC merge day. The token is a classic personal access token with `repo` scope, because a fine-grained token reaches only one account or organization, and the PRs live in several. The page shows daily totals only, never a repository name.
- The search runs as about 24 parallel queries, one per window of days that holds a 24th of the year's contributions. A page of 100 PRs with their additions can take GitHub over 5 seconds, and calendar-month windows took 4 to over 10 seconds. The balanced windows keep each query to about one page, and the whole search to about 3 seconds. A window over GitHub's limit of 1,000 results fails the search instead of showing partial numbers.
- `Activity` holds one array of ISO dates and one array of numbers per stat, so the page props stay small.
- The home page revalidates every hour. If the contributions request fails, takes longer than 5 seconds, or yields fewer than 300 days, `fetchActivity` returns `null` and the page leaves the section out. If the PR search fails or takes longer than 10 seconds, `pullRequests` is `null`, the server logs one line, and the skyline shows contributions only.

### Stats

`activityStats` in `src/lib/activityStats.ts` holds one table of stats. Each row sets a button label, the caption text, the stage's accessible name, and how values become heights.

| Button | Height scale | Shown when |
| --- | --- | --- |
| `contributions` | `v / peak` | Always |
| `prs merged` | `v / peak` | `pullRequests` is not `null` |
| `lines added` | `log1p(v) / log1p(peak)` | `pullRequests` is not `null` |

A day with no activity has no voxels. Any other day is `max(1, round(scale * 12))` voxels tall, so each stat's busiest day is 12 voxels tall. Lines added uses a log scale because a few large PRs carry most of the added lines.

### The skyline

- `ContributionSkyline` renders a stage with `aspect-ratio: 672 / 300`, at least 150px and at most 300px tall. While the scene loads, the stage is empty, so the first thing a visitor sees in it is the city rising, not a jump from flat bars to the city.
- The server also renders the flat weekly bars inside the stage, bottom-aligned and `aria-hidden`. They show only under `@media (scripting: none)`, so a visit without JavaScript still shows a graph. A browser that does not support the `scripting` media feature hides them and shows the empty stage.
- The component starts to import `src/lib/skylineScene.ts` when it mounts. three.js is therefore an async chunk and never part of the home page's first load. The scene mounts only when the chunk has loaded and the stage is within 200px of the viewport, so a visitor who scrolls down sees the city rise instead of a finished city. `mountSkyline` creates the WebGL context, then builds the scene and draws the first frame in a later task. On a slow CPU the two halves take about the same time, so input that arrives during the mount waits for one half, not both. If the component unmounts in between, the context is released and no scene mounts. The ground tiles and month labels fade in over 200ms. The empty stage keeps its height, so nothing below it moves.
- Weeks run left to right and start on Sunday in UTC. Days run from Sunday at the back to Saturday at the front. A voxel is 10/12 of a column wide, so the gaps match the 10px squares and 2px gaps of the flat bars. A day without activity shows a thin tile in `rule`.
- The voxel shader has no lights. Each face is a fixed mix of `bg` and `ink`: the front at 100%, the top at 66%, the sides at 44%, and the bottom at 30%. Color management is off, and the scene reads the tokens through a 1x1 canvas, so the front faces are exactly `ink`. The scene reads the tokens again when the system color scheme changes.
- The camera is orthographic. The rest view has a yaw of -16° and a pitch of 34°. A drag of more than 4px turns the city, within a yaw of -60° to 60° and a pitch of 8° to 89°. The arrow keys turn the focused stage, and a double-click returns to the rest view. A key that would turn the city past a limit keeps its default, so ArrowDown scrolls the page once the pitch reaches 89°. The stage has `touch-action: pan-y`, so a vertical swipe on a phone still scrolls the page.
- The city and its month labels sit at the bottom of the stage. The city is never drawn larger than in the rest view, so turning it can shrink it but never zooms in.
- Month labels are 11px `faint` mono, under the front edge of the week that holds the 1st. When the stage is narrower than 520px, every other label is hidden.
- A label's center sits at least 7.5px below the city's front edge. The rest view at desktop size already leaves 7.9px. A phone draws the city at half that scale, so there the labels drop and the city rises by the difference, and no label touches the front row.
- On first view the city rises from the ground in a wave across the weeks. Switching stats moves each column one voxel every 28ms, with the same wave. The scene renders only while something moves.
- With `prefers-reduced-motion: reduce`, the stage has no fade, no rise, no voxel steps, and no camera easing. Every change shows its end state at once.
- If WebGL is unavailable or the scene chunk fails to load, the flat bars below render as they did before the skyline, with no stage and no stat buttons. The hidden monthly table stays.

### Caption and buttons

- A mono line under the stage shows the selected stat's yearly total on the left, as in `3,058 contributions`, `596 prs merged`, or `1.39M lines added`, and `past year` in `faint` on the right.
- Hovering a day, or tapping it on a touch screen, highlights the day's whole column and fades every other voxel toward `bg`. The caption then reads `tue 6 oct · 186 contributions · 39 merged · +20,167 lines`, with the selected stat first. Numbers are `ink`, and units and separators are `faint`. At 640px and below the caption shows only the date and the selected stat. It never wraps.
- When PR stats exist, three buttons sit under the caption, 2.5ch apart, or 2ch at 640px and below: `contributions`, `prs merged`, and `lines added`. With the smaller gap they fit one line on a 390px-wide phone. Narrower phones wrap `lines added` to a second line. They are `faint` and turn `ink` on hover. The pressed one is `ink` with a 1px underline offset by 5px, like the current nav link. Without JavaScript the buttons are hidden.
- The stage is one `role="img"` element whose `aria-label` follows the selected stat, as in `lines added per day over the past year: 1.39M total, busiest day 6 Oct with 41,203`. It takes focus for the arrow keys and shows the global focus outline. The buttons are `<button>` elements with `aria-pressed`, in a `role="group"`.
- A visually hidden table follows the stage, with one row per month and one column per stat. Each month carries its year, as in `Oct 2025`, because the first and last months of the past year can share a name. The label gives the year's total and its peak, and the table gives the shape of the year, so neither repeats the other.

### Flat bars

`ContributionBars` draws the weekly bars for visits without JavaScript and for the fallback without WebGL. `weeklyTotals` sums the days into Sunday-start weeks.

- It renders one element per week and paints its squares with a repeating gradient, so no square is its own element. A week with contributions is a stack of `max(1, round(total / peak * 12))` squares, where `peak` is the busiest week's total, so that week is 12 squares tall. A week with no contributions shows one square, so the time axis has no holes.
- Filled squares are `ink`. The square of an empty week is `rule`. The bars use no other color.
- Squares are 10px with 2px gaps. When the column is narrower than that graph, container query units size the squares from the column width, rounded down to whole CSS pixels so every square covers the same whole number of device pixels at 1x, 2x and 3x. The graph can then end short of the column, by up to about 50px on a 320px phone, the same way the 634px desktop graph sits inside the 672px column. At 640px and below the gap is 1px.
- In the fallback, a mono line under the graph shows the year's total in `ink` on the left and `past year` in `faint` on the right. While the pointer is over a week, the total changes to that week, as in `week of 4 oct · 465`.
- In the fallback, the graph is one `role="img"` element whose `aria-label` states the total and the peak week. The weeks are `aria-hidden`.

## Backdrop

Every page draws a toy embedding space over its top 460px. It shows one thing a language model does: it places tokens near each other when they mean similar things.

### What it computes

- `src/lib/embeddingSpace.ts` builds a table of 3,202 tokens in 32 dimensions when the stage mounts. Each token is a seeded cluster center plus noise, in clusters such as function words, time, code, work, places, and numbers. Every vector has unit length.
- The stage draws dimensions 0 to 2 through one linear map, so a sum or difference of vectors lands on the same spot on screen.
- It reads a fixed passage, the home lede and lines from the note Time, one token every 3.4 seconds. Each token shows its 8 nearest neighbors by cosine similarity over all 32 dimensions, as a list with the cosines. A trail links the last 5 tokens.
- The passage is lowercased before it is tokenized. The table also holds capitalized tokens, such as ` The`, and the lists and the hover skip them, so every label is lowercase. A passage word that the table holds only capitalized, such as ` ai` for ` AI`, copies that token's vector.
- Every 20 seconds it solves one analogy with 3CosAdd, as word2vec does: king - man + woman, paris - france + poland, and walked - walk + swim. The answer and its cosine are the argmax over the whole table, not a lookup.
- Nothing is trained. The table is built so the analogies hold, the way training makes them hold in real embeddings.

### Drawing

- Tokens are square points, each a mix of `bg` and `ink` that fades toward `bg` with depth. There are no lights, as in the skyline. Lines are 1px. Labels are Geist Mono at 11px and 13px.
- The stage is a `position: absolute` element, rendered by `_app` before the page, 460px tall, at 40% opacity. A mask fades its lower 45% to nothing. It ignores the pointer, so the header and lede under it stay clickable. `_app` clips it to the page, or to the screen when the page is shorter, so the stage never makes a page scroll.
- On a wide stage the space is squashed vertically to fill the band, and lifted into the top 55% that the mask leaves unfaded. That stop is written once, as `--unfaded` on `.backdrop` in `src/styles/index.css`. On a portrait stage, such as a phone, the camera rolls 90° so the clusters run down the screen.
- A portrait stage shows no words: no neighbor list, no trail or analogy labels, no cosines. The header fills much of the band there, and any word could drift over it. The points, the lines, and the boxes around the current token and the analogy's sum stay.
- A mouse resting on a cluster point shows that token's neighbors. On a portrait stage the hover draws the lines to the neighbors and the box around the token, but no words. Touch does nothing.
- The stage stays mounted across client-side navigation, so the space is built once per visit and the animation carries on from page to page.
- `mountEmbeddings` in `src/lib/embeddingsScene.ts` loads as an async chunk, like the skyline's scene, so three.js stays out of the first load. It builds the space, the neighbor lists, and the label atlases in slices of at most 16ms. At 4x CPU throttling its longest task is about 30ms, and the stage is ready about 1.3 seconds after navigation.
- It draws at most 30 frames a second, and stops while the page is hidden or the band is out of view. Under reduced motion it draws one frame, at t = 6 seconds, and draws again only on a resize or a theme change.
- If WebGL is unavailable or the chunk fails to load, the page has no backdrop.
- Print and forced colors hide it. Printing drops background graphics, so the plates would vanish and text would print over the cloud. In forced colors, as in Windows High Contrast, Chrome paints a `Canvas` backplate behind each line of text, and the stage would paint over it.

### Stacking

The stage paints above the page text, at `z-index: 1`, so that text keeps subpixel antialiasing on screens that use it, such as Windows with ClearType. Chrome draws subpixel text only in a layer with an opaque background. With the stage under the page, Chrome put the page text in a layer above the stage's canvas, with no background, and drew it in grayscale while the band was on screen.

- Above the page, the stage blends with `darken` in light and `lighten` in dark. Every color it draws lies between `bg` and `ink`, so over `bg` the blend gives the same pixel as a stage under the page. Over anything else it does not. See What painting above the text costs.
- Anything opaque that can sit in the band rises above the stage, at `z-index: 2`, or the stage would draw over it. That is every plate, a hovered or focused row, the skyline, and note prose with its images and code. `src/styles/index.css` lists them right after `.backdrop`.
- A raised box paints above every box that is not raised, whatever the DOM order, so its padding can cover a neighbor's focus ring. On the home page, the lede's plate on the second line would cover the lower edge of the ring around `motion` or `we're hiring` on the first, so a focused `.text-link` rises to `z-index: 3`. It loses subpixel text only while it has focus.
- A clipping row cell rises in place of its plate, because Chrome drops a clipped line's ellipsis when the text sits in a raised inline.
- Text on a raised plate keeps subpixel antialiasing only while Chrome can tell that it sits on the plate. Chrome tracks one opaque rectangle per raised element, so a plate that wraps to a second line, like the ledes on the home page and on /about, stays grayscale. Row plates that Chrome merges into one layer can stay grayscale too, like the Taleb, Knight, and Hesse rows on /about.

### What painting above the text costs

Measured against the same page with the stage under it, in light and dark:

- Where the cloud crosses `ink` text without a plate, the glyph edges move by up to 23 levels.
- The `faint` underline of a link without a plate, like `motion` and `we're hiring` in the home lede, moves by up to 36 levels as the cloud passes, measured in dark. At 40% opacity the stage can move it by at most 34.8 levels in light and 42.8 in dark.
- Selected text in the band shows the cloud over its letters. A select-all differs in 11 to 202 px per page at 1440px, by up to 50 levels. On a phone, where a portrait stage draws no words, it differs in 28 to 305 px, by up to 46 levels.
- Other highlights in the band show the cloud the same way. A text fragment (`#:~:text=`) on a word without a plate differs in up to 144 px at 1440px, by up to 50 levels, and in up to 139 px on a phone, by up to 57 levels. Chrome paints find-in-page highlights with the text as well, so the cloud draws over them too. They were not measured.
- The prose plate reaches 1px past the text. On three notes at 1440px, 5 px at its edge in the band move by up to 17 levels.
- The photo in the band on the Apple note rasters inside the raised prose. At 390px it moves by up to 18 levels in 1515 px.
- Below the band, on the Apple note at 1440px, 2 px of the underline under `support DSC` move by up to 6 levels.
- Forced colors hide the stage. Under the page, it showed between the lines of text.
- A browser without `:has` raises the plate in a clipping row cell instead of the cell, so the clipped line loses its ellipsis there.
- The blend reads back the page under the stage on every frame it draws. On an Intel Iris Xe, the GPU stays awake 0.43 to 0.51 ms longer per frame at 1x, on top of 3.69 to 3.84 ms, and 1.56 to 2.37 ms longer at 2x, on top of 10.66 to 11.29 ms. Each range spans the medians of two sets of 6 interleaved runs per side.

### Plates

`faint` text keeps 4.5:1 only while the pixel behind it stays within 3.7% (light) or 5.1% (dark) of the way from `bg` to `ink`. Even `rule` behind `faint` text measures 3.88:1. `body` text drops under 4.5:1 when the reading list drifts across it in the upper part of the band. `ink` keeps 4.88:1 or more, because the stage is drawn at 40% opacity. That holds only while the stage stays at or under about 42% opacity (42.3% in dark, 53.7% in light). Raising it needs plates under `ink` text too.

So the tone decides. In the band, `ink` text needs no plate, and every piece of `body` or `faint` text sits on one. The `.plate` class gives an element a `bg` background 1ch wider on each side, with a negative margin, so nothing moves. These carry it:

- The nav, the section labels and their `more` links, and the clock's `in Wrocław`.
- The `body` and `faint` cells of every index row. `IndexRow` wraps their text in a plate by tone, so a page never adds one. A plate inside a hovered or focused row is transparent, so the `ink` fill still covers the whole row.
- The note meta line, the note footer links, and the `home` line on the 404 and 500 pages.
- A lede's `body` text, on the home page and on /about, and the closing line under the last list on /about and /work.
- Note prose. `.prose` has a `bg` background that reaches 1px past the text on each side, not 1ch, because the column can sit on a half pixel and Chrome must see the text inside the plate's whole pixels. Its max-width grows by the same 2px, so the measure stays 37rem. It also covers the faint list markers, which can't carry a plate of their own.

A plate on inline text, like a lede's or a row's, is `.plate-inline`, a plate with `3px` of block padding that fills its lines' half-leading, so it covers the whole text box. A plate on a flex item or a block, like a section label or the meta line, is `.plate`, without the padding, because there the padding grows the row.

Sampled for 60 seconds on every page (home, notes, each note, work, about, 404, and 500), in light and dark, at 1440px and 390px, every text tone in the band keeps its plain `bg` contrast, except `ink`, which stays at 4.88:1 or more.

## Note pages

- The article starts 72px below the header with a faint meta line: the date as `yyyy.MM.dd`, a `·`, and the tags as plain text separated by commas.
- The title follows 14px below. The prose starts 44px below the title and is at most 37rem wide.
- Paragraphs have a 1.15em bottom margin. Bold text is `ink` at weight 500. Bullet lists use a faint `-` marker, and numbered lists use faint mono numerals at 13px.
- An image alone in a paragraph renders as a figure as wide as the prose, with a 1.4em bottom margin.
- Code blocks are plain `ink` on `wash`, with no syntax highlighting. They have 16px by 20px padding and a -20px horizontal margin, so the code text lines up with the prose. They scroll horizontally instead of wrapping. Inside a list item a code block has a 0.6em top margin, so it does not touch the line above.
- Links in prose are `ink` with a 1px `faint` underline offset by 0.28em. The underline turns `ink` on hover. Ledes use the same style through `.text-link`.
- Blockquotes have a 1px `rule` left border, `body` text, and no italics.
- The footer sits 72px below the prose: `← all notes` on the left and `next: {title} →` for the next older note on the right. A no-break space ties the `→` to the title's last word, so a long title never leaves the arrow alone on a line.

Dates come from `dotDate` in `src/lib/date.ts`, which formats the ISO string itself. The server and the browser can't disagree on the day, so dates never cause a hydration mismatch.

## Share image

`src/pages/api/og.tsx` draws the Open Graph image for every page. `PageShell` puts the page's SEO title and description in the image URL in lowercase, as in `/api/og?title=time&description=a+thing+about+time`. The route lowercases both again with `lowercase`, so any caller gets a lowercase card, and the name keeps its case.

- The image is 1200 by 630 pixels on `bg`, with 80px of padding. A share card can't follow the viewer's color scheme, so it always uses the light tokens.
- The top row repeats the page header. The name is Pixel Square at 44px in `ink` on the left, and `jarocki.me` is Geist Mono at 28px in `faint` on the right.
- The title and the description sit at the bottom. The title is Geist 600 at 64px, line-height 1.1, tracking `-0.028em`, in `ink`. The description is Geist Mono at 28px, line-height 1.45, in `body`, 28px below the title. Each stops at three lines with an ellipsis, and a long word breaks instead of running off the card.
- The home page has no title of its own, so its card shows the name once, in the header, and the description below it.
- There is no avatar, no border, no rule, and nothing is rounded.
- Satori can't parse `oklch`, so the route copies the light tokens as hex: `bg` `#fafaf8`, `ink` `#1a1815`, `body` `#4a4744`, and `faint` `#716e6c`. They match what Chromium paints for the tokens. When a light token changes, change it there too.
- The route runs on Node through `next/og`. Anyone can call it with any text, so it cuts the title at 200 characters and the description at 300. Both caps hold more than three lines, so a cut text still ends in the ellipsis. For a character the subsets lack, such as `€`, `next/og` fetches a Noto face from Google Fonts during that request. The build check keeps such characters out of real titles and descriptions.

## Icon

`scripts/icons.mjs` draws the favicon and the home screen icon from the Geist Pixel Square glyphs, so the icon is the monogram `JB`, surname first. Run `pnpm icons` after changing it.

- Pixel Square builds each letter from square cells, 19 cells from the baseline to the cap height. The script reads the cells from the font and puts J and B side by side with two empty columns between them, 27 by 19 cells.
- At 32px each cell is one pixel. That is what a 2x screen draws for a 16px tab icon, so the tab shows the font's own pixels without blur.
- `public/icon.svg` is the 32px grid in `ink`, and in the dark `ink` under `prefers-color-scheme: dark`. Browsers that show SVG favicons use it.
- `public/favicon.ico` holds the same 32px grid as a PNG, in `ink` on `bg`. The ICO can't follow the color scheme, so its light background keeps the letters readable on a dark tab bar.
- `public/apple-touch-icon.png` is 180px, in `ink` on `bg`, with 4px cells. iOS rounds the corners itself.
- The script copies `ink`, `bg`, and the dark `ink` as hex. When one of those tokens changes, change it there too.

## Motion

On the home page the colon in the clock blinks with a 2s `steps(1)` animation that drops it to 0.15 opacity halfway through. It runs only under `motion-safe`, so readers who prefer reduced motion see a steady colon.

The GitHub skyline fades in over 200ms, rises in a wave, steps between stats one voxel every 28ms, and eases the camera after a drag or a key press. Under reduced motion it shows each end state at once.

The backdrop fades in over 200ms when it first mounts. It reads one token every 3.4 seconds, glides to it over 1.5 seconds, and swings the camera ±18° and back over 96 seconds. Under reduced motion it draws one still frame.

Hover changes are color only: nav and footer links fade from `faint` to `ink` over 150ms, link underlines fade from `faint` to `ink`, and travel photos on /about go from grayscale to color over 200ms.

The clock renders `--:--` on the server and fills in the `Europe/Warsaw` time after hydration. It schedules each update for the next minute boundary instead of running a fixed interval.

## Accessibility

- Every text tone is at least 4.5:1 against `bg` in both schemes. See the contrast table under Colors.
- Every page has one `main` landmark after the header, and a skip link to it.
- Every interactive element shows `:focus-visible`. The global style is a 1px `ink` outline offset by 3px. Link rows invert instead.
- Every page has one `h1`. A note page shows its title as a visible `h1` and passes `article` to `PageShell`. Every other page gets a visually hidden `h1` from `PageShell`, with the page title, or the name on the home page.
- Section labels are `h2` elements, so screen reader users can move between sections.
- Decorative arrows are `aria-hidden`: the `↗` in the elsewhere rows, the arrows in section links, and the `←` and `→` in note footers and on the error pages. The `→` inside a job title stays, because it means "then".
- Every link that opens a new tab goes through `ExternalLink`, so screen readers hear `(opens in new tab)` after its name.
- Every animation respects `prefers-reduced-motion`.
- The backdrop is `aria-hidden`, and forced colors hide it. Text it can reach sits on a plate, so it never lowers a text tone under 4.5:1. See Backdrop > Plates.

## Do and don't

- Do build new lists from `IndexSection`, `IndexList`, and `IndexRow`. Add a mapper next to `NoteRow` when a data module appears on more than one page.
- Do pick colors from the six tokens. If a new element needs a color the tokens don't have, the element is probably too loud.
- Do keep Geist Mono for chrome and Geist Sans for long prose.
- Do write copy in its natural case, handles and acronyms included. The root lowercases it.
- Don't show uppercase text anywhere a reader sees it, except the name and code. Don't add a handle or an acronym to the list in `src/lib/lowercase.ts`.
- Don't add an accent color, a gradient, a shadow, or rounded corners.
- Don't add a theme toggle. The site follows the system setting.
- Don't use Geist Pixel Square for anything but the name, the clock, and the icon.
- Don't lower the contrast of `faint`.
- Don't leave `faint` or `body` text in the band without a plate.
