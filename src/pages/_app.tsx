import React from 'react';
import { AppProps } from 'next/app';
import { DefaultSeo } from 'next-seo';

import '../styles/index.css';

import { useAnalytics } from '../hooks/useAnalytics';
import { OpenGraph } from '../_data/social-media';

export default function App({ Component, pageProps }: AppProps) {
  useAnalytics();

  return (
    <>
      <DefaultSeo {...OpenGraph} />
      <Component {...pageProps} />
    </>
  );
}
