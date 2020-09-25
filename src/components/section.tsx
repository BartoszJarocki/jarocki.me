import React from 'react';
import Link from 'next/link';

type Props = {
  title: string;
  hasMore?: boolean;
  link?: string;
};

export const Section: React.FC<Props> = ({ title, hasMore, link, children }) => {
  return (
    <section>
      <div className="flex flex-row justify-between items-center mt-12 ">
        <h2 className="text-4xl font-bold tracking-tight leading-tight">{title}</h2>
        {hasMore && (
          <Link href={link!}>
            <button className="bg-white hover:bg-gray-100 border border-gray-400 rounded duration-200 ease-in-out py-2 px-4 cursor-pointer">
              Show all
            </button>
          </Link>
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
};
