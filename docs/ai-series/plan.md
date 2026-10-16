# The ai series plan

Four notes that teach how language models work, each with demos that run in the page. The reader has school math and has never trained a model. Code blocks serve readers who know JavaScript, and the prose never depends on them. `docs/ai-series/design.md` says what each note teaches and why.

The program enforces one rule. The code a note shows is the code that runs its demos, and every demo works on a phone, in the dark scheme, under reduced motion, and without WebGL or JavaScript.

PRs in order are ai-01 to ai-14. Notes stay drafts until the PR that finishes them, so every PR can land on its own.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, a file, a log line, a screenshot, a test run, or a SHA. The body is a how-to. The appendices explain and record.

The program runs `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`, because merging to `master` deploys the site and a finished note goes public on merge. Owners build and verify. The operator reviews and lands every PR. ai-06, ai-09, ai-12, and ai-14 publish a note, so they are the operator's items and stop at merge-ready even inside a clean stack.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] State the protocol and this plan to the operator, then stop. Start execution only on the operator's explicit go.
- [ ] Read these at program start. Re-read them at every tick. The skills live in `~/.claude/skills`, outside this repo, so read them from disk instead of with `git show origin/main:<path>`.
  - [ ] `~/.claude/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `~/.claude/skills/swarm/SKILL.md`
  - [ ] `~/.claude/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `~/.claude/skills/architect/SKILL.md`, for ai-02, ai-03, ai-08, and ai-10, which set shapes later PRs build on.
  - [ ] `DESIGN.md`, `PRODUCT.md`, and `docs/ai-series/design.md` from `origin/master`.
- [ ] Write the probe at `/tmp/ai-series/probe.mjs` before the first lane runs. It takes a URL and a scenario name, drives Playwright's Chromium, and prints one JSON line with the longest main-thread task, console errors, the page's scroll width, and the screenshot path. Every live and perf box below runs it.
- [ ] On the operator's go, arm the audit tick as `/loop 1h` with the tick prompt below. Never leave the cadence to memory.
- [ ] Use this tick prompt, verbatim. "Re-read the execution playbook from trunk. Audit the operation against it and fix drift in this tick. Probe every active lane and judge progress by side effects only. Stand down a stuck lane and dispatch its replacement now. Then post a short status message to the operator in chat only when the audit found a tracked change that no earlier status message reported, such as a PR opened, a code-ready head, a round launched or closed, a verdict, a merge, a stuck agent and the action taken, a blocker added or cleared, or a decision only the operator can make. Name every such change and nothing else. Do not repeat a table, the merged list, or an unchanged blocker. If the audit found none, end the turn with no reply text. Either way, log this tick's row in your decision trail. The row names the items reported, or none."
- [ ] On the operator's hold or stand-down, send every owner a zero-writes order at once.

### Spawn owners

- [ ] Spawn one owner per PR with the full lifecycle the execution playbook names.
- [ ] Follow this dependency graph. The stack is linear in id order. Owners may build ahead on a parent branch, and the root appends in order.
  - [ ] ai-01 is first and branches from `master`.
  - [ ] ai-02 after ai-01. ai-03 after ai-02.
  - [ ] ai-04, ai-05, and ai-07 each need only ai-03. Their owners can build in parallel on ai-03's branch.
  - [ ] ai-06 after ai-04 and ai-05. ai-08 after ai-07. ai-09 after ai-06 and ai-08. ai-10 after ai-08, because it ports the GPT onto the parameter layout ai-08 settles.
  - [ ] ai-11 after ai-09 and ai-10. ai-12 after ai-11. ai-13 after ai-12. ai-14 after ai-13.
- [ ] Hold the file boundaries. Each PR touches only the files its **Files** block lists, plus the test files its unit box names. Demo PRs, ai-04, ai-05, ai-07, ai-08, ai-10, ai-11, and ai-13, stay inside `src/components/demos/**`, `src/lib/ml/**`, `src/lib/demos/**`, `public/data/**`, `public/models/**`, and their own note in `src/notes/`, with one named exception. ai-10 adds `scripts/train.mjs` and edits `package.json`. Only ai-01, ai-02, ai-03, ai-06, and ai-09 touch `src/lib/notes.ts`, `src/components/NoteContent.tsx`, or `src/pages/notes/[slug].tsx`. ai-09 also edits part 1's note, `DESIGN.md`, and `CLAUDE.md`. ai-01 edits `tsconfig.json`. ai-03, ai-06, ai-09, ai-12, and ai-14 add cases to `src/lib/notes.test.ts`.
- [ ] Mask the series index in regression lanes. From ai-09 on, the `the ai series` section on every part changes by design as parts land, and a local build renders drafts. A regression lane that compares a series note at trunk and head masks the series navigation, that section and the footer's part links, then checks both separately against the parts that exist at head.
- [ ] Hold the review gate. Every PR except ai-01 and ai-10 changes an interaction. They wait for the operator's review in chat with screenshots and a video before merge.

### PR mechanics, for every PR

- [ ] Resolve the forge once. Default to `gh`; if `command -v origin` succeeds and Origin can resolve the repository, use `origin pr` for every PR operation. Record any fallback to `gh`. Never require `gt`.
- [ ] Open the PR ready, never draft, per **Opening a PR**. Use the run's built-in PR tool when it has one, else `origin pr create --status open --base <base-branch>` or `gh pr create --base <base-branch>` according to the resolved forge. A stack child targets its parent branch.
- [ ] Run `pnpm lint`, `pnpm typecheck`, and `pnpm test` once before the PR-facing push. Push with hooks on.
- [ ] Reread the diff and cut AI slop before each commit, since `/deslop` is not installed here. Run `/no-comments` before review.
- [ ] Triage every Bugbot and security-reviewer comment per `~/.claude/skills/poteto-mode/references/bugbot-triage.md`.
- [ ] Treat the perf budgets as provisional. The 50 ms longest task, the 0.1 kB and 1 kB First Load JS growth, and the 200 ms build-time and largest contentful paint margins were chosen, not measured on built notes. Unless a box says otherwise, a longest-task rule uses the worst run, a step-time rule uses the median step, and a largest contentful paint rule compares the medians of the cold loads. The PR records the measured value beside every bound. A bound that a correct build misses goes to the operator, not into a code change.
- [ ] Rebase onto current trunk before the code-ready report and babysit. Keep that merge base in fix rounds. Rebase again only at merge prep, on a `git merge-tree` conflict with trunk, or on a CI failure that comes from a change on trunk.

### Verdict and merge, for every PR

- [ ] At the code-ready head SHA and at each later push that changes the patch, run the swarm per `~/.claude/skills/swarm/SKILL.md`. One gates lane. The ten live lanes from the PR's **Verify, live** block. The perf lane from its **Verify, perf** block. Two or more audit lanes, each with its own focus, that read the diff and the receipts and distrust the PR body. One audit lane always reads the note prose against `PRODUCT.md`'s voice and `docs/ai-series/design.md`'s terms for that note. The root audits the receipts in the merge-ready report before the verdict.
- [ ] Clean only when every lane is `PASS`. Findings go back to the owner, including a defect that a lane filed as a note. A new head gets a fresh swarm and a fresh verdict, except for results that stay valid under the patch-id rule in `playbooks/shipping.md`.
- [ ] A clean verdict appends the PR to the linear stack on `master`. No owner merges. The operator lands the stack bottom-up, and the patch-id rule in `playbooks/shipping.md` decides whether a rebased head keeps its verdict.

### Boot recipe, for every live lane

Each live lane runs in its own local worktree at the PR head. No `control-ui` skill is installed, so lanes drive Chromium through Playwright, from `~/.cache/ms-playwright` or `/usr/bin/chromium`.

- [ ] `git fetch origin <head-branch> && git worktree add /tmp/ai-series/<pr-id>/worker-<n> <head SHA>`.
- [ ] `pnpm install --frozen-lockfile && pnpm build && pnpm start -p <3100 + n>`. Wait until `curl -s localhost:<port>/notes` returns 200. A local build has no `VERCEL_ENV`, so drafts render.
- [ ] Deliver page input only through Playwright. Read-only diagnostics are the probe's JSON line, `page.on('console')`, and the Chrome DevTools Protocol for CPU throttling and long tasks. A lane that names a CLI command or a file edit, such as ai-10's `pnpm train` lanes, runs that command in the lane's worktree and saves its terminal output as the lane's screenshot.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.

## Hide draft notes from production (ai-01)

**Depends on.** None.

**Files.**

- [ ] Edit `src/lib/notes.ts`.
- [ ] Edit `src/pages/notes/[slug].tsx`.
- [ ] Create `src/notes/how-a-machine-learns.mdx`.
- [ ] Edit `CLAUDE.md`.
- [ ] Edit `package.json`.
- [ ] Edit `tsconfig.json`, adding `allowImportingTsExtensions` so the test can import `./notes.ts`.

**Build.**

- [ ] `parseNote` in `src/lib/notes.ts` accepts an optional `draft: true`. `getNotes` drops drafts when `process.env.VERCEL_ENV === 'production'`. Every consumer, the notes list, the home page, the RSS route, and `getStaticPaths`, reads `getNotes`, so none of them changes.
- [ ] A draft note page passes `noindex` to `PageShell`.
- [ ] Add part 1 as a draft with its frontmatter, the five-sentence map of the series from `docs/ai-series/design.md`, and one `h2` per demo with a one-line placeholder.
- [ ] Document `draft` in the Notes section of `CLAUDE.md`.

**You see.**

- [ ] `VERCEL_ENV=production pnpm build` lists four notes under `/notes/[slug]`, and `pnpm build` lists five with `/notes/how-a-machine-learns`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] This PR adds `pnpm test` as `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test 'src/lib/**/*.test.ts'` and `src/lib/notes.test.ts`. The glob is quoted so Node expands it, because Node 22 and 24 reject a folder there. Every test in the series lives under `src/lib`, so this one command runs them all. A demo's testable logic lives in `src/lib/demos/` or `src/lib/ml/`, never in a component file. One case writes a draft and a published note to a temp directory and asserts `getNotes()` returns both slugs without `VERCEL_ENV` and only the published slug with `VERCEL_ENV=production`. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Load `/`, `/notes`, and `/notes/time` at trunk and head with a production build. Save `regression.png`. Pass when the three pages match pixel for pixel and the console is clean on both.
- [ ] Lane 2. Production build, `/notes`. Save `prod-list.png`. Pass when the list shows four notes and no `how a machine learns` row.
- [ ] Lane 3. Production build, `/notes/how-a-machine-learns`. Save `prod-404.png`. Pass when the status is 404.
- [ ] Lane 4. Production build, `/api/rss.xml`. Save `prod-rss.png`. Pass when the feed has four items.
- [ ] Lane 5. Production build, `public/sitemap.xml` after `postbuild`. Save `prod-sitemap.png`. Pass when it lists no draft URL.
- [ ] Lane 6. Preview build, `/notes/how-a-machine-learns`. Save `draft-page.png`. Pass when the page renders and its head has `noindex`.
- [ ] Lane 7. Preview build, `/notes`. Save `draft-list.png`. Pass when the draft row appears first, by date.
- [ ] Lane 8. Preview build, the home page notes section. Save `draft-home.png`. Pass when it shows the draft, the same as `/notes`.
- [ ] Lane 9. Remove `title` from the draft's frontmatter and build. Save `draft-invalid.png`. Pass when the build fails with `frontmatter needs a title`.
- [ ] Lane 10. Set `draft: false` and build with `VERCEL_ENV=production`. Save `draft-false.png`. Pass when the note is published, so only `true` hides it.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. First Load JS for `/notes/[slug]` in the `pnpm build` route table.
- [ ] Probe. Run `pnpm build` at trunk, then head, then trunk, then head, and read the route table line each time.
- [ ] Baseline. Record the trunk value first.
- [ ] Rule. Fail when head exceeds trunk by more than 0.1 kB. This PR adds no client code.

