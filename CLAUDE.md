# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code and CSS with Prettier. Markdown and MDX stay as written
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm postbuild` - Generate sitemap (runs automatically after build)

## Architecture Overview

This is a personal website built with Next.js. Notes are MDX files in the repo.

### Key Components:
- **Next.js Pages Router** - File-based routing in `src/pages/`
- **MDX Notes** - Notes are MDX files in `src/notes/`, read by `src/lib/notes.ts`
- **Theme System** - Light and dark color tokens as CSS custom properties that follow `prefers-color-scheme`. There is no toggle
- **Static Generation** - Pages are built once with SSG. Only the home page revalidates, hourly, for its GitHub activity

### Core Architecture:
- `src/pages/_app.tsx` - App wrapper that loads the fonts, sets the base text style, and renders `DefaultSeo`, the one place for site-wide SEO defaults: the title template, Open Graph site name and locale, and the X card
- `src/components/PageShell.tsx` - SEO tags, page layout, and the header nav on every page
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
- **OG Image Generation** - Dynamic Open Graph images using `@vercel/og`
- **SEO Optimization** - NextSEO integration with sitemap generation
- **Analytics** - Vercel Analytics integration
- **Image Optimization** - Next.js Image component. Note images get their size at build time

## Code Conventions

- TypeScript throughout with strict configuration
- Component files use PascalCase (e.g., `Avatar.tsx`)
- Utility functions in `src/lib/`
- Tailwind classes for styling, no CSS modules
- Geist fonts: `font-mono` (Geist Mono) for chrome, `font-sans` (Geist) for note prose and titles, `font-pixel` (Geist Pixel Square) for the name and clock
- Pages use getStaticProps/getStaticPaths for SSG where applicable