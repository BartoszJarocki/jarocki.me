import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';
import { useMDXComponent } from 'next-contentlayer/hooks';
import { ArticleJsonLd, NextSeo } from 'next-seo';
import React from 'react';

import { BlogPostLayout } from '../../components/BlogPostLayout';
import { TwitterIcon } from '../../components/Icons/TwitterIcon';

export default function Post({
  post: { title, description, body, slug, author, date, readingTime, tags },
  previousPathname,
}: {
  post: Blog;
  previousPathname?: string;
}) {
  const Component = useMDXComponent(body.code);
  const url = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/blog/${slug}`;
  const openGraphImageUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/og?title=${title}`;

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={url}
        openGraph={{
          images: [{ url: openGraphImageUrl }],
        }}
      />
      <ArticleJsonLd
        url={url}
        images={[openGraphImageUrl]}
        title={title}
        datePublished={date}
        authorName={author.name!}
        publisherName={author.name!}
        publisherLogo={author.picture!}
        description={description}
      />
      <BlogPostLayout meta={{ title, description, date }} previousPathname={previousPathname}>
        <div className="mb-32">
          <Component />
          <a
            className="group block text-center text-xl font-semibold md:text-3xl no-underline"
            href={url}
          >
            <h4 className="m-5 flex cursor-pointer flex-col place-items-center duration-200 ease-in-out group-hover:text-blue-400 group-hover:fill-blue-400 fill-white sm:m-20">
              <TwitterIcon className="m-6 h-10 w-10 transform transition-transform group-hover:-rotate-12" />
              Click here to share this article with your friends on Twitter if you liked it.
            </h4>
          </a>
        </div>
      </BlogPostLayout>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: allBlogs.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = allBlogs.find((post) => post.slug === params.slug)!;

  return { props: { post } };
}
