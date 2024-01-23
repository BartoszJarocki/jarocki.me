import { Analytics } from '@vercel/analytics/react';
import 'focus-visible';
import { ThemeProvider } from 'next-themes';
import { AppProps } from 'next/app';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import React, { useEffect, useRef } from 'react';

import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
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

  return (
    <>
      <ThemeProvider attribute="class">
        <div className={`${GeistSans.className}`}>
          <Header />
          <main className="before:fixed before:inset-0 before:ring-1 before:ring-zinc-100 before:bg-white dark:before:ring-zinc-300/20 dark:before:bg-zinc-900 before:w-full sm:before:w-[min(100%-4rem,76rem)] before:mx-auto">
            <Component previousPathname={previousPathname} {...pageProps} />
          </main>
          <Footer />

          <Analytics />
        </div>
      </ThemeProvider>
    </>
  );
}
