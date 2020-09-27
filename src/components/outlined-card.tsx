import React from 'react';

export const OutlinedCard: React.FC = ({ children }) => {
  return (
    <div className="bg-white hover:bg-gray-100 border border-gray-400 rounded duration-200 ease-in-out mt-4 w-full lg:flex cursor-pointer">
      <div className="p-4 flex flex-col flex-grow justify-between leading-normal">{children}</div>
    </div>
  );
};
