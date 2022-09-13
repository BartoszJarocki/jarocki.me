import React from 'react';
import { AppProps } from 'next/app';
import { DefaultSeo } from 'next-seo';
import { ThemeProvider } from 'next-themes';

import '../styles/index.css';

import { OpenGraph } from '../data/social-media';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <DefaultSeo {...OpenGraph} />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
