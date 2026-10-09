import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html className="antialiased" lang="en">
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
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
