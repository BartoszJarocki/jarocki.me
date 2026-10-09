import Image from 'next/image';
import React, { useState } from 'react';

import { IndexList, IndexRow, IndexSection, Lede } from '../components/Index';
import { PageShell } from '../components/PageShell';
import { AboutExtended } from '../data/bio';
import { Books } from '../data/books';
import { travelImages } from '../images/travel';

const seoTitle = 'About';
const seoDescription = 'A few words about me.';

function Snapshots() {
  const [caption, setCaption] = useState<string | null>(null);

  return (
    <>
      <div className="flex max-w-[calc(10*68px)] flex-wrap gap-1">
        {travelImages.map((photo) => (
          <Image
            key={photo.img.src}
            src={photo.img}
            alt={photo.alt}
            width={64}
            height={64}
            sizes="64px"
            placeholder="blur"
            className="h-16 w-16 object-cover opacity-90 contrast-[1.05] grayscale transition-[filter,opacity] duration-200 hover:opacity-100 hover:contrast-100 hover:grayscale-0"
            onMouseEnter={() => setCaption(photo.title)}
            onMouseLeave={() => setCaption(null)}
          />
        ))}
      </div>
      <p className="mt-2 text-faint">{caption ?? `${travelImages.length} photos`}</p>
    </>
  );
}

export default function About() {
  return (
    <PageShell seoTitle={seoTitle} seoDescription={seoDescription} current="about">
      <Lede>
        <p className="text-body">{AboutExtended}</p>
      </Lede>

      <IndexSection label="reading">
        <IndexList lead="27ch" leadMobile="minmax(0,1.3fr)">
          {Books.map((book) => (
            <IndexRow
              key={book.name}
              href={book.link}
              external
              lead={book.name}
              leadTone="ink"
              main={book.author}
              mainTone="faint"
            />
          ))}
        </IndexList>
        <p className="mt-5">And various crime stories.</p>
      </IndexSection>

      <IndexSection label="snapshots">
        <Snapshots />
      </IndexSection>
    </PageShell>
  );
}
