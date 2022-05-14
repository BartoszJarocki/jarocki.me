import React from 'react';
import Image from 'next/image';

type Props = {
  name: string;
  picture: string;
};

export const Avatar: React.FC<Props> = ({ name, picture }) => {
  return (
    <div className="flex items-center">
      <Image src={picture} width="20" height="20" className="rounded-full" alt={name} />
      <div className="ml-2 text-sm">{name}</div>
    </div>
  );
};
