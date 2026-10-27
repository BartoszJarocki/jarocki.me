import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderText } from './textPage.ts';
import { contributionBars } from './textPages.ts';

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
