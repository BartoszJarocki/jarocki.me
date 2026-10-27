import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { renderText } from './textPage.ts';
import {
  aboutPage,
  contributionBars,
  homePage,
  missingPage,
  notesPage,
  workPage,
} from './textPages.ts';

process.chdir(fileURLToPath(new URL('../..', import.meta.url)));
const { getNotes } = await import('./notes.ts');

test('each week is a bar of half blocks scaled to the busiest week, with empty weeks dotted', () => {
  const dates = Array.from({ length: 67 }, (_, i) =>
    new Date(Date.UTC(2025, 11, 24 + i)).toISOString().slice(0, 10),
  );
  const weekly = [3, 0, 12, 24, 1, 7, 0, 18, 5, 2];
  let week = 0;
  const counts = dates.map((date, i) =>
    i > 0 && new Date(date).getUTCDay() !== 0 ? 0 : weekly[week++],
  );

  assert.equal(
    renderText([{ kind: 'art', lines: contributionBars(dates, counts) }]).replace(
      /\x1b\[\d+m/g,
      '',
    ),
    `
     █
     █   ▄
     █   █
    ██   █
    ██ █ █▄
  █·██▄█·██▄
   jan  feb
  72 contributions   past year

`,
  );
});

test("the home, notes, work, about, and 404 pages render the site's data within 78 columns", () => {
  const notes = getNotes();
  const days = Array.from({ length: 371 }, (_, i) => ({
    date: new Date(Date.UTC(2025, 9, 26 + i)).toISOString().slice(0, 10),
    count: i % 9,
  }));
  const pages = {
    home: homePage(notes, days),
    notes: notesPage(notes),
    work: workPage(),
    about: aboutPage(),
    missing: missingPage(),
  };
  for (const [name, blocks] of Object.entries(pages)) {
    const lines = renderText(blocks)
      .replace(/\x1b\[\d+m/g, '')
      .split('\n');
    assert.equal(
      lines[1],
      '  Bartosz Jarocki                                           notes  work  about',
      name,
    );
    assert.deepEqual(
      lines.filter((line) => [...line].length > 78),
      [],
      name,
    );
  }
});
