import React from 'react';

import { Section } from '../../components/section';
import { Container } from '../../components/container';
import { Layout } from '../../components/layout';
import { NextSeo } from 'next-seo';
import { BlogSiteDescription, BlogSiteTitle, BlogSiteUrl } from '../../_data/about';
import { LinkOutlinedCard } from '../../components/outlined-card';
import { OutlinedCardTitle } from '../../components/outlined-card-title';
import { OutlinedCardDescription } from '../../components/outlined-card-description';
import { Navigation } from '../../components/navigation';
import { blogApi } from '../../lib/blog/fs-blog-api';
import { Post } from '../../lib/blog/blog-api';
import { Badge } from '../../components/badge';
import { useRouter } from 'next/router';

type Props = {
  posts: Post[];
  tags: Array<string>;
};

const Blog = ({ posts, tags }: Props) => {
  const router = useRouter();

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
        <Section title={'Tags'}>
          <div className="flex font-mono text-sm text-gray-800 flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge
                key={tag}
                className="cursor-pointer"
                onClick={() => {
                  router.push(`/tags/${tag}`);
                }}
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </Section>
        <Section title={'All posts'}>
          <div className="space-y-4">
            {posts.map((post) => {
              return (
                <LinkOutlinedCard key={post.title} href={`/blog/${post.slug}`}>
                  <OutlinedCardTitle>{post.title}</OutlinedCardTitle>
                  <OutlinedCardDescription>{post.description}</OutlinedCardDescription>
                </LinkOutlinedCard>
              );
            })}
          </div>
        </Section>
      </Container>
    </Layout>
  );
};

export default Blog;

export const getStaticProps = async () => {
  return {
    props: {
      posts: blogApi.getAllPosts(['title', 'date', 'slug', 'author', 'description']),
      tags: blogApi.getAllTags(),
    },
  };
};
