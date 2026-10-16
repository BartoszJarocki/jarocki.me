import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { rides } from './demos/taxiFares.ts';
import { chances, countPairs, sampleName, seeded } from './ml/bigram.ts';
import { createTransformer, forward } from './ml/gpt.ts';
import {
  crossEntropy,
  examples,
  oneLetterKnobs,
  oneLetterLoss,
  softmax,
  surpriseSlopes,
  threeLetterKnobs,
  threeLetterScores,
} from './ml/letters.ts';
import { MLP } from './ml/mlp.ts';
import { createParams } from './ml/params.ts';
import { cutThreeWays } from './ml/tokenizers.ts';
import { Value } from './ml/value.ts';

const directory = new URL('../notes/snippets/', import.meta.url);
const outputs: Record<string, string[]> = {
  'how-a-machine-learns/value.js': ['Loss: 12.25', 'Fee slope: -7', 'Price slope: -2.1'],
  'how-a-machine-learns/network.js': ['Score: -0.974099', 'Chance: 0.274064'],
  'how-a-machine-learns/training.js': [
    'Step 0 loss: 4.4337',
    'Step 25 loss: 0.6577',
    'Step 50 loss: 0.3884',
    'Step 75 loss: 0.3390',
    'Step 100 loss: 0.3299',
  ],
  'words-as-numbers/tokenizer.js': [
    'Letters: t | h | e | t | h | i | n | c | a | t',
    'Words: the | thin | cat',
    'Pieces: the | th | i | n | c | a | t',
  ],
  'words-as-numbers/counts.js': ['Start then e: 3', 'm then m: 2', 'a then end: 4'],
  'words-as-numbers/sampling.js': ['Name: amma', 'Chance of n after a: 0.068966'],
  'words-as-numbers/names.js': ['be', 'fj', 'lo', 'ru', 'xb', 'be', 'fj', 'lo', 'ru', 'xb'],
  'words-as-numbers/softmax.js': [
    'Chances: 0.090031, 0.244728, 0.665241',
    'Same after adding 1000: 0.090031, 0.244728, 0.665241',
  ],
  'words-as-numbers/cross-entropy.js': ['Surprise: 0.510826', 'Score slopes: 0.1, 0.3, -0.4'],
  'words-as-numbers/one-letter.js': [
    'Step 0 loss: 3.295837',
    'Step 10 loss: 1.774901',
    'Step 20 loss: 1.094005',
  ],
  'words-as-numbers/three-letter.js': [
    'After ann, score for a: 0.020567',
    'After ann, score for end: 0.017978',
  ],
  'paying-attention/attention.js': [
    'Last weights: 0.401112, 0.401112, 0.197776',
    'Last mix: 1.000000, 1.802224',
  ],
  'paying-attention/block.js': [
    'After attention: 1.902098, 4.097902',
    'After network: 1.817383, 4.363186',
  ],
};

function read(file: string) {
  return fs.readFileSync(new URL(file, directory), 'utf8');
}

// The source stays intact. A return appended in the same scope can call its private functions.
function evaluate(file: string, expression: string, fixture?: unknown): unknown {
  return new Function('console', 'fixture', read(file) + '\nreturn (' + expression + ');')(
    { log() {} },
    fixture,
  );
}

function close(actual: unknown, expected: unknown) {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number');
    assert.ok(
      typeof actual === 'number' && Math.abs(actual - expected) <= 1e-9,
      `${actual} differs from ${expected}`,
    );
  } else if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual));
    assert.equal(actual.length, expected.length);
    expected.forEach((value, i) => close(actual[i], value));
  } else if (expected !== null && typeof expected === 'object') {
    assert.ok(actual !== null && typeof actual === 'object');
    assert.deepEqual(Object.keys(actual), Object.keys(expected));
    for (const [key, value] of Object.entries(expected)) {
      close(Reflect.get(actual, key), value);
    }
  } else assert.deepEqual(actual, expected);
}

for (const [file, expected] of Object.entries(outputs)) {
  test(`snippet output: ${file}`, () => {
    const lines: string[] = [];
    new Function('console', read(file))({
      log: (...args: unknown[]) => lines.push(args.join(' ')),
    });
    assert.deepEqual(lines, expected);
  });
}

test('snippet agreement: how-a-machine-learns/value.js', () => {
  const fee = new Value(2),
    price = new Value(2.5);
  const miss = fee.add(price.mul(0.3)).add(-6.25);
  const loss = miss.mul(miss);
  loss.backward();
  close(evaluate('how-a-machine-learns/value.js', '[loss.data, fee.grad, price.grad]'), [
    loss.data,
    fee.grad,
    price.grad,
  ]);
  // A shared intermediate must receive both paths, even on a second backward pass.
  close(
    evaluate(
      'how-a-machine-learns/value.js',
      `(() => {
    const x = value(3), y = multiply(x, x), z = add(y, y);
    backward(z); backward(z); return [z.data, x.grad];
  })()`,
    ),
    [18, 12],
  );
});

