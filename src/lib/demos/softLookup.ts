import { softmax } from '../ml/letters.ts';

export const sentence = "The bag didn't fit in the car because it was too small";

export type Point = readonly [x: number, y: number];

/** An earlier word. Its key is the label it shows, and its value is what it hands over when it matches. */
export type Word = { readonly text: string; readonly key: Point; readonly value: Point };

export const words: readonly Word[] = [
  { text: 'bag', key: [-1.1, 1.8], value: [1, -1] },
  { text: 'fit', key: [-1.9, -1.3], value: [1, 1] },
  { text: 'car', key: [2.1, 1.8], value: [-1, -1] },
  { text: 'because', key: [1, -1.6], value: [-1, 1] },
];

/** Where the query for "small" starts, and how far from the middle the reader can drag it. */
export const queryBox = { start: [0.3, 0.6] as Point, reach: 3, step: 0.1 };

export type Lookup = {
  readonly scores: readonly number[];
  /** The softmax of the scores. They add up to 1. */
  readonly weights: readonly number[];
  /** The values, each scaled by its weight and added up. */
  readonly found: Point;
};

export const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1];

export function lookup(query: Point, earlier: readonly Word[] = words): Lookup {
  const scores = earlier.map(({ key }) => dot(query, key));
  const weights = new Float64Array(scores.length);
  softmax(Float64Array.from(scores), weights);
  let x = 0;
  let y = 0;
  earlier.forEach(({ value }, i) => {
    x += weights[i] * value[0];
    y += weights[i] * value[1];
  });
  return { scores, weights: Array.from(weights), found: [x, y] };
}

/** Keeps a dragged query inside the chart. */
export function clampQuery([x, y]: Point): Point {
  const { reach } = queryBox;
  const fit = (n: number) => Math.min(reach, Math.max(-reach, n));
  return [fit(x), fit(y)];
}
