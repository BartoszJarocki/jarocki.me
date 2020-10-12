import React from 'react';
import { parseISO, format } from 'date-fns';
import { useRouter } from 'next/router';

import { Title } from './title';
import { Avatar } from './avatar';

import { Badge } from './badge';
import { Author } from '../lib/blog/blog-api';

type Props = {
  title: string;
  date: string;
  author: Author;
  readingTime: string;
  tags: Array<string>;
};

export const PostHeader: React.FC<Props> = ({ title, date, author, readingTime, tags }) => {
  const router = useRouter();

  return (
    <div className="">
      <div className="container mx-auto max-w-3xl flex flex-col flex-grow justify-center px-5 overflow-x-hidden">
        <div className="flex space-x-2 font-mono text-sm text-gray-800 flex-wrap">
          {tags.map((tag) => (
            <Badge
              key={tag}
              className="cursor-pointer"
              onClick={() => {
                router.push(`/tags/${tag}`);
              }}
            >
              #{tag}
            </Badge>
          ))}
        </div>
        <Title>{title}</Title>
        <div className="my-8 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:items-center mt-5">
          <Avatar name={author.name} picture={author.picture} />
          <div className="text-base text-gray-700">
            {format(parseISO(date), 'LLLL d, yyyy')} • {readingTime}
          </div>
        </div>
      </div>
    </div>
  );
};
