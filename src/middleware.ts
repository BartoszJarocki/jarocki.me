import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/rss.xml' || pathname === '/llms.txt') {
    return NextResponse.rewrite(new URL(`/api${pathname}`, request.url));
  }
  const markdown =
    pathname.endsWith('.md') || /text\/markdown/i.test(request.headers.get('accept') ?? '');
  const route = `/api/${markdown ? 'markdown' : 'text'}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(new URL(route, request.url));
}

// Next's client tests these paths without their header conditions, so a browser prefetches /work
// and /about here and gets back an empty x-middleware-skip response. A next.config.mjs rewrite
// avoids that, but its client-side route matching adds 2.4 kB of brotli to every page. Next
// analyzes this config at build time, so it has to stay a literal.
export const config = {
  matcher: [
    '/rss.xml',
    '/llms.txt',
    '/:page(index|notes|work|about).md',
    '/notes/:slug.md',
    {
      source: '/:page(notes|work|about)?',
      has: [{ type: 'header', key: 'user-agent', value: '(?:curl|HTTPie|xh)/.*' }],
    },
    {
      source: '/notes/:slug',
      has: [{ type: 'header', key: 'user-agent', value: '(?:curl|HTTPie|xh)/.*' }],
    },
    {
      source: '/:page(notes|work|about)?',
      has: [{ type: 'header', key: 'accept', value: '.*text/markdown.*' }],
    },
    {
      source: '/notes/:slug',
      has: [{ type: 'header', key: 'accept', value: '.*text/markdown.*' }],
    },
  ],
};