**Review gate.** None. ai-01 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-01 to the stack and the operator lands it bottom-up.

## Run a demo inside a note (ai-02)

**Depends on.** ai-01.

**Files.**

- [ ] Create `src/components/demos/DemoStage.tsx`.
- [ ] Create `src/components/demos/TaxiFares.tsx`.
- [ ] Create `src/lib/demos/taxiFares.ts`.
- [ ] Create `src/lib/demos/taxiFares.test.ts`.
- [ ] Create `src/lib/demos/taxiFaresScene.tsx`, the scene that loads near the viewport.
- [ ] Create `src/lib/demos/stage.ts`, the lazy scene runtime every demo uses.
- [ ] Create `src/lib/demos/stage.test.ts`.
- [ ] Create `src/components/demos/index.ts`, the registry that later demo PRs add to.
- [ ] Edit `src/components/NoteContent.tsx`.
- [ ] Edit `src/styles/index.css`.
- [ ] Edit `src/notes/how-a-machine-learns.mdx`.
- [ ] Edit `DESIGN.md`.

**Build.**

- [ ] Run `architect` on the stage before code. The shape to start from is one `DemoStage` component that owns the lifecycle as `type Phase = 'shell' | 'loading' | 'ready' | 'fallback'`, the same phases as `ContributionSkyline`, plus `running` gated on being within 200px of the viewport and on `document.visibilityState`. It renders a fixed aspect ratio, a mono caption row, a controls row with buttons styled like the skyline's stat buttons, and a visually hidden description. Each demo passes a `mount(element, signal)` function and gets back `{ step, destroy }`.
- [ ] Register demos in the `components` map in `NoteContent.tsx`. The server renders each demo's shell, so it is in the HTML. The stage starts the `import()` of the demo's code only when the shell comes within 200px of the viewport, so each demo's code is its own chunk and is not requested before then. `ContributionSkyline` starts its import on mount, so copy its phases, not its import timing.
- [ ] Add `.demo` to `src/styles/index.css`. It widens a demo from the 37rem prose to the 80ch column on wide screens and keeps it at the prose width on phones.
- [ ] `TaxiFares` draws eight made-up taxi rides, distance across and fare up, the guessed fare line, and each ride's miss as an outlined square whose side is the miss, on a 2D canvas. Two range inputs labeled `starting fee` and `price per km` set `b` and `w`, and each shows its value in dollars and cents. The rides run 0.3 to 2.4 km and follow a fee near 5 and a price near 1.5 with traffic added, so no line touches all of them. Short rides keep the valley in ai-04 wide enough to walk down in tens of steps (Appendix A). The caption shows the loss, as in `loss 4.21`, with the number in `ink` and the word in `faint`. `meanSquaredError`, the rides, and the least-squares fit live in `src/lib/demos/taxiFares.ts`.
- [ ] Add a Demos section to `DESIGN.md` with the stage rules from `docs/ai-series/design.md`.

**You see.**

- [ ] On `/notes/how-a-machine-learns`, dragging `price per km` resizes every error square and changes the loss in the caption on the same frame.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/demos/taxiFares.test.ts` asserts `meanSquaredError` of the eight fixed rides at `w = 0, b = 0` and at the least-squares fit, as literal values the test records. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no demos. Record that, load `/notes/time` at trunk and head, and gate the new note's demo end state. Save `regression.png`. Pass when `/notes/time` matches pixel for pixel and the demo reaches the least-squares loss after the lane drags both sliders there.
- [ ] Lane 2. 1440px, light. Drag both sliders through ten positions. Save `desktop-light.png`. Pass when the caption's loss matches `meanSquaredError` at every position.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the probe reports a scroll width of 390 and both sliders work by touch.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when nothing on the page animates without input.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when the shell shows its still figure and description at the same height as the live stage.
- [ ] Lane 6. Layout shift. Load the note cold with the network throttled to Fast 3G. Save `cls.png`. Pass when the layout shift from the demo's mount onward is 0 and the whole load's shift equals trunk's. Trunk's font swap shifts part 1 by 0.0000327.
- [ ] Lane 7. Keyboard only. Tab to each slider and move it with the arrow keys. Save `keyboard.png`. Pass when focus is visible on each control and the loss updates.
- [ ] Lane 8. Lazy load and off screen. Record request times from a cold load, then scroll the demo into view, then out of view, and count canvas paints for five seconds. Save `offscreen.png`. Pass when the demo's chunk is first requested after the shell comes within 200px of the viewport, and the paint count is 0.
- [ ] Lane 9. Client navigation. Go between the note and `/notes` five times. Save `navigation.png`. Pass when the console is clean and one stage is mounted at the end.
- [ ] Lane 10. Screen reader names. Read the accessibility tree. Save `a11y.png`. Pass when the stage has a name, each slider has a label and a value, and the description says what the figure shows.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. First Load JS for `/notes/[slug]`, and the longest main-thread task while a slider is dragged.
- [ ] Probe. `pnpm build` at trunk and head, interleaved twice, for the route table. `/tmp/ai-series/probe.mjs` at 4x CPU throttling for the drag, five runs at head.
- [ ] Baseline. Record the trunk First Load JS first. Trunk has no demo, so the drag has no trunk value.
- [ ] Rule. Fail when First Load JS grows by more than 1 kB, since demo code must load as its own chunk. Fail when any drag run has a task over 50 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots into `/tmp/ai-series/review/ai-02-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the slider drag on a lane worktree with Playwright's `recordVideo`. Save it as `/tmp/ai-series/review/ai-02-review.webm`.
- [ ] Post the screenshots, the video, and the Vercel preview URL in chat. Stop at merge-ready. Wait for the operator.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-02 to the stack and the operator lands it bottom-up.

## Show the code that runs (ai-03)

**Depends on.** ai-02.

**Files.**

- [ ] Edit `src/lib/notes.ts`.
- [ ] Edit `tsconfig.json`.
- [ ] Create `src/lib/ml/value.ts`.
- [ ] Create `src/lib/ml/value.test.ts`.
- [ ] Create `src/components/demos/FareReceipt.tsx`.
- [ ] Edit `src/notes/how-a-machine-learns.mdx`.
- [ ] Edit `CLAUDE.md`.

**Build.**

- [ ] Add a remark plugin to `getNoteContent` that replaces a fenced block whose meta is `include=src/lib/ml/value.ts#backward` with the lines between `// #region backward` and `// #endregion` in that file. A missing file or region fails the build with the note's name, like `rehypeNoteImages` does for images.
- [ ] Add `erasableSyntaxOnly` to `tsconfig.json`, beside the `allowImportingTsExtensions` that ai-01 set, so `src/lib/ml` imports its own files as `./value.ts` and runs unchanged under `node --test` and later `scripts/train.mjs`.
- [ ] `Value` in `src/lib/ml/value.ts` holds `data`, `grad`, its inputs, and its local backward step, with `add`, `mul`, `pow`, `exp`, `log`, `tanh`, `relu`, and `backward`. `exp` and `log` are there for ai-05's sigmoid output and cross-entropy loss. Keep it under 80 lines, since the note shows all of it.
- [ ] `FareReceipt` works out `loss = (w * x + b - y) ** 2` for one ride as an HTML table read like a receipt, one row per step. The rows are distance times price per km, plus the starting fee, minus what the rider paid, and the miss times itself. A nudge button adds one cent to the price per km and shows how the bottom row changes. A backward button fills a `slope` column from the bottom row up, one row at a time. The receipt's ride is a short one, because a one-cent nudge differs from the true slope by the distance squared times 0.01. Appendix A's preview used its 0.3 km ride.

**You see.**

