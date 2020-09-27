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
import { Header } from '../components/header';
import { OutlinedCard } from '../components/outlined-card';
import { OutlinedCardTitle } from '../components/outlined-card-title';
import { OutlinedCardDescription } from '../components/outlined-card-description';
import { PhotoCard } from '../components/photo-card';
import { ExternalLink } from '../components/external-link';

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
      <Container>
        <Header />
        <Section title={'Blog'} hasMore link={'/blog'}>
          {allPosts.map((post) => {
            return (
              <Link key={post.title} href={`/blog/${post.slug}`}>
                <OutlinedCard>
                  <OutlinedCardTitle>{post.title}</OutlinedCardTitle>
                  <OutlinedCardDescription>{post.description}</OutlinedCardDescription>
                </OutlinedCard>
              </Link>
            );
          })}
        </Section>
        <Section title={'Projects'}>
          {Projects.map((project) => {
            return (
              <ExternalLink key={project.title} href={project.link}>
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
