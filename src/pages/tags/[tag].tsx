import React from 'react';

import { Layout } from '../../components/layout';
import { NextSeo } from 'next-seo';
import { BlogSiteDescription, BlogSiteTitle, BlogSiteUrl } from '../../data/about';
import { Navigation } from '../../components/navigation';
import { Container } from '../../components/container';
import { Section } from '../../components/section';
import { LinkOutlinedCard } from '../../components/outlined-card';
import { OutlinedCardTitle } from '../../components/outlined-card-title';
import { OutlinedCardDescription } from '../../components/outlined-card-description';

import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';

import { compareDesc } from 'date-fns';

export async function getStaticProps({ params: { tag } }: { params: { tag: string } }) {
  const relatedPosts = allBlogs
    .sort((a, b) => {
      return compareDesc(new Date(a.date), new Date(b.date));
    })
    .filter((post) => post.tags.includes(tag));
  const tags = Array.from(new Set(relatedPosts.map((post) => post.tags).flat()));
  return { props: { relatedPosts, tags } };
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
          <Section.Title>#{tag}</Section.Title>
          <Section.Content>
            {relatedPosts.map((post) => {
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

export default Tag;