- [ ] The note's `Value` code block is byte-identical to the region in `src/lib/ml/value.ts`. The receipt's slope for the price per km differs from the nudge ratio by at most the ride's distance squared times 0.01, plus 1e-9, which is 0.0009 on a 0.3 km ride. The prose calls the nudge very close to the slope, never equal, because at some settings the two round to different hundredths, -0.56 against -0.55 (measured).

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/ml/value.test.ts` asserts literal gradients. For `a = 2, b = -3, c = 10`, `d = a * b + c` gives `a.grad = -3`, `b.grad = 2`, and `c.grad = 1`. `tanh(0.8814)` has a gradient of about 0.49998, asserted within 1e-4. A shared node used twice accumulates both gradients. Run `pnpm test`.
- [ ] `src/lib/notes.test.ts` gains a case where a missing region throws `src/notes/x.mdx: src/lib/ml/value.ts has no region nope`. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no included code. Record that, load `/notes/time` and `/notes/how-to-write-code` at trunk and head, and gate the included block. Save `regression.png`. Pass when the existing notes match pixel for pixel and the included block's text equals the region on disk.
- [ ] Lane 2. 1440px, light. Press nudge, then backward. Save `desktop-light.png`. Pass when the nudge ratio and the price per km's slope differ by at most the ride's distance squared times 0.01, plus 1e-9, read from the unrounded values the test hook exposes.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the receipt fits without horizontal scroll and the code block scrolls inside itself.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when the backward pass fills every slope at once instead of row by row.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when the receipt shows its forward values from the server render.
- [ ] Lane 6. Edit the region in `value.ts` and rebuild. Save `include-follows.png`. Pass when the note's block shows the edit.
- [ ] Lane 7. Keyboard only. Save `keyboard.png`. Pass when both buttons work from the keyboard and focus is visible.
- [ ] Lane 8. Copy the included block from the page. Save `copy.png`. Pass when pasting it into `node --input-type=module-typescript` with `value.ts`'s imports defines `Value`.
- [ ] Lane 9. Client navigation five times. Save `navigation.png`. Pass when the console is clean.
- [ ] Lane 10. Screen reader names. Save `a11y.png`. Pass when the receipt reads as a table with a header row, and every row's value and slope are in the accessibility tree.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. First Load JS for `/notes/[slug]`, and the note page build time in the `pnpm build` output.
- [ ] Probe. `pnpm build` at trunk and head, interleaved twice.
- [ ] Baseline. Record trunk's First Load JS and the `/notes/[slug]` build time first.
- [ ] Rule. Fail when First Load JS grows by more than 1 kB, or when the note build time grows by more than 200 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots into `/tmp/ai-series/review/ai-03-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of nudge and backward. Save it as `/tmp/ai-series/review/ai-03-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat for the operator. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-03 to the stack and the operator lands it bottom-up.

## Draw the loss landscape (ai-04)

**Depends on.** ai-03.

**Files.**

- [ ] Create `src/lib/demos/lossLandscapeScene.ts`.
- [ ] Create `src/components/demos/LossLandscape.tsx`.
- [ ] Edit `src/notes/how-a-machine-learns.mdx`.

**Build.**

- [ ] `mountLossLandscape` draws the loss of `TaxiFares`' eight rides over the starting fee and the price per km as a 1px wireframe with hidden lines removed, the surface Appendix A picked, with the skyline's camera limits. A cube marks the current settings. The `starting fee` and `price per km` axis labels sit on plates, so the reader can tell the two directions apart without the caption. A fog switch hides every wireframe cell farther than two cells from the cube, which is all the machine can feel. The height is a squeezed loss, `log(1 + loss / 0.6)` as in the preview, so the whole valley fits. Steps use the real loss.
- [ ] The demo shares the two settings with a small `TaxiFares` beside it. A step button moves the cube by one gradient step. A walk button keeps stepping until the slope under the cube is almost flat, with the two knobs' slopes together under 0.01, a rule that never looks at the least-squares answer, and the caption then reads `the ground is flat here`. Under reduced motion it jumps to the end. The learning rate control offers a slow rate, a good one, one that zigzags, and one past the limit that, from the starting settings, raises the loss on every step. The note quotes the limit computed from the data, as the prototype did, and says any rate above it climbs out of the valley sooner or later, even when the first few steps go down, unless it starts right at the bottom. Just past the limit they do, rate 0.331 lowered the loss for 12 steps before it rose (measured on the preview's data).
- [ ] The prose's inference sentence asks the trained line for a 1.6 km ride, which is not among the eight rides but sits inside their range. It shows the fee and price rounded to cents and computes the fare from those rounded numbers, so the sum on screen adds up.
- [ ] Without WebGL the stage shows a still contour image rendered at build time.

**You see.**

- [ ] At the good rate, presses of step bring the caption's loss within 1% of the least-squares loss in the count the unit test records, 46 on Appendix A's preview data. Walk at the good rate reaches the bottom in a few seconds. At the too big rate from the starting settings, the loss grows on every step.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/demos/lossLandscape.test.ts` asserts that gradient steps at the good rate from the demo's starting settings reach 1% of the least-squares loss in the literal step count the test records, that the computed rate limit equals the literal the test records, that every step at the too big preset from the starting settings ends with a larger loss than before it, and that 500 steps at 1.01 times the limit end with a larger loss than the start. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no landscape. Record that, check that the backdrop and `/` skyline still draw at head, and gate the descent. Save `regression.png`. Pass when the home skyline matches trunk and walk at the good rate stops on flat ground after the step count the unit test records, 69 on Appendix A's preview data, with its loss within 0.1% of the least-squares loss.
- [ ] Lane 2. 1440px, light. Drag the camera, turn the fog on, then walk at the good rate. Save `desktop-light.png`. Pass when the cube rests in the valley's lowest cell and, with the fog on, no wireframe cell farther than two cells from the cube is drawn.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when a vertical swipe on the stage scrolls the page and the scroll width is 390.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when the cube jumps to each step's end with no easing.
- [ ] Lane 5. WebGL off with `--disable-webgl`. Save `no-webgl.png`. Pass when the contour image and both controls show.
- [ ] Lane 6. The rate past the limit. Save `diverge.png`. Pass when the cube leaves the valley and the caption says the loss grew.
- [ ] Lane 7. Keyboard only. Save `keyboard.png`. Pass when the arrow keys turn the focused stage and every control is reachable.
- [ ] Lane 8. Off screen and hidden tab. Save `offscreen.png`. Pass when the scene renders 0 frames in five seconds in both cases.
- [ ] Lane 9. Client navigation five times. Save `navigation.png`. Pass when the console never warns about too many WebGL contexts.
- [ ] Lane 10. Theme change while open. Save `theme.png`. Pass when the surface takes the dark tokens without a reload.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. The longest main-thread task from the stage entering the viewport to the first frame, and First Load JS for `/notes/[slug]`.
- [ ] Probe. `/tmp/ai-series/probe.mjs` at 4x CPU throttling, five runs at head. `pnpm build` at trunk and head, interleaved twice.
- [ ] Baseline. Record trunk's First Load JS first. Trunk has no scene. The backdrop's mount, a longest task of about 30 ms at 4x per `DESIGN.md`'s backdrop section, is the reference for a scene of this size.
- [ ] Rule. Fail when any run has a task over 50 ms, or when First Load JS grows by more than 1 kB.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 5 screenshots into `/tmp/ai-series/review/ai-04-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of a descent at the good rate and a divergence past the limit. Save it as `/tmp/ai-series/review/ai-04-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat for the operator. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-04 to the stack and the operator lands it bottom-up.

## Train a network in the playground (ai-05)

**Depends on.** ai-03.

**Files.**

- [ ] Create `src/lib/ml/mlp.ts`.
- [ ] Create `src/lib/ml/mlp.test.ts`.
- [ ] Create `src/components/demos/Playground.tsx`.
- [ ] Edit `src/notes/how-a-machine-learns.mdx`.

**Build.**

- [ ] `Neuron`, `Layer`, and `MLP` in `src/lib/ml/mlp.ts`, built on `Value`, under 50 lines together, with regions `mlp` and `train`. The `train` region is the training loop, with binary cross-entropy and adam. The note includes both regions, so the code it shows is the code that trains the playground.
- [ ] The playground's math is the preview's, exactly. Hidden layers use `tanh` and the output neuron a sigmoid, `1 / (1 + exp(-s))`. The loss is binary cross-entropy averaged over the 100 points, computed from the unsquashed score `s` by one `Value` operation, `max(s, 0) - y * s + log(1 + exp(-abs(s)))`, which never overflows, with its backward step set to `sigmoid(s) - y`, as in the preview. The clamp to between 1e-7 and 1 - 1e-7 applies only to the loss the caption shows. The step is adam at a learning rate of 0.01, with 0.9 and 0.999 and bias correction, over the full batch. Each dataset is made from seed 11, and each reset builds the network from the next seed, starting at 3. The preview ran this math on arrays. Here it runs on `Value`, so the PR records its own step time.
- [ ] `Playground` is sketch b from Appendix A. It trains a 2-8-8-1 `MLP` on the main thread, one step per frame, because at four steps a frame `days` was solved in 0.2 seconds, before a reader could watch (observed in the preview, log not kept). It draws the decision field as square cells toned at most 24% from `bg` toward `ink`, the points as filled and hollow squares, and a Hinton diagram of the first layer. Every visible weight square is at least 3px on a side, so a small negative weight still draws hollow. Pointing at a weight row draws that neuron's fence, its straight dividing line, on the field. On a phone the diagram sits under the field and stays upright, so pointing at a row works the same at every width, and the prose never says where it sits. Controls are train, pause, step, reset, and a picker of four made-up datasets of 100 points each. `days` is comfortable days indoors, temperature across and humidity up, comfortable in the middle, the circle case. `switches` is a hallway light with a switch at each end, the xor case. `groups` is two groups that one fence splits. `spiral` is the hard one. Each chart labels its axes in words. It opens on `days`, because `switches` is solved in a few hundred steps and the bend is over before the reader looks. The caption writes the loss with fixed decimals, never as `3e-4`.

**You see.**

- [ ] On `switches`, the caption shows the loss under 0.05 and accuracy at 100% within 20 seconds at 1x CPU. The preview's math got there in 63 to 115 steps over ten network seeds (measured, Appendix A).
- [ ] The note's `mlp` and `train` code blocks are byte-identical to the regions in `src/lib/ml/mlp.ts`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/ml/mlp.test.ts` seeds the random weights and asserts the parameter count of a 2-8-8-1 `MLP` is 105, and that 500 steps on `switches` reach 100% accuracy. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no playground. Record that, load `/notes/time` at trunk and head, and gate the `switches` end state. Save `regression.png`. Pass when `/notes/time` matches and `switches` reaches 100% within 20 seconds.
- [ ] Lane 2. 1440px, light, each dataset. Save `desktop-<dataset>.png`. Pass when `days`, `switches`, and `groups` reach 100% and `spiral` passes 90% within 60 seconds.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the field, the Hinton diagram, and the controls fit at a scroll width of 390.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when training starts only from train or step.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when the shell shows a still of a trained `days` field.
- [ ] Lane 6. 4x CPU throttling while training. Save `throttled.png`. Pass when the probe's longest task stays under 50 ms and a pause click takes effect within one frame.
- [ ] Lane 7. Keyboard only. Save `keyboard.png`. Pass when every control works with focus visible.
- [ ] Lane 8. Off screen and hidden tab. Save `offscreen.png`. Pass when the step count does not change in five seconds.
- [ ] Lane 9. Client navigation five times during training. Save `navigation.png`. Pass when no training loop survives leaving the page.
- [ ] Lane 10. Hinton diagram signs. Set one weight negative, and another to a negative value just large enough to draw at the 3px minimum, through the test hook. Save `hinton.png`. Pass when both negative squares are hollow, including the small one, and the positive ones are filled.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Training steps per second and the longest main-thread task while training.
- [ ] Probe. `/tmp/ai-series/probe.mjs` on `switches` at 1x and 4x CPU throttling, five runs each at head.
- [ ] Baseline. Trunk has no playground. Appendix A measured a 2-8-8-1 `Value` network on 100 points at a median of 2.5 ms a step in Node, but with ReLU, a margin loss, and plain gradient descent, not this PR's math. So first time this PR's `MLP` on `switches` in Node, 200 steps after warmup, and record its median as the reference. The demo paces itself at one step per frame, so steps per second measure the pace, not the cost.
- [ ] Rule. Fail when any run has a task over 50 ms, or when the median training step takes more than 5 ms at 1x. Single slow steps are left to the long-task check, since the reference run itself had a 33 ms step (measured, `out/micrograd.txt`).

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots into `/tmp/ai-series/review/ai-05-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of `days` and `spiral` training. Save it as `/tmp/ai-series/review/ai-05-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat for the operator. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-05 to the stack and the operator lands it bottom-up.

## Finish part 1 (ai-06)

**Depends on.** ai-04 and ai-05.

**Files.**

- [ ] Edit `src/notes/how-a-machine-learns.mdx`.
- [ ] Create `src/components/Glossary.tsx`.
- [ ] Edit `src/components/NoteContent.tsx`.

**Build.**

- [ ] Write the prose for every section from the part 1 outline in `docs/ai-series/design.md`, in natural case, as `DESIGN.md` says, and in plain words, with no symbol outside the font subsets. Every term comes after the everyday thing it names, and the sample there sets the voice. The prose never depends on a code block.
- [ ] Keep the corrections the Codex review made to the part 1 outline. The loss is named before the first demo. The nudge is very close to the slope, not equal to it. Too big raises the loss on every step from where the cube starts, and any rate above the limit climbs out sooner or later. The learning rate scales the slope. The landscape squeezes its tall parts. The inference question is a 1.6 km ride. A filled square is a positive number and the later layers decide what it does to the answer. The playground scores yes or no answers differently and steps with adam, and the prose says so before train.
- [ ] `Glossary` and `Term` render an `IndexSection` labeled `words from this note` with one `IndexRow` per term, so the glossary looks like every other list on the site. Each meaning points back at the example, as in `weight` with `a knob that scales an input, like the price per km`.
- [ ] Remove `draft: true` and set `publishedAt` to the landing date.

