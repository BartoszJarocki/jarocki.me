import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { places } from './gptPlaces.ts';
import { pca } from './pca.ts';

test('PCA keeps the three largest independent directions and centers the map', () => {
  const vectors = Float32Array.from([
    4, 0, 0, 0, -4, 0, 0, 0, 0, 3, 0, 0, 0, -3, 0, 0, 0, 0, 2, 0, 0, 0, -2, 0, 0, 0, 0, 1, 0, 0, 0,
    -1,
  ]);
  const projected = pca(vectors, 4);
  const expected = [4, 0, 0, -4, 0, 0, 0, 3, 0, 0, -3, 0, 0, 0, 2, 0, 0, -2, 0, 0, 0, 0, 0, 0];
  projected.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-5));
  const shifted = vectors.map((value, i) => value + (i % 4) * 7);
  pca(shifted, 4).forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-5));
});

test('the recorded map projects all 39 saved embeddings using all 32 numbers', () => {
  const bytes = readFileSync(new URL('../../../public/models/shakespeare.bin', import.meta.url));
  const vectors = new Float32Array(bytes.buffer, bytes.byteOffset, 39 * 32);
  const actual = pca(vectors, 32);
  assert.equal(actual.length, 117);
  assert.deepEqual(Array.from(actual), places);
  const changed = Float32Array.from(vectors);
  changed[31] += 10;
  assert.notDeepEqual(pca(changed, 32), actual);
});

test('identical embeddings have a finite collapsed map', () => {
  assert.deepEqual(Array.from(pca(new Float32Array(39 * 32).fill(2), 32)), Array(117).fill(0));
});
