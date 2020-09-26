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

const background = {
  background: `linear-gradient(0deg, rgba(255,255,255,1) 10%, rgba(255,255,255,0) 85%), url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8 16c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm33.414-6l5.95-5.95L45.95.636 40 6.586 34.05.636 32.636 2.05 38.586 8l-5.95 5.95 1.414 1.414L40 9.414l5.95 5.95 1.414-1.414L41.414 8zM40 48c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm0-2c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM9.414 40l5.95-5.95-1.414-1.414L8 38.586l-5.95-5.95L.636 34.05 6.586 40l-5.95 5.95 1.414 1.414L8 41.414l5.95 5.95 1.414-1.414L9.414 40z' fill='%23bdbdbd' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
};

export const PostHeader: React.FC<Props> = ({ title, date, author, readingTime }) => {
  return (
    <div style={background}>
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
