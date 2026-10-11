import fs from 'fs';
import matter from 'gray-matter';
import { imageSize } from 'image-size';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import path from 'path';

export type Note = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
};

const notesDir = path.join(process.cwd(), 'src/notes');

export function getNotes(): Note[] {
  return fs
    .readdirSync(notesDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => parseNote(file, readNote(file).data))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getNoteContent(slug: string): Promise<MDXRemoteSerializeResult> {
  const file = `${slug}.mdx`;
  return serialize(readNote(file).content, {
    mdxOptions: { rehypePlugins: [[rehypeImageSizes, file]] },
  });
}

function readNote(file: string) {
  return matter(fs.readFileSync(path.join(notesDir, file), 'utf8'));
}

function parseNote(file: string, data: Record<string, unknown>): Note {
  const { title, description, publishedAt, tags } = data;
  const invalid = (field: string) => new Error(`src/notes/${file}: frontmatter needs ${field}`);

  if (!isText(title)) throw invalid('a title');
  if (!isText(description)) throw invalid('a description');
  // YAML parses an unquoted 2024-02-16 as a Date at UTC midnight.
  if (!(publishedAt instanceof Date)) throw invalid('publishedAt as an unquoted YYYY-MM-DD date');
  if (!Array.isArray(tags) || tags.length === 0 || !tags.every(isText)) {
    throw invalid('a non-empty list of tags');
  }

  return {
    slug: file.replace(/\.mdx$/, ''),
    title,
    description,
    publishedAt: publishedAt.toISOString().slice(0, 10),
    tags,
  };
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

// next/image needs the intrinsic size to reserve the image's space. A note that opens with an
// image paints it first, so the first image loads with priority instead of lazily.
function rehypeImageSizes(noteFile: string) {
  return (tree: HastNode) => {
    let first = true;
    const walk = ({ tagName, properties, children }: HastNode) => {
      const src = properties?.src;
      if (tagName === 'img' && properties && typeof src === 'string' && src.startsWith('/')) {
        const file = path.join(process.cwd(), 'public', src);
        if (!fs.existsSync(file)) {
          throw new Error(`src/notes/${noteFile}: ${src} is not in public/`);
        }
        const { width, height } = imageSize(fs.readFileSync(file));
        Object.assign(properties, { width, height, priority: first });
        first = false;
      }
      children?.forEach(walk);
    };
    walk(tree);
  };
}
