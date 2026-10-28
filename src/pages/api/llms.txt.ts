import { NextApiHandler } from 'next';

import { Name, SiteDescription } from '../../data/bio';
import { renderMarkdown } from '../../lib/markdownPage';
import { getNotes } from '../../lib/notes';
import { type Block, type Run, literal } from '../../lib/textPage';

const pages = [
  { title: 'Home', path: '/', about: 'the latest notes, side projects, recent work, and links' },
  { title: 'Notes', path: '/notes', about: 'every note, newest first' },
  { title: 'Work', path: '/work', about: 'jobs, side projects, and past projects' },
  { title: 'About', path: '/about', about: 'where I live, what I like, and what I read' },
];

const paragraph = (...runs: Run[]): Block => ({ kind: 'paragraph', runs });

const links = (items: { title: string; path: string; about: string }[]): Block => ({
  kind: 'list',
  ordered: false,
  items: items.map(({ title, path, about }) => [
    paragraph({ ...literal(title), href: path }, literal(`: ${about}`)),
  ]),
});

const llms: NextApiHandler = async (req, res) => {
  const notes = getNotes().map((note) => ({
    title: note.title,
    path: `/notes/${note.slug}`,
    about: note.description,
  }));
  const body = renderMarkdown([
    { kind: 'title', runs: [literal(Name)] },
    { kind: 'quote', blocks: [paragraph(literal(SiteDescription))] },
    paragraph(
      literal('Every page also comes as markdown, either by asking for '),
      literal('text/markdown', 'code'),
      literal(' in the Accept header or by adding '),
      literal('.md', 'code'),
      literal(' to the path, as in '),
      literal('/index.md', 'code'),
      literal(' for the home page.'),
    ),
    { kind: 'heading', runs: [literal('Notes')] },
    links(notes),
    { kind: 'heading', runs: [literal('Pages')] },
    links(pages),
  ]);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.send(body);
};

export default llms;
