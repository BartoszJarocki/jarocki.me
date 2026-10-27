import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/rss.xml') {
    return NextResponse.rewrite(new URL('/api/rss.xml', request.url));
  }
  const text = new URL(pathname === '/' ? '/api/text' : `/api/text${pathname}`, request.url);
  return NextResponse.rewrite(text);
}

// Next's client tests these paths without the user-agent condition, so a browser prefetches /work
// and /about here and gets back an empty x-middleware-skip response. A next.config.mjs rewrite
// avoids that, but its client-side route matching adds 2.4 kB of brotli to every page. Next
// analyzes this config at build time, so it has to stay a literal.
export const config = {
  matcher: [
    '/rss.xml',
    {
      source: '/:page(notes|work|about)?',
      has: [{ type: 'header', key: 'user-agent', value: '(?:curl|HTTPie|xh)/.*' }],
    },
    {
      source: '/notes/:slug',
      has: [{ type: 'header', key: 'user-agent', value: '(?:curl|HTTPie|xh)/.*' }],
    },
  ],
};
