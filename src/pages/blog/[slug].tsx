import React from 'react';
import { useMDXComponent } from 'next-contentlayer/hooks';
import { BlogPostLayout } from '../../components/BlogPostLayout';

import { ArticleJsonLd, NextSeo } from 'next-seo';
import { BlogSiteUrl } from '../../data/about';
import { OpenGraph } from '../../data/social-media';
import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';
import { TwitterIcon } from '../../components/Icons/TwitterIcon';
import { Prose } from '../../components/Prose';

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

const Post = ({
  post: { title, description, body, slug, author, date, readingTime, tags },
  previousPathname,
}: {
  post: Blog;
  previousPathname?: string;
}) => {
  const Component = useMDXComponent(body.code);

  return (
    <>
      <NextSeo
        title={title}
        description={description}
        canonical={`${BlogSiteUrl}/${slug}`}
        openGraph={{
          url: `${BlogSiteUrl}/${slug}`,
          title,
          description,
          images: [{ url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${title}` }],
          site_name: title,
        }}
      />
      <ArticleJsonLd
        url={`${BlogSiteUrl}/${slug}`}
        title={title}
        images={[`${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${title}`]}
        datePublished={date}
        authorName={author.name!}
        publisherName={author.name!}
        publisherLogo={author.picture!}
        description={description}
      />
      <BlogPostLayout meta={{ title, description, date }} previousPathname={previousPathname}>
        <div className="mb-32">
          <Prose>
            <Component />
          </Prose>
          <a
            className="group block text-center text-xl font-semibold md:text-3xl"
            href={`https://twitter.com/intent/tweet?text=${title} by ${OpenGraph.twitter.handle}, ${BlogSiteUrl}/${slug}`}
          >
            <h4 className="m-5 flex cursor-pointer flex-col place-items-center duration-200 ease-in-out group-hover:text-blue-400 sm:m-20">
              <TwitterIcon className="m-6 h-10 w-10 transform transition-transform group-hover:-rotate-12" />
              Click here to share this article with your friends on Twitter if you liked it.
            </h4>
          </a>
        </div>
      </BlogPostLayout>
    </>
  );
};

export default Post;
