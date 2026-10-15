import fs from 'fs';
import { imageSize } from 'image-size';
import yaml from 'js-yaml';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import path from 'path';

export type Note = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  draft: boolean;
};

const notesDir = path.join(process.cwd(), 'src/notes');
const fields = ['title', 'description', 'publishedAt', 'tags', 'draft'];

export function getNotes(): Note[] {
  const production = process.env.VERCEL_ENV === 'production';
  return fs
    .readdirSync(notesDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => parseNote(file, readNote(file).data))
    .filter((note) => !(production && note.draft))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getNoteContent(slug: string): Promise<MDXRemoteSerializeResult> {
  const file = `${slug}.mdx`;
  // Imported here so the home page and the RSS route, which only list notes, never load the compiler.
  const { serialize } = await import('next-mdx-remote/serialize');
  return serialize(readNote(file).content, {
    mdxOptions: { rehypePlugins: [[rehypeNoteImages, file]] },
  });
}

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
  return { data: data as Record<string, unknown>, content: source.slice(block.length) };
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

  return {
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
};

// Markdown puts an image in a paragraph. A paragraph that holds only an image becomes a figure, so
// it takes the .prose figure spacing. next/image needs the intrinsic size to reserve the image's
// space. An image that opens the note is the largest paint, so only that one loads with priority.
function rehypeNoteImages(noteFile: string) {
  return (tree: HastNode) => {
    const opener = tree.children?.find((node) => node.type === 'element');
    const walk = (node: HastNode, inOpener: boolean) => {
      const { properties, children } = node;
      if (node.tagName === 'p' && children?.length === 1 && children[0].tagName === 'img') {
        node.tagName = 'figure';
      }
      const src = properties?.src;
      if (node.tagName === 'img' && properties && typeof src === 'string') {
        if (!src.startsWith('/')) {
          throw new Error(`src/notes/${noteFile}: ${src} must be a file in public/images/notes/`);
        }
        const file = path.join(process.cwd(), 'public', src);
        if (!fs.existsSync(file)) {
          throw new Error(`src/notes/${noteFile}: ${src} is not in public/`);
        }
        const { width, height } = imageSize(fs.readFileSync(file));
        Object.assign(properties, { width, height, priority: inOpener });
      }
      children?.forEach((child) => walk(child, inOpener || child === opener));
    };
    walk(tree, false);
  };
}
