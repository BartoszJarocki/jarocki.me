import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
const { getNotes } = await import('./notes.ts');
const { parseRequest } = await import('./pageRequest.ts');

test('a request names its page with or without the route prefix and .md', () => {
  const notes = getNotes();
  const page = (url: string) => {
    const route = parseRequest(url, notes);
    return route.page === 'note' ? `note ${route.note.slug}` : route.page;
  };
  assert.deepEqual(
    [
      '/notes/time.md',
      '/index.md',
      '/api/markdown/notes/time',
      '/api/text',
      '/api/markdown/work.md?x=1',
      '/notes/nope.md',
      '/api/texts',
    ].map(page),
    ['note time', 'home', 'note time', 'home', 'work', 'missing', 'missing'],
  );
});
