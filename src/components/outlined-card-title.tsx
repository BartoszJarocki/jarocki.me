import React from 'react';

export const OutlinedCardTitle: React.FC = ({ children }) => {
  return (
    <h3 className="flex flex-col sm:flex-row flex-grow font-bold text-lg mb-1 text-left">
      {children}
    </h3>
  );
};
