import fs from 'fs';
import { join } from 'path';
import matter, { GrayMatterFile } from 'gray-matter';

import { BlogApi, BlogPost } from './blog-api';

const postsDirectory = join(process.cwd(), 'src/_posts');

function getRawPostBySlug(slug: string): matter.GrayMatterFile<string> {
  const fullPath = join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  return matter(fileContents);
}

function getAllSlugs(): Array<string> {
  return fs.readdirSync(postsDirectory);
}

function getPostBySlug(slug: string, fields: string[] = []): BlogPost {
  const realSlug = slug.replace(/\.mdx$/, '');
  const { data, content } = getRawPostBySlug(realSlug);

  const items: BlogPost = {};

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = realSlug;
    }
    if (field === 'content') {
      items[field] = content;
    }

    if (data[field]) {
      items[field] = data[field];
    }
  });

  return items;
}

function getAllPosts(fields: string[] = []): Array<BlogPost> {
  return (
    getAllSlugs()
      .map((slug) => getPostBySlug(slug, fields))
      // sort posts by date in descending order
      .sort((post1, post2) => (post1.date > post2.date ? -1 : 1))
  );
}

function getPostsByTag(tag: string, fields: string[] = []): Array<BlogPost> {
  return getAllPosts(fields).filter((post) => {
    const tags = post.tags ?? [];
    return tags.includes(tag);
  });
}

function getAllTags(): Array<string> {
  const posts = getAllPosts(['tags']);

  const allTags = new Set<string>();
  posts.forEach((post) => {
    const tags = post.tags as Array<string>;
    tags.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags);
}

export const blogApi: BlogApi = {
  getRawPostBySlug,
  getAllSlugs,
  getAllPosts,
  getPostsByTag,
  getPostBySlug,
  getAllTags,
};