**You see.**

- [ ] `VERCEL_ENV=production pnpm build` lists five notes, and the glossary shows sixteen terms.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/notes.test.ts` gains a case that every term in the design doc's part 1 list appears in the note's glossary. Run `pnpm test`.
- [ ] `pnpm build` passes its font check, so the prose uses no character the subsets lack.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Load `/`, `/notes`, and every existing note at trunk and head. Save `regression.png`. Pass when existing pages match and the new note is first in the list.
- [ ] Lane 2. 1440px, light, read top to bottom. Save `desktop-light.png`. Pass when every demo reaches its end state from the earlier PRs' lanes in one session.
- [ ] Lane 3. 390px, dark, read top to bottom. Save `phone-dark.png`. Pass when the scroll width is 390 everywhere.
- [ ] Lane 4. Reduced motion, read top to bottom. Save `reduced-motion.png`. Pass when nothing moves without input.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when the note reads in full with each demo's still and description.
- [ ] Lane 6. The backdrop band. Sample text contrast in the top 460px for 90 seconds per `DESIGN.md`. Save `plates.png`. Pass when every text tone keeps its plain contrast.
- [ ] Lane 7. Keyboard only, tab through the whole note. Save `keyboard.png`. Pass when the order follows the reading order and focus is always visible.
- [ ] Lane 8. Share card and RSS. Fetch the note's Open Graph image and the feed. Save `og-rss.png`. Pass when the title and description show in lowercase and the feed's first item is the new note.
- [ ] Lane 9. Beginner read. Give a fresh agent the note's text with every code block removed, plus part 1's five questions in `docs/ai-series/design.md`, and no other context. Save `beginner.txt`. Pass when all five answers match the design doc's, and each answer cites a sentence of the note that comes before the note first uses the term the question asks about.
- [ ] Lane 10. Screen reader pass over the whole note. Save `a11y.png`. Pass when each demo is announced with its name and description and the glossary rows read as a list.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Largest contentful paint and total transferred bytes for the note at 4x CPU and Fast 3G.
- [ ] Probe. `/tmp/ai-series/probe.mjs` cold loads of the new note and of `/notes/time`, alternating, five each at head.
- [ ] Baseline. Record `/notes/time` at trunk first.
- [ ] Rule. Fail when the new note's largest contentful paint exceeds `/notes/time`'s by more than 200 ms, since every demo loads after its shell.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots into `/tmp/ai-series/review/ai-06-review-<slug>.png`.
- [ ] Record a 30 to 60 second video scrolling the note on a phone viewport. Save it as `/tmp/ai-series/review/ai-06-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat. The operator reads the prose and decides when it goes public. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-06 to the stack. The operator lands it, which publishes part 1.

## Count letters and split text (ai-07)

**Depends on.** ai-03.

**Files.**

- [ ] Create `public/data/names.txt`.
- [ ] Create `src/lib/ml/bigram.ts`.
- [ ] Create `src/lib/ml/bigram.test.ts`.
- [ ] Create `src/lib/ml/tokenizers.ts`.
- [ ] Create `src/components/demos/CountingModel.tsx`.
- [ ] Create `src/components/demos/Tokenizers.tsx`.
- [ ] Create `src/notes/words-as-numbers.mdx`.

**Build.**

- [ ] Copy `names.txt` from karpathy/makemore at a pinned commit and record the commit and the MIT license in the PR body.
- [ ] `src/lib/ml/bigram.ts` counts letter pairs into a 27 by 27 `Uint32Array` with `.` as the start and end token, starting every count at one as the prototype's `bigramLoss` does, turns a row into probabilities, and samples with a temperature. Starting at one keeps every letter's chance above zero, so temperature can reach every letter. On all names the loss is 2.4546 with the extra one and 2.4540 without, both 2.45 (measured). Mark regions `tokenizer` in `tokenizers.ts` and `counts` and `sample` in `bigram.ts`.
- [ ] `CountingModel` fetches `names.txt` when the shell nears the viewport and draws the grid as squares sized by count, one row per letter and one column per next letter. Typing a letter highlights its row and shows each next letter's share. Sample and a temperature control produce names. The temperature control's ends read `samey` and `strange`.
- [ ] `Tokenizers` splits one sentence into characters, words, and pieces from a byte-pair vocabulary trained ahead of time on the note's own text by `src/lib/demos/writeData.ts` and committed. A test fails when the note's text and the committed vocabulary drift apart. Each row shows the menu size and the number of pieces. It comes first in the note, because the note names the token before anything else.
- [ ] Create part 2 as a draft with the demos in place.

**You see.**

- [ ] The caption under the grid shows the counting model's loss on all names as 2.45, the value Appendix A measured, and ten sampled names appear on press.
- [ ] The note's tokenizer and counting model code blocks are byte-identical to their regions in `src/lib/ml/tokenizers.ts` and `src/lib/ml/bigram.ts`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/ml/bigram.test.ts` asserts the count of `.e` pairs in `names.txt` and the average negative log likelihood as the literal values the test records, plus a fixed-seed sample at temperature 1.0. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no part 2. Record that, load `/notes` in a production build at trunk and head, and gate the draft's demos in a preview build. Save `regression.png`. Pass when the production list is unchanged and both demos reach their end states.
- [ ] Lane 2. 1440px, light. Type `a`, then sample twenty names. Save `desktop-light.png`. Pass when the row for `a` shows probabilities that sum to 1.00 and no sampled name is empty.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the grid fits at a scroll width of 390 and stays readable.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when nothing animates without input.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when both shells show stills and descriptions.
- [ ] Lane 6. Temperature at 0.1 and at 2.0. Save `temperature.png`. Pass when 0.1 repeats the likeliest names and 2.0 produces rare letter pairs.
- [ ] Lane 7. Keyboard only. Save `keyboard.png`. Pass when letter input, sample, and temperature all work from the keyboard.
- [ ] Lane 8. Data fetch. Count requests for `names.txt` from page load until the demo is in view. Save `fetch.png`. Pass when it is fetched once and only after the shell nears the viewport.
- [ ] Lane 9. Polish text in the tokenizer input. Save `polish.png`. Pass when `zażółć gęślą jaźń` splits without broken characters.
- [ ] Lane 10. Screen reader names. Save `a11y.png`. Pass when the grid has a hidden table of the top pairs and the probabilities are announced.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. The longest main-thread task from fetch to first grid paint, and bytes transferred for `names.txt`.
- [ ] Probe. `/tmp/ai-series/probe.mjs` at 4x CPU throttling, five cold runs at head.
- [ ] Baseline. Trunk has no part 2. Record `/notes/time`'s longest task at trunk as the reference for a page with only the backdrop.
- [ ] Rule. Fail when a run has a task over 50 ms, or when `names.txt` transfers more than 120 kB compressed.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 6 screenshots into `/tmp/ai-series/review/ai-07-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of typing, sampling, and the tokenizer. Save it as `/tmp/ai-series/review/ai-07-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat for the operator. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-07 to the stack and the operator lands it bottom-up.

## Learn letter vectors in a worker (ai-08)

**Depends on.** ai-07.

**Files.**

- [ ] Create `src/lib/ml/letters.ts`.
- [ ] Create `src/lib/ml/letters.test.ts`.
- [ ] Create `src/lib/ml/train.worker.ts`.
- [ ] Create `src/lib/demos/letterSpaceScene.ts`.
- [ ] Create `src/components/demos/LearnToCount.tsx`.
- [ ] Create `src/components/demos/LetterSpace.tsx`.
- [ ] Edit `src/notes/words-as-numbers.mdx`.

**Build.**

- [ ] Run `architect` on the parameter layout before code, because ai-10 and ai-13 reuse it. The shape to start from is one `Float32Array` for every parameter, one for every gradient, and a layout table of `{ name, offset, shape }`. A checkpoint is the layout as JSON plus the raw array. The worker's messages are a discriminated union, `start`, `pause`, `sample`, and `snapshot` in, `progress`, `sample`, and `snapshot` out.
- [ ] `src/lib/ml/letters.ts` holds the two learned models from part 2 of `docs/ai-series/design.md`, with `Float32Array` math and a hand-written backward pass. First the one-letter model, a 27 by 27 table of logits trained with softmax and cross-entropy, whose loss flattens at the counting model's 2.45. Then the three-letter model, which gives each letter an embedding of exactly three numbers, so the 3D view draws the learned numbers with no projection. Mark regions `softmax`, `crossEntropy`, `oneLetter`, and `threeLetter`, and include each in the note.
- [ ] `LearnToCount` trains the one-letter model in the worker and draws its loss in part 1's chart style, with the counting model's 2.45 as a faint line, so the reader sees the network catch up with counting and stop there. It comes before `LetterSpace`.
- [ ] `train.worker.ts` trains either model and posts the loss every 100 ms and the letter vectors every 250 ms.
- [ ] `letterSpaceScene.ts` draws the letters as square points with 11px mono labels in the backdrop's style, at their three learned numbers, and eases between snapshots. It takes the alphabet as a parameter, 27 symbols here and 39 in part 4, and accepts a projection for vectors longer than three, which ai-14 uses.
- [ ] Calibrate before setting the gates. Record the three-letter config, its hidden width, learning rate, and batch, then train it five times with seeds 1 to 5 in Node for 60 seconds each. Record the step and the time at which each run first meets the vowel statistic and first drops below 2.3, and the loss at 200 steps for seed 1. Set the gates below from the weakest run, and replace any that no run meets. Calibrate `LearnToCount` the same way, recording its seed, optimizer, and batch, and the step at which its 100-step average loss first comes within 0.02 of 2.45 in each of five runs. It stops at twice the slowest of those steps. The gates in this PR are provisional until then, because no three-letter prototype ran.

**You see.**