test('snippet agreement: how-a-machine-learns/network.js', () => {
  const net = new MLP([2, 2, 1], () => 0);
  const knobs = [1, -1, 0, 0.5, 0.5, -0.5, 2, -1, 0.1];
  net.parameters().forEach((p, i) => (p.data = knobs[i]));
  for (const input of [
    [0.2, 0.8],
    [-1, 2],
    [0, 0],
  ]) {
    close(
      evaluate('how-a-machine-learns/network.js', 'forward(fixture, layers)[0]', input),
      net.call(input).data,
    );
  }
});

test('snippet agreement: how-a-machine-learns/training.js', () => {
  const fee = new Value(2),
    price = new Value(2.5);
  for (let turn = 0; turn < 100; turn++) {
    const losses = rides.map(({ km, paid }) => fee.add(price.mul(km)).add(-paid).pow(2));
    const loss = losses.reduce((sum, x) => sum.add(x)).mul(1 / rides.length);
    loss.backward();
    const rule = { fee: fee.data, price: price.data };
    close(evaluate('how-a-machine-learns/training.js', 'measure(fixture, rides)', rule), {
      loss: loss.data,
      fee: fee.grad,
      price: price.grad,
    });
    fee.data -= 0.1 * fee.grad;
    price.data -= 0.1 * price.grad;
    close(evaluate('how-a-machine-learns/training.js', 'step(fixture, rides, 0.1)', rule), {
      fee: fee.data,
      price: price.data,
    });
  }
});

test('snippet agreement: words-as-numbers/tokenizer.js', () => {
  const menus = {
    letters: [...'abcdefghijklmnopqrstuvwxyz'],
    words: ['the', 'thin', 'cat'],
    merges: [
      ['t', 'h'],
      ['th', 'e'],
    ] satisfies [string, string][],
  };
  for (const sentence of ['the thin cat', 'The thick cat!', 'thin 12']) {
    const cuts = cutThreeWays(sentence, menus);
    close(evaluate('words-as-numbers/tokenizer.js', 'tokenize(fixture, merges)', sentence), {
      letters: cuts.letters.pieces.map((p) => p.text),
      words: cuts.words.pieces.map((p) => p.text),
      pieces: cuts.pieces.pieces.map((p) => p.text),
    });
  }
});

test('snippet agreement: words-as-numbers/counts.js', () => {
  for (const names of [
    ['emma', 'ella', 'anna'],
    ['', 'a', 'zzz'],
  ]) {
    close(
      evaluate('words-as-numbers/counts.js', 'countPairs(fixture).flat()', names),
      Array.from(countPairs(names)),
    );
  }
});

test('snippet agreement: words-as-numbers/sampling.js', () => {
  const counts = countPairs(['anna']);
  for (const temperature of [0.5, 1, 2]) {
    close(
      evaluate('words-as-numbers/sampling.js', 'chances(counts, 1, fixture)', temperature),
      chances(counts, 1, temperature),
    );
  }
  const rolls = [0.02, 0.5, 0.5, 0.05, 0];
  let turn = 0;
  close(
    evaluate(
      'words-as-numbers/sampling.js',
      'sampleName(counts, 1, (() => { let i = 0; return () => fixture[i++]; })())',
      rolls,
    ),
    sampleName(counts, 1, () => rolls[turn++]),
  );
});

test('snippet agreement: words-as-numbers/names.js', () => {
  const counts = countPairs(['emma', 'ella', 'anna']);
  close(evaluate('words-as-numbers/names.js', 'counts.flat()'), Array.from(counts));
  const rolls = [0.3, 0.4, 0];
  let turn = 0;
  close(
    evaluate(
      'words-as-numbers/names.js',
      'sampleName(counts, (() => { let i = 0; return () => fixture[i++]; })())',
      rolls,
    ),
    sampleName(counts, 1, () => rolls[turn++]),
  );
});

test('snippet agreement: words-as-numbers/softmax.js', () => {
  for (const scores of [
    [-1, 0, 1],
    [999, 1000, 1001],
    [-1000, 0, 1000],
  ]) {
    const out = new Float64Array(3);
    softmax(Float64Array.from(scores), out);
    close(evaluate('words-as-numbers/softmax.js', 'softmax(fixture)', scores), Array.from(out));
  }
});

test('snippet agreement: words-as-numbers/cross-entropy.js', () => {
  const chances = Float64Array.of(0.1, 0.3, 0.6);
  for (const next of [0, 1, 2]) {
    const slopes = new Float64Array(3);
    surpriseSlopes(chances, next, slopes);
    close(
      evaluate(
        'words-as-numbers/cross-entropy.js',
        '[crossEntropy(chances, fixture), surpriseSlopes(chances, fixture)]',
        next,
      ),
      [crossEntropy(chances, next), Array.from(slopes)],
    );
  }
});

