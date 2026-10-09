import { Analytics } from '@vercel/analytics/react';
import 'focus-visible';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { AppProps } from 'next/app';
import localFont from 'next/font/local';

import '../styles/index.css';
import '../styles/prism.css';

// geist/font/pixel declares all five pixel variants, and importing it preloads every one of them.
const GeistPixelSquare = localFont({
  src: '../../node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Square.woff2',
  variable: '--font-geist-pixel-square',
  weight: '500',
  adjustFontFallback: false,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <div
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} font-mono text-[14px] leading-[1.72]`}
      >
        <Component {...pageProps} />
      </div>
      <Analytics />
    </>
  );
}
