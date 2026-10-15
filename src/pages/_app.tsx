import { Analytics } from '@vercel/analytics/react';
import { DefaultSeo } from 'next-seo';
import { AppProps } from 'next/app';
import localFont from 'next/font/local';

import { EmbeddingsBackdrop } from '../components/EmbeddingsBackdrop';
import { Name } from '../data/bio';
import { XUser } from '../data/links';
import '../styles/index.css';

const GeistMono = localFont({
  src: '../fonts/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  adjustFontFallback: false,
  fallback: [
    'ui-monospace',
    'SFMono-Regular',
    'Roboto Mono',
    'Menlo',
    'Monaco',
    'Liberation Mono',
    'DejaVu Sans Mono',
    'Courier New',
    'monospace',
  ],
});

const GeistPixelSquare = localFont({
  src: '../fonts/GeistPixel-Square.woff2',
  variable: '--font-geist-pixel-square',
  weight: '500',
  adjustFontFallback: false,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <DefaultSeo
        titleTemplate={`%s · ${Name}`}
        defaultTitle={Name}
        openGraph={{ type: 'website', siteName: Name, locale: 'en_US' }}
        twitter={{ cardType: 'summary_large_image', handle: `@${XUser}`, site: `@${XUser}` }}
      />
      <div
        className={`relative ${GeistMono.variable} ${GeistPixelSquare.variable} font-mono text-[14px] leading-[1.72]`}
      >
        {/* clips the 460px stage to the page, or to the screen when the page is shorter, so the
            stage never makes a page scroll */}
        <div className="pointer-events-none absolute inset-0 min-h-svh overflow-hidden">
          <EmbeddingsBackdrop />
        </div>
        <Component {...pageProps} />
      </div>
      <Analytics />
    </>
  );
}
