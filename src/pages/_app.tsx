import { Analytics } from '@vercel/analytics/react';
import 'focus-visible';
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
    <>
      <div className={`${GeistSans.className} flex min-h-screen flex-col`}>
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
