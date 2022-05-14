import React from 'react';

export const PageTitle: React.FC = ({ children }) => {
  return <h1 className="text-4xl font-bold leading-none tracking-tight">{children}</h1>;
};
