import React from 'react';

export const Badge: React.FC = ({ children }) => {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium leading-4 bg-gray-200 text-gray-800">
      {children}
    </span>
  );
};
