// Text to token ids, train/val split, random batches, and the bigram baseline.
// No Node imports, so the browser worker can use it too.

const lower = (t) => t.toLowerCase();
// Pan Tadeusz from Wolne Lektury: drop the title page and the license footer after the last "-----" line.
const panTadeusz = (t) => {
  t = t.replace(/\r\n/g, '\n');
  return lower(t.slice(t.indexOf('Księga pierwsza'), t.lastIndexOf('\n-----\n')).trimEnd() + '\n');
};

export const datasets = {
  names: { file: 'names/names.txt', kind: 'names', clean: (t) => t },
  shakespeare: { file: 'shakespeare/input.txt', kind: 'text', clean: (t) => t },
  'shakespeare-lower': { file: 'shakespeare/input.txt', kind: 'text', clean: lower },
  pan: { file: 'pan/pan-tadeusz.txt', kind: 'text', clean: panTadeusz },
};

export function prepare(kind, text, rand) {
  let trainText;
  let valText;
  if (kind === 'names') {
    // One name per line. Shuffle so the split is not ordered, and start each stream with a newline.
    const names = text.split('\n').filter(Boolean);
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    const cut = Math.floor(names.length * 0.9);
    trainText = '\n' + names.slice(0, cut).join('\n') + '\n';
    valText = '\n' + names.slice(cut).join('\n') + '\n';
  } else {
    const cut = Math.floor(text.length * 0.9);
    trainText = text.slice(0, cut);
    valText = text.slice(cut);
  }
  const chars = [...new Set(text + '\n')].sort();
  const index = new Map(chars.map((c, i) => [c, i]));
  const encode = (s) => Int32Array.from(s, (c) => index.get(c));
  const decode = (ids) => Array.from(ids, (i) => chars[i]).join('');
  return { chars, vocab: chars.length, encode, decode, train: encode(trainText), val: encode(valText) };
}

export function getBatch(tokens, B, T, rand) {
  const inputs = new Int32Array(B * T);
  const targets = new Int32Array(B * T);
  for (let b = 0; b < B; b++) {
    const start = Math.floor(rand() * (tokens.length - T - 1));
    for (let t = 0; t < T; t++) {
      inputs[b * T + t] = tokens[start + t];
      targets[b * T + t] = tokens[start + t + 1];
    }
  }
  return { inputs, targets };
}

// Next-character counts with add-one smoothing. Returns the mean loss on each split.
export function bigramLoss(train, val, V) {
  const counts = new Float64Array(V * V).fill(1);
  for (let i = 0; i + 1 < train.length; i++) counts[train[i] * V + train[i + 1]]++;
  const rows = new Float64Array(V);
  for (let a = 0; a < V; a++) for (let b = 0; b < V; b++) rows[a] += counts[a * V + b];
  const nll = (tokens) => {
    let sum = 0;
    for (let i = 0; i + 1 < tokens.length; i++) sum -= Math.log(counts[tokens[i] * V + tokens[i + 1]] / rows[tokens[i]]);
    return sum / (tokens.length - 1);
  };
  return { train: nll(train), val: nll(val) };
}
