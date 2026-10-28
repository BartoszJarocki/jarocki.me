import { NextApiHandler } from 'next';

import { renderMarkdown } from '../../../lib/markdownPage';
import { getNotes } from '../../../lib/notes';
import { pageBlocks, parseRequest } from '../../../lib/pageRequest';

const markdown: NextApiHandler = async (req, res) => {
  const notes = getNotes();
  const route = parseRequest(req.url ?? '/', notes);
  const body = renderMarkdown(await pageBlocks(route, notes));

  res.status(route.page === 'missing' ? 404 : 200);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Vary', 'Accept');
  res.send(body);
};

export default markdown;
