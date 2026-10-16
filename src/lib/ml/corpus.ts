export type Corpus = {
  /** Every character of the lowercased text and the newline, sorted. An id is a place in this string. */
  readonly symbols: string;
  /** The first 90% of the lowercased text, as ids. */
  readonly training: Int32Array;
  /** The last 10%, which training never reads. */
  readonly validation: Int32Array;
  readonly words: ReadonlySet<string>;
};

/** Rows of `length` ids, one after another. targets[i] is the id that comes after tokens[i] in the text. */
export type Batch = {
  readonly tokens: Int32Array;
  readonly targets: Int32Array;
  readonly length: number;
};

export function readCorpus(text: string): Corpus {
  const lower = text.toLowerCase();
  const symbols = [...new Set(lower + '\n')].sort().join('');
  const ids = encode(symbols, lower);
  const cut = Math.floor(lower.length * 0.9);
  return {
    symbols,
    training: ids.subarray(0, cut),
    validation: ids.subarray(cut),
    words: new Set(lower.split(/[^a-z']+/).filter(Boolean)),
  };
}

export function encode(symbols: string, text: string) {
  const ids = new Map(Array.from(symbols, (symbol, id) => [symbol, id]));
  return Int32Array.from(text, (symbol, at) => {
    const id = ids.get(symbol);
    if (id === undefined) throw new Error(`${JSON.stringify(symbol)} at ${at} is not a symbol`);
    return id;
  });
}

export const decode = (symbols: string, ids: ArrayLike<number>) =>
  Array.from(ids, (id) => symbols[id]).join('');

export function drawBatch(tokens: Int32Array, rows: number, length: number, roll: () => number) {
  const batch: Batch = {
    tokens: new Int32Array(rows * length),
    targets: new Int32Array(rows * length),
    length,
  };
  for (let row = 0; row < rows; row++) {
    const start = Math.floor(roll() * (tokens.length - length - 1));
    batch.tokens.set(tokens.subarray(start, start + length), row * length);
    batch.targets.set(tokens.subarray(start + 1, start + length + 1), row * length);
  }
  return batch;
}

/** The share of the text's words that the corpus has. A word keeps only a to z and the apostrophe. */
export function wordShare({ words }: Corpus, text: string) {
  const found = text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z']/g, ''))
    .filter(Boolean);
  return found.length ? found.filter((word) => words.has(word)).length / found.length : 0;
}
