# jarocki.me

Personal site of Bartosz Jarocki. MDX notes, monochrome, light and dark following the system, type-driven, set in lowercase. A toy embedding space drifts behind the top of every page, and the ai series notes run their demos in the browser, down to training a tiny GPT.

[jarocki.me](https://jarocki.me)

This site is maintained by AI. [Claude Code](https://claude.com/claude-code) writes the changes and ships them through pull requests.

## Read it without a browser

- `curl https://jarocki.me` prints any page as an 80-column text page. curl, HTTPie, and xh get it at every page's URL.
- An agent that sends `Accept: text/markdown` gets each page as markdown. Adding `.md` to a path, as in `https://jarocki.me/notes/time.md`, or `/index.md` for the home page, gets the same markdown with any headers.
- `https://jarocki.me/llms.txt` lists every note and page with its markdown link.

`DESIGN.md` describes both formats, under Text mode and Markdown mode.

## Stack

Next.js (Pages Router) · Tailwind · MDX · three.js · Geist Sans/Mono/Pixel · Vercel.

## Develop

Requires Node 22.18 or newer, which runs the TypeScript tests and scripts directly, and pnpm.

```bash
# create .env.local with NEXT_PUBLIC_URL
# optional: GITHUB_TOKEN, a classic personal access token with repo scope,
# adds the merged PR and lines added stats to the GitHub skyline

pnpm install
pnpm dev
```

`pnpm test`, `pnpm typecheck`, and `pnpm lint` check the code. `pnpm build` builds the site and checks that the font subsets hold every character it uses.

## Write a note

1. Add `src/notes/<slug>.mdx`. The file name becomes the URL, `/notes/<slug>`.
2. Start the file with frontmatter. These four fields are required, and `publishedAt` is a `YYYY-MM-DD` date.

   ```mdx
   ---
   title: "How to write code?"
   description: "Different stages of company require different thinking"
   publishedAt: 2024-02-16
   tags: ["leadership", "dev"]
   ---
   ```

   Two optional fields exist. `draft: true` keeps the note out of production, while previews still show it. `series: ai` with a `part` from 1 to 4 adds the note to the ai series. Any other field fails the build.

3. Write the body in Markdown. A note can also use the demos in `src/components/demos/` and the `Glossary` and `Term` components. A demo needs a `label` and a description, as in `<TaxiFares label="…">description</TaxiFares>`, or the build fails. `DESIGN.md` covers demos under Demos.
4. To add a photo, put it in `public/images/notes/<slug>/` and reference it as `![What the photo shows](/images/notes/<slug>/1.jpg)`. The build reads its width and height from the file.
5. Run `pnpm build`. A missing frontmatter field or a missing image fails the build and names the note. So does a character that the font subsets lack, such as `€`. The error says how to add it.

## Layout

```
src/pages/          Routes (Pages Router), and API routes for the text, markdown, llms.txt, RSS, and
                    share images
src/middleware.ts   Sends curl and markdown requests to the text and markdown routes
src/components/     PageShell, Index (rows), Cased, Clock, CodeBlock, ContributionSkyline,
                    ContributionBars, EmbeddingsBackdrop, Glossary, NoteContent, JsonLd
src/components/demos/  The demos a note can use, one shell each
src/data/           bio, work, projects, books, links
src/lib/            notes (reads and compiles the MDX notes), githubActivity (GitHub contributions
                    and merged PRs), activityStats (skyline stats), skylineScene and embeddingsScene
                    (three.js scenes), textPage, textPages, and textNote (the pages as text blocks),
                    markdownPage (the blocks as markdown)
src/lib/demos/      The scenes and data behind each demo
src/lib/ml/         The small models behind the demos, from bigram counts and an MLP to a tiny GPT
src/notes/          The notes, one MDX file each
src/fonts/          Subsets of the Geist fonts, written by pnpm subset-fonts
src/images/travel   Photos for /about
src/styles/         Color tokens, row and prose styles
public/images/notes Photos for the notes, one folder per note
public/data         The names and Shakespeare texts the demos learn from
public/models       The saved tiny GPT, written by pnpm train
scripts/fonts.mjs   Writes the font subsets, and checks after each build that they hold every
                    character the site uses
scripts/icons.mjs   Draws the favicon and the home screen icon from the Geist Pixel Square glyphs
scripts/train.mjs   Trains the tiny GPT offline and writes its checkpoint to public/models
scripts/            measure-note-data checks each built note's page data size. verify-snippets and
                    verify-snippet-demos click through the runnable examples and demos in a browser
```

## License

MIT.
