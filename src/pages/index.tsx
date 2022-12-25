import { GetStaticProps } from 'next';

import { Container } from '../components/Container';
import { GitHubIcon } from '../components/Icons/GitHubIcon';
import { InstagramIcon } from '../components/Icons/InstagramIcon';
import { TwitterIcon } from '../components/Icons/TwitterIcon';

import { compareDesc } from 'date-fns';
import { allBlogs, Blog } from '../../.contentlayer/generated';
import { PageTitle } from '../components/PageTitle';
import { NextSeo } from 'next-seo';
import { SiteTitle, SiteDescription } from '../data/about';
import { Photos } from '../components/Photos';
import { Resume } from '../components/Resume';
import { Newsletter } from '../components/Newsletter';
import { SocialLink } from '../components/SocialLink';
import { BlogPostPreview } from '../components/BlogPostPreview';

type Props = {
  latestPosts: Blog[];
};

export default function Home({ latestPosts }: Props) {
  return (
    <>
      <NextSeo
        title={SiteTitle}
        description={SiteDescription}
        canonical={process.env.NEXT_PUBLIC_SITE_URL}
        openGraph={{
          url: process.env.NEXT_PUBLIC_SITE_URL,
          title: SiteTitle,
          description: SiteDescription,
          images: [{ url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${SiteTitle}` }],
          site_name: SiteTitle,
        }}
      />
      <Container className="mt-9">
        <div className="max-w-2xl">
          <PageTitle>Bartosz Jarocki</PageTitle>
          <p className="mt-6 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
            I&apos;m a passionate software engineer with an eye for details based in Wrocław,
            Poland. If out want to reach out,{' '}
            <a href="mailto:bartosz.jarocki@hey.com">write me an email.</a>
          </p>
          <div className="mt-6 flex gap-6">
            <SocialLink
              href="https://twitter.com"
              aria-label="Follow on Twitter"
              icon={TwitterIcon}
            />
            <SocialLink
              href="https://instagram.com"
              aria-label="Follow on Instagram"
              icon={InstagramIcon}
            />
            <SocialLink href="https://github.com" aria-label="Follow on GitHub" icon={GitHubIcon} />
          </div>
        </div>
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16">
            {latestPosts.map((blogPost) => (
              <BlogPostPreview key={blogPost.slug} blogPost={blogPost} dense />
            ))}
          </div>
          <div className="space-y-10 lg:pl-16 xl:pl-24">
            {false && <Newsletter />}
            <Resume />
          </div>
        </div>
      </Container>
    </>
  );
}

const NEWEST_POSTS_TO_DISPLAY = 5;

export const getStaticProps: GetStaticProps<Props> = async () => {
  const latestPosts = allBlogs
    .sort((a, b) => {
      return compareDesc(new Date(a.date), new Date(b.date));
    })
    .slice(0, NEWEST_POSTS_TO_DISPLAY);

  return {
    props: { latestPosts },
  };
};
