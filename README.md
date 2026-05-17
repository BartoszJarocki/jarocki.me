# jarocki.me

Personal site of Bartosz Jarocki. Notion-backed notes, dark monochrome aesthetic, type-driven.

[jarocki.me](https://jarocki.me)

## Stack

Next.js (Pages Router) · Tailwind · Notion API · Geist Sans/Mono · Vercel.

## Develop

Requires Node 18+ and pnpm.

```bash
cp .env.example .env.local
# fill in: NEXT_PUBLIC_URL, NOTION_TOKEN, NOTION_DATABASE_ID

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
src/components/    PageShell, SiteNav, DatedRowList, NoteContent
src/data/          bio, work, projects, books
src/lib/notesApi   Notion client
src/images/travel  Photos for /about
src/styles/        Tailwind layer + ds-* component classes
```

## License

MIT.
