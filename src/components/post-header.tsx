import React from 'react';
import { parseISO, format } from 'date-fns';
import { useRouter } from 'next/router';

import { PageTitle } from './page-title';
import { Avatar } from './avatar';

import { Badge } from './badge';

type Props = {
  title: string;
  date: string;
  author: { name: string; picture: string };
  readingTime: string;
  tags: Array<string>;
};

export const PostHeader: React.FC<Props> = ({ title, date, author, readingTime, tags }) => {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl px-6 sm:px-0 flex flex-col flex-grow justify-center overflow-x-hidden">
      <div className="flex font-mono text-sm text-gray-800 flex-wrap gap-1 mb-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            className="cursor-pointer duration-200 ease-in-out hover:bg-gray-200"
            onClick={() => {
              router.push(`/tags/${tag}`);
            }}
          >
            #{tag}
          </Badge>
        ))}
      </div>
      <PageTitle>{title}</PageTitle>
      <div className="mt-6 my-10 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:items-center text-gray-700 dark:text-gray-300">
        <Avatar name={author.name} picture={author.picture} />
        <div className="text-sm">
          {format(parseISO(date), 'LLLL d, yyyy')} • {readingTime}
        </div>
      </div>
    </div>
  );
};