- [ ] `LearnToCount`'s loss ends within 0.02 of the counting model's 2.45 (provisional).
- [ ] After 30 seconds of training at 1x CPU, the vowels meet the vowel statistic, and the caption's loss is below the counting model's 2.45 (provisional, see the calibration box). The vowel statistic holds when the mean distance between the ten pairs of `a e i o u` is below the median distance over all 351 pairs of the 27 symbols, measured on the three learned numbers.
- [ ] The note's `softmax`, `crossEntropy`, `oneLetter`, and `threeLetter` code blocks are byte-identical to their regions in `src/lib/ml/letters.ts`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/ml/letters.test.ts` compares every analytic gradient of both models with central finite differences on a tiny config, computed in float64, and passes when every element has an absolute error under 1e-6 or a relative error under 1e-3. A float32 gradcheck rejects correct gradients. On ai-10's planned test shape, the prototype's correct gradients gave a worst relative error of 1.0 in float32 and 7.2e-6 in float64 (measured). It also asserts the fixed-seed loss after 200 steps as the literal the calibration recorded. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no letter space. Record that, check that the backdrop draws at trunk and head, and gate the vowel statistic. Save `regression.png`. Pass when the backdrop matches and the vowels meet the vowel statistic within 30 seconds.
- [ ] Lane 2. 1440px, light. Train `LearnToCount`, then train `LetterSpace` for 60 seconds. Save `desktop-light.png`. Pass when the one-letter loss, averaged over its last 100 steps at the calibrated stop, is within 0.02 of 2.45, the three-letter loss falls below the calibrated 60-second gate, and the labels never overlap the caption.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the stage fits at a scroll width of 390 and a vertical swipe scrolls the page.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when points jump between snapshots and training starts only from train.
- [ ] Lane 5. WebGL off. Save `no-webgl.png`. Pass when a 2D projection replaces the 3D stage and training still runs.
- [ ] Lane 6. 4x CPU throttling while training. Save `throttled.png`. Pass when the main thread's longest task stays under 50 ms, because training runs in the worker.
- [ ] Lane 7. Keyboard only. Save `keyboard.png`. Pass when train, pause, and reset work and the arrow keys turn the stage.
- [ ] Lane 8. Off screen and hidden tab. Save `offscreen.png`. Pass when the worker's step count stops advancing within one second.
- [ ] Lane 9. Client navigation five times during training. Save `navigation.png`. Pass when the count of live workers at the end is 0 after leaving and 1 after returning.
- [ ] Lane 10. Screen reader names. Save `a11y.png`. Pass when the stage's description lists each letter's five nearest letters, updated when training pauses.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Worker training steps per second at the shipped config, and the main thread's longest task while training.
- [ ] Probe. `/tmp/ai-series/probe.mjs` at 1x and 4x CPU throttling, five runs each at head. `node --test` timing of the same config in Node for comparison.
- [ ] Baseline. Trunk has no worker. Record the Node steps per second from the test run first, on the same machine.
- [ ] Rule. Fail when the worker's steps per second at 1x fall below 70% of Node's, both counting training steps only, without reporting or snapshots. The 4x runs check only the main thread. Fail when any main-thread task exceeds 50 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 5 screenshots into `/tmp/ai-series/review/ai-08-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the letters moving during training. Save it as `/tmp/ai-series/review/ai-08-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat for the operator. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-08 to the stack and the operator lands it bottom-up.

## Finish part 2 and link the series (ai-09)

**Depends on.** ai-06 and ai-08.

**Files.**

- [ ] Edit `src/notes/words-as-numbers.mdx`.
- [ ] Edit `src/notes/how-a-machine-learns.mdx`.
- [ ] Edit `src/lib/notes.ts`.
- [ ] Edit `src/pages/notes/[slug].tsx`.
- [ ] Edit `DESIGN.md`.
- [ ] Edit `CLAUDE.md`.

**Build.**

- [ ] Write part 2's prose and glossary from the part 2 outline in `docs/ai-series/design.md`, by the same rules as part 1, then remove `draft: true`.
- [ ] Notes gain optional `series` and `part` fields. Add both to `fields` in `src/lib/notes.ts`, because ai-01 makes an unknown field fail the build, and update the sentence about `fields` in `CLAUDE.md`. The four part titles live in one list in `src/lib/notes.ts`. A note in a series shows an `IndexSection` labeled `the ai series` with one row per part, the current one marked with `aria-current`. A published part links to its note. A part not published yet shows its title with `coming soon` and no link.
- [ ] A note in a series replaces the footer's `next:` link with `← part n` and `part n →` links to its neighbors, because `next:` points at the older note.
- [ ] Add `series: ai` and `part: 1` to part 1.

**You see.**

- [ ] Part 1 shows `part 2 →` in its footer and part 2 shows `← part 1`. Both list four rows under `the ai series`, parts 1 and 2 as links and parts 3 and 4 as `coming soon`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/notes.test.ts` asserts that `seriesParts('ai')` returns all four parts in part order, each published part with its slug, that a draft part comes back without a link in production, and that a duplicate part number fails with the two file names. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Load every note outside the series at trunk and head. Save `regression.png`. Pass when their footers still show `next:` and match pixel for pixel.
- [ ] Lane 2. 1440px, light, part 1 to part 2 by the footer and back by the series index. Save `desktop-light.png`. Pass when both links land on the right part.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the series index and footer fit at a scroll width of 390.
- [ ] Lane 4. Reduced motion, part 2 top to bottom. Save `reduced-motion.png`. Pass when nothing moves without input.
- [ ] Lane 5. JavaScript off, both parts. Save `no-js.png`. Pass when both read in full and the series links work.
- [ ] Lane 6. The backdrop band on part 2. Save `plates.png`. Pass when every text tone keeps its plain contrast for 90 seconds.
- [ ] Lane 7. Keyboard only, then a screen reader pass over the series index. Save `keyboard.png`. Pass when the series rows invert on focus like other index rows and the current part is announced as current.
- [ ] Lane 8. Share card and RSS for part 2. Save `og-rss.png`. Pass when both show part 2 in lowercase.
- [ ] Lane 9. Production build with part 3 as a draft stub. Save `draft-part.png`. Pass when the index shows two linked rows and two `coming soon` rows, and part 2's footer has no forward link.
- [ ] Lane 10. Beginner read. Give a fresh agent the text of parts 1 and 2 with every code block removed, plus part 2's five questions in `docs/ai-series/design.md`, and no other context. Save `beginner.txt`. Pass when all five answers match the design doc's, and each answer cites a sentence of the note that comes before the note first uses the term the question asks about.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Largest contentful paint for part 2 at 4x CPU and Fast 3G, and First Load JS for `/notes/[slug]`.
- [ ] Probe. `/tmp/ai-series/probe.mjs` cold loads of part 2 and `/notes/time`, alternating, five each. `pnpm build` at trunk and head, interleaved twice.
- [ ] Baseline. Record trunk's `/notes/time` and First Load JS first.
- [ ] Rule. Fail when part 2's largest contentful paint exceeds `/notes/time`'s by more than 200 ms, or when First Load JS grows by more than 1 kB.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots into `/tmp/ai-series/review/ai-09-review-<slug>.png`.
- [ ] Record a 30 to 60 second video moving through both parts. Save it as `/tmp/ai-series/review/ai-09-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat. The operator reads the prose and decides when it goes public. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-09 to the stack. The operator lands it, which publishes part 2.

## Build the tiny gpt and its offline trainer (ai-10)

**Depends on.** ai-03 and ai-08, whose parameter layout it builds on.

**Files.**

- [ ] Create `src/lib/ml/gpt.ts`.
- [ ] Create `src/lib/ml/gpt.test.ts`.
- [ ] Create `src/lib/ml/corpus.ts`.
- [ ] Create `scripts/train.mjs`.
- [ ] Create `public/data/shakespeare.txt`.
- [ ] Create `public/models/shakespeare.bin` and `public/models/shakespeare.json`.
- [ ] Edit `package.json`.

**Build.**

- [ ] Port `docs/ai-series/prototype/tinygpt/src/gpt.js`, with only its four-row matmul, into `src/lib/ml/gpt.ts` on the parameter layout ai-08 settled. Keep each function short enough to include in a note by region. Mark regions for `attention`, `block`, `forward`, `backward`, and `adamw`.
- [ ] `src/lib/ml/corpus.ts` lowercases the corpus, builds the vocabulary, and splits 90% for training and 10% for validation.
- [ ] Define the evaluation fixture in `gpt.ts`, the prototype's, and use it for every logged loss, the reload test, and the step gates in ai-13. The validation loss is the mean over 8 batches of 16 by 64 drawn from the validation split with seed 99. The training loss printed beside it is the same over 8 training batches with seed 98. A sample is 200 characters at temperature 0.8, started from a newline, with sampler seed 7. The word share lowercases a sample, splits it on whitespace, strips every character outside `a` to `z` and `'`, and counts the words found in the corpus's word set, as `prototype/tinygpt/src/words.js` does.
- [ ] `scripts/train.mjs` imports `gpt.ts` directly, trains Appendix A's config for a fixed 12,000 steps with seed 1, and writes the checkpoint. At 92.6 ms a step that is about 19 minutes (inferred), and the script prints how long it took. A fixed step count, not a time limit, makes the checkpoint depend only on the seed. Add `pnpm train` to `package.json`.
- [ ] Commit tiny shakespeare from karpathy/char-rnn at a pinned commit as `public/data/shakespeare.txt`, and the checkpoint.

**You see.**

- [ ] `pnpm train` prints the fixture's training and validation loss every 100 steps and ends with the checkpoint path, its size, and the time taken.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/ml/gpt.test.ts` builds a 1-layer, `d = 8`, 2-head, context-4 model in float64 and compares every parameter's analytic gradient with central finite differences. It passes when every element has an absolute error under 1e-6 or a relative error under 1e-3. On this shape the prototype's float64 gradients reach a worst relative error of 7.2e-6, and float32 reaches 1.0 on the same correct code (measured). It asserts the shipped config's parameter count as the literal 30,055, and that the causal mask holds by checking that changing a later token leaves earlier logits unchanged. Run `pnpm test`.
- [ ] Loading the committed checkpoint and evaluating the fixture gives the validation loss `pnpm train` printed last, to three decimals. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no model. Record that, run `pnpm build` at trunk and head, and gate `pnpm train`'s end state. Save `regression.png`. Pass when every route's First Load JS matches trunk and the trained validation loss is below 1.93, Appendix A's 300-second number for the same config.
- [ ] Lane 2. `pnpm train` from a clean checkout. Save `train-log.png`. Pass when it finishes and writes the checkpoint.
- [ ] Lane 3. Rerun `pnpm train` with the same seed. Save `deterministic.png`. Pass when the checkpoint is byte-identical.
- [ ] Lane 4. Sample 500 characters from the checkpoint at temperature 0.8 with sampler seed 7. Save `sample.png`. Pass when the fixture's word share is at least 60%. The bound is provisional. Appendix A's 300-second samples, 2,449 steps in, scored 62% to 68%, and no 12,000-step run exists yet.
- [ ] Lane 5. Load the checkpoint in Chromium through a bare test page and sample with the same seed. Save `browser-sample.png`. Pass when the browser's sample matches Node's character for character.
- [ ] Lane 6. Corrupt one byte in the `.json` layout. Save `bad-layout.png`. Pass when loading fails with the field name, not a silent wrong model.
- [ ] Lane 7. Truncate the `.bin` file. Save `bad-bin.png`. Pass when loading fails with the expected and actual byte counts.
- [ ] Lane 8. The fixture's validation loss against its training loss at the end. Save `overfit.png`. Pass when validation exceeds training by less than 0.15. The bound is provisional, because the longest prototype run stopped at five minutes. The PR records the measured gap, and a miss goes to the operator.
- [ ] Lane 9. Build output. Save `bundle.png`. Pass when `gpt.ts` appears in no page's First Load JS.
- [ ] Lane 10. License. Save `license.png`. Pass when the corpus file header or the PR body names its source and public-domain status.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Milliseconds per training step in Node at the shipped config.
- [ ] Probe. `node scripts/train.mjs --bench 200` five times at head, median with min and max.
- [ ] Baseline. Trunk has no model. Appendix A measured 92.6 ms. The lane machine may differ, so first put tiny shakespeare at `docs/ai-series/prototype/tinygpt/data/shakespeare/input.txt` and run `node src/train.js --data=shakespeare-lower --dim=32 --layers=2 --heads=4 --ctx=64 --batch=16 --kernel=ikj4 --mode=bench` from `docs/ai-series/prototype/tinygpt` five times on the same core.
- [ ] Rule. Fail when the median step is more than 1.3 times the prototype's on the same machine, since the port should not lose the prototype's speed.

