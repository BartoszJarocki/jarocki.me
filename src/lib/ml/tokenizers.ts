// #region tokenizer
export const symbols = '.abcdefghijklmnopqrstuvwxyz';

export function encode(name: string) {
  const ids = [0];
  for (const letter of name) {
    const id = symbols.indexOf(letter);
    if (id < 1) throw new Error(`${JSON.stringify(letter)} is not a letter from a to z`);
    ids.push(id);
  }
  ids.push(0);
  return ids;
}
// #endregion

export type Menus = { letters: string[]; words: string[]; merges: [string, string][] };
export type Piece = { text: string; known: boolean };
export type Cut = { menu: number; pieces: Piece[] };
export const cuts = ['letters', 'words', 'pieces'] as const;
export type Cuts = Record<(typeof cuts)[number], Cut>;
export const pieceWord = (count: number) => (count === 1 ? 'piece' : 'pieces');

const word = /\p{L}+|\p{N}+|[^\s\p{L}\p{N}]/gu;
const onlyLetters = /^\p{L}+$/u;

const wordsOf = (text: string) => text.normalize('NFC').toLowerCase().match(word) ?? [];

function merge(parts: string[], [left, right]: [string, string]) {
  const merged: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === left && parts[i + 1] === right) merged.push(left + parts[++i]);
    else merged.push(parts[i]);
  }
  return merged;
}

export function trainMenus(text: string, mergeCount: number): Menus {
  const seen = new Map<string, number>();
  for (const w of wordsOf(text)) if (onlyLetters.test(w)) seen.set(w, (seen.get(w) ?? 0) + 1);
  const words = [...seen.keys()].sort();
  const letters = [...new Set(words.flatMap((w) => Array.from(w)))].sort();
  let split = [...seen].map(([w, times]) => ({ parts: Array.from(w), times }));
  const merges: [string, string][] = [];
  while (merges.length < mergeCount) {
    const pairs = new Map<string, number>();
    for (const { parts, times } of split) {
      for (let i = 1; i < parts.length; i++) {
        const key = JSON.stringify([parts[i - 1], parts[i]]);
        pairs.set(key, (pairs.get(key) ?? 0) + times);
      }
    }
    let best = '';
    let bestTimes = 1;
    for (const [key, times] of pairs) {
      if (times > bestTimes) [best, bestTimes] = [key, times];
    }
    if (!best) break;
    const pair = JSON.parse(best) as [string, string];
    merges.push(pair);
    split = split.map(({ parts, times }) => ({ parts: merge(parts, pair), times }));
  }
  return { letters, words, merges };
}

export function cutThreeWays(sentence: string, menus: Menus): Cuts {
  const letters = new Set(menus.letters);
  const words = new Set(menus.words);
  const pieces = new Set([...menus.letters, ...menus.merges.map(([l, r]) => l + r)]);
  const split = wordsOf(sentence);
  const mark = (menu: Set<string>) => (text: string) => ({ text, known: menu.has(text) });
  return {
    letters: { menu: letters.size, pieces: split.flatMap((w) => Array.from(w)).map(mark(letters)) },
    words: { menu: words.size, pieces: split.map(mark(words)) },
    pieces: {
      menu: pieces.size,
      pieces: split.flatMap((w) => menus.merges.reduce(merge, Array.from(w))).map(mark(pieces)),
    },
  };
}
