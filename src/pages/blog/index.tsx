import React from 'react';
import Link from 'next/link';

import { Post } from '../../types/post';
import { getAllPosts } from '../../lib/api';

import { Section } from '../../components/section';
import { Container } from '../../components/container';
import { Layout } from '../../components/layout';

type Props = {
  allPosts: Post[];
};

const Blog = ({ allPosts }: Props) => {
  return (
    <Layout title="Bartosz Jarocki - Blog">
      <Container>
        <Section title={'Blog'}>
          {allPosts.map((post) => {
            return (
              <Link href={`/blog/${post.slug}`}>
                <div className="bg-white hover:bg-gray-100 border border-gray-400 rounded duration-200 ease-in-out mt-4 w-full lg:flex cursor-pointer">
                  <div className="p-4 flex flex-col justify-between leading-normal">
                    <div className="text-gray-900 font-bold text-xl mb-2">{post.title}</div>
                    <p className="text-gray-700 text-base">{post.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </Section>
      </Container>
    </Layout>
  );
};

export default Blog;

export const getStaticProps = async () => {
  const allPosts = getAllPosts([
    'title',
    'date',
    'slug',
    'author',
    'coverImage',
    'excerpt',
    'description',
  ]);

  return {
    props: { allPosts },
  };
};
