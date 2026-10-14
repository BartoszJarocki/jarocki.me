import { NextApiHandler } from 'next';
import RSS from 'rss';

import { Name, SiteUrl } from '../../data/bio';
import { lowercase } from '../../lib/lowercase';
import { getNotes } from '../../lib/notes';

const rss: NextApiHandler = async (req, res) => {
  const feed = new RSS({
    title: Name,
    description: lowercase('Notes on programming, building products, leadership, and life.'),
    site_url: SiteUrl,
    feed_url: `${SiteUrl}/rss.xml`,
    language: 'en',
  });

  for (const note of getNotes()) {
    feed.item({
      title: lowercase(note.title),
      url: `${SiteUrl}/notes/${note.slug}`,
      date: note.publishedAt,
      description: lowercase(note.description),
    });
  }

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(feed.xml({ indent: true }));
  res.end();
};

export default rss;
