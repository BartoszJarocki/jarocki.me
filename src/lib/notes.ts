import fs from 'fs';
import matter from 'gray-matter';
import { imageSize } from 'image-size';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
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
  // Imported here so the home page and the RSS route, which only list notes, never load the compiler.
  const { serialize } = await import('next-mdx-remote/serialize');
  return serialize(readNote(file).content, {
    mdxOptions: { rehypePlugins: [[rehypeNoteImages, file]] },
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
      if (node.tagName === 'img' && properties && typeof src === 'string' && src.startsWith('/')) {
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
