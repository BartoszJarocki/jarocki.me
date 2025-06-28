# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn dev` - Start Next.js development server
- `yarn build` - Build the application for production 
- `yarn start` - Start production server
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier
- `yarn typecheck` - Run TypeScript type checking
- `yarn postbuild` - Generate sitemap (runs automatically after build)

## Architecture Overview

This is a personal website built with Next.js that uses Notion as a headless CMS for blog posts/notes.

### Key Components:
- **Next.js Pages Router** - File-based routing in `src/pages/`
- **Notion Integration** - Blog content fetched from Notion database via `src/lib/notesApi.ts`
- **Theme System** - Dark/light mode with `next-themes` and Tailwind CSS
- **Static Generation** - Uses SSG for performance with ISR for content updates

### Core Architecture:
- `src/pages/_app.tsx` - App wrapper with theme provider and layout
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
- Tailwind CSS with custom configuration
- Typography plugin for blog content
- Custom color scheme with primary color `#FB2576`
- Responsive design with dark mode support

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
- Geist font family (sans and mono variants)
- Pages use getStaticProps/getStaticPaths for SSG where applicable