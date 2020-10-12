import matter from 'gray-matter';

export interface Author {
  name: string;
  picture: string;
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  coverImage: string;
  author: Author;
  excerpt: string;
  ogImage: {
    url: string;
  };
  content: string;
}

export interface BlogPost {
  [key: string]: string | Array<string>;
}

export interface BlogApi {
  getRawPostBySlug: (slug: string) => matter.GrayMatterFile<string>;
  getAllSlugs: () => Array<string>;
  getPostBySlug: (slug: string, fields: string[]) => BlogPost;
  getAllPosts: (fields: string[]) => Array<BlogPost>;
  getPostsByTag: (tag: string, fields: string[]) => Array<BlogPost>;
  getAllTags: () => Array<string>;
}
