import React from 'react';
import Link from 'next/link';
import { Button } from './button';

type Props = {
  title: string;
  hasMore?: boolean;
  link?: string;
};

export const Section: React.FC<Props> = ({ title, hasMore, link, children }) => {
  return (
    <section>
      <div className="flex flex-row justify-between items-center mt-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{title}</h2>
        {hasMore && (
          <Link href={link!}>
            <Button>Show all</Button>
          </Link>
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
};
