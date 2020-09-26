import React from 'react';
import Link from 'next/link';
import { NextSeo } from 'next-seo';

import { getAllPosts } from '../lib/api';

import { Projects } from '../_data/projects';
import { Travel } from '../_data/travel';
import { SiteDescription, SiteTitle } from '../_data/about';

import { Post } from '../types/post';

import { Badge } from '../components/badge';
import { Section } from '../components/section';
import { Layout } from '../components/layout';
import { Container } from '../components/container';
import { Header } from '../components/header';

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
              <Link href={`/blog/${post.slug}`}>
                <div className="bg-white hover:bg-gray-100 border border-gray-400 rounded duration-200 ease-in-out mt-4 w-full lg:flex cursor-pointer">
                  <div className="p-4 flex flex-col justify-between leading-normal">
                    <div className="text-gray-900 font-bold text-lg sm:text:xl mb-2">
                      {post.title}
                    </div>
                    <p className="text-gray-700 text-base">{post.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </Section>
        <Section title={'Projects'}>
          {Projects.map((project) => {
            return (
              <a href={project.link} target="_blank">
                <div className="bg-white hover:bg-gray-100 border border-gray-400 rounded duration-200 ease-in-out mt-4 w-full lg:flex cursor-pointer">
                  <div className="p-4 flex flex-col flex-grow justify-between leading-normal">
                    <div className="flex flex-col sm:flex-row flex-grow text-gray-900 font-bold text-lg sm:text:xl mb-2">
                      {project.title}
                      <div className="flex space-x-2 sm:ml-auto">
                        {project.techStack.map((tech) => {
                          return <Badge>{tech}</Badge>;
                        })}
                      </div>
                    </div>
                    <p className="text-gray-700 text-base">{project.description}</p>
                  </div>
                </div>
              </a>
            );
          })}
        </Section>
        <Section title={'Travel'}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Travel.map((dest) => {
              return (
                <div className="rounded overflow-hidden shadow-md">
                  <img
                    className="w-full"
                    src={`/assets/travel/${dest.imgKey}.jpeg`}
                    alt="Sunset in the mountains"
                  />
                  <div className="px-4 py-4">
                    <div className="font-bold text-l mb-2">{dest.title}</div>
                    <p className="text-gray-700 text-base">{dest.placesVisited}</p>
                  </div>
                </div>
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
