import React from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';

import { getAllPosts } from '../lib/blogApi';

import { Projects } from '../_data/projects';
import { Travel } from '../_data/travel';
import { SiteDescription, SiteTitle } from '../_data/about';

import { Post } from '../types/post';

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
import { Title } from '../components/title';

type Props = {
  allPosts: Post[];
};

const Index = ({ allPosts }: Props) => {
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
          <Title>Hey, I’m Bartosz Jarocki</Title>
          <p className="text-base text-gray-700 mt-2">
            For over decade I work as a software developer. These days I mostly work with full stack
            JavaScript applications. I especially enjoy working with React and creating great user
            experiences. This is my personal piece of the internet. If you have any questions or
            just want to say hi -{' '}
            <ExternalLink href="https://twitter.com/messages/compose?recipient_id=512460212">
              DM me on Twitter
            </ExternalLink>{' '}
            or just <ExternalLink href="mailto:bartosz.jarocki@icloud.com">email me.</ExternalLink>{' '}
            If you're curious, you can read more about me{' '}
            <Link href={'/about'} passHref={true}>
              <a className="underline cursor-pointer">here.</a>
            </Link>
          </p>
        </header>
        <Section title={'Blog'} hasMore link={'/blog'}>
          {allPosts.map((post) => {
            return (
              <LinkOutlinedCard key={post.title} href={`/blog/${post.slug}`}>
                <OutlinedCardTitle>{post.title}</OutlinedCardTitle>
                <OutlinedCardDescription>{post.description}</OutlinedCardDescription>
              </LinkOutlinedCard>
            );
          })}
        </Section>
        <Section title={'Projects'}>
          {Projects.map((project) => {
            return (
              <ExternalLink className={null} key={project.title} href={project.link}>
                <OutlinedCard>
                  <OutlinedCardTitle>
                    {project.title}
                    <div className="flex space-x-2 sm:ml-auto">
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
        </Section>
        <Section title={'Travel'}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Travel.map((dest) => {
              return (
                <PhotoCard
                  key={dest.title}
                  imgSrc={`/assets/travel/${dest.imgKey}.jpeg`}
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
  const allPosts = getAllPosts(['title', 'slug', 'description', 'date']);

  return {
    props: { allPosts },
  };
};
