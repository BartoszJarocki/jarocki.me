import type { HeadWeights, HeadsReply } from '../ml/heads.ts';
import { sentence } from './softLookup.ts';

/** The note's sentence as the model reads it. It knows only lowercase letters. */
export const text = sentence.toLowerCase();

/** The head the triangle draws, counted from 0. */
export const triangleHead = { block: 1, head: 3 } as const;

/** How the demos write a letter. A space shows as a middle dot. */
export const shown = (letter: string) => (letter === ' ' ? '·' : letter);

/** Names letter t by the word it sits in, as "l in small" or "the space after too". */
export function letterName(t: number) {
  if (text[t] === ' ') return `the space after ${text.slice(0, t).split(' ').pop()}`;
  const start = text.lastIndexOf(' ', t) + 1;
  const end = text.indexOf(' ', t);
  return `${text[t]} in ${text.slice(start, end === -1 ? undefined : end)}`;
}

/** How much letter t reads each letter from 0 to t, in one head. */
export function readingOf(found: HeadWeights, block: number, head: number, t: number) {
  const n = found.text.length;
  const start = ((block * found.heads + head) * n + t) * n;
  return found.weights.subarray(start, start + t + 1);
}

/** The letter each letter from 1 on reads most, in one head. */
export function largestReads(found: HeadWeights, block: number, head: number) {
  return Array.from({ length: found.text.length - 1 }, (_, i) => {
    const row = readingOf(found, block, head, i + 1);
    return row.indexOf(Math.max(...row));
  });
}

/** The numbers the stills draw, in thousandths: the triangle's head, and every head from the last letter. */
export function stillNumbers(found: HeadWeights) {
  const n = found.text.length;
  const thousandths = (row: ArrayLike<number>) => Array.from(row, (w) => Math.round(w * 1000));
  const { block, head } = triangleHead;
  return {
    triangle: Array.from({ length: n }, (_, t) => thousandths(readingOf(found, block, head, t))),
    arcs: Array.from({ length: found.blocks * found.heads }, (_, i) =>
      thousandths(readingOf(found, Math.floor(i / found.heads), i % found.heads, n - 1)),
    ),
  };
}

let pending: Promise<HeadWeights> | null = null;

/**
 * The trained model's head weights for the sentence. The first call fetches the checkpoint and runs
 * the model in a worker, so the page never waits on the math. Later calls share the answer.
 */
export function sentenceHeads() {
  pending ??= new Promise<HeadWeights>((resolve, reject) => {
    const worker = new Worker(new URL('../ml/heads.worker.ts', import.meta.url), {
      type: 'module',
    });
    const settle = (finish: () => void) => {
      worker.terminate();
      finish();
    };
    worker.addEventListener('message', (event: MessageEvent<HeadsReply>) => {
      const reply = event.data;
      settle(() =>
        reply.type === 'weights' ? resolve(reply.found) : reject(new Error(reply.message)),
      );
    });
    // A worker script that fails to load fires a plain Event, without a message.
    worker.addEventListener('error', (event) =>
      settle(() => reject(new Error((event as ErrorEvent).message || 'The worker failed to load'))),
    );
    worker.addEventListener('messageerror', () =>
      settle(() => reject(new Error('The page could not read a message from the worker'))),
    );
    worker.postMessage(text);
  }).catch((error) => {
    pending = null;
    throw error;
  });
  return pending;
}
