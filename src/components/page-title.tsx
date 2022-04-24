import React from 'react';

export const PageTitle: React.FC = ({ children }) => {
  return <h1 className="text-4xl sm:text-6xl font-extrabold leading-none">{children}</h1>;
};
