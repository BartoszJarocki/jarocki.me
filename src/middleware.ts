import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.rewrite(new URL('/api/rss.xml', request.url));
}

// A next.config.mjs rewrite would work too, but it adds about 4 kB of client-side route matching
// to every page.
export const config = { matcher: '/rss.xml' };
