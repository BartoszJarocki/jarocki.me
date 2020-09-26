import React from 'react';
import Head from 'next/head';

type Props = {
  title?: string;
  description?: string;
  ogImageUrl?: string;
};

export const Meta: React.FC<Props> = ({
  title = 'Bartosz Jarocki - personal site',
  description = 'My personal piece of internet. I write about React, Android and everything else that I found interesting.',
  ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/og?title=${title}`,
}) => {
  return (
    <Head>
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <meta name="theme-color" content="#6B46C1" />
    </Head>
  );
};
