import React from 'react';
import { parseISO, format } from 'date-fns';

import { Title } from './title';
import { Avatar } from './avatar';

import { Author } from '../types/author';

type Props = {
  title: string;
  date: string;
  author: Author;
  readingTime: string;
};

export const PostHeader: React.FC<Props> = ({ title, date, author, readingTime }) => {
  return (
    <div className="top-background">
      <div className="container mx-auto max-w-3xl flex flex-col flex-grow justify-center px-5 overflow-x-hidden">
        <div className="mt-20">
          <Title>{title}</Title>
        </div>
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
