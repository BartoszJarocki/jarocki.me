import React from 'react';
import Link from 'next/link';

import { Section } from '../../components/section';
import { Container } from '../../components/container';
import { Layout } from '../../components/layout';
import { NextSeo } from 'next-seo';
import { BlogSiteDescription, BlogSiteTitle, BlogSiteUrl } from '../../data/about';
import { LinkOutlinedCard } from '../../components/outlined-card';
import { OutlinedCardTitle } from '../../components/outlined-card-title';
import { OutlinedCardDescription } from '../../components/outlined-card-description';
import { Navigation } from '../../components/navigation';
import { Badge } from '../../components/badge';

import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';

import { compareDesc } from 'date-fns';

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
    <Layout>
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
      <Navigation />
      <Container>
        <Section>
          <Section.Title>Tags</Section.Title>
          <Section.Content>
            <div className="flex font-mono flex-wrap gap-1">
              {tags.map((tag) => (
                <Link href={`/tags/${tag}`} key={tag}>
                  <Badge className="cursor-pointer">#{tag}</Badge>
                </Link>
              ))}
            </div>
          </Section.Content>
        </Section>
        <Section>
          <Section.Title>All posts</Section.Title>
          <Section.Content>
            {posts.map((post) => {
              return (
                <LinkOutlinedCard key={post.title} href={`/blog/${post.slug}`}>
                  <OutlinedCardTitle>{post.title}</OutlinedCardTitle>
                  <OutlinedCardDescription>{post.description}</OutlinedCardDescription>
                </LinkOutlinedCard>
              );
            })}
          </Section.Content>
        </Section>
      </Container>
    </Layout>
  );
};

export default Blog;
