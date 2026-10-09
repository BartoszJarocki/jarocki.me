# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm postbuild` - Generate sitemap (runs automatically after build)

## Architecture Overview

This is a personal website built with Next.js that uses Notion as a headless CMS for blog posts/notes.

### Key Components:
- **Next.js Pages Router** - File-based routing in `src/pages/`
- **Notion Integration** - Blog content fetched from Notion database via `src/lib/notesApi.ts`
- **Theme System** - Light and dark color tokens as CSS custom properties that follow `prefers-color-scheme`. There is no toggle
- **Static Generation** - Uses SSG for performance with ISR for content updates

### Core Architecture:
- `src/pages/_app.tsx` - App wrapper that loads the fonts and sets the base text style
- `src/components/PageShell.tsx` - SEO tags, page layout, and the header nav on every page
- `src/components/Index.tsx` - The index row components every page is built from (see `DESIGN.md`)
- `src/lib/notesApi.ts` - Notion API client handling blog post fetching and processing
- `src/components/` - Reusable React components
- `src/data/` - Static data and content
- `src/images/` - Static images organized by category

### Notion Integration:
The site expects a Notion database with specific properties:
- `id`, `created_time`, `last_edited_time`, `cover`
- `hashtags` (multi-select), `title`, `description`, `slug`
- `published` (checkbox), `publishedAt` (date), `inProgress` (checkbox)

### Styling:
- `DESIGN.md` describes the design system: tokens, type roles, the index row, and contrast numbers
- Six color tokens (`bg`, `ink`, `body`, `faint`, `rule`, `wash`) defined in `src/styles/index.css` and mapped to Tailwind colors. There is no accent color
- Dark mode follows the system through `prefers-color-scheme`, so components use no `dark:` variants
- Note prose is styled by the `.prose` rules in `src/styles/index.css`. `src/styles/prism.css` is a monochrome code theme

## Environment Variables Required

- `NEXT_PUBLIC_URL` - Base URL for canonical links and OG images
- `NOTION_TOKEN` - Notion API token
- `NOTION_DATABASE_ID` - ID of the Notion database containing blog posts

## Key Features

- **Blog/Notes System** - Content managed via Notion, supports tags and draft posts
- **OG Image Generation** - Dynamic Open Graph images using `@vercel/og`
- **SEO Optimization** - NextSEO integration with sitemap generation
- **Analytics** - Vercel Analytics integration
- **Image Optimization** - Plaiceholder for image placeholders, Next.js Image component

## Code Conventions

- TypeScript throughout with strict configuration
- Component files use PascalCase (e.g., `Avatar.tsx`)
- Utility functions in `src/lib/`
- Tailwind classes for styling, no CSS modules
- Geist fonts: `font-mono` (Geist Mono) for chrome, `font-sans` (Geist) for note prose and titles, `font-pixel` (Geist Pixel Square) for the name and clock
- Pages use getStaticProps/getStaticPaths for SSG where applicable