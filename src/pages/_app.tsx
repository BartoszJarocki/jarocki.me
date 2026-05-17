import { Analytics } from '@vercel/analytics/react';
import 'focus-visible';
import { ThemeProvider } from 'next-themes';
import { AppProps } from 'next/app';
import { GeistSans } from 'geist/font/sans';
import React, { useEffect, useRef } from 'react';

import { SiteNav } from '../components/SiteNav';
import '../styles/index.css';
import '../styles/prism.css';

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
    <ThemeProvider attribute="class" forcedTheme="dark">
      <style jsx global>{`
        html,
        body {
          background-color: oklch(8% 0.005 60);
          color: oklch(92% 0.004 60);
        }
        ::selection {
          background: oklch(92% 0.004 60);
          color: oklch(8% 0.005 60);
        }
      `}</style>
      <div className={`${GeistSans.className} flex min-h-screen flex-col`}>
        <div className="flex-1">
          <Component previousPathname={previousPathname} {...pageProps} />
        </div>
        {!isHome && (
          <SiteNav className="mx-auto w-full max-w-[40rem] px-6 pb-16 pt-24 sm:px-12" />
        )}
      </div>
      <Analytics />
    </ThemeProvider>
  );
}
