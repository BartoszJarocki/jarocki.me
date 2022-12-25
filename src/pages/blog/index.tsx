import React from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';

import { BlogSiteDescription, BlogSiteTitle, BlogSiteUrl } from '../../data/about';
import { Badge } from '../../components/Navigation/Badge';

import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';
import { PageLayout } from '../../components/SimpleLayout';
import { compareDesc } from 'date-fns';
import { BlogPostPreview } from '../../components/BlogPostPreview';

export async function getStaticProps() {
  const posts = allBlogs.sort((a, b) => {
    return compareDesc(new Date(a.date), new Date(b.date));
  });
  const tags = Array.from(new Set(posts.map((post) => post.tags).flat()));
  return { props: { posts, tags } };
}

interface Props {
  posts: Blog[];
  tags: Array<string>;
}

const Blog = ({ posts, tags }: Props) => {
  return (
    <>
      <NextSeo
        title={BlogSiteTitle}
        description={BlogSiteDescription}
        canonical={BlogSiteUrl}
        openGraph={{
          url: BlogSiteUrl,
          title: BlogSiteTitle,
          description: BlogSiteDescription,
          images: [{ url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${BlogSiteTitle}` }],
          site_name: BlogSiteTitle,
        }}
      />
      <PageLayout
        title="Writing on software, building products, and other stuff."
        intro="All of my long-form thoughts on programming, building products, leadership, and more, collected in chronological order."
      >
        <h3 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">Tags</h3>
        <div className="mt-4 flex max-w-xl flex-wrap gap-1 font-mono">
          {tags.map((tag) => (
            <Link href={`/tags/${tag}`} key={tag}>
              <Badge className="cursor-pointer">#{tag}</Badge>
            </Link>
          ))}
        </div>

        <div className="mt-24 md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
          <div className="flex max-w-3xl flex-col space-y-16">
            {posts.map((blogPost) => (
              <BlogPostPreview key={blogPost.slug} blogPost={blogPost} />
            ))}
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Blog;
