# jarocki.me

Personal site of Bartosz Jarocki. MDX notes, monochrome, light and dark following the system, type-driven.

[jarocki.me](https://jarocki.me)

## Stack

Next.js (Pages Router) · Tailwind · MDX · Geist Sans/Mono/Pixel · Vercel.

## Develop

Requires Node 22 and pnpm.

```bash
# create .env.local with NEXT_PUBLIC_URL
# optional: GITHUB_TOKEN, a classic personal access token with repo scope,
# adds the merged PR and lines added stats to the GitHub skyline

pnpm install
pnpm dev
```

## Write a note

1. Add `src/notes/<slug>.mdx`. The file name becomes the URL, `/notes/<slug>`.
2. Start the file with frontmatter. All four fields are required, and `publishedAt` is a `YYYY-MM-DD` date.

   ```mdx
   ---
   title: "How to write code?"
   description: "Different stages of company require different thinking"
   publishedAt: 2024-02-16
   tags: ["leadership", "dev"]
   ---
   ```

3. Write the body in Markdown.
4. To add a photo, put it in `public/images/notes/<slug>/` and reference it as `![What the photo shows](/images/notes/<slug>/1.jpg)`. The build reads its width and height from the file.
5. Run `pnpm build`. A missing frontmatter field or a missing image fails the build and names the note. So does a character that the font subsets lack, such as `€`. The error says how to add it.

## Layout

```
src/pages/          Routes (Pages Router)
src/components/     PageShell, Index (rows), Clock, ContributionSkyline, ContributionBars, NoteContent,
                    JsonLd
src/data/           bio, work, projects, books, links
src/lib/            notes (reads and compiles the MDX notes), githubActivity (GitHub contributions
                    and merged PRs), activityStats (skyline stats), skylineScene (three.js scene)
src/notes/          The notes, one MDX file each
src/fonts/          Subsets of the Geist fonts, written by pnpm subset-fonts
src/images/travel   Photos for /about
src/styles/         Color tokens, row and prose styles
public/images/notes Photos for the notes, one folder per note
scripts/fonts.mjs   Writes the font subsets, and checks after each build that they hold every
                    character the site uses
```

## License

MIT.
