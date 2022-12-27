import { allBlogs } from 'contentlayer/generated';
import type { Blog as BlogType } from 'contentlayer/generated';
import { compareDesc } from 'date-fns';
import { NextSeo } from 'next-seo';
import Link from 'next/link';
import React from 'react';

import { BlogPostPreview } from '../../components/BlogPostPreview';
import { Badge } from '../../components/Navigation/Badge';
import { PageLayout } from '../../components/SimpleLayout';

const seoTitle = 'Blog | Bartosz Jarocki';
const seoDescription =
  'All of my long-form thoughts on programming, building products, leadership, and more, collected in chronological order.';

interface Props {
  posts: BlogType[];
  tags: Array<string>;
}

export default function Blog({ posts, tags }: Props) {
  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={`https://${process.env.NEXT_PUBLIC_VERCEL_URL}/blog`}
        openGraph={{
          images: [{ url: `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/og?title=${seoTitle}` }],
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
}

export async function getStaticProps() {
  const posts = allBlogs.sort((a, b) => {
    return compareDesc(new Date(a.date), new Date(b.date));
  });
  const tags = Array.from(new Set(posts.map((post) => post.tags).flat()));
  return { props: { posts, tags } };
}
