import React from 'react';
import { AppProps } from 'next/app';
import { DefaultSeo } from 'next-seo';

import '../styles/index.css';

import { useAnalytics } from '../hooks/useAnalytics';
import { OpenGraph } from '../_data/social-media';
import { usePageLoadProgress } from '../hooks/usePageLoadProgress';

export default function App({ Component, pageProps }: AppProps) {
  useAnalytics();
  usePageLoadProgress();

  return (
    <>
      <DefaultSeo {...OpenGraph} />
      <Component {...pageProps} />
    </>
  );
}
