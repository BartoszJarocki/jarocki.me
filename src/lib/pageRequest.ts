import { GitHubUser } from '../data/links.ts';
import { fetchContributionDays } from './githubActivity.ts';
import { type Note, getNoteTree, seriesParts } from './notes.ts';
import { noteBlocks } from './textNote.ts';
import type { Block } from './textPage.ts';
import { aboutPage, homePage, missingPage, notePage, notesPage, workPage } from './textPages.ts';

type Page = 'home' | 'notes' | 'work' | 'about' | 'missing';
export type Route = { page: Page } | { page: 'note'; note: Note };

const pages = new Map<string, Page>([
  ['', 'home'],
  ['index', 'home'],
  ['notes', 'notes'],
  ['work', 'work'],
  ['about', 'about'],
]);

// next start hands an API route the URL from before the middleware's rewrite, without the path
// param, and a direct call has the /api/text or /api/markdown one, so the page path comes from
// either form of the URL.
export function parseRequest(url: string, notes: Note[]): Route {
  const { pathname } = new URL(url, 'http://localhost');
  const path = pathname
    .replace(/^\/api\/(?:text|markdown)(?=\/|$)/, '')
    .replace(/\.md$/, '')
    .replace(/^\/|\/$/g, '');
  const note = notes.find((item) => `notes/${item.slug}` === path);
  return note ? { page: 'note', note } : { page: pages.get(path) ?? 'missing' };
}

export async function pageBlocks(route: Route, notes: Note[]): Promise<Block[]> {
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
