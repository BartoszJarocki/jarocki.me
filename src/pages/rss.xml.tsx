import { GetServerSideProps } from 'next';
import RSS from 'rss';

import { notesApi } from '../lib/notesApi';

export default function RSSFeed() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const feed = new RSS({
    title: 'Bartosz Jarocki',
    site_url: 'https://jarocki.me',
    feed_url: 'https://jarocki.me/rss.xml',
  });

  const allPosts = await notesApi.getNotes();
  allPosts.map((post) => {
    feed.item({
      title: post.title,
      url: `https://jarocki.me/notes/${post.slug}`,
      date: post.publishedAt,
      description: post.description,
    });
  });

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=1200, stale-while-revalidate=600');
  res.write(feed.xml({ indent: true }));
  res.end();

  return {
    props: {},
  };
};
