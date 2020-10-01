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
      <div className="flex flex-row justify-between items-center mt-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{title}</h2>
        {hasMore && (
          <Link href={link!}>
            <button className="flex flex-row justify-center items-center px-4 py-2 font-medium text-sm leading-5 rounded-md text-gray-500 hover:text-gray-700 hover:outline-none hover:text-gray-700 bg-gray-100 hover:bg-gray-300 cursor-pointer">
              Show all
            </button>
          </Link>
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
};
