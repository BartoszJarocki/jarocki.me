# jarocki.me

Personal site of Bartosz Jarocki. Notion-backed notes, monochrome, light and dark following the system, type-driven.

[jarocki.me](https://jarocki.me)

## Stack

Next.js (Pages Router) · Tailwind · Notion API · Geist Sans/Mono/Pixel · Vercel.

## Develop

Requires Node 18+ and pnpm.

```bash
# create .env.local with NEXT_PUBLIC_URL, NOTION_TOKEN, NOTION_DATABASE_ID
# optional: GITHUB_TOKEN, a classic personal access token with repo scope,
# adds the merged PR and lines added stats to the GitHub skyline

pnpm install
pnpm dev
```

## Notion schema

Notes database properties:

| Property      | Type          |
| ------------- | ------------- |
| `title`       | Title         |
| `slug`        | Rich Text     |
| `description` | Rich Text     |
| `published`   | Checkbox      |
| `publishedAt` | Date          |
| `hashtags`    | Multi-select  |
| `inProgress`  | Checkbox      |
| `cover`       | Files & Media |

## Layout

```
src/pages/         Routes (Pages Router)
src/components/    PageShell, Index (rows), Clock, ContributionSkyline, ContributionBars, NoteContent
src/data/          bio, work, projects, books, links
src/lib/           notesApi (Notion client), githubActivity (GitHub contributions and merged PRs),
                   activityStats (skyline stats), skylineScene (three.js scene)
src/images/travel  Photos for /about
src/styles/        Color tokens, row and prose styles, monochrome Prism theme
```

## License

MIT.