**Review gate.** None. ai-10 is not review-gated.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-10 to the stack and the operator lands it bottom-up.

## Show attention (ai-11)

**Depends on.** ai-09 and ai-10.

**Files.**

- [ ] Create `src/components/demos/SoftLookup.tsx`.
- [ ] Create `src/lib/demos/softLookup.ts`.
- [ ] Create `src/lib/demos/softLookup.test.ts`.
- [ ] Create `src/components/demos/AttentionTriangle.tsx`.
- [ ] Create `src/components/demos/Heads.tsx`.
- [ ] Create `src/notes/paying-attention.mdx`.

**Build.**

- [ ] `SoftLookup` draws four earlier words from the note's example sentence as 2D key arrows, with each arrow's length visible, and a draggable query arrow for `small`, the last word, which looks back to find what was too small. Bars show the softmax of the dot products, and a point shows the weighted average of the values. The demo shows only earlier words. The causal mask in the next section lets a word read itself and the words before it, and hides the words after it. The dot product, softmax, and weighted average live in `src/lib/demos/softLookup.ts`.
- [ ] `AttentionTriangle` draws one sentence's attention weights from the checkpoint as a triangle of squares sized by weight. Hover or focus a row to read it.
- [ ] `Heads` loads the checkpoint on request and draws each head's weights from the hovered token as arcs whose stroke tone is the weight.
- [ ] Create part 3 as a draft, with `series: ai` and `part: 3`, and the `attention` region included from `gpt.ts`.

**You see.**

- [ ] Dragging the query onto a key's direction pushes that key's bar above 0.9. In `Heads`, at least one head puts most of its weight on the previous character.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/demos/softLookup.test.ts` asserts the softmax weights for a fixed query and keys as literal values that sum to 1. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no part 3. Record that, load parts 1 and 2 at trunk and head, and gate the three demos' end states. Save `regression.png`. Pass when parts 1 and 2 match outside the masked series navigation, with the index rows and the footer's part links checked against the parts that exist at head, and each demo reaches its end state.
- [ ] Lane 2. 1440px, light. Drag the query around a full circle. Save `desktop-light.png`. Pass when the weights always sum to 1.00 and each key wins once.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the triangle and the arcs fit at a scroll width of 390.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when nothing animates without input.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when each shell shows a still and a description.
- [ ] Lane 6. Checkpoint fetch. Save `fetch.png`. Pass when the checkpoint loads only after the reader asks or the demo nears the viewport, and only once.
- [ ] Lane 7. Keyboard only. Save `keyboard.png`. Pass when the query moves with the arrow keys and triangle rows take focus.
- [ ] Lane 8. Causal mask. Save `mask.png`. Pass when no square sits above the triangle's diagonal.
- [ ] Lane 9. Client navigation five times. Save `navigation.png`. Pass when the console is clean.
- [ ] Lane 10. Screen reader names. Save `a11y.png`. Pass when the triangle has a hidden table of weights and the query's position is announced.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. The longest main-thread task from the checkpoint fetch to the first arcs, and the checkpoint's transferred bytes.
- [ ] Probe. `/tmp/ai-series/probe.mjs` at 4x CPU throttling, five cold runs at head.
- [ ] Baseline. Trunk has no part 3. Appendix A computes the checkpoint as 120,220 bytes of weights plus its layout JSON. Record the committed files' sizes first.
- [ ] Rule. Fail when a task exceeds 50 ms, or when the checkpoint transfers more than 132,000 bytes, about 10% over the weights.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 8 screenshots into `/tmp/ai-series/review/ai-11-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the query drag and the heads. Save it as `/tmp/ai-series/review/ai-11-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat for the operator. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-11 to the stack and the operator lands it bottom-up.

## Finish part 3 (ai-12)

**Depends on.** ai-11.

**Files.**

- [ ] Create `src/components/demos/ResidualStream.tsx`.
- [ ] Edit `src/notes/paying-attention.mdx`.

**Build.**

- [ ] `ResidualStream` draws one block in SVG. Each token has a column of numbers, labeled as its notebook, and attention and the small network read a leveled copy of it and add to it. Stepping through the block highlights which part writes.
- [ ] Include the `block` region from `gpt.ts` in the note, next to the `attention` region ai-11 included.
- [ ] Prototype a 3D version, tokens by layers by dimensions, on the branch. Ship it only if the operator picks it over the SVG in review. Record the choice in the PR body.
- [ ] Write part 3's prose and glossary from the part 3 outline in `docs/ai-series/design.md`, by the same rules as part 1, then remove `draft: true`.

**You see.**

- [ ] Stepping through the block shows the residual column change twice, once after attention and once after the MLP.
- [ ] The note's `attention` and `block` code blocks are byte-identical to their regions in `src/lib/ml/gpt.ts`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/notes.test.ts` gains the part 3 glossary case. Run `pnpm test`.
- [ ] `pnpm build` passes its font check.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Load parts 1 and 2 at trunk and head, then follow every footer and index link across parts 1 to 3. Save `regression.png`. Pass when parts 1 and 2 match outside the masked series navigation, with the index rows and the footer's part links checked against the parts that exist at head, the index shows part 3 as a link on every part, and every link lands on the right part.
- [ ] Lane 2. 1440px, light, read top to bottom. Save `desktop-light.png`. Pass when every demo reaches its end state in one session.
- [ ] Lane 3. 390px, dark, read top to bottom. Save `phone-dark.png`. Pass when the scroll width is 390 everywhere.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when nothing moves without input.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when the note reads in full.
- [ ] Lane 6. The backdrop band. Save `plates.png`. Pass when every text tone keeps its plain contrast for 90 seconds.
- [ ] Lane 7. Keyboard only through the whole note. Save `keyboard.png`. Pass when focus follows reading order and stays visible.
- [ ] Lane 8. Share card and RSS. Save `og-rss.png`. Pass when both show part 3 in lowercase.
- [ ] Lane 9. Beginner read. Give a fresh agent the text of parts 1 to 3 with every code block removed, plus part 3's five questions in `docs/ai-series/design.md`, and no other context. Save `beginner.txt`. Pass when all five answers match the design doc's, and each answer cites a sentence of the note that comes before the note first uses the term the question asks about.
- [ ] Lane 10. Screen reader pass. Save `a11y.png`. Pass when the residual diagram's steps are announced.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Largest contentful paint for part 3 at 4x CPU and Fast 3G.
- [ ] Probe. `/tmp/ai-series/probe.mjs` cold loads of part 3 and `/notes/time`, alternating, five each.
- [ ] Baseline. Record `/notes/time` at trunk first.
- [ ] Rule. Fail when part 3 exceeds `/notes/time` by more than 200 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots, and the 3D prototype's screenshot, into `/tmp/ai-series/review/ai-12-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of the residual stream, SVG and 3D. Save it as `/tmp/ai-series/review/ai-12-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat. The operator picks SVG or 3D, reads the prose, and decides when it goes public. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-12 to the stack. The operator lands it, which publishes part 3.

## Train the tiny gpt in the browser (ai-13)

**Depends on.** ai-12.

**Files.**

- [ ] Edit `src/lib/ml/train.worker.ts`.
- [ ] Create `src/components/demos/TrainGpt.tsx`.
- [ ] Create `src/notes/a-tiny-gpt.mdx`.

**Build.**

- [ ] The worker gains a `gpt` model kind next to `letters`, with the same messages.
- [ ] `TrainGpt` shows train, pause, and load the trained one, all three from the start, so a reader on a slow device never has to wait. The loss curve is a 1px `ink` line labeled `practice`, with the validation loss in `faint` labeled `exam`. Its x-axis counts steps, not seconds, so a slow device draws the same curve, only later. Every few seconds a sample from the current weights appears under the curve, newest first, at most five.
- [ ] Create part 4 as a draft, with `series: ai` and `part: 4`.

**You see.**

