export const timeoutMs = 5000;
export const outputLimit = 200;

export const workerPrelude = `
const send = postMessage.bind(globalThis);
let lines = 0;
function show(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.name + ': ' + value.message;
  try { return JSON.stringify(value) ?? String(value); }
  catch { return String(value); }
}
function print(...values) {
  for (const text of values.map(show).join(' ').split('\\n')) {
    if (lines >= ${outputLimit - 1}) {
      send({ kind: 'limit' });
      throw new Error('Output limit reached');
    }
    lines++;
    send({ kind: 'line', text: text.slice(0, 2000) });
  }
}
console.log = print;
console.error = print;
onmessage = ({ data }) => {
  try { new Function(data)(); }
  catch (error) { if (lines < ${outputLimit - 1}) print(error); }
  send({ kind: 'done' });
};
`;

export type SnippetWorker = {
  listen(message: (data: unknown) => void, error: (message: string) => void): void;
  postMessage(source: string): void;
  terminate(): void;
};

export type RunUpdate = { kind: 'line'; text: string } | { kind: 'done' };

export function runSnippet(
  worker: SnippetWorker,
  source: string,
  report: (update: RunUpdate) => void,
) {
  let active = true;
  let lines = 0;
  const stop = () => {
    if (!active) return;
    active = false;
    clearTimeout(timer);
    worker.terminate();
  };
  const finish = (message?: string) => {
    if (!active) return;
    if (message) report({ kind: 'line', text: message });
    stop();
    report({ kind: 'done' });
  };
  const timer = setTimeout(() => finish('Stopped after 5 seconds.'), timeoutMs);
  worker.listen(
    (data) => {
      if (!active || data === null || typeof data !== 'object' || !('kind' in data)) return;
      if (data.kind === 'done') finish();
      else if (data.kind === 'limit') finish('Output stopped at 200 lines.');
      else if (data.kind === 'line' && 'text' in data && typeof data.text === 'string') {
        if (lines >= outputLimit - 1) finish('Output stopped at 200 lines.');
        else {
          lines++;
          report({ kind: 'line', text: data.text.slice(0, 2000) });
        }
      }
    },
    (message) => finish(`Error: ${message}`),
  );
  try {
    worker.postMessage(source);
  } catch (error) {
    finish(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
  return stop;
}
