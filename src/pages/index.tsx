import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { format } from 'date-fns';

import { Projects } from '../data/projects';
import { Travel } from '../data/travel';
import { SiteDescription, SiteTitle } from '../data/about';

import { Badge } from '../components/badge';
import { Section } from '../components/section';
import { Layout } from '../components/layout';
import { Container } from '../components/container';
import { Item } from '../components/item';
import { PhotoCard } from '../components/photo-card';
import { ExternalLink } from '../components/external-link';
import { Navigation } from '../components/navigation';

import Avatar from '../../public/assets/blog/authors/bartosz.jpeg';
import { ArrowSmRightIcon, ExternalLinkIcon } from '@heroicons/react/outline';
import { PageTitle } from '../components/page-title';
import { Button } from '../components/button';
import { Substack } from '../components/substack';

import { compareDesc } from 'date-fns';
import { allBlogs } from 'contentlayer/generated';
import type { Blog } from 'contentlayer/generated';

const latestPostsLimit = 5;
export const getStaticProps = async () => {
  const latestPosts = allBlogs
    .sort((a, b) => {
      return compareDesc(new Date(a.date), new Date(b.date));
    })
    .slice(0, latestPostsLimit);

  return {
    props: { latestPosts },
  };
};

type Props = {
  latestPosts: Blog[];
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
        <section className="flex flex-col-reverse justify-between gap-x-12 sm:flex-row">
          <header>
            <PageTitle>Bartosz Jarocki</PageTitle>
            <h2 className="mt-1 text-lg font-semibold leading-tight tracking-tight">
              Full Stack Developer at <ExternalLink href="https://parabol.co">Parabol</ExternalLink>
            </h2>
            <p className="mt-4 text-base">
              I&apos;m a passionate software developer with an eye for details. <br />
              If out want to reach out,{' '}
              <ExternalLink href="mailto:bartosz.jarocki@hey.com">write me an email.</ExternalLink>
            </p>
          </header>
          <div className="flex-shrink-0 overflow-hidden">
            <Image src={Avatar} width="100" height="100" alt="avatar" className="rounded-full" />
          </div>
        </section>
        <Section>
          <Section.Title
            as="h2"
            action={
              <Link href="/blog">
                <Button data-testid="btn-blog-show-all">
                  <span className="inline-flex items-center justify-center px-1">
                    Show all <ArrowSmRightIcon className="ml-1 inline h-5 w-5" />
                  </span>
                </Button>
              </Link>
            }
          >
            Blog
          </Section.Title>
          <Section.Content>
            {latestPosts.map((post) => {
              return (
                <Link key={post.title} href={`/blog/${post.slug}`}>
                  <Item>
                    <Item.Title>{post.title}</Item.Title>
                    <Item.Subtitle>{post.description}</Item.Subtitle>
                    <Item.Description>
                      {format(new Date(post.date), 'MMM dd, yyyy')}
                    </Item.Description>
                  </Item>
                </Link>
              );
            })}
          </Section.Content>
        </Section>
        <Substack embedUrl="https://jarocki.substack.com/embed" />
        <Section>
          <Section.Title as="h2">Projects</Section.Title>
          <Section.Content>
            {Projects.map((project) => {
              return (
                <ExternalLink
                  className="block outline-none"
                  key={project.title}
                  href={project.link}
                  data-testid={project.title}
                >
                  <Item>
                    <Item.Title>
                      <span className="inline-flex items-center">
                        {project.title} <ExternalLinkIcon className="ml-1 inline h-5 w-5" />
                      </span>
                      <div className="my-2 hidden space-x-2 font-mono sm:my-0 sm:ml-auto sm:flex">
                        {project.techStack.map((tech) => {
                          return <Badge key={tech}>{tech}</Badge>;
                        })}
                      </div>
                    </Item.Title>
                    <Item.Subtitle>{project.description}</Item.Subtitle>
                  </Item>
                </ExternalLink>
              );
            })}
          </Section.Content>
        </Section>
        <Section>
          <Section.Title as="h2">Visited places</Section.Title>
          <Section.Content>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
          </Section.Content>
        </Section>
      </Container>
    </Layout>
  );
};

export default Index;
