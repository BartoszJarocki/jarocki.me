import React from 'react';
import { AppProps } from 'next/app';

import '../styles/index.css';

import { useAnalytics } from '../hooks/useAnalytics';

export default function App({ Component, pageProps }: AppProps) {
  useAnalytics();

  return <Component {...pageProps} />;
}
