import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { threeLetter } from '../ml/letters.ts';
import { symbols } from '../ml/tokenizers.ts';
import { startRun } from '../ml/training.ts';
import { fitReach, followLabel, labelRect, mapFigure, restView } from './letterMap.ts';
import { places as trained } from './letterPlaces.ts';

const text = fs.readFileSync('public/data/names.txt', 'utf8');
const desktop = { width: 672, height: 420 };
const phone = { width: 320, height: 300 };

function clashes(figure: ReturnType<typeof mapFigure>, box: { width: number; height: number }) {
  const boxes = [
    ...figure.axes.flatMap(({ label }) => (label ? [label] : [])),
    ...figure.points.map((point) => followLabel(point.text)),
  ].map((label) => ({ text: label.text, ...labelRect(label) }));
  const squares = figure.points.map(({ x, y, symbol }) => ({
    text: `the square of ${symbol}`,
    left: x - 2.5,
    right: x + 2.5,
    top: y - 2.5,
    bottom: y + 2.5,
  }));
  const found: string[] = [];
  for (const axis of figure.axes) {
    for (const label of boxes) {
      const through = Array.from({ length: 99 }, (_, k) => (k + 1) / 100).some((t) => {
        const x = axis.x1 + (axis.x2 - axis.x1) * t;
        const y = axis.y1 + (axis.y2 - axis.y1) * t;
        return x > label.left && x < label.right && y > label.top && y < label.bottom;
      });
      if (through) found.push(`axis ${axis.text} through ${label.text}`);
    }
  }
  boxes.forEach((a, i) => {
    if (a.left < 0 || a.top < 0 || a.right > box.width || a.bottom > box.height) {
      found.push(`${a.text} outside`);
    }
    for (const b of [
      ...boxes
        .slice(i + 1)
        .filter((b) => !a.text.startsWith('following') || !b.text.startsWith('following')),
      ...squares,
    ]) {
      if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
        found.push(`${a.text} on ${b.text}`);
      }
    }
  });
  return found;
}

test('every label on the trained map clears every other label, square, and axis, at both sizes', () => {
  for (const box of [desktop, phone]) {
    const figure = mapFigure(trained, symbols, restView, box, fitReach(trained));
    assert.deepEqual(clashes(figure, box), []);
  }
});

test('every label clears the others in the heap of untrained letters, at both sizes', () => {
  const start = Array.from(startRun(threeLetter, text, { seed: 1 }).model.letters.data);
  for (const box of [desktop, phone]) {
    const figure = mapFigure(start, symbols, restView, box, fitReach(start));
    assert.deepEqual(clashes(figure, box), []);
  }
});

test('q is too far out for the trained map, so it sits on the edge with an arrow to where it lies', () => {
  const figure = mapFigure(trained, symbols, restView, desktop, fitReach(trained));
  const q = figure.points.find((point) => point.symbol === 'q')!;
  assert.equal(q.text, 'q↑');
  assert.deepEqual(
    figure.points.filter((point) => point.text.length > 1).map((point) => point.symbol),
    ['q'],
  );
});

test('each letter has a fixed label and a distinct selectable identity while its square moves', () => {
  for (const box of [desktop, phone]) {
    const figure = mapFigure(trained, symbols, restView, box, fitReach(trained));
    assert.equal(figure.points.length, 27);
    assert.equal(new Set(figure.points.map((point) => point.symbol)).size, 27);
    assert.deepEqual(followLabel('x'), { text: 'following x', x: 12, y: 8 });
    assert.deepEqual(followLabel('q↑'), { text: 'following q↑', x: 12, y: 8 });
    assert.deepEqual(clashes(figure, box), []);
  }
});

test('labels stay clear of axes and squares in dense and rotated layouts, without fallback leaders', () => {
  let seed = 813;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (let n = 0; n < 2400; n++) {
    const box = { width: 240 + random() * 432, height: 216 + random() * 204 };
    const places = Array.from({ length: 81 }, () => (random() - 0.5) * (n % 3 === 0 ? 0.01 : 4));
    const figure = mapFigure(
      places,
      symbols,
      { yaw: random() * 360, pitch: random() * 160 - 80 },
      box,
      fitReach(places),
    );
    assert.deepEqual(clashes(figure, box), [], `layout ${n}`);
  }
});
