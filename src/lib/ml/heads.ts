import { encode } from './corpus.ts';
import {
  type Transformer,
  createTransformer,
  forward,
  readCheckpoint,
  shakespeare,
} from './gpt.ts';
import { load } from './params.ts';
import type { Weights } from './training.ts';

export type HeadsRequest = string | { readonly text: string; readonly exported: Weights };

/**
 * Every head's attention weights for one text. weights is [blocks, heads, n, n] for n letters.
 * Row t of a head is how much letter t reads letters 0 to t, and the rest of the row is 0.
 */
export type HeadWeights = {
  readonly text: string;
  readonly blocks: number;
  readonly heads: number;
  readonly weights: Float32Array<ArrayBuffer>;
};

export type HeadsReply =
  | { readonly type: 'weights'; readonly found: HeadWeights }
  | { readonly type: 'error'; readonly message: string };

/** The model pnpm train wrote. The checkpoint holds the knobs, and gpt.ts holds the symbols they read. */
export async function trainedGpt(read: (path: string) => Promise<Response>) {
  const net = createTransformer(shakespeare);
  load(net.params, await readCheckpoint(read));
  return net;
}

export function headWeights(net: Transformer, text: string): HeadWeights {
  const { blocks } = forward(net, encode(net.config.symbols, text));
  const weights = new Float32Array(blocks.length * blocks[0].weights.length);
  blocks.forEach((block, b) => weights.set(block.weights, b * block.weights.length));
  return { text, blocks: blocks.length, heads: net.config.heads, weights };
}
