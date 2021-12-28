import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NextSeo } from 'next-seo';

import { Projects } from '../_data/projects';
import { Travel } from '../_data/travel';
import { SiteDescription, SiteTitle } from '../_data/about';

import { Badge } from '../components/badge';
import { Section } from '../components/section';
import { Layout } from '../components/layout';
import { Container } from '../components/container';
import { LinkOutlinedCard, OutlinedCard } from '../components/outlined-card';
import { OutlinedCardTitle } from '../components/outlined-card-title';
import { OutlinedCardDescription } from '../components/outlined-card-description';
import { PhotoCard } from '../components/photo-card';
import { ExternalLink } from '../components/external-link';
import { Navigation } from '../components/navigation';
import { Post } from '../lib/blog/blog-api';
import { blogApi } from '../lib/blog/fs-blog-api';

import Avatar from '../../public/assets/blog/authors/bartosz.jpeg';
import { ExternalLinkIcon } from '@heroicons/react/outline';

type Props = {
  latestPosts: Post[];
};

const Index = ({ latestPosts }: Props) => {
  return (
    <Layout>
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
      <Navigation />
      <Container>
        <header>
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-x-12">
            <div>
              <h1 className="mt-1 text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                Bartosz Jarocki
              </h1>
              <h2 className="mt-1 text-lg font-medium tracking-tight leading-tight text-gray-500">
                Full Stack Developer at{' '}
                <ExternalLink href="https://parabol.co">Parabol</ExternalLink>
              </h2>
              <p className="mt-4 prose">
                I'm a passionate software developer with an eye for details. <br />
                You can read more about me{' '}
                <Link href={'/about'} passHref={true}>
                  <a className="underline cursor-pointer">here.</a>
                </Link>{' '}
                If out want to reach out,{' '}
                <ExternalLink href="mailto:bartosz.jarocki@hey.com">
                  write me an email.
                </ExternalLink>{' '}
              </p>
            </div>
            <div className="flex-shrink-0 overflow-hidden">
              <Image src={Avatar} width="100" height="100" alt="avatar" className="rounded-full" />
            </div>
          </div>
        </header>
        <Section title={'Blog'} hasMore link={'/blog'}>
          <div className="space-y-4">
            {latestPosts.map((post) => {
              return (
                <LinkOutlinedCard key={post.title} href={`/blog/${post.slug}`}>
                  <OutlinedCardTitle>{post.title}</OutlinedCardTitle>
                  <OutlinedCardDescription>{post.description}</OutlinedCardDescription>
                </LinkOutlinedCard>
              );
            })}
          </div>
        </Section>
        <div className="mt-4 border border-gray-400 rounded overflow-hidden">
          <iframe
            src="https://jarocki.substack.com/embed"
            className="w-full"
            height="320"
            frameBorder="0"
            scrolling="no"
          />
        </div>
        <Section title={'Projects'}>
          <div className="space-y-4">
            {Projects.map((project) => {
              return (
                <ExternalLink
                  className={null}
                  key={project.title}
                  href={project.link}
                  data-testid={project.title}
                >
                  <OutlinedCard>
                    <OutlinedCardTitle>
                      <span className="inline-flex items-center">
                        {project.title} <ExternalLinkIcon className="inline h-5 w-5 ml-1" />
                      </span>
                      <div className="hidden sm:flex space-x-2 sm:ml-auto my-2 sm:my-0 font-normal">
                        {project.techStack.map((tech) => {
                          return <Badge key={tech}>{tech}</Badge>;
                        })}
                      </div>
                    </OutlinedCardTitle>
                    <OutlinedCardDescription>{project.description}</OutlinedCardDescription>
                  </OutlinedCard>
                </ExternalLink>
              );
            })}
          </div>
        </Section>
        <Section title={'Travel'}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Travel.map((dest) => {
              return (
                <PhotoCard
                  key={dest.title}
                  img={dest.img}
                  title={dest.title}
                  subTitle={dest.placesVisited}
                />
              );
            })}
          </div>
        </Section>
      </Container>
    </Layout>
  );
};

export default Index;

export const getStaticProps = async () => {
  const latestPosts = blogApi.getLatestPosts(['title', 'slug', 'description', 'date']);

  return {
    props: { latestPosts },
  };
};
