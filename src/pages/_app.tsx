import { Analytics } from '@vercel/analytics/react';
import 'focus-visible';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { AppProps } from 'next/app';
import localFont from 'next/font/local';
import React, { useEffect, useRef } from 'react';

import { SiteNav } from '../components/SiteNav';
import '../styles/index.css';
import '../styles/prism.css';

// geist/font/pixel declares all five pixel variants, and importing it preloads every one of them.
const GeistPixelSquare = localFont({
  src: '../../node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Square.woff2',
  variable: '--font-geist-pixel-square',
  weight: '500',
  adjustFontFallback: false,
});

function usePrevious(value: string) {
  let ref = useRef<string>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export default function App({ Component, pageProps, router }: AppProps) {
  let previousPathname = usePrevious(router.pathname);
  const isHome = router.pathname === '/';

  return (
    <>
      <div
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} flex min-h-screen flex-col font-mono text-[14px] leading-[1.72]`}
      >
        <div className="flex-1">
          <Component previousPathname={previousPathname} {...pageProps} />
        </div>
        {!isHome && (
          <SiteNav className="mx-auto w-full max-w-[40rem] px-6 pb-16 pt-24 sm:px-12" />
        )}
      </div>
      <Analytics />
    </>
  );
}
