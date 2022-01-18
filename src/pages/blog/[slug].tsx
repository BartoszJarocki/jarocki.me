import React from 'react';
import readingTime from 'reading-time';
import mdxPrism from 'mdx-prism';
import renderToString from 'next-mdx-remote/render-to-string';
import externalLinks from 'remark-external-links';
import hydrate from 'next-mdx-remote/hydrate';

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
import { TwitterIcon } from '../../components/icons';

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
        <div className="mb-32">
          <PostBody>{content}</PostBody>
          <ExternalLink
            className="group block text-xl md:text-3xl font-semibold text-center"
            href={`https://twitter.com/intent/tweet?text=${frontMatter.title} by ${OpenGraph.twitter.handle}, ${BlogSiteUrl}/${slug}`}
          >
            <h4 className="flex flex-col place-items-center m-5 sm:m-20 group-hover:text-blue-400 cursor-pointer duration-200 ease-in-out">
              <TwitterIcon className="h-10 w-10 m-6 transition-transform transform group-hover:-rotate-12" />
              Click here to share this article with your friends on Twitter if you liked it.
            </h4>
          </ExternalLink>
        </div>
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
