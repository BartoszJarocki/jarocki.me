import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import React from 'react';

type Props = {
  seoTitle: string;
  seoDescription?: string;
  children: React.ReactNode;
};

export function PageShell({ seoTitle, seoDescription, children }: Props) {
  const router = useRouter();
  const path = router.asPath === '/' ? '' : router.asPath;
  const canonical = `${process.env.NEXT_PUBLIC_URL}${path}`;
  const ogImage = `${process.env.NEXT_PUBLIC_URL}/api/og?title=${encodeURIComponent(seoTitle)}&description=${encodeURIComponent(seoDescription ?? '')}`;

  return (
    <>
      <NextSeo
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        openGraph={{ images: [{ url: ogImage }] }}
      />
      <div className="mx-auto max-w-[40rem] px-6 pt-32 sm:px-12 sm:pt-40">{children}</div>
    </>
  );
}
