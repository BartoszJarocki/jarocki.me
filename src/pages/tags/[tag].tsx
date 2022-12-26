import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';
import { compareDesc } from 'date-fns';
import { NextSeo } from 'next-seo';
import React from 'react';

import { BlogPostPreview } from '../../components/BlogPostPreview';
import { PageLayout } from '../../components/SimpleLayout';
import { BlogSiteDescription, BlogSiteTitle, BlogSiteUrl } from '../../data/about';

export async function getStaticProps({ params: { tag } }: { params: { tag: string } }) {
  const relatedPosts = allBlogs
    .sort((a, b) => {
      return compareDesc(new Date(a.date), new Date(b.date));
    })
    .filter((post) => post.tags.includes(tag));
  const tags = Array.from(new Set(relatedPosts.map((post) => post.tags).flat()));
  return { props: { relatedPosts, tags, tag } };
}

export async function getStaticPaths() {
  const tags = Array.from(new Set(allBlogs.map((post) => post.tags).flat()));
  return {
    paths: tags.map((tag) => {
      return {
        params: {
          tag,
        },
      };
    }),
    fallback: false,
  };
}

interface Props {
  tag: string;
  relatedPosts: Blog[];
}

const Tag = ({ tag, relatedPosts }: Props) => {
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
      <PageLayout title="Tags" intro={`All the articles from #${tag}`}>
        <div className="mt-24 md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
          <div className="flex max-w-3xl flex-col space-y-16">
            {relatedPosts.map((blogPost) => (
              <BlogPostPreview key={blogPost.slug} blogPost={blogPost} />
            ))}
          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Tag;
