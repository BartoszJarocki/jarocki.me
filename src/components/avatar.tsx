import React from 'react';

type Props = {
  name: string;
  picture: string;
};

export const Avatar: React.FC<Props> = ({ name, picture }) => {
  return (
    <div className="flex items-center">
      <img src={picture} className="w-8 h-8 rounded-full mr-2" alt={name} />
      <div className="text-base text-gray-700">{name}</div>
    </div>
  );
};
