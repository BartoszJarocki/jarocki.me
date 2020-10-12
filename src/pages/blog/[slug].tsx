import React from 'react';
import readingTime from 'reading-time';
import mdxPrism from 'mdx-prism';
import renderToString from 'next-mdx-remote/render-to-string';
import externalLinks from 'remark-external-links';
import hydrate from 'next-mdx-remote/hydrate';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';

import { Layout } from '../../components/layout';
import { Container } from '../../components/container';
import { PostHeader } from '../../components/post-header';
import { PostBody } from '../../components/post-body';
import { ArticleJsonLd, NextSeo } from 'next-seo';
import { BlogSiteUrl } from '../../_data/about';
import { ExternalLink } from '../../components/external-link';
import { OpenGraph } from '../../_data/social-media';
import { Navigation } from '../../components/navigation';
import { Author } from '../../lib/blog/blog-api';
import { blogApi } from '../../lib/blog/fs-blog-api';

type Props = {
  readingTime: {
    text: string;
  };
  frontMatter: {
    title: string;
    date: string;
    author: Author;
    description: string;
  };
  slug: string;
  source: any;
  tags: Array<string>;
};

const Post = ({ source, frontMatter, readingTime, slug, tags }: Props) => {
  const content = hydrate(source);

  return (
    <Layout>
      <NextSeo
        title={frontMatter.title}
        description={frontMatter.description}
        canonical={`${BlogSiteUrl}/${slug}`}
        openGraph={{
          url: `${BlogSiteUrl}/${slug}`,
          title: frontMatter.title,
          description: frontMatter.description,
          images: [
            { url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${frontMatter.title}` },
          ],
          site_name: frontMatter.title,
        }}
      />
      <ArticleJsonLd
        url={`${BlogSiteUrl}/${slug}`}
        title={frontMatter.title}
        images={[`${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${frontMatter.title}`]}
        datePublished={frontMatter.date}
        authorName={frontMatter.author.name}
        publisherName={frontMatter.author.name}
        publisherLogo={frontMatter.author.picture}
        description={frontMatter.description}
      />
      <Navigation />
      <PostHeader
        title={frontMatter.title}
        date={frontMatter.date}
        author={frontMatter.author}
        readingTime={readingTime.text}
        tags={tags}
      />
      <Container>
        <article className="mb-32">
          <PostBody>{content}</PostBody>
          <ExternalLink
            className="block text-xl md:text-3xl font-semibold text-center"
            href={`https://twitter.com/intent/tweet?text=${frontMatter.title} by ${OpenGraph.twitter.handle}`}
          >
            <div className="flex flex-col place-items-center m-5 sm:m-20 text-gray-700 hover:text-gray-600 cursor-pointer">
              <svg className="h-10 w-10 m-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              Click here to share this article with your friends on Twitter if you liked it.
            </div>
          </ExternalLink>
        </article>
      </Container>
    </Layout>
  );
};

export default Post;

type Params = {
  params: {
    slug: string;
  };
};

export async function getStaticProps({ params }: Params) {
  const { content, data } = blogApi.getRawPostBySlug(params.slug);

  const mdxSource = await renderToString(content, {
    mdxOptions: {
      remarkPlugins: [externalLinks],
      rehypePlugins: [mdxPrism],
    },
    scope: data,
  });
  const tags = data.tags ?? [];

  return {
    props: {
      slug: params.slug,
      readingTime: readingTime(content),
      source: mdxSource,
      frontMatter: data,
      tags,
    },
  };
}

export async function getStaticPaths() {
  const posts = blogApi.getAllPosts(['slug']);

  return {
    paths: posts.map((posts) => {
      return {
        params: {
          slug: posts.slug,
        },
      };
    }),
    fallback: false,
  };
}