test('snippet agreement: words-as-numbers/one-letter.js', () => {
  const p = createParams({
    model: 'oneLetter',
    config: {},
    knobs: oneLetterKnobs,
    roll: seeded(1),
    float: Float64Array,
  });
  p.data.forEach((_, i) => (p.data[i] = Math.sin(i) * 2));
  const batch = examples(['anna'], 1);
  const loss = oneLetterLoss(p, batch);
  const scores = Array.from({ length: 27 }, (_, i) =>
    Array.from(p.data.slice(i * 27, (i + 1) * 27)),
  );
  close(
    evaluate(
      'words-as-numbers/one-letter.js',
      `(() => {
    const result = oneLetterLoss(fixture, pairs); return [result.loss, result.grad.flat()];
  })()`,
      scores,
    ),
    [loss, Array.from(p.grad)],
  );
});

test('snippet agreement: words-as-numbers/three-letter.js', () => {
  const p = createParams({
    model: 'threeLetter',
    config: { hidden: 2 },
    knobs: threeLetterKnobs,
    roll: seeded(3),
    float: Float64Array,
  });
  const knobs = Object.fromEntries(
    Object.entries(p.tensors).map(([key, tensor]) => {
      const [rows, columns] = tensor.shape;
      return [
        key,
        columns
          ? Array.from({ length: rows }, (_, i) =>
              Array.from(tensor.data.slice(i * columns, (i + 1) * columns)),
            )
          : Array.from(tensor.data),
      ];
    }),
  );
  const input = new Float64Array(9),
    hidden = new Float64Array(2),
    scores = new Float64Array(27);
  threeLetterScores(p, Uint8Array.of(1, 14, 14), input, hidden, scores);
  close(
    evaluate('words-as-numbers/three-letter.js', 'threeLetterScores([1, 14, 14], fixture)', knobs),
    Array.from(scores),
  );
});

function tinyTransformer() {
  return createTransformer(
    { symbols: 'abc', context: 3, width: 2, heads: 1, blocks: 1 },
    { seed: 7, float: Float64Array },
  );
}

test('snippet agreement: paying-attention/attention.js', () => {
  const net = tinyTransformer();
  const tape = forward(net, Int32Array.of(0, 1, 2)).blocks[0];
  const rows = Array.from({ length: 3 }, (_, t) =>
    Array.from(tape.lookups.slice(t * 6, t * 6 + 6)),
  );
  const result = evaluate(
    'paying-attention/attention.js',
    `(() => {
    const { found, weights } = attention(fixture.map(x => x.slice(0, 2)),
      fixture.map(x => x.slice(2, 4)), fixture.map(x => x.slice(4, 6)));
    return [found.flat(), weights.flatMap(row => [...row, ...Array(3 - row.length).fill(0)])];
  })()`,
    rows,
  );
  close(result, [Array.from(tape.found), Array.from(tape.weights)]);
});

test('snippet agreement: paying-attention/block.js', () => {
  const net = tinyTransformer();
  net.params.data.fill(0);
  net.letters.data.set([1, 2, 3, 1, 2, 4]);
  const { attention, network } = net.blocks[0];
  attention.level.gain.data.fill(1);
  network.level.gain.data.fill(1);
  for (let i = 0; i < 2; i++) {
    attention.lookup.weights.data[i * 6 + i] = 1;
    attention.lookup.weights.data[i * 6 + 2 + i] = 0.5;
    attention.lookup.weights.data[i * 6 + 4 + i] = 0.25;
    attention.write.weights.data[i * 2 + i] = 0.5;
    network.hidden.weights.data[i * 8 + i] = 0.7;
    network.write.weights.data[i * 2 + i] = 0.5;
  }
  const tape = forward(net, Int32Array.of(0, 1, 2)).blocks[0];
  close(evaluate('paying-attention/block.js', '[result.middle.flat(), result.out.flat()]'), [
    Array.from(tape.middle),
    Array.from(tape.out),
  ]);
});

test('snippets are plain scripts of at most 45 lines', () => {
  for (const file of Object.keys(outputs)) {
    const source = read(file);
    assert.ok(source.trimEnd().split('\n').length <= 45, file);
    assert.doesNotMatch(source, /\b(class|this|import|export)\b/, file);
    // JavaScript's own parser rejects type annotations.
    assert.doesNotThrow(() => new Function(source), file);
  }
});

test('every run path exists and every snippet is used and tested', () => {
  const notes = new URL('../notes/', import.meta.url);
  const used = fs
    .readdirSync(notes)
    .filter((name) => name.endsWith('.mdx'))
    .flatMap((name) => {
      const text = fs.readFileSync(new URL(name, notes), 'utf8');
      return [...text.matchAll(/^```js run=src\/notes\/snippets\/(.+)\n```$/gm)].map((m) => m[1]);
    });
  const files = fs
    .readdirSync(directory, { recursive: true })
    .filter((file) => typeof file === 'string' && file.endsWith('.js'))
    .map(String);
  assert.deepEqual(used.toSorted(), files.toSorted());
  assert.deepEqual(Object.keys(outputs).toSorted(), files.toSorted());
  for (const file of used) assert.ok(fs.statSync(path.join(directory.pathname, file)).isFile());
});
