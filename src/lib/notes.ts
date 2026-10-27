import fs from 'fs';
import { imageSize } from 'image-size';
import yaml from 'js-yaml';
import type { Nodes, Root } from 'mdast';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import path from 'path';
import type { BundledLanguage } from 'shiki';

import type { CodeToken } from './codeTokens.ts';

const series = {
  ai: [
    'How a machine learns',
    'Words as numbers',
    'Paying attention',
    'A tiny GPT, trained in your browser',
  ],
};

type SeriesName = keyof typeof series;
type SeriesMembership = { series: SeriesName; part: number } | { series?: never; part?: never };
export type SeriesPart = { part: number; title: string; slug: string | null };

export type Note = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  draft: boolean;
} & SeriesMembership;

const notesDir = path.join(process.cwd(), 'src/notes');
const fields = ['title', 'description', 'publishedAt', 'tags', 'draft', 'series', 'part'];

export function getNotes(): Note[] {
  const production = process.env.VERCEL_ENV === 'production';
  const notes = fs
    .readdirSync(notesDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => parseNote(file, readNote(file).data));
  const occupied = new Map<string, string>();
  for (const note of notes) {
    if (!note.series) continue;
    const key = `${note.series}/${note.part}`;
    const previous = occupied.get(key);
    if (previous) {
      throw new Error(
        `src/notes/${previous}.mdx and src/notes/${note.slug}.mdx: duplicate ${note.series} part ${note.part}`,
      );
    }
    occupied.set(key, note.slug);
  }
  return notes
    .filter((note) => !(production && note.draft))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || (a.part ?? 0) - (b.part ?? 0));
}

export function seriesParts(name: SeriesName): SeriesPart[] {
  const notes = getNotes();
  return series[name].map((title, index) => ({
    title,
    part: index + 1,
    slug:
      notes.find((note) => note.series === name && note.part === index + 1 && !note.draft)?.slug ??
      null,
  }));
}

export async function getNoteContent(slug: string): Promise<MDXRemoteSerializeResult> {
  const file = `${slug}.mdx`;
  // Imported here so the home page and the RSS route, which only list notes, never load the compiler.
  const { serialize } = await import('next-mdx-remote/serialize');
  let problem: Error | undefined;
  const fail: Fail = (message) => {
    throw (problem = new Error(`src/notes/${file}: ${message}`));
  };
  try {
    return await serialize(readNote(file).content, {
      mdxOptions: {
        remarkPlugins: [[remarkSnippets, fail]],
        rehypePlugins: [[rehypeNoteImages, fail], rehypeNoteCode],
      },
    });
  } catch (error) {
    // next-mdx-remote rewraps what a plugin throws, which would bury the plugin's message.
    throw problem ?? new Error(`src/notes/${file}: ${(error as Error).message}`);
  }
}

export async function getNoteTree(slug: string): Promise<Root> {
  const file = `${slug}.mdx`;
  const [{ unified }, { default: remarkParse }, { default: remarkMdx }] = await Promise.all([
    import('unified'),
    import('remark-parse'),
    import('remark-mdx'),
  ]);
  const tree = unified().use(remarkParse).use(remarkMdx).parse(readNote(file).content);
  remarkSnippets((message) => {
    throw new Error(`src/notes/${file}: ${message}`);
  })(tree);
  return tree;
}

type Fail = (message: string) => never;

