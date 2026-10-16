import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const directory = process.argv[2] ?? '.next/server/pages/notes';
const report = [];
for (const file of (await fs.readdir(directory)).sort()) {
  if (!file.endsWith('.html')) continue;
  const html = await fs.readFile(path.join(directory, file), 'utf8');
  const [, json] = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  const data = JSON.parse(json);
  // Match Next's warning: JSON bytes before HTML escaping, including the page envelope.
  const bytes = Buffer.byteLength(JSON.stringify(data));
  const source = data.props.pageProps.noteContent.compiledSource;
  report.push({
    slug: file.slice(0, -5),
    bytes,
    compiledBytes: Buffer.byteLength(source),
    inlineStyles: (source.match(/color:/g) ?? []).length,
    rawSourceCopies: (source.match(/data-source/g) ?? []).length,
  });
  if (process.argv.includes('--check')) {
    assert.ok(bytes < 112_000, `${file}: ${bytes} bytes leaves too little room below 128 kB`);
  }
}
console.log(JSON.stringify(report, null, 2));
