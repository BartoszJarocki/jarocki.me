import React from 'react';

import { Layout } from '../../components/layout';
import { NextSeo } from 'next-seo';
import { BlogSiteDescription, BlogSiteTitle, BlogSiteUrl } from '../../_data/about';
import { Navigation } from '../../components/navigation';
import { Container } from '../../components/container';
import { Section } from '../../components/section';
import { LinkOutlinedCard } from '../../components/outlined-card';
import { OutlinedCardTitle } from '../../components/outlined-card-title';
import { OutlinedCardDescription } from '../../components/outlined-card-description';
import { blogApi } from '../../lib/blog/fs-blog-api';
import { Post } from '../../lib/blog/blog-api';

type Props = {
  tag: string;
  relatedPosts: Post[];
};

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
        <Section title={`#${tag}`}>
          {relatedPosts.map((post) => {
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

export default Tag;

type Params = {
  params: {
    tag: string;
  };
};

export async function getStaticProps({ params: { tag } }: Params) {
  return {
    props: {
      tag,
      relatedPosts: blogApi.getPostsByTag(tag, [
        'title',
        'date',
        'slug',
        'author',
        'coverImage',
        'excerpt',
        'description',
        'tags',
      ]),
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: blogApi.getAllTags().map((tag) => {
      return {
        params: {
          tag,
        },
      };
    }),
    fallback: false,
  };
}
