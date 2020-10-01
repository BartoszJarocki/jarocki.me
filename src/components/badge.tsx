import React from 'react';

export const Badge: React.FC = ({ children }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium leading-4 bg-gray-100 text-gray-500">
      {children}
    </span>
  );
};
