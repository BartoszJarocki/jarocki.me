import React from 'react';
import Link from 'next/link';

import { Post } from '../../types/post';
import { getAllPosts } from '../../lib/blogApi';

import { Section } from '../../components/section';
import { Container } from '../../components/container';
import { Layout } from '../../components/layout';
import { NextSeo } from 'next-seo';
import { BlogSiteDescription, BlogSiteTitle, BlogSiteUrl } from '../../_data/about';
import { LinkOutlinedCard, OutlinedCard } from '../../components/outlined-card';
import { OutlinedCardTitle } from '../../components/outlined-card-title';
import { OutlinedCardDescription } from '../../components/outlined-card-description';
import { Navigation } from '../../components/navigation';

type Props = {
  allPosts: Post[];
};

const Blog = ({ allPosts }: Props) => {
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
        <Section title={'Blog'}>
          {allPosts.map((post) => {
            return (
              <LinkOutlinedCard key={post.title} href={`/blog/${post.slug}`}>
                <OutlinedCardTitle>{post.title}</OutlinedCardTitle>
                <OutlinedCardDescription>{post.description}</OutlinedCardDescription>
              </LinkOutlinedCard>
            );
          })}
        </Section>
      </Container>
    </Layout>
  );
};

export default Blog;

export const getStaticProps = async () => {
  const allPosts = getAllPosts([
    'title',
    'date',
    'slug',
    'author',
    'coverImage',
    'excerpt',
    'description',
  ]);

  return {
    props: { allPosts },
  };
};
