# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start Next.js development server
- `pnpm build` - Build the application for production, then check that the font subsets hold every character the site uses
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code and CSS with Prettier. Markdown and MDX stay as written
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run the `*.test.ts` files under `src/lib` with `node --test`. The script passes a quoted glob that Node expands, because Node 22 and 24 reject a folder there. Node 22.18 or a later 22 release, or Node 23.6 or later, strips the types, so a test imports a module by its `.ts` path
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
- `src/components/EmbeddingsBackdrop.tsx` - The backdrop over the top 460px of every page. It paints above the page text with a blend, so the text keeps subpixel antialiasing. `_app.tsx` mounts it once, so it keeps running across client-side navigation. Its mask starts to fade at `--unfaded` on `.backdrop` in `src/styles/index.css`, the only place that stop is written. Faint and body text it can reach sits on a plate that rises above it (see `DESIGN.md`)
- `src/components/JsonLd.tsx` - Writes a JSON-LD script into the head. Use it instead of next-seo's JSON-LD components, which escape `&` as `&amp;` and break URLs
- `src/components/Index.tsx` - The index row components every page is built from (see `DESIGN.md`)
- `src/lib/notes.ts` - The only module that reads `src/notes/`. It checks each note's frontmatter and compiles its body with next-mdx-remote, fills runnable code blocks from snippet files, and highlights code at build time
- `src/lib/ml/value.ts` - `Value`, the small autograd class the part 1 demos run on. The notes teach the same calculations with short plain JavaScript functions
- `src/components/NoteContent.tsx` - Renders a compiled note, with `next/image` for images
- `src/components/` - Reusable React components
- `src/data/` - Static data and content
- `src/images/` - Static images organized by category

### Notes:
- Each note is one `.mdx` file in `src/notes/`. The file name is the slug
- The frontmatter needs `title`, `description`, `publishedAt` as a `YYYY-MM-DD` date, and `tags` as a list of strings. A missing or empty field fails the build
- `draft: true` in the frontmatter keeps a note out of production. When `VERCEL_ENV` is `production`, `getNotes` drops it. So the notes list, the home page, the RSS feed, and the sitemap leave it out, and its page is a 404. Local builds and preview deployments show it, and its page sets `noindex`. `draft` is optional, and any value that YAML does not read as true or false fails the build. The RSS route and the home page call `getNotes` at run time. To check production locally, set `VERCEL_ENV=production` for both `pnpm build` and `pnpm start`
- Any other frontmatter field fails the build with an error that names it, so a misspelled `draft` can't publish a draft. The optional `series: ai` and `part` fields belong together, with a whole part number from 1 to 4. `seriesParts` returns all four titles in order and links only published notes. Duplicate part numbers fail with both file names. To add a field, add it to `fields` in `src/lib/notes.ts`
- A note's images live in `public/images/notes/<slug>/`, and the note references them as `![alt](/images/notes/<slug>/1.jpg)`
- The build reads each image's width and height from the file, so a missing image fails the build
- Runnable snippets live in `src/notes/snippets/<note-slug>/<name>.js`. Each is a self-contained plain JavaScript script with inline data and printed output, at most 45 lines, with no classes, `this`, imports, exports, or type annotations. Write an empty fence as ```` ```js run=src/notes/snippets/how-a-machine-learns/value.js ````. The build fills it from the file and passes its raw source to `CodeBlock`, registered as `pre` in `NoteContent`. Missing files, invalid paths or metadata, a nonempty runnable fence, and empty code blocks fail the build
- `src/lib/snippets.test.ts` checks every snippet's exact output and agreement with the demo code to within 1e-9. It loads the unchanged script through `new Function` and appends a return to call its functions. Every snippet must be used by a note and covered by the tests
- `CodeBlock` keeps highlighting in the rendered page and lets readers run, edit, and reset each snippet. Editing uses a plain textarea. Each run starts a fresh Blob Web Worker, captures console output and errors, and ends after five seconds or 200 output lines. Output is announced politely. `src/lib/snippetRunner.ts` holds the worker prelude and lifecycle, tested with real Node workers
- Every error that `getNoteContent` throws while it compiles a note's body reads `src/notes/<file>: <problem>`, and a line number in it counts from the top of the file. The plugins in `getNoteContent` fail through `fail`, because next-mdx-remote rewraps anything a plugin throws. Any other error from the MDX compiler, such as a syntax error, gets the same prefix. An error thrown later, while the page renders, has no prefix. A demo without a label fails that way, and Next reports it as an error while prerendering the note's page

### Styling:
- `DESIGN.md` describes the design system: tokens, type roles, the index row, and contrast numbers
- Six color tokens (`bg`, `ink`, `body`, `faint`, `rule`, `wash`) defined in `src/styles/index.css` and mapped to Tailwind colors. There is no accent color
- Dark mode follows the system through `prefers-color-scheme`, so components use no `dark:` variants
- Note prose is styled by the `.prose` rules in `src/styles/index.css`. `getNoteContent` highlights code at build time with Shiki's `createCssVariablesTheme`. CSS maps keywords and names to `ink`, other code to `body`, and comments and punctuation to `faint`. No highlighter ships to the browser. Ordinary fences have highlighting without controls; runnable fences use the existing `demo-button` style

## Environment Variables Required

- `NEXT_PUBLIC_URL` - Base URL for canonical links and OG images
- `GITHUB_TOKEN` - Optional. Classic personal access token with `repo` scope. Adds the merged PR and lines added stat buttons to the home page's GitHub skyline. Without it the skyline shows contributions only

## Key Features

- **Notes** - MDX files in `src/notes/`, each with tags shown on the note and in the notes list
- **Backdrop** - `src/lib/embeddingsScene.ts` draws a toy embedding space with three.js over the top of every page, blended above the page text, from the table in `src/lib/embeddingSpace.ts`. Faint and body text it can reach sits on a raised `.plate` (see `DESIGN.md`)
- **Share Images** - `src/pages/api/og.tsx` draws each page's Open Graph image with `next/og` on Node, in the light tokens and Geist (see `DESIGN.md`)
- **SEO Optimization** - NextSEO integration with sitemap generation
- **Analytics** - Vercel Analytics integration
- **Image Optimization** - Next.js Image component. Note images get their size at build time

## Code Conventions

- TypeScript throughout with strict configuration
- Component files use PascalCase (e.g., `Avatar.tsx`)
- Utility functions in `src/lib/`
- Code under `src/lib/` that a test imports uses only TypeScript that Node can strip (`erasableSyntaxOnly`) and imports its own files with the `.ts` extension, so `pnpm test` runs it as is. Teaching snippets are plain JavaScript and run in the page
- Tailwind classes for styling, no CSS modules
- Geist fonts: `font-mono` (Geist Mono) for chrome, `font-sans` (Geist) for note prose and titles, `font-pixel` (Geist Pixel Square) for the name and clock. Each face loads with `localFont` from a subset in `src/fonts`, never from `geist/font` (see `DESIGN.md`). Geist loads only on note pages, from `src/pages/notes/[slug].tsx`. Elsewhere `font-sans` is the system sans font
- Pages use getStaticProps/getStaticPaths for SSG where applicable