import { DocumentProps, Head, Html, Main, NextScript } from 'next/document';

import { Name, SiteUrl } from '../data/bio';

export default function Document({
  __NEXT_DATA__,
  dangerousAsPath,
  nextFontManifest,
}: DocumentProps) {
  // Next preloads a page's own fonts by looking up the request path, so a dynamic route such as
  // /notes/[slug] never finds them. Fonts imported in _app are preloaded on every page either way.
  const fonts = nextFontManifest?.pages;
  const missedFonts = (fonts && !fonts[dangerousAsPath] && fonts[__NEXT_DATA__.page]) || [];

  return (
    <Html className="antialiased" lang="en">
      <Head>
        {missedFonts.map((file) => (
          <link
            key={file}
            rel="preload"
            href={`/_next/${file}`}
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        ))}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="alternate" type="application/rss+xml" title={Name} href={`${SiteUrl}/rss.xml`} />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fafaf8" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0d0c0a" />
      </Head>
      <body className="bg-bg text-body">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
