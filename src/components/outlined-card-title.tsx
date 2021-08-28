import React from 'react';

export const OutlinedCardTitle: React.FC = ({ children }) => {
  return (
    <h3 className="flex flex-col sm:flex-row flex-grow text-gray-900 font-bold text-lg sm:text-xl mb-2 text-left">
      {children}
    </h3>
  );
};
