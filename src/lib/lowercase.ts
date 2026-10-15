import { Name } from '../data/bio';

const keepCase = [Name].filter(Boolean);

export function caseRuns(text: string) {
  const spans: [number, number][] = [];
  for (const entry of keepCase) {
    for (let at = text.indexOf(entry); at !== -1; at = text.indexOf(entry, at + 1)) {
      spans.push([at, at + entry.length]);
    }
  }
  spans.sort((a, b) => a[0] - b[0]);

  const kept: [number, number][] = [];
  for (const [start, end] of spans) {
    const last = kept[kept.length - 1];
    if (last && start < last[1]) last[1] = Math.max(last[1], end);
    else kept.push([start, end]);
  }

  const runs: { text: string; keep: boolean }[] = [];
  let cursor = 0;
  for (const [start, end] of kept) {
    runs.push({ text: text.slice(cursor, start), keep: false });
    runs.push({ text: text.slice(start, end), keep: true });
    cursor = end;
  }
  runs.push({ text: text.slice(cursor), keep: false });
  return runs;
}

export function lowercase(text: string) {
  return caseRuns(text)
    .map((run) => (run.keep ? run.text : run.text.toLowerCase()))
    .join('');
}
