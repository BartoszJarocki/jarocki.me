import Image from 'next/image';
import React from 'react';

import { PageShell } from '../components/PageShell';
import { AboutExtended } from '../data/bio';
import { Books } from '../data/books';
import { travelImages } from '../images/travel';

const seoTitle = 'About';
const seoDescription = 'A few words about me.';

export default function About() {
  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription}>
      <h1 className="text-base font-medium text-ink">About</h1>
      <p className="mt-3 text-base text-body">{AboutExtended}</p>

      <section className="mt-16">
        <h2 className="ds-section-label">Reading</h2>
        <p className="mt-4 text-base text-body">
          Books I keep returning to:{' '}
          {Books.map((book, i) => (
            <React.Fragment key={book.name}>
              {i > 0 && ', '}
              <a
                href={book.link}
                target="_blank"
                rel="noopener noreferrer"
                className="ds-link italic"
              >
                {book.name}
              </a>
            </React.Fragment>
          ))}
          , and various crime stories.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="ds-section-label">Life snapshots</h2>
        <div className="mt-4 flex flex-wrap gap-1">
          {travelImages.map((photo) => (
            <div
              key={photo.img.src}
              className="relative h-16 w-16 overflow-hidden bg-code-bg"
            >
              <Image
                src={photo.img}
                alt={photo.alt}
                fill
                className="object-cover opacity-90 transition-opacity duration-150 hover:opacity-100"
                sizes="64px"
                placeholder="blur"
              />
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
