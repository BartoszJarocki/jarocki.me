import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Worker } from 'node:worker_threads';

import { type SnippetWorker, runSnippet, workerPrelude } from './snippetRunner.ts';

function start(source: string) {
  const thread = new Worker(
    `
    const { parentPort } = require('node:worker_threads');
    globalThis.postMessage = data => parentPort.postMessage(data);
    ${workerPrelude}
    parentPort.on('message', data => globalThis.onmessage({ data }));
  `,
    { eval: true },
  );
  const exited = new Promise<number>((resolve) => thread.once('exit', resolve));
  const worker: SnippetWorker = {
    listen(message, error) {
      thread.on('message', message);
      thread.on('error', (event) => error(event.message));
    },
    postMessage: (source) => thread.postMessage(source),
    terminate: () => {
      void thread.terminate();
    },
  };
  const lines: string[] = [];
  let cancel = () => {};
  const done = new Promise<string[]>((resolve) => {
    cancel = runSnippet(worker, source, (update) => {
      if (update.kind === 'line') lines.push(update.text);
      else resolve(lines);
    });
  });
  return { done, cancel, exited, lines };
}

test('snippet worker captures logs, errors, objects, and multiline output', async () => {
  const run = start(`console.log('hello', 3, { a: 1 }); console.error('bad\\nline');
    console.log(undefined, 1n); const cycle = {}; cycle.self = cycle; console.log(cycle);`);
  assert.deepEqual(await run.done, [
    'hello 3 {"a":1}',
    'bad',
    'line',
    'undefined 1',
    '[object Object]',
  ]);
  await run.exited;
});

test('snippet worker reports runtime and syntax errors', async () => {
  for (const [source, expected] of [
    ['throw new Error("broken")', 'Error: broken'],
    ['const = 1', "SyntaxError: Unexpected token '='"],
  ]) {
    const run = start(source);
    assert.deepEqual(await run.done, [expected]);
    await run.exited;
  }
});

test('snippet worker caps output at 200 lines, including its notice', async () => {
  const run = start('for (let i = 0; i < 10000; i++) console.log(i + "\\nmore");');
  const lines = await run.done;
  assert.equal(lines.length, 200);
  assert.deepEqual(lines.slice(0, 3), ['0', 'more', '1']);
  assert.equal(lines[199], 'Output stopped at 200 lines.');
  await run.exited;
});

test(
  'snippet runner terminates an infinite loop after five seconds',
  { timeout: 8000 },
  async () => {
    const before = Date.now();
    const run = start('while (true) {}');
    assert.deepEqual(await run.done, ['Stopped after 5 seconds.']);
    assert.ok(Date.now() - before >= 4900);
    assert.ok(Date.now() - before < 7500);
    await run.exited;
  },
);

test('snippet runner cancellation terminates the worker without later updates', async () => {
  const run = start('while (true) {}');
  run.cancel();
  await run.exited;
  assert.deepEqual(run.lines, []);
});

test('snippet runner ignores malformed messages and bounds messages sent directly', async () => {
  const run = start(`postMessage(null); postMessage({ kind: 'line', text: 3 });
    postMessage({ kind: 'unknown' });
    for (let i = 0; i < 250; i++) postMessage({ kind: 'line', text: 'x'.repeat(3000) });`);
  const lines = await run.done;
  assert.equal(lines.length, 200);
  assert.equal(lines[0], 'x'.repeat(2000));
  assert.equal(lines[199], 'Output stopped at 200 lines.');
  await run.exited;
});
