import { NextApiHandler } from 'next';

import { GitHubUser } from '../../../data/links';
import { fetchContributionDays } from '../../../lib/githubActivity';
import { Note, getNoteTree, getNotes, seriesParts } from '../../../lib/notes';
import { noteBlocks } from '../../../lib/textNote';
import { Block, renderText } from '../../../lib/textPage';
import {
  aboutPage,
  homePage,
  missingPage,
  notePage,
  notesPage,
  workPage,
} from '../../../lib/textPages';

type Page = 'home' | 'notes' | 'work' | 'about' | 'missing';
type Route = { page: Page } | { page: 'note'; note: Note };

const pages = new Map<string, Page>([
  ['', 'home'],
  ['notes', 'notes'],
  ['work', 'work'],
  ['about', 'about'],
]);

// next start hands this route the URL from before the middleware's rewrite, without the path
// param, and a direct call has the /api/text one, so the page path comes from either form of the
// URL.
function parseRequest(url: string, notes: Note[]) {
  const { pathname } = new URL(url, 'http://localhost');
  const path = pathname.replace(/^\/api\/text(?=\/|$)/, '').replace(/^\/|\/$/g, '');
  const note = notes.find((item) => `notes/${item.slug}` === path);
  const route: Route = note ? { page: 'note', note } : { page: pages.get(path) ?? 'missing' };
  return route;
}

async function pageBlocks(route: Route, notes: Note[]): Promise<Block[]> {
  switch (route.page) {
    case 'home':
      return homePage(notes, await fetchContributionDays(GitHubUser));
    case 'notes':
      return notesPage(notes);
    case 'note': {
      const { note } = route;
      return notePage({
        note,
        prose: noteBlocks(await getNoteTree(note.slug), note.slug),
        older: notes[notes.indexOf(note) + 1],
        parts: note.series ? seriesParts(note.series) : [],
      });
    }
    case 'work':
      return workPage();
    case 'about':
      return aboutPage();
    case 'missing':
      return missingPage();
  }
}

const text: NextApiHandler = async (req, res) => {
  const notes = getNotes();
  const route = parseRequest(req.url ?? '/', notes);
  const body = renderText(await pageBlocks(route, notes));

  res.status(route.page === 'missing' ? 404 : 200);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Vary', 'User-Agent');
  res.send(body);
};

export default text;
