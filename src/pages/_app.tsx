import React from 'react';
import { AppProps, Container } from 'next/app';
import { DefaultSeo } from 'next-seo';

import '../styles/index.css';

import { useAnalytics } from '../hooks/useAnalytics';
import { OpenGraph } from '../_data/social-media';

export default function App({ Component, pageProps }: AppProps) {
  useAnalytics();

  return (
    <Container>
      <DefaultSeo {...OpenGraph} />
      <Component {...pageProps} />
    </Container>
  );
}
