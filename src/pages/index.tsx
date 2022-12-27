import { compareDesc } from 'date-fns';
import { GetStaticProps } from 'next';
import { NextSeo } from 'next-seo';

import { Blog, allBlogs } from '../../.contentlayer/generated';
import { BlogPostPreview } from '../components/BlogPostPreview';
import { Container } from '../components/Container';
import { ExternalLink } from '../components/ExternalLink';
import { GitHubIcon } from '../components/Icons/GitHubIcon';
import { InstagramIcon } from '../components/Icons/InstagramIcon';
import { TwitterIcon } from '../components/Icons/TwitterIcon';
import { Newsletter } from '../components/Newsletter';
import { PageTitle } from '../components/PageTitle';
import { Photos } from '../components/Photos';
import { Resume } from '../components/Resume';
import { SocialLink } from '../components/SocialLink';
import { SocialMedia } from '../data/lifeApi';

const seoTitle = 'Bartosz Jarocki';
const seoDescription =
  'A passionate software engineer with an eye for details based in Wrocław, Poland.';

type Props = {
  latestPosts: Blog[];
};

export default function Home({ latestPosts }: Props) {
  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`}
        openGraph={{
          images: [{ url: `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/og?title=${seoTitle}` }],
        }}
      />
      <Container className="mt-9">
        <div className="max-w-2xl">
          <PageTitle>Bartosz Jarocki</PageTitle>
          <p className="mt-6 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
            I&apos;m a passionate software engineer with an eye for details based in Wrocław,
            Poland. If out want to reach out,{' '}
            <ExternalLink href="mailto:bartosz.jarocki@hey.com">write me an email.</ExternalLink>
          </p>
          <div className="mt-6 flex gap-6">
            {SocialMedia.map((socialProfile) => (
              <SocialLink
                key={socialProfile.name}
                href={socialProfile.link}
                aria-label={`Follow on ${socialProfile.name}`}
                icon={socialProfile.icon}
              />
            ))}
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
