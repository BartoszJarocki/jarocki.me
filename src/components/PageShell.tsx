import { NextSeo } from 'next-seo';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

import { Name, SiteUrl } from '../data/bio';
import { lowercase } from '../lib/lowercase';
import { Cased } from './Cased';
import { JsonLd } from './JsonLd';

const sections = ['notes', 'work', 'about'] as const;

type Section = (typeof sections)[number];

type Props = {
  seoTitle?: string;
  seoDescription?: string;
  article?: { publishedTime: string; tags: string[] };
  current?: Section;
  noindex?: boolean;
  children: React.ReactNode;
};

export function PageShell({
  seoTitle,
  seoDescription,
  article,
  current,
  noindex,
  children,
}: Props) {
  const router = useRouter();
  // On Vercel, a regeneration renders the home page with asPath /index.
  const path = router.pathname === '/' ? '' : router.asPath.split(/[?#]/)[0];
  const canonical = `${process.env.NEXT_PUBLIC_URL}${path}`;
  const title = seoTitle ?? Name;
  const metaTitle = seoTitle && lowercase(seoTitle);
  const metaDescription = seoDescription && lowercase(seoDescription);
  const ogImage = `${process.env.NEXT_PUBLIC_URL}/api/og?${new URLSearchParams({
    title: metaTitle ?? '',
    description: metaDescription ?? '',
  })}`;

  return (
    <>
      <NextSeo
        title={metaTitle}
        description={metaDescription}
        canonical={noindex ? undefined : canonical}
        noindex={noindex}
        openGraph={{
          title: lowercase(title),
          type: article ? 'article' : undefined,
          article,
          images: [{ url: ogImage, width: 1200, height: 630, alt: lowercase(title) }],
        }}
      />
      {article && (
        <JsonLd
          data={{
            '@type': 'BlogPosting',
            headline: title,
            description: seoDescription,
            datePublished: article.publishedTime,
            author: { '@type': 'Person', name: Name, url: SiteUrl },
            image: ogImage,
            mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
          }}
        />
      )}
      <div className="px-[clamp(20px,9vw,160px)] pb-40 pt-[clamp(48px,11vh,112px)]">
        <div className="relative mx-auto max-w-[80ch]">
          <a
            href="#main"
            className="sr-only text-ink focus:not-sr-only focus:absolute focus:bottom-full focus:left-0 focus:mb-3"
          >
            skip to content
          </a>
          <header className="flex flex-wrap items-baseline justify-between gap-x-[3ch] gap-y-3">
            <Link href="/" className="font-pixel text-[28px] leading-none text-ink">
              <Cased>{Name}</Cased>
            </Link>
            <nav className="plate flex gap-[2.5ch]">
              {sections.map((section) => (
                <Link
                  key={section}
                  href={`/${section}`}
                  aria-current={section === current ? 'page' : undefined}
                  className="faint-link aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-1 aria-[current=page]:underline-offset-[5px]"
                >
                  {section}
                </Link>
              ))}
            </nav>
          </header>
          <main id="main" tabIndex={-1} className="focus:outline-none">
            {!article && (
              <h1 className="sr-only">
                <Cased>{title}</Cased>
              </h1>
            )}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
