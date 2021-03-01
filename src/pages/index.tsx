import React from 'react';
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
import { Title } from '../components/title';
import { Post } from '../lib/blog/blog-api';
import { blogApi } from '../lib/blog/fs-blog-api';

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
          <p className="prose lg:prose-lg">
            For over a decade, I've worked as a software developer. Currently, I'm most skilled in
            full stack Javascript/Typescript development and especially enjoy working with React.
            This is my personal slice of internet, so please enjoy exploring. If you have any
            questions or just want to say hello -{' '}
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
                    <div className="flex space-x-2 sm:ml-auto my-2 sm:my-0">
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
  const allPosts = blogApi.getAllPosts(['title', 'slug', 'description', 'date']);

  return {
    props: { allPosts },
  };
};
