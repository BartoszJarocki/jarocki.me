# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build the application for production, then check that the font subsets hold every character the site uses
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code and CSS with Prettier. Markdown and MDX stay as written
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm postbuild` - Generate sitemap (runs automatically after build)
- `pnpm subset-fonts` - Write the Geist subsets in `src/fonts` from the `geist` package
- `pnpm icons` - Write the favicon, the SVG icon, and the home screen icon in `public` from the Geist Pixel Square glyphs

## Architecture Overview

This is a personal website built with Next.js. Notes are MDX files in the repo.

### Key Components:
- **Next.js Pages Router** - File-based routing in `src/pages/`
- **MDX Notes** - Notes are MDX files in `src/notes/`, read by `src/lib/notes.ts`
- **Theme System** - Light and dark color tokens as CSS custom properties that follow `prefers-color-scheme`. There is no toggle
- **Static Generation** - Pages are built once with SSG. Only the home page revalidates, hourly, for its GitHub activity

### Core Architecture:
- `src/pages/_app.tsx` - App wrapper that loads Geist Mono and Geist Pixel Square, sets the base text style, and renders `DefaultSeo`, the one place for site-wide SEO defaults: the title template, Open Graph site name and locale, and the X card
- `src/pages/_document.tsx` - The HTML shell. It also preloads the fonts a dynamic route declares, because Next misses them
- `src/components/PageShell.tsx` - Per-page SEO tags, page layout, and the header nav on every page. It sets the canonical URL and Open Graph tags, `noindex` on error pages, and a `BlogPosting` JSON-LD when a note passes `article`
- `src/components/JsonLd.tsx` - Writes a JSON-LD script into the head. Use it instead of next-seo's JSON-LD components, which escape `&` as `&amp;` and break URLs
- `src/components/Index.tsx` - The index row components every page is built from (see `DESIGN.md`)
- `src/lib/notes.ts` - The only module that reads `src/notes/`. It checks each note's frontmatter and compiles its body with next-mdx-remote
- `src/components/NoteContent.tsx` - Renders a compiled note, with `next/image` for images
- `src/components/` - Reusable React components
- `src/data/` - Static data and content
- `src/images/` - Static images organized by category

### Notes:
- Each note is one `.mdx` file in `src/notes/`. The file name is the slug
- The frontmatter needs `title`, `description`, `publishedAt` as a `YYYY-MM-DD` date, and `tags` as a list of strings. A missing or empty field fails the build
- A note's images live in `public/images/notes/<slug>/`, and the note references them as `![alt](/images/notes/<slug>/1.jpg)`
- The build reads each image's width and height from the file, so a missing image fails the build

### Styling:
- `DESIGN.md` describes the design system: tokens, type roles, the index row, and contrast numbers
- Six color tokens (`bg`, `ink`, `body`, `faint`, `rule`, `wash`) defined in `src/styles/index.css` and mapped to Tailwind colors. There is no accent color
- Dark mode follows the system through `prefers-color-scheme`, so components use no `dark:` variants
- Note prose is styled by the `.prose` rules in `src/styles/index.css`. Code blocks have no syntax highlighting

## Environment Variables Required

- `NEXT_PUBLIC_URL` - Base URL for canonical links and OG images
- `GITHUB_TOKEN` - Optional. Classic personal access token with `repo` scope. Adds the merged PR and lines added stat buttons to the home page's GitHub skyline. Without it the skyline shows contributions only

## Key Features

- **Notes** - MDX files in `src/notes/`, each with tags shown on the note and in the notes list
- **Share Images** - `src/pages/api/og.tsx` draws each page's Open Graph image with `next/og` on Node, in the light tokens and Geist (see `DESIGN.md`)
- **SEO Optimization** - NextSEO integration with sitemap generation
- **Analytics** - Vercel Analytics integration
- **Image Optimization** - Next.js Image component. Note images get their size at build time

## Code Conventions

- TypeScript throughout with strict configuration
- Component files use PascalCase (e.g., `Avatar.tsx`)
- Utility functions in `src/lib/`
- Tailwind classes for styling, no CSS modules
- Geist fonts: `font-mono` (Geist Mono) for chrome, `font-sans` (Geist) for note prose and titles, `font-pixel` (Geist Pixel Square) for the name and clock. Each face loads with `localFont` from a subset in `src/fonts`, never from `geist/font` (see `DESIGN.md`). Geist loads only on note pages, from `src/pages/notes/[slug].tsx`. Elsewhere `font-sans` is the system sans font
- Pages use getStaticProps/getStaticPaths for SSG where applicable