// An editor on Windows can save the file with a byte order mark and \r\n line endings.
const frontmatter = /^\uFEFF?(---[ \t]*\r?\n[\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

function readNote(file: string) {
  const source = fs.readFileSync(path.join(notesDir, file), 'utf8');
  const [block, yamlFromLineOne = ''] = frontmatter.exec(source) ?? [''];
  let data: unknown;
  try {
    // The JSON schema keeps an unquoted 2024-02-16 as the text written instead of a Date, which
    // YAML would roll over from 2024-02-30 to March or shift to UTC from a timestamp with an offset.
    data = yaml.load(yamlFromLineOne, { schema: yaml.JSON_SCHEMA }) ?? {};
  } catch (error) {
    throw new Error(`src/notes/${file}: ${(error as Error).message}`);
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`src/notes/${file}: frontmatter needs fields as key: value`);
  }
  // Blank lines in place of the frontmatter keep the line numbers in MDX's errors the file's own.
  const content = '\n'.repeat(block.split('\n').length - 1) + source.slice(block.length);
  return { data: data as Record<string, unknown>, content };
}

function parseNote(file: string, data: Record<string, unknown>): Note {
  const { title, description, publishedAt, tags, draft = false } = data;
  const invalid = (field: string) => new Error(`src/notes/${file}: frontmatter needs ${field}`);
  const unknown = Object.keys(data).find((key) => !fields.includes(key));

  if (unknown !== undefined) {
    throw new Error(`src/notes/${file}: frontmatter has an unknown field ${unknown}`);
  }
  if (!isText(title)) throw invalid('a title');
  if (!isText(description)) throw invalid('a description');
  if (!isCalendarDate(publishedAt)) throw invalid('publishedAt as a YYYY-MM-DD date');
  if (!Array.isArray(tags) || tags.length === 0 || !tags.every(isText)) {
    throw invalid('a non-empty list of tags');
  }
  if (typeof draft !== 'boolean') throw invalid('draft as true or false');

  let membership: SeriesMembership = {};
  if (data.series !== undefined || data.part !== undefined) {
    if (data.series !== 'ai') throw invalid('series as ai with a part number');
    if (
      typeof data.part !== 'number' ||
      !Number.isInteger(data.part) ||
      data.part < 1 ||
      data.part > series.ai.length
    ) {
      throw invalid('part as a whole number from 1 to 4 with series: ai');
    }
    membership = { series: data.series, part: data.part };
  }

  return {
    ...membership,
    slug: file.replace(/\.mdx$/, ''),
    title,
    description,
    publishedAt,
    tags,
    draft,
  };
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

// Markdown puts an image in a paragraph. A paragraph that holds only an image becomes a figure, so
// it takes the .prose figure spacing. next/image needs the intrinsic size to reserve the image's
// space. An image that opens the note is the largest paint, so only that one loads with priority.
function rehypeNoteImages(fail: Fail) {
  return (tree: HastNode) => {
    const opener = tree.children?.find((node) => node.type === 'element');
    const walk = (node: HastNode, inOpener: boolean) => {
      const { properties, children } = node;
      if (node.tagName === 'p' && children?.length === 1 && children[0].tagName === 'img') {
        node.tagName = 'figure';
      }
      const src = properties?.src;
      if (node.tagName === 'img' && properties && typeof src === 'string') {
        if (!src.startsWith('/')) fail(`${src} must be a file in public/images/notes/`);
        const file = path.join(process.cwd(), 'public', src);
        if (!fs.existsSync(file)) fail(`${src} is not in public/`);
        const { width, height } = imageSize(fs.readFileSync(file));
        Object.assign(properties, { width, height, priority: inOpener });
      }
      children?.forEach((child) => walk(child, inOpener || child === opener));
    };
    walk(tree, false);
  };
}

function remarkSnippets(fail: Fail) {
  return (tree: Root) => {
    const walk = (node: Nodes) => {
      if (node.type === 'code') {
        const info = [node.lang, node.meta].filter(Boolean).join(' ');
        if (/run\s*=/i.test(info)) {
          const [, file] =
            /^js run=(src\/notes\/snippets\/[\w-]+\/[\w-]+\.js)$/.exec(info) ??
            fail(`\`\`\`${info} needs js run=src/notes/snippets/<note>/<name>.js`);
          if (node.value) fail(`the ${node.meta} block must be empty, because the build fills it`);
          const source = path.join(process.cwd(), file);
          if (!fs.statSync(source, { throwIfNoEntry: false })?.isFile())
            fail(`${file} does not exist`);
          node.value = fs.readFileSync(source, 'utf8').trimEnd();
          node.data = { hProperties: { 'data-snippet': file } };
        }
        if (!node.value?.trim())
          fail(`the code block at line ${node.position?.start.line} is empty`);
      }
      if ('children' in node) node.children.forEach(walk);
    };
    walk(tree);
  };
}

// Values a reader can change in edit mode get the warm tone; keywords step back to body.
function toneOf(color: string): CodeToken[0] {
  if (/comment|punctuation/.test(color)) return 'cf';
  if (/string|constant/.test(color)) return 'cv';
  if (/keyword/.test(color)) return 'cb';
  if (/function/.test(color)) return 'cn';
  return 'ci';
}

function rehypeNoteCode() {
  return async (tree: HastNode) => {
    const { bundledLanguages, codeToTokens, createCssVariablesTheme } = await import('shiki');
    const isLanguage = (name: string): name is BundledLanguage =>
      Object.hasOwn(bundledLanguages, name);
    const theme = createCssVariablesTheme({ fontStyle: false });
    const scopes =
      theme.tokenColors?.flatMap(({ scope }) =>
        typeof scope === 'string' ? [scope] : (scope ?? []),
      ) ?? [];
    theme.tokenColors?.push(
      {
        scope: [
          'variable',
          'support.variable',
          'support.class',
          'support.constant',
          'meta.object-literal.key',
          ...scopes.filter(
            (scope) =>
              /^(variable\.|support\.(variable|class|constant)|meta\.property-name|meta\.definition\.variable)/.test(
                scope,
              ) && !scope.includes('function'),
          ),
        ],
        settings: { foreground: 'var(--shiki-token-parameter)' },
      },
      {
        scope: ['entity.name.function', 'support.function', 'variable.function'],
        settings: { foreground: 'var(--shiki-token-function)' },
      },
      {
        scope: [
          'punctuation',
          'meta.brace',
          'keyword.operator',
          ...scopes.filter((scope) => /^(punctuation\.|keyword\.operator\.)/.test(scope)),
        ],
        settings: { foreground: 'var(--shiki-token-punctuation)' },
      },
    );
    const walk = async (node: HastNode): Promise<void> => {
      const code = node.tagName === 'pre' ? node.children?.[0] : undefined;
      if (code?.tagName === 'code') {
        const source = code.children?.map((child) => child.value ?? '').join('') ?? '';
        const classes = code.properties?.className;
        const language = Array.isArray(classes)
          ? classes.find(
              (name: unknown) => typeof name === 'string' && name.startsWith('language-'),
            )
          : undefined;
        const lang = typeof language === 'string' ? language.slice(9) : 'text';
        if (lang !== 'text' && lang !== 'ansi' && !isLanguage(lang)) {
          throw new Error(`Unknown code language: ${lang}`);
        }
        const highlighted = await codeToTokens(source.trimEnd(), {
          lang,
          theme,
        });
        const tokens: CodeToken[] = [];
        function append(tone: CodeToken[0], text: string) {
          const previous = tokens.at(-1);
          if (previous?.[0] === tone) previous[1] += text;
          else tokens.push([tone, text]);
        }
        for (const [index, line] of highlighted.tokens.entries()) {
          if (index > 0) append('ci', '\n');
          for (const token of line) append(toneOf(token.color ?? ''), token.content);
        }
        const snippet = code.properties?.['data-snippet'];
        node.properties = { 'data-code': JSON.stringify(tokens) };
        if (typeof snippet === 'string') node.properties['data-snippet'] = snippet;
        node.children = [];
        return;
      }
      for (const child of node.children ?? []) await walk(child);
    };
    await walk(tree);
  };
}
