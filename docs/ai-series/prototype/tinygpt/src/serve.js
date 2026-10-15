// Serves the tinygpt directory on 127.0.0.1 and appends POSTed results to a file. Exits on /done.
import { createServer } from 'node:http';
import { readFile, appendFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';

const [root, port, outFile] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.txt': 'text/plain; charset=utf-8' };
createServer(async (req, res) => {
  if (req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    await appendFile(outFile, `${req.url} ${body}\n`);
    res.end('ok');
    if (req.url === '/done') process.exit(0);
    return;
  }
  const path = normalize(join(root, new URL(req.url, 'http://x').pathname));
  if (!path.startsWith(root)) return res.writeHead(403).end();
  let body;
  try {
    body = await readFile(path);
  } catch {
    return res.writeHead(404).end();
  }
  res.writeHead(200, { 'content-type': types[extname(path)] ?? 'application/octet-stream' }).end(body);
}).listen(Number(port), '127.0.0.1');
