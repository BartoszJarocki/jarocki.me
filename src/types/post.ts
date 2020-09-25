import { Author } from './author';

export type Post = {
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
};
