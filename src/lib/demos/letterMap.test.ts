import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';

import { threeLetter } from '../ml/letters.ts';
import { symbols } from '../ml/tokenizers.ts';
import { startRun } from '../ml/training.ts';
import { fitReach, mapFigure, restView } from './letterMap.ts';
import { places as trained } from './letterPlaces.ts';

const text = fs.readFileSync('public/data/names.txt', 'utf8');
const desktop = { width: 672, height: 420 };
const phone = { width: 320, height: 300 };

function clashes(figure: ReturnType<typeof mapFigure>, box: { width: number; height: number }) {
  const boxes = [...figure.axes, ...figure.points].map(({ label }) => ({
    text: label.text,
    left: label.x,
    right: label.x + label.text.length * 6.6,
    top: label.y - 5,
    bottom: label.y + 5,
  }));
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
    for (const b of [...boxes.slice(i + 1), ...squares]) {
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
  assert.equal(q.label.text, 'q↑');
  assert.deepEqual(
    figure.points.filter((point) => point.label.text.length > 1).map((point) => point.symbol),
    ['q'],
  );
});

test('a label keeps the spot it had in the last frame while that spot is still free', () => {
  const side = (previous?: Map<string, { turn: number; ring: number }>) => {
    const figure = mapFigure(trained, symbols, restView, desktop, fitReach(trained), previous);
    const a = figure.points.find((point) => point.symbol === 'a')!;
    return a.label.x > a.x ? 'right' : 'left';
  };
  assert.equal(side(), 'right');
  assert.equal(side(new Map([['a', { turn: 8, ring: 0 }]])), 'left');
});