- [ ] By step 900 the fixture's validation loss is under 2.15, and the fixture's word share of a sample taken at step 900 is at least 40%, with ai-10's fixture settings. Load the trained one replaces the curve's end with the checkpoint's loss.
- [ ] One of two outcomes holds, and the PR names which. Either, at 1x CPU in Chromium, step 900 arrives within 120 seconds of pressing train, and part 4 leads with live training. Or it does not, and part 4 leads with load the trained one, keeps live training as the second step, and still passes the step-900 checks above. The second outcome is a presentation change the operator approves in review, not a failure.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/ml/gpt.test.ts` gains a case that sends `start`, then `pause`, to the worker's message handler and asserts the step count stops changing. Run `pnpm test`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Trunk has no part 4. Record that, run part 2's letter space at trunk and head, and gate part 4's training end state. Save `regression.png`. Pass when the letter space still meets ai-08's vowel statistic and part 4's fixture validation loss is under 2.15 by step 900.
- [ ] Lane 2. 1440px, light. Train to step 900. Save `desktop-light.png`. Pass when the step-900 sample's word share is at least 40%, and the timing matches the outcome the PR names, step 900 within 120 seconds for live-first, or load the trained one leading the note for checkpoint-first.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the curve and the samples fit at a scroll width of 390.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when training starts only from train and samples appear without animation.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when the shell shows a recorded loss curve and three recorded samples.
- [ ] Lane 6. 4x CPU throttling while training. Save `throttled.png`. Pass when the main thread's longest task stays under 50 ms.
- [ ] Lane 7. Keyboard only. Save `keyboard.png`. Pass when every control works with focus visible.
- [ ] Lane 8. Hidden tab for 60 seconds. Save `hidden.png`. Pass when the step count does not change while hidden and resumes after.
- [ ] Lane 9. Client navigation five times during training. Save `navigation.png`. Pass when no worker survives leaving the page.
- [ ] Lane 10. Load the trained one. Save `load.png`. Pass when the checkpoint loads once and the samples improve at once.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Worker milliseconds per step at the shipped config, and the main thread's longest task while training.
- [ ] Probe. `/tmp/ai-series/probe.mjs` at 1x and 4x CPU throttling, five runs each. `node scripts/train.mjs --bench 200` alternating with them.
- [ ] Baseline. Trunk has no browser trainer. Record Node's median step time first.
- [ ] Rule. Fail when the worker's median step at 1x is more than 1.2 times Node's on the same machine, both timing training steps only, without sampling or posting. The 4x runs check only the main thread. Fail when a main-thread task exceeds 50 ms. Appendix A measured Chromium between about 3% faster and 12% slower than Node.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2, 3, and 10 screenshots into `/tmp/ai-series/review/ai-13-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of training from noise to words, sped up and labeled with the real time. Save it as `/tmp/ai-series/review/ai-13-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat for the operator. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-13 to the stack and the operator lands it bottom-up.

## Finish part 4 (ai-14)

**Depends on.** ai-13.

**Files.**

- [ ] Edit `src/notes/a-tiny-gpt.mdx`.
- [ ] Edit `src/components/demos/LetterSpace.tsx`.
- [ ] Edit `src/components/demos/Heads.tsx`.

**Build.**

- [ ] `LetterSpace` and `Heads` accept the reader's own trained weights from the worker, so part 4 shows what the model the reader just trained learned. `LetterSpace` gets the 39-symbol alphabet and projects each letter's 32 numbers to three by PCA, and the prose says the map squeezes 32 numbers into three directions.
- [ ] Add a table of this model, GPT-2, and GPT-3 by parameters and training tokens, with each number linked to its paper.
- [ ] Write part 4's prose and glossary from the part 4 outline in `docs/ai-series/design.md`, by the same rules as part 1, including the closing section on what the series left out, then remove `draft: true`.

**You see.**

- [ ] After training in part 4, its letter space and heads redraw from the reader's weights, and the table's numbers each link to a source.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `src/lib/notes.test.ts` gains the part 4 glossary case and a case that the series has parts 1 to 4 with no gap. Run `pnpm test`.
- [ ] `pnpm build` passes its font check.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `claude-sonnet-5-5` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Load parts 1 to 3 at trunk and head, then read the whole series from part 1 to part 4 by footer links. Save `regression.png`. Pass when parts 1 to 3 match outside the masked series navigation, with the index rows and the footer's part links checked against the parts that exist at head, the index shows part 4 as a link on every part, every hop lands on the next part, and part 4 has no forward link.
- [ ] Lane 2. 1440px, light, read top to bottom and train. Save `desktop-light.png`. Pass when every demo reaches its end state in one session.
- [ ] Lane 3. 390px, dark. Save `phone-dark.png`. Pass when the scroll width is 390 everywhere, including the table.
- [ ] Lane 4. Reduced motion. Save `reduced-motion.png`. Pass when nothing moves without input.
- [ ] Lane 5. JavaScript off. Save `no-js.png`. Pass when the note reads in full with recorded results.
- [ ] Lane 6. The backdrop band. Save `plates.png`. Pass when every text tone keeps its plain contrast for 90 seconds.
- [ ] Lane 7. Keyboard only through the whole note. Save `keyboard.png`. Pass when focus follows reading order and stays visible.
- [ ] Lane 8. Every link in the table. Save `sources.png`. Pass when each returns 200 and the page states the number the table shows.
- [ ] Lane 9. Beginner read. Give a fresh agent the text of parts 1 to 4 with every code block removed, plus part 4's five questions in `docs/ai-series/design.md`, and no other context. Save `beginner.txt`. Pass when all five answers match the design doc's, and each answer cites a sentence of the note that comes before the note first uses the term the question asks about.
- [ ] Lane 10. Screen reader pass. Save `a11y.png`. Pass when the table has headers and the training demo announces progress politely, at most every 5 seconds.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Largest contentful paint for part 4 at 4x CPU and Fast 3G.
- [ ] Probe. `/tmp/ai-series/probe.mjs` cold loads of part 4 and `/notes/time`, alternating, five each.
- [ ] Baseline. Record `/notes/time` at trunk first.
- [ ] Rule. Fail when part 4 exceeds `/notes/time` by more than 200 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy lane 2 and lane 3 screenshots into `/tmp/ai-series/review/ai-14-review-<slug>.png`.
- [ ] Record a 30 to 60 second video of part 4 from train to the redrawn letter space. Save it as `/tmp/ai-series/review/ai-14-review.webm`.
- [ ] Post the screenshots, the video, and the preview URL in chat. The operator reads the prose and decides when it goes public. Stop at merge-ready.

**Merge.**

- [ ] Root's clean verdict at the exact head SHA.
- [ ] Bugbot triage done.
- [ ] Rebased onto current trunk after the verdict, patch-id unchanged.
- [ ] The root appends ai-14 to the stack. The operator lands it, which publishes part 4.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.

## Appendix A. Prototype evidence

Two prototypes ran before this plan. Both are throwaway code. Their sources and logs are in `docs/ai-series/prototype/`, without the datasets, the CPU profiles, or the screenshots.

### Tooling probe

In a scratch worktree, since removed, `allowImportingTsExtensions` and `erasableSyntaxOnly` in `tsconfig.json` let `node --test` run `.ts` tests with no new dependency. `pnpm typecheck` passed, and Next 15.5 built and rendered a page that imports a `./x.ts` path (observed, log not kept). ai-03 makes that change for real.

### Demo sketches

Three sketches of part 1's demos on one page, in the site's tokens, light and dark. The page is `prototype/sketches/index.html`, published privately at https://claude.ai/artifact/ALwBqCago6nWrcjUXMoL28. `prototype/sketches/shoot.mjs` drives it in Playwright and runs 52 checks, which all passed (observed, log not kept).

- **Sketch a, the loss landscape.** Three surfaces for the same loss over `w` and `b`. The wireframe read as a valley. Voxel columns read as a block, and terraces read as a faint band (observed in screenshots). On the sketch's data the step rate limit is 0.42. At 0.38 the cube zigzags down the valley, and at 0.43 it leaves the valley in about nine steps (measured). ai-04 ships the wireframe and quotes the limit computed from its own data.
- **Sketch b, the playground.** A 2D decision field, the points as filled and hollow squares, and a Hinton diagram of the first layer. It read at a glance in both schemes and at 390px (observed). The spiral reached 100% in about 870 steps and 12 seconds, and xor was solved in a few hundred steps (observed, log not kept). ai-05 ships it, with the field tone capped at 24% toward `ink` as in the sketch.
- **Sketch c, the network in 3D.** Voxel columns for neurons and lines for weights. It read as a tangle (observed). Appendix B records why it was dropped.

Review found one defect. The caption printed a loss as `3e-4`, so ai-05 writes fixed decimals.

### Tiny gpt training speed

A character-level transformer in plain JavaScript, `prototype/tinygpt/src/gpt.js`, about 450 lines with one matmul kernel. All parameters live in one `Float32Array` with named views, and it trains with AdamW.

The machine was an i9-12900H laptop with Node 26.8.1, each timed run pinned to one performance core. The core ran at 3.3 to 3.9 GHz under load (observed once, log not kept). Another build shared the machine during some runs. So the step times below come from a quiet bench, and the comparisons that matter also use a view by step count, which load does not change.

**The gradients are right.** `src/gradcheck.js` compares every element of every tensor with central differences in float64, on a 2-layer, `d = 8`, 2-head model. The worst absolute error is 6.4e-11, at the roundoff floor of about 1e-11 (measured, `out/gradcheck.txt`). The worst relative errors, 6.6e-4 and 2.2e-3, sit on gradients of 1.4e-8 and 3.7e-19, where roundoff dominates (measured). The second is a key bias, whose true gradient is zero because softmax ignores a shift shared by every score (inferred).

**Step time** (measured, `out/benchtable.txt`). Three processes per config, 50 steps each after warmup. Every config uses 4 heads, AdamW at a learning rate of 3e-3, and a matmul that reuses each loaded weight across four rows.

| Config | Parameters | Tokens per step | Median ms | Run medians |
| --- | --- | --- | --- | --- |
| names, `d = 32`, 2 layers, context 16, batch 32 | 27,739 | 512 | 37.0 | 36, 37, 37 |
| names, `d = 64`, 2 layers | 104,603 | 512 | 120.9 | 120, 121, 124 |
| lowercase shakespeare, `d = 32`, 2 layers, context 64, batch 16 | 30,055 | 1,024 | 92.6 | 91, 93, 94 |
| shakespeare, `d = 64`, 2 layers | 112,577 | 1,024 | 285.9 | 283, 286, 289 |
| pan tadeusz, `d = 32`, 2 layers | 31,290 | 1,024 | 95.3 | 94, 95, 96 |

**What limits it.** Matmul takes 72% to 74% of a step in a CPU profile, then GELU and attention (measured). Reusing each weight across four rows doubled speed over the textbook loop, measured as per-step ratios of 1.96x and 2.10x in one process (`out/pairs-*.txt`). Preallocating buffers changed nothing measurable, and loop order alone gave 1.16x to 1.25x. Going further needs WebAssembly SIMD or several workers, and Appendix B rejects both.

**Chromium matches Node.** The same modules in a Chromium 152 module worker ran between about 3% faster and 12% slower than Node on the same core, over six paired medians, and the losses matched to four decimals (measured, `out/browser-vs-node.txt`). So a checkpoint trained in Node is the same model in the browser (inferred). Firefox and Safari were not measured.

**Loss over training time** (measured, validation loss, `out/runs/`). Bigram is the counting model's loss on the same held-out text.

| Config | Bigram | 10 s | 30 s | 60 s | 120 s | 300 s |
| --- | --- | --- | --- | --- | --- | --- |
| names, `d = 32` | 2.45 | 2.32 | 2.24 | 2.20 | 2.15 | 2.11 |
| names, `d = 64` | 2.45 | 2.50 | 2.34 | 2.28 | 2.22 | 2.15 |
| lowercase shakespeare, `d = 32` | 2.45 | 2.54 | 2.41 | 2.29 | 2.10 | 1.93 |
| shakespeare, `d = 32` | 2.48 | 2.54 | 2.38 | 2.24 | 2.07 | 1.96 |
| shakespeare, `d = 64` | 2.48 | 3.27 | 2.73 | 2.56 | 2.39 | 2.09 |
| pan tadeusz, `d = 32` | 2.54 | 2.74 | 2.60 | 2.49 | 2.28 | 2.10 |

- The smallest model had the lowest loss at every mark up to 300 seconds on both datasets (measured). A bigger model learns more per step but costs three times as much per step, and five minutes is too short for it to catch up (inferred from the step-count view).
- The counting model on names scores 2.455 on the training split and 2.453 on held-out names (measured). The names transformer's 100-step average training loss drops below that held-out counting loss after about 6 seconds of training (measured from the run log).
- Lowercase and mixed-case shakespeare reach a training loss of 2.05 and 2.07 at step 1,000, and 1.89 and 1.90 at step 2,000 (measured). The vocabulary shrinks from 65 characters to 39, so the two losses are over different alphabets and are not a like-for-like comparison (inferred). Lowercasing removes the capitals, and our losses compare only with other lowercase runs.
- Pan Tadeusz learns slower. At step 1,000 its training loss is 2.29 against lowercase shakespeare's 2.05 (measured). Its 100-step average training loss drops below its own held-out counting loss after about 47 seconds, against 30 for lowercase shakespeare (measured from the run logs). These compare a training average with a held-out loss, so read them as rough times. Its counting loss is higher, 2.54 against 2.45, so the next letter is harder to guess in this text, even after seeing the letter before (measured). It also has 401,000 training characters against a million (measured).

**What the samples look like.** Lowercase shakespeare at `d = 32`, temperature 0.8. One line from the first of three samples at each mark, verbatim:

- 10 seconds. `yore, os cor ile y t.`
- 60 seconds. `iell cop ilily uke hen wings wo dee`
- 120 seconds. `tollent talll to the of a wild prwether,`
- 300 seconds. `now to the peac wit sonseshed, you have swers else`

`src/words.js` counts the share of each sample's words that appear in the corpus (measured, three samples per mark):

| Training time | Elapsed before the sample | Step | Validation loss | Words found in the corpus |
| --- | --- | --- | --- | --- |
| 60 s | 67 s | 452 | 2.29 | 18%, 29%, 22% |
| 120 s | 131 s | 889 | 2.10 | 45%, 54%, 63% |
| 300 s | 314 s | 2,449 | 1.93 | 68%, 67%, 62% |

The marks count time spent training. Evaluating and sampling at each mark add to the reader's wait, so 120 seconds of training had taken about 131 seconds in all (measured from the run JSON). This run shared the machine, with a median step of 116 ms. So ai-13 checks by step count. At step 900 the validation loss is under 2.15 and at least 40% of the newest sample's words are in the corpus, which is below the weakest 120-second sample.

**Scalar autograd is fine for part 1 and no further** (measured, `out/micrograd.txt`). A `Value` object per number, against the same network on arrays with a hand-written backward pass. 100 two-moons points, full batch, ReLU, micrograd's margin loss, and plain gradient descent with a decaying rate. That is not the playground's math, so ai-05 records its own reference. Both end at the same loss to 1e-16.

| Network | Parameters | `Value` ms per step | Steps per second | Slower than arrays |
| --- | --- | --- | --- | --- |
| 2-8-8-1 | 105 | 2.5 | 396 | 45x |
| 2-16-16-1 | 337 | 20.0 | 50 | 233x |
| 2-32-32-1 | 1,185 | 136 | 7 | 336x |

At 2-32-32-1, 62% of a step is garbage collection and 22.5% is the topological sort (measured). The playground stays at 2-8-8-1, and parts 2 to 4 use arrays.

**A slower device.** Loss per step does not depend on the device. A device k times slower shows at time t what this laptop shows at t / k (inferred). A reader's phone or older laptop may be three times slower (guess), which puts the 120-second state near six minutes.

### Part 1 preview

The part 1 sketch was rebuilt around the taxi fare and the comfortable days, with the note's text between the demos. It is published privately at the same link as the first sketches, https://claude.ai/artifact/ALwBqCago6nWrcjUXMoL28, and its source and check script are in `prototype/part1-preview/`. The check printed `all checks passed` (`check-output.txt`).

- The caption's loss matched the mean squared error at five slider positions (measured).
- The least-squares fit is a fee of 5.2358 and a price of 1.4629 per km, at a loss of 0.3279. The step size limit is 0.3302 (measured).
- Rides of 1 to 10 km make the valley 164 times steeper one way than the other, and the stable step sizes we tried needed about 230 to 2,600 steps. Rides of 0.3 to 2.4 km bring that to 18 times, without moving the starting fee off the real starting fee (measured, `valley.mjs`).
- From a fee of 2.00 and a price of 2.50, pressing step reached 1% of the best loss in 314 presses at crawl (0.03), 46 at good (0.20), and 102 at zigzag (0.325). Too big (0.38) raised the loss on every step from that start (measured). Just past the limit the first steps can still go down. At 0.331 the loss fell for 12 steps, then rose, and passed its starting value at step 62 (measured).
- With the fog on, nothing was drawn outside the 25 cells around the cube. With it off, the same audit counted 38,022 pixels outside (measured).
- The nudge and the backward slope agreed to two decimals at two settings, -2.10 and 0.31 (measured). They differ by the ride's distance squared times 0.01, so at other settings they round apart, -0.56 against -0.55 at a fee of 5.00 and a price of 1.08 (measured).
- The playground reached 100% on `days` in 72 steps, `switches` in 17, and `groups` in 9, and 92% on `spiral` in 281 (measured in headless Chromium at about 35 frames a second). These are snapshots from polling, not the first step that got there.
- The playground's math, run in Node over ten network seeds on the page's data, reached 100% on `days` in 70 to 163 steps, on `switches` in 15 to 45, and on `groups` in 1 to 36, and 90% on `spiral` in 245 to 490. `switches` got its loss under 0.05 in 63 to 115 steps (measured).
- The 1.6 km question replaces a 7 km one. The longest ride is 2.4 km, and the old sentence showed rounded numbers but summed unrounded ones, 15.60 on screen against 15.63 from the numbers shown (measured).

### Choices this evidence settles

- Part 4 trains lowercase tiny shakespeare live at `d = 32`, 2 layers, 4 heads, context 64, and batch 16. That is 30,055 parameters, and the checkpoint is 120,220 bytes of float32 weights plus its layout JSON (computed).
- `pnpm train` trains the same config for a fixed 12,000 steps, about 19 minutes at 93 ms a step (inferred). Its validation loss must beat 1.93, the 300-second number.
- Part 3's triangle and heads read the same checkpoint, so one file serves both notes.
- Part 4's curve counts steps, not seconds, and load the trained one is on screen from the start. A slow device then draws the same curve, only later, and its reader never has to wait.
- Pan Tadeusz is not the live demo. It can ship as a second pre-trained checkpoint if the author wants it.
- The playground's `Value` network stays at 2-8-8-1 on 100 points per dataset.

## Appendix B. Alternatives rejected

**Symbols first, then the story.** The first draft of part 1 fit `y = w * x + b` through eight unnamed points and spoke of a loss landscape and gradients before showing what they were for. The operator knows the math and still could not tell what it described. Each note now follows one everyday example, a taxi fare, a phone keyboard, one sentence, a keyboard trained on shakespeare, and names each idea only after the reader has used it.

**Three notes, as requested.** Part 1 would hold neurons, gradient descent, tokens, embeddings, and attention. Attention needs next-token prediction and embeddings first, so part 1 would be twice as long as any note on the site, and part 2 would implement a transformer with nothing to train. Four notes give each one question and one payoff. Folding part 2 into part 3 is the fallback if the operator wants three.

**One long explorable page.** A single page in the style of distill.pub reads well once finished, but it ships nothing until all of it is done, and the notes system has no long-form page type. Four notes ship one at a time.

**Five or six short notes, one idea each.** Each note costs a title, a share card, a glossary, and a review. Readers drop off between parts. Four is the fewest that keeps each note to one question.

**three.js for every demo.** `PRODUCT.md` names motion-heavy demos as an anti-reference. A 3D attention matrix or network diagram hides numbers that a flat grid shows. Only the loss landscape and the embedding space get depth, because there depth is a number.

**The network drawn in 3D.** Sketch c in Appendix A drew the playground's network as voxel columns in three.js. Columns hid each other at rest, the 88 weight lines formed a tangle, dashed negative lines vanished in the middle, and tanh pinned most columns at full height. The depth axis was only the neuron's index. Sketch b's flat Hinton diagram shows the same weights at once.

**Red and blue for sign.** The site has no accent color, and `DESIGN.md` says a new color means the element is too loud. Filled and hollow squares carry sign in the site's own shape.

**tfjs, onnxruntime-web, or WebGPU.** A library would make training faster and the code unreadable. The point of the series is that the reader can read every line. Appendix A shows plain JavaScript is fast enough, with a 30,000-parameter model writing shakespeare-shaped lines after two minutes on one laptop core.

**WebAssembly SIMD or several workers.** Matmul is 72% to 74% of a step, and plain JavaScript has no SIMD, so either would make training faster (inferred). WebAssembly takes the math out of the code the reader reads. Workers sharing one `SharedArrayBuffer` need cross-origin isolation headers on the site for one demo. Neither earns its place while two minutes already shows words.

**A bigger live model.** At `d = 64` the model learns more per step but costs three times as much per step. The `d = 32` model had the lower loss at every mark up to 300 seconds. The reader waits in seconds, so seconds decide.

**Pan Tadeusz as the live corpus.** It is the more personal text. At equal steps it trails lowercase shakespeare by 0.24, and at 120 seconds it writes Polish-shaped words rather than readable ones. It can ship as a second checkpoint, trained offline.

**Mixed-case shakespeare.** The site lowercases what it shows, so a model that writes capitals would show the reader text it did not write. Lowercasing shrinks the vocabulary from 65 to 39, and the training loss per step stayed within 0.02 of mixed case at steps 1,000 and 2,000 (measured), though the two losses are over different alphabets.

**A test framework.** Node 26 runs TypeScript tests with `node --test` and no new dependency. Appendix A's tooling probe shows it works with Next's build.

**Training the backdrop's embeddings for real.** The backdrop holds 3,202 word tokens. The series' models read characters. Swapping the backdrop to trained word vectors is a separate project.

**Long-lived branches per note instead of drafts.** A branch per note would sit unmerged for weeks and rot against trunk. A `draft` flag lets every PR land and keeps unfinished notes out of production.

## Appendix C. Risks

**Training is too slow to watch.** Lands in ai-10 and ai-13. On the prototype's laptop, words appear around step 900, two minutes of training in. A device three times slower needs about six minutes (guess), and Firefox and Safari were not measured. Load the trained one is on screen from the start, and the curve counts steps, so a slow reader still sees the whole story. ai-13 accepts two outcomes. If the worker reaches step 900 within 120 seconds in Chromium at 1x, part 4 leads with live training. If it misses, part 4 leads with load the trained one and keeps live training as the second step, and the step-900 quality checks still apply. The owner watches the worker's step time against Node's.

**The code in the note drifts from the code that runs.** Lands in ai-03. The include plugin fails the build on a missing region. The owner watches for a block written by hand instead of included.

**Math symbols fail the font check.** Lands in every finishing PR. The full Geist faces have `∂`, `√`, `∑`, and `≈`, and the subsets do not, so using one fails `pnpm build`. Greek letters such as `θ` and `η` are missing from Geist itself and fall back to a system font. The prose uses words and code. Adding the Mathematical Operators block to `scripts/fonts.mjs` is the fallback, at a cost in subset size on every note.

**Two WebGL contexts on one page.** Lands in ai-04 and ai-08. The backdrop holds one context on every page. A note with two 3D demos holds three. Browsers allow about 16, but each costs memory on a phone. The owner checks that a scene releases its context when it leaves the viewport for long, and lane 9 of each 3D PR checks navigation.

**The backdrop sits behind the top of every note.** Lands in each finishing PR. A demo placed in the first 460px would draw over the backdrop. The first demo in each note starts below the band, and lane 6 of each finishing PR samples contrast.

**Lowercase hides meaning in notation.** Lands in ai-11. The root lowercases prose, so `Q`, `K`, and `V` read as `q`, `k`, and `v`. The notes use the lowercase names throughout and keep capitals only inside code.

**Voice.** Lands in every finishing PR. The prose must read like the rest of the site, dry and plain, per `PRODUCT.md`. The operator reads every finishing PR before it lands.

**The corpus license.** Lands in ai-07 and ai-10. Names come from an MIT repository. Tiny shakespeare and Pan Tadeusz are public-domain texts. The PR body records each source.

## Appendix D. Links and reading list

- `docs/ai-series/design.md` for what each note teaches.
- `DESIGN.md` for tokens, the index row, the skyline's stage rules, and the plates.
- `PRODUCT.md` for the voice and the anti-references.
- `src/components/ContributionSkyline.tsx` and `src/lib/skylineScene.ts` for the lazy scene pattern every demo copies.
- `src/lib/embeddingsScene.ts` for the point and label style the letter space copies.
- `docs/ai-series/prototype/tinygpt/src/train.js` and `words.js` for the evaluation fixture and the word share that ai-10 and ai-13 reuse.
- ai-02, ai-03, ai-08, and ai-10 get `~/.claude/skills/architect/SKILL.md`, because later PRs build on their shapes. ai-08 and ai-10 also get `~/.claude/skills/interrogate/SKILL.md` on the parameter layout.
- Each owner keeps a `decisions.tsv` trail per `~/.claude/skills/show-me-your-work/SKILL.md` and returns it with the report.
